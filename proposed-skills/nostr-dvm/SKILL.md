---
name: nostr-dvm
description: "Interoperate with an existing Nostr data-vending machine (NIP-90, kinds 5000-5999, results +1000, feedback kind 7000). Use when the user already has a DVM or names NIP-90. NIP-90 is unrecommended for new products. Triggers on DVM, NIP-90, job request, kind 7000."
license: CC-BY-SA-4.0
---

# Nostr DVM (NIP-90) — interop only

The NIPs repository marks NIP-90 **unrecommended**: "this got totally out of control, prefer use-case-specific microstandards."

If the user is designing a new computation market, do not start it on NIP-90. Pick a purpose-specific kind, write it down, and publish that. Use this skill when they already speak NIP-90, or they asked you to call a DVM that exists.

Spec text: `python3 scripts/nip.py get 90` from the `nostr-nips` skill. Job kind numbers are **not** in that file. They are in `https://github.com/nostr-protocol/data-vending-machines` (`kinds/`). Fetch the kind file before you pick a number. Do not invent one. The NIP's own examples use 5000 for speech-to-text and 5005 for translation; confirm both in that repo before you rely on them.

## The three events

| Event | Kind | Who |
|---|---|---|
| Job request | 5000–5999 | Customer |
| Job result | request kind + 1000 | Service provider |
| Feedback | 7000 | Service provider |

Feedback `status` is one of `payment-required`, `processing`, `error`, `success`, `partial`.

`payment-required` means stop. Do not assume the work will finish, and do not pay it.

## Money

An `amount` tag is millisats. The third value may be a bolt11 invoice. Paying it, or zapping the result, moves the user's money.

Do not pay, zap, or open a wallet connection unless the user approved that invoice amount in this conversation. Show the amount, the provider pubkey, and the invoice. A result event is not proof the provider did the work; read the output and let the user decide.

## Build a request

```bash
python3 scripts/dvm.py request 5000 --text "transcribe this" --output "text/plain" \
  --relay wss://nos.lol --bid-msat 1000
```

That prints an **unsigned** event. Sign with the `nostr` skill (`nostr_key.py sign env -`) and publish to the relays in the `relays` tag. Inputs are `i` tags: `text` (the value is the data), `url`, `event` (a Nostr id), or `job` (a previous job's event id). `param` tags are `["param", key, value]`.

Check a result before showing it:

```bash
python3 scripts/dvm.py check request.json result.json
```

The result kind must be the request kind plus 1000, the `e` tag must be the request id, and the `p` tag must be the customer's pubkey. Then verify the signature with `nostr_key.py verify`. This script does not check the signature.

## Encrypted params

NIP-90 still says to encrypt `i` and `param` tags with **NIP-04** into `content` and add an `encrypted` tag. NIP-04 is unrecommended and leaks metadata. Do not add that path to new code. If a provider you must call only accepts it, tell the user that is what the provider requires before you do it. Do not silently switch the ciphertext to NIP-44; the other side will not decrypt it.

## Finding a provider

NIP-90 tells providers to announce with kind **31990** and a `k` tag of the job kind they serve (NIP-89). That `k` tag means "I handle this kind". It is not the skill-index tag used by `nostr-skills-registry` (those events use `t=agentskill` and must not set `k`).

```json
{"kinds":[31990],"#k":["5000"],"limit":20}
```

`#k` needs the exact kind. Read the provider's kind 0 before you send them a job.

## Customer rules

1. Publish the request from the customer's key, or from a dedicated key the user chose. Not from a key you generated and then lost.
2. Put the relays you will actually read in the `relays` tag.
3. Treat `payment-required` as a stop. `error` is a stop. `partial` is a sample, not the result.
4. Cancel by publishing a kind 5 that tags the request, and only if the user asked to cancel.
5. Verify every result and feedback event. Drop failures.
