import { getMapConfig } from '../data/mapStorage';
import { type MapId, type SquadId } from '../data/maps';
import { unitConfigs } from '../data/units';
import { addLog, type MatchState, type Mode, type TileState, type UnitState } from './rules';

export function createMatch(mode: Mode, mapId: MapId, playerSquad: SquadId = 'qingqiu'): MatchState {
  const config = getMapConfig(mapId);
  const tiles: TileState[] = config.tiles
    .filter((tile) => !tile.isBackground)
    .map((tile) => ({
      id: tile.id,
      q: tile.q,
      r: tile.r,
      row: tile.row,
      col: tile.col,
      terrainLayer: tile.terrain,
      deploymentOwner: tile.deploymentOwner,
      objectiveType: tile.objectiveType,
      objectiveOwner: tile.objectiveType ? tile.objectiveOwner ?? 'neutral' : undefined,
      statusLayer: [],
    }));
  const units: UnitState[] = unitConfigs.map((unit) => ({
    ...unit,
    maxHp: unit.hp,
    ap: 0,
    tileId: null,
    deployed: false,
    defeated: false,
    statuses: [...unit.initialStatuses],
    actedThisRound: false,
    summon: false,
  }));

  let match: MatchState = {
    id: `${Date.now()}-${mapId}`,
    mode,
    mapId,
    phase: 'map_preview',
    round: 0,
    turn: 0,
    activeSquad: 'qingqiu',
    playerSquad,
    firstActor: 'qingqiu',
    tiles,
    units,
    foxfire: 0,
    teamStatuses: { qingqiu: [], tianmen: [] },
    globalStatuses: [],
    activeDecree: null,
    decreeIssuedRound: null,
    selectedUnitId: null,
    logs: [],
    aiDecisions: [],
    metrics: {
      kills: { qingqiu: 0, tianmen: 0 },
      captures: { qingqiu: 0, tianmen: 0 },
      skillUses: 0,
      statusTriggers: 0,
      decreeUses: 0,
      firstActor: 'qingqiu',
    },
  };
  return addLog(match, 'match_created', `创建对局：${mode} / ${config.name}`);
}
