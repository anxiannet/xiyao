import { squads, unitStatusName, type MatchState } from '../engine/rules';

export default function UnitInfoPanel({ match }: { match: MatchState }) {
  const unit = match.units.find((item) => item.id === match.selectedUnitId) ?? null;
  return (
    <section className="card">
      <h2>单位信息</h2>
      {unit ? (
        <>
          <p>{unit.name}｜{squads[unit.squad].name}</p>
          <p>HP {unit.hp}/{unit.maxHp} ｜ AP {unit.ap} ｜ MV {unit.mv} ｜ RNG {unit.rng}</p>
          <p>技能：{unit.skillName}</p>
          <p>状态：{unit.statuses.length ? unit.statuses.map((status) => unitStatusName[status]).join('、') : '无'}</p>
        </>
      ) : <p>未选中单位</p>}
    </section>
  );
}
