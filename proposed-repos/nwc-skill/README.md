# nwc-skill

Agent skill for [NIP-47](https://github.com/nostr-protocol/nips/blob/master/47.md) Nostr Wallet Connect: pay an invoice, create one, and read a balance through an encrypted relay session.

The `nostr+walletconnect://` URI is a spending secret. The skill's first rule is to keep it out of logs, flags, and chat. It also records that `nostr-tools` 2.25 `makeNwcRequestEvent` still encrypts with deprecated NIP-04, so a new client should use NIP-44 when the wallet advertises it.

Pairs with [nostr-skill](https://github.com/NostrDanish/nostr-skill) for NIP-44 and for zap receipts, which are not NWC.

## Install

Copy or symlink the directory that contains `SKILL.md` into the agent's skills path.

## License

CC-BY-SA-4.0
