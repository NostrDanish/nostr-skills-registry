#!/usr/bin/env node
// Publish / discover AI skills as kind 31990 (NIP-89 handler-information shape).
// Signing key from NOSTR_SECRET_KEY only — never pass it on argv.
import NDK, { NDKEvent, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";

const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
];

function relaysFromEnv() {
  const raw = process.env.NOSTR_RELAYS;
  if (!raw) return DEFAULT_RELAYS;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function flag(name) {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : undefined;
}

async function connect(needSigner) {
  const opts = { explicitRelayUrls: relaysFromEnv() };
  if (needSigner) {
    const key = process.env.NOSTR_SECRET_KEY;
    if (!key) {
      console.error("set NOSTR_SECRET_KEY (nsec or hex). Do not pass it on the command line.");
      process.exit(2);
    }
    opts.signer = new NDKPrivateKeySigner(key);
  }
  const ndk = new NDK(opts);
  await ndk.connect(4000);
  return ndk;
}

export async function register(name, cat, repo) {
  const ndk = await connect(true);
  const e = new NDKEvent(ndk);
  e.kind = 31990;
  e.tags = [
    ["d", name],
    ["k", "31990"],
    ["web", repo],
    ["repo", repo],
    ["t", cat],
    ["alt", `AI skill: ${name}`],
  ];
  e.content = JSON.stringify({ name, category: cat, repo });
  await e.publish();
  console.log("[reg] published skill", name, "->", e.id);
  return e.id;
}

export async function discover(cat) {
  const ndk = await connect(false);
  const filter = { kinds: [31990], limit: 50 };
  if (cat) filter["#t"] = [cat];
  const events = await ndk.fetchEvents(filter);
  const out = [...events].map((e) => ({
    name: e.tagValue("d"),
    repo: e.tagValue("repo") || e.tagValue("web"),
    category: e.tagValue("t"),
    id: e.id,
    pubkey: e.pubkey,
  }));
  console.log("[reg] found", out.length, "skills");
  for (const row of out) console.log(JSON.stringify(row));
  return out;
}

const isMain = process.argv[1] && process.argv[1].endsWith("register.js");
if (isMain) {
  const name = flag("--name");
  const cat = flag("--cat") || "AI/DVM";
  const repo = flag("--repo");
  if (name) {
    if (!repo) {
      console.error("usage: NOSTR_SECRET_KEY=nsec1… node register.js --name=foo --cat=AI/DVM --repo=https://github.com/…");
      process.exit(2);
    }
    await register(name, cat, repo);
  } else if (process.argv.includes("--discover") || flag("--discover")) {
    await discover(flag("--discover") || cat);
  } else {
    console.error(
      "usage:\n  NOSTR_SECRET_KEY=nsec1… node register.js --name=… --cat=… --repo=…\n  node register.js --discover --cat=AI/DVM",
    );
    process.exit(2);
  }
}
