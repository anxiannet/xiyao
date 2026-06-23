import { squads, unitStatusName, type MatchState } from '../engine/rules';
import { factionAssetPaths, getPortraitAssetPath, unitStatusAssetPaths } from './assets';

export default function UnitInfoPanel({ match }: { match: MatchState }) {
  const unit = match.units.find((item) => item.id === match.selectedUnitId) ?? null;
  if (!unit) return null;
  const portrait = getPortraitAssetPath(unit);
  return (
    <section className="unitMiniPanel">
      <div className="unitAvatar">
        {portrait ? <img src={portrait} alt="" /> : unit.name.slice(0, 1)}
      </div>
      <div>
        <b>{unit.name}</b>
        <span className="unitFaction"><img src={factionAssetPaths[unit.squad]} alt="" />{squads[unit.squad].name}</span>
        <p>HP {unit.hp}/{unit.maxHp} · AP {unit.ap}</p>
        <small className="unitStatusList">
          {unit.statuses.length ? unit.statuses.map((status) => (
            <span key={status}>
              {unitStatusAssetPaths[status] && <img src={unitStatusAssetPaths[status]} alt="" />}
              {unitStatusName[status]}
            </span>
          )) : '状态正常'}
        </small>
      </div>
    </section>
  );
}
