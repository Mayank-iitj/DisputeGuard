import {
  AgentBrief,
  CopilotDraft,
  DisputeReason,
  EvidenceAssessment,
  RiskAnalysis,
} from '@dg/shared';

export interface CaseBriefContext {
  disputeId: string;
  orderTitle: string;
  orderAmountMinor: number;
  currency: string;
  reason: string;
  evidenceAssessment?: EvidenceAssessment | null;
  riskEvents: Array<{ type: string; confidence: number; quote_en: string; lang: string }>;
  messages: Array<{ senderRole: string; senderLang: string; text: string; translatedEn?: string }>;
  policyOptions: any[];
  agentLang: string;
}

export interface CopilotDraftContext {
  targetParty: 'buyer' | 'seller';
  targetLang: string;
  intent?: string;
  orderTitle: string;
  orderAmountMinor: number;
  allowedAmountsMinor: number[];
  recentMessages: Array<{ role: string; text: string }>;
}

export interface LlmPort {
  translate(params: {
    text: string;
    targetLang: string;
    sourceLang?: string;
  }): Promise<{ source_lang: string; translation: string; tone_note: string | null }>;

  analyzeRisk(params: {
    text: string;
    contextMessages: Array<{ role: string; text: string }>;
  }): Promise<RiskAnalysis>;

  classifyClaim(text: string): Promise<{ reason: DisputeReason; confidence: number }>;

  assessEvidence(params: {
    images: Array<{ url: string; base64?: string }>;
    orderTitle: string;
    category: string;
    claimedReason: string;
  }): Promise<EvidenceAssessment>;

  generateBrief(ctx: CaseBriefContext): Promise<AgentBrief>;

  draftCopilot(ctx: CopilotDraftContext): Promise<CopilotDraft>;
}
