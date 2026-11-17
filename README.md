# DisputeGuard AI

**Cross-border marketplace disputes, resolved inside the chat where they start.**
Every order dispute becomes a Nexconn channel with a translated conversation, structured evidence cards, a bounded refund proposal, an escrow state, and a human dispatch center for the cases that need a person.

Built for the **Nexconn Build Challenge 2026** (Reskilll x Nexconn). Deadline: **Nov 22, 23:59 AoE** (= Nov 23, 11:59 UTC = Nov 23, 17:29 IST).

---

## Doc index

| File | Purpose | Read when |
|---|---|---|
| `PRD.md` | Problem, users, scope, requirements, success metrics | Deciding what to build |
| `TRD.md` | Stack, repo layout, Nexconn integration contract, Day-0 spike | Writing code |
| `API.md` | REST endpoints, chat envelope schema, errors | Wiring client and server |
| `Design.md` | Domain model, state machines, policy engine, risk algorithm, DB schema | Implementing backend logic |
| `SystemDesign.md` | Architecture, sequences, failure modes, security, scale path | Building infra, answering judges |
| `UIUX.md` | Screens, flows, tokens, microcopy, empty/error states | Building frontend |
| `AI_PROMPTS.md` | Prompts, JSON schemas, injection defense, eval set | Wiring the LLM |
| `BUILD_PLAN.md` | 5-day schedule, cut list, risk register | Every morning |
| `TEST_PLAN.md` | Acceptance tests mapped to judging criteria | Before recording the demo |
| `SUBMISSION.md` | Write-up text, form checklist, demo script, Q&A prep, traction plan | Final 24 hours |

## Judging weights (from the challenge page) and where each doc attacks them

| Criterion | Weight | Primary docs |
|---|---|---|
| Completeness and user experience ("does it work?") | 50% | `BUILD_PLAN.md` (scope cuts), `TEST_PLAN.md`, `UIUX.md` |
| Innovation and scenario value | 30% | `PRD.md`, `Design.md`, `AI_PROMPTS.md` |
| Business and growth potential | 20% | `PRD.md` section 9, `SUBMISSION.md` |

Required by the challenge: app uses Nexconn Chat SDK or Chat UI. Submission = runnable app link, public GitHub repo, demo video, write-up PDF with App Key, optional traction proof.

## Non-negotiable principles

1. **AI proposes, code computes, a human approves above a threshold.** The LLM never moves money and never picks a refund number.
2. **Escrow in this build is simulated.** No real payment rail. Say so in the write-up. The ledger, state machine and audit trail are real.
3. **Nexconn carries the dispute.** Cards, system events, agent handover and ops events travel over Nexconn channels. The database is the source of truth; Nexconn is the live bus users see.
4. **Everything judged must run live from the submitted link.** Fixtures exist for offline dev only.
5. **No unsourced statistics** in the write-up or video.

## Quickstart (target state)

```bash
git clone <repo> && cd disputeguard
cp .env.example .env            # fill NEXCONN_APP_KEY, NEXCONN_APP_SECRET, ANTHROPIC_API_KEY, DATABASE_URL
pnpm i
pnpm db:migrate && pnpm db:seed
pnpm dev                        # web :5173, api :8787
# open http://localhost:5173/stage  -> three-pane judge sandbox (buyer / seller / dispatch)
```

Use the Nexconn coding-assistant skill to resolve any SDK API doubt quickly:

```bash
npx skills add https://github.com/NexconnAI-Dev/nexconn-skills.git --skill nexconn-chat
```
