import React from 'react';
import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { type DecreeId, type GameAction, type MatchState, type SquadId, type TerrainId, type TileState, type UnitState } from '../engine/rules';
import terrainCentralObjectiveNeutralUrl from '../assets/split-terrain/terrain_central_objective_neutral.png';
import terrainCentralObjectiveQingqiuUrl from '../assets/split-terrain/terrain_central_objective_qingqiu.png';
import terrainCentralObjectiveTianmenUrl from '../assets/split-terrain/terrain_central_objective_tianmen.png';
import terrainCoverShadowUrl from '../assets/split-terrain/terrain_cover_shadow.png';
import terrainDuskRiftUrl from '../assets/split-terrain/terrain_dusk_rift_blue.png';
import terrainEdgeObjectiveNeutralUrl from '../assets/split-terrain/terrain_edge_objective_neutral.png';
import terrainEdgeObjectiveQingqiuUrl from '../assets/split-terrain/terrain_edge_objective_qingqiu.png';
import terrainEdgeObjectiveTianmenUrl from '../assets/split-terrain/terrain_edge_objective_tianmen.png';
import terrainHighGroundUrl from '../assets/split-terrain/terrain_high_ground.png';
import terrainObstacleBoulderUrl from '../assets/split-terrain/terrain_obstacle_boulder.png';
import terrainObstacleRuinedWallUrl from '../assets/split-terrain/terrain_obstacle_ruined_wall.png';
import terrainPlainDirtUrl from '../assets/split-terrain/terrain_plain_dirt.png';
import terrainPlainGrassUrl from '../assets/split-terrain/terrain_plain_grass.png';
import terrainPlainStoneUrl from '../assets/split-terrain/terrain_plain_stone.png';
import statusFoxfireRemnantUrl from '../assets/split-terrain/status_foxfire_remnant.png';
import statusInspectionZoneUrl from '../assets/split-terrain/status_inspection_zone.png';
import sulingLeftBackUrl from '../assets/units/suling/suling_left_back.png';
import sulingLeftFrontUrl from '../assets/units/suling/suling_left_front.png';
import sulingLeftSideUrl from '../assets/units/suling/suling_left_side.png';
import sulingRightBackUrl from '../assets/units/suling/suling_right_back.png';
import sulingRightFrontUrl from '../assets/units/suling/suling_right_front.png';
import sulingRightSideUrl from '../assets/units/suling/suling_right_side.png';

type ViewMode = 'battle' | 'tactical';

const GRID_W = 104;
const GRID_H = 86;
const GRID_X_STEP = 84;
const GRID_Y_STEP = 54;

const tileColors: Record<TerrainId, { fill: number; line: number; label: string }> = {
  plain: { fill: 0x6b6f68, line: 0xc9a86a, label: '□' },
  central_objective: { fill: 0xb88a3d, line: 0xffd77a, label: '★' },
  edge_objective: { fill: 0x8a8f86, line: 0xd8d2bf, label: '◎' },
  high_ground: { fill: 0xa99a73, line: 0xf2d79d, label: '▲' },
  cover_shadow: { fill: 0x3a5554, line: 0x75b8ae, label: '▒' },
  dusk_rift: { fill: 0x245f66, line: 0x4fa3a5, label: '裂' },
  obstacle: { fill: 0x1f2329, line: 0x5e5448, label: '■' },
};

const assetUrls = {
  terrainCentralObjectiveNeutral: terrainCentralObjectiveNeutralUrl,
  terrainCentralObjectiveQingqiu: terrainCentralObjectiveQingqiuUrl,
  terrainCentralObjectiveTianmen: terrainCentralObjectiveTianmenUrl,
  terrainCoverShadow: terrainCoverShadowUrl,
  terrainDuskRift: terrainDuskRiftUrl,
  terrainEdgeObjectiveNeutral: terrainEdgeObjectiveNeutralUrl,
  terrainEdgeObjectiveQingqiu: terrainEdgeObjectiveQingqiuUrl,
  terrainEdgeObjectiveTianmen: terrainEdgeObjectiveTianmenUrl,
  terrainHighGround: terrainHighGroundUrl,
  terrainObstacleBoulder: terrainObstacleBoulderUrl,
  terrainObstacleRuinedWall: terrainObstacleRuinedWallUrl,
  terrainPlainDirt: terrainPlainDirtUrl,
  terrainPlainGrass: terrainPlainGrassUrl,
  terrainPlainStone: terrainPlainStoneUrl,
  statusFoxfireRemnant: statusFoxfireRemnantUrl,
  statusInspectionZone: statusInspectionZoneUrl,
  unitSulingLeftBack: sulingLeftBackUrl,
  unitSulingLeftFront: sulingLeftFrontUrl,
  unitSulingLeftSide: sulingLeftSideUrl,
  unitSulingRightBack: sulingRightBackUrl,
  unitSulingRightFront: sulingRightFrontUrl,
  unitSulingRightSide: sulingRightSideUrl,
};

type AssetKey = keyof typeof assetUrls;

const squadColors: Record<SquadId, { fill: number; line: number; mark: string }> = {
  qingqiu: { fill: 0x4fa3a5, line: 0xc9fff6, mark: '青' },
  tianmen: { fill: 0xd8d2bf, line: 0xfff2bd, mark: '天' },
};

const HEX_DRAW_W = 84;
const HEX_DRAW_H = 72;
const TILE_SPRITE_SIZE = 104;
const UNIT_SPRITE_SIZE = 92;

const decreeText: Record<DecreeId, string> = {
  forbid_movement: '禁行令',
  martial_law: '戒严令',
  pursuit: '追捕令',
};

function boundsForTiles(tiles: TileState[]) {
  const points = tiles.map((tile) => gridProject(tile.q, tile.r));
  return {
    minX: Math.min(...points.map((point) => point.x)) - GRID_W,
    maxX: Math.max(...points.map((point) => point.x)) + GRID_W,
    minY: Math.min(...points.map((point) => point.y)) - GRID_H,
    maxY: Math.max(...points.map((point) => point.y)) + GRID_H,
  };
}

function gridProject(q: number, r: number) {
  const centeredQ = q - 2;
  const rowOffset = r % 2 === 0 ? 0 : GRID_X_STEP / 2;
  return {
    x: centeredQ * GRID_X_STEP + rowOffset - GRID_X_STEP / 4,
    y: r * GRID_Y_STEP,
  };
}

function drawHex(graphics: Graphics, fill: number, line: number, alpha = 1) {
  graphics.clear();
  graphics.moveTo(-HEX_DRAW_W / 2, -HEX_DRAW_H / 4);
  graphics.lineTo(0, -HEX_DRAW_H / 2);
  graphics.lineTo(HEX_DRAW_W / 2, -HEX_DRAW_H / 4);
  graphics.lineTo(HEX_DRAW_W / 2, HEX_DRAW_H / 4);
  graphics.lineTo(0, HEX_DRAW_H / 2);
  graphics.lineTo(-HEX_DRAW_W / 2, HEX_DRAW_H / 4);
  graphics.closePath();
  graphics.fill({ color: fill, alpha });
  graphics.stroke({ color: line, width: 2, alpha: 0.92 });
}

function makeText(value: string, size: number, color = 0xffefd2) {
  const text = new Text({
    text: value,
    style: {
      fill: color,
      fontSize: size,
      fontFamily: 'Noto Serif SC, Songti SC, serif',
      fontWeight: '700',
      align: 'center',
    },
  });
  text.anchor.set(0.5);
  return text;
}

function getUnitAt(units: UnitState[], tileId: string) {
  return units.find((unit) => unit.tileId === tileId && !unit.defeated);
}

const plainTerrainAssetKeys = ['terrainPlainGrass', 'terrainPlainDirt', 'terrainPlainStone'] as const;
const obstacleTerrainAssetKeys = ['terrainObstacleBoulder', 'terrainObstacleRuinedWall'] as const;

function stableTileVariant(tile: TileState, count: number) {
  return Math.abs(tile.q * 17 + tile.r * 31) % count;
}

function getTerrainAssetKey(tile: TileState): AssetKey {
  if (tile.terrainLayer === 'plain') return plainTerrainAssetKeys[stableTileVariant(tile, plainTerrainAssetKeys.length)];
  if (tile.terrainLayer === 'high_ground') return 'terrainHighGround';
  if (tile.terrainLayer === 'cover_shadow') return 'terrainCoverShadow';
  if (tile.terrainLayer === 'dusk_rift') return 'terrainDuskRift';
  if (tile.terrainLayer === 'obstacle') return obstacleTerrainAssetKeys[stableTileVariant(tile, obstacleTerrainAssetKeys.length)];
  if (tile.terrainLayer === 'central_objective') {
    if (tile.objectiveOwner === 'qingqiu') return 'terrainCentralObjectiveQingqiu';
    if (tile.objectiveOwner === 'tianmen') return 'terrainCentralObjectiveTianmen';
    return 'terrainCentralObjectiveNeutral';
  }
  if (tile.objectiveOwner === 'qingqiu') return 'terrainEdgeObjectiveQingqiu';
  if (tile.objectiveOwner === 'tianmen') return 'terrainEdgeObjectiveTianmen';
  return 'terrainEdgeObjectiveNeutral';
}

function drawHexPath(graphics: Graphics) {
  graphics.moveTo(-HEX_DRAW_W / 2, -HEX_DRAW_H / 4);
  graphics.lineTo(0, -HEX_DRAW_H / 2);
  graphics.lineTo(HEX_DRAW_W / 2, -HEX_DRAW_H / 4);
  graphics.lineTo(HEX_DRAW_W / 2, HEX_DRAW_H / 4);
  graphics.lineTo(0, HEX_DRAW_H / 2);
  graphics.lineTo(-HEX_DRAW_W / 2, HEX_DRAW_H / 4);
  graphics.closePath();
}

function addMaskedTileSprite(layer: Container, texture: Texture, x: number, y: number, size = TILE_SPRITE_SIZE, alpha = 1) {
  const group = new Container();
  group.position.set(x, y);
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.width = size;
  sprite.height = size;
  sprite.alpha = alpha;
  const mask = new Graphics();
  drawHexPath(mask);
  mask.fill({ color: 0xffffff, alpha: 1 });
  sprite.mask = mask;
  group.addChild(sprite, mask);
  layer.addChild(group);
}

function addCenteredTileSprite(layer: Container, texture: Texture, x: number, y: number, size = TILE_SPRITE_SIZE, alpha = 1) {
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.width = size;
  sprite.height = size;
  sprite.alpha = alpha;
  sprite.position.set(x, y);
  layer.addChild(sprite);
}

function getUnitAssetKey(unit: UnitState): AssetKey | null {
  if (unit.id !== 'suling') return null;
  return 'unitSulingRightBack';
}

export default function BattleBoard({
  match,
  legalActions,
  selectedDeployUnitId,
  locked,
  effect,
  onSelectUnit,
  onDeployTile,
}: {
  match: MatchState;
  legalActions: GameAction[];
  selectedDeployUnitId: string | null;
  locked: boolean;
  effect: DecreeId | null;
  onSelectUnit: (unitId: string | null) => void;
  onDeployTile: (tileId: string) => void;
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const appRef = React.useRef<Application | null>(null);
  const layersRef = React.useRef<Record<'terrain' | 'status' | 'unit' | 'effect', Container> | null>(null);
  const assetTexturesRef = React.useRef<Partial<Record<AssetKey, Texture>>>({});
  const [viewMode, setViewMode] = React.useState<ViewMode>('battle');
  const [ready, setReady] = React.useState(false);

  const moveTargets = React.useMemo(() => new Set(legalActions.filter((action) => action.type === 'move' || action.skillId === 'fox_step').map((action) => action.targetTileId).filter(Boolean) as string[]), [legalActions]);
  const attackTargets = React.useMemo(() => new Set(legalActions.filter((action) => action.type === 'attack' || action.skillId === 'disturb_string').map((action) => action.targetUnitId).filter(Boolean) as string[]), [legalActions]);

  React.useEffect(() => {
    let disposed = false;
    let initialized = false;
    const host = hostRef.current;
    if (!host) return undefined;
    const app = new Application();

    Promise.all([
      app.init({ antialias: true, backgroundAlpha: 0, resizeTo: host }),
      Promise.all(Object.entries(assetUrls).map(async ([key, url]) => [key, await Assets.load<Texture>(url)] as const)),
    ]).then(([, loadedAssets]) => {
      initialized = true;
      if (disposed) {
        app.canvas.remove();
        app.destroy();
        return;
      }
      assetTexturesRef.current = Object.fromEntries(loadedAssets) as Partial<Record<AssetKey, Texture>>;
      host.appendChild(app.canvas);
      const terrain = new Container();
      const status = new Container();
      const unit = new Container();
      const effectLayer = new Container();
      app.stage.addChild(terrain, status, unit, effectLayer);
      appRef.current = app;
      layersRef.current = { terrain, status, unit, effect: effectLayer };
      setReady(true);
    });

    return () => {
      disposed = true;
      setReady(false);
      layersRef.current = null;
      appRef.current = null;
      assetTexturesRef.current = {};
      if (initialized) {
        app.canvas.remove();
        app.destroy();
      }
    };
  }, []);

  React.useEffect(() => {
    const app = appRef.current;
    const layers = layersRef.current;
    if (!app || !layers || !ready) return;
    layers.terrain.removeChildren();
    layers.status.removeChildren();
    layers.unit.removeChildren();

    const bounds = boundsForTiles(match.tiles);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const scale = viewMode === 'battle'
      ? Math.min(app.renderer.width / width, app.renderer.height / height) * 1.18
      : Math.min(app.renderer.width / (width * 0.84), app.renderer.height / (height * 0.84)) * 1.08;
    const offsetX = app.renderer.width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale;
    const offsetY = app.renderer.height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale + (viewMode === 'battle' ? -62 : -34);
    for (const layer of [layers.terrain, layers.status, layers.unit]) {
      layer.scale.set(scale);
      layer.position.set(offsetX, offsetY);
    }

    for (const tile of match.tiles) {
      const { x, y } = gridProject(tile.q, tile.r);
      const tileGraphic = new Graphics();
      const colors = tileColors[tile.terrainLayer];
      const lineColor = tile.deploymentOwner ? squadColors[tile.deploymentOwner].line : colors.line;
      if (tile.terrainLayer === 'plain') {
        drawHex(tileGraphic, colors.fill, lineColor, 0.01);
        tileGraphic.alpha = tile.deploymentOwner ? 0.42 : 0.18;
      } else {
        drawHex(tileGraphic, colors.fill, lineColor);
      }
      tileGraphic.position.set(x, y);
      tileGraphic.eventMode = locked ? 'none' : 'static';
      tileGraphic.cursor = locked ? 'default' : 'pointer';
      tileGraphic.on('pointertap', () => {
        if (locked) return;
        const unit = getUnitAt(match.units, tile.id);
        const selectedDeployUnit = match.units.find((item) => item.id === selectedDeployUnitId);
        const canDeploy = match.phase === 'deployment' && selectedDeployUnit && tile.deploymentOwner === selectedDeployUnit.squad && !unit && tile.terrainLayer !== 'obstacle';
        if (canDeploy) onDeployTile(tile.id);
        else onSelectUnit(unit?.id ?? null);
      });
      layers.terrain.addChild(tileGraphic);

      const terrainTexture = assetTexturesRef.current[getTerrainAssetKey(tile)];
      if (terrainTexture) {
        addMaskedTileSprite(layers.terrain, terrainTexture, x, y);
        const rim = new Graphics();
        drawHex(rim, 0x000000, colors.line, 0);
        rim.position.set(x, y);
        layers.terrain.addChild(rim);
      }

      if (tile.objectiveOwner && tile.objectiveOwner !== 'neutral') {
        const owner = makeText(tile.objectiveOwner === 'qingqiu' ? '狐' : '令', 12, 0xffe7a8);
        owner.position.set(x, y - 21);
        layers.status.addChild(owner);
      }

      if (moveTargets.has(tile.id)) {
        const halo = new Graphics();
        drawHex(halo, 0x4fa3a5, 0xc9fff6, 0.26);
        halo.position.set(x, y);
        layers.status.addChild(halo);
      }

      if (tile.statusLayer.includes('foxfire_remnant')) {
        const statusTexture = assetTexturesRef.current.statusFoxfireRemnant;
        if (statusTexture) addCenteredTileSprite(layers.status, statusTexture, x, y, TILE_SPRITE_SIZE * 0.82, 0.82);
      }
      if (tile.statusLayer.includes('inspection_zone')) {
        const statusTexture = assetTexturesRef.current.statusInspectionZone;
        if (statusTexture) addCenteredTileSprite(layers.status, statusTexture, x, y, TILE_SPRITE_SIZE * 0.82, 0.82);
      }
    }

    for (const unit of match.units.filter((item) => item.tileId && !item.defeated)) {
      const tile = match.tiles.find((item) => item.id === unit.tileId);
      if (!tile) continue;
      const point = gridProject(tile.q, tile.r);
      const group = new Container();
      group.position.set(point.x, point.y - 20);
      group.eventMode = locked ? 'none' : 'static';
      group.cursor = locked ? 'default' : 'pointer';
      group.on('pointertap', () => {
        if (!locked) onSelectUnit(unit.id);
      });
      const unitAssetKey = getUnitAssetKey(unit);
      const unitTexture = unitAssetKey ? assetTexturesRef.current[unitAssetKey] : null;
      if (unitTexture) {
        const halo = new Graphics();
        halo.ellipse(0, 16, 21, 9);
        halo.fill({ color: unit.squad === 'qingqiu' ? 0x4fa3a5 : 0xd8d2bf, alpha: match.selectedUnitId === unit.id ? 0.42 : 0.22 });
        halo.stroke({ color: attackTargets.has(unit.id) ? 0xb85a3c : squadColors[unit.squad].line, width: match.selectedUnitId === unit.id ? 3 : 1, alpha: 0.9 });
        group.addChild(halo);
        const sprite = new Sprite(unitTexture);
        sprite.anchor.set(0.5, 0.82);
        sprite.width = UNIT_SPRITE_SIZE;
        sprite.height = UNIT_SPRITE_SIZE;
        sprite.position.set(0, 18);
        group.addChild(sprite);
      } else {
        const disc = new Graphics();
        const squad = squadColors[unit.squad];
        disc.circle(0, 0, unit.summon ? 12 : 16);
        disc.fill({ color: squad.fill, alpha: unit.summon ? 0.72 : 0.96 });
        disc.stroke({ color: attackTargets.has(unit.id) ? 0xb85a3c : squad.line, width: match.selectedUnitId === unit.id ? 4 : 2 });
        group.addChild(disc);
        const initial = makeText(unit.name.slice(0, 1), 17, unit.squad === 'tianmen' ? 0x232323 : 0x062226);
        group.addChild(initial);
      }
      const hp = makeText(`${unit.hp}`, 9, 0xffffff);
      hp.position.set(unitTexture ? 20 : 14, unitTexture ? 20 : 14);
      group.addChild(hp);
      layers.unit.addChild(group);
    }
  }, [attackTargets, legalActions, locked, match, moveTargets, onDeployTile, onSelectUnit, ready, selectedDeployUnitId, viewMode]);

  React.useEffect(() => {
    const app = appRef.current;
    const layer = layersRef.current?.effect;
    if (!app || !layer || !effect || !ready) return undefined;
    layer.removeChildren();
    const veil = new Graphics();
    const color = effect === 'forbid_movement' ? 0x17120c : effect === 'martial_law' ? 0xc9a86a : 0x2a313b;
    veil.rect(0, 0, app.renderer.width, app.renderer.height);
    veil.fill({ color, alpha: effect === 'martial_law' ? 0.22 : 0.48 });
    layer.addChild(veil);
    const ring = new Graphics();
    ring.position.set(app.renderer.width / 2, app.renderer.height / 2);
    ring.circle(0, 0, Math.min(app.renderer.width, app.renderer.height) * 0.24);
    ring.stroke({ color: effect === 'pursuit' ? 0xd8d2bf : 0xc9a86a, width: 6, alpha: 0.92 });
    if (effect === 'pursuit') {
      for (let i = -3; i <= 3; i += 1) {
        ring.moveTo(-160, i * 24);
        ring.lineTo(160, i * 24 + 40);
      }
      ring.stroke({ color: 0xd8d2bf, width: 3, alpha: 0.72 });
    }
    layer.addChild(ring);
    const text = makeText(decreeText[effect], 42, effect === 'forbid_movement' ? 0xf4d37e : 0xffffff);
    text.position.set(app.renderer.width / 2, app.renderer.height / 2);
    layer.addChild(text);
    const timeout = window.setTimeout(() => layer.removeChildren(), 1000);
    return () => window.clearTimeout(timeout);
  }, [effect, ready]);

  return (
    <section className={`map pixiMap ${locked ? 'locked' : ''}`}>
      <div className="viewSwitch">
        <button className={viewMode === 'battle' ? 'active' : ''} onClick={() => setViewMode('battle')}>⚔ 战斗视角</button>
        <button className={viewMode === 'tactical' ? 'active' : ''} onClick={() => setViewMode('tactical')}>🗺 战术视角</button>
      </div>
      <div className="pixiHost" ref={hostRef} />
    </section>
  );
}
