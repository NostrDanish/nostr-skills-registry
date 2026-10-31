---
name: blossom
description: "Upload, fetch, list, mirror, and delete blobs on Blossom servers (BUD-01, BUD-02, BUD-03, BUD-04, BUD-11, NIP-B7). Use for Nostr media, kind 10063 server lists, kind 24242 upload auth, or when a sha256 media URL 404s. NIP-96 is not the path. Triggers on blossom, BUD, kind 24242, kind 10063, blob upload."
license: CC-BY-SA-4.0
---

# Blossom

Blossom stores a file at `GET /<sha256>` and identifies it by the SHA-256 of the exact bytes. NIP-B7 is how Nostr clients find a user's servers. NIP-96 is the old HTTP-file spec. Do not implement NIP-96.

Specs: https://github.com/hzrd149/blossom (BUD-01 through BUD-11) and NIP-B7. If this skill and a BUD disagree, the BUD wins. Fetch the raw BUD before inventing a header.

## Server list (BUD-03, NIP-B7)

Kind **10063**, replaceable, empty content. One `server` tag per base URL, best server first, including `https://`.

```json
{"kind":10063,"content":"","tags":[["server","https://cdn.example.com"]]}
```

Upload to at least the first server. When a URL that ends in 64 hex (optional extension) 404s, take that hex and `GET` it on the user's other servers. Hash the downloaded bytes. If the hash does not match, the file is not the one the URL named.

## Fetch (BUD-01)

`GET https://<server>/<sha256>` or `GET https://<server>/<sha256>.png`. The extension is optional. The server still returns the blob's real `Content-Type`. A 3xx must land on a URL that still contains the same sha256. CORS is `Access-Control-Allow-Origin: *`.

`HEAD /<sha256>` answers "does this server have it" without the body.

## Upload (BUD-02 + BUD-11)

`PUT https://<server>/upload` with the raw bytes as the body. Send `Content-Type`, `Content-Length`, and `X-SHA-256` (lowercase hex of those exact bytes). The server must not modify the bytes.

Response is a blob descriptor: `url`, `sha256`, `size`, `type`, `uploaded`. **201** means stored now. **200** means it was already there. Both are success. `X-Reason` is a human sentence, not a machine code.

`HEAD /upload` (BUD-06) with `X-SHA-256`, `X-Content-Length`, and `X-Content-Type` is an optional preflight. It is not a promise that the PUT will succeed. Skip it if you want.

### Authorization event (BUD-11)

Kind **24242**. Servers may require it.

- `content`: a short human sentence (`Upload blob`). The BUD says this is required even though one example leaves it empty. Set the sentence.
- `t`: the verb for that endpoint. `upload` for `PUT /upload`, `HEAD /upload`, and `PUT /mirror`. `get` for GET/HEAD of a blob. `list` for `GET /list/<pubkey>`. `delete` for `DELETE /<sha256>`. `media` for `PUT /media`.
- `expiration`: unix seconds in the future (NIP-40). Required.
- `created_at` must be in the past.
- `x`: lowercase sha256. **Required** on upload, mirror, delete, and media. Optional on get. For `PUT /upload` the hash comes from the `X-SHA-256` header and must match an `x` tag.
- `server`: optional. If present, each value is a lowercase domain only (`cdn.example.com`), not a URL. No `server` tag means the token works on every server that accepts it. Do not do that for `delete`.

Header, **base64url with no padding** (not standard base64):

```
Authorization: Nostr <base64url(JSON event)>
```

Sign it with the user's key (NIP-07 or a bunker). Do not mint a long-lived delete token, and do not log the header.

## The other verbs

| Action | Request |
|---|---|
| List a user's blobs | `GET /list/<pubkey-hex>` with `t=list` if the server demands auth (BUD-12) |
| Delete | `DELETE /<sha256>` with `t=delete` and a matching `x` |
| Mirror | `PUT /mirror` body `{"url":"https://.../<sha256>.ext"}`, auth `t=upload`, `x` is the hash of the blob (BUD-04) |
| Optimize media | `PUT /media` is optional and may change the bytes (BUD-05). The sha256 in the descriptor is the stored file, not the file you sent |

## nak

If the `nak` skill is loaded and v0.21+ is installed, prefer it over hand-rolled HTTP:

```bash
nak blossom upload --help
nak blossom list --help
nak blossom mirror --help
```

The secret still belongs in `NOSTR_SECRET_KEY`, not in `--sec`.

## Rules

1. Hash before you trust. The URL's hex and the descriptor's `sha256` must equal `sha256(bytes)`.
2. One auth event, one verb, one hash, a short expiry. An unscoped `delete` token can be replayed on every server until it expires.
3. Put the resulting URL in the note (`imeta` or the URL itself). The blob server is not a relay and does not store the Nostr event.
4. Kind 10063 is the server list. Kind 24242 is the auth token. Do not swap them.
