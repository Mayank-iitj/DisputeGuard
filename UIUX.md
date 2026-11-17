# UIUX.md: DisputeGuard AI

Judges give 50% for "works end to end and is easy to use". Every screen below exists to make the demo path obvious.

---

## 1. Principles

1. **One obvious next action per screen.** Cards carry the action; the composer is secondary.
2. **Show the money state always.** Escrow pill in every dispute header.
3. **Translation is visible, not magic.** "Translated from Japanese" on every translated bubble, one tap to original.
4. **AI is labelled.** "AI-assessed, not verified" on evidence. "AI draft" on copilot text.
5. **Human authority is visible.** Anything money-moving has a confirm step with the amount in the button.
6. **Color never works alone.** Risk uses color + icon + word.

## 2. Surfaces

| Route | Persona | Purpose |
|---|---|---|
| `/stage` | Judge | Three side-by-side live panes (buyer, seller, dispatch) with a scenario rail. The default entry for judges |
| `/buyer` | Buyer | Orders list, order detail, dispute chat |
| `/seller` | Seller | Orders with disputes, dispute chat |
| `/dispatch` | Agent | Mission-control console |
| `/` | Anyone | Landing with 20-second explainer and "Open judge stage" button |

### 2.1 `/stage` layout (desktop 1440 wide)

```
+--------------------------------------------------------------------------------+
| DisputeGuard AI   Scenario: [A Damaged cup] [B Escalation]  Step 3/7  [Next ▸]  [Reset] |
+---------------------+---------------------+------------------------------------+
| BUYER  Aiko (日本語)  | SELLER Marco (ES)   | DISPATCH  Priya (EN)                |
| iframe /buyer        | iframe /seller      | iframe /dispatch                    |
|                      |                     |                                     |
|                      |                     |                                     |
+---------------------+---------------------+------------------------------------+
| Narration: "Aiko reports the cup arrived cracked. Marco sees it in Spanish."     |
+--------------------------------------------------------------------------------+
```

Why iframes: `NCEngine` is a static singleton, so each persona needs its own JS context. Panes are same-origin, each with its own session token. A pane header shows connection status dot.

The scenario rail calls `/demo/scenario/{name}/advance` only to **rehearse**; judges can ignore it and use the app freely. Narration text is optional and collapsible.

Mobile: stage collapses to tabs (Buyer | Seller | Dispatch).

## 3. Buyer and seller flows

### 3.1 Orders list
- Card per order: image, title, price, status badge, "Report a problem" button on `delivered`.
- Language chip in header (buyer's language), switchable for demo.

### 3.2 Report a problem (modal, 2 steps)
1. **What went wrong?** Four large tiles with icons: Damaged, Wrong item or size, Not received, Not as described. Optional one-line text.
2. **Confirm.** "Your payment stays protected in escrow while we sort this out." Primary button: "Start".

### 3.3 Dispute chat (core screen)

```
+------------------------------------------------------------+
| ← Ceramic pour-over set   $84.00     [🔒 Escrow: Held]  [JA] |
+------------------------------------------------------------+
|  ┌ Welcome card ───────────────────────────────────────┐   |
|  │ Order ord_1042 · Aiko ↔ Marco · Translation on (ja↔es)│   |
|  └──────────────────────────────────────────────────────┘   |
|  ┌ Proof request card ─────────────────────────────────┐   |
|  │ Show us the damage. Take these 3 photos:             │   |
|  │ ① Whole item  ② Close-up of damage  ③ Packaging      │   |
|  │ [ 📷 Take photos ]  [ Upload from gallery ]          │   |
|  └──────────────────────────────────────────────────────┘   |
|  Marco: Las tazas...      (Translated from Spanish · Original) |
|  ┌ Evidence result ────────────────────────────────────┐   |
|  │ [thumb][thumb]  Crack on rim · Severity ██░ 2/3      │   |
|  │ Confidence 81%   AI-assessed, not verified            │   |
|  └──────────────────────────────────────────────────────┘   |
|  ┌ Proposal (round 1) ─────────────────────────────────┐   |
|  │ ○ Keep item, 40% refund ($33.60)                      │   |
|  │ ○ Replacement sent                                    │   |
|  │ [ Accept ]  [ Counter ]  [ Decline ]                  │   |
|  │ You: pending · Marco: pending                         │   |
|  └──────────────────────────────────────────────────────┘   |
+------------------------------------------------------------+
| [📎] [ Message…                               ] [Send]      |
+------------------------------------------------------------+
```

Behaviors
- Cards are full-width, visually distinct from bubbles (surface color, border, icon).
- Bubbles: own on right, other on left, bot cards centered. Each translated bubble has a footer line: `Translated from {Language} · Show original`.
- A message that the server flags as masked frustration is **not** shown to the sender as flagged; the agent sees it. Users should not feel surveilled by a visible meter.
- Composer disables with a tooltip after `card.resolution`.
- Evidence capture uses a full-screen sheet with a shot-list stepper and live thumbnail strip. Camera via `<input type="file" accept="image/*" capture="environment">` for reliability; `getUserMedia` is optional.
- Frozen state: escrow pill changes to "🔒 Frozen · under review"; proposal buttons disable; chat stays open. A bilingual notice card appears, e.g. ja: "安全のため、担当者が確認します。支払いは保護されています。" / es: "Por seguridad, un agente revisará este caso. Su pago sigue protegido."
- Agent joined: avatar + "Priya from DisputeGuard has joined" in viewer's language.

### 3.4 Counter sheet
Slider limited to policy bounds with the amount live in the label; shows min and max; "Send counter". Out-of-range input is impossible, not merely rejected.

### 3.5 Seller view differences
- Same chat; proposal card shows "You pay" instead of "You get".
- Seller can upload counter-evidence with the same widget.
- Seller sees evidence thumbnails and assessment, but not integrity flags.

## 4. Dispatch Center (`/dispatch`)

Three-column mission control. Desktop first, 1366 wide minimum.

```
+--------------------------------------------------------------------------------------+
| ◉ DisputeGuard Dispatch   Open 7 · Frozen 2 · Unassigned 4   ● DB ● Chat ● AI   Priya ▾ |
+------------------+----------------------------------------+--------------------------+
| QUEUE            | CASE dsp_77a1  ● HIGH RISK  🔒 Frozen   | AI BRIEF                 |
| [All][JA][ES][ZH]| Aiko (ja) ↔ Marco (es) · $84.00        | • What happened ...      |
| Risk ≥ [▮▮▯▯]    |                                        | • Buyer claims ...       |
| ──────────────── | transcript (agent language: EN)        | • Seller claims ...      |
| ▌87 ● HIGH 🔒    | Aiko: The cup arrived broken. (JA ⇄)   | • Risk: chargeback       |
|  dsp_77a1 ja/es  | Marco: ...                             |   threat (82%)           |
|  Chargeback…     | ┌ card: evidence result ┐             |                          |
| ▌62 ● MED        | ...                                    | EVIDENCE                 |
|  dsp_81c0 zh/en  | ┌ system: Escrow frozen (risk) ┐       | [thumbs] sev 2 · 81%     |
| ▌31 ● LOW        |                                        |                          |
|  ...             | [AI draft → ja] [Intent ▾] [Generate]  | POLICY OPTIONS           |
|                  | ┌ draft (editable) ─────────────────┐  | ○ 40% keep ($33.60)      |
|                  | │ ご不便をおかけして…               │  | ○ Full refund on return  |
|                  | │ EN preview: I am sorry for…        │  |                          |
|                  | └────────────────────────────────────┘  | ACTIONS                  |
|                  | [Send as Priya]                         | [Take Over]              |
|                  |                                        | [Approve full refund     |
|                  |                                        |  $84.00 & release escrow]|
|                  |                                        | [Partial…] [Release to   |
|                  |                                        |  seller] [Request evid.] |
|                  |                                        | [Unfreeze…]              |
+------------------+----------------------------------------+--------------------------+
```

### 4.1 Queue (left)
- Row: priority number, risk band chip (icon + word), dispute ID, language pair, reason icon, one-line headline from risk event, waiting timer, lock icon if frozen.
- New or updated rows animate: 400 ms highlight, no layout jump.
- Filters: language chips, risk slider, status, "mine". Keyboard: `j/k` move, `Enter` open, `t` take over.

### 4.2 Case (center)
- Transcript in agent language by default; hover or click shows original; tag per bubble shows source language.
- Timeline events inline: freeze, evidence, proposal, agent join.
- Copilot panel docked at bottom: intent select, "Generate draft", editable textarea in target language, English preview line, warnings (for example "Draft mentions $50.00, not in policy options") in amber. Nothing sends until "Send as {Agent}".

### 4.3 Side panel (right)
- Brief, evidence, policy options, risk reasons (agent only), integrity flags (agent only), actions.
- **Resolution buttons carry the consequence in the label.** "Approve full refund $84.00 and release escrow". Click opens a confirm dialog with a required one-line note (prefilled suggestion), the ledger preview, and a single confirm button. After confirm: toast, resolution card appears, channel locks, row leaves the active queue.
- Override of policy amount requires toggle "Exceed policy" and a note of 20+ characters; the button turns amber and says "Override".

### 4.4 Supervisor strip
Header counters plus a metrics popover: median first action, median resolution, auto-resolved 24h, overrides 24h.

## 5. Visual system

### Color tokens (light theme default, dark optional)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F6F7F9` | App background |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--ink` | `#14181F` | Text |
| `--muted` | `#5B6472` | Secondary text |
| `--brand` | `#2557D6` | Primary buttons, links |
| `--escrow-held` | `#1F7A4D` | Held pill |
| `--escrow-frozen` | `#B42318` | Frozen pill |
| `--risk-low` | `#2B7A5B` | Low |
| `--risk-med` | `#B7791F` | Medium |
| `--risk-high` | `#B42318` | High |
| `--ai` | `#6B46C1` | AI labels and draft borders |
| `--border` | `#E2E5EA` | Dividers |

Contrast: all text pairs at WCAG AA or better; verify with a checker before the video.

### Type
- UI: Inter (system fallback). Monospace for IDs: JetBrains Mono or `ui-monospace`.
- Latin 14/16 px body. CJK text uses the system CJK stack with 1.6 line height.
- Dispatch is denser: 13 px body, 12 px meta.

### Shape and motion
- 12 px radius cards, 8 px buttons, 1 px borders, soft shadow only on modals.
- Motion budget: card appears with 180 ms fade and 8 px rise; freeze event: escrow pill cross-fades and a 600 ms lock icon shake (disabled under `prefers-reduced-motion`).
- No decorative gradients or glassmorphism; this is operations software.

### Iconography
Lucide icons: `package`, `camera`, `shield-check`, `lock`, `languages`, `siren` (risk), `user-check` (agent), `receipt` (ledger).

## 6. States to design (do not skip)

| Component | Empty | Loading | Error |
|---|---|---|---|
| Orders list | "No delivered orders yet" | Skeleton rows | Retry card |
| Chat | "Your conversation starts here" | Skeleton bubbles | "Reconnecting…" banner |
| Translation | n/a | Original shown with shimmer line | "Couldn't translate · Retry · Original shown" |
| Evidence | Shot-list stepper | "Analyzing photos… about 8 seconds" with progress dots | "We couldn't read these photos. Retake in better light." |
| Proposal | n/a | Disabled buttons + spinner on respond | Inline error with reason |
| Dispatch queue | "All clear. No open cases." | Skeleton rows | "Queue stale · Retry" |
| Brief | n/a | "Generating brief…" | "Brief unavailable. Read the transcript" |
| Copilot | "Choose an intent" | "Drafting…" | "Draft failed · Retry" |

## 7. Internationalization

- Message content: handled by translation, per viewer language.
- UI chrome: dictionary files `en`, `ja`, `es` (P1), `zh` (P2). Keys flat, ICU-lite placeholders. Dispatch UI is English only.
- Dates and currency via `Intl` with viewer locale.
- Pseudo-locale test string for layout (long German-like expansion).

## 8. Microcopy deck (en; translate to ja/es)

| Context | Copy |
|---|---|
| Report CTA | Report a problem |
| Escrow held | Your payment is protected while this is sorted out |
| Escrow frozen | Payment is on hold while an agent reviews this case |
| Proof request title | Show us what happened |
| Proof request body | Clear photos help us settle this faster. Take these shots: |
| Evidence label | AI-assessed, not verified |
| Proposal title | Suggested ways to settle |
| Proposal footer | Amounts follow our marketplace policy v1 |
| Counter helper | You can counter within {min} to {max} |
| Escalation notice (en) | For everyone's safety, a DisputeGuard agent is reviewing this case. Your payment stays protected. |
| Agent joined | {name} from DisputeGuard has joined to help |
| Resolution | Resolved: {outcome}. This conversation is now closed. |
| Translate footer | Translated from {language} · Show original |
| Copilot warning | This draft mentions an amount that is not in the policy options |
| Confirm refund | Refund {amount} to buyer and release escrow |

Tone: calm, specific, no blame, no jargon, no exclamation marks.

## 9. Accessibility checklist

- All interactive elements reachable by keyboard; visible focus ring.
- Cards announce state changes through `aria-live="polite"`.
- Risk chips include text; escrow pill includes text.
- Touch targets at least 44 px on buyer and seller views.
- Image thumbnails have alt text built from the assessment ("Crack on rim, severity 2").
- Reduced motion respected.

## 10. Judge-friendly details

- The landing page has a single large button: **Open judge stage**. It auto-creates sessions for three personas.
- A "How this works in 20 seconds" strip on `/stage`: three icons, three sentences.
- A permanent footer on `/stage`: "Escrow is simulated. AI assessments are labelled and human-approved above $50." (Matches `AUTO_APPROVE_CEILING_MINOR=5000` in USD; update if config changes.)
- Reset button restores the seeded state in under 5 seconds so judges can retry.
- Deep link: `/stage?scenario=B` starts at the escalation scenario.
