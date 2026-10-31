# blossom-skill

Agent skill for [Blossom](https://github.com/hzrd149/blossom): store and fetch blobs by SHA-256.

NIP-96 is not the path. Auth is a kind **24242** event in a `Authorization: Nostr <base64url>` header (BUD-11). The user's server list is kind **10063** (BUD-03).

```bash
python3 scripts/blossom.py selftest
python3 scripts/blossom.py hash ./file.png
```

`SKILL.md` is the procedure. The BUDs on GitHub are the spec; fetch the raw markdown before inventing a header.

Pairs with the [nostr skill](https://github.com/NostrDanish/nostr-skill) for signing and the [nak skill](https://github.com/NostrDanish/nak-skill) for `nak blossom`.

## License

CC-BY-SA-4.0
