---
name: blossom
description: "Upload, fetch, mirror, and delete blobs on Blossom media servers (BUD-01 through BUD-12, kind 24242 auth, kind 10063 server list). Use instead of NIP-96. Triggers on Blossom, BUD-02, blob upload, sha256 media URL."
license: CC-BY-SA-4.0
---

# Blossom

Blossom stores a blob by its SHA-256. The server must keep the bytes you sent. NIP-96 is unrecommended; do not build a new uploader on it.

Spec, raw: `https://raw.githubusercontent.com/hzrd149/blossom/master/buds/NN.md`. Fetch the BUD before you invent a header. `nak blossom` is the CLI shortcut; this skill is the protocol.

## Task routing

| Job | Do this |
|---|---|
| Hash a file, build the unsigned auth event, encode the Authorization header | `python3 scripts/blossom.py` |
| Upload or download from the shell | `nak blossom --server <host> upload <file>` with `NOSTR_SECRET_KEY` set. See the `nak` skill. With no key, nak signs as the public default key `01`. |
| Sign the auth event | `nostr` skill, `nostr_key.py sign env -`. Never put the nsec on the command line. |
| Which servers a user uses | Kind **10063** (BUD-03). Fetch that BUD for the tag shape. |
| Protocol text | `python3 scripts/nip.py get B7` from `nostr-nips`, then the BUD file. |

## Auth event (BUD-11)

Kind **24242**. All of these are required:

- `content` is a short human-readable sentence (`Upload blob`, `Delete blob`). Not empty.
- `t` is one of `get`, `upload`, `list`, `delete`, `media`, and it matches the endpoint.
- `expiration` is a unix timestamp in the future (NIP-40). Keep it short. A delete token lives until it expires.
- `created_at` is in the past (now is fine).

`x` is the 64-character lowercase SHA-256. BUD-11 requires it for `PUT /upload`, `HEAD /upload`, `DELETE /<sha>`, `PUT /mirror`, and `PUT /media`. It is optional for `GET`. `GET /list/<pubkey>` does not use it, and that list endpoint is unrecommended.

`server` is optional. If you set it, the value is a **lowercase domain** (`cdn.example.com`), never a URL. No `server` tag means any server that accepts the token can replay it until `expiration`. Always set `server` for `delete`.

HTTP header, after the event is signed:

```
Authorization: Nostr <base64url of the event JSON, no padding>
```

That is not NIP-98. NIP-98 is ordinary base64 of a kind-27235 event. Blossom will 401 if you mix them up.

## Upload (BUD-02)

```bash
python3 scripts/blossom.py hash ./file.png
python3 scripts/blossom.py auth upload <sha> --server cdn.example.com --seconds 300 \
  | NOSTR_SECRET_KEY="$NOSTR_SECRET_KEY" python3 /path/to/nostr_key.py sign env - > auth.json
AUTH=$(python3 scripts/blossom.py header auth.json)
curl -sS -D - -o desc.json \
  -X PUT --data-binary @file.png \
  -H "Authorization: $AUTH" \
  -H "Content-Type: image/png" \
  -H "Content-Length: $(wc -c < file.png)" \
  -H "X-SHA-256: <sha>" \
  https://cdn.example.com/upload
python3 scripts/blossom.py check-descriptor desc.json <sha>
```

201 means the server stored it. 200 means it already had those bytes. Both return a descriptor: `url`, `sha256`, `size`, `type`, `uploaded`. The `url` must contain the hash and should have a file extension. If `sha256` does not match, do not use the URL.

Other statuses worth handling: 401 bad auth, 402 payment (BUD-07), 409 `X-SHA-256` mismatch, 413 too large, 415 type rejected. `X-Reason` is a sentence for humans, not a code to branch on.

## Everything else

| Endpoint | `t` | Notes |
|---|---|---|
| `GET /<sha>` and `HEAD /<sha>` | `get` | BUD-01. Extension in the URL is optional on read. |
| `PUT /mirror` | `upload` | BUD-04. Body describes the source blob; `x` is the hash. |
| `PUT /media` and `HEAD /media` | `media` | BUD-05 optimization. `x` required. |
| `DELETE /<sha>` | `delete` | BUD-12. `x` required. Scope it with `server`. |
| `GET /list/<pubkey>` | `list` | BUD-12, **unrecommended**. Do not depend on it. |
| `HEAD /upload` | `upload` | BUD-06, what the server will accept. Do it before a large upload. |

Put the descriptor `url` in the note, or in a kind 1063 file-metadata event / `imeta` tag (NIP-92, NIP-94). The hash is the identity. A pretty URL is not.
