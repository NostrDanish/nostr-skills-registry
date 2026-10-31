#!/usr/bin/env python3
"""Blossom helpers: hash, unsigned BUD-11 auth event, Authorization header.

  python3 scripts/blossom.py selftest
  python3 scripts/blossom.py hash <file>
  python3 scripts/blossom.py auth upload <sha256> --server cdn.example.com --seconds 300
  python3 scripts/blossom.py header <signed-event.json>
  python3 scripts/blossom.py check-descriptor <descriptor.json> <sha256>

Signing is the nostr skill's job (nostr_key.py sign env -). This file never
reads a secret.
"""
import base64
import hashlib
import json
import sys
import time

VERBS = {"get", "upload", "list", "delete", "media"}
REQUIRES_HASH = {"upload", "delete", "media"}


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def auth_event(verb, sha=None, server=None, seconds=600, content=None, now=None):
    if verb not in VERBS:
        raise SystemExit(f"verb must be one of {sorted(VERBS)}")
    if sha is None and verb in REQUIRES_HASH:
        raise SystemExit(f"{verb} requires the blob sha256 (BUD-11)")
    if sha is not None and (len(sha) != 64 or any(c not in "0123456789abcdef" for c in sha)):
        raise SystemExit("sha256 must be 64 lowercase hex characters")
    if server is not None and ("://" in server or "/" in server or server != server.lower() or not server):
        raise SystemExit("server tag is a lowercase domain, not a URL")
    now = int(time.time() if now is None else now)
    tags = [["t", verb], ["expiration", str(now + int(seconds))]]
    if sha:
        tags.append(["x", sha])
    if server:
        tags.append(["server", server])
    return {
        "kind": 24242,
        "created_at": now,
        "tags": tags,
        "content": content or f"{verb.capitalize()} blob",
    }


def authorization_header(event):
    raw = json.dumps(event, separators=(",", ":"), ensure_ascii=False).encode()
    token = base64.urlsafe_b64encode(raw).decode().rstrip("=")
    return "Nostr " + token


def descriptor_ok(desc, sha):
    url = desc.get("url") or ""
    return desc.get("sha256") == sha and sha in url and bool(desc.get("size"))


def selftest():
    ok = True

    def check(name, cond):
        nonlocal ok
        print(("PASS " if cond else "FAIL ") + name)
        ok = ok and bool(cond)

    digest = sha256_bytes(b"hi")
    check("hash", digest == "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4")
    ev = auth_event("upload", digest, server="cdn.example.com", seconds=60, now=1700000000)
    check("kind", ev["kind"] == 24242 and ev["content"])
    check("x", ["x", digest] in ev["tags"])
    check("exp", ["expiration", "1700000060"] in ev["tags"])
    check("domain", ["server", "cdn.example.com"] in ev["tags"])
    try:
        auth_event("upload", server="https://cdn.example.com")
        check("reject-url", False)
    except SystemExit:
        check("reject-url", True)
    try:
        auth_event("delete")
        check("delete-needs-hash", False)
    except SystemExit:
        check("delete-needs-hash", True)
    header = authorization_header(ev)
    check("header", header.startswith("Nostr ") and "=" not in header.split(" ", 1)[1])
    check("desc", descriptor_ok({"url": "https://cdn.example.com/" + digest + ".png", "sha256": digest, "size": 2}, digest))
    check("desc-bad", not descriptor_ok({"url": "https://cdn.example.com/nope.png", "sha256": digest, "size": 2}, digest))
    return ok


def _flag(name, default=None):
    if name not in sys.argv:
        return default
    return sys.argv[sys.argv.index(name) + 1]


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd == "selftest":
        sys.exit(0 if selftest() else 1)
    if cmd == "hash":
        path = sys.argv[2]
        data = sys.stdin.buffer.read() if path == "-" else open(path, "rb").read()
        print(sha256_bytes(data))
        return
    if cmd == "auth":
        verb, sha = sys.argv[2], sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else None
        ev = auth_event(verb, sha, server=_flag("--server"), seconds=int(_flag("--seconds", "600")), content=_flag("--content"))
        print(json.dumps(ev, separators=(",", ":")))
        return
    if cmd == "header":
        raw = sys.stdin.read() if sys.argv[2] == "-" else open(sys.argv[2], encoding="utf-8").read()
        print(authorization_header(json.loads(raw)))
        return
    if cmd == "check-descriptor":
        raw = sys.stdin.read() if sys.argv[2] == "-" else open(sys.argv[2], encoding="utf-8").read()
        good = descriptor_ok(json.loads(raw), sys.argv[3])
        print("OK" if good else "MISMATCH")
        sys.exit(0 if good else 1)
    print(__doc__)
    sys.exit(1)


if __name__ == "__main__":
    main()
