---
name: nostr-skills-registry
description: Publish and discover AI skills as Nostr kind-31990 (NIP-89) events. Use when registering a skill repo, listing skills by category, or wiring a Nostr-native skill catalog.
license: MIT
---

# Nostr skills registry

Publish a skill's name, category, and git URL as an addressable kind **31990** event so other agents can find it on relays. This is **catalog metadata**, not skill execution.

NIP-89 clients treat 31990 as *handler information*. Tags here (`d`, `k`, `web`, `repo`, `t`, `alt`) are a skill-catalog profile of that kind. There is **no WoT verification and no NutZap paywall** in this repo — do not claim either.

## Setup

```bash
cd nostr-skills-registry
npm install
```

Signing key: `export NOSTR_SECRET_KEY` (nsec or hex). Never pass the key on argv. Optional: `NOSTR_RELAYS=wss://relay.one,wss://relay.two`.

## Publish

```bash
NOSTR_SECRET_KEY="$NSEC" node register.js \
  --name=nak \
  --cat=Nostr \
  --repo=https://github.com/NostrDanish/nak-skill
```

## Discover

```bash
node discover.js --cat=Nostr
# or
node register.js --discover --cat=AI/DVM
```

`fetchEvents` waits for EOSE (no fixed 4s sleep). Empty result means no events on the connected relays, not a crash.

## Companion skills

- `nostr` — sign/verify if you are not using this CLI
- `nostr-nips` — read NIP-89 / NIP-32 before extending tags
- `hermes-skill-authoring` — write the skill body this catalog points at
