import { z } from 'zod';
import { MoneySchema } from './envelope';

export const UserRoleSchema = z.enum(['buyer', 'seller', 'agent', 'supervisor', 'bot']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: UserRoleSchema,
  lang: z.string(),
  avatar: z.string().optional().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export const OrderStatusSchema = z.enum([
  'paid',
  'shipped',
  'delivered',
  'disputed',
  'completed',
  'refunded',
  'partially_refunded',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string().nullable().optional(),
  amount: MoneySchema,
  status: OrderStatusSchema,
  deliveredAt: z.number().nullable().optional(),
  buyerId: z.string(),
  sellerId: z.string(),
  disputeId: z.string().nullable().optional(),
  category: z.string().default('general'),
});
export type Order = z.infer<typeof OrderSchema>;

export const DisputeStatusSchema = z.enum([
  'OPEN',
  'EVIDENCE_REQUESTED',
  'EVIDENCE_SUBMITTED',
  'PROPOSAL_MADE',
  'PENDING_AGENT_APPROVAL',
  'ESCALATED',
  'AGENT_ASSIGNED',
  'RESOLVED',
  'CLOSED',
]);
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;

export const DisputeReasonSchema = z.enum([
  'damaged',
  'wrong_item_or_size',
  'not_received',
  'not_as_described',
  'other',
]);
export type DisputeReason = z.infer<typeof DisputeReasonSchema>;

export const EscrowStateSchema = z.enum([
  'HELD',
  'FROZEN',
  'RELEASED_TO_SELLER',
  'REFUNDED_PARTIAL',
  'REFUNDED_FULL',
]);
export type EscrowState = z.infer<typeof EscrowStateSchema>;

export const RiskBandSchema = z.enum(['low', 'medium', 'high']);
export type RiskBand = z.infer<typeof RiskBandSchema>;

export const ThreatTypeSchema = z.enum([
  'none',
  'chargeback',
  'legal',
  'police',
  'scam_accusation',
  'off_platform_payment',
  'violence',
]);
export type ThreatType = z.infer<typeof ThreatTypeSchema>;

export const ThreatSchema = z.object({
  type: ThreatTypeSchema,
  confidence: z.number().min(0).max(1),
  negated: z.boolean().default(false),
  quoted: z.boolean().default(false),
});
export type Threat = z.infer<typeof ThreatSchema>;

export const RiskAnalysisSchema = z.object({
  lang: z.string(),
  frustration: z.number().min(0).max(1),
  surface_tone: z.enum(['polite', 'neutral', 'angry']),
  politeness_masking: z.boolean(),
  threat: ThreatSchema,
  scam_signals: z.array(z.string()).default([]),
  quote_en: z.string().default(''),
});
export type RiskAnalysis = z.infer<typeof RiskAnalysisSchema>;

export const EscrowLedgerEntrySchema = z.object({
  id: z.string(),
  disputeId: z.string(),
  type: z.string(),
  fromState: EscrowStateSchema,
  toState: EscrowStateSchema,
  amount: MoneySchema,
  actorId: z.string(),
  reasonCode: z.string(),
  note: z.string().nullable().optional(),
  createdAt: z.number(),
});
export type EscrowLedgerEntry = z.infer<typeof EscrowLedgerEntrySchema>;

export const EvidenceFileSchema = z.object({
  url: z.string(),
  w: z.number().optional(),
  h: z.number().optional(),
  phash: z.string().optional(),
});
export type EvidenceFile = z.infer<typeof EvidenceFileSchema>;

export const EvidenceAssessmentSchema = z.object({
  item_visible: z.boolean().default(true),
  matches_order_description: z.enum(['yes', 'no', 'unclear']).default('yes'),
  damage_present: z.boolean(),
  damage_type: z.string(),
  damage_location: z.string(),
  severity: z.number().int().min(0).max(3),
  image_quality_issues: z.array(z.string()).default([]),
  needs_retake: z.boolean().default(false),
  confidence: z.number().min(0).max(1),
  notes_en: z.string().default(''),
});
export type EvidenceAssessment = z.infer<typeof EvidenceAssessmentSchema>;

export const EvidenceIntegritySchema = z.object({
  reusedImage: z.boolean().default(false),
  exifMismatch: z.boolean().default(false),
  matchedDisputeIds: z.array(z.string()).default([]),
});
export type EvidenceIntegrity = z.infer<typeof EvidenceIntegritySchema>;

export const DisputeSummarySchema = z.object({
  id: z.string(),
  orderId: z.string(),
  channelId: z.string(),
  status: DisputeStatusSchema,
  reason: DisputeReasonSchema,
  escrow: z.object({
    state: EscrowStateSchema,
    amount: MoneySchema,
  }),
  risk: z.object({
    band: RiskBandSchema,
    score: z.number(),
    frozen: z.boolean(),
    triggers: z.array(z.string()).optional(),
  }),
  participants: z.array(
    z.object({
      id: z.string(),
      role: UserRoleSchema,
      lang: z.string(),
      name: z.string().optional(),
    })
  ),
  createdAt: z.number(),
  orderTitle: z.string().optional(),
  orderAmount: MoneySchema.optional(),
  assignedAgentId: z.string().nullable().optional(),
});
export type DisputeSummary = z.infer<typeof DisputeSummarySchema>;

export const AgentBriefSchema = z.object({
  generatedAt: z.number(),
  summary: z.array(z.string()),
  claims: z.object({
    buyer: z.string(),
    seller: z.string(),
  }),
  evidence: z.object({
    present: z.boolean(),
    severity: z.number().int(),
    confidence: z.number(),
    flags: z.array(z.string()),
  }),
  riskReasons: z.array(
    z.object({
      messageUid: z.string().optional(),
      type: z.string(),
      confidence: z.number(),
      quote_en: z.string(),
      lang: z.string(),
    })
  ),
  recommended: z.object({
    action: z.string(),
    amount: MoneySchema,
    rationale: z.string(),
  }),
  policyOptions: z.array(z.any()),
});
export type AgentBrief = z.infer<typeof AgentBriefSchema>;

export const CopilotDraftSchema = z.object({
  lang: z.string(),
  text: z.string(),
  english: z.string(),
  grounding: z.array(z.string()),
  warnings: z.array(z.string()),
});
export type CopilotDraft = z.infer<typeof CopilotDraftSchema>;
