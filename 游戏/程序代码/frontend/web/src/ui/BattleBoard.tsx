import React from 'react';
import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { getMapConfig } from '../data/mapStorage';
import { type DecreeId, type GameAction, type MatchState, type ObjectiveType, type SquadId, type TerrainId, type TileState, type UnitState } from '../engine/rules';
import statusFoxfireRemnantUrl from '../assets/split-terrain/status_foxfire_remnant.png';
import statusInspectionZoneUrl from '../assets/split-terrain/status_inspection_zone.png';
import type { SelectedActionMode } from './ActionPanel';
import sulingLeftBackUrl from '../assets/units/suling/suling_left_back.png';
import sulingLeftFrontUrl from '../assets/units/suling/suling_left_front.png';
import sulingLeftSideUrl from '../assets/units/suling/suling_left_side.png';
import sulingRightBackUrl from '../assets/units/suling/suling_right_back.png';
import sulingRightFrontUrl from '../assets/units/suling/suling_right_front.png';
import sulingRightSideUrl from '../assets/units/suling/suling_right_side.png';

type ViewMode = 'battle' | 'tactical';

const assetUrls = {
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

const terrainMarks: Record<TerrainId, { line: number; mark: string }> = {
  plain: { line: 0xc9a86a, mark: '' },
  central_objective: { line: 0xffd77a, mark: '坛' },
  edge_objective: { line: 0xd8d2bf, mark: '碑' },
  high_ground: { line: 0xf2d79d, mark: '台' },
  cover_shadow: { line: 0x75b8ae, mark: '影' },
  dusk_rift: { line: 0x4fa3a5, mark: '裂' },
  obstacle: { line: 0x5e5448, mark: '阻' },
};

const objectiveMarks: Record<ObjectiveType, string> = {
  central: '中',
  edge: '边',
};

const UNIT_SPRITE_SIZE = 92;

const decreeText: Record<DecreeId, string> = {
  forbid_movement: '禁行令',
  martial_law: '戒严令',
  pursuit: '追捕令',
};

function getTileCenter(tile: TileState, match: MatchState) {
  const config = getMapConfig(match.mapId);
  const { grid } = config;
  const scale = grid.scale ?? 1;
  const stepX = grid.hexWidth * 0.75 + grid.gapX;
  const stepY = grid.hexHeight * 0.75 + grid.gapY;
  const rowOffset = tile.row % 2 === 0 ? 0 : stepX / 2;
  return {
    x: (grid.offsetX + rowOffset + tile.col * stepX + grid.hexWidth / 2) * scale,
    y: (grid.offsetY + tile.row * stepY + grid.hexHeight / 2) * scale,
  };
}

function getMapSize(match: MatchState) {
  const { grid } = getMapConfig(match.mapId);
  const scale = grid.scale ?? 1;
  const stepX = grid.hexWidth * 0.75 + grid.gapX;
  const stepY = grid.hexHeight * 0.75 + grid.gapY;
  return {
    width: (grid.offsetX * 2 + grid.cols * stepX + grid.hexWidth) * scale,
    height: (grid.offsetY * 2 + grid.rows * stepY + grid.hexHeight) * scale,
  };
}

function drawHexPath(graphics: Graphics, width: number, height: number) {
  graphics.moveTo(-width / 2, -height / 4);
  graphics.lineTo(0, -height / 2);
  graphics.lineTo(width / 2, -height / 4);
  graphics.lineTo(width / 2, height / 4);
  graphics.lineTo(0, height / 2);
  graphics.lineTo(-width / 2, height / 4);
  graphics.closePath();
}

function drawHex(graphics: Graphics, tile: TileState, match: MatchState, alpha = 0.14) {
  const { grid } = getMapConfig(match.mapId);
  const width = grid.hexWidth * (grid.scale ?? 1);
  const height = grid.hexHeight * (grid.scale ?? 1);
  const terrain = terrainMarks[tile.terrainLayer];
  const line = tile.deploymentOwner ? squadColors[tile.deploymentOwner].line : terrain.line;
  graphics.clear();
  drawHexPath(graphics, width, height);
  graphics.fill({ color: tile.terrainLayer === 'obstacle' ? 0x101318 : 0x000000, alpha: tile.terrainLayer === 'obstacle' ? 0.32 : alpha });
  graphics.stroke({ color: line, width: tile.objectiveType ? 3 : 1.6, alpha: tile.objectiveType ? 0.98 : 0.72 });
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
      stroke: { color: 0x111111, width: 3 },
    },
  });
  text.anchor.set(0.5);
  return text;
}

function getUnitAt(units: UnitState[], tileId: string) {
  return units.find((unit) => unit.tileId === tileId && !unit.defeated);
}

function addCenteredSprite(layer: Container, texture: Texture, x: number, y: number, size: number, alpha = 1) {
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
  selectedActionMode,
  selectedDeployUnitId,
  locked,
  effect,
  onAction,
  onInvalidTarget,
  onSelectUnit,
  onDeployTile,
}: {
  match: MatchState;
  legalActions: GameAction[];
  selectedActionMode: SelectedActionMode | null;
  selectedDeployUnitId: string | null;
  locked: boolean;
  effect: DecreeId | null;
  onAction: (action: GameAction) => void;
  onInvalidTarget: () => void;
  onSelectUnit: (unitId: string | null) => void;
  onDeployTile: (tileId: string) => void;
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const appRef = React.useRef<Application | null>(null);
  const layersRef = React.useRef<Record<'background' | 'grid' | 'status' | 'unit' | 'effect', Container> | null>(null);
  const assetTexturesRef = React.useRef<Partial<Record<AssetKey, Texture>>>({});
  const backgroundTextureRef = React.useRef<Texture | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('battle');
  const [ready, setReady] = React.useState(false);
  const [backgroundVersion, setBackgroundVersion] = React.useState(0);
  const mapConfig = React.useMemo(() => getMapConfig(match.mapId), [match.mapId]);

  const moveTargets = React.useMemo(() => new Set(
    selectedActionMode === 'move'
      ? legalActions.filter((action) => action.type === 'move').map((action) => action.targetTileId).filter(Boolean) as string[]
      : [],
  ), [legalActions, selectedActionMode]);
  const attackTargets = React.useMemo(() => new Set(
    selectedActionMode === 'attack'
      ? legalActions.filter((action) => action.type === 'attack').map((action) => action.targetUnitId).filter(Boolean) as string[]
      : [],
  ), [legalActions, selectedActionMode]);
  const skillTileTargets = React.useMemo(() => new Set(
    selectedActionMode === 'skill'
      ? legalActions.filter((action) => action.type === 'skill').map((action) => action.targetTileId).filter(Boolean) as string[]
      : [],
  ), [legalActions, selectedActionMode]);
  const skillUnitTargets = React.useMemo(() => new Set(
    selectedActionMode === 'skill'
      ? legalActions.filter((action) => action.type === 'skill').map((action) => action.targetUnitId).filter(Boolean) as string[]
      : [],
  ), [legalActions, selectedActionMode]);

  const handleBoardTarget = React.useCallback((tile: TileState, unit: UnitState | undefined) => {
    if (selectedActionMode === 'move') {
      const action = legalActions.find((item) => item.type === 'move' && item.targetTileId === tile.id);
      if (action) onAction(action);
      else onInvalidTarget();
      return true;
    }
    if (selectedActionMode === 'attack') {
      const action = unit ? legalActions.find((item) => item.type === 'attack' && item.targetUnitId === unit.id) : undefined;
      if (action) onAction(action);
      else onInvalidTarget();
      return true;
    }
    if (selectedActionMode === 'skill') {
      const action = legalActions.find((item) => item.type === 'skill' && ((unit && item.targetUnitId === unit.id) || item.targetTileId === tile.id));
      if (action) onAction(action);
      else onInvalidTarget();
      return true;
    }
    return false;
  }, [legalActions, onAction, onInvalidTarget, selectedActionMode]);

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
      const background = new Container();
      const grid = new Container();
      const status = new Container();
      const unit = new Container();
      const effectLayer = new Container();
      app.stage.addChild(background, grid, status, unit, effectLayer);
      appRef.current = app;
      layersRef.current = { background, grid, status, unit, effect: effectLayer };
      setReady(true);
    });

    return () => {
      disposed = true;
      setReady(false);
      layersRef.current = null;
      appRef.current = null;
      assetTexturesRef.current = {};
      backgroundTextureRef.current = null;
      if (initialized) {
        app.canvas.remove();
        app.destroy();
      }
    };
  }, []);

  React.useEffect(() => {
    let disposed = false;
    backgroundTextureRef.current = null;
    if (!mapConfig.backgroundImage) return undefined;
    Assets.load<Texture>(mapConfig.backgroundImage)
      .then((texture) => {
        if (!disposed) backgroundTextureRef.current = texture;
        if (!disposed) setBackgroundVersion((current) => current + 1);
      })
      .catch(() => {
        if (!disposed) backgroundTextureRef.current = null;
        if (!disposed) setBackgroundVersion((current) => current + 1);
      });
    return () => {
      disposed = true;
    };
  }, [mapConfig.backgroundImage]);

  React.useEffect(() => {
    const app = appRef.current;
    const layers = layersRef.current;
    if (!app || !layers || !ready) return;
    layers.background.removeChildren();
    layers.grid.removeChildren();
    layers.status.removeChildren();
    layers.unit.removeChildren();

    const mapSize = getMapSize(match);
    const backgroundTexture = backgroundTextureRef.current;
    if (backgroundTexture) {
      const sprite = new Sprite(backgroundTexture);
      sprite.width = mapSize.width;
      sprite.height = mapSize.height;
      layers.background.addChild(sprite);
    } else {
      const fallback = new Graphics();
      fallback.rect(0, 0, mapSize.width, mapSize.height);
      fallback.fill({ color: 0x18202a, alpha: 1 });
      layers.background.addChild(fallback);
      const label = makeText('缺少地图背景图', 22, 0xc9a86a);
      label.position.set(mapSize.width / 2, mapSize.height / 2);
      layers.background.addChild(label);
    }

    const scale = viewMode === 'battle'
      ? Math.min(app.renderer.width / mapSize.width, app.renderer.height / mapSize.height) * 0.98
      : Math.min(app.renderer.width / mapSize.width, app.renderer.height / mapSize.height) * 0.88;
    const offsetX = app.renderer.width / 2 - (mapSize.width / 2) * scale;
    const offsetY = app.renderer.height / 2 - (mapSize.height / 2) * scale + (viewMode === 'battle' ? -18 : 0);
    for (const layer of [layers.background, layers.grid, layers.status, layers.unit]) {
      layer.scale.set(scale);
      layer.position.set(offsetX, offsetY);
    }

    for (const tile of match.tiles) {
      const { x, y } = getTileCenter(tile, match);
      const tileGraphic = new Graphics();
      drawHex(tileGraphic, tile, match);
      tileGraphic.position.set(x, y);
      tileGraphic.eventMode = locked ? 'none' : 'static';
      tileGraphic.cursor = locked ? 'default' : 'pointer';
      tileGraphic.on('pointertap', () => {
        if (locked) return;
        const unit = getUnitAt(match.units, tile.id);
        if (handleBoardTarget(tile, unit)) return;
        const selectedDeployUnit = match.units.find((item) => item.id === selectedDeployUnitId);
        const canDeploy = match.phase === 'deployment' && selectedDeployUnit && tile.deploymentOwner === selectedDeployUnit.squad && !unit && tile.terrainLayer !== 'obstacle';
        if (canDeploy) onDeployTile(tile.id);
        else onSelectUnit(unit?.id ?? null);
      });
      layers.grid.addChild(tileGraphic);

      const coord = makeText(`${tile.col},${tile.row}`, 10, 0xf4e6c5);
      coord.position.set(x, y - 10);
      coord.alpha = 0.72;
      layers.status.addChild(coord);

      const terrainMark = terrainMarks[tile.terrainLayer].mark;
      if (terrainMark) {
        const mark = makeText(terrainMark, 13, terrainMarks[tile.terrainLayer].line);
        mark.position.set(x - 16, y + 12);
        layers.status.addChild(mark);
      }
      if (tile.deploymentOwner) {
        const deploy = makeText(squadColors[tile.deploymentOwner].mark, 13, squadColors[tile.deploymentOwner].line);
        deploy.position.set(x + 17, y + 12);
        layers.status.addChild(deploy);
      }
      if (tile.objectiveType) {
        const objective = makeText(objectiveMarks[tile.objectiveType], 14, 0xffe08a);
        objective.position.set(x, y + 22);
        layers.status.addChild(objective);
      }
      if (tile.objectiveOwner && tile.objectiveOwner !== 'neutral') {
        const owner = makeText(tile.objectiveOwner === 'qingqiu' ? '狐' : '令', 12, 0xffe7a8);
        owner.position.set(x, y - 25);
        layers.status.addChild(owner);
      }

      if (moveTargets.has(tile.id) || skillTileTargets.has(tile.id)) {
        const halo = new Graphics();
        drawHex(halo, tile, match, 0.26);
        halo.position.set(x, y);
        halo.tint = moveTargets.has(tile.id) ? 0x4fa3a5 : 0xffd77a;
        layers.status.addChild(halo);
      }

      const statusSize = Math.max(mapConfig.grid.hexWidth, mapConfig.grid.hexHeight) * 0.72;
      if (tile.statusLayer.includes('foxfire_remnant')) {
        const statusTexture = assetTexturesRef.current.statusFoxfireRemnant;
        if (statusTexture) addCenteredSprite(layers.status, statusTexture, x, y, statusSize, 0.82);
      }
      if (tile.statusLayer.includes('inspection_zone')) {
        const statusTexture = assetTexturesRef.current.statusInspectionZone;
        if (statusTexture) addCenteredSprite(layers.status, statusTexture, x, y, statusSize, 0.82);
      }
    }

    for (const unit of match.units.filter((item) => item.tileId && !item.defeated)) {
      const tile = match.tiles.find((item) => item.id === unit.tileId);
      if (!tile) continue;
      const point = getTileCenter(tile, match);
      const group = new Container();
      group.position.set(point.x, point.y - 20);
      group.eventMode = locked ? 'none' : 'static';
      group.cursor = locked ? 'default' : 'pointer';
      group.on('pointertap', (event) => {
        event.stopPropagation();
        if (locked) return;
        if (handleBoardTarget(tile, unit)) return;
        onSelectUnit(unit.id);
      });
      const unitAssetKey = getUnitAssetKey(unit);
      const unitTexture = unitAssetKey ? assetTexturesRef.current[unitAssetKey] : null;
      if (unitTexture) {
        const halo = new Graphics();
        halo.ellipse(0, 16, 21, 9);
        halo.fill({ color: unit.squad === 'qingqiu' ? 0x4fa3a5 : 0xd8d2bf, alpha: match.selectedUnitId === unit.id ? 0.42 : 0.22 });
        halo.stroke({ color: attackTargets.has(unit.id) || skillUnitTargets.has(unit.id) ? 0xb85a3c : squadColors[unit.squad].line, width: match.selectedUnitId === unit.id ? 3 : 1, alpha: 0.9 });
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
        disc.stroke({ color: attackTargets.has(unit.id) || skillUnitTargets.has(unit.id) ? 0xb85a3c : squad.line, width: match.selectedUnitId === unit.id ? 4 : 2 });
        group.addChild(disc);
        const initial = makeText(unit.name.slice(0, 1), 17, unit.squad === 'tianmen' ? 0x232323 : 0x062226);
        group.addChild(initial);
      }
      const hp = makeText(`${unit.hp}`, 9, 0xffffff);
      hp.position.set(unitTexture ? 20 : 14, unitTexture ? 20 : 14);
      group.addChild(hp);
      layers.unit.addChild(group);
    }
  }, [attackTargets, backgroundVersion, handleBoardTarget, locked, mapConfig.grid.hexHeight, mapConfig.grid.hexWidth, mapConfig.backgroundImage, match, moveTargets, onDeployTile, onSelectUnit, ready, selectedDeployUnitId, skillTileTargets, skillUnitTargets, viewMode]);

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
        <button className={viewMode === 'battle' ? 'active' : ''} onClick={() => setViewMode('battle')}>战斗视角</button>
        <button className={viewMode === 'tactical' ? 'active' : ''} onClick={() => setViewMode('tactical')}>战术视角</button>
      </div>
      <div className="pixiHost" ref={hostRef} />
    </section>
  );
}
