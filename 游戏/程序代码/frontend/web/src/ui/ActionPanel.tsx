import type { GameAction } from '../engine/rules';

export default function ActionPanel({ actions, onAction, onAIStep, onAIFull, onRun1000 }: { actions: GameAction[]; onAction: (action: GameAction) => void; onAIStep: () => void; onAIFull: () => void; onRun1000: () => void }) {
  return (
    <section className="card actionPanel">
      <h2>动作按钮区</h2>
      <div className="actionList">
        {actions.map((action) => <button key={action.id} onClick={() => onAction(action)}>{action.label}</button>)}
      </div>
      <button onClick={onAIStep}>执行AI一步</button>
      <button onClick={onAIFull}>AI跑完整局</button>
      <button onClick={onRun1000}>本地1000局测试</button>
    </section>
  );
}
