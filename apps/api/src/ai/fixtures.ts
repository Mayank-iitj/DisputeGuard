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

    // Expanded bidirectional commerce dictionary for common dispute messages
    const COMMERCE_PHRASES: Record<string, { es: string; ja: string; en: string }> = {
      'hello': { es: 'Hola', ja: 'こんにちは', en: 'Hello' },
      'hi': { es: 'Hola', ja: 'こんにちは', en: 'Hi' },
      'good morning': { es: 'Buenos días', ja: 'おはようございます', en: 'Good morning' },
      'thank you': { es: 'Muchas gracias', ja: 'ありがとうございます', en: 'Thank you' },
      'thanks': { es: 'Gracias', ja: 'ありがとうございます', en: 'Thanks' },
      'it is broken': { es: 'Está roto', ja: '壊れています', en: 'It is broken' },
      'broken': { es: 'Roto', ja: '壊れています', en: 'Broken' },
      'damaged': { es: 'Dañado', ja: '破損しています', en: 'Damaged' },
      'arrived damaged': { es: 'Llegó dañado', ja: '破損して届きました', en: 'Arrived damaged' },
      'wrong item': { es: 'Artículo equivocado', ja: '違う商品が届きました', en: 'Wrong item' },
      'wrong size': { es: 'Talla equivocada', ja: 'サイズが異なります', en: 'Wrong size' },
      'i want a refund': { es: 'Quiero un reembolso', ja: '返金を希望します', en: 'I want a refund' },
      'please refund': { es: 'Por favor, reembolse el importe', ja: '返金をお願いします', en: 'Please refund' },
      'where is my package': { es: '¿Dónde está mi paquete?', ja: '荷物はどこですか？', en: 'Where is my package' },
      'where is my order': { es: '¿Dónde está mi pedido?', ja: '注文はどこですか？', en: 'Where is my order' },
      'not received': { es: 'No recibido', ja: '届いていません', en: 'Not received' },
      'not delivered': { es: 'No entregado', ja: '配達されていません', en: 'Not delivered' },
      'please help': { es: 'Por favor ayuda', ja: 'ご対応をお願いします', en: 'Please help' },
      'i am waiting': { es: 'Estoy esperando', ja: '返答を待っています', en: 'I am waiting' },
      'understood': { es: 'Entendido', ja: '承知いたしました', en: 'Understood' },
      'ok': { es: 'De acuerdo', ja: '了解しました', en: 'OK' },
      'please check the photos': { es: 'Por favor revise las fotos', ja: '添付の写真をご確認ください', en: 'Please check the photos' },
      'can you send a replacement': { es: '¿Puede enviar un reemplazo?', ja: '交換品を送っていただけますか？', en: 'Can you send a replacement' },
      'i shipped it': { es: 'Lo envié', ja: '発送いたしました', en: 'I shipped it' },
      'package was sent': { es: 'El paquete fue enviado', ja: '荷物は発送済みです', en: 'The package was sent' },
    };

    // Check phrase dictionary
    for (const [key, mapping] of Object.entries(COMMERCE_PHRASES)) {
      if (lower === key || lower.includes(key)) {
        const trans = targetLang === 'es' ? mapping.es : targetLang === 'ja' ? mapping.ja : mapping.en;
        return {
          source_lang: 'en',
          translation: trans,
          tone_note: null,
        };
      }
    }

    // Default translations based on target language without AI slop brackets
    let trans = text;
    let sLang = 'en';

    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) {
      sLang = 'ja';
      if (targetLang === 'es') {
        trans = text.includes('返金') ? 'Solicitud de reembolso recibida del comprador.' :
                text.includes('写真') ? 'Por favor revise las imágenes de evidencia adjuntas.' :
                text.includes('届き') ? 'El comprador consulta sobre el estado del envío.' :
                'Mensaje de soporte recibido sobre la orden.';
      } else {
        trans = text.includes('返金') ? 'Buyer requested a refund for this order.' :
                text.includes('写真') ? 'Please review the attached photo evidence.' :
                text.includes('届き') ? 'Buyer is inquiring about delivery status.' :
                'Customer message regarding order inquiry.';
      }
    } else if (/[áéíóúñ¿¡]/i.test(text)) {
      sLang = 'es';
      if (targetLang === 'ja') {
        trans = text.includes('envio') || text.includes('enviado') ? '出品者より：商品は期日通りに発送済みです。' :
                text.includes('reemplazo') ? '出品者より：交換品の発送を提案いたします。' :
                '出品者からの確認メッセージを受け取りました。';
      } else {
        trans = text.includes('envio') || text.includes('enviado') ? 'Seller: The item has been dispatched per schedule.' :
                text.includes('reemplazo') ? 'Seller: Offering to send a replacement unit.' :
                'Seller response regarding the order claim.';
      }
    } else {
      sLang = 'en';
      if (targetLang === 'ja') {
        trans = 'ご連絡ありがとうございます。内容を確認の上、対応いたします。';
      } else if (targetLang === 'es') {
        trans = 'Gracias por su mensaje. Revisaremos la información de inmediato.';
      }
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
    const isApparel = params.category === 'apparel' || params.orderTitle.toLowerCase().includes('scarf');
    const isElectronics = params.category === 'electronics';

    if (isApparel) {
      return {
        item_visible: true,
        matches_order_description: 'yes',
        damage_present: false,
        damage_type: 'wrong_spec',
        damage_location: 'size label tag',
        severity: 2,
        image_quality_issues: [],
        needs_retake: false,
        confidence: 0.89,
        notes_en: `Size label photo verified: label indicates size L; order manifest specifies size M.`,
      };
    }

    if (isElectronics) {
      return {
        item_visible: true,
        matches_order_description: 'yes',
        damage_present: true,
        damage_type: 'non_functional',
        damage_location: 'charging contact / earbud housing',
        severity: 3,
        image_quality_issues: [],
        needs_retake: false,
        confidence: 0.85,
        notes_en: 'Item exterior inspected. Functional hardware defect reported by buyer.',
      };
    }

    return {
      item_visible: true,
      matches_order_description: 'yes',
      damage_present: true,
      damage_type: 'crack',
      damage_location: 'rim of item',
      severity: 2,
      image_quality_issues: [],
      needs_retake: false,
      confidence: 0.81,
      notes_en: `Inspection of ${params.orderTitle}: visible hairline fracture along the upper rim. Base intact.`,
    };
  }

  async generateBrief(ctx: CaseBriefContext): Promise<AgentBrief> {
    const isDamaged = ctx.reason === 'damaged';
    const isWrongItem = ctx.reason === 'wrong_item_or_size';
    const isNotReceived = ctx.reason === 'not_received';

    const riskTrigger = ctx.riskEvents.find((r) => r.type === 'chargeback' || r.type === 'legal' || r.type === 'police') || ctx.riskEvents[0];
    const riskSummary = riskTrigger
      ? `Automated risk firewall triggered: ${riskTrigger.type} threat signal detected ("${riskTrigger.quote_en}").`
      : 'Standard dispute intake; no chargeback or legal escalation signals detected.';

    const buyerClaim = isDamaged
      ? `${ctx.orderTitle} arrived damaged. Buyer requested refund or replacement.`
      : isWrongItem
      ? `Received wrong size or variant for ${ctx.orderTitle}. Requested replacement or correction.`
      : isNotReceived
      ? `Parcel for ${ctx.orderTitle} has not been received within the expected delivery window.`
      : `Customer opened inquiry regarding ${ctx.orderTitle}.`;

    const sellerClaim = isDamaged
      ? 'Dispatched in verified protective packaging; indicates possible handling impact in transit.'
      : isWrongItem
      ? 'Fulfillment records indicate dispatch; requested photo inspection of packaging label.'
      : 'Tracking shows dispatched on schedule; awaiting courier delivery confirmation.';

    const recAmount = ctx.orderAmountMinor === 8400 ? 3360 : Math.round(ctx.orderAmountMinor * 0.4);

    return {
      generatedAt: Date.now(),
      summary: [
        `Buyer reported issue regarding ${ctx.orderTitle} ($${(ctx.orderAmountMinor / 100).toFixed(2)} ${ctx.currency}).`,
        `Dispute category: ${ctx.reason.replace(/_/g, ' ').toUpperCase()}.`,
        riskSummary,
      ],
      claims: {
        buyer: buyerClaim,
        seller: sellerClaim,
      },
      evidence: {
        present: !!ctx.evidenceAssessment,
        severity: ctx.evidenceAssessment?.severity ?? (isDamaged ? 2 : 1),
        confidence: ctx.evidenceAssessment?.confidence ?? 0.82,
        flags: [],
      },
      riskReasons: ctx.riskEvents.length > 0 ? ctx.riskEvents : [
        {
          type: 'customer_claim',
          confidence: 0.75,
          quote_en: 'Customer reported issue with order',
          lang: 'ja',
        },
      ],
      recommended: {
        action: isDamaged ? 'refund_partial' : 'refund_full',
        amount: { value: isDamaged ? recAmount : ctx.orderAmountMinor, currency: ctx.currency },
        rationale: isDamaged
          ? `Policy v1: severity ${ctx.evidenceAssessment?.severity ?? 2} of 3 allows 40% partial refund with item retained.`
          : `Policy v1: resolution for ${ctx.reason.replace(/_/g, ' ')}.`,
      },
      policyOptions: ctx.policyOptions,
    };
  }

  async draftCopilot(ctx: CopilotDraftContext): Promise<CopilotDraft> {
    const isSeller = ctx.targetParty === 'seller';
    const isSpanish = ctx.targetLang === 'es';
    const intent = ctx.intent || 'de_escalate';

    let text = '';
    let english = '';

    if (isSeller || isSpanish) {
      if (intent === 'request_evidence') {
        text = `Hola, para evaluar el reclamo sobre ${ctx.orderTitle}, ¿podría facilitarnos el comprobante de envío o fotos del embalaje?`;
        english = `Hello, to assess the claim for ${ctx.orderTitle}, could you provide proof of shipment or packaging photos?`;
      } else if (intent === 'offer_partial') {
        text = `Hola, de acuerdo con la política v1, proponemos un acuerdo de reembolso parcial. ¿Está de acuerdo con esta resolución?`;
        english = `Hello, in accordance with policy v1, we propose a partial refund agreement. Do you agree with this resolution?`;
      } else {
        text = `Hola, soy Priya del equipo de arbitraje de DisputeGuard. Estamos interviniendo para proteger su cuenta y resolver la incidencia de ${ctx.orderTitle}.`;
        english = `Hello, I am Priya from DisputeGuard arbitration. We are intervening to protect your account and resolve the issue with ${ctx.orderTitle}.`;
      }
    } else {
      // Japanese Buyer
      if (intent === 'request_evidence') {
        text = `お手数をおかけして申し訳ございません。${ctx.orderTitle}の状況を確認するため、商品の写真や外箱の画像をご提供いただけますでしょうか。`;
        english = `We apologize for the trouble. To inspect the status of ${ctx.orderTitle}, could you please provide photos of the product and packaging?`;
      } else if (intent === 'offer_partial') {
        text = `規約に基づき、商品はそのままお手元に保管いただいた上で、一部返金による解決を提案させていただきます。内容をご確認いただけますでしょうか。`;
        english = `In accordance with policy, we propose a partial refund while you retain the item. Could you please review this proposal?`;
      } else {
        text = `ご不便をおかけして大変申し訳ございません。サポート担当のPriyaが対応いたします。規約に基づき、速やかに解決手続きを進めさせていただきます。`;
        english = `I am deeply sorry for the trouble. Priya from DisputeGuard has taken over your case. In accordance with marketplace policy, we are proceeding with a prompt resolution.`;
      }
    }

    return {
      lang: ctx.targetLang,
      text,
      english,
      grounding: ['policy:v1', `order:${ctx.orderTitle}`, `intent:${intent}`],
      warnings: [],
    };
  }
}
