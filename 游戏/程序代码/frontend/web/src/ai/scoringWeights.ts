export type AISquadId = 'qingqiu' | 'tianmen';

export type AIScoreKey =
  | '目标分'
  | '位置分'
  | '资源分'
  | '状态分'
  | '据点分'
  | '协同分'
  | '击杀分'
  | '生存分'
  | '风险惩罚';

export type AIScoreBreakdown = Record<AIScoreKey, number>;

export const AI_SCORE_KEYS: AIScoreKey[] = [
  '目标分',
  '位置分',
  '资源分',
  '状态分',
  '据点分',
  '协同分',
  '击杀分',
  '生存分',
  '风险惩罚',
];

export const AI_SQUAD_WEIGHTS: Record<AISquadId, Record<AIScoreKey, number>> = {
  qingqiu: {
    目标分: 1.2,
    位置分: 1.1,
    资源分: 1.0,
    状态分: 1.4,
    据点分: 0.8,
    协同分: 1.4,
    击杀分: 1.3,
    生存分: 1.0,
    风险惩罚: 1.0,
  },
  tianmen: {
    目标分: 1.0,
    位置分: 1.0,
    资源分: 1.0,
    状态分: 1.1,
    据点分: 1.6,
    协同分: 1.2,
    击杀分: 1.0,
    生存分: 1.3,
    风险惩罚: 1.0,
  },
};

export function scoreTotal(squad: AISquadId, breakdown: AIScoreBreakdown): number {
  const weights = AI_SQUAD_WEIGHTS[squad];
  return Math.round(AI_SCORE_KEYS.reduce((sum, key) => sum + breakdown[key] * weights[key], 0));
}
