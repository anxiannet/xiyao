import type { MapId, SquadId, TerrainId } from '../data/maps';

export type { MapId, SquadId, TerrainId } from '../data/maps';

export type Phase =
  | 'map_preview'
  | 'deployment'
  | 'round_start'
  | 'turn_start'
  | 'unit_action'
  | 'turn_end'
  | 'round_end'
  | 'match_end';

export type Mode = '玩家 vs AI' | 'AI vs AI';
export type UnitStatusId = 'fox_mark' | 'lost' | 'fleeing' | 'route_guided' | 'guarded';
export type TileStatusId = 'foxfire_remnant' | 'inspection_zone';
export type TeamStatusId = 'foxfire_full';
export type GlobalStatusId = 'forbid_movement' | 'martial_law' | 'pursuit';
export type DecreeId = 'forbid_movement' | 'martial_law' | 'pursuit';

export type UnitConfig = {
  id: string;
  name: string;
  squad: SquadId;
  leader: boolean;
  hp: number;
  mv: number;
  atkDice: number;
  defDice: number;
  dmg: number;
  rng: number;
  skillId: string;
  skillName: string;
  initialStatuses: UnitStatusId[];
};

export type UnitState = UnitConfig & {
  maxHp: number;
  ap: number;
  tileId: string | null;
  deployed: boolean;
  defeated: boolean;
  statuses: UnitStatusId[];
  actedThisRound: boolean;
  summon: boolean;
  duration?: number;
};

export type TileState = {
  id: string;
  q: number;
  r: number;
  terrainLayer: TerrainId;
  deploymentOwner?: SquadId;
  objectiveOwner?: SquadId | 'neutral';
  statusLayer: TileStatusId[];
};

export type MatchLogItem = {
  id: string;
  type: string;
  message: string;
  round: number;
  activeSquad: SquadId;
  createdAt: number;
  data?: unknown;
};

export type MatchMetrics = {
  kills: Record<SquadId, number>;
  captures: Record<SquadId, number>;
  skillUses: number;
  statusTriggers: number;
  decreeUses: number;
  firstActor: SquadId;
};

export type AIDecisionRecord = {
  id: string;
  unitId: string;
  unitName: string;
  squad: SquadId;
  candidates: ScoredAction[];
  selected: ScoredAction | null;
  result: string;
  round: number;
};

export type MatchState = {
  id: string;
  mode: Mode;
  mapId: MapId;
  phase: Phase;
  round: number;
  turn: number;
  activeSquad: SquadId;
  playerSquad: SquadId;
  firstActor: SquadId;
  tiles: TileState[];
  units: UnitState[];
  foxfire: number;
  teamStatuses: Record<SquadId, TeamStatusId[]>;
  globalStatuses: GlobalStatusId[];
  activeDecree: DecreeId | null;
  decreeIssuedRound: number | null;
  selectedUnitId: string | null;
  logs: MatchLogItem[];
  aiDecisions: AIDecisionRecord[];
  metrics: MatchMetrics;
  result?: MatchResult;
};

export type MatchResult = {
  winner: SquadId | 'draw';
  reason: string;
  fortune: Record<SquadId, number>;
  rounds: number;
};

export type ActionType = 'move' | 'attack' | 'skill' | 'capture' | 'end_turn';

export type GameAction = {
  id: string;
  type: ActionType;
  unitId: string;
  actor: SquadId;
  targetTileId?: string;
  targetUnitId?: string;
  skillId?: string;
  decreeId?: DecreeId;
  label: string;
};

export type ScoreBreakdown = {
  target: number;
  position: number;
  resource: number;
  status: number;
  objective: number;
  synergy: number;
  kill: number;
  survival: number;
  risk: number;
};

export type ScoredAction = {
  action: GameAction;
  score: number;
  breakdown: ScoreBreakdown;
  notes: string[];
};

export const squads: Record<SquadId, { name: string; mark: string }> = {
  qingqiu: { name: '青丘使团', mark: '狐' },
  tianmen: { name: '天门执法队', mark: '令' },
};

export const terrainName: Record<TerrainId, string> = {
  plain: '普通格',
  central_objective: '中央据点',
  edge_objective: '边缘据点',
  high_ground: '高台',
  cover_shadow: '掩影',
  dusk_rift: '黄昏裂隙',
  obstacle: '障碍',
};

export const terrainIcon: Record<TerrainId, string> = {
  plain: '□',
  central_objective: '坛',
  edge_objective: '碑',
  high_ground: '台',
  cover_shadow: '影',
  dusk_rift: '裂',
  obstacle: '阻',
};

export const unitStatusName: Record<UnitStatusId, string> = {
  fox_mark: '狐印',
  lost: '迷踪',
  fleeing: '逃逸',
  route_guided: '狐火引路',
  guarded: '护阵',
};

export const tileStatusName: Record<TileStatusId, string> = {
  foxfire_remnant: '狐火残留',
  inspection_zone: '勘验区',
};

export const enemyOf = (squad: SquadId): SquadId => (squad === 'qingqiu' ? 'tianmen' : 'qingqiu');

export const addLog = (match: MatchState, type: string, message: string, data?: unknown): MatchState => ({
  ...match,
  logs: [
    {
      id: `${Date.now()}-${match.logs.length}-${type}`,
      type,
      message,
      round: match.round,
      activeSquad: match.activeSquad,
      createdAt: Date.now(),
      data,
    },
    ...match.logs,
  ].slice(0, 240),
});

export const hexDistance = (a: Pick<TileState, 'q' | 'r'>, b: Pick<TileState, 'q' | 'r'>): number => {
  const as = -a.q - a.r;
  const bs = -b.q - b.r;
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(as - bs));
};

export const getTile = (match: MatchState, tileId?: string | null): TileState | undefined =>
  tileId ? match.tiles.find((tile) => tile.id === tileId) : undefined;

export const getUnit = (match: MatchState, unitId?: string | null): UnitState | undefined =>
  unitId ? match.units.find((unit) => unit.id === unitId) : undefined;

export const livingUnits = (match: MatchState, squad?: SquadId): UnitState[] =>
  match.units.filter((unit) => !unit.defeated && !unit.summon && (!squad || unit.squad === squad));

export const occupiedTileIds = (match: MatchState): Set<string> =>
  new Set(match.units.filter((unit) => !unit.defeated && unit.tileId).map((unit) => unit.tileId as string));

export const isTileSuppressed = (tile: TileState): boolean => tile.statusLayer.includes('inspection_zone');

export const hasTileStatusActive = (tile: TileState, status: TileStatusId): boolean =>
  tile.statusLayer.includes(status) && !isTileSuppressed(tile);

export const objectiveTiles = (match: MatchState): TileState[] =>
  match.tiles.filter((tile) => tile.terrainLayer === 'central_objective' || tile.terrainLayer === 'edge_objective');

export const adjacentTiles = (match: MatchState, tileId: string): TileState[] => {
  const origin = getTile(match, tileId);
  if (!origin) return [];
  return match.tiles.filter((tile) => tile.id !== tileId && hexDistance(origin, tile) === 1);
};

export const isEdgeTile = (tile: TileState): boolean => Math.abs(tile.q) === 2 || Math.abs(tile.r) === 2;

export const canActForPhase = (phase: Phase): boolean => phase === 'unit_action';
