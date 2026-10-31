---
name: nostr-skills-registry
description: Publish and discover AI skills as Nostr kind 31990 (NIP-89 handler-information) events tagged with category and repo URL. Use when registering a skill to the Nostr-native registry, listing skills by category, or debugging kind-31990 skill cards. Not a protocol tutorial — load `nostr` for signing rules.
---

# Nostr skills registry

Kind **31990** addressable events (`d` = skill name) advertised on public
relays. This repo is the **publisher/discovery CLI**, not a catalog of
skill bodies.

## Event shape

```
kind: 31990
tags:
  ["d", "<skill-name>"]
  ["category", "<cat>"]          # e.g. AI/DVM, nostr, wax
  ["repo", "https://github.com/…"]
  ["k", "31990"]
content: short description
```

`verified` / WoT tags are **claims**. Do not treat a `verified` tag as
proof unless you independently check the publisher pubkey against a
trust list.

NutZap / NIP-61 monetization is **not implemented** here. Do not tell
the user they can zap a listing through this CLI.

## CLI

```bash
npm install
export NOSTR_SECRET_KEY=nsec1…   # or 64-hex; never pass --sec on argv
node register.js --name nostr --cat nostr --repo https://github.com/NostrDanish/nostr-skill
node discover.js --cat nostr
```

`discover.js` prints one JSON object per event (name, repo, id, pubkey,
category). Default relays: damus, nos.lol, primal.

## Rules

1. Sign with a dedicated publisher key, not a user's daily nsec, unless
   they explicitly want the listing under that identity.
2. Never log the secret. The CLI reads `$NOSTR_SECRET_KEY` only.
3. `d` is the skill name. Republishing the same `d` from the same key
   replaces the previous card.
4. Validate `--repo` is an https URL before publish.
