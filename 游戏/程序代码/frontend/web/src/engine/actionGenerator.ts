import { adjacentTiles, canActForPhase, enemyOf, getTile, getUnit, hasTileStatusActive, hexDistance, livingUnits, occupiedTileIds, type GameAction, type MatchState } from './rules';

let actionSeq = 0;
const id = (type: string) => `${type}_${actionSeq++}`;

export function generateLegalActions(match: MatchState, unitId = match.selectedUnitId): GameAction[] {
  if (!unitId || !canActForPhase(match.phase)) return [];
  const unit = getUnit(match, unitId);
  const origin = getTile(match, unit?.tileId);
  if (!unit || !origin || unit.defeated || unit.ap <= 0 || unit.squad !== match.activeSquad) return [];
  const occupied = occupiedTileIds(match);
  const actions: GameAction[] = [];

  const moveRange = Math.max(1, unit.mv - (unit.statuses.includes('lost') ? 1 : 0) + (unit.statuses.includes('route_guided') ? 1 : 0));
  for (const tile of match.tiles) {
    if (tile.terrainLayer === 'obstacle') continue;
    if (occupied.has(tile.id)) continue;
    const distance = hexDistance(origin, tile);
    if (distance > 0 && distance <= moveRange && unit.ap >= 1) {
      actions.push({ id: id('move'), type: 'move', unitId: unit.id, actor: unit.squad, targetTileId: tile.id, label: `移动至 ${tile.id}` });
    }
  }

  const attackRange = origin.terrainLayer === 'high_ground' && unit.rng > 1 ? unit.rng + 1 : unit.rng;
  for (const target of livingUnits(match, enemyOf(unit.squad))) {
    const targetTile = getTile(match, target.tileId);
    if (targetTile && hexDistance(origin, targetTile) <= attackRange && unit.ap >= 1) {
      actions.push({ id: id('attack'), type: 'attack', unitId: unit.id, actor: unit.squad, targetUnitId: target.id, label: `攻击 ${target.name}` });
    }
  }

  if (unit.ap >= 1) {
    actions.push(...generateSkillActions(match, unit.id));
    if (match.tiles.some((tile) => tile.objectiveOwner && objectiveRangeContains(match, tile.id, unit.tileId))) {
      actions.push({ id: id('capture'), type: 'capture', unitId: unit.id, actor: unit.squad, label: '占领据点' });
    }
  }
  actions.push({ id: id('end_turn'), type: 'end_turn', unitId: unit.id, actor: unit.squad, label: '结束行动' });
  return actions;
}

function generateSkillActions(match: MatchState, unitId: string): GameAction[] {
  const unit = getUnit(match, unitId);
  const origin = getTile(match, unit?.tileId);
  if (!unit || !origin) return [];
  const actions: GameAction[] = [];
  if (unit.skillId === 'decoy') {
    for (const tile of adjacentTiles(match, origin.id)) {
      if (tile.terrainLayer !== 'obstacle' && !occupiedTileIds(match).has(tile.id)) actions.push({ id: id('skill'), type: 'skill', unitId, actor: unit.squad, targetTileId: tile.id, skillId: 'decoy', label: `假身 ${tile.id}` });
    }
  }
  if (unit.skillId === 'foxfire_path') {
    for (const ally of livingUnits(match, unit.squad)) {
      const allyTile = getTile(match, ally.tileId);
      if (allyTile && hexDistance(origin, allyTile) <= 2) actions.push({ id: id('skill'), type: 'skill', unitId, actor: unit.squad, targetUnitId: ally.id, skillId: 'foxfire_path', label: `狐火引路 ${ally.name}` });
    }
  }
  if (unit.skillId === 'disturb_string') {
    for (const enemy of livingUnits(match, enemyOf(unit.squad))) {
      const targetTile = getTile(match, enemy.tileId);
      if (targetTile && hexDistance(origin, targetTile) <= (origin.terrainLayer === 'high_ground' ? 4 : 3)) actions.push({ id: id('skill'), type: 'skill', unitId, actor: unit.squad, targetUnitId: enemy.id, skillId: 'disturb_string', label: `扰弦 ${enemy.name}` });
    }
  }
  if (unit.skillId === 'decree' && match.decreeIssuedRound !== match.round) {
    actions.push({ id: id('skill'), type: 'skill', unitId, actor: unit.squad, skillId: 'decree', decreeId: 'forbid_movement', label: '颁令：禁行令' });
    actions.push({ id: id('skill'), type: 'skill', unitId, actor: unit.squad, skillId: 'decree', decreeId: 'martial_law', label: '颁令：戒严令' });
    actions.push({ id: id('skill'), type: 'skill', unitId, actor: unit.squad, skillId: 'decree', decreeId: 'pursuit', label: '颁令：追捕令' });
  }
  if (unit.skillId === 'inspect') {
    for (const tile of match.tiles) {
      if (hexDistance(origin, tile) <= 2) actions.push({ id: id('skill'), type: 'skill', unitId, actor: unit.squad, targetTileId: tile.id, skillId: 'inspect', label: `勘验 ${tile.id}` });
    }
  }
  if (unit.skillId === 'guard_array') {
    for (const ally of livingUnits(match, unit.squad).filter((item) => item.id !== unit.id)) {
      const allyTile = getTile(match, ally.tileId);
      if (allyTile && hexDistance(origin, allyTile) <= 1) actions.push({ id: id('skill'), type: 'skill', unitId, actor: unit.squad, targetUnitId: ally.id, skillId: 'guard_array', label: `护阵 ${ally.name}` });
    }
  }
  if (unit.skillId === 'fox_step') {
    for (const tile of adjacentTiles(match, origin.id)) {
      if (tile.terrainLayer === 'obstacle' || occupiedTileIds(match).has(tile.id)) continue;
      for (const enemy of livingUnits(match, enemyOf(unit.squad))) {
        const enemyTile = getTile(match, enemy.tileId);
        if (enemyTile && hexDistance(tile, enemyTile) <= 1) actions.push({ id: id('skill'), type: 'skill', unitId, actor: unit.squad, targetTileId: tile.id, targetUnitId: enemy.id, skillId: 'fox_step', label: `狐步 ${tile.id} 后攻击 ${enemy.name}` });
      }
    }
  }
  return actions;
}

export function objectiveRangeContains(match: MatchState, objectiveTileId: string, unitTileId: string | null): boolean {
  if (!unitTileId) return false;
  const objective = getTile(match, objectiveTileId);
  const unitTile = getTile(match, unitTileId);
  if (!objective || !unitTile) return false;
  if (objective.terrainLayer === 'central_objective') return hexDistance(objective, unitTile) <= 1;
  if (objective.terrainLayer === 'edge_objective') return objective.id === unitTile.id;
  return false;
}
