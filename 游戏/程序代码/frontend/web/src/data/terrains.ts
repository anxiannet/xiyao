import type { TerrainId } from './maps';

export const terrainConfigs: Record<TerrainId, { name: string; passable: boolean; objectiveValue: number }> = {
  plain: { name: '普通格', passable: true, objectiveValue: 0 },
  central_objective: { name: '中央据点', passable: true, objectiveValue: 2 },
  edge_objective: { name: '边缘据点', passable: true, objectiveValue: 1 },
  high_ground: { name: '高台', passable: true, objectiveValue: 0 },
  cover_shadow: { name: '掩影', passable: true, objectiveValue: 0 },
  dusk_rift: { name: '黄昏裂隙', passable: true, objectiveValue: 0 },
  obstacle: { name: '障碍', passable: false, objectiveValue: 0 },
};
