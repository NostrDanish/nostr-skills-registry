# nostr-skills-registry

A Nostr registry of AI skills. Each skill is an addressable **kind 31990** event from its publisher:

- `d` — skill slug
- `t` — `ai-skill`, and `skillcat-<category>` so a relay can filter it
- `u` — `https://github.com/<owner>/<repo>`
- `content` — JSON `{name, category, repo, description}`

Relays do not index a multi-letter `category` tag. Discovery queries `#t`. There is no self-asserted verification tag. An optional `lud16` tag is a zap address; this publisher does not create nutzaps.

The agent instructions are in [`SKILL.md`](SKILL.md).

## Publish

```bash
npm install
export NOSTR_SECRET_KEY=...     # nsec or 64 hex chars. Never as a flag.
node register.js --name blossom --cat nostr \
  --repo https://github.com/NostrDanish/blossom-skill \
  --desc "Blossom media uploads"
```

`--dry-run` signs and prints the event without connecting. No key: the unsigned event is printed and the process exits 2.

## Discover

```bash
node discover.js --cat nostr
```

Default relays: `wss://relay.damus.io`, `wss://nos.lol`, `wss://relay.primal.net`. Set `SKILL_RELAYS` to a comma-separated list. Publish to the key's write relays as well, or most clients will not see the event.
