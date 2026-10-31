#!/usr/bin/env python3
"""Build and check kind-31990 skill announcements.

NIP-89 kind 31990 is an addressable handler record. This registry uses it
only as a pointer to a skill repository. It does not set a `k` tag, so the
event is not an announcement that this pubkey handles kind-1 notes.

Relays index single-letter tags. `#category` matches nothing. Discovery is
`#t` = `agentskill` or `#t` = `agentskill:<category>`.

  python3 scripts/registry.py selftest
  python3 scripts/registry.py build --name blossom --cat media \\
      --repo https://github.com/NostrDanish/blossom-skill --about "Blossom blobs"
  python3 scripts/registry.py filter --cat media

Sign the printed event with the nostr skill (`nostr_key.py sign env -`) and
publish with `nostr_query.py`. Do not put an nsec in this script.
"""
import json
import re
import sys
import time

KIND = 31990
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")


def slug(value):
    text = value.strip().lower().replace("_", "-").replace(" ", "-").replace("/", "-")
    text = re.sub(r"[^a-z0-9-]", "", text)
    text = re.sub(r"-+", "-", text).strip("-")
    if not SLUG.match(text or ""):
        raise SystemExit(f"not a slug: {value!r}")
    return text


def build(name, category, repo, about, created_at=None):
    name, category = slug(name), slug(category)
    repo = repo.strip()
    if not repo.startswith("https://"):
        raise SystemExit("repo must be an https URL")
    about = about.strip()
    if not about:
        raise SystemExit("about is empty")
    content = json.dumps(
        {"name": name, "about": about, "website": repo},
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return {
        "kind": KIND,
        "created_at": int(created_at if created_at is not None else time.time()),
        "tags": [
            ["d", name],
            ["alt", f"AI skill: {name}"],
            ["t", "agentskill"],
            ["t", f"agentskill:{category}"],
            ["r", repo],
        ],
        "content": content,
    }


def problems(ev):
    errs = []
    if ev.get("kind") != KIND:
        errs.append("kind")
    tags = ev.get("tags") or []
    d = [t[1] for t in tags if t and t[0] == "d"]
    tvals = [t[1] for t in tags if t and t[0] == "t"]
    repos = [t[1] for t in tags if t and t[0] == "r"]
    if d != [d[0]] if d else True:
        errs.append("d")
    if len(d) != 1 or not SLUG.match(d[0]):
        errs.append("d")
    if "agentskill" not in tvals:
        errs.append("t")
    if not any(v.startswith("agentskill:") for v in tvals):
        errs.append("category")
    if any(t and t[0] == "k" for t in tags):
        errs.append("unexpected k tag")
    try:
        body = json.loads(ev.get("content") or "")
    except json.JSONDecodeError:
        body = {}
        errs.append("content")
    if body.get("website") not in repos:
        errs.append("repo")
    if body.get("name") != (d[0] if d else None):
        errs.append("name")
    return errs


def filt(category=None):
    tag = "agentskill" if not category else "agentskill:" + slug(category)
    return {"kinds": [KIND], "#t": [tag], "limit": 50}


def selftest():
    ok = True

    def check(name, cond):
        nonlocal ok
        print(("PASS " if cond else "FAIL ") + name)
        ok = ok and bool(cond)

    ev = build("blossom", "Media", "https://github.com/NostrDanish/blossom-skill", "blobs", created_at=1700000000)
    check("valid", problems(ev) == [])
    check("no-k", not any(t[0] == "k" for t in ev["tags"]))
    check("filter-letter", list(filt("media").keys())[-2] == "#t" or "#t" in filt("media"))
    check("filter-and-not-or", filt("media")["#t"] == ["agentskill:media"])
    bad = json.loads(json.dumps(ev))
    bad["tags"] = [t for t in bad["tags"] if t[0] != "t"]
    check("rejects-missing-t", "t" in problems(bad))
    return ok


def _arg(flag):
    if flag not in sys.argv:
        return None
    i = sys.argv.index(flag)
    if i + 1 >= len(sys.argv):
        raise SystemExit(f"missing value for {flag}")
    return sys.argv[i + 1]


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd == "selftest":
        sys.exit(0 if selftest() else 1)
    if cmd == "build":
        ev = build(_arg("--name"), _arg("--cat") or "general", _arg("--repo"), _arg("--about"))
        errs = problems(ev)
        if errs:
            raise SystemExit("invalid event: " + ",".join(errs))
        print(json.dumps(ev, ensure_ascii=False, separators=(",", ":")))
        return
    if cmd == "filter":
        print(json.dumps(filt(_arg("--cat")), separators=(",", ":")))
        return
    print(__doc__)
    sys.exit(1)


if __name__ == "__main__":
    main()
