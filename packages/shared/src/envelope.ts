import { z } from 'zod';

export const MoneySchema = z.object({
  value: z.number().int(),
  currency: z.string().length(3),
});
export type Money = z.infer<typeof MoneySchema>;

export const AudienceSchema = z.enum(['all', 'buyer', 'seller', 'agent']);
export type Audience = z.infer<typeof AudienceSchema>;

export const WelcomeCardDataSchema = z.object({
  orderTitle: z.string(),
  amount: MoneySchema,
  escrowState: z.string(),
  languages: z.array(z.string()),
});
export type WelcomeCardData = z.infer<typeof WelcomeCardDataSchema>;

export const ProofRequestCardDataSchema = z.object({
  reason: z.string(),
  shotList: z.array(z.string()),
  maxPhotos: z.number().int().default(4),
  expiresAt: z.number(),
});
export type ProofRequestCardData = z.infer<typeof ProofRequestCardDataSchema>;

export const EvidenceResultCardDataSchema = z.object({
  evidenceId: z.string(),
  thumbs: z.array(z.string()),
  assessment: z.object({
    damagePresent: z.boolean(),
    type: z.string(),
    severity: z.number().int().min(0).max(3),
    location: z.string(),
    quality: z.array(z.string()).default([]),
    confidence: z.number().min(0).max(1),
    notesEn: z.string().optional(),
  }),
  label: z.literal('ai_assessed_unverified').default('ai_assessed_unverified'),
});
export type EvidenceResultCardData = z.infer<typeof EvidenceResultCardDataSchema>;

export const ProposalOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  buyerGets: MoneySchema,
  sellerGets: MoneySchema,
  returnRequired: z.boolean().default(false),
  replacement: z.boolean().optional(),
  rationale: z.string(),
});
export type ProposalOption = z.infer<typeof ProposalOptionSchema>;

export const ProposalCardDataSchema = z.object({
  proposalId: z.string(),
  round: z.number().int(),
  options: z.array(ProposalOptionSchema),
  policyVersion: z.string(),
  expiresAt: z.number(),
});
export type ProposalCardData = z.infer<typeof ProposalCardDataSchema>;

export const ProposalStatusCardDataSchema = z.object({
  proposalId: z.string(),
  buyer: z.enum(['pending', 'accepted', 'declined', 'countered']),
  seller: z.enum(['pending', 'accepted', 'declined', 'countered']),
});
export type ProposalStatusCardData = z.infer<typeof ProposalStatusCardDataSchema>;

export const EscrowStatusCardDataSchema = z.object({
  state: z.string(),
  amount: MoneySchema,
  reasonCode: z.string(),
});
export type EscrowStatusCardData = z.infer<typeof EscrowStatusCardDataSchema>;

export const EscalationNoticeCardDataSchema = z.object({
  noticeByLang: z.record(z.string(), z.string()),
  caseId: z.string(),
});
export type EscalationNoticeCardData = z.infer<typeof EscalationNoticeCardDataSchema>;

export const AgentJoinedCardDataSchema = z.object({
  agentName: z.string(),
  agentLang: z.string(),
});
export type AgentJoinedCardData = z.infer<typeof AgentJoinedCardDataSchema>;

export const ResolutionCardDataSchema = z.object({
  outcome: z.string(),
  buyerRefund: MoneySchema,
  sellerPayout: MoneySchema,
  note: z.string(),
  resolvedBy: z.string(),
});
export type ResolutionCardData = z.infer<typeof ResolutionCardDataSchema>;

export const SystemNoteCardDataSchema = z.object({
  text: z.string(),
});
export type SystemNoteCardData = z.infer<typeof SystemNoteCardDataSchema>;

export const QueueDeltaEventDataSchema = z.object({
  disputeId: z.string(),
  priority: z.number(),
  risk: z.object({
    band: z.string(),
    score: z.number(),
    frozen: z.boolean(),
  }),
  status: z.string(),
  lang: z.array(z.string()),
  change: z.string(),
});
export type QueueDeltaEventData = z.infer<typeof QueueDeltaEventDataSchema>;

export const DgEnvelopeSchema = z.object({
  dg: z.literal(1).default(1),
  id: z.string(),
  kind: z.string(),
  disputeId: z.string(),
  ts: z.number(),
  audience: AudienceSchema.default('all'),
  data: z.record(z.any()),
});
export type DgEnvelope = z.infer<typeof DgEnvelopeSchema>;

/**
 * Envelope Parser that supports:
 * 1. Native JSON object
 * 2. Fallback text prefixed with 'DG1:'
 * 3. Graceful fallback on unknown card kinds without throwing
 */
export function parseDgEnvelope(raw: unknown): DgEnvelope | null {
  if (!raw) return null;

  let candidate: any = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('DG1:')) {
      try {
        candidate = JSON.parse(trimmed.slice(4));
      } catch {
        return null;
      }
    } else {
      try {
        candidate = JSON.parse(trimmed);
      } catch {
        return null;
      }
    }
  }

  if (typeof candidate !== 'object' || candidate === null) {
    return null;
  }

  if (candidate.dg !== 1 || !candidate.id || !candidate.kind || !candidate.disputeId) {
    return null;
  }

  const result = DgEnvelopeSchema.safeParse(candidate);
  if (result.success) {
    return result.data;
  }

  // Graceful fallback for unexpected properties
  return {
    dg: 1,
    id: String(candidate.id || 'env_unknown'),
    kind: String(candidate.kind || 'card.system_note'),
    disputeId: String(candidate.disputeId || ''),
    ts: Number(candidate.ts) || Date.now(),
    audience: ['all', 'buyer', 'seller', 'agent'].includes(candidate.audience)
      ? candidate.audience
      : 'all',
    data: typeof candidate.data === 'object' && candidate.data !== null ? candidate.data : {},
  };
}

export function serializeDgEnvelope(env: DgEnvelope, mode: 'native' | 'fallback' = 'fallback'): string {
  const jsonStr = JSON.stringify(env);
  return mode === 'fallback' ? `DG1:${jsonStr}` : jsonStr;
}
