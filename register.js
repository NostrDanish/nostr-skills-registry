// Publish and discover agent skills as NIP-78 (kind 30078) addressable events.
// Kind 31990 is NIP-89 handler information. It is not used here: a skill listing
// is not an application handler, and a multi-letter tag such as "category" is
// not indexed by stock relays.
import { pathToFileURL } from 'node:url'
import { finalizeEvent, getPublicKey, verifyEvent } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { SimplePool } from 'nostr-tools/pool'

export const SKILL_KIND = 30078
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
]

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/

export function categoryTags(cat) {
  const tags = [['t', 'skill']]
  const seen = new Set(['skill'])
  for (const part of String(cat || 'general').toLowerCase().split(/[^a-z0-9-]+/)) {
    if (!part || seen.has(part)) continue
    seen.add(part)
    tags.push(['t', part])
  }
  return tags
}

export function buildSkillEvent({ name, cat, repo, summary, version, pubkey }) {
  if (!NAME_RE.test(name)) {
    throw new Error('name must be lowercase letters, digits, and hyphens')
  }
  let url
  try {
    url = new URL(repo)
  } catch {
    throw new Error('repo must be an http(s) URL')
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('repo must be an http(s) URL')
  }
  const content = JSON.stringify({
    name,
    summary: summary || `Agent skill: ${name}`,
    repo: url.toString(),
    version: version || '',
  })
  return {
    kind: SKILL_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', `skill:${name}`],
      ...categoryTags(cat),
      ['r', url.toString()],
      ['alt', `Agent skill: ${name}`],
    ],
    content,
    pubkey,
  }
}

export function secretFromEnv(env = process.env) {
  const raw = (env.NOSTR_SECRET_KEY || '').trim()
  if (!raw) {
    throw new Error('Set NOSTR_SECRET_KEY (nsec or 64-char hex). It is never printed.')
  }
  if (raw.startsWith('nsec1')) {
    const decoded = nip19.decode(raw)
    if (decoded.type !== 'nsec') throw new Error('NOSTR_SECRET_KEY is not an nsec')
    return decoded.data
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error('NOSTR_SECRET_KEY must be nsec1... or 64 hex chars')
  }
  return Uint8Array.from(Buffer.from(raw, 'hex'))
}

export function signSkill(unsigned, secret) {
  const event = finalizeEvent({
    kind: unsigned.kind,
    created_at: unsigned.created_at,
    tags: unsigned.tags,
    content: unsigned.content,
  }, secret)
  if (!verifyEvent(event)) throw new Error('signed skill event failed verification')
  return event
}

export async function publish(event, relays = DEFAULT_RELAYS) {
  const pool = new SimplePool()
  try {
    const results = await Promise.allSettled(pool.publish(relays, event))
    const accepted = results.filter(r => r.status === 'fulfilled').length
    if (!accepted) {
      const reason = results.find(r => r.status === 'rejected')
      throw new Error(reason?.reason?.message || 'no relay accepted the event')
    }
    return { id: event.id, accepted, relays: relays.length }
  } finally {
    pool.close(relays)
  }
}

export async function discover(cat, relays = DEFAULT_RELAYS, timeoutMs = 4000) {
  const tags = categoryTags(cat).map(t => t[1])
  const pool = new SimplePool()
  try {
    const events = await pool.querySync(relays, { kinds: [SKILL_KIND], '#t': tags, limit: 50 }, { timeout: timeoutMs })
    return events.map(e => {
      let body = {}
      try { body = JSON.parse(e.content) } catch { /* content is display-only */ }
      const d = e.tags.find(t => t[0] === 'd')?.[1] || ''
      const repo = e.tags.find(t => t[0] === 'r')?.[1] || body.repo || ''
      return { name: body.name || d.replace(/^skill:/, ''), repo, pubkey: e.pubkey, id: e.id }
    })
  } finally {
    pool.close(relays)
  }
}

function arg(flag) {
  const hit = process.argv.find(a => a === flag || a.startsWith(`${flag}=`))
  if (!hit) return undefined
  if (hit.includes('=')) return hit.slice(flag.length + 1)
  const i = process.argv.indexOf(hit)
  return process.argv[i + 1]
}

export async function main(argv = process.argv) {
  if (argv.includes('--help') || argv.length <= 2) {
    console.log(`Usage:
  node register.js --name <name> --repo <https-url> [--cat <category>] [--summary <text>] [--version <semver>]
  node discover.js --cat <category>

NOSTR_SECRET_KEY must be set to publish. Events are kind ${SKILL_KIND} (NIP-78) with d=skill:<name> and t=skill.`)
    return
  }
  if (arg('--name')) {
    const secret = secretFromEnv()
    const unsigned = buildSkillEvent({
      name: arg('--name'),
      cat: arg('--cat') || 'general',
      repo: arg('--repo'),
      summary: arg('--summary'),
      version: arg('--version'),
      pubkey: getPublicKey(secret),
    })
    const event = signSkill(unsigned, secret)
    const result = await publish(event)
    console.log(`[reg] published ${arg('--name')} id=${result.id} accepted=${result.accepted}/${result.relays}`)
    return
  }
  if (arg('--discover') || arg('--cat')) {
    const found = await discover(arg('--discover') || arg('--cat'))
    for (const row of found) console.log(`${row.name}\t${row.repo}`)
    console.error(`[reg] found ${found.length}`)
  }
}

const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main().catch(err => {
    console.error(err.message || err)
    process.exit(1)
  })
}
