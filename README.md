# nostr-skills-registry

A Nostr-native registry of AI skills. Each skill is a kind:31990 event (NIP-89 style)
tagged with category, repo URL, and WoT verification. Discoverable via Nostr search,
installable to clients, NutZap-monetized (NIP-61).

## Publish a skill
```
node register.js --name "ai-pay-agent" --cat "AI/DVM" --repo "https://github.com/NostrDanish/ai-pay-agent"
```

## Discover
```
node discover.js --cat "AI/DVM"
```
