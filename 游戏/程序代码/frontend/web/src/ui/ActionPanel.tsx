import type { GameAction } from '../engine/rules';

export default function ActionPanel({
  actions,
  onAction,
  onAIStep,
  onAIFull,
  onRun1000,
  aiBatchRunning,
}: {
  actions: GameAction[];
  onAction: (action: GameAction) => void;
  onAIStep: () => void;
  onAIFull: () => void;
  onRun1000: () => void;
  aiBatchRunning: boolean;
}) {
  return (
    <section className="card actionPanel">
      <h2>动作按钮区</h2>
      <div className="actionList">
        {actions.map((action) => <button key={action.id} onClick={() => onAction(action)}>{action.label}</button>)}
      </div>
      <button onClick={onAIStep}>执行AI一步</button>
      <button disabled={aiBatchRunning} onClick={onAIFull}>{aiBatchRunning ? '测试运行中...' : 'AI跑完整局'}</button>
      <button disabled={aiBatchRunning} onClick={onRun1000}>{aiBatchRunning ? '测试运行中...' : '本地1000局测试'}</button>
    </section>
  );
}
