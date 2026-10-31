#!/usr/bin/env node
import NDK from "@nostr-dev-kit/ndk";

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

export async function discover(cat, ms = 4000) {
  const ndk = new NDK({ explicitRelayUrls: RELAYS });
  await ndk.connect();
  const filter = { kinds: [31990], limit: 50 };
  if (cat) filter["#category"] = [cat];
  const sub = ndk.subscribe(filter, { closeOnEose: false });
  const seen = new Map();
  sub.on("event", (e) => {
    const row = {
      name: e.tagValue("d") || "",
      repo: e.tagValue("repo") || "",
      category: e.tagValue("category") || "",
      id: e.id,
      pubkey: e.pubkey,
    };
    seen.set(e.id, row);
  });
  await new Promise((r) => setTimeout(r, ms));
  sub.stop();
  const out = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const row of out) console.log(JSON.stringify(row));
  console.error(`# ${out.length} skills`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  discover(arg("--cat", "AI/DVM")).catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
