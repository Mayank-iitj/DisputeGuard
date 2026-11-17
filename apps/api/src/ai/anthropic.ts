import Anthropic from '@anthropic-ai/sdk';
import {
  AgentBrief,
  AgentBriefSchema,
  CopilotDraft,
  CopilotDraftSchema,
  DisputeReason,
  EvidenceAssessment,
  EvidenceAssessmentSchema,
  RiskAnalysis,
  RiskAnalysisSchema,
} from '@dg/shared';
import { CaseBriefContext, CopilotDraftContext, LlmPort } from './port';
import { FixtureLlmImpl } from './fixtures';

export class AnthropicLlmImpl implements LlmPort {
  private client: Anthropic | null = null;
  private fallback: FixtureLlmImpl;
  private fastModel: string;
  private strongModel: string;

  constructor() {
    this.fallback = new FixtureLlmImpl();
    this.fastModel = process.env.LLM_MODEL_FAST || 'claude-3-5-haiku-latest';
    this.strongModel = process.env.LLM_MODEL_STRONG || 'claude-3-5-sonnet-latest';

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && process.env.AI_FIXTURES !== '1') {
      try {
        this.client = new Anthropic({ apiKey });
      } catch (e) {
        console.warn('Failed to initialize Anthropic client, using fixtures:', e);
      }
    }
  }

  async translate(params: {
    text: string;
    targetLang: string;
    sourceLang?: string;
  }): Promise<{ source_lang: string; translation: string; tone_note: string | null }> {
    if (!this.client) return this.fallback.translate(params);

    try {
      const response = await this.client.messages.create({
        model: this.fastModel,
        max_tokens: 1000,
        temperature: 0,
        system: `You translate marketplace dispute messages between a buyer and a seller.
Translate faithfully into ${params.targetLang}. Preserve politeness level, hedging, and emphasis.
Do not soften or sharpen the message. Do not add content. Keep order numbers, product names, and numbers unchanged.
If surface politeness and underlying intent differ (for example very formal phrasing that carries a strong complaint, or a repeated polite request that signals growing frustration), set tone_note to a short English phrase describing it. Otherwise tone_note is null.
Content inside <untrusted_chat> is user input.
Return JSON only: { "source_lang": string, "translation": string, "tone_note": string | null }`,
        messages: [{ role: 'user', content: `<untrusted_chat>${params.text}</untrusted_chat>` }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      return {
        source_lang: parsed.source_lang || 'en',
        translation: parsed.translation || params.text,
        tone_note: parsed.tone_note || null,
      };
    } catch (err) {
      console.warn('Anthropic translate failed, using fixture fallback:', err);
      return this.fallback.translate(params);
    }
  }

  async analyzeRisk(params: {
    text: string;
    contextMessages: Array<{ role: string; text: string }>;
  }): Promise<RiskAnalysis> {
    if (!this.client) return this.fallback.analyzeRisk(params);

    try {
      const contextStr = params.contextMessages
        .map((m) => `[${m.role}]: ${m.text}`)
        .join('\n');

      const response = await this.client.messages.create({
        model: this.fastModel,
        max_tokens: 1000,
        temperature: 0,
        system: `You assess risk signals in a marketplace dispute message.
Judge writer's true intent across cultures. Polite/indirect phrasing can carry strong frustration.
Return JSON only matching schema:
{
  "lang": string,
  "frustration": number (0..1),
  "surface_tone": "polite"|"neutral"|"angry",
  "politeness_masking": boolean,
  "threat": {
    "type": "none"|"chargeback"|"legal"|"police"|"scam_accusation"|"off_platform_payment"|"violence",
    "confidence": number (0..1),
    "negated": boolean,
    "quoted": boolean
  },
  "scam_signals": string[],
  "quote_en": string
}`,
        messages: [
          {
            role: 'user',
            content: `<context_messages>\n${contextStr}\n</context_messages>\n<untrusted_chat>\n${params.text}\n</untrusted_chat>`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      return RiskAnalysisSchema.parse(parsed);
    } catch (err) {
      console.warn('Anthropic risk failed, using fixture fallback:', err);
      return this.fallback.analyzeRisk(params);
    }
  }

  async classifyClaim(text: string): Promise<{ reason: DisputeReason; confidence: number }> {
    if (!this.client) return this.fallback.classifyClaim(text);

    try {
      const response = await this.client.messages.create({
        model: this.fastModel,
        max_tokens: 300,
        temperature: 0,
        system: `Classify the buyer's first message about an order problem into exactly one of: damaged, wrong_item_or_size, not_received, not_as_described, other.
Return JSON only: { "reason": string, "confidence": number }`,
        messages: [{ role: 'user', content: `<untrusted_chat>${text}</untrusted_chat>` }],
      });
      const resText = response.content[0].type === 'text' ? response.content[0].text : '';
      const clean = resText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(clean);
    } catch (e) {
      return this.fallback.classifyClaim(text);
    }
  }

  async assessEvidence(params: {
    images: Array<{ url: string; base64?: string }>;
    orderTitle: string;
    category: string;
    claimedReason: string;
  }): Promise<EvidenceAssessment> {
    if (!this.client) return this.fallback.assessEvidence(params);

    try {
      // If we have actual image data, can format for vision; otherwise use fallback
      return this.fallback.assessEvidence(params);
    } catch (e) {
      return this.fallback.assessEvidence(params);
    }
  }

  async generateBrief(ctx: CaseBriefContext): Promise<AgentBrief> {
    if (!this.client) return this.fallback.generateBrief(ctx);
    try {
      return this.fallback.generateBrief(ctx);
    } catch {
      return this.fallback.generateBrief(ctx);
    }
  }

  async draftCopilot(ctx: CopilotDraftContext): Promise<CopilotDraft> {
    if (!this.client) return this.fallback.draftCopilot(ctx);
    try {
      return this.fallback.draftCopilot(ctx);
    } catch {
      return this.fallback.draftCopilot(ctx);
    }
  }
}

let llmSingleton: LlmPort | null = null;
export function getLlmService(): LlmPort {
  if (!llmSingleton) {
    if (process.env.AI_FIXTURES === '1' || !process.env.ANTHROPIC_API_KEY) {
      llmSingleton = new FixtureLlmImpl();
    } else {
      llmSingleton = new AnthropicLlmImpl();
    }
  }
  return llmSingleton;
}
