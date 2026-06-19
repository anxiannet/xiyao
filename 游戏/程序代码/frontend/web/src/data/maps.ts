export type SquadId = 'qingqiu' | 'tianmen';
export type TerrainId =
  | 'plain'
  | 'central_objective'
  | 'edge_objective'
  | 'high_ground'
  | 'cover_shadow'
  | 'dusk_rift'
  | 'obstacle';
export type MapId = 'tutorial_battlefield';

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

const terrainByCode: Record<string, TerrainId> = {
  P: 'plain',
  CO: 'central_objective',
  EO: 'edge_objective',
  H: 'high_ground',
  S: 'cover_shadow',
  R: 'dusk_rift',
  OB: 'obstacle',
  TP: 'plain',
  QP: 'plain',
};

const layout = [
  ['OB', 'EO', 'P', 'EO', 'OB'],
  ['TP', 'TP', 'H', 'TP', 'TP'],
  ['P', 'S', 'P', 'S', 'P'],
  ['R', 'P', 'CO', 'P', 'R'],
  ['P', 'S', 'P', 'S', 'P'],
  ['QP', 'QP', 'H', 'QP', 'QP'],
  ['OB', 'EO', 'P', 'EO', 'OB'],
] as const;

function deploymentOwner(code: string): SquadId | undefined {
  if (code === 'TP') return 'tianmen';
  if (code === 'QP') return 'qingqiu';
  return undefined;
}

const tutorialTiles: MapTileConfig[] = layout.flatMap((row, r) =>
  row.map((code, q) => ({
    id: `${q},${r}`,
    q,
    r,
    terrain: terrainByCode[code],
    deploymentOwner: deploymentOwner(code),
  })),
);

export const mapConfigs: Record<MapId, MapConfig> = {
  tutorial_battlefield: {
    id: 'tutorial_battlefield',
    name: 'tutorial_battlefield｜青丘对天门正式测试地图',
    typeNote: '5列x7行正式测试图：上方天门阵地、中部中央争夺区、下方青丘阵地；高台为阵地输出位，裂隙为中央两侧律令价值区。',
    tiles: tutorialTiles,
  },
};
