import { RiskAnalysis, ThreatType } from '@dg/shared';

export const MULTILINGUAL_LEXICON: Record<Exclude<ThreatType, 'none'>, string[]> = {
  chargeback: [
    'chargeback',
    'dispute with my bank',
    'dispute with bank',
    'チャージバック',
    'カード会社に連絡',
    'カード会社',
    '拒付',
    '银行退款',
    'contracargo',
    'chárgebac',
    'चार्जबैक',
    'استرداد المبلغ من البنك',
    'rückbuchung',
  ],
  legal: [
    'lawyer',
    'sue you',
    'legal action',
    'court',
    'attorney',
    '弁護士',
    '訴え',
    '少額訴訟',
    '律师',
    '起诉',
    'abogado',
    'demandar',
    'demanda',
    'वकील',
    'मुकदमा',
    'محامي',
    'دعوى',
    'anwalt',
    'klage',
  ],
  police: [
    'police',
    'report you',
    'report to police',
    '警察',
    '通報',
    '被害届',
    '报警',
    'policía',
    'denunciar',
    'denuncia',
    'पुलिस',
    'الشرطة',
    'بلاغ',
    'polizei',
    'anzeige',
  ],
  scam_accusation: [
    'scam',
    'scammer',
    'fake',
    'fraud',
    'fraudulent',
    '詐欺',
    '偽物',
    '騙された',
    '骗子',
    '假货',
    '诈骗',
    'estafa',
    'estafador',
    'falso',
    'fraude',
    'धोखा',
    'नकली',
    'احتيال',
    'مزيف',
    'betrug',
    'fälschung',
  ],
  off_platform_payment: [
    'pay me directly',
    'pay outside',
    'whatsapp',
    'wire transfer directly',
    '直接払い',
    'lineで',
    '私下转账',
    '微信支付',
    'págame directo',
    'pagar por fuera',
    'सीधे पैसे',
    'ادفع لي مباشرة',
    'direkt zahlen',
  ],
  violence: [
    'kill',
    'hurt you',
    'beat you up',
    'physical harm',
    '殺す',
    '殴る',
    '打死',
    'matar',
    'golpear',
  ],
};

export function lexiconPreCheck(text: string): { type: ThreatType; keyword: string } | null {
  const lower = text.toLowerCase();
  for (const [threatType, keywords] of Object.entries(MULTILINGUAL_LEXICON)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return { type: threatType as ThreatType, keyword: kw };
      }
    }
  }
  return null;
}

export function threatWeight(threat: RiskAnalysis['threat']): number {
  if (threat.negated || threat.quoted || threat.type === 'none') {
    return 0;
  }
  const baseMap: Record<ThreatType, number> = {
    none: 0,
    chargeback: 0.8,
    legal: 0.85,
    police: 0.85,
    scam_accusation: 0.8,
    off_platform_payment: 0.8,
    violence: 1.0,
  };
  return (baseMap[threat.type] || 0) * threat.confidence;
}

export function calculateDisputeScore(
  analysis: RiskAnalysis,
  prevScore: number = 0,
  priorSenderFrustration: number | null = null
): { score: number; band: 'low' | 'medium' | 'high'; frozen: boolean; triggers: string[] } {
  const tWeight = threatWeight(analysis.threat);
  const frustrationAdj = analysis.frustration * (analysis.politeness_masking ? 1.0 : 0.9);
  const msgRisk = Math.max(frustrationAdj, tWeight);

  let score = 0.6 * msgRisk + 0.4 * prevScore;

  // Decay on calm messages
  if (analysis.frustration < 0.2 && analysis.threat.type === 'none') {
    score = score * 0.85;
  }
  score = Math.min(1, Math.max(0, Number(score.toFixed(3))));

  const triggers: string[] = [];

  // Freeze rule 1: threat type with confidence >= 0.6 and not negated and not quoted
  const isActionableThreat =
    ['chargeback', 'legal', 'police', 'scam_accusation', 'off_platform_payment'].includes(
      analysis.threat.type
    ) &&
    analysis.threat.confidence >= 0.6 &&
    !analysis.threat.negated &&
    !analysis.threat.quoted;

  if (isActionableThreat) {
    triggers.push(`threat_${analysis.threat.type}`);
  }

  // Freeze rule 2: violence threat >= 0.5
  if (
    analysis.threat.type === 'violence' &&
    analysis.threat.confidence >= 0.5 &&
    !analysis.threat.negated &&
    !analysis.threat.quoted
  ) {
    triggers.push('threat_violence');
  }

  // Freeze rule 3: score >= 0.8
  if (score >= 0.8) {
    triggers.push('high_aggregate_risk_score');
  }

  // Freeze rule 4: Two consecutive messages with frustration >= 0.65 from same sender
  if (priorSenderFrustration !== null && priorSenderFrustration >= 0.65 && analysis.frustration >= 0.65) {
    triggers.push('sustained_high_frustration');
  }

  const frozen = triggers.length > 0;
  const band = score >= 0.7 || frozen ? 'high' : score >= 0.35 ? 'medium' : 'low';

  return {
    score,
    band,
    frozen,
    triggers,
  };
}
