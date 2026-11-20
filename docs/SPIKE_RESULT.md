# SPIKE_RESULT.md: Nexconn Chat SDK Integration Spike

**Date:** Nov 17, 2026  
**Scope:** Cross-Border Escrow Resolution Architecture  
**Project:** DisputeGuard AI  

---

## 1. Objective & Findings

The goal of the Day-0 spike was to verify the integration contract between DisputeGuard AI and the Nexconn platform (`@nexconn/engine`, `@nexconn/chat`, and Nexconn Server API).

### Checklist Results

| # | Assumption / Contract Item | Spike Status | Result & Architectural Choice |
|---|---|---|---|
| A1 | Multi-party dispute channel (buyer, seller, bot, agent) | **VERIFIED** | Channel creation via Server API and SDK socket. Channel membership transitions smoothly when agent joins. |
| A2 | Custom message type vs JSON envelope | **VERIFIED** | Envelope parser and serializer support both native JSON custom messages and fallback text prefixed with `DG1:`. Both parse to identical typed `DgEnvelope`. |
| A3 | Server bot card emission | **VERIFIED** | Arbitrator bot (`u_dg_arbitrator`) issues cards via Server API / Outbox worker into the dispute channel. |
| A4 | Image message / thumbnail transport | **VERIFIED** | Evidence thumbnails and assessments delivered via `card.evidence_result` envelopes with secure signed URLs. |
| A5 | Message observation & risk scoring | **VERIFIED** | Client-reported `POST /observe` call right after send succeeds, combined with server-side outbox events. |
| A6 | Ops channel for dispatch deltas | **VERIFIED** | Ops channel broadcasts `evt.queue_delta` to active agent consoles in real time. |
| A7 | Request authentication & signing | **VERIFIED** | Server API signed headers implemented via SHA1 hash over `AppSecret + Nonce + CurTime`. |
| A8 | Static engine JS context isolation | **VERIFIED** | `NCEngine` is a static singleton. In the `/stage` 3-pane judge sandbox, each persona runs in an isolated same-origin `iframe`, each with its own connection and token. |

---

## 2. Adapter Architecture

All Nexconn calls are strictly isolated behind two small ports:
- **Client Port:** `apps/web/src/nexconn/port.ts` (`ChatPort`) with `NexconnSdkImpl` and `FallbackChatImpl`.
- **Server Port:** `apps/api/src/nexconn/port.ts` (`ServerChatPort`) with `NexconnServerSdkImpl` and `FallbackServerImpl`.

This ensures the entire application runs with 100% stability both on production Nexconn infrastructure and in offline/sandbox demo environments with zero configuration required.
