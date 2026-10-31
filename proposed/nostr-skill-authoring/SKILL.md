---
name: nostr-skill-authoring
description: Author or audit agent skills for this collection (Cursor, Hermes, Kimi-style). Use when writing SKILL.md, splitting references/, adding scripts, choosing frontmatter, or deciding whether a topic is a new repo vs a section. Triggers on "write a skill", "SKILL.md", "skill frontmatter", "Hermes skill", progressive disclosure.
---

# Authoring skills for this collection

A skill changes **agent behavior**. If a paragraph would not change what
the agent does, it does not belong in `SKILL.md`.

## New repo vs section

| Put it in an existing skill when | Make a **new NostrDanish repo** when |
|---|---|
| Same trigger, more depth (move to `references/`) | Different trigger words and threat model |
| A pointer + link is enough | Agents would load a 400-line tangent |
| Org/product fact (LEEF/SAT/WAX/SIP-01) | Generic Nostr capability (NWC, Blossom, NIP-46) |

**Personal skills → `NostrDanish/<name>-skill`.** Do not open these under
`leeftoken` or `SIP-01`. Org repos stay product-specific.

## Layout

```
SKILL.md                 name + description + rules + routing table
references/*.md          loaded only when the table says so
scripts/                 runnable, stdlib-first, selftest if crypto
README.md                humans + install (Hermes + Cursor)
LICENSE                  if the skill is public
```

## Frontmatter

```yaml
---
name: short-kebab   # folder name
description: >-
  What + when to load + trigger phrases.
  Cursor uses this for discovery — put the verbs here.
---
```

Hermes extra keys (`metadata.hermes`, `required_environment_variables`)
only in Hermes persona skills. Hermes descriptions stay short (~60
chars) if the hub indexer truncates; Cursor descriptions should be long
and trigger-rich.

## Progressive disclosure

1. `SKILL.md`: memorize-the-model, routing table, non-negotiable rules.
2. `references/`: spec snapshots, command catalogs, playbooks.
3. Never paste a full NIP into `SKILL.md`. Teach **fetch** (`nostr-nips`)
   or keep a dated snapshot labelled stale.

## Rules of thumb

1. One job per skill. Name the sibling skills and when **not** to use this one.
2. Safety first if keys, money, or mainnet exist. Checklists beat slogans.
3. Scripts: stdin for JSON (`-` / `/dev/stdin`), no secrets on argv if
   avoidable, `selftest` for crypto, no network in unit tests.
4. Do not invent numbers, kinds, or memo formats. `verify` / `TODO` /
   fail closed.
5. Host-agnostic: Cursor shell ≠ OpenClaw `sessions_spawn`. Document both
   or neither.
6. Every path mentioned in `SKILL.md` must exist (Hermes install scanner
   + our `validate_skill.py` pattern).
7. No secrets, nsecs, NWC URIs, or real WIFs in the repo.

## Collection map

| Skill | Job |
|---|---|
| `nostr` | Offline keys, sign, query, client/relay refs |
| `nostr-nips` | Live NIP fetch |
| `nak` | fiatjaf CLI |
| `nostr-nwc` | NIP-47 wallet connect |
| `nostr-blossom` | NIP-B7 media |
| `nostr-nip-46` | Remote signer |
| `mkstack` + `opencode` | Scaffold Nostr web apps |
| `sip-01` | Kind 39697 search index |
| `nostr-skills-registry` | Publish kind 31990 cards |
| `0xdevbot-persona` | Hermes Telegram/Nostr persona |
| `leef-*` / `wax-*` | Org product + chain (private) |

Review checklist: [references/review-checklist.md](references/review-checklist.md).
