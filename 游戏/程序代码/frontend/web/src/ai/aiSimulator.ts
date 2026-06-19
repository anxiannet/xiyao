import { mapConfigs, type MapId, type SquadId } from '../data/maps';
import { autoDeploySquad } from '../engine/deployment';
import { createMatch } from '../engine/matchFactory';
import { validateMap } from '../engine/mapValidator';
import { beginFirstRound } from '../engine/turnManager';
import type { MatchState } from '../engine/rules';
import { saveAIStats } from '../storage/localStatsStorage';
import { runAIStep } from './aiRunner';

export type SimulationSummary = {
  totalGames: number;
  qingqiuWins: number;
  tianmenWins: number;
  draws: number;
  abnormalGames: number;
  averageRounds: number;
  averageKills: number;
  averageCaptures: number;
  averageSkillUses: number;
  averageStatusTriggers: number;
  averageDecreeUses: number;
  firstActorWinRate: number;
  mapWinRate: Record<MapId, { qingqiu: number; tianmen: number; draw: number; games: number }>;
  abnormalSamples: Array<{ mapId: MapId; steps: number; phase: string; round: number }>;
};

export function prepareAIVsAIMatch(mapId: MapId): MatchState {
  let match = createMatch('AI vs AI', mapId, 'qingqiu');
  const validation = validateMap(mapConfigs[mapId]);
  if (!validation.ok) return match;
  match = { ...match, phase: 'deployment' };
  match = autoDeploySquad(autoDeploySquad(match, 'qingqiu'), 'tianmen');
  return beginFirstRound(match);
}

export function simulateOneGame(mapId: MapId, maxSteps = 260): { match: MatchState; abnormal: boolean; steps: number } {
  let match = prepareAIVsAIMatch(mapId);
  let steps = 0;
  while (match.phase !== 'match_end' && steps < maxSteps) {
    match = runAIStep(match);
    steps += 1;
  }
  return { match, abnormal: match.phase !== 'match_end', steps };
}

export function runLocalSimulations(totalGames = 1000): SimulationSummary {
  const mapIds = Object.keys(mapConfigs) as MapId[];
  const summary: SimulationSummary = {
    totalGames,
    qingqiuWins: 0,
    tianmenWins: 0,
    draws: 0,
    abnormalGames: 0,
    averageRounds: 0,
    averageKills: 0,
    averageCaptures: 0,
    averageSkillUses: 0,
    averageStatusTriggers: 0,
    averageDecreeUses: 0,
    firstActorWinRate: 0,
    mapWinRate: {
      test_map_a: { qingqiu: 0, tianmen: 0, draw: 0, games: 0 },
      test_map_b: { qingqiu: 0, tianmen: 0, draw: 0, games: 0 },
      test_map_c: { qingqiu: 0, tianmen: 0, draw: 0, games: 0 },
    },
    abnormalSamples: [],
  };
  let normalGames = 0;
  let firstActorWins = 0;
  for (let i = 0; i < totalGames; i += 1) {
    const mapId = mapIds[i % mapIds.length];
    const { match, abnormal, steps } = simulateOneGame(mapId);
    if (abnormal || !match.result) {
      summary.abnormalGames += 1;
      if (summary.abnormalSamples.length < 10) summary.abnormalSamples.push({ mapId, steps, phase: match.phase, round: match.round });
      continue;
    }
    normalGames += 1;
    summary.mapWinRate[mapId].games += 1;
    if (match.result.winner === 'qingqiu') {
      summary.qingqiuWins += 1;
      summary.mapWinRate[mapId].qingqiu += 1;
    } else if (match.result.winner === 'tianmen') {
      summary.tianmenWins += 1;
      summary.mapWinRate[mapId].tianmen += 1;
    } else {
      summary.draws += 1;
      summary.mapWinRate[mapId].draw += 1;
    }
    if (match.result.winner === match.firstActor) firstActorWins += 1;
    summary.averageRounds += match.round;
    summary.averageKills += match.metrics.kills.qingqiu + match.metrics.kills.tianmen;
    summary.averageCaptures += match.metrics.captures.qingqiu + match.metrics.captures.tianmen;
    summary.averageSkillUses += match.metrics.skillUses;
    summary.averageStatusTriggers += match.metrics.statusTriggers;
    summary.averageDecreeUses += match.metrics.decreeUses;
  }
  const divisor = Math.max(1, normalGames);
  summary.averageRounds = round(summary.averageRounds / divisor);
  summary.averageKills = round(summary.averageKills / divisor);
  summary.averageCaptures = round(summary.averageCaptures / divisor);
  summary.averageSkillUses = round(summary.averageSkillUses / divisor);
  summary.averageStatusTriggers = round(summary.averageStatusTriggers / divisor);
  summary.averageDecreeUses = round(summary.averageDecreeUses / divisor);
  summary.firstActorWinRate = round(firstActorWins / divisor);
  saveAIStats(summary);
  return summary;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
