/** Уровень риска по score 0–100 */
export type RiskLevel = 'low' | 'medium' | 'high';

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 33) return 'low';
  if (score <= 66) return 'medium';
  return 'high';
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'Низкий';
    case 'medium':
      return 'Средний';
    case 'high':
      return 'Высокий';
  }
}

export function getRiskFactors(riskScore: number): string[] {
  const factors: string[] = [];
  if (riskScore >= 50) {
    factors.push('Повышенный риск исполнения и проскальзывания');
  }
  if (riskScore >= 70) {
    factors.push('Высокая волатильность спреда spot/perp');
  }
  if (riskScore >= 40) {
    factors.push('Комиссии и funding могут измениться до исполнения');
  }
  if (factors.length === 0) {
    factors.push('Стандартные рыночные риски арбитража');
  }
  factors.push('Доходность теоретическая, не гарантирована');
  return factors;
}
