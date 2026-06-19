import { squads, type MatchState } from '../engine/rules';

export default function DeploymentPanel({
  match,
  selectedDeployUnitId,
  locked,
  onPickUnit,
  onAutoDeployAI,
  onStartRound,
}: {
  match: MatchState;
  selectedDeployUnitId: string | null;
  locked: boolean;
  onPickUnit: (unitId: string) => void;
  onAutoDeployAI: () => void;
  onStartRound: () => void;
}) {
  const playerUnits = match.units.filter((unit) => unit.squad === match.playerSquad && !unit.summon);
  const aiUnits = match.units.filter((unit) => unit.squad !== match.playerSquad && !unit.summon);
  const allDeployed = match.units.filter((unit) => !unit.summon).every((unit) => unit.deployed);
  const autoDeployLabel = match.mode === 'AI vs AI' ? '自动部署双方' : 'AI自动部署';
  return (
    <section className="card deployment">
      <h2>部署面板</h2>
      <p>{match.mode === 'AI vs AI' ? '可先观察部署格，再自动部署双方单位。' : `玩家部署 ${squads[match.playerSquad].name}，AI 自动部署另一方。`}</p>
      <div className="deployCols">
        <div>
          <h3>{squads[match.playerSquad].name}</h3>
          {playerUnits.map((unit) => (
            <button className={selectedDeployUnitId === unit.id ? 'picked' : ''} disabled={locked || unit.deployed || match.mode === 'AI vs AI'} key={unit.id} onClick={() => onPickUnit(unit.id)}>
              {unit.name} {unit.deployed ? `@${unit.tileId}` : '待部署'}
            </button>
          ))}
        </div>
        <div>
          <h3>AI方</h3>
          {aiUnits.map((unit) => <span className="deployItem" key={unit.id}>{unit.name} {unit.deployed ? `@${unit.tileId}` : '待部署'}</span>)}
        </div>
      </div>
      <button disabled={locked} onClick={onAutoDeployAI}>{locked ? '测试运行中...' : autoDeployLabel}</button>
      <button disabled={locked || !allDeployed} onClick={onStartRound}>双方部署完成，开始第一大回合</button>
    </section>
  );
}
