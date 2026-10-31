# NWC URI and command notes

## Parse

Query keys are URL-decoded. Multiple `relay=` values are all valid listen
relays — publish requests to all of them. `secret` is hex, not nsec.

Example (do not reuse this secret):

```
nostr+walletconnect://b889ff5b1513b641e2a139f661a661364979c5beee91842f8f0ef42ab558e9d4?relay=wss%3A%2F%2Frelay.damus.io&secret=71a8c14c1407c113601079c4302dab36460f0ccd0ad506f1f2dc73b5100e4f3c
```

## Encryption negotiation

1. Read info `["encryption", "nip44_v2 nip04"]`.
2. Pick `nip44_v2` if both sides have it.
3. Tag the request. Missing tag = NIP-04.

Use the `nostr` skill's NIP-44 helpers. Do not hand-roll.

## Request / response JSON

Request content (before encrypt):

```json
{ "method": "pay_invoice", "params": { "invoice": "lnbc…" } }
```

Response content:

```json
{
  "result_type": "pay_invoice",
  "error": null,
  "result": { "preimage": "…" }
}
```

On failure `error` is `{code, message}` and `result` is null.

## Zaps

NWC pays a bolt11. A NIP-57 zap still needs a kind 9735 receipt from the
recipient's zap wallet and invoice verification. Do not treat a 23195
`preimage` as a zap receipt.

## Libraries

Prefer an audited NWC client (e.g. Alby NWC, nostr-tools NWC helpers)
over a from-scratch RPC. This skill is the protocol map, not a new wallet.
