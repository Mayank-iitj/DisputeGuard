import { z } from 'zod';
import {
  MoneySchema,
  ProposalOptionSchema,
} from './envelope';
import {
  DisputeReasonSchema,
  DisputeSummarySchema,
  EscrowLedgerEntrySchema,
  EscrowStateSchema,
  OrderSchema,
  RiskBandSchema,
  UserRoleSchema,
  UserSchema,
} from './models';

// Auth
export const DemoSessionRequestSchema = z.object({
  persona: z.string(),
});
export type DemoSessionRequest = z.infer<typeof DemoSessionRequestSchema>;

export const DemoSessionResponseSchema = z.object({
  jwt: z.string(),
  user: UserSchema,
  nexconn: z.object({
    appKey: z.string(),
    userId: z.string(),
    token: z.string(),
  }),
});
export type DemoSessionResponse = z.infer<typeof DemoSessionResponseSchema>;

// Disputes
export const CreateDisputeRequestSchema = z.object({
  orderId: z.string(),
  reason: DisputeReasonSchema,
  text: z.string().optional().default(''),
});
export type CreateDisputeRequest = z.infer<typeof CreateDisputeRequestSchema>;

// Observe
export const ObserveRequestSchema = z.object({
  messageUid: z.string(),
  text: z.string(),
  ts: z.number().default(() => Date.now()),
});
export type ObserveRequest = z.infer<typeof ObserveRequestSchema>;

export const ObserveResponseSchema = z.object({
  detectedLang: z.string(),
  risk: z.object({
    band: RiskBandSchema,
    score: z.number(),
    frozen: z.boolean(),
    triggers: z.array(z.string()).default([]),
  }),
});
export type ObserveResponse = z.infer<typeof ObserveResponseSchema>;

// Translate
export const TranslateItemRequestSchema = z.object({
  messageUid: z.string(),
  text: z.string(),
});
export const TranslateRequestSchema = z.object({
  disputeId: z.string(),
  targetLang: z.string(),
  items: z.array(TranslateItemRequestSchema),
});
export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

export const TranslateItemResponseSchema = z.object({
  messageUid: z.string(),
  sourceLang: z.string(),
  translation: z.string(),
  toneNote: z.string().nullable().optional(),
  cached: z.boolean().default(false),
});
export const TranslateResponseSchema = z.object({
  items: z.array(TranslateItemResponseSchema),
});
export type TranslateResponse = z.infer<typeof TranslateResponseSchema>;

// Proposals
export const ProposalRespondRequestSchema = z.object({
  response: z.enum(['accept', 'counter', 'decline']),
  optionId: z.string().optional(),
  counterAmount: MoneySchema.optional(),
});
export type ProposalRespondRequest = z.infer<typeof ProposalRespondRequestSchema>;

// Agent Queue
export const QueueItemSchema = z.object({
  disputeId: z.string(),
  priority: z.number(),
  risk: z.object({
    band: RiskBandSchema,
    score: z.number(),
    frozen: z.boolean(),
  }),
  reason: DisputeReasonSchema,
  langs: z.array(z.string()),
  amount: MoneySchema,
  waitingMs: z.number(),
  status: z.string(),
  assignedTo: z.string().nullable(),
  headline: z.string(),
  orderTitle: z.string().optional(),
});
export type QueueItem = z.infer<typeof QueueItemSchema>;

export const QueueResponseSchema = z.object({
  items: z.array(QueueItemSchema),
  counts: z.object({
    open: z.number(),
    frozen: z.number(),
    unassigned: z.number(),
  }),
});
export type QueueResponse = z.infer<typeof QueueResponseSchema>;

// Agent Takeover
export const TakeoverRequestSchema = z.object({
  force: z.boolean().optional().default(false),
});
export type TakeoverRequest = z.infer<typeof TakeoverRequestSchema>;

// Copilot Draft
export const CopilotDraftRequestSchema = z.object({
  intent: z
    .enum([
      'apologize_and_offer',
      'ask_for_more_photos',
      'explain_policy',
      'de_escalate',
      'confirm_resolution',
    ])
    .optional(),
  targetParty: z.enum(['buyer', 'seller']).default('buyer'),
});
export type CopilotDraftRequest = z.infer<typeof CopilotDraftRequestSchema>;

// Resolve
export const ResolveDisputeRequestSchema = z.object({
  action: z.enum(['refund_full', 'refund_partial', 'release_to_seller', 'request_more_evidence']),
  note: z.string().min(5),
  amount: MoneySchema.optional().nullable(),
  override: z.boolean().optional().default(false),
});
export type ResolveDisputeRequest = z.infer<typeof ResolveDisputeRequestSchema>;

export const UnfreezeRequestSchema = z.object({
  reason: z.string().min(10),
});
export type UnfreezeRequest = z.infer<typeof UnfreezeRequestSchema>;

export const AgentMetricsResponseSchema = z.object({
  open: z.number(),
  frozen: z.number(),
  autoResolved24h: z.number(),
  medianFirstActionMs: z.number(),
  medianResolutionMs: z.number(),
});
export type AgentMetricsResponse = z.infer<typeof AgentMetricsResponseSchema>;

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  db: z.object({ status: z.string(), latencyMs: z.number() }),
  nexconn: z.object({ status: z.string(), latencyMs: z.number() }),
  llm: z.object({ status: z.string(), latencyMs: z.number() }),
  version: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
