# blossom-skill

Agent skill for [Blossom](https://github.com/hzrd149/blossom) media: upload, fetch, list, mirror, delete, and the Nostr events around them (kind 10063 server list, kind 24242 authorization, NIP-B7).

NIP-96 is not the upload path. The BUDs are. This skill tells an agent which BUD to follow and which headers and tags are required, and to use `nak blossom` when the CLI is installed.

Pairs with [nostr-skill](https://github.com/NostrDanish/nostr-skill) and [nak-skill](https://github.com/NostrDanish/nak-skill).

## Install

Copy or symlink the directory that contains `SKILL.md` into the agent's skills path.

## License

CC-BY-SA-4.0
