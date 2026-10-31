---
name: skill-registry
description: "Publish or look up an AI skill on the Nostr skill registry (kind 31990, topic ai-skill). Use when registering a skill repo, discovering skills by category, or checking why a registry query returned nothing. The connection is Nostr events, not a REST API."
license: MIT
---

# Nostr skill registry

One addressable event per skill per publisher. Kind **31990**, `d` = skill slug. This is the same kind family as NIP-89 app handlers, so every skill event also carries `t=ai-skill`. Query that tag. A query on `#category` matches nothing: relays only index single-letter tags, and this registry does not write a `category` tag.

## Event

```json
{
  "kind": 31990,
  "content": "{\"name\":\"blossom\",\"category\":\"nostr\",\"repo\":\"https://github.com/NostrDanish/blossom-skill\",\"description\":\"...\"}",
  "tags": [
    ["d", "blossom"],
    ["t", "ai-skill"],
    ["t", "skillcat-nostr"],
    ["u", "https://github.com/NostrDanish/blossom-skill"],
    ["alt", "short description"]
  ]
}
```

`u` is the git repo. Category is the `skillcat-<slug>` topic and the `category` field inside `content`. There is no self-issued "verified" tag. Who published it is `pubkey`. Trust that key the way you trust any other Nostr key (their other events, who you follow). A lud16 tag is optional and is only a zap address. This tool does not create NIP-61 nutzaps.

## Publish

```bash
npm install
export NOSTR_SECRET_KEY=...          # nsec or hex, environment only
node register.js --name blossom --cat nostr --repo https://github.com/NostrDanish/blossom-skill --desc "Blossom media uploads"
```

`--dry-run` signs and prints the event, and does not connect. With no key the command prints an unsigned event and exits 2. It does not publish. Same flags work as `--name=blossom`.

Publishing to the default relays (`relay.damus.io`, `nos.lol`, `relay.primal.net`) is a convenience. Also publish to the key's NIP-65 write relays or readers on other relays will not see it. Override with `SKILL_RELAYS=wss://a,wss://b`.

## Discover

```bash
node discover.js --cat nostr
node register.js --discover nostr
```

`--cat` filters `#t: ["skillcat-nostr"]` and drops anything that is not also tagged `ai-skill`. No category lists `#t: ["ai-skill"]`.

## Rules

- The publisher key is the registry identity for that skill name (`d`). A second person publishing the same name is a different event. Do not reuse a personal nsec if you can avoid it.
- Do not put the nsec in the repo, the event, or the command line.
- Kind 31990 without `t=ai-skill` is not one of these records. Ignore it.
