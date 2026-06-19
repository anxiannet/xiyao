import type { MatchState } from '../engine/rules';

export default function BattleLog({ match }: { match: MatchState }) {
  return (
    <footer className="log">
      <strong>战斗日志</strong>
      {match.logs.map((item) => <p key={item.id}><b>{item.type}</b>｜{item.message}</p>)}
    </footer>
  );
}
