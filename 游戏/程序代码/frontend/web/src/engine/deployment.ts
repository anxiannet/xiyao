import { addLog, occupiedTileIds, type MatchState } from './rules';

export function deployUnit(match: MatchState, unitId: string, tileId: string): MatchState {
  if (match.phase !== 'deployment') return addLog(match, 'deploy_rejected', '当前阶段不能部署');
  const unit = match.units.find((item) => item.id === unitId);
  const tile = match.tiles.find((item) => item.id === tileId);
  if (!unit || unit.defeated) return addLog(match, 'deploy_rejected', '单位不存在');
  if (!tile) return addLog(match, 'deploy_rejected', '格子不存在');
  if (tile.deploymentOwner !== unit.squad) return addLog(match, 'deploy_rejected', '只能部署到己方部署格');
  if (tile.terrainLayer === 'obstacle') return addLog(match, 'deploy_rejected', '障碍不能部署');
  if (occupiedTileIds(match).has(tileId)) return addLog(match, 'deploy_rejected', '该格已有单位');
  const units = match.units.map((item) => (item.id === unitId ? { ...item, tileId, deployed: true } : item));
  return addLog({ ...match, units, selectedUnitId: null }, 'deploy_unit', `${unit.name} 部署至 ${tileId}`);
}

export function autoDeploySquad(match: MatchState, squad: 'qingqiu' | 'tianmen'): MatchState {
  let next = match;
  const slots = next.tiles.filter((tile) => tile.deploymentOwner === squad && tile.terrainLayer !== 'obstacle');
  for (const unit of next.units.filter((item) => item.squad === squad && !item.deployed && !item.summon)) {
    const used = occupiedTileIds(next);
    const slot = slots.find((tile) => !used.has(tile.id));
    if (slot) next = deployUnit(next, unit.id, slot.id);
  }
  return next;
}

export function allFormalUnitsDeployed(match: MatchState): boolean {
  return match.units.filter((unit) => !unit.summon).every((unit) => unit.deployed);
}
