# nostr-nwc-skill

Agent skill for **NIP-47 Nostr Wallet Connect**: connection URIs, info/request
/response kinds, encryption negotiation, and Lightning commands.

Does not belong inside [nostr-skill](https://github.com/NostrDanish/nostr-skill)
— payment credentials and wallet RPC are a different trigger and threat model.

## Install

Copy or symlink so `SKILL.md` is on the agent skill path. Pair with `nostr`
and `nostr-nips`.
