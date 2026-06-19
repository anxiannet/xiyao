import { adjacentTiles, addLog, enemyOf, getTile, getUnit, hasTileStatusActive, hexDistance, isEdgeTile, isTileSuppressed, livingUnits, objectiveTiles, occupiedTileIds, type GameAction, type MatchState, type SquadId, type TileState, type TileStatusId, type UnitState, type UnitStatusId } from './rules';
import { finishCurrentUnitTurn } from './turnManager';
import { resolveVictory } from './victoryResolver';
import { objectiveRangeContains } from './actionGenerator';

export function resolveAction(match: MatchState, action: GameAction): MatchState {
  const baseError = validateBase(match, action);
  if (baseError) return addLog(match, 'action_rejected', baseError);
  if (action.type === 'move') return resolveMove(match, action);
  if (action.type === 'attack') return resolveAttack(match, action);
  if (action.type === 'skill') return resolveSkill(match, action);
  if (action.type === 'capture') return resolveCapture(match, action);
  if (action.type === 'end_turn') return finishCurrentUnitTurn(match);
  return match;
}

function validateBase(match: MatchState, action: GameAction): string | null {
  if (match.phase !== 'unit_action') return '当前阶段不能执行动作';
  if (action.actor !== match.activeSquad) return '行动方不一致';
  const unit = getUnit(match, action.unitId);
  if (!unit || unit.defeated || !unit.deployed) return '行动单位非法';
  if (unit.squad !== match.activeSquad) return '只能操作当前行动方单位';
  if (action.type !== 'end_turn' && unit.ap < 1) return 'AP不足';
  return null;
}

function spendAp(match: MatchState, unitId: string, amount = 1): MatchState {
  return { ...match, units: match.units.map((unit) => (unit.id === unitId ? { ...unit, ap: Math.max(0, unit.ap - amount) } : unit)) };
}

function resolveMove(match: MatchState, action: GameAction): MatchState {
  const unit = getUnit(match, action.unitId) as UnitState;
  const origin = getTile(match, unit.tileId) as TileState;
  const target = getTile(match, action.targetTileId);
  if (!target || target.terrainLayer === 'obstacle') return addLog(match, 'action_rejected', '移动目标非法');
  if (occupiedTileIds(match).has(target.id)) return addLog(match, 'action_rejected', '目标格已有单位');
  const range = Math.max(1, unit.mv - (unit.statuses.includes('lost') ? 1 : 0) + (unit.statuses.includes('route_guided') ? 1 : 0));
  if (hexDistance(origin, target) > range) return addLog(match, 'action_rejected', '移动距离超出MV');

  let foxfire = match.foxfire;
  let statusTriggers = 0;
  let units = match.units.map((item) => {
    if (item.id !== unit.id) return item;
    const statuses: UnitStatusId[] = item.statuses.filter((status) => status !== 'lost' && status !== 'route_guided');
    if (match.globalStatuses.includes('pursuit') && item.squad === 'qingqiu' && !statuses.includes('fleeing')) {
      statuses.push('fleeing');
      statusTriggers += 1;
    }
    if (match.globalStatuses.includes('forbid_movement') && item.squad === 'qingqiu' && (target.terrainLayer === 'edge_objective' || target.terrainLayer === 'dusk_rift') && !statuses.includes('lost')) {
      statuses.push('lost');
      statusTriggers += 1;
    }
    if (hasTileStatusActive(target, 'foxfire_remnant') && item.squad === 'qingqiu') foxfire = Math.min(5, foxfire + 1);
    if (target.terrainLayer === 'dusk_rift' && !isTileSuppressed(target) && item.squad === 'qingqiu') foxfire = Math.min(5, foxfire + 1);
    if (hasTileStatusActive(target, 'foxfire_remnant') && item.squad === 'tianmen' && !statuses.includes('lost')) {
      statuses.push('lost');
      statusTriggers += 1;
    }
    return { ...item, tileId: target.id, statuses };
  });
  let next = spendAp({ ...match, units, foxfire, metrics: { ...match.metrics, statusTriggers: match.metrics.statusTriggers + statusTriggers } }, unit.id);
  next = syncFoxfireFull(next);
  return addLog(next, 'move', `${unit.name} 从 ${origin.id} 移动至 ${target.id}`);
}

function resolveAttack(match: MatchState, action: GameAction, skillBonus = 0): MatchState {
  const attacker = getUnit(match, action.unitId) as UnitState;
  const target = getUnit(match, action.targetUnitId);
  const attackerTile = getTile(match, attacker.tileId) as TileState;
  const targetTile = getTile(match, target?.tileId);
  if (!target || !targetTile || target.squad === attacker.squad || target.defeated) return addLog(match, 'action_rejected', '攻击目标非法');
  const range = attackerTile.terrainLayer === 'high_ground' && attacker.rng > 1 ? attacker.rng + 1 : attacker.rng;
  if (hexDistance(attackerTile, targetTile) > range && action.skillId !== 'fox_step' && action.skillId !== 'disturb_string') return addLog(match, 'action_rejected', '攻击距离不足');

  const foxfireFull = attacker.squad === 'qingqiu' && match.teamStatuses.qingqiu.includes('foxfire_full');
  const markBonus = target.statuses.includes('fox_mark') && attacker.squad === 'qingqiu' ? 1 : 0;
  const attackScore = attacker.atkDice + markBonus + (foxfireFull ? 1 : 0);
  const coverBonus = targetTile.terrainLayer === 'cover_shadow' && !isTileSuppressed(targetTile) ? 1 : 0;
  const martialLawBonus = target.squad === 'tianmen' && match.globalStatuses.includes('martial_law') && targetTile.terrainLayer === 'central_objective' ? 1 : 0;
  const defenseScore = target.defDice + coverBonus + martialLawBonus;
  const hit = attackScore >= defenseScore;
  const damage = hit ? attacker.dmg + skillBonus + (foxfireFull ? 1 : 0) : 0;
  let defeated = false;
  let foxfire = foxfireFull ? 0 : match.foxfire;
  let teamStatuses = foxfireFull ? { ...match.teamStatuses, qingqiu: match.teamStatuses.qingqiu.filter((status) => status !== 'foxfire_full') } : match.teamStatuses;
  let metrics = { ...match.metrics };
  const units = match.units.map((unit) => {
    if (unit.id !== target.id) return unit;
    const hp = Math.max(0, unit.hp - damage);
    defeated = hp <= 0;
    return { ...unit, hp, defeated, tileId: defeated ? null : unit.tileId };
  });
  if (hit && target.statuses.includes('fox_mark') && attacker.squad === 'qingqiu') foxfire = Math.min(5, foxfire + 1);
  if (defeated) metrics = { ...metrics, kills: { ...metrics.kills, [attacker.squad]: metrics.kills[attacker.squad] + (target.leader ? 2 : 1) } };
  let next = spendAp({ ...match, units, foxfire, teamStatuses, metrics }, attacker.id);
  next = syncFoxfireFull(next);
  next = addLog(next, 'attack', `${attacker.name} 攻击 ${target.name}：${hit ? `命中，造成${damage}伤害` : '未命中'}`, { attackScore, defenseScore, damage });
  return resolveVictory(next, false);
}

function resolveSkill(match: MatchState, action: GameAction): MatchState {
  const unit = getUnit(match, action.unitId) as UnitState;
  if (unit.skillId !== action.skillId) return addLog(match, 'action_rejected', '技能不属于该单位');
  if (action.skillId === 'fox_step') return resolveFoxStep(match, action);
  if (action.skillId === 'disturb_string') return resolveDisturbString(match, action);
  if (action.skillId === 'decoy') return resolveDecoy(match, action);
  if (action.skillId === 'foxfire_path') return resolveFoxfirePath(match, action);
  if (action.skillId === 'decree') return resolveDecree(match, action);
  if (action.skillId === 'inspect') return resolveInspect(match, action);
  if (action.skillId === 'guard_array') return resolveGuardArray(match, action);
  return match;
}

function resolveFoxStep(match: MatchState, action: GameAction): MatchState {
  let moved = resolveMove(match, { ...action, type: 'move', label: '狐步移动' });
  const attacker = getUnit(moved, action.unitId);
  if (!attacker || attacker.ap < 0) return moved;
  moved = { ...moved, units: moved.units.map((unit) => (unit.id === attacker.id ? { ...unit, ap: unit.ap + 1 } : unit)) };
  let next = resolveAttack(moved, action);
  const target = getUnit(next, action.targetUnitId);
  const origin = getTile(match, getUnit(match, action.unitId)?.tileId);
  const shouldMark = origin && (origin.terrainLayer === 'dusk_rift' || origin.terrainLayer === 'cover_shadow' || origin.terrainLayer === 'edge_objective' || isEdgeTile(origin) || origin.statusLayer.includes('foxfire_remnant'));
  if (target && shouldMark && !target.defeated) {
    next = { ...next, units: next.units.map((unit) => (unit.id === target.id && !unit.statuses.includes('fox_mark') ? { ...unit, statuses: [...unit.statuses, 'fox_mark'] } : unit)), metrics: { ...next.metrics, statusTriggers: next.metrics.statusTriggers + 1 } };
    next = addLog(next, 'status_apply', `${target.name} 获得狐印`);
  }
  return { ...next, metrics: { ...next.metrics, skillUses: next.metrics.skillUses + 1 } };
}

function resolveDisturbString(match: MatchState, action: GameAction): MatchState {
  const target = getUnit(match, action.targetUnitId);
  const bonus = target?.statuses.includes('fox_mark') ? 1 : 0;
  const next = resolveAttack(match, action, bonus);
  return { ...next, metrics: { ...next.metrics, skillUses: next.metrics.skillUses + 1 } };
}

function resolveDecoy(match: MatchState, action: GameAction): MatchState {
  const target = getTile(match, action.targetTileId);
  if (!target || target.terrainLayer === 'obstacle' || occupiedTileIds(match).has(target.id)) return addLog(match, 'action_rejected', '假身目标格非法');
  const source = getUnit(match, action.unitId) as UnitState;
  const decoy: UnitState = { ...source, id: `decoy_${Date.now()}_${match.units.length}`, name: '假身', leader: false, hp: 1, maxHp: 1, mv: 0, atkDice: 0, defDice: 0, dmg: 0, rng: 0, skillId: 'none', skillName: '无', ap: 0, tileId: target.id, deployed: true, defeated: false, statuses: [], actedThisRound: true, summon: true, duration: target.terrainLayer === 'cover_shadow' ? 2 : 1 };
  const next = spendAp({ ...match, units: [...match.units, decoy], metrics: { ...match.metrics, skillUses: match.metrics.skillUses + 1 } }, source.id);
  return addLog(next, 'skill', `${source.name} 在 ${target.id} 生成假身`);
}

function resolveFoxfirePath(match: MatchState, action: GameAction): MatchState {
  const source = getUnit(match, action.unitId) as UnitState;
  const target = getUnit(match, action.targetUnitId);
  const sourceTile = getTile(match, source.tileId);
  if (!target || target.squad !== source.squad || !sourceTile) return addLog(match, 'action_rejected', '狐火引路目标非法');
  const tiles = match.tiles.map((tile) => (tile.id === sourceTile.id && !tile.statusLayer.includes('foxfire_remnant') ? { ...tile, statusLayer: [...tile.statusLayer, 'foxfire_remnant' as TileStatusId] } : tile));
  const units = match.units.map((unit) => (unit.id === target.id && !unit.statuses.includes('route_guided') ? { ...unit, statuses: [...unit.statuses, 'route_guided' as UnitStatusId] } : unit));
  const next = spendAp({ ...match, units, tiles, metrics: { ...match.metrics, skillUses: match.metrics.skillUses + 1, statusTriggers: match.metrics.statusTriggers + 1 } }, source.id);
  return addLog(next, 'skill', `${source.name} 为 ${target.name} 施加狐火引路，${sourceTile.id} 获得狐火残留`);
}

function resolveDecree(match: MatchState, action: GameAction): MatchState {
  if (!action.decreeId || match.decreeIssuedRound === match.round) return addLog(match, 'action_rejected', '本大回合不能再次颁令');
  const unit = getUnit(match, action.unitId) as UnitState;
  const next = spendAp({ ...match, activeDecree: action.decreeId, decreeIssuedRound: match.round, globalStatuses: [action.decreeId], metrics: { ...match.metrics, skillUses: match.metrics.skillUses + 1, decreeUses: match.metrics.decreeUses + 1 } }, unit.id);
  return addLog(next, 'skill', `${unit.name} 颁布${action.label.replace('颁令：', '')}`);
}

function resolveInspect(match: MatchState, action: GameAction): MatchState {
  const source = getUnit(match, action.unitId) as UnitState;
  const center = getTile(match, action.targetTileId);
  if (!center) return addLog(match, 'action_rejected', '勘验目标非法');
  const affected = [center, ...adjacentTiles(match, center.id)].map((tile) => tile.id);
  const tiles = match.tiles.map((tile) => (affected.includes(tile.id) && !tile.statusLayer.includes('inspection_zone') ? { ...tile, statusLayer: [...tile.statusLayer, 'inspection_zone' as TileStatusId] } : tile));
  const next = spendAp({ ...match, tiles, metrics: { ...match.metrics, skillUses: match.metrics.skillUses + 1, statusTriggers: match.metrics.statusTriggers + affected.length } }, source.id);
  return addLog(next, 'skill', `${source.name} 勘验 ${center.id} 及相邻格`);
}

function resolveGuardArray(match: MatchState, action: GameAction): MatchState {
  const source = getUnit(match, action.unitId) as UnitState;
  const target = getUnit(match, action.targetUnitId);
  if (!target || target.squad !== source.squad) return addLog(match, 'action_rejected', '护阵目标非法');
  const units = match.units.map((unit) => (unit.id === target.id && !unit.statuses.includes('guarded') ? { ...unit, statuses: [...unit.statuses, 'guarded' as UnitStatusId] } : unit));
  const next = spendAp({ ...match, units, metrics: { ...match.metrics, skillUses: match.metrics.skillUses + 1, statusTriggers: match.metrics.statusTriggers + 1 } }, source.id);
  return addLog(next, 'skill', `${source.name} 为 ${target.name} 建立护阵`);
}

function resolveCapture(match: MatchState, action: GameAction): MatchState {
  const unit = getUnit(match, action.unitId) as UnitState;
  const target = objectiveTiles(match).find((tile) => objectiveRangeContains(match, tile.id, unit.tileId));
  if (!target) return addLog(match, 'action_rejected', '不在据点范围内');
  const ally = countFormalUnitsInObjective(match, target, unit.squad);
  const enemy = countFormalUnitsInObjective(match, target, enemyOf(unit.squad));
  if (ally <= enemy) return addLog(spendAp(match, unit.id), 'capture_failed', `${unit.name} 占领失败`);
  const tiles = match.tiles.map((tile) => (tile.id === target.id ? { ...tile, objectiveOwner: unit.squad } : tile));
  const next = spendAp({ ...match, tiles, metrics: { ...match.metrics, captures: { ...match.metrics.captures, [unit.squad]: match.metrics.captures[unit.squad] + 1 } } }, unit.id);
  return addLog(next, 'capture', `${unit.name} 占领 ${target.id}`);
}

function countFormalUnitsInObjective(match: MatchState, objective: TileState, squad: SquadId): number {
  return livingUnits(match, squad).filter((unit) => !unit.summon && objectiveRangeContains(match, objective.id, unit.tileId)).length;
}

function syncFoxfireFull(match: MatchState): MatchState {
  if (match.foxfire >= 5 && !match.teamStatuses.qingqiu.includes('foxfire_full')) {
    return { ...match, foxfire: 5, teamStatuses: { ...match.teamStatuses, qingqiu: [...match.teamStatuses.qingqiu, 'foxfire_full'] } };
  }
  return match;
}
