import { squads, type MatchState } from '../engine/rules';

export default function PhaseHeader({ match }: { match: MatchState }) {
  return (
    <header className="phase">
      <b>阶段：{match.phase}</b>
      <span>大回合：{match.round || '-'}</span>
      <span>行动方：{squads[match.activeSquad].name}</span>
      <span>模式：{match.mode}</span>
      <span>地图：{match.mapId}</span>
      <span>狐火：{match.foxfire}/5</span>
      <span>本地保存：LocalStorage</span>
    </header>
  );
}
