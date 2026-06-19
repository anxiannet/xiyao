import type { MatchState } from '../engine/rules';

export default function BattleLog({ match }: { match: MatchState }) {
  return (
    <footer className="log">
      <details open>
        <summary>战斗日志</summary>
        {match.logs.map((item) => <p key={item.id}><b>{item.type}</b>｜{item.message}</p>)}
      </details>
    </footer>
  );
}
