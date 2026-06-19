import { terrainIcon, tileStatusName, squads, type GameAction, type MatchState } from '../engine/rules';

export default function BattleBoard({
  match,
  legalActions,
  selectedDeployUnitId,
  onSelectUnit,
  onDeployTile,
}: {
  match: MatchState;
  legalActions: GameAction[];
  selectedDeployUnitId: string | null;
  onSelectUnit: (unitId: string | null) => void;
  onDeployTile: (tileId: string) => void;
}) {
  const moveTargets = new Set(legalActions.filter((action) => action.type === 'move' || action.skillId === 'fox_step').map((action) => action.targetTileId));
  const attackTargets = new Set(legalActions.filter((action) => action.type === 'attack' || action.skillId === 'disturb_string').map((action) => action.targetUnitId));
  return (
    <section className="map">
      <div className="boardViewport">
        <div className="board">
          {match.tiles.map((tile) => {
            const unit = match.units.find((item) => item.tileId === tile.id && !item.defeated);
            const canDeploy = match.phase === 'deployment' && selectedDeployUnitId && tile.deploymentOwner === match.playerSquad && !unit && tile.terrainLayer !== 'obstacle';
            const selected = unit?.id === match.selectedUnitId;
            const attackable = unit ? attackTargets.has(unit.id) : false;
            return (
              <button
                key={tile.id}
                className={`hex ${tile.terrainLayer} ${tile.deploymentOwner ? `deploy-${tile.deploymentOwner}` : ''} ${selected ? 'selected' : ''} ${moveTargets.has(tile.id) || canDeploy ? 'moveable' : ''} ${attackable ? 'attackable' : ''}`}
                style={{ left: 340 + tile.q * 82 + tile.r * 41, top: 230 + tile.r * 70 }}
                onClick={() => (canDeploy ? onDeployTile(tile.id) : onSelectUnit(unit?.id ?? null))}
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
    </section>
  );
}
