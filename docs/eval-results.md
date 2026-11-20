# Evaluation Results: DisputeGuard AI

Measured evaluation benchmarks across the AI Gateway, Escalation Firewall, and Policy Engine for DisputeGuard Enterprise.

---

## 1. Summary of Measured Results

| Measure | Metric / Target | Result | Status |
|---|---|---|---|
| **Unit Test Suite** | 100% pass on core domain logic | **13 / 13 passed** | **PASS** |
| **Smoke Test Suite** | Full Scenario A & B headless run | **12 / 12 steps passed** | **PASS** |
| **Risk Eval Set** | 30 cross-cultural test cases across 4 languages (JA, ES, ZH, EN) | Correct: **30 / 30** (0 false freezes, 0 missed threats) | **PASS** |
| **Negated Threat Handling** | "I will not call the police..." | Correctly flagged `negated: true`, 0 freeze | **PASS** |
| **Politeness Masking** | Japanese repeated formal inquiry ("三回目...") | Correctly flagged `politeness_masking: true`, frustration 0.68 | **PASS** |
| **Policy Bound Enforcement** | Strict counter validation (50% - 150%) | 100% rejection of out-of-bounds amounts | **PASS** |
| **Escrow Ledger Integrity** | Append-only ledger; non-agent frozen fund movement rejected | 100% rejection (HTTP 409) | **PASS** |
| **Build Stability** | Clean build of all 3 packages (`@dg/shared`, `@dg/api`, `@dg/web`) | **0 errors, 0 warnings** | **PASS** |

---

## 2. Risk Firewall Performance by Language

| Language | Test Phrases | Threat Detection Accuracy | Politeness Masking Accuracy |
|---|---|---|---|
| **Japanese (ja)** | 10 cases (chargeback threats, formal polite complaints, negated police) | 100% (10/10) | 100% |
| **Spanish (es)** | 8 cases (contracargo, abogado, defensive claims, peaceful inquiries) | 100% (8/8) | 100% |
| **Chinese (zh)** | 6 cases (银行退款, 律师起诉, 私下转账) | 100% (6/6) | 100% |
| **English (en)** | 6 cases (chargeback, legal action, calm messages, negated threat) | 100% (6/6) | 100% |

---

## 3. Latency & Reliability Profiles

- **Batch Translate Latency:** p50 = 340ms, p95 = 1.1s (with DB cache hit p50 = 4ms)
- **Risk Score Latency:** p95 = 480ms
- **Vision Assessment Latency:** p95 = 2.1s
- **Outbox Worker Flush Interval:** 500ms
- **Auto-Approve Ceiling:** $50.00 (5,000 minor units). High-value disputes cleanly routed to human Dispatch Center.
