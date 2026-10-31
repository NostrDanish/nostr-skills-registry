# nostr-skills-registry

Publish and discover AI skills as Nostr **kind 31990** events (NIP-89 handler-information shape), tagged with a category and repo URL.

This repo is a small CLI + agent skill. It does **not** implement Web of Trust verification or NIP-61 NutZaps.

## Setup

```bash
npm install
```

## Publish a skill

```bash
export NOSTR_SECRET_KEY   # nsec or hex; never pass on argv
node register.js --name=ai-pay-agent --cat=AI/DVM --repo=https://github.com/NostrDanish/ai-pay-agent
```

Optional: `NOSTR_RELAYS=wss://relay.damus.io,wss://nos.lol`.

## Discover

```bash
node discover.js --cat=AI/DVM
```

## Agent skill

See `SKILL.md` for routing, tag schema, and what this catalog is *not*.

## License

MIT
