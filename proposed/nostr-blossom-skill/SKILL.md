---
name: nostr-blossom
description: Upload, fetch, and recover Nostr media via Blossom (NIP-B7 / BUDs). Use when implementing kind 10063 server lists, SHA-256 addressed blobs, PUT /upload, GET/HEAD /<sha256>, kind 24242 / NIP-98-style auth, or replacing dead NIP-96 servers. Triggers on "Blossom", "BUD-01", "kind 10063", "kind 24242", media CDN, blob hash URLs. Load `nostr` for signing; `nostr-nips` for live NIP-B7.
---

# Blossom (NIP-B7)

Blossom servers store files by **SHA-256**. A URL that ends in 64 hex
chars (optional extension) is a blob id. If that URL 404s, look up the
author's kind **10063** server list and try the same hash on another host.

Canonical BUDs: https://github.com/hzrd149/blossom
NIP-B7 is the Nostr-facing subset (kind 10063 + recovery). Upload/auth
are BUDs, not the NIP text alone.

## Kind 10063 (replaceable)

```json
{
  "kind": 10063,
  "tags": [
    ["server", "https://blossom.example"],
    ["server", "https://cdn.blossom.cloud"]
  ],
  "content": ""
}
```

Fetch from the **author's** write/outbox relays (NIP-65), not a random
public relay only.

## Fetch / recover

1. Take the 64-hex from the dead URL (strip `.png` etc.).
2. `REQ` kind 10063 `authors=[event.pubkey]`.
3. For each `server` tag: `GET https://host/<sha256>` or `HEAD` first
   (BUD-01). Optional extension is allowed; `Content-Type` is authoritative.
4. **Verify** `sha256(body) === hex`. If it does not match, discard.
5. `Sunset` header is advisory only. Re-probe later; the blob can return.

Do not treat a 3xx redirect as success unless the new URL still contains
the same hash (BUD-01).

## Upload (BUD-02 family)

Typical flow (confirm against the current BUD before coding):

1. `sha256` the bytes locally.
2. Sign an auth event (kind **24242** is the blossom blob-auth kind;
   some servers also accept NIP-98 kind 27235). Tags usually include
   `t` = `upload` / `delete` and `x` = hex hash, plus a short `expiration`.
3. `PUT /upload` with `Authorization: Nostr <base64(json event)>` and
   the raw body. Header `Authorization` must be CORS-allowed.
4. Server returns a URL ending in the same hash. Publish that URL on the
   Nostr event (`imeta` / NIP-92), and ensure kind 10063 lists a server
   that actually has the blob.

NIP-96 is **unrecommended**. Do not add new NIP-96 integrations.

## Rules

1. Always hash-verify downloads. A 200 with the wrong bytes is a fail.
2. Never upload with the user's nsec in a browser — NIP-07 / NIP-46.
3. One blob, many mirrors. Recovery is the product; a single CDN URL is
   not enough.
4. Fail closed on unknown auth schemes. Fetch the BUD.

More: [references/buds.md](references/buds.md).
