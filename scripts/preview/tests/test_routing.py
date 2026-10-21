import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import zipfile

SPEC = importlib.util.spec_from_file_location("route_preview", Path(__file__).parents[1] / "route_preview.py")
routing = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(routing)
URL = "https://unidentifiedsheep-fix-producer-storage-actions-menu-stand-4ff9.twc1.net"
URL2 = "https://preview-42.another-platform.example"
BODY = (
    "| Превью | Коммит | Статус | Обновлено (UTC) | Стенд |\n"
    "| --- | --- | --- | --- | --- |\n"
    "| [Посмотреть](" + URL + ") | [`402ac35`](https://github.com/UnidentifiedSheep/"
    "ECommerceSparePartsFront/commit/402ac3544e859d2e87fe2995fcf58649cd800ade) | "
    "🟢 Успешно | 2026-10-20 20:27 | [Открыть](https://timeweb.cloud/my/apps/201903/stands/6603) |"
)


def comment(body=BODY, **values):
    return {
        "id": 6300702071, "issue_url": f"https://api.github.com/repos/{routing.REPOSITORY}/issues/42",
        "user": {"login": routing.BOT_LOGIN, "id": routing.BOT_ID, "type": "Bot"},
        "performed_via_github_app": {"id": routing.GITHUB_APP_ID, "slug": "timeweb-cloud-apps"},
        "updated_at": "2026-10-20T20:27:18Z", "body": body, **values,
    }


def pull(state="open"):
    return {"number": 42, "state": state, "base": {"repo": {"full_name": routing.REPOSITORY}},
            "closed_at": "2026-10-20T20:55:00Z" if state == "closed" else None}


class RoutingTests(unittest.TestCase):
    def test_observed_successful_timeweb_comment(self):
        self.assertEqual(routing.preview_url(BODY), URL)

    def test_ready_preview_does_not_depend_on_domain_or_prefix(self):
        for value in [URL2, "https://different-prefix.twc2.net", "https://nested.preview.example.org",
                      "https://preview.xn--p1ai", "https://" + ("a" * 63 + ".") * 3 + "b" * 61]:
            with self.subTest(value=value):
                self.assertEqual(routing.preview_url(BODY.replace(URL, value)), value)
        for value in [URL.upper(), URL + "/", URL + ":443"]:
            with self.subTest(value=value):
                self.assertEqual(routing.valid_upstream(value), URL)

    def test_other_comment_states_do_not_publish(self):
        for body in ["hello " + URL, BODY.replace("🟢 Успешно", "🟡 Деплой"),
                     BODY.replace("🟢 Успешно", "⚫ Удалён"), BODY.replace("/201903/", "/999999/")]:
            with self.subTest(body=body):
                self.assertIsNone(routing.preview_url(body))

    def test_ready_row_with_unsafe_url_fails_closed(self):
        for value in ["http://localhost", URL + "/path", URL + ":8443", URL + "#fragment", URL + "?x=1",
                      "https://user:pass@" + URL[8:], "https://127.0.0.1", "https://[::1]", "https://localhost",
                      "https://2130706433", "https://0x7f000001", "https://127.1", "https://main-api",
                      "https://unidentifiedsheep-evil-stand-abcd.twc1.net@localhost",
                      "https://-preview.example.org", "https://preview-.example.org", "https://preview..example.org",
                      URL + ".", "https://" + "a" * 64 + ".net",
                      "https://" + ("a" * 63 + ".") * 3 + "b" * 62,
                      "https://preview.example.org\\@localhost", "https://preview.example.org;id",
                      "https://preview.exämple.org"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                routing.preview_url(BODY.replace(URL, value))

    def test_all_identity_fields_are_required(self):
        self.assertTrue(routing.trusted_comment(comment()))
        for field, changes in [
            ("user", {"login": "fake[bot]"}), ("user", {"id": 123}),
            ("user", {"type": "User"}), ("performed_via_github_app", {"id": 1}),
            ("performed_via_github_app", {"slug": "fake"}),
        ]:
            item = comment()
            item[field].update(changes)
            self.assertFalse(routing.trusted_comment(item))

    def test_current_comment_updates_existing_route(self):
        api = routing.GitHub("dummy")
        current = comment(body=BODY.replace(URL, URL2))
        with patch.object(api, "get", side_effect=[pull(), comment(), [current], pull()]):
            command = api.reconcile({"pr": 42, "event": "issue_comment", "comment_id": 6300702071}, 123)
        self.assertEqual(command[:3], ["deploy", "42", URL2])

    def test_untrusted_author_cannot_publish_even_a_valid_ready_row(self):
        api = routing.GitHub("dummy")
        for field, change in [("user", {"id": 123}), ("performed_via_github_app", {"id": 1})]:
            item = comment(body=BODY.replace(URL, URL2))
            item[field].update(change)
            with self.subTest(field=field), patch.object(api, "get", side_effect=[pull(), item]) as get:
                self.assertIsNone(api.reconcile({"pr": 42, "event": "issue_comment", "comment_id": 1}, 123))
                self.assertEqual(get.call_count, 2)

    def test_newer_untrusted_comment_cannot_replace_timeweb_upstream(self):
        api = routing.GitHub("dummy")
        item = comment(body=BODY.replace(URL, URL2), updated_at="2026-10-20T20:54:52Z", id=6301271816)
        item["user"]["id"] = 123
        with patch.object(api, "get", side_effect=[pull(), comment(), [comment(), item], pull()]):
            command = api.reconcile({"pr": 42, "event": "issue_comment", "comment_id": 1}, 123)
        self.assertEqual(command[:3], ["deploy", "42", URL])

    def test_closed_pr_deletes_even_for_late_comment(self):
        api = routing.GitHub("dummy")
        with patch.object(api, "get", return_value=pull("closed")):
            self.assertEqual(api.reconcile({"pr": 42, "event": "issue_comment"}, 123)[:2], ["delete", "42"])

    def test_close_event_never_deploys_open_pr(self):
        api = routing.GitHub("dummy")
        with patch.object(api, "get", return_value=pull()):
            self.assertIsNone(api.reconcile({"pr": 42, "event": "pull_request"}, 123))

    def test_close_racing_comment_read_deletes(self):
        api = routing.GitHub("dummy")
        with patch.object(api, "get", side_effect=[pull(), comment(), [comment()], pull("closed")]):
            self.assertEqual(api.reconcile({"pr": 42, "event": "issue_comment", "comment_id": 1}, 123)[:2],
                             ["delete", "42"])

    def test_comment_cannot_claim_another_pr_number(self):
        api = routing.GitHub("dummy")
        with patch.object(api, "get", side_effect=[pull(), comment(issue_url="https://api.github.com/wrong/43")]):
            self.assertIsNone(api.reconcile({"pr": 42, "event": "issue_comment", "comment_id": 1}, 123))

    def test_most_recent_deploying_comment_does_not_republish_old_url(self):
        api = routing.GitHub("dummy")
        pending = comment(body=BODY.replace("🟢 Успешно", "🟡 Деплой"),
                          updated_at="2026-10-20T20:54:52Z", id=6301271816)
        with patch.object(api, "get", side_effect=[pull(), comment(), [comment(), pending]]):
            self.assertIsNone(api.reconcile({"pr": 42, "event": "issue_comment", "comment_id": 1}, 123))

    def test_ambiguous_urls_rejected(self):
        with self.assertRaises(ValueError):
            routing.preview_url(BODY + "\n" + BODY.splitlines()[-1].replace("4ff9", "abcd"))

    def test_source_artifact_validated_and_never_extracted(self):
        api = routing.GitHub("dummy")
        run = {"id": 12, "repository": {"full_name": routing.REPOSITORY}, "conclusion": "success",
               "event": "issue_comment", "run_attempt": 1}
        actual = {"path": routing.EVENT_WORKFLOW, "event": "issue_comment", "run_attempt": 1}
        record = {"version": 1, "event": "issue_comment", "action": "created", "pr": 42, "comment_id": 6300702071}
        for filename, accepted in [("event.json", True), ("../event.json", False), ("scripts/execute.py", False)]:
            stream = io.BytesIO()
            with zipfile.ZipFile(stream, "w") as archive:
                archive.writestr(filename, json.dumps(record))
            artifacts = {"artifacts": [{"id": 1, "name": routing.ARTIFACT, "expired": False, "size_in_bytes": 500}]}
            with self.subTest(filename=filename), patch.object(api, "get", side_effect=[actual, artifacts]), patch.object(
                    api, "request", return_value=stream.getvalue()):
                if accepted:
                    self.assertEqual(api.record(run)["pr"], 42)
                else:
                    with self.assertRaises(ValueError):
                        api.record(run)

    def test_shell_strings_never_come_from_comments(self):
        with self.assertRaises(ValueError):
            routing.positive_integer("42;id")
        with patch.dict(routing.os.environ, {
            "PREVIEW_SSH_HOST": "server.example", "PREVIEW_SSH_PORT": "22",
            "PREVIEW_SSH_KEY": "fake private key", "PREVIEW_SSH_KNOWN_HOSTS": "pinned-host-key",
        }), patch.object(routing.subprocess, "run") as run:
            run.return_value.returncode = 0
            routing.ssh_apply(["deploy", "42", URL, "1000.1"])
            args = run.call_args.args[0]
            self.assertIn("StrictHostKeyChecking=yes", args)
            self.assertIn("preview-router@server.example", args)
            self.assertNotIn("shell", run.call_args.kwargs)
            self.assertEqual(args[-1], "preview-router deploy 42 " + URL + " 1000.1")


if __name__ == "__main__":
    unittest.main()
