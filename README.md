# nostr-skills-registry

A registry of agent skills on Nostr. Each skill is one addressable event:

- kind **30078** (NIP-78 application data)
- `d` tag `skill:<name>`
- `t` tag `skill`, plus one `t` tag per category word (`AI/DVM` becomes `ai` and `dvm`)
- `r` tag with the repository URL
- `content` JSON: `name`, `summary`, `repo`, `version`

Stock relays index single-letter tags, so discovery is a normal filter:

```json
{"kinds":[30078],"#t":["skill","nostr"],"limit":50}
```

Kind 31990 is NIP-89 handler information (which app opens a kind). This registry does not publish that kind, and it does not use a `category` tag, because relays will not filter a multi-letter tag name.

## Publish

The secret stays in the environment. It is not an argument and it is not printed.

```bash
npm install
export NOSTR_SECRET_KEY    # nsec or 64-char hex
node register.js --name blossom --cat nostr --repo https://github.com/NostrDanish/blossom-skill --summary "Blossom blob uploads"
```

## Discover

```bash
node discover.js --cat nostr
```

## Check

```bash
npm test
```

The test builds and verifies a signed event locally. It does not contact a relay.
