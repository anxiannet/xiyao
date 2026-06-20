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
  const playableTiles = config.tiles.filter((tile) => !tile.isBackground);
  const ids = new Set(config.tiles.map((tile) => tile.id));
  const coordinateKeys = new Set(config.tiles.map((tile) => `${tile.q},${tile.r}`));
  const qingqiuDeployment = playableTiles.filter((tile) => tile.deploymentOwner === 'qingqiu').length;
  const tianmenDeployment = playableTiles.filter((tile) => tile.deploymentOwner === 'tianmen').length;
  const centralObjectives = playableTiles.filter((tile) => tile.objectiveType === 'central').length;
  const edgeObjectives = playableTiles.filter((tile) => tile.objectiveType === 'edge').length;

  if (config.tiles.length !== config.grid.rows * config.grid.cols) errors.push('格子数量必须等于 rows x cols');
  if (ids.size !== config.tiles.length) errors.push('格子ID必须唯一');
  if (coordinateKeys.size !== config.tiles.length) errors.push('坐标必须唯一');
  if (qingqiuDeployment !== 4) errors.push('青丘部署格必须为4');
  if (tianmenDeployment !== 4) errors.push('天门部署格必须为4');
  if (centralObjectives < 1) errors.push('至少1个中央据点');
  if (edgeObjectives < 1) errors.push('至少1个边缘据点');

  for (const tile of config.tiles) {
    if (tile.isBackground && (tile.deploymentOwner || tile.objectiveType)) errors.push(`背景格不能标注部署或据点：${tile.id}`);
    if (tile.isBackground) continue;
    if (!tile.deploymentOwner) continue;
    if (tile.objectiveType) errors.push(`据点不能在部署区：${tile.id}`);
    if (tile.terrain === 'obstacle') errors.push(`障碍不能在部署区：${tile.id}`);
  }

  const deploymentCounts: Record<SquadId, number> = { qingqiu: qingqiuDeployment, tianmen: tianmenDeployment };
  if (deploymentCounts.qingqiu < 4 || deploymentCounts.tianmen < 3) warnings.push('部署格低于当前固定小队人数');
  return { ok: errors.length === 0, errors, warnings, qingqiuDeployment, tianmenDeployment, centralObjectives, edgeObjectives };
}
