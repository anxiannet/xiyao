import type { GameAction } from '../engine/rules';

export default function ActionPanel({
  actions,
  onAction,
  onAIStep,
  onAIFull,
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
    <section className="card actionPanel">
      <h2>动作栏</h2>
      <div className="quickActions">
        <button disabled={locked || !grouped.move} onClick={() => grouped.move && onAction(grouped.move)}>移动</button>
        <button disabled={locked || !grouped.attack} onClick={() => grouped.attack && onAction(grouped.attack)}>攻击</button>
        <button disabled={locked || !grouped.skill} onClick={() => grouped.skill && onAction(grouped.skill)}>技能</button>
        <button disabled={locked || !grouped.capture} onClick={() => grouped.capture && onAction(grouped.capture)}>占领</button>
        <button disabled={locked || !grouped.end} onClick={() => grouped.end && onAction(grouped.end)}>结束</button>
      </div>
      <details>
        <summary>可执行动作</summary>
        <div className="actionList">
        {actions.map((action) => <button disabled={locked} key={action.id} onClick={() => onAction(action)}>{locked ? '测试运行中...' : action.label}</button>)}
        </div>
      </details>
      <div className="aiButtons">
        <button disabled={locked} onClick={onAIStep}>{locked ? '测试运行中...' : 'AI一步'}</button>
        <button disabled={locked} onClick={onAIFull}>{locked ? '测试运行中...' : 'AI跑完整局'}</button>
      </div>
    </section>
  );
}
