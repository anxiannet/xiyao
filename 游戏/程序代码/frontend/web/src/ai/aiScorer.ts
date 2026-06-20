import { enemyOf, getTile, getUnit, hexDistance, livingUnits, objectiveTiles, type GameAction, type MatchState, type ScoreBreakdown, type ScoredAction } from '../engine/rules';

const zeroBreakdown = (): ScoreBreakdown => ({
  target: 0,
  position: 0,
  resource: 0,
  status: 0,
  objective: 0,
  synergy: 0,
  kill: 0,
  survival: 0,
  risk: 0,
});

export function scoreAction(match: MatchState, action: GameAction): ScoredAction {
  const unit = getUnit(match, action.unitId);
  const breakdown = zeroBreakdown();
  const notes: string[] = [];
  if (!unit) return { action, score: -999, breakdown, notes: ['无单位'] };

  const target = getUnit(match, action.targetUnitId);
  const targetTile = getTile(match, action.targetTileId ?? target?.tileId);
  const origin = getTile(match, unit.tileId);

  if (action.type === 'attack' || action.skillId === 'disturb_string' || action.skillId === 'fox_step') {
    if (target) {
      breakdown.target += target.leader ? 12 : 6;
      breakdown.target += Math.max(0, 8 - target.hp);
      if (target.statuses.includes('fox_mark') && unit.squad === 'qingqiu') breakdown.status += 8;
      const expectedDamage = unit.dmg + (target.statuses.includes('fox_mark') ? 1 : 0);
      if (target.hp <= expectedDamage) breakdown.kill += target.leader ? 30 : 20;
      notes.push(`目标:${target.name}`);
    }
  }

  if (action.type === 'move' && targetTile) {
    const nearestObjective = objectiveTiles(match).reduce((best, tile) => {
      const distance = hexDistance(targetTile, tile);
      return !best || distance < best.distance ? { tile, distance } : best;
    }, null as null | { tile: typeof targetTile; distance: number });
    if (nearestObjective) breakdown.position += Math.max(0, 12 - nearestObjective.distance * 3);
    if (targetTile.terrainLayer === 'dusk_rift' && unit.squad === 'qingqiu') breakdown.resource += 10;
    if (targetTile.objectiveType === 'central') breakdown.objective += 14;
    if (targetTile.objectiveType === 'edge') breakdown.objective += 10;
  }

  if (action.type === 'capture') breakdown.objective += 22;
  if (action.skillId === 'decree') breakdown.resource += match.activeDecree ? 2 : 12;
  if (action.skillId === 'inspect') breakdown.status += 8;
  if (action.skillId === 'foxfire_path') breakdown.resource += 10;
  if (action.skillId === 'decoy') breakdown.synergy += 7;
  if (action.skillId === 'guard_array') breakdown.survival += 10;

  if (origin) {
    const friendNear = livingUnits(match, unit.squad).filter((ally) => ally.id !== unit.id && ally.tileId && hexDistance(origin, getTile(match, ally.tileId) ?? origin) <= 2).length;
    breakdown.synergy += Math.min(8, friendNear * 3);
  }

  if (targetTile) {
    const enemyThreats = livingUnits(match, enemyOf(unit.squad)).filter((enemy) => {
      const enemyTile = getTile(match, enemy.tileId);
      return enemyTile && hexDistance(targetTile, enemyTile) <= enemy.rng + enemy.mv;
    }).length;
    breakdown.risk -= Math.min(20, enemyThreats * 4);
    if (unit.hp <= 2) breakdown.survival += Math.max(0, 12 - enemyThreats * 4);
  }

  if (action.type === 'end_turn' && unit.ap > 0) breakdown.risk -= 8;

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return { action, score, breakdown, notes };
}

export function scoreActions(match: MatchState, actions: GameAction[]): ScoredAction[] {
  return actions.map((action) => scoreAction(match, action)).sort((a, b) => b.score - a.score || a.action.label.localeCompare(b.action.label));
}
