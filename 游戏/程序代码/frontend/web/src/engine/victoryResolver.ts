import { addLog, livingUnits, objectiveTiles, type MatchState, type SquadId } from './rules';

export function calculateFortune(match: MatchState): Record<SquadId, number> {
  const fortune: Record<SquadId, number> = { qingqiu: 0, tianmen: 0 };
  for (const tile of objectiveTiles(match)) {
    if (tile.objectiveOwner === 'qingqiu' || tile.objectiveOwner === 'tianmen') {
      fortune[tile.objectiveOwner] += tile.terrainLayer === 'central_objective' ? 2 : 1;
    }
  }
  fortune.qingqiu += match.metrics.kills.qingqiu;
  fortune.tianmen += match.metrics.kills.tianmen;
  const defeatedLeaders = match.units.filter((unit) => unit.leader && unit.defeated);
  for (const leader of defeatedLeaders) fortune[leader.squad === 'qingqiu' ? 'tianmen' : 'qingqiu'] += 1;
  return fortune;
}

export function resolveVictory(match: MatchState, forceFinal: boolean): MatchState {
  const qingqiuAlive = livingUnits(match, 'qingqiu').length;
  const tianmenAlive = livingUnits(match, 'tianmen').length;
  if (qingqiuAlive === 0 || tianmenAlive === 0 || forceFinal || match.round >= 3) {
    const fortune = calculateFortune(match);
    let winner: SquadId | 'draw' = fortune.qingqiu > fortune.tianmen ? 'qingqiu' : fortune.tianmen > fortune.qingqiu ? 'tianmen' : 'draw';
    if (winner === 'draw') {
      if (qingqiuAlive !== tianmenAlive) winner = qingqiuAlive > tianmenAlive ? 'qingqiu' : 'tianmen';
      else {
        const qingqiuLeader = match.units.some((unit) => unit.squad === 'qingqiu' && unit.leader && !unit.defeated);
        const tianmenLeader = match.units.some((unit) => unit.squad === 'tianmen' && unit.leader && !unit.defeated);
        if (qingqiuLeader !== tianmenLeader) winner = qingqiuLeader ? 'qingqiu' : 'tianmen';
      }
    }
    const result = { winner, reason: '三大回合或一方全灭后结算气运', fortune, rounds: match.round };
    return addLog({ ...match, phase: 'match_end', result }, 'match_end', `对局结束：${winner === 'draw' ? '平局' : winner === 'qingqiu' ? '青丘胜' : '天门胜'}`, result);
  }
  return match;
}
