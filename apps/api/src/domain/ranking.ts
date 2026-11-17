export interface RankingInputs {
  riskScore: number;
  frozen: boolean;
  waitingMinutes: number;
  amountMinor: number;
  safetyFlag?: boolean;
  scamFlag?: boolean;
}

export function computePriority(inputs: RankingInputs): number {
  const p =
    100 * inputs.riskScore +
    20 * (inputs.frozen ? 1 : 0) +
    0.5 * Math.min(inputs.waitingMinutes, 120) +
    10 * Math.min(inputs.amountMinor / 20000, 1) +
    15 * (inputs.safetyFlag ? 1 : 0) +
    5 * (inputs.scamFlag ? 1 : 0);

  return Number(p.toFixed(1));
}
