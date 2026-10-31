#!/usr/bin/env python3
"""Build an unsigned NIP-90 job request and check a result's shape.

Does not sign, publish, pay, or encrypt. NIP-90 is unrecommended for new
products; this only helps you talk to a DVM that already exists.

  python3 scripts/dvm.py selftest
  python3 scripts/dvm.py request 5000 --text "hello" --output text/plain --relay wss://nos.lol
  python3 scripts/dvm.py check request.json result.json
"""
import json
import sys
import time


def request_event(kind, text=None, output=None, relays=None, bid_msat=None, now=None):
    kind = int(kind)
    if not 5000 <= kind <= 5999:
        raise SystemExit("kind must be 5000-5999. Fetch the job kind from nostr-protocol/data-vending-machines. Do not invent one.")
    tags = []
    if text is not None:
        tags.append(["i", text, "text"])
    if output:
        tags.append(["output", output])
    if relays:
        tags.append(["relays", *relays])
    if bid_msat is not None:
        tags.append(["bid", str(int(bid_msat))])
    return {
        "kind": kind,
        "created_at": int(time.time() if now is None else now),
        "tags": tags,
        "content": "",
    }


def result_problems(request, result):
    errs = []
    if result.get("kind") != request.get("kind", 0) + 1000:
        errs.append("result kind must be request kind + 1000")
    req_id = request.get("id")
    if req_id:
        e_tags = [t for t in result.get("tags", []) if t and t[0] == "e"]
        if not any(len(t) > 1 and t[1] == req_id for t in e_tags):
            errs.append("result e tag does not point at the request")
    customer = request.get("pubkey")
    if customer:
        p_tags = [t[1] for t in result.get("tags", []) if t and t[0] == "p" and len(t) > 1]
        if customer not in p_tags:
            errs.append("result p tag is not the customer")
    if result.get("kind") == 7000:
        errs.append("this is feedback, not a result")
    return errs


def selftest():
    ok = True

    def check(name, cond):
        nonlocal ok
        print(("PASS " if cond else "FAIL ") + name)
        ok = ok and bool(cond)

    ev = request_event(5000, text="hi", output="text/plain", relays=["wss://nos.lol"], bid_msat=1000, now=1700000000)
    check("shape", ev["kind"] == 5000 and ["i", "hi", "text"] in ev["tags"] and ["bid", "1000"] in ev["tags"])
    check("no-secret-field", "sig" not in ev)
    try:
        request_event(1, text="x")
        check("reject-kind", False)
    except SystemExit:
        check("reject-kind", True)
    req = dict(ev, id="ab" * 32, pubkey="cd" * 32)
    good = {
        "kind": 6000,
        "tags": [["e", req["id"], "wss://nos.lol"], ["p", req["pubkey"]]],
        "content": "ok",
    }
    check("good-result", result_problems(req, good) == [])
    bad = dict(good, kind=6001)
    check("bad-kind", any("1000" in e for e in result_problems(req, bad)))
    return ok


def _flag(name):
    if name not in sys.argv:
        return None
    return sys.argv[sys.argv.index(name) + 1]


def _load(path):
    raw = sys.stdin.read() if path == "-" else open(path, encoding="utf-8").read()
    return json.loads(raw)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd == "selftest":
        sys.exit(0 if selftest() else 1)
    if cmd == "request":
        relays = []
        args = sys.argv[3:]
        while "--relay" in args:
            i = args.index("--relay")
            relays.append(args[i + 1])
            del args[i:i + 2]
        ev = request_event(sys.argv[2], text=_flag("--text"), output=_flag("--output"), relays=relays, bid_msat=_flag("--bid-msat"))
        print(json.dumps(ev, ensure_ascii=False, separators=(",", ":")))
        return
    if cmd == "check":
        errs = result_problems(_load(sys.argv[2]), _load(sys.argv[3]))
        if errs:
            print("\n".join(errs))
            sys.exit(1)
        print("SHAPE OK")
        print("Still verify the signature with nostr_key.py before trusting the content.")
        return
    print(__doc__)
    sys.exit(1)


if __name__ == "__main__":
    main()
