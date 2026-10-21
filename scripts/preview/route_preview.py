#!/usr/bin/env python3
"""Reconcile a validated Timeweb comment through a restricted SSH command."""

import argparse
from datetime import datetime
import io
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

REPOSITORY = "UnidentifiedSheep/ECommerceSparePartsFront"
BOT_LOGIN = "timeweb-cloud-apps[bot]"
BOT_ID = 152404199
GITHUB_APP_ID = 659174
TIMEWEB_APP_ID = 201903
EVENT_WORKFLOW = ".github/workflows/preview-events.yml"
ARTIFACT = "timeweb-preview-event"
COMMENT_MARKER = "<!-- ecommerce-timeweb-preview-route -->"
HEADER = ["Превью", "Коммит", "Статус", "Обновлено (UTC)", "Стенд"]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, *args, **kwargs):
        return None


def positive_integer(value):
    if type(value) is not int or not 1 <= value <= 2147483647:
        raise ValueError("Invalid PR number.")
    return value


def valid_upstream(value):
    if not isinstance(value, str) or len(value) > 300:
        raise ValueError("Invalid preview URL.")
    match = re.fullmatch(r"https://([a-z0-9.-]+)(?::443)?/?", value, re.ASCII | re.IGNORECASE)
    if not match:
        raise ValueError("Preview URL must be a plain HTTPS origin.")
    host = match[1].lower()
    labels = host.split(".")
    if (len(host) > 253 or len(labels) < 2
            or any(not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", label) for label in labels)
            or not re.fullmatch(r"[a-z][a-z0-9-]*", labels[-1])):
        raise ValueError("Preview must use a valid fully qualified DNS hostname, not an IP address.")
    # The GitHub App identity and application-specific ready row establish provenance.
    # The restricted server validates and pins every resolved address before publishing.
    return "https://" + host


def trusted_comment(comment):
    user = comment.get("user") or {}
    app = comment.get("performed_via_github_app") or {}
    return (user.get("login") == BOT_LOGIN and user.get("id") == BOT_ID and user.get("type") == "Bot"
            and app.get("id") == GITHUB_APP_ID and app.get("slug") == "timeweb-cloud-apps")


def preview_url(body):
    """Parse the exact table and successful status observed in PR #3."""
    lines = [line.strip() for line in body.splitlines() if line.strip()]
    for index, line in enumerate(lines):
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if cells != HEADER or index + 2 >= len(lines):
            continue
        separators = [cell.strip() for cell in lines[index + 1].strip("|").split("|")]
        if len(separators) != 5 or not all(re.fullmatch(r":?-{3,}:?", cell) for cell in separators):
            continue
        found = set()
        for row in lines[index + 2:]:
            if not row.startswith("|"):
                break
            cells = [cell.strip() for cell in row.strip("|").split("|")]
            if len(cells) != 5 or cells[2] != "🟢 Успешно":
                continue
            dashboard = re.fullmatch(
                rf"\[Открыть\]\(https://timeweb\.cloud/my/apps/{TIMEWEB_APP_ID}/stands/[1-9][0-9]*\)", cells[4])
            if not dashboard:
                continue
            link = re.fullmatch(r"\[Посмотреть\]\(([^\s()]+)\)", cells[0])
            if not link:
                raise ValueError("Unexpected preview link format in a successful Timeweb row.")
            found.add(valid_upstream(link[1]))
        if len(found) > 1:
            raise ValueError("Ambiguous Timeweb preview URLs.")
        return next(iter(found), None)
    return None


def stamp(value):
    return int(datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp() * 1000)


def preview_origin(number):
    domain = os.environ.get("PREVIEW_DOMAIN", "preview.all-vp-n.ru")
    return valid_upstream(f"https://pr-{positive_integer(number)}.{domain}")


def wait_for_preview(number, timeout=240):
    url = preview_origin(number)
    opener = urllib.request.build_opener(NoRedirect)
    deadline = time.monotonic() + timeout
    print(f"Waiting for preview HTTPS: {url}", flush=True)
    while True:
        try:
            # This request never carries GitHub, SSH or application credentials.
            request = urllib.request.Request(url, headers={"User-Agent": "ecommerce-preview-readiness"})
            with opener.open(request, timeout=10) as response:
                if 200 <= response.status < 300:
                    return url
                last_error = f"HTTP {response.status}"
        except urllib.error.HTTPError as error:
            last_error = f"HTTP {error.code}"
            error.close()
        except OSError as error:
            last_error = str(error)
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise RuntimeError(f"Preview did not become ready over HTTPS at {url}: {last_error}")
        time.sleep(min(3, remaining))


class GitHub:
    def __init__(self, token):
        if not token:
            raise ValueError("GITHUB_TOKEN is required.")
        self.token = token
        self.opener = urllib.request.build_opener(NoRedirect)

    def request(self, path, archive=False, *, method="GET", payload=None):
        if not path.startswith("/") or path.startswith("//"):
            raise ValueError("GitHub API path must be relative.")
        if archive and (method != "GET" or payload is not None):
            raise ValueError("Artifact downloads must be read-only.")
        headers = {
            "Authorization": "Bearer " + self.token, "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "ecommerce-preview-routing",
        }
        if payload is not None:
            headers["Content-Type"] = "application/json"
        request = urllib.request.Request("https://api.github.com" + path, headers=headers, method=method,
                                        data=json.dumps(payload).encode() if payload is not None else None)
        try:
            response = self.opener.open(request, timeout=20)
        except urllib.error.HTTPError as error:
            if not archive or error.code not in (301, 302, 303, 307, 308):
                error.close()
                raise RuntimeError(f"GitHub API returned HTTP {error.code}.") from None
            location = error.headers.get("Location", "")
            error.close()
            parsed = urllib.parse.urlsplit(location)
            if (parsed.scheme != "https" or parsed.username or parsed.password or parsed.port not in (None, 443)
                    or not parsed.hostname or not parsed.hostname.endswith(
                        (".blob.core.windows.net", ".githubusercontent.com", ".actions.githubusercontent.com"))):
                raise ValueError("Unexpected artifact download host.") from None
            # Never forward the GitHub bearer token to the signed artifact storage URL.
            response = self.opener.open(urllib.request.Request(location), timeout=20)
        with response:
            body = response.read(1048577)
        if len(body) > 1048576:
            raise ValueError("GitHub response exceeded the size limit.")
        return body if archive else json.loads(body)

    def get(self, path):
        return self.request(f"/repos/{REPOSITORY}" + path)

    def comments(self, number):
        number = positive_integer(number)
        comments = []
        for page in range(1, 6):
            batch = self.get(f"/issues/{number}/comments?per_page=100&page={page}")
            comments.extend(batch)
            if len(batch) < 100:
                return comments
        raise ValueError("Too many PR comments to select an authoritative preview update.")

    def publish_preview_comment(self, number, deployed, run_id):
        number = positive_integer(number)
        run_id = int(run_id)
        if run_id <= 0:
            raise ValueError("Invalid routing workflow run ID.")
        issue_url = f"https://api.github.com/repos/{REPOSITORY}/issues/{number}"
        own = [comment for comment in self.comments(number)
               if (comment.get("user") or {}).get("login") == "github-actions[bot]"
               and (comment.get("user") or {}).get("type") == "Bot"
               and comment.get("issue_url") == issue_url
               and (comment.get("body") or "").startswith(COMMENT_MARKER + "\n")]
        if len(own) > 1:
            raise ValueError("Multiple preview status comments found; refusing to create a duplicate.")
        if not deployed and not own:
            return
        status = f"✅ Preview готов: [открыть стенд]({preview_origin(number)})" if deployed else "Preview удалён: PR закрыт."
        body = (f"{COMMENT_MARKER}\n{status}\n\n"
                f"[Запуск Actions](https://github.com/{REPOSITORY}/actions/runs/{run_id})")
        if own and own[0]["body"] == body:
            return
        path = f"/repos/{REPOSITORY}/issues"
        if own:
            self.request(f"{path}/comments/{int(own[0]['id'])}", method="PATCH", payload={"body": body})
        else:
            self.request(f"{path}/{number}/comments", method="POST", payload={"body": body})

    def record(self, run):
        if (run.get("repository", {}).get("full_name") != REPOSITORY or run.get("conclusion") != "success"
                or run.get("event") not in ("issue_comment", "pull_request")):
            raise ValueError("Unexpected source workflow run.")
        actual = self.get(f"/actions/runs/{int(run['id'])}")
        if (actual.get("path") != EVENT_WORKFLOW or actual.get("event") != run["event"]
                or actual.get("run_attempt") != run.get("run_attempt")):
            raise ValueError("Source run is not the expected event recorder.")
        artifacts = self.get(f"/actions/runs/{int(run['id'])}/artifacts?per_page=100")["artifacts"]
        selected = [item for item in artifacts if item["name"] == ARTIFACT and not item["expired"]]
        if len(selected) != 1 or selected[0]["size_in_bytes"] > 32768:
            raise ValueError("Expected exactly one small preview event artifact.")
        data = self.request(f"/repos/{REPOSITORY}/actions/artifacts/{int(selected[0]['id'])}/zip", archive=True)
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            files = archive.infolist()
            if len(files) != 1 or files[0].filename != "event.json" or files[0].file_size > 16384:
                raise ValueError("Unexpected preview artifact contents.")
            record = json.loads(archive.read(files[0]))
        expected = {"version", "event", "action", "pr", "comment_id"}
        if set(record) != expected or record["version"] != 1 or record["event"] != run["event"]:
            raise ValueError("Invalid preview event record.")
        positive_integer(record["pr"])
        if record["event"] == "issue_comment":
            if record["action"] not in ("created", "edited") or type(record["comment_id"]) is not int:
                raise ValueError("Invalid comment event record.")
        elif record["action"] != "closed" or record["comment_id"] is not None:
            raise ValueError("Invalid close event record.")
        if record["event"] == "pull_request" and actual.get("pull_requests"):
            if record["pr"] not in {item["number"] for item in actual["pull_requests"]}:
                raise ValueError("PR number does not match the source workflow run.")
        return record

    def reconcile(self, record, run_id):
        number = positive_integer(record["pr"])
        pull = self.get(f"/pulls/{number}")
        if pull.get("number") != number or pull.get("base", {}).get("repo", {}).get("full_name") != REPOSITORY:
            raise ValueError("Unexpected pull request repository.")
        if pull["state"] == "closed":
            return ["delete", str(number), f"{stamp(pull['closed_at'])}.{run_id}"]
        if pull["state"] != "open" or record["event"] != "issue_comment":
            return None
        event_comment = self.get(f"/issues/comments/{int(record['comment_id'])}")
        issue_url = f"https://api.github.com/repos/{REPOSITORY}/issues/{number}"
        if event_comment.get("issue_url") != issue_url or not trusted_comment(event_comment):
            return None
        # Read current comment bodies, so a delayed event cannot reinstall an old URL.
        comments = [comment for comment in self.comments(number) if trusted_comment(comment)]
        if not comments:
            return None
        latest = max(comments, key=lambda comment: (stamp(comment["updated_at"]), comment["id"]))
        url = preview_url(latest["body"])
        if not url:
            return None
        # Close may have raced with comment retrieval.
        pull = self.get(f"/pulls/{number}")
        if pull["state"] == "closed":
            return ["delete", str(number), f"{stamp(pull['closed_at'])}.{run_id}"]
        return ["deploy", str(number), url, f"{stamp(latest['updated_at'])}.{run_id}"]


def ssh_apply(command):
    host = os.environ.get("PREVIEW_SSH_HOST", "")
    port = os.environ.get("PREVIEW_SSH_PORT", "22")
    key = os.environ.get("PREVIEW_SSH_KEY", "")
    known_hosts = os.environ.get("PREVIEW_SSH_KNOWN_HOSTS", "")
    if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9.:-]{0,252}", host):
        raise ValueError("PREVIEW_SSH_HOST is required and must be a hostname or IP.")
    if not port.isdecimal() or not 1 <= int(port) <= 65535 or not key or not known_hosts:
        raise ValueError("Restricted SSH key, pinned known_hosts and a valid port are required.")
    with tempfile.TemporaryDirectory(prefix="preview-ssh-") as directory:
        key_file = Path(directory) / "key"
        key_file.write_text(key.strip() + "\n")
        key_file.chmod(0o600)
        hosts_file = Path(directory) / "known_hosts"
        hosts_file.write_text(known_hosts.strip() + "\n")
        hosts_file.chmod(0o600)
        args = ["ssh", "-F", "/dev/null", "-i", str(key_file), "-p", str(int(port)),
                "-o", "BatchMode=yes", "-o", "IdentitiesOnly=yes", "-o", "IdentityAgent=none",
                "-o", "StrictHostKeyChecking=yes", "-o", "UserKnownHostsFile=" + str(hosts_file),
                "-o", "GlobalKnownHostsFile=/dev/null", "-o", "ConnectTimeout=10",
                "-o", "ClearAllForwardings=yes", "-o", "RequestTTY=no",
                "preview-router@" + host, "preview-router " + " ".join(command)]
        for attempt in range(3):
            try:
                result = subprocess.run(args, timeout=80, check=False)
            except subprocess.TimeoutExpired:
                if attempt == 2:
                    raise RuntimeError("Preview SSH command timed out.") from None
                continue
            if result.returncode == 0:
                return
            if result.returncode != 255 or attempt == 2:
                raise RuntimeError(f"Restricted preview command exited with status {result.returncode}.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=["inspect", "apply"])
    args = parser.parse_args()
    if os.environ.get("GITHUB_REPOSITORY") != REPOSITORY:
        raise ValueError("This workflow is bound to the configured frontend repository.")
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    run = event["workflow_run"]
    github = GitHub(os.environ.get("GITHUB_TOKEN", ""))
    record = github.record(run)
    if args.operation == "inspect":
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
            output.write(f"pr={record['pr']}\n")
        return
    command = github.reconcile(record, int(run["id"]))
    if command is None:
        print("No ready, verified Timeweb preview to publish.")
        return
    ssh_apply(command)
    if command[0] == "deploy":
        wait_for_preview(record["pr"])
        pull = github.get(f"/pulls/{record['pr']}")
        if pull["state"] == "closed":
            command = ["delete", str(record["pr"]), f"{stamp(pull['closed_at'])}.{int(run['id'])}"]
            ssh_apply(command)
        elif pull["state"] != "open":
            raise ValueError("Unexpected PR state after preview readiness check.")
    github.publish_preview_comment(record["pr"], command[0] == "deploy", os.environ["GITHUB_RUN_ID"])
    print(f"Preview route {command[0]} completed for PR #{record['pr']}.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, OSError, RuntimeError, zipfile.BadZipFile) as error:
        raise SystemExit(str(error))
