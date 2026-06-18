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

const tile = (
  mapId: MapId,
  q: number,
  r: number,
  terrain: TerrainId,
  deploymentOwner?: SquadId,
): MapTileConfig => ({
  id: `${q},${r}`,
  q,
  r,
  terrain,
  deploymentOwner,
});

export const mapConfigs: Record<MapId, MapConfig> = {
  test_map_a: {
    id: 'test_map_a',
    name: 'test_map_a｜测试地图A：开阔对称图',
    typeNote: '开阔对称图：验证基础移动、占点节奏与正面对抗。',
    tiles: [
      tile('test_map_a', -2, -2, 'plain', 'qingqiu'),
      tile('test_map_a', -1, -2, 'plain'),
      tile('test_map_a', 0, -2, 'edge_objective'),
      tile('test_map_a', 1, -2, 'plain'),
      tile('test_map_a', 2, -2, 'plain', 'tianmen'),
      tile('test_map_a', -2, -1, 'plain', 'qingqiu'),
      tile('test_map_a', -1, -1, 'cover_shadow'),
      tile('test_map_a', 0, -1, 'dusk_rift'),
      tile('test_map_a', 1, -1, 'high_ground'),
      tile('test_map_a', 2, -1, 'cover_shadow', 'tianmen'),
      tile('test_map_a', -2, 0, 'plain', 'qingqiu'),
      tile('test_map_a', -1, 0, 'plain'),
      tile('test_map_a', 0, 0, 'central_objective'),
      tile('test_map_a', 1, 0, 'plain'),
      tile('test_map_a', 2, 0, 'plain', 'tianmen'),
      tile('test_map_a', -2, 1, 'cover_shadow', 'qingqiu'),
      tile('test_map_a', -1, 1, 'high_ground'),
      tile('test_map_a', 0, 1, 'plain'),
      tile('test_map_a', 1, 1, 'cover_shadow'),
      tile('test_map_a', 2, 1, 'plain', 'tianmen'),
      tile('test_map_a', -2, 2, 'plain', 'qingqiu'),
      tile('test_map_a', -1, 2, 'plain'),
      tile('test_map_a', 0, 2, 'edge_objective'),
      tile('test_map_a', 1, 2, 'plain'),
      tile('test_map_a', 2, 2, 'plain', 'tianmen'),
    ],
  },
  test_map_b: {
    id: 'test_map_b',
    name: 'test_map_b｜测试地图B：裂隙侧路图',
    typeNote: '裂隙侧路图：验证黄昏裂隙、侧路收益、狐火循环与禁行令判断。',
    tiles: [
      tile('test_map_b', -2, -2, 'plain', 'qingqiu'),
      tile('test_map_b', -1, -2, 'cover_shadow'),
      tile('test_map_b', 0, -2, 'edge_objective'),
      tile('test_map_b', 1, -2, 'high_ground'),
      tile('test_map_b', 2, -2, 'plain', 'tianmen'),
      tile('test_map_b', -2, -1, 'plain', 'qingqiu'),
      tile('test_map_b', -1, -1, 'plain'),
      tile('test_map_b', 0, -1, 'plain'),
      tile('test_map_b', 1, -1, 'plain'),
      tile('test_map_b', 2, -1, 'cover_shadow', 'tianmen'),
      tile('test_map_b', -2, 0, 'plain', 'qingqiu'),
      tile('test_map_b', -1, 0, 'dusk_rift'),
      tile('test_map_b', 0, 0, 'central_objective'),
      tile('test_map_b', 1, 0, 'dusk_rift'),
      tile('test_map_b', 2, 0, 'plain', 'tianmen'),
      tile('test_map_b', -2, 1, 'cover_shadow', 'qingqiu'),
      tile('test_map_b', -1, 1, 'plain'),
      tile('test_map_b', 0, 1, 'plain'),
      tile('test_map_b', 1, 1, 'plain'),
      tile('test_map_b', 2, 1, 'plain', 'tianmen'),
      tile('test_map_b', -2, 2, 'plain', 'qingqiu'),
      tile('test_map_b', -1, 2, 'high_ground'),
      tile('test_map_b', 0, 2, 'edge_objective'),
      tile('test_map_b', 1, 2, 'cover_shadow'),
      tile('test_map_b', 2, 2, 'plain', 'tianmen'),
    ],
  },
  test_map_c: {
    id: 'test_map_c',
    name: 'test_map_c｜测试地图C：障碍分流图',
    typeNote: '障碍分流图：验证障碍绕行、路线选择与视线阻挡。',
    tiles: [
      tile('test_map_c', -2, -2, 'plain', 'qingqiu'),
      tile('test_map_c', -1, -2, 'high_ground'),
      tile('test_map_c', 0, -2, 'edge_objective'),
      tile('test_map_c', 1, -2, 'plain'),
      tile('test_map_c', 2, -2, 'plain', 'tianmen'),
      tile('test_map_c', -2, -1, 'plain', 'qingqiu'),
      tile('test_map_c', -1, -1, 'obstacle'),
      tile('test_map_c', 0, -1, 'dusk_rift'),
      tile('test_map_c', 1, -1, 'cover_shadow'),
      tile('test_map_c', 2, -1, 'cover_shadow', 'tianmen'),
      tile('test_map_c', -2, 0, 'plain', 'qingqiu'),
      tile('test_map_c', -1, 0, 'plain'),
      tile('test_map_c', 0, 0, 'central_objective'),
      tile('test_map_c', 1, 0, 'plain'),
      tile('test_map_c', 2, 0, 'plain', 'tianmen'),
      tile('test_map_c', -2, 1, 'cover_shadow', 'qingqiu'),
      tile('test_map_c', -1, 1, 'cover_shadow'),
      tile('test_map_c', 0, 1, 'dusk_rift'),
      tile('test_map_c', 1, 1, 'obstacle'),
      tile('test_map_c', 2, 1, 'plain', 'tianmen'),
      tile('test_map_c', -2, 2, 'plain', 'qingqiu'),
      tile('test_map_c', -1, 2, 'plain'),
      tile('test_map_c', 0, 2, 'edge_objective'),
      tile('test_map_c', 1, 2, 'high_ground'),
      tile('test_map_c', 2, 2, 'plain', 'tianmen'),
    ],
  },
};
