// nostr-skills-registry: publish + discover AI skills as kind:31990
import { NDK } from '@nostr-dev-kit/ndk';

const ndk = new NDK({ explicitRelayUrls: ['wss://relay.damus.io','wss://nos.lol','wss://relay.primal.net'] });
await ndk.connect();

export async function register(name, cat, repo, pubkey) {
  const ev = ndk.event({
    kind: 31990,
    tags: [['d', name], ['category', cat], ['repo', repo], ['p', pubkey], ['verified', 'wot']],
    content: `AI skill: ${name} (${cat})`
  });
  await ev.publish();
  console.log('[reg] published skill', name, '->', ev.id);
}

export async function discover(cat) {
  const sub = ndk.subscribe({ kinds: [31990], '#category': [cat], limit: 50 });
  const out = [];
  sub.on('event', e => out.push({ name: e.tagValue('d'), repo: e.tagValue('repo') }));
  await new Promise(r => setTimeout(r, 4000));
  console.log('[reg] found', out.length, 'skills');
  return out;
}

if (process.argv[1]?.endsWith('register.js')) {
  const get = f => process.argv.find(a=>a.startsWith(f))?.split('=')[1];
  if (get('--name')) await register(get('--name'), get('--cat')||'AI/DVM', get('--repo'), get('--pub')||'');
  if (get('--discover')) await discover(get('--discover'));
}
