# NIP-46 pairing notes

## Key roles

| Key | Who holds it | Used for |
|---|---|---|
| user-keypair | bunker | `sign_event`, the identity others see |
| remote-signer-keypair | bunker | encrypt 24133 to the client; **may** equal user |
| client-keypair | client | encrypt 24133 to the bunker; disposable |

## Connect metadata

JSON-stringified `{name, url, image}` in the 4th `connect` param. To send
metadata without perms, pass `""` as perms so metadata stays 4th.

## Permissions string

`nip44_encrypt,sign_event:4` = encrypt + sign kind 4 only. Request least
privilege. A bunker should prompt the human.

## Discovery (optional)

Signer MAY publish NIP-89 kind 31990 with `k` = `24133`, and NIP-05
`nostr.json` with a `nip46` block (`relays`, `nostrconnect_url` template).
Clients that pre-build `nostrconnect://` SHOULD verify the 31990 author
appears in that `nostr.json`.

## Related

- NIP-07: in-browser signer (`window.nostr`) — not this skill.
- NIP-55: Android signer.
- `NostrDanish/0xsigner` / `leeftoken/Leef-signer`: product signers; this
  skill is the protocol, not those codebases.
