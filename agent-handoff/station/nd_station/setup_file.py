"""
The org setup file and the stick id, both on the stick's visible section (partition NEXWIPE).

`nexwipe-setup.json` is written by the NexWipe Stick Writer: server address, the org's stick key, the org name for
display and an optional bench Wi-Fi. `nexwipe-stick-id` is created on the stick at first use (never by the writer), so
copies of an unused master stick each get their own id. The Windows helper reads and creates the same two files.
"""
from __future__ import annotations

import json
import os
import re
import secrets
import urllib.parse
from typing import Iterable, Optional

SETUP_NAME = "nexwipe-setup.json"
STICK_ID_NAME = "nexwipe-stick-id"
# /run/nexwipe: rw mount of the visible section (run-nexwipe.mount). /run/live/medium: read-only, when booted
# without toram (diagnostics entry); a stick id cannot be created there.
ROOTS = ("/run/nexwipe", "/run/live/medium")
_KEY_RE = re.compile(r"^ndstk_[0-9a-f]{64}$")
_ID_RE = re.compile(r"^[0-9a-f]{32}$")


def validate_server(url: str, allow_http_hosts: Iterable[str] = ()) -> str:
    u = urllib.parse.urlparse(str(url).strip())
    if u.scheme == "https" and u.hostname:
        return f"https://{u.netloc}"
    if u.scheme == "http" and u.hostname in (allow_http_hosts or []):
        return f"http://{u.netloc}"  # test labs only (e.g. a VM talking to a dev server)
    raise ValueError("Server address must start with https:// (for example https://nexwipe.example.com)")


def find_root(roots: Iterable[str] = ROOTS) -> Optional[str]:
    return next((r for r in roots if os.path.isfile(os.path.join(r, SETUP_NAME))), None)


def load(root: str, allow_http_hosts: Iterable[str] = ()) -> dict:
    """Parsed setup file. Raises ValueError with a message fit for the station screen."""
    try:
        with open(os.path.join(root, SETUP_NAME), encoding="utf-8-sig") as f:  # -sig: Windows tools add a BOM
            raw = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        raise ValueError(f"The stick's {SETUP_NAME} is missing or damaged ({e.__class__.__name__}). Prepare the stick again.") from None
    if not isinstance(raw, dict):
        raise ValueError(f"The stick's {SETUP_NAME} is damaged. Prepare the stick again.")
    key = str(raw.get("stick_key") or "")
    if not _KEY_RE.match(key):
        raise ValueError(f"The stick's {SETUP_NAME} has no valid stick key. Prepare the stick again.")
    wifi = raw.get("wifi") or None
    if wifi is not None:
        ssid = str(wifi.get("ssid") or "") if isinstance(wifi, dict) else ""
        pw = str(wifi.get("password") or "") if isinstance(wifi, dict) else ""
        if not 1 <= len(ssid.encode()) <= 32 or not (pw == "" or 8 <= len(pw) <= 63):
            raise ValueError("The Wi-Fi in the setup file is not valid (name 1-32 characters, password 8-63 or none).")
        wifi = {"ssid": ssid, "password": pw}
    return {"server": validate_server(raw.get("server") or "", allow_http_hosts), "stick_key": key,
            "org_name": str(raw.get("org_name") or "")[:120], "wifi": wifi}


def wifi_join_argv(wifi: dict) -> list:
    """NetworkManager command that joins the setup file's bench Wi-Fi (allow-listed in safety.py)."""
    argv = ["nmcli", "device", "wifi", "connect", wifi["ssid"]]
    return argv + ["password", wifi["password"]] if wifi.get("password") else argv


def stick_id(root: str) -> str:
    """This stick's random id; created on first use. Raises OSError if the section is read-only."""
    path = os.path.join(root, STICK_ID_NAME)
    try:
        with open(path, encoding="ascii", errors="replace") as f:
            cur = f.read().strip()
        if _ID_RE.match(cur):
            return cur
    except OSError:
        pass
    new = secrets.token_hex(16)
    with open(path, "w", encoding="ascii") as f:
        f.write(new + "\n")
        f.flush()
        os.fsync(f.fileno())  # the stick may be pulled soon after
    return new
