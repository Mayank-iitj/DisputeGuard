# BUILD_PLAN.md

Today is **Tue Nov 17, 2026**. Hard deadline **Nov 22, 23:59 AoE = Mon Nov 23, 17:29 IST**. Plan to submit by **Sun Nov 22, 18:00 IST** and keep the extra day as buffer. Judging runs Nov 23 to 27, so the live link must stay up through Nov 27.

The original concept is a 3 to 4 week build. You have about 5 days. This plan keeps the three signature ideas and cuts everything that does not appear in the demo path.

Assumes solo, roughly 10 focused hours a day. If you have teammates (limit 4), split: **A** chat + cards (web), **B** backend + policy + escrow, **C** AI + evals, **D** dispatch UI + video. Interfaces are fixed by `API.md` and `packages/shared`.

---

## 1. Scope tiers

### Must ship (P0): the demo path

1. Nexconn multi-party channel with buyer, seller, bot (or fallback)
2. Live translation with original toggle
3. Dispute open, evidence upload, vision result card
4. Policy proposal with accept, counter, decline, auto-settle
5. Escalation freeze from threat language (ja and es demonstrated)
6. Dispatch: queue, case view, brief, takeover, copilot draft, one-click resolve
7. `/stage` three-pane sandbox with reset
8. Deployed, seeded, public repo, demo video, write-up PDF

### Should ship (P1) only if P0 is stable before Day 4 noon

Duplicate-image flag, UI chrome in ja and es, supervisor metrics strip, unfreeze, ops-channel queue deltas (SSE otherwise).

### Cut (P2)

Voice notes, Call SDK, seller analytics, embeddable widget, dark theme, zh and hi UI chrome.

### Cut order if behind
1. Ops-channel deltas (use SSE or 5-second poll)
2. Duplicate-image detection
3. UI chrome localization
4. Tone notes in translation
5. Counter-offer slider (keep accept/decline only; negotiation round becomes decline-escalate)
6. Brief regeneration (generate once at freeze)

Never cut: translation, evidence card, freeze, dispatch resolve, stage page, reset.

---

## 2. Schedule

### Day 0: Tue Nov 17 evening (3 to 4 h)

- Register challenge team and confirm track on the Reskilll page if not done.
- Nexconn console: account, app, App Key and Secret.
- **Spike** from `TRD.md` 4.3: connect, two-tab chat, custom message, server bot send, channel with 3 members. Write `docs/SPIKE_RESULT.md` with chosen mode (native or fallback) and exact signature recipe.
- Scaffold monorepo, shared Zod schemas, env, deploy empty API and web to get URLs early.
- Exit: two browsers chat through Nexconn; server posts a card into the channel.

### Day 1: Wed Nov 18: Core loop plumbing

- DB schema, seed, auth demo-session, order list.
- `POST /disputes`, channel creation, bot welcome and proof_request cards through outbox.
- Web: chat view with text bubbles and card renderer registry; welcome, proof_request, system_note.
- Translate endpoint with cache; bubble footer and toggle.
- Exit: Aiko (ja) and Marco (es) converse with translation on the deployed URL.

### Day 2: Thu Nov 19: Evidence, policy, proposals, risk

- Upload, downscale, storage, vision call, evidence_result card.
- Policy engine with unit tests; proposal cards; respond endpoint; settle path; escrow ledger.
- Risk analysis, freeze transaction, escalation_notice in three languages.
- Eval set written (30 cases) and first run; fix prompts.
- Exit: scenario A (settle) and half of B (freeze) work end to end.

### Day 3: Fri Nov 20: Dispatch

- Queue endpoint and UI, priority formula, filters.
- Case view with transcript in agent language, evidence panel, timeline.
- Brief generation at freeze, takeover, copilot draft with amount check, resolve actions with confirm modal, channel lock.
- `/stage` page with three iframes, scenario rail, reset, narration.
- Exit: scenario B complete from buyer message to agent resolve, three clean runs.

### Day 4: Sat Nov 21: Polish and freeze

- Morning: P1 items that survived. Error and empty states from `UIUX.md` section 6. Reconnect handling.
- Midday: Playwright for A and B against deployed URL. Fix flakes. Run eval set; record numbers.
- Afternoon: **feature freeze 16:00 IST.** After that only bug fixes.
- Evening: write-up draft, README, screenshots, record video take 1.
- Exit: three consecutive green E2E runs on production.

### Day 5: Sun Nov 22: Submit

- 09:00 to 12:00: video final take, edit, captions. Write-up PDF export. Repo cleanup (no secrets, license, README).
- 12:00: traction collection if any (see `SUBMISSION.md` section 6).
- 14:00: dry-run the submission form with every field filled.
- **By 18:00 IST: submit.** Re-open the link in a private window from a phone on mobile data.
- Night: do not change code. If a bug appears, fix only with a rerun of E2E.

### Buffer: Mon Nov 23 until 17:29 IST
Edit the submission if needed (edits allowed until the deadline per the challenge FAQ). No new features.

---

## 3. Daily rituals

- Morning: read this file, set the day's exit criterion, run `pnpm smoke` on production.
- Midday: commit and deploy; never let production lag more than a half day behind main.
- Night: run E2E, update `docs/STATUS.md` with done, blocked, next.

## 4. Risk register

| # | Risk | Likelihood | Impact | Mitigation | Trigger to switch |
|---|---|---|---|---|---|
| R1 | Nexconn custom messages, multi-party channels or server bot send do not work as assumed | Medium | High | Day-0 spike; adapter ports; fallback envelope on text; fallback DM-mirroring | Spike not green by end of Day 0 + 2 h: switch to fallback and move on |
| R2 | LLM latency or rate limits during demo | Medium | High | Fast model for hot path; parallel calls; cache; warm up before recording; keep 1 retry | p95 translate over 5 s in testing: shorten prompts, reduce context |
| R3 | Vision misreads photos | Medium | Medium | Conservative prompt; retake rule; "unverified" label; curated demo photos that work | Eval accuracy poor: add a retake step and demo with clear images |
| R4 | Freeze false positives look bad on video | Medium | Medium | Eval set with negation cases; reversible unfreeze; script the demo messages and rehearse | Misfires in rehearsal: adjust thresholds, not prompts at the last minute |
| R5 | iframe stage page connection issues (token reuse, cookies) | Low | High | One token per persona per iframe; test in Chrome, Safari, Firefox | Failure: stage uses three browser windows instructions as fallback |
| R6 | Deployment cold starts or free-tier sleep | Medium | High | Always-on instance; uptime pinger every 5 min; health check | Sleep detected: upgrade tier for a week (cheap insurance) |
| R7 | Scope creep | High | High | Cut order above; no new features after freeze | Day 3 end not at exit: cut P1 entirely |
| R8 | Secret leak | Low | High | `.env` ignored; CI bundle grep; rotate App Secret if committed | Any accidental commit: rotate immediately |
| R9 | Translation quality complaints on Japanese or Chinese | Medium | Medium | Native speaker spot-check of 10 demo strings; keep demo messages natural | Reviewer flags errors: adjust demo text and prompt |
| R10 | Judge cannot figure out the app | Medium | High | Stage page, 20-second explainer, reset button, deep links, narration | None: this is the 50% criterion; test with one stranger on Day 4 |
| R11 | Running out of LLM budget | Low | High | Cost counters; cap per user per hour; fixtures only for dev | Spend spike: lower rate limits |

## 5. Definition of done (submission)

Everything in `SUBMISSION.md` section 2 checklist is ticked, plus:
- Three clean E2E runs in the last 12 hours.
- Stranger test passed: someone who has not seen the app completes scenario A in under 4 minutes without help.
- Backup demo video uploaded and referenced in the write-up.
