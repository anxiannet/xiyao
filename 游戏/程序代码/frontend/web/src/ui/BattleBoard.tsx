import React from 'react';
import { terrainIcon, tileStatusName, squads, type GameAction, type MatchState } from '../engine/rules';

const HEX_W = 76;
const HEX_H = 88;
const BOARD_PADDING = 24;

function getTilePixel(tile: { q: number; r: number }) {
  return {
    x: (tile.q + tile.r / 2) * HEX_W,
    y: tile.r * (HEX_H * 0.75),
  };
}

function getBoardBounds(tiles: Array<{ q: number; r: number }>) {
  const points = tiles.map(getTilePixel);
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  return {
    minX,
    minY,
    width: maxX - minX + HEX_W,
    height: maxY - minY + HEX_H,
  };
}

export default function BattleBoard({
  match,
  legalActions,
  selectedDeployUnitId,
  locked,
  onSelectUnit,
  onDeployTile,
}: {
  match: MatchState;
  legalActions: GameAction[];
  selectedDeployUnitId: string | null;
  locked: boolean;
  onSelectUnit: (unitId: string | null) => void;
  onDeployTile: (tileId: string) => void;
}) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [boardScale, setBoardScale] = React.useState(1);
  const moveTargets = new Set(legalActions.filter((action) => action.type === 'move' || action.skillId === 'fox_step').map((action) => action.targetTileId));
  const attackTargets = new Set(legalActions.filter((action) => action.type === 'attack' || action.skillId === 'disturb_string').map((action) => action.targetUnitId));
  const boardBounds = getBoardBounds(match.tiles);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const updateScale = () => {
      const availableWidth = viewport.clientWidth - BOARD_PADDING;
      setBoardScale(Math.min(1, availableWidth / boardBounds.width));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [boardBounds.width]);

  return (
    <section className={`map ${locked ? 'locked' : ''}`}>
      <div className="boardViewport" ref={viewportRef}>
        <div className="boardScene" style={{ height: boardBounds.height * boardScale + BOARD_PADDING, width: boardBounds.width * boardScale + BOARD_PADDING }}>
          <div className="board" style={{ width: boardBounds.width, height: boardBounds.height, transform: `scale(${boardScale})`, transformOrigin: 'top left' }}>
            {match.tiles.map((tile) => {
              const unit = match.units.find((item) => item.tileId === tile.id && !item.defeated);
              const selectedDeployUnit = match.units.find((item) => item.id === selectedDeployUnitId);
              const canDeploy = match.phase === 'deployment' && selectedDeployUnit && tile.deploymentOwner === selectedDeployUnit.squad && !unit && tile.terrainLayer !== 'obstacle';
              const selected = unit?.id === match.selectedUnitId;
              const attackable = unit ? attackTargets.has(unit.id) : false;
              const pixel = getTilePixel(tile);
              return (
                <button
                  key={tile.id}
                  className={`hex ${tile.terrainLayer} ${tile.deploymentOwner ? `deploy-${tile.deploymentOwner}` : ''} ${selected ? 'selected' : ''} ${moveTargets.has(tile.id) || canDeploy ? 'moveable' : ''} ${attackable ? 'attackable' : ''}`}
                  style={{
                    left: pixel.x - boardBounds.minX,
                    top: pixel.y - boardBounds.minY,
                    zIndex: selected ? 500 : Math.round(pixel.y - boardBounds.minY),
                  }}
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    if (canDeploy) onDeployTile(tile.id);
                    else onSelectUnit(unit?.id ?? null);
                  }}
                >
                  <span className="terrainLayer">{terrainIcon[tile.terrainLayer]}</span>
                  <span className="coord">{tile.id}</span>
                  {tile.objectiveOwner && <span className="owner">{tile.objectiveOwner === 'neutral' ? '中立' : squads[tile.objectiveOwner].mark}</span>}
                  <span className="statusLayer">{tile.statusLayer.map((status) => <b key={status}>{tileStatusName[status].slice(0, 1)}</b>)}</span>
                  {unit && <span className={`unitLayer ${unit.squad}`}><i>{unit.name.slice(0, 1)}</i><em>{unit.ap}</em></span>}
                  <span className="highlightLayer" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
