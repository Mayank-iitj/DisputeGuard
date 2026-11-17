# API.md: DisputeGuard AI

Base URL: `/api/v1` | JSON over HTTPS | Auth: `Authorization: Bearer <jwt>`

Money values are **integers in minor units** (cents, yen has 0 decimals, so use the currency's minor exponent) plus a `currency` code. Times are Unix milliseconds unless noted.

---

## 1. Conventions

### Roles
`buyer`, `seller`, `agent`, `supervisor`. JWT claim `role`, plus `sub` (app user ID) which is also the Nexconn user ID.

### Error shape
```json
{ "error": { "code": "INVALID_TRANSITION", "message": "Escrow is FROZEN", "details": { "from": "FROZEN", "to": "RELEASED_TO_SELLER" } } }
```

| HTTP | code | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Zod validation error, `details.issues` |
| 401 | `UNAUTHENTICATED` | Missing or bad JWT |
| 403 | `FORBIDDEN` | Role or membership check failed |
| 404 | `NOT_FOUND` | Unknown ID or not visible to caller |
| 409 | `INVALID_TRANSITION` | State machine guard |
| 409 | `ALREADY_RESOLVED` | Dispute closed |
| 409 | `IDEMPOTENT_REPLAY` | Same key, different body |
| 413 | `PAYLOAD_TOO_LARGE` | Upload over limit |
| 422 | `POLICY_REJECTED` | Requested amount outside policy bounds |
| 429 | `RATE_LIMITED` | See `Retry-After` |
| 502 | `AI_UNAVAILABLE` | LLM failed; client should degrade |
| 500 | `INTERNAL` | Unexpected |

### Idempotency
Send `Idempotency-Key: <uuid>` on `POST .../respond`, `POST /agent/.../resolve`, `POST /agent/.../takeover`. Same key plus same body returns the original response.

---

## 2. Auth and session

### `POST /auth/demo-session`
Only when `DEMO_MODE=1`. Returns a session for a seeded persona.

Request
```json
{ "persona": "buyer_aiko" }
```
Personas: `buyer_aiko` (ja), `seller_marco` (es), `seller_liwei` (zh), `buyer_sofia` (es), `agent_priya` (en), `supervisor_dan` (en).

Response 200
```json
{
  "jwt": "eyJ...",
  "user": { "id": "u_buyer_aiko", "name": "Aiko Tanaka", "role": "buyer", "lang": "ja", "avatar": "/av/aiko.png" },
  "nexconn": { "appKey": "bos9...", "userId": "u_buyer_aiko", "token": "gxld6...@sgyu...;sgyu..." }
}
```
The server registers the user with Nexconn on first call and caches the token.

### `GET /me`
Returns `user` as above plus `openDisputes: number`.

---

## 3. Orders

### `GET /orders`
Buyer: own orders. Seller: orders they fulfil. Query: `status`, `limit`, `cursor`.

```json
{
  "items": [{
    "id": "ord_1042",
    "title": "Ceramic pour-over set",
    "image": "/img/ord_1042.jpg",
    "amount": { "value": 8400, "currency": "USD" },
    "status": "delivered",
    "deliveredAt": 1763280000000,
    "buyerId": "u_buyer_aiko",
    "sellerId": "u_seller_marco",
    "disputeId": null
  }],
  "nextCursor": null
}
```
`status`: `paid`, `shipped`, `delivered`, `disputed`, `completed`, `refunded`, `partially_refunded`.

### `GET /orders/{orderId}`
Order plus `escrow` summary and `dispute` summary if any.

---

## 4. Disputes

### `POST /disputes`
Buyer only.
```json
{ "orderId": "ord_1042", "reason": "damaged", "text": "コップが割れていました" }
```
`reason`: `damaged | wrong_item_or_size | not_received | not_as_described`.

Response 201 (or 200 if existing)
```json
{
  "id": "dsp_77a1",
  "orderId": "ord_1042",
  "channelId": "dsp_77a1",
  "status": "OPEN",
  "reason": "damaged",
  "escrow": { "state": "HELD", "amount": { "value": 8400, "currency": "USD" } },
  "risk": { "band": "low", "score": 0.08, "frozen": false },
  "participants": [
    { "id": "u_buyer_aiko", "role": "buyer", "lang": "ja" },
    { "id": "u_seller_marco", "role": "seller", "lang": "es" },
    { "id": "u_dg_arbitrator", "role": "bot", "lang": "en" }
  ],
  "createdAt": 1763366400000
}
```
Side effects: channel created, bot posts `card.welcome`, and if reason is `damaged` or `wrong_item_or_size`, posts `card.proof_request`.

### `GET /disputes`
Caller's disputes. Query: `status`.

### `GET /disputes/{id}`
Full dispute: state, reason, escrow, risk, current proposal, evidence summary, rounds used.

### `GET /disputes/{id}/timeline`
Ordered events from DB (state changes, cards, risk events visible to the caller). Agents see risk reasons; buyers and sellers do not.

---

## 5. Chat helper endpoints

### `POST /disputes/{id}/observe`
The sending client calls this right after its Nexconn send succeeds. Server scores risk, prefetches the counterpart translation, may freeze escrow.

Request
```json
{ "messageUid": "BU9F-...", "text": "もう一度確認していただけますと幸いです。三回目です。", "ts": 1763366500000 }
```
Response 200
```json
{
  "detectedLang": "ja",
  "risk": { "band": "medium", "score": 0.58, "frozen": false, "triggers": [] }
}
```
Response when freeze fires: same shape with `"frozen": true`. Triggers are only returned to agents; non-agents get `"triggers": []`.

If the webhook path is enabled, this endpoint becomes a no-op that returns the cached result.

### `POST /translate`
Batch translate for rendering.

Request
```json
{
  "disputeId": "dsp_77a1",
  "targetLang": "es",
  "items": [{ "messageUid": "BU9F-...", "text": "コップが割れていました" }]
}
```
Response
```json
{
  "items": [{
    "messageUid": "BU9F-...",
    "sourceLang": "ja",
    "translation": "Las tazas llegaron rotas.",
    "toneNote": null,
    "cached": false
  }]
}
```
`toneNote` examples: `"Formal phrasing, strong complaint"`. Max 20 items per call. Caller must be a participant.

---

## 6. Chat envelope (Nexconn payload)

Sent by the server bot (or an agent client) as a custom message; fallback is a text message prefixed `DG1:`.

```json
{
  "dg": 1,
  "id": "env_01HX...",
  "kind": "card.proof_request",
  "disputeId": "dsp_77a1",
  "ts": 1763366410000,
  "audience": "all",
  "data": { }
}
```

`audience`: `all | buyer | seller | agent`. Clients hide envelopes not meant for them; sensitive data (risk reasons) is only ever put in `agent` envelopes. Do not rely on hiding for secrets: **never put secrets in envelopes**, because any member's client receives them.

| `kind` | `data` fields | Rendered as |
|---|---|---|
| `card.welcome` | `orderTitle`, `amount`, `escrowState`, `languages[]` | Header card with order chip and language pills |
| `card.proof_request` | `reason`, `shotList[]`, `maxPhotos`, `expiresAt` | Evidence capture widget (buyer), waiting state (seller) |
| `card.evidence_result` | `evidenceId`, `thumbs[]`, `assessment{damagePresent,type,severity,location,quality,confidence}`, `label:"ai_assessed_unverified"` | Result card, severity bar |
| `card.proposal` | `proposalId`, `round`, `options[{id,title,summary,buyerGets,sellerGets,returnRequired}]`, `policyVersion`, `expiresAt` | Option cards with Accept / Counter / Decline |
| `card.proposal_status` | `proposalId`, `buyer:"pending|accepted|declined|countered"`, `seller:...` | Inline status chips |
| `card.escrow_status` | `state`, `amount`, `reasonCode` | Escrow pill and timeline entry |
| `card.escalation_notice` | `noticeByLang{ja:"...",es:"...",en:"..."}`, `caseId` | Bilingual banner. No risk details |
| `card.agent_joined` | `agentName`, `agentLang` | Agent introduction |
| `card.resolution` | `outcome`, `buyerRefund`, `sellerPayout`, `note`, `resolvedBy` | Final card, composer disabled |
| `card.system_note` | `text` | Muted line |
| `evt.queue_delta` (ops channel only) | `disputeId`, `priority`, `risk`, `status`, `lang`, `change` | Dispatch queue update |

Envelope validation: Zod schemas in `packages/shared`. Unknown `kind` renders as a muted "unsupported card" line, never crashes.

---

## 7. Evidence

### `POST /disputes/{id}/evidence`
Buyer (and seller for counter-evidence). `multipart/form-data`: `files[]` (1 to 4, JPEG/PNG/HEIC, 8 MB each), `note` optional, `capturedAt` optional ISO time from device.

Response 202
```json
{ "evidenceId": "evd_a12", "status": "analyzing" }
```
Server downsizes images, computes perceptual hashes, runs vision, stores result, then posts `card.evidence_result`. Poll `GET /evidence/{id}` if the card does not arrive within 15 s.

### `GET /evidence/{id}`
```json
{
  "id": "evd_a12",
  "status": "done",
  "files": [{ "url": "https://.../signed?exp=...", "w": 1280, "h": 960 }],
  "assessment": {
    "damagePresent": true,
    "type": "crack",
    "severity": 2,
    "location": "rim of cup",
    "imageQualityIssues": [],
    "confidence": 0.81
  },
  "integrity": { "reusedImage": false, "exifMismatch": false }
}
```
`integrity` is returned to agents only.

---

## 8. Proposals

### `POST /disputes/{id}/proposals/{proposalId}/respond`
Buyer or seller. Requires `Idempotency-Key`.

```json
{ "response": "accept", "optionId": "opt_partial_keep" }
```
or
```json
{ "response": "counter", "optionId": "opt_partial_keep", "counterAmount": { "value": 3000, "currency": "USD" } }
```
or `{ "response": "decline" }`.

Rules
- Counter must lie within policy bounds for the option (see `Design.md` 5.3), else 422 `POLICY_REJECTED`.
- Both parties accept the same option and amount at or below `AUTO_APPROVE_CEILING_MINOR`: server settles, escrow moves, posts `card.resolution`.
- Both accept above the ceiling: status becomes `PENDING_AGENT_APPROVAL`, case enters queue as normal priority.
- Round 3 would be required: server escalates instead.

Response 200
```json
{
  "proposal": { "id": "prp_1", "round": 1, "buyer": "accepted", "seller": "pending" },
  "dispute": { "status": "PROPOSAL_MADE" }
}
```

---

## 9. Agent endpoints (role `agent` or `supervisor`)

### `GET /agent/queue`
Query: `lang`, `minRisk` (0 to 1), `status`, `assigned=me|none|any`, `limit`.

```json
{
  "items": [{
    "disputeId": "dsp_77a1",
    "priority": 87.4,
    "risk": { "band": "high", "score": 0.86, "frozen": true },
    "reason": "damaged",
    "langs": ["ja", "es"],
    "amount": { "value": 8400, "currency": "USD" },
    "waitingMs": 94000,
    "status": "ESCALATED",
    "assignedTo": null,
    "headline": "Buyer threatens chargeback after two unanswered requests"
  }],
  "counts": { "open": 7, "frozen": 2, "unassigned": 4 }
}
```

### `GET /agent/disputes/{id}/brief`
```json
{
  "generatedAt": 1763366600000,
  "summary": ["Buyer (ja) reports cup arrived cracked...", "..."],
  "claims": { "buyer": "...", "seller": "..." },
  "evidence": { "present": true, "severity": 2, "confidence": 0.81, "flags": [] },
  "riskReasons": [{ "messageUid": "...", "type": "chargeback", "confidence": 0.82, "quote_en": "I will file a chargeback", "lang": "ja" }],
  "recommended": { "action": "refund_partial", "amount": { "value": 3400, "currency": "USD" }, "rationale": "Policy v1: severity 2, repairable by replacement" },
  "policyOptions": []
}
```
`recommended.amount` always comes from the policy engine, never from the model.

### `POST /agent/disputes/{id}/takeover`
Assigns to caller, joins channel, posts `card.agent_joined`. 409 if assigned to someone else (supervisor can reassign with `{ "force": true }`).

### `POST /agent/disputes/{id}/copilot-draft`
```json
{ "intent": "ask_for_more_photos", "targetParty": "buyer" }
```
`intent` optional: `apologize_and_offer`, `ask_for_more_photos`, `explain_policy`, `de_escalate`, `confirm_resolution`. If omitted, server infers from state.

Response
```json
{
  "draft": { "lang": "ja", "text": "ご不便をおかけして申し訳ありません。...", "english": "I am sorry for the trouble..." },
  "grounding": ["policy:v1:damaged:sev2", "order:ord_1042"],
  "warnings": []
}
```
The agent edits and sends from the composer via the Chat SDK. The server never auto-sends a draft.

### `POST /agent/disputes/{id}/resolve`
Requires `Idempotency-Key`.

```json
{
  "action": "refund_full",
  "note": "Evidence consistent, buyer escalated, goodwill",
  "amount": null
}
```
`action`: `refund_full | refund_partial | release_to_seller | request_more_evidence`.
- `refund_partial` requires `amount`, bounded by policy; agent may exceed policy only with `override: true` and a note of at least 20 characters (flagged in audit).
- Effects: ledger entry, escrow state, order status, `card.resolution`, channel lock, queue delta.

Response 200
```json
{
  "dispute": { "id": "dsp_77a1", "status": "RESOLVED" },
  "escrow": { "state": "REFUNDED_FULL", "ledger": [{ "id": "led_9", "type": "refund", "amount": { "value": 8400, "currency": "USD" }, "actor": "u_agent_priya" }] }
}
```

### `POST /agent/disputes/{id}/unfreeze`
```json
{ "reason": "Quoted threat, buyer clarified in context" }
```
Reason min 10 characters. Escrow `FROZEN` back to `HELD`.

### `GET /agent/metrics`
```json
{ "open": 7, "frozen": 2, "autoResolved24h": 5, "medianFirstActionMs": 71000, "medianResolutionMs": 412000 }
```

---

## 10. Demo and ops (only when `DEMO_MODE=1`)

| Endpoint | Purpose |
|---|---|
| `POST /demo/reset` | Wipe disputes, restore seeded orders and personas, recreate Nexconn channels as needed |
| `POST /demo/seed` | Insert seeded orders (see `TEST_PLAN.md` fixtures) |
| `POST /demo/scenario/{name}/advance` | Scenario `A` (happy path) or `B` (escalation): performs the next scripted step for rehearsal |
| `GET /health` | `{ ok, db, nexconn, llm, version }` each with latency |

`demo/*` never exists in production mode and is excluded from the route table when `DEMO_MODE=0`.

---

## 11. Optional webhook

### `POST /webhooks/nexconn`
If A5 verified. Verify signature per Nexconn docs, dedupe by message UID, run the same pipeline as `/observe`. Respond 200 fast, process async.

---

## 12. Status vocabulary

Dispute: `OPEN, EVIDENCE_REQUESTED, EVIDENCE_SUBMITTED, PROPOSAL_MADE, PENDING_AGENT_APPROVAL, ESCALATED, AGENT_ASSIGNED, RESOLVED, CLOSED`

Escrow: `HELD, FROZEN, RELEASED_TO_SELLER, REFUNDED_PARTIAL, REFUNDED_FULL`

Risk band: `low (<0.35), medium (0.35 to 0.7), high (>=0.7)`
