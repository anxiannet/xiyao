import type { AIDecisionRecord } from '../engine/rules';

const AI_LOG_KEY = 'xiyao_ai_decision_log';
const AI_STATS_KEY = 'xiyao_ai_stats';

export function appendAIDecisionLog(record: AIDecisionRecord): void {
  const log = loadAIDecisionLog();
  localStorage.setItem(AI_LOG_KEY, JSON.stringify([record, ...log].slice(0, 160)));
}

export function loadAIDecisionLog(): AIDecisionRecord[] {
  const raw = localStorage.getItem(AI_LOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AIDecisionRecord[];
  } catch {
    return [];
  }
}

export function saveAIStats(summary: unknown): void {
  localStorage.setItem(AI_STATS_KEY, JSON.stringify({ savedAt: Date.now(), summary }));
}

export function loadAIStats<T = unknown>(): T | null {
  const raw = localStorage.getItem(AI_STATS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
