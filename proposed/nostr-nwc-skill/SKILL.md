---
name: nostr-nwc
description: Implement or debug Nostr Wallet Connect (NIP-47) — connection URIs (nostr+walletconnect://), kind 13194 info, encrypted kind 23194/23195 request/response, pay_invoice / make_invoice / get_balance, NIP-44 vs legacy NIP-04 encryption, and zap-from-wallet flows. Use when the task involves NWC, wallet connect URIs, remote Lightning payments from a Nostr client, or kinds 13194/23194/23195. Load `nostr` for signing/NIP-44; load `nostr-nips` for live NIP-47 text.
---

# Nostr Wallet Connect (NIP-47)

A **client** talks to a **wallet service** over relays with a **dedicated
connection key**, not the user's identity nsec. Payments must not be
linkable to the user's main pubkey.

Live spec: fetch NIP-47 via the `nostr-nips` skill. Extensions live at
https://github.com/nostr-wallet-connect/nwc (`01.md` = this core).

## Connection URI (the secret)

```
nostr+walletconnect://<wallet-service-hex-pubkey>?relay=<url>&secret=<32-byte-hex>[&lud16=name@domain]
```

- `relay` (required, may repeat): where the wallet listens.
- `secret` (required): **client** signing/encryption key. 32-byte hex.
  The wallet uses the corresponding **pubkey** of this secret. The wallet
  SHOULD NOT store the secret itself.
- `lud16` (recommended): Lightning address for profile setup.

This URI **is** a spending credential. Never log it, commit it, put it in
a kind-0, or echo it in chat. Same class as an nsec / NWC string in the
0xDevBot secrets rule.

## Kinds

| Kind | Class | Who | What |
|---|---|---|---|
| 13194 | replaceable | wallet | plaintext capabilities: `pay_invoice get_balance …`; tags `encryption`, `extensions` |
| 23194 | ephemeral | client | encrypted request; `p` = wallet pubkey; optional `expiration` |
| 23195 | ephemeral | wallet | encrypted response; `p` = client pubkey; `e` = request id |

No `encryption` tag on the info event ⇒ assume **NIP-04** (legacy). Prefer
`nip44_v2` when the info event lists it. Client puts `["encryption","nip44_v2"]`
on each request. Wallet replies `UNSUPPORTED_ENCRYPTION` if it cannot.

## Commands (core)

`pay_invoice` `{invoice, amount?, metadata?}` → `{preimage, fees_paid?}`
`make_invoice` `{amount` msats`, description?, expiry?}` → invoice object
`lookup_invoice` `{payment_hash? \| invoice?}`
`get_balance` → `{balance}` msats
`get_info` → alias, network, `methods`, `extensions`

Errors: `RATE_LIMITED`, `NOT_IMPLEMENTED`, `INSUFFICIENT_BALANCE`,
`QUOTA_EXCEEDED`, `RESTRICTED`, `UNAUTHORIZED`, `INTERNAL`,
`UNSUPPORTED_ENCRYPTION`, `PAYMENT_FAILED`, `NOT_FOUND`, `OTHER`.

## Client flow

1. Parse URI. Store `secret` + wallet pubkey + relays in a secret store.
2. `REQ` kind 13194 from `authors=[wallet-pubkey]` on those relays. Read
   methods + encryption.
3. On pay: build JSON `{method, params}`, NIP-44 encrypt to wallet pubkey
   with the URI secret, publish kind 23194 (`p` wallet).
4. Subscribe kind 23195 `#e`/`#p` on the same relays. Decrypt. Check
   `error` vs `result`. For zaps, still verify the **bolt11 paid** — a
   signed 23195 is not a NIP-57 receipt.
5. Use relays that keep ephemeral events and stay connected. Dedicated
   custodial relays may require NIP-42.

## Non-negotiable

1. Never use the user's identity nsec as the NWC `secret`.
2. Never put the URI in source, `.env.example`, or a published event.
3. Budget / `QUOTA_EXCEEDED` is a feature — do not retry `pay_invoice` in
   a tight loop.
4. Amounts are **msats**. Do not mix with sats without converting.
5. Fetch live NIP-47 if a field name is uncertain. Extensions (`02`…) are
   optional and wallet-specific.

Details: [references/uri-and-commands.md](references/uri-and-commands.md).
