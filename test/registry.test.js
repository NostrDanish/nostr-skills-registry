import test from 'node:test'
import assert from 'node:assert/strict'
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { buildSkillEvent, categoryTags, signSkill, SKILL_KIND } from '../register.js'

test('category tags are single-letter-name t tags a relay can filter', () => {
  const tags = categoryTags('AI/DVM')
  assert.deepEqual(tags, [['t', 'skill'], ['t', 'ai'], ['t', 'dvm']])
  assert.equal(tags.every(t => t[0] === 't' && t[0].length === 1), true)
})

test('skill event is addressable NIP-78, not a NIP-89 handler', () => {
  const secret = generateSecretKey()
  const unsigned = buildSkillEvent({
    name: 'blossom',
    cat: 'nostr',
    repo: 'https://github.com/NostrDanish/blossom-skill',
    summary: 'Blossom uploads',
    version: '1.0.0',
    pubkey: getPublicKey(secret),
  })
  assert.equal(unsigned.kind, SKILL_KIND)
  assert.equal(SKILL_KIND, 30078)
  assert.equal(unsigned.tags.find(t => t[0] === 'd')[1], 'skill:blossom')
  assert.equal(unsigned.tags.some(t => t[0] === 'category'), false)
  const signed = signSkill(unsigned, secret)
  assert.equal(signed.pubkey, getPublicKey(secret))
  assert.match(signed.id, /^[0-9a-f]{64}$/)
  assert.match(signed.sig, /^[0-9a-f]{128}$/)
})

test('rejects a bad name and a non-url repo before signing', () => {
  assert.throws(() => buildSkillEvent({ name: 'Bad Name', repo: 'https://example.com' }))
  assert.throws(() => buildSkillEvent({ name: 'ok', repo: 'not a url' }))
})
