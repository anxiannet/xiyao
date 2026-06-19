import { addLog, enemyOf, livingUnits, type MatchState, type SquadId, type UnitState } from './rules';
import { resolveVictory } from './victoryResolver';

function nextUnitForSquad(match: MatchState, squad: SquadId): UnitState | undefined {
  return livingUnits(match, squad).find((unit) => unit.deployed && !unit.actedThisRound);
}

function beginSquadTurn(match: MatchState, squad: SquadId): MatchState {
  const unit = nextUnitForSquad(match, squad);
  if (!unit) return match;
  const units = match.units.map((item) => (item.id === unit.id ? { ...item, ap: 2 } : item));
  return addLog({ ...match, units, activeSquad: squad, selectedUnitId: unit.id, phase: 'unit_action' }, 'turn_start', `${unit.name} 开始行动`);
}

export function beginFirstRound(match: MatchState): MatchState {
  const units = match.units.map((unit) => ({ ...unit, ap: 0, actedThisRound: false }));
  let next = addLog({ ...match, units, round: 1, turn: 1, phase: 'round_start', activeSquad: match.firstActor }, 'round_start', '第一大回合开始');
  return beginSquadTurn(next, match.firstActor);
}

export function finishCurrentUnitTurn(match: MatchState): MatchState {
  const current = match.units.find((unit) => unit.id === match.selectedUnitId);
  let units = match.units.map((unit) => (unit.id === current?.id ? { ...unit, ap: 0, actedThisRound: true } : unit));
  let next = addLog({ ...match, units, phase: 'turn_end' }, 'turn_end', current ? `${current.name} 结束行动` : '结束行动');

  const sameSquadNext = nextUnitForSquad(next, next.activeSquad);
  if (sameSquadNext) return beginSquadTurn(next, next.activeSquad);

  const otherSquad = enemyOf(next.activeSquad);
  const otherNext = nextUnitForSquad(next, otherSquad);
  if (otherNext) return beginSquadTurn(next, otherSquad);

  next = endRound(next);
  if (next.phase === 'match_end') return next;
  return startNextRound(next);
}

function endRound(match: MatchState): MatchState {
  let next = addLog({ ...match, phase: 'round_end', globalStatuses: [], activeDecree: null, decreeIssuedRound: null }, 'round_end', `第 ${match.round} 大回合结束`);
  next = resolveVictory(next, false);
  return next;
}

function startNextRound(match: MatchState): MatchState {
  if (match.round >= 3) return resolveVictory(match, true);
  const nextRound = match.round + 1;
  const first = match.firstActor;
  const units = match.units.map((unit) => ({
    ...unit,
    ap: 0,
    actedThisRound: false,
    statuses: unit.statuses.filter((status) => status !== 'fleeing' && status !== 'fox_mark'),
  }));
  const tiles = match.tiles.map((tile) => ({ ...tile, statusLayer: tile.statusLayer.filter((status) => status !== 'inspection_zone') }));
  let next = addLog({ ...match, units, tiles, round: nextRound, turn: match.turn + 1, phase: 'round_start', activeSquad: first }, 'round_start', `第 ${nextRound} 大回合开始`);
  return beginSquadTurn(next, first);
}
