import type { AIBatchProgress } from '../ai/aiSimulator';
import type { MatchState } from '../engine/rules';

export default function AIDebugPanel({ match, stats, aiBatchProgress }: { match: MatchState; stats: unknown; aiBatchProgress: AIBatchProgress }) {
  const latest = match.aiDecisions[0];
  return (
    <section className="card ai">
      <h2>AI决策面板</h2>
      <div className="aiBatch">
        <h3>本地1000局测试进度</h3>
        <div className="progress">
          <div className="progressBar" style={{ width: `${aiBatchProgress.percent}%` }} />
        </div>
        <p>{aiBatchProgress.completed} / {aiBatchProgress.total} ｜ {aiBatchProgress.percent}% ｜ {aiBatchProgress.running ? '运行中' : '已完成'}</p>
        <p>当前青丘胜：{aiBatchProgress.qingqiuWins} ｜ 当前天门胜：{aiBatchProgress.tianmenWins}</p>
        <p>当前平局：{aiBatchProgress.draws} ｜ 当前异常局：{aiBatchProgress.abnormalFinished}</p>
        <p>正常完成：{aiBatchProgress.normalFinished}</p>
      </div>
      {latest ? (
        <>
          <p>当前AI单位：{latest.unitName}</p>
          <p>最终选择：{latest.selected?.action.label ?? '无'} ｜ {latest.selected?.score ?? '-'}</p>
          <p>执行结果：{latest.result}</p>
          {latest.candidates.map((candidate) => (
            <div className="candidate" key={candidate.action.id}>
              <strong>{candidate.action.label}｜{candidate.score}</strong>
              <small>
                目标 {candidate.breakdown.target} / 位置 {candidate.breakdown.position} / 资源 {candidate.breakdown.resource} / 状态 {candidate.breakdown.status} / 据点 {candidate.breakdown.objective} / 协同 {candidate.breakdown.synergy} / 击杀 {candidate.breakdown.kill} / 生存 {candidate.breakdown.survival} / 风险 {candidate.breakdown.risk}
              </small>
            </div>
          ))}
        </>
      ) : <p>等待 AI 决策。</p>}
      {stats ? <pre className="statsJson">{JSON.stringify(stats, null, 2).slice(0, 1600)}</pre> : null}
    </section>
  );
}
