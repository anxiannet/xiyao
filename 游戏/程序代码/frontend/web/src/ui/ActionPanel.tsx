import type { GameAction } from '../engine/rules';

export default function ActionPanel({
  actions,
  onAction,
  onAIStep,
  onAIFull,
  onRun1000,
  locked,
}: {
  actions: GameAction[];
  onAction: (action: GameAction) => void;
  onAIStep: () => void;
  onAIFull: () => void;
  onRun1000: () => void;
  locked: boolean;
}) {
  return (
    <section className="card actionPanel">
      <h2>动作按钮区</h2>
      <div className="actionList">
        {actions.map((action) => <button disabled={locked} key={action.id} onClick={() => onAction(action)}>{locked ? '测试运行中...' : action.label}</button>)}
      </div>
      <button disabled={locked} onClick={onAIStep}>{locked ? '测试运行中...' : '执行AI一步'}</button>
      <button disabled={locked} onClick={onAIFull}>{locked ? '测试运行中...' : 'AI跑完整局'}</button>
      <button disabled={locked} onClick={onRun1000}>{locked ? '测试运行中...' : '本地1000局测试'}</button>
    </section>
  );
}
