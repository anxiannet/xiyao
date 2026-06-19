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
  ['TP', 'P', 'H', 'P', 'TP'],
  ['TP', 'S', 'P', 'S', 'TP'],
  ['P', 'R', 'CO', 'R', 'P'],
  ['QP', 'S', 'P', 'S', 'QP'],
  ['QP', 'P', 'H', 'P', 'QP'],
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
    typeNote: '5列x7行正式测试图：中央据点为主战场，边缘据点牵引侧翼，黄昏裂隙检验律令价值。',
    tiles: tutorialTiles,
  },
};
