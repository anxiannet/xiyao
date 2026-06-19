import { generateLegalActions } from '../engine/actionGenerator';
import { resolveAction } from '../engine/actionResolver';
import { addLog, getUnit, type AIDecisionRecord, type MatchState } from '../engine/rules';
import { appendAIDecisionLog } from '../storage/localStatsStorage';
import { scoreActions } from './aiScorer';

export function runAIStep(match: MatchState): MatchState {
  const unit = getUnit(match, match.selectedUnitId);
  if (!unit || match.phase !== 'unit_action') return match;
  const candidates = scoreActions(match, generateLegalActions(match, unit.id));
  const selected = candidates[0] ?? null;
  if (!selected) return match;
  const beforeLogs = match.logs.length;
  let next = resolveAction(match, selected.action);
  const result = next.logs.length > beforeLogs ? next.logs[0].message : '已执行';
  const decision: AIDecisionRecord = {
    id: `${Date.now()}-${unit.id}`,
    unitId: unit.id,
    unitName: unit.name,
    squad: unit.squad,
    candidates: candidates.slice(0, 8),
    selected,
    result,
    round: match.round,
  };
  next = addLog({ ...next, aiDecisions: [decision, ...next.aiDecisions].slice(0, 80) }, 'ai_decision', `${unit.name} 选择：${selected.action.label}（${selected.score}）`, decision);
  appendAIDecisionLog(decision);
  return next;
}

export function runAIUntilHumanOrEnd(match: MatchState, limit = 200): MatchState {
  let next = match;
  let steps = 0;
  while (next.phase !== 'match_end' && steps < limit) {
    const unit = getUnit(next, next.selectedUnitId);
    if (!unit) break;
    const isHumanTurn = next.mode === '玩家 vs AI' && unit.squad === next.playerSquad;
    if (isHumanTurn) break;
    next = runAIStep(next);
    steps += 1;
  }
  return next;
}
