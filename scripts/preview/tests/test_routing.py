import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch
import urllib.error
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


class PreviewCommentTests(unittest.TestCase):
    @staticmethod
    def own_comment(body):
        return comment(body, id=77, user={"login": "github-actions[bot]", "type": "Bot"})

    def test_creates_only_public_preview_link_without_editing_untrusted_comments(self):
        api = routing.GitHub("dummy")
        fake = comment(routing.COMMENT_MARKER + "\nforged", user={"login": "someone", "type": "User"})
        with patch.object(api, "get", return_value=[comment(), fake, {"user": None}]), patch.object(api, "request") as write:
            api.publish_preview_comment(42, True, 123)
        self.assertEqual(write.call_args.args[0], f"/repos/{routing.REPOSITORY}/issues/42/comments")
        self.assertEqual(write.call_args.kwargs["method"], "POST")
        body = write.call_args.kwargs["payload"]["body"]
        self.assertIn("https://pr-42.preview.all-vp-n.ru", body)
        self.assertIn(f"https://github.com/{routing.REPOSITORY}/actions/runs/123", body)
        self.assertNotIn(URL, body)

    def test_updates_existing_comment_and_same_run_is_idempotent(self):
        api = routing.GitHub("dummy")
        with patch.object(api, "get", return_value=[self.own_comment(routing.COMMENT_MARKER + "\nold")]), patch.object(
                api, "request") as write:
            api.publish_preview_comment(42, True, 123)
        self.assertEqual(write.call_args.args[0], f"/repos/{routing.REPOSITORY}/issues/comments/77")
        self.assertEqual(write.call_args.kwargs["method"], "PATCH")
        current = self.own_comment(write.call_args.kwargs["payload"]["body"])
        with patch.object(api, "get", return_value=[current]), patch.object(api, "request") as write:
            api.publish_preview_comment(42, True, 123)
        write.assert_not_called()

    def test_closure_updates_existing_status_without_creating_a_new_comment(self):
        api = routing.GitHub("dummy")
        with patch.object(api, "get", return_value=[self.own_comment(routing.COMMENT_MARKER + "\nready")]), patch.object(
                api, "request") as write:
            api.publish_preview_comment(42, False, 123)
        self.assertEqual(write.call_args.kwargs["method"], "PATCH")
        self.assertIn("Preview удалён", write.call_args.kwargs["payload"]["body"])
        self.assertNotIn("pr-42.preview", write.call_args.kwargs["payload"]["body"])
        with patch.object(api, "get", return_value=[]), patch.object(api, "request") as write:
            api.publish_preview_comment(42, False, 123)
        write.assert_not_called()

    def test_api_writes_send_json_to_github(self):
        api = routing.GitHub("dummy")
        with patch.object(api.opener, "open", return_value=io.BytesIO(b'{}')) as open_request:
            api.request(f"/repos/{routing.REPOSITORY}/issues/42/comments", method="POST", payload={"body": "ready"})
        request = open_request.call_args.args[0]
        self.assertEqual(request.method, "POST")
        self.assertTrue(request.full_url.startswith("https://api.github.com/repos/"))
        self.assertEqual(json.loads(request.data), {"body": "ready"})
        self.assertEqual(request.get_header("Content-type"), "application/json")

    def test_readiness_checks_only_our_https_origin_without_credentials(self):
        response = Mock(status=200)
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        opener = Mock()
        opener.open.return_value = response
        with patch.object(routing.urllib.request, "build_opener", return_value=opener):
            self.assertEqual(routing.wait_for_preview(42), "https://pr-42.preview.all-vp-n.ru")
        request = opener.open.call_args.args[0]
        self.assertEqual(request.full_url, "https://pr-42.preview.all-vp-n.ru")
        self.assertIsNone(request.get_header("Authorization"))
        self.assertIsNone(request.get_header("Cookie"))

    def test_redirect_or_tls_failure_never_counts_as_ready(self):
        for error in [urllib.error.HTTPError("https://pr-42.preview.all-vp-n.ru", 302, "redirect", {}, None),
                      urllib.error.URLError("certificate verify failed")]:
            opener = Mock()
            opener.open.side_effect = error
            with self.subTest(error=error), patch.object(routing.urllib.request, "build_opener", return_value=opener):
                with self.assertRaisesRegex(RuntimeError, "did not become ready over HTTPS"):
                    routing.wait_for_preview(42, timeout=0)

    def run_main(self, api, ssh, readiness):
        with tempfile.TemporaryDirectory() as directory:
            event = Path(directory) / "event.json"
            event.write_text(json.dumps({"workflow_run": {"id": 12}}))
            with patch.dict(routing.os.environ, {"GITHUB_REPOSITORY": routing.REPOSITORY, "GITHUB_TOKEN": "dummy",
                                                "GITHUB_EVENT_PATH": str(event), "GITHUB_RUN_ID": "123"}), patch.object(
                    sys, "argv", ["route_preview.py", "apply"]), patch.object(
                    routing, "GitHub", return_value=api), patch.object(routing, "ssh_apply", ssh), patch.object(
                    routing, "wait_for_preview", readiness):
                routing.main()

    @staticmethod
    def api_for_deploy():
        api = Mock(spec=routing.GitHub)
        api.record.return_value = {"pr": 42}
        api.reconcile.return_value = ["deploy", "42", URL, "1000.1"]
        api.get.return_value = pull()
        return api

    def test_failed_ssh_or_https_does_not_publish_success(self):
        for failing in ["ssh", "https"]:
            api = self.api_for_deploy()
            ssh, ready = Mock(), Mock()
            (ssh if failing == "ssh" else ready).side_effect = RuntimeError("failed")
            with self.subTest(failing=failing), self.assertRaises(RuntimeError):
                self.run_main(api, ssh, ready)
            api.publish_preview_comment.assert_not_called()

    def test_comment_is_published_after_ssh_and_https_succeed(self):
        api = self.api_for_deploy()
        order = []
        ssh = Mock(side_effect=lambda _: order.append("ssh"))
        ready = Mock(side_effect=lambda _: order.append("https"))
        api.publish_preview_comment.side_effect = lambda *args: order.append("comment")
        self.run_main(api, ssh, ready)
        self.assertEqual(order, ["ssh", "https", "comment"])
        api.publish_preview_comment.assert_called_once_with(42, True, "123")

    def test_pr_closed_during_https_wait_removes_route_without_ready_comment(self):
        api = self.api_for_deploy()
        api.get.return_value = pull("closed")
        ssh = Mock()
        self.run_main(api, ssh, Mock())
        self.assertEqual([call.args[0][0] for call in ssh.call_args_list], ["deploy", "delete"])
        api.publish_preview_comment.assert_called_once_with(42, False, "123")


if __name__ == "__main__":
    unittest.main()
