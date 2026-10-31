# nostr-skills-registry

Publish and discover AI skills as Nostr **kind 31990** events (NIP-89 style
handler cards) tagged with `category` and `repo`.

This is a **CLI + skill**, not a hosted marketplace. WoT / `verified` tags
are not computed here. NutZap (NIP-61) is not implemented.

## Install

```bash
npm install
```

Agent install: symlink this repo so `SKILL.md` is on the skill path.

## Publish

```bash
export NOSTR_SECRET_KEY=nsec1…   # never pass on the command line
node register.js --name nostr --cat nostr --repo https://github.com/NostrDanish/nostr-skill
```

## Discover

```bash
node discover.js --cat nostr
# one JSON object per line: name, repo, category, id, pubkey
```

## Collection

Personal (NostrDanish) skills this registry is meant to list include
`nostr-skill`, `nostr-nips-skill`, `nak-skill`, `mkstack-skill`,
`opencode-skill`, `hermes-0xdevbot-skill`, plus focused follow-ons
(`nostr-nwc-skill`, `nostr-blossom-skill`, `nostr-nip-46-skill`,
`nostr-skill-authoring`). Org skills (`leeftoken/*`, `SIP-01/*`) stay
in those orgs; do not republish their private bodies here.

## Proposed new skills (own repos pending)

Complete skill trees live in `proposed/`. They are **not** org skills.
Create empty public repos on **NostrDanish** (not leeftoken / SIP-01)
and push each folder as its own repository:

| Folder | Repo to open |
|---|---|
| `proposed/nostr-nwc-skill` | `NostrDanish/nostr-nwc-skill` |
| `proposed/nostr-blossom-skill` | `NostrDanish/nostr-blossom-skill` |
| `proposed/nostr-nip-46-skill` | `NostrDanish/nostr-nip-46-skill` |
| `proposed/nostr-skill-authoring` | `NostrDanish/nostr-skill-authoring` |

This GitHub App cannot create those remotes (installation is scoped to
the existing skill repos only). After they exist, delete `proposed/`.
