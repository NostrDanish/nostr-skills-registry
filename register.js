// Publish and discover AI skills as addressable kind 31990 events.
// Discovery uses the single-letter `t` tag. Relays do not index `category`.
import { finalizeEvent, verifyEvent } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { Relay } from 'nostr-tools/relay'

export const DEFAULT_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net']

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/

export function flag(name, argv = process.argv) {
  const eq = argv.find((a) => a.startsWith(name + '='))
  if (eq) return eq.slice(name.length + 1)
  const i = argv.indexOf(name)
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1]
  return undefined
}

export function hasFlag(name, argv = process.argv) {
  return argv.includes(name) || argv.some((a) => a.startsWith(name + '='))
}

export function categorySlug(cat) {
  return String(cat || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'general'
}

export function skillEvent({ name, category, repo, description, lud16, createdAt }) {
  if (!NAME_RE.test(name)) throw new Error('name must be a lowercase slug')
  repo = String(repo || '').replace(/\.git$/, '').replace(/\/$/, '')
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(repo)) {
    throw new Error('repo must be an https://github.com/<owner>/<name> URL')
  }
  const slug = categorySlug(category)
  const text = (description || `AI skill ${name}`).slice(0, 280)
  const tags = [
    ['d', name],
    ['t', 'ai-skill'],
    ['t', `skillcat-${slug}`],
    ['u', repo],
    ['alt', text.slice(0, 200)],
  ]
  if (lud16) tags.push(['lud16', lud16])
  return {
    kind: 31990,
    created_at: createdAt ?? Math.floor(Date.now() / 1000),
    content: JSON.stringify({ name, category: slug, repo, description: text }),
    tags,
  }
}

export function secretKeyBytes(raw = process.env.NOSTR_SECRET_KEY || '') {
  const s = raw.trim()
  if (!s) return null
  if (s.startsWith('nsec1')) {
    const decoded = nip19.decode(s)
    if (decoded.type !== 'nsec') throw new Error('NOSTR_SECRET_KEY is not an nsec')
    return decoded.data
  }
  if (!/^[0-9a-fA-F]{64}$/.test(s)) throw new Error('NOSTR_SECRET_KEY must be nsec1 or 64 hex chars')
  return Uint8Array.from(Buffer.from(s, 'hex'))
}

export function signSkill(unsigned) {
  const sk = secretKeyBytes()
  if (!sk) throw new Error('set NOSTR_SECRET_KEY to publish')
  const signed = finalizeEvent(unsigned, sk)
  if (!verifyEvent(signed)) throw new Error('signed event failed verification')
  return signed
}

export function relaysFromEnv() {
  const raw = process.env.SKILL_RELAYS
  if (!raw) return DEFAULT_RELAYS
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export async function publish(signed, relays = relaysFromEnv()) {
  const results = []
  for (const url of relays) {
    let relay
    try {
      relay = await Relay.connect(url)
      await relay.publish(signed)
      results.push({ url, ok: true })
    } catch (err) {
      results.push({ url, ok: false, error: err && err.message ? err.message : String(err) })
    } finally {
      if (relay) relay.close()
    }
  }
  return results
}

export async function discover(category, relays = relaysFromEnv()) {
  const slug = category ? categorySlug(category) : null
  const filter = slug
    ? { kinds: [31990], '#t': [`skillcat-${slug}`], limit: 100 }
    : { kinds: [31990], '#t': ['ai-skill'], limit: 100 }
  const byId = new Map()
  await Promise.all(relays.map(async (url) => {
    let relay
    try {
      relay = await Relay.connect(url)
      const events = await relay.query([filter])
      for (const ev of events) {
        const topics = ev.tags.filter((t) => t[0] === 't').map((t) => t[1])
        if (!topics.includes('ai-skill')) continue
        byId.set(ev.id, ev)
      }
    } catch (err) {
      console.error(`[reg] ${url}: ${err && err.message ? err.message : err}`)
    } finally {
      if (relay) relay.close()
    }
  }))
  return [...byId.values()].map((ev) => {
    let body = {}
    try { body = JSON.parse(ev.content) } catch { /* content is display-only */ }
    const tag = (n) => ev.tags.find((t) => t[0] === n)?.[1]
    return {
      name: tag('d') || body.name,
      repo: tag('u') || body.repo,
      category: body.category,
      description: body.description,
      pubkey: ev.pubkey,
      id: ev.id,
    }
  })
}

async function main() {
  const argv = process.argv
  if (hasFlag('--discover', argv)) {
    const rows = await discover(flag('--discover', argv) === 'true' ? flag('--cat', argv) : flag('--discover', argv))
    console.log(JSON.stringify(rows, null, 2))
    return
  }
  const name = flag('--name', argv)
  if (!name) {
    console.error('usage: node register.js --name <slug> --repo <github url> [--cat <slug>] [--desc <text>] [--lud16 <addr>] [--dry-run]')
    console.error('       node discover.js --cat <slug>')
    process.exit(1)
  }
  const unsigned = skillEvent({
    name,
    category: flag('--cat', argv) || 'general',
    repo: flag('--repo', argv),
    description: flag('--desc', argv),
    lud16: flag('--lud16', argv),
  })
  if (!secretKeyBytes()) {
    console.error('NOSTR_SECRET_KEY is not set; printing an unsigned event. Nothing was published.')
    console.log(JSON.stringify(unsigned, null, 2))
    process.exit(2)
  }
  const signed = signSkill(unsigned)
  if (hasFlag('--dry-run', argv)) {
    console.log(JSON.stringify(signed))
    return
  }
  const results = await publish(signed)
  console.log(JSON.stringify({ id: signed.id, pubkey: signed.pubkey, results }, null, 2))
  if (!results.some((r) => r.ok)) process.exit(1)
}

const entry = process.argv[1] || ''
if (entry.endsWith('register.js')) main()
