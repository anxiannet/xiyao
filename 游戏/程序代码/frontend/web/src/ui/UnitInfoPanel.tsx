import { squads, unitStatusName, type MatchState } from '../engine/rules';

export default function UnitInfoPanel({ match }: { match: MatchState }) {
  const unit = match.units.find((item) => item.id === match.selectedUnitId) ?? null;
  if (!unit) return null;
  return (
    <section className="unitMiniPanel">
      <div className="unitAvatar">{unit.name.slice(0, 1)}</div>
      <div>
        <b>{unit.name}</b>
        <span>{squads[unit.squad].name}</span>
        <p>HP {unit.hp}/{unit.maxHp} · AP {unit.ap}</p>
        <small>{unit.statuses.length ? unit.statuses.map((status) => unitStatusName[status]).join('、') : '状态正常'}</small>
      </div>
    </section>
  );
}
