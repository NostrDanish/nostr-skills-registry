#!/usr/bin/env node
// Publish an AI skill card as a kind 31990 event.
import NDK, { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";

const RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
];

function arg(flag, fallback = "") {
  const hit = process.argv.find((a) => a === flag || a.startsWith(`${flag}=`));
  if (!hit) return fallback;
  if (hit.includes("=")) return hit.slice(hit.indexOf("=") + 1);
  const i = process.argv.indexOf(hit);
  return process.argv[i + 1] || fallback;
}

function requireHttpsRepo(repo) {
  let u;
  try {
    u = new URL(repo);
  } catch {
    throw new Error("--repo must be an https URL");
  }
  if (u.protocol !== "https:") throw new Error("--repo must be https");
  return u.toString();
}

export async function register(name, cat, repo) {
  const secret = process.env.NOSTR_SECRET_KEY;
  if (!secret) {
    throw new Error("set NOSTR_SECRET_KEY (nsec1… or 64-hex). Do not pass it on argv.");
  }
  if (!name) throw new Error("--name is required");
  const repoUrl = requireHttpsRepo(repo);
  const signer = new NDKPrivateKeySigner(secret);
  const ndk = new NDK({ explicitRelayUrls: RELAYS, signer });
  await ndk.connect();
  const ev = ndk.event({
    kind: 31990,
    tags: [
      ["d", name],
      ["category", cat],
      ["repo", repoUrl],
      ["k", "31990"],
    ],
    content: `AI skill: ${name} (${cat})`,
  });
  await ev.publish();
  console.log(JSON.stringify({ ok: true, name, id: ev.id, pubkey: ev.pubkey, repo: repoUrl }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  register(arg("--name"), arg("--cat", "AI/DVM"), arg("--repo")).catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
