# SUBMISSION.md

Everything needed for the Reskilll submission. Fields marked `{{...}}` must be replaced with real values. Do not leave a placeholder or an unmeasured number in the final PDF.

Challenge facts used here (from the challenge page): fully online, Oct 23 to Nov 22, 2026; teams of 1 to 4; Chat SDK or Chat UI required, Call SDK optional; submit app link, public GitHub repo, demo video, write-up PDF with App Key; traction proof is an optional bonus; the team leader selects the track and submits; judging Nov 23 to 27; edits allowed until the deadline.

---

## 1. Scoring map

| Criterion | Weight | What the judge must see | Where |
|---|---|---|---|
| Completeness and user experience | 50% | Full path works live; easy to use; no dead ends | Stage page, video 0:20 to 2:40, README |
| Innovation and scenario value | 30% | A real communication problem solved in a new way | Write-up sections 1 to 3, video hook |
| Business and growth potential | 20% | Real users on Nexconn and a path to a product | Write-up section 7, traction proof |

## 2. Submission checklist

```
[ ] Team registered; leader selected track; all members listed
[ ] Runnable app link (stage page): {{https://...}}
[ ] Public GitHub repo with README, license, no secrets: {{https://github.com/...}}
[ ] Demo video (target 2:45, max 3:00), public or unlisted link: {{https://...}}
[ ] Write-up PDF (this doc section 3), includes Nexconn App Key: {{APP_KEY}}
[ ] App Key also pasted into the submission form
[ ] Statement of what existed before the challenge vs built during it (section 4)
[ ] Traction proof attached (optional bonus) (section 6)
[ ] Live link still works from a private window on mobile data
[ ] /demo/reset tested; app seeded
[ ] Link stays live through Nov 27
[ ] Submitted on or before Nov 22, 18:00 IST (buffer to Nov 23, 17:29 IST)
```

The App Secret never goes in the PDF, the repo, or the form. Only the App Key.

## 3. Write-up (export to PDF, 3 to 4 pages)

---

### DisputeGuard AI
*Multilingual escrow dispute resolution built on the Nexconn Chat SDK*

**Team:** {{names}} | **Track:** {{track}} | **App:** {{link}} | **Repo:** {{link}} | **Video:** {{link}} | **Nexconn App Key:** `{{APP_KEY}}`

#### 1. The problem

When a parcel crosses a border, the dispute crosses a language. A buyer in Japan writes politely and repeatedly; a seller in Spain reads a literal translation that sounds calm. Neither side has proof on the table, the conversation loops, and a support agent later inherits a long two-language thread with no summary and no recommended action. {{Cite one real source for dispute cost or cross-border support friction here, or delete this sentence.}}

#### 2. What we built

DisputeGuard turns each dispute into a Nexconn channel tied to the order and its escrow state. The conversation itself drives resolution:

1. **Translated conversation.** Everyone reads their own language. The original is one tap away. Where formal phrasing hides strong frustration, a tone note says so.
2. **Proof-First cards.** Claim a damaged item and the chat asks for guided photos. A vision model returns a structured assessment (damage type, severity, confidence) posted as a card, labelled "AI-assessed, not verified".
3. **Bounded settlement.** A deterministic policy engine, not the model, computes two or three options with exact amounts. Each side can accept, counter within bounds, or decline. Two rounds maximum, then escalation.
4. **Escalation Firewall.** Every message is analysed for true intent across languages: frustration, threats (chargeback, legal, police, scam accusation), politeness masking, negation. When the rule fires, escrow freezes, both parties see a calm bilingual notice, and the case jumps to the human Dispatch Center with a brief.
5. **Dispatch Center.** A mission-control console: priority queue, dual-language transcript, AI brief, evidence, policy options, a copilot draft in the buyer's language with an English preview, and one-click resolution that updates escrow and closes the channel.

**Design rule: AI proposes, code computes, a human approves above a threshold.** The model never chooses a refund amount and never moves money. Settlements above the auto-approve ceiling require an agent. Every escrow transition is an append-only ledger row with an actor and a reason.

#### 3. How we use Nexconn

| Nexconn capability | Use in DisputeGuard |
|---|---|
| Chat SDK real-time channels | Multi-party dispute channel: buyer, seller, Arbitrator bot; agent joins on takeover |
| Messages as structured events | Typed cards (proof request, evidence result, proposal, escrow status, resolution) delivered as channel messages |
| Server API | User registration and tokens; bot sends cards and system events |
| Ops channel | Dispatch queue deltas delivered to agent consoles over Nexconn {{if built, else remove}} |
| History and reconnect | Late joiners and reconnecting clients rebuild the card stream |
| {{Chat UI / other}} | {{state if used}} |

The database is the source of truth for money and policy; Nexconn is the live conversation and event layer users see. {{State the final integration mode: native custom messages, or JSON envelope on text messages, as found in the Day-0 spike.}}

#### 4. What existed before vs built during the challenge

All code in this repository was written between Oct 23 and Nov 22, 2026. {{If any component, template, or library predates the challenge, list it here: what it is, what it did before, and what Nexconn integration was added during the challenge.}} Third-party services used: Nexconn Chat SDK and Server API, {{LLM provider}}, {{database}}, {{storage}}, {{hosting}}.

#### 5. Architecture (one diagram)

Insert the context diagram from `SystemDesign.md` section 1 as an image. Caption: "Conversation plane on Nexconn, control plane on REST and Postgres, AI behind a validated gateway."

#### 6. Measured results

Fill only with numbers from `docs/eval-results.md` and production logs.

| Measure | Result |
|---|---|
| Risk eval set | {{n}} cases across {{k}} languages; freeze decisions correct {{x}}; false freezes {{y}}; missed {{z}} |
| Translate latency | p50 {{}} s, p95 {{}} s over {{n}} messages |
| Vision latency | p95 {{}} s over {{n}} uploads |
| AI cost per full scenario | {{$}} measured from logs |
| End-to-end demo | {{3}} consecutive clean runs on the live link |
| Traction | {{disputes opened by real testers, resolved, median time}} (see section 8) |

Per-language results table: {{insert}}. We report weak languages as weak.

#### 7. Business and growth

**Who pays:** cross-border marketplaces and D2C sellers shipping internationally, starting with exporters whose support is a shared inbox and a translation tab.
**Why it grows Nexconn usage:** a channel per dispute, 3 to 4 participants, a bot, a human agent, and ops traffic. Usage scales with order volume. Agents are daily active users.
**Product path:** embeddable "Report a problem" module and dispatch console on Chat SDK and Chat UI; resolution webhooks into the order system; per-resolved-dispute or per-seat pricing to be validated with {{n}} seller conversations.
**First 90 days:** {{3 concrete steps, e.g. pilot with N sellers from your network, a Shopify app listing, a Nexconn integration case study}}.

#### 8. Limits and honesty

- Escrow is simulated. The ledger, state machine and audit trail are real; no money moves.
- Evidence assessment is AI-assessed and cannot prove authenticity or timing. Reuse detection and a human gate exist for that reason.
- Policy percentages are demonstration values, not industry benchmarks.
- Message observation is client-reported in this build; production would use Nexconn's server callback so the client is not trusted. {{Update if webhook built.}}
- Risk analysis was evaluated on {{n}} cases; coverage outside {{languages}} is untested.

#### 9. What's next
Server-side callbacks, real payment hold and capture, multi-tenant policies, policy simulation on historical disputes, voice notes, and Nexconn Call SDK escalation to video.

---

## 4. Statement for the form: "existing work"
> All application code was written during the challenge window. Prior to the challenge there was no code for this project. {{or list exceptions}}

## 5. Demo video (target 2:45)

Record at 1920x1080, voiceover in clear English, burned-in captions. One take of the live deployed link, no mockups. Show the `/stage` page so judges see three personas at once.

| Time | On screen | Voiceover |
|---|---|---|
| 0:00 to 0:15 | Title, then the `/stage` page with three panes | "Cross-border disputes break in the chat. Different languages, no proof, no policy. DisputeGuard fixes that inside a Nexconn channel." |
| 0:15 to 0:40 | Aiko opens order, Report a problem, Damaged. Welcome and proof request cards appear in Japanese | "Aiko in Japan reports a cracked cup. The chat is tied to the order and her escrow." |
| 0:40 to 1:00 | Aiko types Japanese; Marco's pane shows Spanish with "Translated from Japanese" | "Marco reads Spanish. Original is one tap away." |
| 1:00 to 1:25 | Aiko uploads photos; evidence card appears with severity, confidence, "AI-assessed, not verified" | "Proof-first. A vision model assesses the photos and says plainly it's not verification." |
| 1:25 to 1:45 | Policy proposal card with amounts; both accept; resolution card; escrow pill changes | "The refund number comes from policy code, not the model. Both accept, escrow settles." |
| 1:45 to 2:15 | Second case: polite repeated Japanese messages, tone note shows; then chargeback line; escrow freezes; bilingual notice; Dispatch row flashes in | "When frustration or a chargeback threat appears in any language, the firewall freezes escrow and routes to a human, with a neutral notice to both parties." |
| 2:15 to 2:40 | Dispatch: brief, transcript in English, Take Over, copilot draft in Japanese with English preview, Send, then Approve full refund $56.00 | "The agent gets a brief, a draft in the buyer's language, and one-click resolution with an audit trail." |
| 2:40 to 2:55 | Resolution card in all panes; end card with links and "Built on the Nexconn Chat SDK" | "AI proposes, code computes, a human approves. Live link in the description." |

Rehearse twice. Keep the mouse deliberate. Do not apologize or narrate bugs; if one appears, re-record.

## 6. Traction plan (optional bonus, do it in 36 hours)

Goal: a small, honest, verifiable set of real usage.

1. Day 4 evening: post the stage link to 2 or 3 groups you actually belong to (campus, Reskilll/Discord community, WeMakeDevs community) asking people to try one scenario and fill a 4-question form.
2. Ask 3 to 5 people who sell online (resellers, small exporters, Etsy or Shopify sellers you know) for a 10-minute call; ask how they handle damaged-item disputes today. Record notes, with permission.
3. Log events in the DB: sessions, disputes opened, evidence uploaded, proposals accepted, escalations. Export a CSV and a screenshot of Nexconn console usage if available.
4. In the PDF: counts, a few anonymized quotes with permission, and the CSV link. Do not inflate; "{{12}} testers opened {{9}} disputes" is stronger than a market-size claim.
5. Form questions: (1) Did you understand what to do? (2) Did translation feel accurate? (3) Would you use this as a seller or buyer? (4) One thing that confused you.

## 7. Q&A prep (finalists may be asked)

| Question | Answer |
|---|---|
| Why is this not just a chat clone? | The chat is bound to order and escrow state, messages carry actions, policy computes amounts, and risk drives a human handover. |
| Can the AI refund money? | No. It extracts and drafts. Code computes amounts; humans approve above the ceiling; every transition is ledgered. |
| Is escrow real? | Simulated here; the ledger and state machine are real and map to a payment partner's hold and capture. |
| How do you handle prompt injection from chat? | Chat is wrapped as untrusted data, outputs are schema-validated, no tools, amounts come from code, drafts are amount-checked, agents approve. |
| What about false freezes? | Negation and quote handling, an eval set, reversible unfreeze with a reason, and chat never blocks. |
| Why Nexconn? | Multi-party, stateful, real-time with membership changes; messages double as the event stream; ops events ride the same layer. |
| What breaks at scale? | Client-reported observation (replace with server callback), single-instance API, simulated escrow, one tenant. All have a described path. |
| How would you make money? | Per resolved dispute or per agent seat; to be validated with sellers. |
| How accurate is the vision? | State the measured eval result and its limits; it is advisory, labelled unverified, and gated by a human above the ceiling. |
| How does it handle languages beyond the demo set? | Translation works broadly; risk analysis was evaluated on {{languages}}; others are untested and would be evaluated first. |

## 8. Repo README requirements

- One-paragraph pitch, screenshot or GIF of `/stage`
- Live link and demo video link
- Quickstart (clean clone works)
- Architecture diagram
- Nexconn usage section (what is used and where in the code)
- Env var table (names only)
- Limits and honesty section (copy section 3.8)
- Test and eval instructions, link to `docs/eval-results.md`
- License (MIT) and third-party notices
- `docs/` containing this doc pack

## 9. Final 60 minutes

```
T-60  Fresh clone builds; env example complete
T-45  Production /health green; reset; run Scenario A and B
T-30  Open links from a phone on mobile data
T-20  PDF proofread: no placeholders, numbers match eval-results.md
T-10  Form filled; App Key matches console
T-0   Submit. Screenshot the confirmation. Do not touch the code.
```
