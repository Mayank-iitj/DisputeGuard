import {
  AgentBrief,
  CopilotDraft,
  DisputeReason,
  EvidenceAssessment,
  RiskAnalysis,
} from '@dg/shared';
import { CaseBriefContext, CopilotDraftContext, LlmPort } from './port';
import { lexiconPreCheck } from '../domain/risk';

export class FixtureLlmImpl implements LlmPort {
  async translate(params: {
    text: string;
    targetLang: string;
    sourceLang?: string;
  }): Promise<{ source_lang: string; translation: string; tone_note: string | null }> {
    const { text, targetLang } = params;
    const lower = text.trim().toLowerCase();

    // Specific demo phrases
    if (text.includes('コップが割れて') || text.includes('割れて届きました') || text.includes('割れていました')) {
      if (targetLang === 'es') {
        return {
          source_lang: 'ja',
          translation: 'Las tazas llegaron rotas.',
          tone_note: null,
        };
      }
      if (targetLang === 'en') {
        return {
          source_lang: 'ja',
          translation: 'The cup arrived cracked.',
          tone_note: null,
        };
      }
    }

    if (text.includes('三回目') || text.includes('確認していただけますと幸いです')) {
      if (targetLang === 'es') {
        return {
          source_lang: 'ja',
          translation: 'Le agradecería que pudiera verificarlo una vez más. Es la tercera vez.',
          tone_note: 'Formal phrasing, repeated request signalling frustration',
        };
      }
      if (targetLang === 'en') {
        return {
          source_lang: 'ja',
          translation: 'I would appreciate it if you could kindly confirm once more. This is the third time.',
          tone_note: 'Formal phrasing, repeated request signalling frustration',
        };
      }
    }

    if (text.includes('チャージバック') || text.includes('カード会社')) {
      if (targetLang === 'es') {
        return {
          source_lang: 'ja',
          translation: 'Si esto no se resuelve, solicitaré un contracargo a mi compañía de tarjeta.',
          tone_note: 'Escalation: buyer threatens chargeback',
        };
      }
      if (targetLang === 'en') {
        return {
          source_lang: 'ja',
          translation: 'If this is not resolved, I will request a chargeback from my credit card company.',
          tone_note: 'Escalation: buyer threatens chargeback',
        };
      }
    }

    if (text.includes('no es mi culpa') || text.includes('embalaje perfecto')) {
      if (targetLang === 'ja') {
        return {
          source_lang: 'es',
          translation: '梱包は完璧でした。私の過失ではありません。',
          tone_note: 'Defensive seller tone',
        };
      }
      if (targetLang === 'en') {
        return {
          source_lang: 'es',
          translation: 'The packaging was perfect. It is not my fault.',
          tone_note: 'Defensive seller tone',
        };
      }
    }

    // Default translations based on target language
    let trans = text;
    let sLang = 'en';

    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) {
      sLang = 'ja';
      if (targetLang === 'es') trans = `[Traducción]: ${text}`;
      else trans = `[Translated]: ${text}`;
    } else if (/[áéíóúñ¿¡]/i.test(text)) {
      sLang = 'es';
      if (targetLang === 'ja') trans = `[翻訳]: ${text}`;
      else trans = `[Translated]: ${text}`;
    } else {
      sLang = 'en';
      if (targetLang === 'ja') trans = `[翻訳]: ${text}`;
      else if (targetLang === 'es') trans = `[Traducción]: ${text}`;
    }

    return {
      source_lang: sLang,
      translation: trans,
      tone_note: null,
    };
  }

  async analyzeRisk(params: {
    text: string;
    contextMessages: Array<{ role: string; text: string }>;
  }): Promise<RiskAnalysis> {
    const { text } = params;
    const lower = text.toLowerCase();

    // Scenario C: Explicit Negated threat
    if (
      lower.includes('will not call the police') ||
      lower.includes("won't call the police") ||
      lower.includes('警察には通報しません') ||
      lower.includes('no llamaré a la policía')
    ) {
      return {
        lang: lower.includes('警察') ? 'ja' : lower.includes('policía') ? 'es' : 'en',
        frustration: 0.35,
        surface_tone: 'neutral',
        politeness_masking: false,
        threat: {
          type: 'police',
          confidence: 0.75,
          negated: true, // Crucial for test!
          quoted: false,
        },
        scam_signals: [],
        quote_en: 'will not call the police',
      };
    }

    // Scenario B: Japanese threat of chargeback
    if (text.includes('チャージバック') || text.includes('カード会社')) {
      return {
        lang: 'ja',
        frustration: 0.88,
        surface_tone: 'angry',
        politeness_masking: false,
        threat: {
          type: 'chargeback',
          confidence: 0.86,
          negated: false,
          quoted: false,
        },
        scam_signals: [],
        quote_en: 'I will file a chargeback with my card company',
      };
    }

    // Polite repeated frustration (politeness masking)
    if (text.includes('三回目') || text.includes('確認していただけますと幸いです')) {
      return {
        lang: 'ja',
        frustration: 0.68,
        surface_tone: 'polite',
        politeness_masking: true,
        threat: {
          type: 'none',
          confidence: 0,
          negated: false,
          quoted: false,
        },
        scam_signals: [],
        quote_en: 'Repeated formal request signalling elevated frustration',
      };
    }

    // Lexicon fallback check
    const lex = lexiconPreCheck(text);
    if (lex) {
      return {
        lang: 'en',
        frustration: 0.7,
        surface_tone: 'angry',
        politeness_masking: false,
        threat: {
          type: lex.type,
          confidence: 0.7,
          negated: false,
          quoted: false,
        },
        scam_signals: [],
        quote_en: lex.keyword,
      };
    }

    return {
      lang: 'en',
      frustration: 0.1,
      surface_tone: 'neutral',
      politeness_masking: false,
      threat: {
        type: 'none',
        confidence: 0,
        negated: false,
        quoted: false,
      },
      scam_signals: [],
      quote_en: '',
    };
  }

  async classifyClaim(text: string): Promise<{ reason: DisputeReason; confidence: number }> {
    const lower = text.toLowerCase();
    if (lower.includes('割れ') || lower.includes('broken') || lower.includes('damage') || lower.includes('crack')) {
      return { reason: 'damaged', confidence: 0.95 };
    }
    if (lower.includes('size') || lower.includes('wrong') || lower.includes('サイズ') || lower.includes('違う')) {
      return { reason: 'wrong_item_or_size', confidence: 0.92 };
    }
    if (lower.includes('arrive') || lower.includes('届かない') || lower.includes('not received')) {
      return { reason: 'not_received', confidence: 0.94 };
    }
    return { reason: 'damaged', confidence: 0.7 };
  }

  async assessEvidence(params: {
    images: Array<{ url: string; base64?: string }>;
    orderTitle: string;
    category: string;
    claimedReason: string;
  }): Promise<EvidenceAssessment> {
    return {
      item_visible: true,
      matches_order_description: 'yes',
      damage_present: true,
      damage_type: 'crack',
      damage_location: 'rim of cup',
      severity: 2,
      image_quality_issues: [],
      needs_retake: false,
      confidence: 0.81,
      notes_en: 'Visible 2cm hairline fracture along the upper ceramic rim. Base intact.',
    };
  }

  async generateBrief(ctx: CaseBriefContext): Promise<AgentBrief> {
    const recAmount = ctx.orderAmountMinor === 8400 ? 3360 : ctx.orderAmountMinor;
    return {
      generatedAt: Date.now(),
      summary: [
        `Buyer (ja) reports item arrived damaged with cracked rim.`,
        `Seller (es) claimed packaging was adequate.`,
        `Automated risk firewall triggered due to buyer chargeback signal.`,
      ],
      claims: {
        buyer: 'Cup arrived broken at rim, requested resolution multiple times.',
        seller: 'Dispatched securely packaged in bubble wrap; suggested transit damage.',
      },
      evidence: {
        present: true,
        severity: ctx.evidenceAssessment?.severity ?? 2,
        confidence: ctx.evidenceAssessment?.confidence ?? 0.81,
        flags: [],
      },
      riskReasons: ctx.riskEvents.length > 0 ? ctx.riskEvents : [
        {
          type: 'chargeback',
          confidence: 0.86,
          quote_en: 'I will file a chargeback with my card company',
          lang: 'ja',
        },
      ],
      recommended: {
        action: 'refund_partial',
        amount: { value: recAmount, currency: ctx.currency },
        rationale: 'Policy v1: severity 2 of 3 allows 40% partial refund with item retained.',
      },
      policyOptions: ctx.policyOptions,
    };
  }

  async draftCopilot(ctx: CopilotDraftContext): Promise<CopilotDraft> {
    return {
      lang: ctx.targetLang,
      text: 'ご不便をおかけして大変申し訳ございません。サポート担当のPriyaが対応いたします。規約に基づき、速やかに全額返金手続きを進めさせていただきます。',
      english:
        'I am deeply sorry for the trouble. Priya from DisputeGuard has taken over your case. In accordance with marketplace policy, we are proceeding with a full refund.',
      grounding: ['policy:v1:escalation', `order:${ctx.orderTitle}`],
      warnings: [],
    };
  }
}
