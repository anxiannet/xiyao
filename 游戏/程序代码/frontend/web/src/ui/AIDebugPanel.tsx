import type { AIBatchProgress } from '../ai/aiSimulator';
import type { MatchState } from '../engine/rules';

type StatsSummary = {
  totalGames?: number;
  qingqiuWins?: number;
  tianmenWins?: number;
  draws?: number;
  abnormalGames?: number;
  averageRounds?: number;
  averageKills?: number;
  averageCaptures?: number;
  averageSkillUses?: number;
  firstActorWinRate?: number;
};

function getSummary(stats: unknown): StatsSummary | null {
  if (!stats || typeof stats !== 'object') return null;
  const value = stats as { summary?: unknown };
  const summary = value.summary;
  if (summary && typeof summary === 'object' && 'summary' in summary) {
    return (summary as { summary?: StatsSummary }).summary ?? null;
  }
  return summary && typeof summary === 'object' ? summary as StatsSummary : null;
}

function percent(value: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((value / total) * 1000) / 10}%`;
}

function rate(value?: number): string {
  if (typeof value !== 'number') return '0%';
  return `${Math.round(value * 1000) / 10}%`;
}

export default function AIDebugPanel({ match, stats, aiBatchProgress }: { match: MatchState; stats: unknown; aiBatchProgress: AIBatchProgress }) {
  const latest = match.aiDecisions[0];
  const summary = getSummary(stats);
  const total = summary?.totalGames ?? 0;
  const abnormal = summary?.abnormalGames ?? 0;
  const normalTotal = Math.max(0, total - abnormal);
  return (
    <section className="card ai">
      <details open>
        <summary>AI决策面板</summary>
        <div className="aiBatch">
          <h3>本地测试进度</h3>
          <div className="progress">
            <div className="progressBar" style={{ width: `${aiBatchProgress.percent}%` }} />
          </div>
          <p>{aiBatchProgress.completed} / {aiBatchProgress.total} ｜ {aiBatchProgress.percent}% ｜ {aiBatchProgress.running ? '运行中' : '未运行'}</p>
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
        {summary ? (
          <div className="statGrid compact">
            <span><b>{total}</b><small>总对局数</small></span>
            <span><b className="qingqiuText">{percent(summary.qingqiuWins ?? 0, normalTotal)}</b><small>青丘胜率</small></span>
            <span><b className="tianmenText">{percent(summary.tianmenWins ?? 0, normalTotal)}</b><small>天门胜率</small></span>
            <span><b>{percent(summary.draws ?? 0, normalTotal)}</b><small>平局率</small></span>
            <span><b>{abnormal}</b><small>异常局</small></span>
            <span><b>{summary.averageRounds ?? 0}</b><small>平均回合</small></span>
            <span><b>{summary.averageKills ?? 0}</b><small>平均击杀</small></span>
            <span><b>{summary.averageCaptures ?? 0}</b><small>平均占点</small></span>
            <span><b>{summary.averageSkillUses ?? 0}</b><small>平均技能</small></span>
            <span><b>{rate(summary.firstActorWinRate)}</b><small>先手胜率</small></span>
          </div>
        ) : <p className="muted">暂无统计</p>}
      </details>
    </section>
  );
}
