# nostr-skills-registry

A Nostr-native index of AI skills. Each skill is one addressable kind **31990** event (the NIP-89 handler-information kind) that points at the skill's repository. It is a pointer, not a copy of the skill, and it does not claim to handle other people's notes.

## Why the old script could not work

- It imported `@nostr-dev-kit/ndk` with no `package.json`, and it connected to relays at import time.
- It filtered on `#category`. Relays only index **single-letter** tags, so that query cannot match.
- A `k` tag on kind 31990 means "this app handles that event kind". A skill announcement must not set `k` unless the skill really is a NIP-89 handler for that kind.

Discovery tags:

| Find | Filter |
|---|---|
| Every skill | `{"kinds":[31990],"#t":["agentskill"]}` |
| One category | `{"kinds":[31990],"#t":["agentskill:media"]}` |

`#t` is a list match (OR). `agentskill:media` is one value, so a category query does not also return every other skill.

## Commands

```bash
python3 scripts/registry.py selftest
python3 scripts/registry.py build \
  --name blossom --cat media \
  --repo https://github.com/NostrDanish/blossom-skill \
  --about "Upload and fetch Blossom blobs"
python3 scripts/registry.py filter --cat media
```

Sign and publish with the `nostr` skill. The secret stays in `NOSTR_SECRET_KEY`:

```bash
python3 scripts/registry.py build ... \
  | NOSTR_SECRET_KEY="$NOSTR_SECRET_KEY" python3 /path/to/nostr-skill/scripts/nostr_key.py sign env - \
  | python3 /path/to/nostr-skill/scripts/nostr_query.py publish wss://nos.lol -
```

Publish to more than one relay. Readers group by the `d` tag (the skill name) and count distinct pubkeys the same way any other addressable event works.

## Two skills that belong in their own repos

`proposed-skills/blossom` and `proposed-skills/nostr-dvm` are finished skills (each has a passing `selftest`). They should live at `NostrDanish/blossom-skill` and `NostrDanish/nostr-dvm-skill`, not in leeftoken or SIP-01. This checkout's GitHub token is an installation token and cannot create repositories on the NostrDanish user (`POST /user/repos` returns 403). They are here so the work is not lost. Move each directory to its own repo when creation is possible, and delete the copies here.

## License

CC-BY-SA-4.0. The proposed skills carry the same license.
