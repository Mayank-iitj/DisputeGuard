# TRD: DisputeGuard AI

Version 1.0 | Read with `Design.md` (logic) and `SystemDesign.md` (architecture)

---

## 1. Stack

| Layer | Choice | Reason |
|---|---|---|
| Web client | React 18, Vite, TypeScript, Tailwind | Fast to build, matches Nexconn Web SDK |
| Chat | `@nexconn/engine`, `@nexconn/chat` (Web Chat SDK). Chat UI web package (`nexconn-chatui-web`, Lit components) optional | Challenge requires Chat SDK or Chat UI |
| Backend | Node 20, Fastify, TypeScript, Zod | Small, typed, quick |
| DB | Postgres (Neon or Supabase) with Drizzle ORM | Hosted, free tier, transactions for escrow ledger |
| Object storage | Supabase Storage or Cloudflare R2, private bucket, signed URLs | Evidence images |
| LLM | Anthropic API behind a `LlmPort` interface. Fast model for translate and risk, stronger model for vision and brief. Model IDs in env | Single vendor, vision + structured output |
| Hosting | Web on Vercel, API on Render or Fly (always-on instance, no cold start during judging) | Stable demo |
| Tests | Vitest (unit), Playwright (E2E) | Covered in `TEST_PLAN.md` |

Recommendation: do **not** use Nexconn Chat UI for the main dispute view. Build a custom message list on the Chat SDK so cards render natively. Use Chat UI only if it saves time on the buyer's order-list screen. Either path satisfies the rule ("Chat UI is built on the Chat SDK, so Chat UI counts").

## 2. Repo layout

```
disputeguard/
  apps/
    web/                 # React app: /stage, /buyer, /seller, /dispatch
      src/
        nexconn/         # ALL SDK access lives here (adapter)
        features/chat/   # message list, card renderers, composer
        features/dispatch/
        features/evidence/
        i18n/
    api/                 # Fastify server
      src/
        routes/
        domain/          # dispute, escrow, policy, risk, ranking
        ai/              # LlmPort, prompts, schemas, fixtures
        nexconn/         # server adapter: tokens, bot sends, webhook
        db/              # drizzle schema, migrations, seed
  packages/
    shared/              # zod schemas: envelope, DTOs, enums
  docs/                  # this doc pack
  .env.example
```

Rule: no file outside `apps/web/src/nexconn/` and `apps/api/src/nexconn/` imports from `@nexconn/*`. This isolates every unverified SDK call behind two small files.

## 3. Environment variables

```
# Nexconn
NEXCONN_APP_KEY=
NEXCONN_APP_SECRET=            # server only, never shipped to client
NEXCONN_DATA_CENTER=SG         # console shows default (Singapore)

# AI
ANTHROPIC_API_KEY=
LLM_MODEL_FAST=claude-haiku-5-5
LLM_MODEL_STRONG=claude-sonnet-5-5
AI_FIXTURES=0                  # 1 only for offline dev; must be 0 in submitted build

# Data
DATABASE_URL=
STORAGE_BUCKET=evidence
STORAGE_URL=
STORAGE_KEY=

# App
JWT_SECRET=
PUBLIC_API_URL=
AUTO_APPROVE_CEILING_MINOR=5000   # in minor units of order currency
POLICY_VERSION=v1
DEMO_MODE=1                       # enables /demo/* routes and persona sessions
```

## 4. Nexconn integration contract

### 4.1 What is confirmed from public docs

| Item | Detail |
|---|---|
| Packages | `npm install @nexconn/engine @nexconn/chat` |
| Init | `NCEngine.initialize({ appKey })` exactly once per app lifecycle |
| Connect | `NCEngine.connect({ token })`; call once, SDK reconnects itself |
| Handlers | `NCEngine.addConnectionStatusHandler(id, new ConnectionStatusHandler({...}))`, `NCEngine.addMessageHandler(id, new MessageHandler({...}))` |
| Send | `DirectChannel` plus `SendTextMessageParams({ text })` shown in quickstart |
| Token | App server calls Server API "Register User" using App Key and App Secret; client receives token |
| Static engine | `NCEngine` is static: **one connection per JS context** |
| Plan | Free plan on signup, Singapore data center default; App Key and App Secret on Key Management page |
| Server SDK | A Go server SDK exists; for Node, call the REST Server API directly with signed headers |

### 4.2 What is assumed and must be verified on Day 0

| # | Assumption | Needed for | Fallback if false |
|---|---|---|---|
| A1 | A multi-party channel class exists (group channel) with create, join, member list | Dispute channel with 3 to 4 members | One `DirectChannel` per participant pair, backend mirrors cards into both. Worse, but works |
| A2 | Custom message type can be registered and sent with a JSON payload | Cards | Encode envelope as JSON text with prefix `DG1:`; renderer detects prefix |
| A3 | Server API can send a message as a given user ID (bot) into a channel | Arbitrator cards, system events | Run a headless bot client with the Web SDK in Node (needs WebSocket polyfill); if that fails, post cards from the buyer/agent client on server instruction |
| A4 | Image message send and receive | Evidence thumbnails in chat | Backend posts card with signed image URL (default plan anyway) |
| A5 | Server callback (webhook) for message events is configurable on the free plan | Authoritative message observation | Client-reported observe call (default plan) |
| A6 | A chatroom or group can serve as an ops channel | Live queue deltas | SSE endpoint from API |
| A7 | Signed request headers for Server API | Bot sends, user registration | Copy scheme from docs; community repos for this challenge use SHA1 over secret, nonce, timestamp |
| A8 | Message handler gives sender ID, channel ID, message UID, timestamp, content object | Rendering, observe | None needed; basic |

### 4.3 Day-0 spike (target 2 hours, blocking)

Create `spike/` with a single page and a single script. Done = all boxes ticked or a fallback chosen and written in `docs/SPIKE_RESULT.md`.

```
[ ] Console: app created, App Key + Secret copied, region noted
[ ] Server: register user "buyer_aiko", get token (record exact endpoint, headers, signature recipe)
[ ] Web: initialize + connect with token, connection handler logs CONNECTED
[ ] Two browser tabs (buyer, seller) exchange text messages in one channel
[ ] Create multi-party channel with 3 members OR decide fallback A1
[ ] Send custom-typed message with JSON payload OR decide fallback A2
[ ] Server sends a message as user "dg_arbitrator" into that channel OR decide fallback A3
[ ] Receiving tab logs sender, channel, uid, timestamp, content
[ ] Image message sent from client received in other tab OR confirm A4 fallback
[ ] Webhook reachable (ngrok) and receives one message event OR confirm A5 fallback
```

Use the Nexconn coding-assistant skill to answer these quickly:
`npx skills add https://github.com/NexconnAI-Dev/nexconn-skills.git --skill nexconn-chat`

### 4.4 Adapter interfaces (write these first)

Client side, `apps/web/src/nexconn/port.ts`:

```ts
import type { DgEnvelope } from '@dg/shared';

export interface ChatPort {
  init(appKey: string): void;                       // once
  connect(token: string): Promise<{ userId: string }>;
  onConnection(cb: (s: 'connected' | 'connecting' | 'disconnected') => void): () => void;

  joinChannel(channelId: string): Promise<void>;
  sendText(channelId: string, text: string): Promise<{ uid: string; ts: number }>;
  history(channelId: string, before?: number, limit?: number): Promise<ChatMessage[]>;
  onMessage(cb: (m: ChatMessage) => void): () => void;
}

export type ChatMessage =
  | { kind: 'text'; uid: string; channelId: string; senderId: string; ts: number; text: string }
  | { kind: 'envelope'; uid: string; channelId: string; senderId: string; ts: number; env: DgEnvelope };
```

Server side, `apps/api/src/nexconn/port.ts`:

```ts
export interface ServerChatPort {
  registerUser(userId: string, name: string, avatarUrl?: string): Promise<{ token: string }>;
  createChannel(channelId: string, memberIds: string[]): Promise<void>;
  addMember(channelId: string, userId: string): Promise<void>;
  sendEnvelope(channelId: string, fromUserId: string, env: DgEnvelope): Promise<{ uid: string }>;
  closeChannel(channelId: string): Promise<void>;   // implemented as "bot posts closed card + app-level lock" if native close is absent
}
```

Two implementations per port: `NexconnSdkImpl` and `FallbackImpl` selected by `NEXCONN_MODE=native|fallback`. The envelope type is the same in both, so UI code never changes.

### 4.5 Envelope

Defined in `API.md` section 6. Wire format on native custom message: JSON object. On fallback text message: `DG1:` + JSON string. The client parser accepts both.

### 4.6 Connection rules that bite

- One `NCEngine` per JS context. The `/stage` page runs buyer, seller and dispatch in **three same-origin iframes**, each with its own connection and token.
- `initialize` and `connect` exactly once per context. Guard with a module-level promise; React StrictMode double-mount will otherwise call them twice in dev.
- Keep the App Secret server-side. The client only ever receives the App Key and a user token.
- Reconnect UI: show a thin banner on `disconnected`; queue sends only if the SDK does not.

## 5. Backend modules

| Module | Responsibility |
|---|---|
| `routes/auth` | Demo persona session; returns JWT and Nexconn token |
| `routes/disputes` | Create, read, timeline, observe, proposals respond |
| `routes/evidence` | Upload, run vision, post card |
| `routes/translate` | Batch translate with cache |
| `routes/agent` | Queue, takeover, brief, copilot, resolve, unfreeze, metrics |
| `routes/demo` | Reset, seed, scenario advance |
| `domain/dispute` | State machine and guards |
| `domain/escrow` | Ledger writes and state transitions |
| `domain/policy` | Policy table and option generation |
| `domain/risk` | Message score ingestion, freeze decision |
| `domain/ranking` | Queue priority |
| `ai/*` | `LlmPort`, prompt builders, Zod output validators, retry, fixtures |
| `nexconn/*` | Token, channel, send, webhook |

All state changes happen in a single DB transaction that also writes an `outbox` row. A small worker flushes the outbox to Nexconn (send card). This makes "DB says frozen but chat shows nothing" self-healing.

## 6. Performance budgets

| Operation | Budget | How |
|---|---|---|
| Translate one message | p95 under 4 s | Fast model, short prompt, cache, translate only for the counterpart's language, prefetch on observe |
| Risk score | under 2.5 s | Fast model, structured output, parallel with translate |
| Vision (up to 4 images) | p95 under 10 s | Downscale to 1280 px long edge before sending, one call with all images |
| Brief generation | under 6 s | Strong model, generated on escalation and cached; regenerated on demand |
| Copilot draft | under 5 s | Fast model plus policy and order context |

## 7. Error handling rules

- Every LLM call: timeout 12 s, 1 retry with backoff, Zod-validated output, on failure return a typed `AI_UNAVAILABLE` and degrade (show original text, skip card, mark "AI check pending", keep chat working).
- Every API write: idempotency key header on proposal responses and agent actions.
- Never throw raw provider errors to the client.

## 8. Security requirements (summary)

Full model in `SystemDesign.md` section 8.

- JWT per persona, short TTL, role claim checked on every route.
- Dispute membership check on every dispute-scoped route.
- Signed, expiring URLs for images (5 minutes).
- Chat content is untrusted input to the LLM; structured outputs only, no tool access, no money authority.
- Rate limits: 30 requests per minute per user on translate and observe, 5 uploads per minute.

## 9. Deployment

1. Neon or Supabase: create DB, run migrations, seed.
2. Render or Fly: deploy API with env, health check `/health`, min instances 1.
3. Vercel: deploy web with `PUBLIC_API_URL`.
4. Nexconn console: confirm App Key matches; if webhook mode, set callback URL.
5. Smoke: `pnpm smoke` hits `/health`, creates a demo session, runs scenario A headlessly.
6. Freeze deploys on Nov 21 evening. After that, config-only changes.

## 10. Definition of done (technical)

- Day-0 spike result documented.
- `pnpm test` green; Playwright scenario A and B green against the deployed URL.
- Three consecutive clean runs of the demo path on the live link.
- README quickstart works on a clean clone.
- No secrets in the repo; App Secret absent from client bundle (grep in CI).
