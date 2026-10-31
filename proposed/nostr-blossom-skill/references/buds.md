# Blossom BUDs (pointer)

Source of truth: https://github.com/hzrd149/blossom/tree/master/buds

| BUD | Job |
|---|---|
| 01 | GET/HEAD `/{sha256}`, CORS, Range, redirects must keep the hash, `X-Reason`, optional `Sunset` |
| 02 | Upload (`PUT /upload`) and the auth event |
| 03 | Kind 10063 user server list (what NIP-B7 restates) |
| 04+ | List/delete/mirroring — read before implementing management UIs |

## Recovery recipe

Dead `https://old.example/ab…cd.png` from Alice's kind 1:

```
HEAD https://old.example/ab…cd.png     # 404
REQ kinds=[10063] authors=[alice]
GET  https://<server-tag>/ab…cd.png
sha256(body) == ab…cd
```

## Auth header

`Authorization: Nostr <base64-encoded event JSON>`. Event `created_at`
must be fresh; many servers reject stale auth. Do not log the header
(it is a signed capability for that action).

## NIP-98 overlap

Kind 27235 HTTP auth (`u` + `method`, ±60s) is used by generic HTTP
APIs. Blossom upload auth is often kind 24242 with `t`/`x`. Check the
server. Use the `nostr` skill to sign.
