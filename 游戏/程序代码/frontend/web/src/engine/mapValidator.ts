import type { MapConfig, SquadId } from '../data/maps';

export type MapValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  qingqiuDeployment: number;
  tianmenDeployment: number;
  centralObjectives: number;
  edgeObjectives: number;
};

export function validateMap(config: MapConfig): MapValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set(config.tiles.map((tile) => tile.id));
  const coordinateKeys = new Set(config.tiles.map((tile) => `${tile.q},${tile.r}`));
  const qingqiuDeployment = config.tiles.filter((tile) => tile.deploymentOwner === 'qingqiu').length;
  const tianmenDeployment = config.tiles.filter((tile) => tile.deploymentOwner === 'tianmen').length;
  const centralObjectives = config.tiles.filter((tile) => tile.terrain === 'central_objective').length;
  const edgeObjectives = config.tiles.filter((tile) => tile.terrain === 'edge_objective').length;

  if (config.tiles.length !== 25) errors.push('地图必须为25格');
  if (ids.size !== config.tiles.length) errors.push('格子ID必须唯一');
  if (coordinateKeys.size !== config.tiles.length) errors.push('坐标必须唯一');
  if (qingqiuDeployment < 5) errors.push('青丘部署格不少于5');
  if (tianmenDeployment < 5) errors.push('天门部署格不少于5');
  if (centralObjectives < 1) errors.push('至少1个中央据点');
  if (edgeObjectives < 1) errors.push('至少1个边缘据点');

  for (const tile of config.tiles) {
    if (!tile.deploymentOwner) continue;
    if (tile.terrain === 'central_objective' || tile.terrain === 'edge_objective') errors.push(`据点不能在部署区：${tile.id}`);
    if (tile.terrain === 'obstacle') errors.push(`障碍不能在部署区：${tile.id}`);
  }

  const deploymentCounts: Record<SquadId, number> = { qingqiu: qingqiuDeployment, tianmen: tianmenDeployment };
  if (deploymentCounts.qingqiu > 6 || deploymentCounts.tianmen > 6) warnings.push('部署格超过推荐值6，可读性需重点检查');
  return { ok: errors.length === 0, errors, warnings, qingqiuDeployment, tianmenDeployment, centralObjectives, edgeObjectives };
}
