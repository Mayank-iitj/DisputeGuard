# PRD: DisputeGuard AI

Version 1.0 | Enterprise Specification | Owner: Mayank Sharma

---

## 1. One-line pitch

DisputeGuard turns a cross-border order dispute into a structured, translated, evidence-backed Nexconn conversation that resolves itself when it can and escalates to a human with a ready brief when it can't.

## 2. Problem

Cross-border marketplace disputes fail in the chat for four reasons:

1. **Language gap.** Buyer and seller write in different languages. Literal machine translation loses tone, so a polite but furious message reads as calm.
2. **No proof at the moment of complaint.** "It arrived broken" is a claim. Photos arrive late, in the wrong place, or never.
3. **Unbounded negotiation.** Parties argue in circles with no policy-anchored number on the table.
4. **Agents inherit chaos.** A human agent opens a ticket, reads a 90-message thread in two languages, and starts from zero.

We do not claim a market-wide percentage for how many tickets are language-related. The write-up must either cite a source or omit the number.

## 3. Users and jobs

| User | Job to be done | Pain today |
|---|---|---|
| **Buyer** (e.g. Aiko, Japan) | Get a fair outcome for a damaged or wrong item without writing in English | Feels unheard, unsure what proof is needed |
| **Seller** (e.g. Marco, Spain; Li Wei, China) | Respond to a claim with evidence and a bounded loss | Unverified claims, fear of chargeback |
| **Dispatch agent** (e.g. Priya) | Resolve high-risk disputes fast with full context | Reads raw logs, translates by hand, no recommended action |
| **Supervisor** | Watch queue health and risk | No live view of what is burning |
| **Marketplace operator** (buyer of the product) | Lower dispute cost and chargebacks | Agent hours, refund leakage, churn |

## 4. Product scope

### 4.1 Core loop (P0, must work end to end)

1. Buyer opens "Report a problem" on an order. A dispute and a Nexconn channel are created with buyer, seller and the Arbitrator bot.
2. **Live translation**: each participant reads messages in their own language, original one tap away.
3. **Proof-First cards**: the Arbitrator detects the claim type from text or the reason picker and injects an evidence request card. Buyer captures photos. Vision analysis returns a structured evidence result card.
4. **Bounded proposal**: the policy engine computes 2 to 3 options (for example partial refund and keep item, or full refund on return). The cards go to both parties. Both accept: resolved, escrow settled.
5. **Escalation Firewall**: every message is scored for frustration, threat intent and scam signals across languages. Threshold crossed: escrow freezes, a bilingual notice posts, the case lands in Dispatch with a High Risk tag and an AI brief.
6. **Dispatch Center**: queue matrix, case view with dual-language transcript, AI brief, evidence, policy options, copilot draft in the buyer's language, and one-click resolution that updates escrow and closes the channel.

### 4.2 Should have (P1)

- Duplicate-image detection across disputes (perceptual hash) as a fraud flag.
- UI chrome localized for buyer (en, ja, es).
- Supervisor metrics strip (open cases, median time to first agent action, auto-resolved rate).
- Agent unfreeze with reason.
- Ops channel: queue deltas delivered to dispatch clients over a Nexconn channel instead of polling.

### 4.3 Nice to have (P2, cut first)

- Voice notes with transcription.
- Call SDK escalation to a video call.
- Seller-side analytics page.
- Embeddable widget.

### 4.4 Explicit non-goals

- Real payment processing, KYC, or legal arbitration.
- Training custom models.
- Mobile native apps (responsive web only).
- Handling disputes outside the four supported reasons.

## 5. Functional requirements

IDs are referenced by `TEST_PLAN.md`.

### 5.1 Dispute and channel

| ID | Requirement | Priority |
|---|---|---|
| F-01 | A buyer can open a dispute on an order in state `delivered` with one of four reasons: `damaged`, `wrong_item_or_size`, `not_received`, `not_as_described`. | P0 |
| F-02 | Creating a dispute creates exactly one Nexconn channel containing buyer, seller and Arbitrator bot. Re-opening the same order returns the existing dispute. | P0 |
| F-03 | Each dispute has an escrow account in state `HELD` at creation. | P0 |
| F-04 | Every state change (dispute, escrow, proposal) is posted into the channel as a typed card or event. | P0 |

### 5.2 Translation

| ID | Requirement | Priority |
|---|---|---|
| F-10 | Incoming text renders in the viewer's language with a visible "translated from X" marker and a toggle to the original. | P0 |
| F-11 | Translation preserves register: the output carries a short tone note when politeness and intent diverge (for example "formal phrasing, strong complaint"). | P1 |
| F-12 | Translations are cached per message and target language. | P0 |
| F-13 | If translation fails, the original is shown with a retry control; chat is never blocked. | P0 |

### 5.3 Proof-First cards

| ID | Requirement | Priority |
|---|---|---|
| F-20 | Selecting `damaged`, or typing damage language in any supported language, triggers an evidence request card. | P0 |
| F-21 | The evidence widget captures 1 to 4 photos from camera or gallery with a guided shot list (whole item, close-up of damage, packaging, label). | P0 |
| F-22 | Vision analysis returns structured output: damage present, type, severity 0 to 3, location, image quality issues, confidence. Posted as an evidence result card to both parties. | P0 |
| F-23 | Evidence result is labelled "AI-assessed, not verified" and shows confidence. | P0 |
| F-24 | Duplicate or near-duplicate images already used in another dispute raise a `reused_image` flag visible to agents only. | P1 |

### 5.4 Proposals

| ID | Requirement | Priority |
|---|---|---|
| F-30 | Proposals are computed by the deterministic policy engine from reason, severity, order value, and policy version. The LLM supplies no amounts. | P0 |
| F-31 | A proposal shows 2 to 3 options with amounts in the order currency and a one-line rationale each. | P0 |
| F-32 | Buyer and seller each respond accept, decline or counter. Both accept the same option: auto-settle. | P0 |
| F-33 | Negotiation is bounded to 2 rounds, then escalates. | P0 |
| F-34 | Auto-settle only when the amount is at or below the configured auto-approve ceiling; above it, an agent must approve. | P0 |

### 5.5 Escalation Firewall

| ID | Requirement | Priority |
|---|---|---|
| F-40 | Every user message is analysed for frustration, threat intent (chargeback, legal, police, scam accusation, violence), scam signals, and politeness masking. | P0 |
| F-41 | Freeze rule fires per `Design.md` section 6. On fire: escrow `HELD` to `FROZEN`, risk tag set, bilingual notice posted, ticket enters queue. | P0 |
| F-42 | Negated or quoted threats ("I will not call the police") do not trigger alone. | P0 |
| F-43 | Both buyer and seller messages are scored. | P0 |
| F-44 | Freeze is reversible by an agent with a required reason. | P1 |

### 5.6 Dispatch Center

| ID | Requirement | Priority |
|---|---|---|
| F-50 | Queue shows all open cases sorted by priority score, filterable by language, risk band and status. | P0 |
| F-51 | Case view shows transcript in the agent's language with originals on hover, evidence, escrow state, and timeline. | P0 |
| F-52 | AI brief: 5 to 8 lines covering what happened, claims by each side, evidence, risk reasons, recommended action. | P0 |
| F-53 | Take Over joins the agent to the channel, posts an `agent_joined` card, and assigns the case. | P0 |
| F-54 | Copilot draft: a reply in the counterpart's language plus an English preview, grounded in policy and order data. The agent edits and sends; nothing auto-sends. | P0 |
| F-55 | One-click resolution actions: full refund and release escrow to buyer, partial refund, release to seller, request more evidence. Each requires confirm and writes an audit entry. | P0 |
| F-56 | Resolution posts a resolution card, sets order and escrow states, and closes the channel to new messages. | P0 |
| F-57 | Queue updates arrive live without manual refresh. | P0 |

## 6. Non-functional requirements

| Area | Target |
|---|---|
| Translation latency | p50 under 1.5 s, p95 under 4 s per message |
| Vision result | p95 under 10 s per submission of up to 4 images |
| Risk scoring | Completes before the next message from either side in normal use; freeze visible in under 5 s |
| Availability for judging | Live link up and seeded through Nov 27 (judging window) |
| Money safety | Every escrow transition is a guarded, append-only ledger entry; no transition without actor and reason |
| Privacy | Evidence images private by default, accessed by short-lived signed URLs, deletable per dispute |
| Accessibility | Keyboard navigable dispatch, contrast AA, no color-only risk signaling |

## 7. Differentiation (what a judge cannot see in a plain chat clone)

1. The chat is **tied to order and escrow state**, not free-floating.
2. Messages carry **structured actions**, so the conversation converges instead of looping.
3. **Cross-language intent**, not word translation, drives escalation.
4. The agent receives **a brief, a draft and an action panel**, not a transcript.
5. Human authority is explicit: AI cannot release money above the ceiling.

Be aware another entry in this challenge already ships interactive in-chat cards (a shift-handover app). Cards alone are not novelty. The novelty is the escrow-coupled policy loop plus cross-language risk firewall plus dispatch.

## 8. Success metrics

### Demo and judging

- Full scenario (open, evidence, proposal, escalate, agent resolve) completes in under 3 minutes without error, three runs in a row.
- Zero dead buttons on the three personas' main paths.

### Product (for traction proof, if collected)

- Disputes opened by real testers.
- Share resolved without agent (auto-settle rate).
- Median time from open to resolution.
- Median agent time from takeover to resolution.
- Messages per dispute (lower is better).

## 9. Business and growth (20% of score)

Keep this honest and Nexconn-centric.

- **Customer:** cross-border marketplaces and D2C sellers shipping internationally, especially platforms without in-house multilingual support.
- **Why it grows Nexconn usage:** one dispute creates a multi-party channel with a bot, a human agent, and ops events. Channels scale with orders, not with seats, and each dispute generates dozens of messages across 3 to 4 participants. Agents and operators are recurring daily users.
- **Packaging:** embeddable dispute module on top of Chat SDK / Chat UI, plus a dispatch console.
- **Pricing hypothesis:** per resolved dispute or per active agent seat. Validate with 3 to 5 seller conversations; do not publish revenue figures.
- **Go-to-market path:** Shopify and WooCommerce sellers exporting from India to US, EU and Japan; plugin that adds "Report a problem" to the order status page; start with sellers who already field these tickets by email.
- **Traction proof (optional bonus):** see `SUBMISSION.md` section 6.

## 10. Risks and mitigations (product level)

| Risk | Mitigation |
|---|---|
| Unverified Nexconn APIs break the plan | Day-0 spike, adapter layer, fallback envelope on text messages (`TRD.md` section 4) |
| LLM mistakes cause a wrong freeze or wrong draft | Freeze is reversible; AI cannot move money; agent edits all drafts |
| Fake evidence | Labelled unverified; reuse detection; human gate above ceiling |
| Scope too large for 5 days | `BUILD_PLAN.md` cut order; P0 only until Day 4 |
| Demo fails live | Stage page, seeded scenario, scripted advance endpoint, recorded backup video |

## 11. Open questions to close on Day 0

1. Does the Web SDK support custom message types and group channels as assumed? (`TRD.md` section 4)
2. Can the server send as a bot user via Server API, or must the bot hold a client session?
3. Is a server callback available on the free plan?
4. Which image storage is quickest to ship (Supabase Storage or Cloudflare R2)?
