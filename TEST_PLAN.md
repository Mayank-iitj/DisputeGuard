# TEST_PLAN.md

Purpose: prove the 50% "does it work" criterion. Requirement IDs refer to `PRD.md` section 5.

---

## 1. Test layers

| Layer | Tool | Scope | Runs |
|---|---|---|---|
| Unit | Vitest | Policy engine, state machines, risk scoring, ranking, ledger guards, envelope parser, amount checker | Every commit |
| AI eval | Script over `cases.jsonl` | Risk, translate, claim classification, injection regression | Every deploy |
| Vision eval | Script over fixtures | Severity, retake rules | Before freeze |
| API integration | Vitest + test DB | Routes, auth, idempotency, outbox | Every commit |
| E2E | Playwright against deployed URL | Scenarios A, B, C | Nightly and before submit |
| Manual | Checklist | Cross-browser, mobile, stranger test | Day 4 and Day 5 |

## 2. Unit test must-haves

Policy
- Severity 2 `damaged` on `8400` minor yields `opt_keep_partial` with `3360` and `opt_replace` with `0` refund.
- `opt_full_keep` hidden when order above `maxOrderMinor`.
- Severity 0 `damaged` yields escalate (no options).
- `validCounter` accepts 50 to 150 percent of option amount, capped at order amount; rejects outside.

Escrow
- `HELD` to `FROZEN` allowed for system actor.
- `FROZEN` to `REFUNDED_FULL` rejected for non-agent actor (409).
- Auto-settle above ceiling rejected.
- Every transition writes exactly one ledger row; ledger rows cannot be updated (DB permission test).

Dispute
- Cannot respond to a proposal after `RESOLVED`.
- Round 3 attempt escalates.
- Duplicate `POST /disputes` for the same order returns the same dispute.

Risk
- Threat `chargeback`, confidence 0.7, not negated: freeze.
- Same, negated true: no freeze.
- Two consecutive messages frustration 0.7 from same sender: freeze.
- Decay: low-frustration message reduces score.
- LLM unavailable: lexicon hit sets degraded flag but does not freeze.

Draft guard
- Draft containing `$50.00` when allowed `$33.60`: warning emitted.

Envelope
- Parses native JSON and `DG1:` text; unknown kind returns `unsupported` without throwing.

Ranking
- Frozen high-value case outranks a medium case waiting longer than 60 minutes.

## 3. E2E scenarios

### Scenario A: Damaged cup, auto-settle (happy path)

| Step | Actor | Action | Expected |
|---|---|---|---|
| A1 | Aiko | Open `ord_1042`, Report a problem, Damaged, Start | Dispute created; channel shows welcome and proof request in Japanese UI |
| A2 | Aiko | Type in Japanese: コップが割れて届きました | Marco's pane shows Spanish translation with "Translated from Japanese" |
| A3 | Aiko | Upload 2 fixture photos of a cracked cup | "Analyzing" state, then evidence result card in both panes; severity 2; label "AI-assessed, not verified" |
| A4 | System | Policy proposal | Card with 2 options, amounts `$33.60` and replacement, round 1 |
| A5 | Aiko | Accept "Keep item, 40% refund" | Status chip: Aiko accepted |
| A6 | Marco | Accept same | Resolution card; escrow `REFUNDED_PARTIAL` $33.60; order `partially_refunded`; composers disabled |
| A7 | Dispatch | Queue | Case not present as open; metrics show auto-resolved +1 |

Assertions: latency of A3 under 15 s; no console errors; ledger has hold and refund rows; no agent action rows.

### Scenario B: Escalation firewall and agent resolution

| Step | Actor | Action | Expected |
|---|---|---|---|
| B1 | Aiko | Open `ord_1044` (wrong size), reason Wrong item or size | Proof request or reason handling per policy |
| B2 | Aiko | Polite repeated message (ja) signalling third request | Seller sees translation with tone note; risk medium; no freeze |
| B3 | Marco/Li Wei | Dismissive reply | Translated; risk unchanged or up |
| B4 | Aiko | Message with chargeback intent in Japanese | Within 5 s: escrow shows Frozen in both panes; bilingual notice card; **no risk details in the notice** |
| B5 | Dispatch | Queue | New row at top, HIGH, lock icon, headline; flashes once |
| B6 | Priya | Open case | Brief present within 2 s; transcript in English with originals on hover; risk reason visible with confidence |
| B7 | Priya | Take Over | Aiko and seller see "Priya has joined" |
| B8 | Priya | Generate draft (de-escalate), target buyer | Japanese draft + English preview; edit; Send |
| B9 | Aiko | Sees Priya's message; reads it in Japanese | OK |
| B10 | Priya | Approve full refund $56.00 and release escrow, confirm | Resolution card in all panes; escrow `REFUNDED_FULL`; order `refunded`; channel locked; audit row |

Assertions: freeze at most 5 s after B4 message send; one `agent_actions` row; ledger shows hold, freeze, refund_full in order.

### Scenario C: Negated threat does not freeze

1. Aiko writes (translated test string): "I will not call the police, I only want a refund."
2. Expected: no freeze; risk band at most medium; no escalation notice.

### Scenario D: AI outage degradation

1. Set `AI_FORCE_FAIL=1` (test flag).
2. Messages still send; bubbles show original with "Couldn't translate · Retry"; evidence shows "check pending"; escrow not frozen by lexicon alone; agent queue shows "AI check pending" tag.
3. Unset flag; retry button works.

### Scenario E: Idempotency and concurrency

- Double-click on "Approve full refund": single ledger row.
- Two agents take over concurrently: one gets 409.

### Scenario F: Reset

`POST /demo/reset` returns in under 5 s and Scenario A passes immediately after.

## 4. Requirement coverage matrix

| Requirement | Test |
|---|---|
| F-01, F-02, F-03 | A1, unit duplicate dispute |
| F-04 | A4, A6, B4, B10 |
| F-10, F-12, F-13 | A2, D |
| F-20, F-21, F-22, F-23 | A3, vision eval |
| F-30, F-31, F-32, F-33, F-34 | A4 to A6, policy unit, round 3 unit |
| F-40, F-41, F-42, F-43 | B4, C, risk unit, AI eval |
| F-50 to F-57 | B5 to B10 |

## 5. AI evaluation protocol

1. Run all cases in `apps/api/src/ai/eval/cases.jsonl` through the real pipeline with real model IDs.
2. Output a table: per language: n, freeze correct, false freezes, missed freezes, masking detected.
3. Record: median and p95 latency for translate and risk; token counts.
4. Save results to `docs/eval-results.md` with commit hash and date. The write-up cites this file.
5. Human review: a fluent reader checks 10 translations per demo language pair. Record disagreements.

Do not report a figure you did not measure on the final build.

## 6. Performance checks

- Translate p95 under 4 s over 50 messages (script).
- Vision p95 under 10 s over 10 uploads.
- Dispatch queue renders 200 seeded rows without jank (scroll test).
- API handles 20 concurrent dispute-open requests without errors (basic load with `autocannon`).

## 7. Manual checklist (Day 4, then again Day 5 on production)

Browsers: Chrome, Safari (desktop), Firefox, Chrome Android, Safari iOS.
- [ ] `/stage` loads; all three panes connected within 5 s
- [ ] Camera/gallery capture works on mobile
- [ ] Japanese and Chinese text render without tofu
- [ ] Keyboard: dispatch queue j/k/Enter/t
- [ ] Reduced motion honoured
- [ ] No horizontal scroll at 375 px on buyer view
- [ ] Reset works; second run of A passes
- [ ] Stranger test: an unfamiliar person finishes A unaided in under 4 minutes
- [ ] Network throttled to Fast 3G: chat usable; AI states show loading, not broken
- [ ] Disconnect Wi-Fi 10 s and reconnect: history catches up, no duplicate cards
- [ ] Bundle grep: `NEXCONN_APP_SECRET` and API keys not present
- [ ] Repo clone on clean machine: README quickstart works

## 8. Demo-day pre-flight (run before recording and before submitting)

```
[ ] /health shows db, nexconn, llm all ok
[ ] /demo/reset
[ ] Warm the LLM: send 3 throwaway translations
[ ] Seeded photos available on the recording machine
[ ] Screen resolution 1920x1080, browser zoom 100%, notifications off
[ ] Clock and timers not visible with personal info
[ ] Scenario A, then reset, then B, rehearsed twice back to back
```
