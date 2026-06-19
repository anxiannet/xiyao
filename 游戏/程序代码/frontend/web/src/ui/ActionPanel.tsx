import type { GameAction } from '../engine/rules';

export default function ActionPanel({
  actions,
  onAction,
  locked,
}: {
  actions: GameAction[];
  onAction: (action: GameAction) => void;
  onAIStep: () => void;
  onAIFull: () => void;
  locked: boolean;
}) {
  const grouped = {
    move: actions.find((action) => action.type === 'move'),
    attack: actions.find((action) => action.type === 'attack'),
    skill: actions.find((action) => action.type === 'skill'),
    capture: actions.find((action) => action.type === 'capture'),
    end: actions.find((action) => action.type === 'end_turn'),
  };

  return (
    <section className="actionPanel actionBar">
      <div className="quickActions">
        <button className="actionButton" disabled={locked || !grouped.move} onClick={() => grouped.move && onAction(grouped.move)}><b>↗</b><span>移动</span></button>
        <button className="actionButton" disabled={locked || !grouped.attack} onClick={() => grouped.attack && onAction(grouped.attack)}><b>⚔</b><span>攻击</span></button>
        <button className="actionButton" disabled={locked || !grouped.skill} onClick={() => grouped.skill && onAction(grouped.skill)}><b>✦</b><span>技能</span></button>
        <button className="actionButton" disabled={locked || !grouped.capture} onClick={() => grouped.capture && onAction(grouped.capture)}><b>◆</b><span>占领</span></button>
        <button className="actionButton" disabled={locked || !grouped.end} onClick={() => grouped.end && onAction(grouped.end)}><b>✓</b><span>结束</span></button>
      </div>
    </section>
  );
}
