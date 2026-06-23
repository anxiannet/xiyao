import React from 'react';
import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { getMapConfig } from '../data/mapStorage';
import { type DecreeId, type GameAction, type MatchState, type ObjectiveType, type SquadId, type TerrainId, type TileState, type UnitState } from '../engine/rules';
import type { SelectedActionMode } from './ActionPanel';
import { decreeOverlayAssetPaths, getUnitAssetPath, tileStatusAssetPaths, unitAssetPaths, unitStatusAssetPaths } from './assets';

type ViewMode = 'battle' | 'tactical';

const assetUrls = {
  ...unitAssetPaths,
  ...tileStatusAssetPaths,
  ...unitStatusAssetPaths,
  ...decreeOverlayAssetPaths,
};

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

const UNIT_SPRITE_SIZE = 200;
const REGULAR_HEX_HEIGHT_RATIO = Math.sqrt(3) / 2;
const GRID_ROTATION_RAD = Math.PI / 6;

const decreeText: Record<DecreeId, string> = {
  forbid_movement: '禁行令',
  martial_law: '戒严令',
  pursuit: '追捕令',
};

function getTileCenter(tile: TileState, match: MatchState) {
  const config = getMapConfig(match.mapId);
  const { grid } = config;
  const scale = grid.scale ?? 1;
  const bounds = getRotatedHexBounds(grid.hexWidth);
  const stepX = bounds.width + grid.gapX;
  const stepY = bounds.height * 0.75 + grid.gapY;
  const rowOffset = tile.row % 2 === 0 ? 0 : stepX / 2;
  return {
    x: (grid.offsetX + rowOffset + tile.col * stepX + bounds.width / 2) * scale,
    y: (grid.offsetY + tile.row * stepY + bounds.height / 2) * scale,
  };
}

function getMapSize(match: MatchState) {
  const { grid } = getMapConfig(match.mapId);
  const scale = grid.scale ?? 1;
  const bounds = getRotatedHexBounds(grid.hexWidth);
  const stepX = bounds.width + grid.gapX;
  const stepY = bounds.height * 0.75 + grid.gapY;
  return {
    width: (grid.offsetX + (grid.cols - 1) * stepX + stepX / 2 + bounds.width) * scale,
    height: (grid.offsetY + (grid.rows - 1) * stepY + bounds.height) * scale,
  };
}

function getRenderSize(match: MatchState, backgroundTexture: Texture | null) {
  if (backgroundTexture) {
    return {
      width: backgroundTexture.width,
      height: backgroundTexture.height,
    };
  }
  return getMapSize(match);
}

function getRegularHexHeight(hexWidth: number) {
  return hexWidth * REGULAR_HEX_HEIGHT_RATIO;
}

function getRotatedHexBounds(hexWidth: number) {
  return {
    width: getRegularHexHeight(hexWidth),
    height: hexWidth,
  };
}

function rotatePoint(x: number, y: number) {
  const cos = Math.cos(GRID_ROTATION_RAD);
  const sin = Math.sin(GRID_ROTATION_RAD);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function drawHexPath(graphics: Graphics, width: number, height: number) {
  const points = [
    rotatePoint(-width / 4, -height / 2),
    rotatePoint(width / 4, -height / 2),
    rotatePoint(width / 2, 0),
    rotatePoint(width / 4, height / 2),
    rotatePoint(-width / 4, height / 2),
    rotatePoint(-width / 2, 0),
  ];
  graphics.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    graphics.lineTo(point.x, point.y);
  }
  graphics.closePath();
}

function drawHex(graphics: Graphics, tile: TileState, match: MatchState, alpha = 0.14) {
  const { grid } = getMapConfig(match.mapId);
  const width = grid.hexWidth * (grid.scale ?? 1);
  const height = getRegularHexHeight(grid.hexWidth) * (grid.scale ?? 1);
  graphics.clear();
  drawHexPath(graphics, width, height);
  graphics.fill({ color: tile.terrainLayer === 'obstacle' ? 0x101318 : 0x000000, alpha: tile.terrainLayer === 'obstacle' ? 0.2 : Math.min(alpha, 0.04) });
  graphics.stroke({ color: 0xffffff, width: 3, alpha: 0.98 });
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
  const assetTexturesRef = React.useRef<Record<string, Texture>>({});
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
      if (unit) {
        onSelectUnit(unit.id);
        return true;
      }
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
  }, [legalActions, onAction, onInvalidTarget, onSelectUnit, selectedActionMode]);

  React.useEffect(() => {
    let disposed = false;
    let initialized = false;
    const host = hostRef.current;
    if (!host) return undefined;
    const app = new Application();

    Promise.all([
      app.init({ antialias: true, autoDensity: true, backgroundAlpha: 0, resolution: window.devicePixelRatio || 1, resizeTo: host }),
      Promise.all(Object.entries(assetUrls).map(async ([key, url]) => [key, await Assets.load<Texture>(url)] as const)),
    ]).then(([, loadedAssets]) => {
      initialized = true;
      if (disposed) {
        app.canvas.remove();
        app.destroy();
        return;
      }
      assetTexturesRef.current = Object.fromEntries(loadedAssets);
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

    const backgroundTexture = backgroundTextureRef.current;
    const mapSize = getRenderSize(match, backgroundTexture);
    layers.background.scale.set(1);
    layers.background.position.set(0, 0);
    const battlefieldBg = new Graphics();
    battlefieldBg.rect(0, 0, mapSize.width, mapSize.height);
    battlefieldBg.fill({ color: 0x142421, alpha: 0.96 });
    layers.background.addChild(battlefieldBg);

    const widthScale = app.renderer.width / mapSize.width;
    const fitScale = Math.min(widthScale, app.renderer.height / mapSize.height);
    const scale = viewMode === 'battle' ? widthScale : fitScale * 0.88;
    const offsetX = viewMode === 'battle' ? 0 : app.renderer.width / 2 - (mapSize.width / 2) * scale;
    const offsetY = app.renderer.height / 2 - (mapSize.height / 2) * scale;

    if (backgroundTexture) {
      const sprite = new Sprite(backgroundTexture);
      sprite.width = mapSize.width;
      sprite.height = mapSize.height;
      layers.background.addChild(sprite);
    }

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
        drawHex(halo, tile, match, 0.36);
        halo.position.set(x, y);
        halo.tint = moveTargets.has(tile.id) ? 0x4fa3a5 : 0xffd77a;
        layers.status.addChild(halo);
      }

      const statusSize = Math.max(mapConfig.grid.hexWidth, mapConfig.grid.hexHeight) * 0.72;
      if (tile.statusLayer.includes('foxfire_remnant')) {
        const statusTexture = assetTexturesRef.current.foxfire_remnant;
        if (statusTexture) addCenteredSprite(layers.status, statusTexture, x, y, statusSize, 0.82);
      }
      if (tile.statusLayer.includes('inspection_zone')) {
        const statusTexture = assetTexturesRef.current.inspection_zone;
        if (statusTexture) addCenteredSprite(layers.status, statusTexture, x, y, statusSize, 0.82);
      }
    }

    for (const unit of match.units.filter((item) => item.tileId && !item.defeated)) {
      const tile = match.tiles.find((item) => item.id === unit.tileId);
      if (!tile) continue;
      const point = getTileCenter(tile, match);
      const group = new Container();
      group.position.set(point.x, point.y - 28);
      group.eventMode = locked ? 'none' : 'static';
      group.cursor = locked ? 'default' : 'pointer';
      group.on('pointertap', (event) => {
        event.stopPropagation();
        if (locked) return;
        if (handleBoardTarget(tile, unit)) return;
        onSelectUnit(unit.id);
      });
      const unitAssetPath = getUnitAssetPath(unit);
      const unitTexture = unitAssetPath ? assetTexturesRef.current[unit.id] ?? (unit.summon ? assetTexturesRef.current.azhao : null) : null;
      if (unitTexture) {
        const halo = new Graphics();
        halo.ellipse(0, 28, 40, 14);
        halo.fill({ color: unit.squad === 'qingqiu' ? 0x4fa3a5 : 0xd8d2bf, alpha: match.selectedUnitId === unit.id ? 0.42 : 0.22 });
        halo.stroke({ color: attackTargets.has(unit.id) || skillUnitTargets.has(unit.id) ? 0xff7652 : squadColors[unit.squad].line, width: attackTargets.has(unit.id) || skillUnitTargets.has(unit.id) ? 3.4 : match.selectedUnitId === unit.id ? 3 : 1.4, alpha: 0.96 });
        group.addChild(halo);
        const sprite = new Sprite(unitTexture);
        sprite.anchor.set(0.5, 0.82);
        sprite.width = unit.summon ? UNIT_SPRITE_SIZE * 0.76 : UNIT_SPRITE_SIZE;
        sprite.height = unit.summon ? UNIT_SPRITE_SIZE * 0.76 : UNIT_SPRITE_SIZE;
        sprite.position.set(0, 34);
        group.addChild(sprite);
      } else {
        const disc = new Graphics();
        const squad = squadColors[unit.squad];
        disc.circle(0, 0, unit.summon ? 12 : 16);
        disc.fill({ color: squad.fill, alpha: unit.summon ? 0.72 : 0.96 });
        disc.stroke({ color: attackTargets.has(unit.id) || skillUnitTargets.has(unit.id) ? 0xff7652 : squad.line, width: attackTargets.has(unit.id) || skillUnitTargets.has(unit.id) ? 4.2 : match.selectedUnitId === unit.id ? 4 : 2.2 });
        group.addChild(disc);
        const initial = makeText(unit.name.slice(0, 1), 17, unit.squad === 'tianmen' ? 0x232323 : 0x062226);
        group.addChild(initial);
      }
      const hp = makeText(`${unit.hp}`, unitTexture ? 12 : 9, 0xffffff);
      hp.position.set(unitTexture ? 42 : 14, unitTexture ? 42 : 14);
      group.addChild(hp);
      const unitStatusSize = unitTexture ? 26 : 18;
      unit.statuses.forEach((status, index) => {
        const statusTexture = assetTexturesRef.current[status];
        if (!statusTexture) return;
        const statusSprite = new Sprite(statusTexture);
        statusSprite.anchor.set(0.5);
        statusSprite.width = unitStatusSize;
        statusSprite.height = unitStatusSize;
        statusSprite.position.set(-42 + index * (unitStatusSize + 2), 38);
        group.addChild(statusSprite);
      });
      layers.unit.addChild(group);
    }
  }, [attackTargets, backgroundVersion, handleBoardTarget, locked, mapConfig.grid.hexHeight, mapConfig.grid.hexWidth, mapConfig.backgroundImage, match, moveTargets, onDeployTile, onSelectUnit, ready, selectedDeployUnitId, skillTileTargets, skillUnitTargets, viewMode]);

  React.useEffect(() => {
    const app = appRef.current;
    const layer = layersRef.current?.effect;
    if (!app || !layer || !effect || !ready) return undefined;
    layer.removeChildren();
    const overlayTexture = assetTexturesRef.current[effect];
    if (overlayTexture) {
      const overlay = new Sprite(overlayTexture);
      overlay.width = app.renderer.width;
      overlay.height = app.renderer.height;
      overlay.alpha = 0.82;
      layer.addChild(overlay);
    }
    const veil = new Graphics();
    const color = effect === 'forbid_movement' ? 0x17120c : effect === 'martial_law' ? 0xc9a86a : 0x2a313b;
    veil.rect(0, 0, app.renderer.width, app.renderer.height);
    veil.fill({ color, alpha: overlayTexture ? 0.16 : effect === 'martial_law' ? 0.22 : 0.48 });
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
