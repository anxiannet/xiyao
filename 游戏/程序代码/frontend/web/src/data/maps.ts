export type SquadId = 'qingqiu' | 'tianmen';
export type TerrainId =
  | 'plain'
  | 'central_objective'
  | 'edge_objective'
  | 'high_ground'
  | 'cover_shadow'
  | 'dusk_rift'
  | 'obstacle';
export type MapId = 'test_map_a' | 'test_map_b' | 'test_map_c';

export type MapTileConfig = {
  id: string;
  q: number;
  r: number;
  terrain: TerrainId;
  deploymentOwner?: SquadId;
};

export type MapConfig = {
  id: MapId;
  name: string;
  typeNote: string;
  tiles: MapTileConfig[];
};

export const mapConfigs: Record<MapId, MapConfig> = {
  test_map_a: {
    id: 'test_map_a',
    name: 'test_map_a｜测试地图A：开阔对称图',
    typeNote: '开阔对称图：验证基础移动、占点节奏与正面对抗。',
    tiles: [
      { id: '-2,-2', q: -2, r: -2, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,-2', q: -1, r: -2, terrain: 'plain' },
      { id: '0,-2', q: 0, r: -2, terrain: 'edge_objective' },
      { id: '1,-2', q: 1, r: -2, terrain: 'plain' },
      { id: '2,-2', q: 2, r: -2, terrain: 'plain', deploymentOwner: 'tianmen' },
      { id: '-2,-1', q: -2, r: -1, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,-1', q: -1, r: -1, terrain: 'cover_shadow' },
      { id: '0,-1', q: 0, r: -1, terrain: 'dusk_rift' },
      { id: '1,-1', q: 1, r: -1, terrain: 'high_ground' },
      { id: '2,-1', q: 2, r: -1, terrain: 'cover_shadow', deploymentOwner: 'tianmen' },
      { id: '-2,0', q: -2, r: 0, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,0', q: -1, r: 0, terrain: 'plain' },
      { id: '0,0', q: 0, r: 0, terrain: 'central_objective' },
      { id: '1,0', q: 1, r: 0, terrain: 'plain' },
      { id: '2,0', q: 2, r: 0, terrain: 'plain', deploymentOwner: 'tianmen' },
      { id: '-2,1', q: -2, r: 1, terrain: 'cover_shadow', deploymentOwner: 'qingqiu' },
      { id: '-1,1', q: -1, r: 1, terrain: 'high_ground' },
      { id: '0,1', q: 0, r: 1, terrain: 'plain' },
      { id: '1,1', q: 1, r: 1, terrain: 'cover_shadow' },
      { id: '2,1', q: 2, r: 1, terrain: 'plain', deploymentOwner: 'tianmen' },
      { id: '-2,2', q: -2, r: 2, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,2', q: -1, r: 2, terrain: 'plain' },
      { id: '0,2', q: 0, r: 2, terrain: 'edge_objective' },
      { id: '1,2', q: 1, r: 2, terrain: 'plain' },
      { id: '2,2', q: 2, r: 2, terrain: 'plain', deploymentOwner: 'tianmen' },
    ],
  },
  test_map_b: {
    id: 'test_map_b',
    name: 'test_map_b｜测试地图B：裂隙侧路图',
    typeNote: '裂隙侧路图：验证黄昏裂隙、侧路收益、狐火循环与禁行令判断。',
    tiles: [
      { id: '-2,-2', q: -2, r: -2, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,-2', q: -1, r: -2, terrain: 'cover_shadow' },
      { id: '0,-2', q: 0, r: -2, terrain: 'edge_objective' },
      { id: '1,-2', q: 1, r: -2, terrain: 'high_ground' },
      { id: '2,-2', q: 2, r: -2, terrain: 'plain', deploymentOwner: 'tianmen' },
      { id: '-2,-1', q: -2, r: -1, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,-1', q: -1, r: -1, terrain: 'plain' },
      { id: '0,-1', q: 0, r: -1, terrain: 'plain' },
      { id: '1,-1', q: 1, r: -1, terrain: 'plain' },
      { id: '2,-1', q: 2, r: -1, terrain: 'cover_shadow', deploymentOwner: 'tianmen' },
      { id: '-2,0', q: -2, r: 0, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,0', q: -1, r: 0, terrain: 'dusk_rift' },
      { id: '0,0', q: 0, r: 0, terrain: 'central_objective' },
      { id: '1,0', q: 1, r: 0, terrain: 'dusk_rift' },
      { id: '2,0', q: 2, r: 0, terrain: 'plain', deploymentOwner: 'tianmen' },
      { id: '-2,1', q: -2, r: 1, terrain: 'cover_shadow', deploymentOwner: 'qingqiu' },
      { id: '-1,1', q: -1, r: 1, terrain: 'plain' },
      { id: '0,1', q: 0, r: 1, terrain: 'plain' },
      { id: '1,1', q: 1, r: 1, terrain: 'plain' },
      { id: '2,1', q: 2, r: 1, terrain: 'plain', deploymentOwner: 'tianmen' },
      { id: '-2,2', q: -2, r: 2, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,2', q: -1, r: 2, terrain: 'high_ground' },
      { id: '0,2', q: 0, r: 2, terrain: 'edge_objective' },
      { id: '1,2', q: 1, r: 2, terrain: 'cover_shadow' },
      { id: '2,2', q: 2, r: 2, terrain: 'plain', deploymentOwner: 'tianmen' },
    ],
  },
  test_map_c: {
    id: 'test_map_c',
    name: 'test_map_c｜测试地图C：障碍分流图',
    typeNote: '障碍分流图：验证障碍绕行、路线选择与视线阻挡。',
    tiles: [
      { id: '-2,-2', q: -2, r: -2, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,-2', q: -1, r: -2, terrain: 'high_ground' },
      { id: '0,-2', q: 0, r: -2, terrain: 'edge_objective' },
      { id: '1,-2', q: 1, r: -2, terrain: 'plain' },
      { id: '2,-2', q: 2, r: -2, terrain: 'plain', deploymentOwner: 'tianmen' },
      { id: '-2,-1', q: -2, r: -1, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,-1', q: -1, r: -1, terrain: 'obstacle' },
      { id: '0,-1', q: 0, r: -1, terrain: 'dusk_rift' },
      { id: '1,-1', q: 1, r: -1, terrain: 'cover_shadow' },
      { id: '2,-1', q: 2, r: -1, terrain: 'cover_shadow', deploymentOwner: 'tianmen' },
      { id: '-2,0', q: -2, r: 0, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,0', q: -1, r: 0, terrain: 'plain' },
      { id: '0,0', q: 0, r: 0, terrain: 'central_objective' },
      { id: '1,0', q: 1, r: 0, terrain: 'plain' },
      { id: '2,0', q: 2, r: 0, terrain: 'plain', deploymentOwner: 'tianmen' },
      { id: '-2,1', q: -2, r: 1, terrain: 'cover_shadow', deploymentOwner: 'qingqiu' },
      { id: '-1,1', q: -1, r: 1, terrain: 'cover_shadow' },
      { id: '0,1', q: 0, r: 1, terrain: 'dusk_rift' },
      { id: '1,1', q: 1, r: 1, terrain: 'obstacle' },
      { id: '2,1', q: 2, r: 1, terrain: 'plain', deploymentOwner: 'tianmen' },
      { id: '-2,2', q: -2, r: 2, terrain: 'plain', deploymentOwner: 'qingqiu' },
      { id: '-1,2', q: -1, r: 2, terrain: 'plain' },
      { id: '0,2', q: 0, r: 2, terrain: 'edge_objective' },
      { id: '1,2', q: 1, r: 2, terrain: 'high_ground' },
      { id: '2,2', q: 2, r: 2, terrain: 'plain', deploymentOwner: 'tianmen' },
    ],
  },
};
