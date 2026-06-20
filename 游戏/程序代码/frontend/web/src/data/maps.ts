export type SquadId = 'qingqiu' | 'tianmen';
export type TerrainId =
  | 'plain'
  | 'central_objective'
  | 'edge_objective'
  | 'high_ground'
  | 'cover_shadow'
  | 'dusk_rift'
  | 'obstacle';
export type ObjectiveType = 'central' | 'edge';
export type ObjectiveOwner = SquadId | 'neutral';
export type MapId = 'tutorial_battlefield';

export type MapGridConfig = {
  rows: number;
  cols: number;
  hexWidth: number;
  hexHeight: number;
  offsetX: number;
  offsetY: number;
  gapX: number;
  gapY: number;
  scale?: number;
  viewMode: 'image_overlay';
};

export type MapTileConfig = {
  id: string;
  q: number;
  r: number;
  row: number;
  col: number;
  terrain: TerrainId;
  deploymentOwner: SquadId | null;
  objectiveType: ObjectiveType | null;
  objectiveOwner: ObjectiveOwner | null;
};

export type MapConfig = {
  id: MapId;
  name: string;
  typeNote?: string;
  backgroundImage: string;
  grid: MapGridConfig;
  tiles: MapTileConfig[];
};

const tile = (
  row: number,
  col: number,
  terrain: TerrainId = 'plain',
  deploymentOwner: SquadId | null = null,
  objectiveType: ObjectiveType | null = null,
): MapTileConfig => ({
  id: `${col},${row}`,
  q: col,
  r: row,
  row,
  col,
  terrain,
  deploymentOwner,
  objectiveType,
  objectiveOwner: objectiveType ? 'neutral' : null,
});

const tutorialRows: Array<Array<Pick<MapTileConfig, 'terrain' | 'deploymentOwner' | 'objectiveType'>>> = [
  [
    { terrain: 'obstacle', deploymentOwner: null, objectiveType: null },
    { terrain: 'edge_objective', deploymentOwner: null, objectiveType: 'edge' },
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
    { terrain: 'edge_objective', deploymentOwner: null, objectiveType: 'edge' },
    { terrain: 'obstacle', deploymentOwner: null, objectiveType: null },
  ],
  [
    { terrain: 'plain', deploymentOwner: 'tianmen', objectiveType: null },
    { terrain: 'plain', deploymentOwner: 'tianmen', objectiveType: null },
    { terrain: 'high_ground', deploymentOwner: null, objectiveType: null },
    { terrain: 'plain', deploymentOwner: 'tianmen', objectiveType: null },
    { terrain: 'plain', deploymentOwner: 'tianmen', objectiveType: null },
  ],
  [
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
    { terrain: 'cover_shadow', deploymentOwner: null, objectiveType: null },
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
    { terrain: 'cover_shadow', deploymentOwner: null, objectiveType: null },
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
  ],
  [
    { terrain: 'dusk_rift', deploymentOwner: null, objectiveType: null },
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
    { terrain: 'central_objective', deploymentOwner: null, objectiveType: 'central' },
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
    { terrain: 'dusk_rift', deploymentOwner: null, objectiveType: null },
  ],
  [
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
    { terrain: 'cover_shadow', deploymentOwner: null, objectiveType: null },
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
    { terrain: 'cover_shadow', deploymentOwner: null, objectiveType: null },
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
  ],
  [
    { terrain: 'plain', deploymentOwner: 'qingqiu', objectiveType: null },
    { terrain: 'plain', deploymentOwner: 'qingqiu', objectiveType: null },
    { terrain: 'high_ground', deploymentOwner: null, objectiveType: null },
    { terrain: 'plain', deploymentOwner: 'qingqiu', objectiveType: null },
    { terrain: 'plain', deploymentOwner: 'qingqiu', objectiveType: null },
  ],
  [
    { terrain: 'obstacle', deploymentOwner: null, objectiveType: null },
    { terrain: 'edge_objective', deploymentOwner: null, objectiveType: 'edge' },
    { terrain: 'plain', deploymentOwner: null, objectiveType: null },
    { terrain: 'edge_objective', deploymentOwner: null, objectiveType: 'edge' },
    { terrain: 'obstacle', deploymentOwner: null, objectiveType: null },
  ],
];

const tutorialTiles: MapTileConfig[] = tutorialRows.flatMap((row, rowIndex) =>
  row.map((item, colIndex) => tile(rowIndex, colIndex, item.terrain, item.deploymentOwner, item.objectiveType)),
);

export const mapConfigs: Record<MapId, MapConfig> = {
  tutorial_battlefield: {
    id: 'tutorial_battlefield',
    name: '教学测试战场',
    typeNote: '人工标注地图：背景图由整张图片提供，程序只覆盖网格、单位和状态。',
    backgroundImage: '/maps/tutorial_battlefield.png',
    grid: {
      rows: 7,
      cols: 5,
      hexWidth: 96,
      hexHeight: 84,
      offsetX: 90,
      offsetY: 70,
      gapX: 0,
      gapY: 0,
      scale: 1,
      viewMode: 'image_overlay',
    },
    tiles: tutorialTiles,
  },
};
