# nostr-dvm-skill

Agent skill for talking to a Nostr data-vending machine that already exists.

[NIP-90](https://github.com/nostr-protocol/nips/blob/master/90.md) is marked **unrecommended** by the NIPs repository. New products should use a purpose-specific kind. This skill is for interop: build an unsigned job request, check that a result's kind is the request kind plus 1000, and refuse to pay unless the user approved that invoice.

```bash
python3 scripts/dvm.py selftest
python3 scripts/dvm.py request 5000 --text "hello" --output text/plain --relay wss://nos.lol
```

Job kind numbers live in [nostr-protocol/data-vending-machines](https://github.com/nostr-protocol/data-vending-machines), not in this repo. Fetch the kind file before you use a number.

Sign and publish with the [nostr skill](https://github.com/NostrDanish/nostr-skill). The secret stays in `NOSTR_SECRET_KEY`.

## License

CC-BY-SA-4.0
