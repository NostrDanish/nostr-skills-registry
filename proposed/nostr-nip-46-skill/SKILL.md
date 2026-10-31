---
name: nostr-nip-46
description: Implement Nostr remote signing / bunkers (NIP-46). Use for bunker:// and nostrconnect:// pairing, kind 24133 request/response, connect / sign_event / get_public_key / nip44_* / logout, auth_url challenges, and remote-signer-pubkey vs user-pubkey. Triggers on "NIP-46", "bunker", "remote signer", "nostrconnect", "kind 24133". Load `nostr` for NIP-44; `nak` for `nak event --connect`.
---

# NIP-46 remote signing

The **remote-signer** (bunker) holds the **user** nsec. The **client**
holds a disposable **client-keypair**. They talk with kind **24133**
events, NIP-44 encrypted, `p`-tagged at each other.

**`remote-signer-pubkey` ≠ `user-pubkey`.** After `connect`, the client
MUST call `get_public_key` to learn the user's pubkey. Do not assume they
are the same.

Live spec: fetch NIP-46 via `nostr-nips`.

## Two pairing flows

### `bunker://` (signer starts)

```
bunker://<remote-signer-pubkey>?relay=<wss://…>&secret=<optional-one-time>
```

Client sends a `connect` request (include `optional_client_metadata`).
The `secret` is single-use; the signer ignores a replayed secret.

### `nostrconnect://` (client starts)

```
nostrconnect://<client-pubkey>?relay=<wss://…>&secret=<required>&perms=…&name=…
```

Signer sends a `connect` **response**. Client learns `remote-signer-pubkey`
from the response author and **must** check the returned `secret`.

`perms` is `method[:kind]`, e.g. `nip44_encrypt,sign_event:1,sign_event:3`.

## Kind 24133

Request (client → signer):

```
content = nip44({ id, method, params: [strings…] })
tags = [["p", remote-signer-pubkey]]
pubkey = client-pubkey
```

Response (signer → client): same kind; `result` string or JSON string;
`error` set means failure. Unknown methods MUST error.

| Method | Params | Result |
|---|---|---|
| `connect` | `[secret?, perms?, metadata?]` | `"ack"` or secret |
| `get_public_key` | `[]` | user pubkey hex |
| `sign_event` | `[json event template]` | signed event JSON |
| `ping` | `[]` | `"pong"` |
| `nip44_encrypt` / `nip44_decrypt` | `[third_party_pubkey, text]` | ciphertext / plaintext |
| `nip04_*` | same | legacy only |
| `switch_relays` | `[]` | relay list or null |
| `logout` | `[]` | `"ack"` — then delete client key |

`auth_url` result: show `error` as a URL, keep listening on the same
request `id` for the real response.

Immediately after connect, send `switch_relays` and honor the new list.

## Rules

1. Never move the user nsec into the client "to make it easier."
2. Client keypair is disposable; delete it on logout even if `logout`
   was not acked.
3. `logout` is a courtesy, not a security boundary.
4. Metadata (`name`/`url`/`image`) is a display hint — signers must not
   authorize from it.
5. `nak event --connect bunker://…` is the CLI path (see `nak` skill).

Details: [references/pairing.md](references/pairing.md).
