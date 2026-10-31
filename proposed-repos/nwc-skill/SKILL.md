---
name: nwc
description: "Talk to a Lightning wallet over Nostr Wallet Connect (NIP-47). Use for pay_invoice, make_invoice, get_balance, lookup_invoice, get_info, or a nostr+walletconnect URI. The URI is a secret. Triggers on NWC, NIP-47, kind 23194, kind 13194, wallet connect, zap payment."
license: CC-BY-SA-4.0
---

# Nostr Wallet Connect (NIP-47)

A client asks a wallet service to pay or create an invoice. The messages are encrypted events on a relay. The spec is https://github.com/nostr-protocol/nips/blob/master/47.md — fetch the raw file (`https://raw.githubusercontent.com/nostr-protocol/nips/master/47.md`) before adding a method this skill does not list. NIP extensions past the five core methods live in that file under "Extensions".

## The URI is a secret

```
nostr+walletconnect://<wallet-pubkey>?relay=<wss>&secret=<64-hex>
```

`secret` is the **client's** private key (32-byte hex). Anyone with the URI can spend from that wallet, up to whatever budget the wallet attached. Treat it like an nsec:

- Read it from an environment variable or a mode-0600 file. Never from a chat message you then echo, never from a command-line flag, never from a log.
- Do not commit it. Do not put it in an event's content or tags in the clear.
- `nostr-tools` `parseConnectionString` returns the secret. Do not print that object.
- If a URI shows up in a group chat, tell the owner to revoke it at the wallet and issue a new one. Do not repeat the string.

There may be more than one `relay` query parameter. Use all of them.

## Three events

| Kind | Who publishes | What |
|---|---|---|
| 13194 | wallet | Replaceable info. `content` is a space-separated method list. Tags: `encryption` (`nip44_v2` and maybe `nip04`), optional `extensions` |
| 23194 | client | Request. Encrypted `content`. One `p` tag = wallet pubkey. Optional `expiration` |
| 23195 | wallet | Response. Encrypted `content`. One `p` tag = client pubkey. One `e` tag = the request id |

23194 and 23195 are ephemeral. They are not a receipt you can look up tomorrow. Persist the result yourself if you need it.

## Encryption

Prefer **NIP-44 v2** (`encryption` tag value `nip44_v2` on the request).

Read the wallet's kind 13194 first.

- The tag lists `nip44_v2`: use NIP-44. The client key is the URI secret. The other key is the wallet pubkey.
- The tag is absent, or it lists only `nip04`: the wallet is on the old scheme. NIP-04 is deprecated. Say so, and use it only if the user still wants that wallet. Do not advertise a new wallet as NIP-04-only.
- Put the scheme you used in an `encryption` tag on the request so the wallet can read it.

`nostr-tools` 2.25 `makeNwcRequestEvent` still encrypts with NIP-04 and only builds `pay_invoice`. Do not use it for a wallet that speaks NIP-44. `parseConnectionString` is fine. Encrypt with the `nostr` skill's NIP-44 (or a maintained library), not with a one-off.

## Request and response bodies

Both are JSON inside the ciphertext.

Request:

```json
{"method":"pay_invoice","params":{"invoice":"<bolt11>"}}
```

Response:

```json
{"result_type":"pay_invoice","error":null,"result":{"preimage":"<hex>"}}
```

`error` is `null` on success, otherwise `{"code":"...","message":"..."}` and `result` is null. Codes you will actually see: `RATE_LIMITED`, `NOT_IMPLEMENTED`, `INSUFFICIENT_BALANCE`, `QUOTA_EXCEEDED`, `RESTRICTED`, `UNAUTHORIZED`, `INTERNAL`, `OTHER`, `PAYMENT_FAILED`, `NOT_FOUND`, `UNSUPPORTED_ENCRYPTION`. `UNAUTHORIZED` means this URI cannot do that. Do not retry it in a loop.

## Core methods

| method | params | result you need |
|---|---|---|
| `pay_invoice` | `invoice` (bolt11), optional `amount` msat if the invoice has none | `preimage` |
| `make_invoice` | `amount` msat, optional `description`, `description_hash`, `expiry` seconds | `invoice` (bolt11), `payment_hash` |
| `lookup_invoice` | `payment_hash` or `invoice` | `settled` (bool), `preimage` if settled, amounts in msat |
| `get_balance` | none | `balance` msat |
| `get_info` | none | `alias`, `color`, `pubkey`, `network`, `methods`, `notifications` |

Amounts in params and results are **millisatoshis**. A bolt11 invoice already carries an amount; do not also send a conflicting `amount`.

Confirm `pay_invoice` is in the info event's content before calling it. A wallet that only implements `get_balance` will return `NOT_IMPLEMENTED`.

## Pay flow

1. Parse the URI inside the process. Do not log it.
2. Fetch kind 13194 from the URI's relays (`authors` = wallet pubkey). Pick `nip44_v2` if it is offered.
3. Build the request JSON. Encrypt it to the wallet pubkey with the URI secret. Sign kind 23194 with that same secret. Tag `p` = wallet pubkey, and `encryption` = the scheme.
4. Publish to the URI's relays. Subscribe for kind 23195, `authors` = wallet, `#e` or `#p` matching this client, until you see the `e` tag of your request or a timeout.
5. Decrypt with the wallet pubkey and the URI secret. If `error` is set, stop and report the code. If `result.preimage` is set, the invoice is paid. A missing response is unknown, not a failure and not a success: look the invoice up with `lookup_invoice` before paying again.

## Rules

1. Never pay twice because the first response was slow. `lookup_invoice` first.
2. The client key signs the request and encrypts it. It is not the user's Nostr nsec. Do not reuse a person's nsec as the NWC secret.
3. Zaps (NIP-57) are a different event. NWC only pays the bolt11. Verifying a zap receipt is the `nostr` skill's job.
4. A budget or an allow-list is the wallet's job. If you are writing the wallet side, reject methods the user did not enable, and do not log the URI.
