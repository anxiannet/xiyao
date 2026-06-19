import React from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { terrainName, type DecreeId, type GameAction, type MatchState, type SquadId, type TerrainId, type TileState, type UnitState } from '../engine/rules';
import { ISO_H, ISO_W, isoProject } from './isoProjection';

type ViewMode = 'battle' | 'tactical';

const tileColors: Record<TerrainId, { fill: number; line: number; label: string }> = {
  plain: { fill: 0x6b6f68, line: 0xc9a86a, label: '□' },
  central_objective: { fill: 0xb88a3d, line: 0xffd77a, label: '★' },
  edge_objective: { fill: 0x8a8f86, line: 0xd8d2bf, label: '◎' },
  high_ground: { fill: 0xa99a73, line: 0xf2d79d, label: '▲' },
  cover_shadow: { fill: 0x3a5554, line: 0x75b8ae, label: '▒' },
  dusk_rift: { fill: 0x245f66, line: 0x4fa3a5, label: '裂' },
  obstacle: { fill: 0x1f2329, line: 0x5e5448, label: '■' },
};

const squadColors: Record<SquadId, { fill: number; line: number; mark: string }> = {
  qingqiu: { fill: 0x4fa3a5, line: 0xc9fff6, mark: '青' },
  tianmen: { fill: 0xd8d2bf, line: 0xfff2bd, mark: '天' },
};

const HEX_DRAW_W = ISO_W * 0.64;
const HEX_DRAW_H = ISO_H * 0.78;

const decreeText: Record<DecreeId, string> = {
  forbid_movement: '禁行令',
  martial_law: '戒严令',
  pursuit: '追捕令',
};

function boundsForTiles(tiles: TileState[]) {
  const points = tiles.map((tile) => isoProject(tile.q, tile.r));
  return {
    minX: Math.min(...points.map((point) => point.x)) - ISO_W,
    maxX: Math.max(...points.map((point) => point.x)) + ISO_W,
    minY: Math.min(...points.map((point) => point.y)) - ISO_H,
    maxY: Math.max(...points.map((point) => point.y)) + ISO_H * 2,
  };
}

function drawHex(graphics: Graphics, fill: number, line: number, alpha = 1) {
  graphics.clear();
  graphics.moveTo(0, -HEX_DRAW_H / 2);
  graphics.lineTo(HEX_DRAW_W / 2, -HEX_DRAW_H / 4);
  graphics.lineTo(HEX_DRAW_W / 2, HEX_DRAW_H / 4);
  graphics.lineTo(0, HEX_DRAW_H / 2);
  graphics.lineTo(-HEX_DRAW_W / 2, HEX_DRAW_H / 4);
  graphics.lineTo(-HEX_DRAW_W / 2, -HEX_DRAW_H / 4);
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

    app.init({ antialias: true, backgroundAlpha: 0, resizeTo: host }).then(() => {
      initialized = true;
      if (disposed) {
        app.canvas.remove();
        app.destroy();
        return;
      }
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
      ? Math.min(app.renderer.width / width, app.renderer.height / height) * 0.92
      : Math.min(app.renderer.width / (width * 0.88), app.renderer.height / (height * 0.88)) * 0.98;
    const offsetX = app.renderer.width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale;
    const offsetY = app.renderer.height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale + (viewMode === 'battle' ? 12 : 0);
    for (const layer of [layers.terrain, layers.status, layers.unit]) {
      layer.scale.set(scale);
      layer.position.set(offsetX, offsetY);
    }

    for (const tile of match.tiles) {
      const { x, y } = isoProject(tile.q, tile.r);
      const tileGraphic = new Graphics();
      const colors = tileColors[tile.terrainLayer];
      drawHex(tileGraphic, colors.fill, colors.line);
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

      const label = makeText(tile.deploymentOwner ? squadColors[tile.deploymentOwner].mark : colors.label, tile.terrainLayer === 'central_objective' ? 24 : 18);
      label.position.set(x, y - 2);
      layers.terrain.addChild(label);

      const name = makeText(terrainName[tile.terrainLayer], 9, 0xf3dfad);
      name.alpha = viewMode === 'tactical' ? 0.9 : 0.38;
      name.position.set(x, y + 17);
      layers.terrain.addChild(name);

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
        const remnant = makeText('狐', 13, 0x96fff1);
        remnant.position.set(x - 22, y - 4);
        layers.status.addChild(remnant);
      }
      if (tile.statusLayer.includes('inspection_zone')) {
        const inspect = makeText('验', 13, 0xffdf7f);
        inspect.position.set(x + 22, y - 4);
        layers.status.addChild(inspect);
      }
    }

    for (const unit of match.units.filter((item) => item.tileId && !item.defeated)) {
      const tile = match.tiles.find((item) => item.id === unit.tileId);
      if (!tile) continue;
      const point = isoProject(tile.q, tile.r);
      const group = new Container();
      group.position.set(point.x, point.y - 20);
      group.eventMode = locked ? 'none' : 'static';
      group.cursor = locked ? 'default' : 'pointer';
      group.on('pointertap', () => {
        if (!locked) onSelectUnit(unit.id);
      });
      const disc = new Graphics();
      const squad = squadColors[unit.squad];
      disc.circle(0, 0, unit.summon ? 12 : 16);
      disc.fill({ color: squad.fill, alpha: unit.summon ? 0.72 : 0.96 });
      disc.stroke({ color: attackTargets.has(unit.id) ? 0xb85a3c : squad.line, width: match.selectedUnitId === unit.id ? 4 : 2 });
      group.addChild(disc);
      const initial = makeText(unit.name.slice(0, 1), 17, unit.squad === 'tianmen' ? 0x232323 : 0x062226);
      group.addChild(initial);
      const hp = makeText(`${unit.hp}`, 9, 0xffffff);
      hp.position.set(14, 14);
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
