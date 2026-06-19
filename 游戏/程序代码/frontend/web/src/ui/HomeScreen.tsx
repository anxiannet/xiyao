import { squads, type MatchLogItem, type MatchState, type Mode } from '../engine/rules';

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

function formatRate(value?: number): string {
  if (typeof value !== 'number') return '0%';
  return `${Math.round(value * 1000) / 10}%`;
}

function formatNumber(value?: number): string {
  if (typeof value !== 'number') return '0';
  return `${value}`;
}

function latestLogs(logs: MatchLogItem[]): MatchLogItem[] {
  return logs.slice(0, 5);
}

export default function HomeScreen({
  match,
  mode,
  stats,
  aiBatchRunning,
  onToggleMode,
  onStartBattle,
  onStartPve,
  onStartAi,
  onRun1000,
}: {
  match: MatchState;
  mode: Mode;
  stats: unknown;
  aiBatchRunning: boolean;
  onToggleMode: () => void;
  onStartBattle: () => void;
  onStartPve: () => void;
  onStartAi: () => void;
  onRun1000: () => void;
}) {
  const summary = getSummary(stats);
  const total = summary?.totalGames ?? 0;
  const abnormal = summary?.abnormalGames ?? 0;
  const normalTotal = Math.max(0, total - abnormal);
  const logs = latestLogs(match.logs);

  return (
    <main className="mobileHome">
      <header className="homeTop">
        <button type="button">设置</button>
        <button type="button">规则</button>
        <button type="button">帮助</button>
        <div className="modeSwitch">
          <span>当前模式：{mode}</span>
          <button disabled={aiBatchRunning} onClick={onToggleMode} type="button">切换</button>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="heroKicker">战棋</p>
          <h1>夕妖</h1>
          <p>黄昏之下，狐影与律令的对决</p>
        </div>
      </section>

      <section className="modeCard overviewCard">
        <h2>当前对局概览</h2>
        <div className="overviewGrid">
          <span>地图：<b>{match.mapId}</b></span>
          <span>大回合：<b>{match.round}</b></span>
          <span>行动方：<b>{squads[match.activeSquad].name}</b></span>
          <span>阶段：<b>{match.phase}</b></span>
        </div>
      </section>

      <section className="homeActions">
        <button className="modeCard primaryAction" disabled={aiBatchRunning} onClick={onStartBattle} type="button">
          <strong>开始对战</strong>
          <span>创建新对局</span>
        </button>
        <button className="modeCard" disabled={aiBatchRunning} onClick={onStartPve} type="button">
          <strong>自由对战</strong>
          <span>玩家 vs AI</span>
        </button>
        <button className="modeCard" disabled={aiBatchRunning} onClick={onStartAi} type="button">
          <strong>AI 对战</strong>
          <span>AI vs AI</span>
        </button>
        <button className="modeCard" disabled={aiBatchRunning} onClick={onRun1000} type="button">
          <strong>{aiBatchRunning ? '测试运行中...' : '本地1000局测试'}</strong>
          <span>本地批量模拟，不连接服务器</span>
        </button>
      </section>

      <section className="modeCard">
        <h2>AI统计（累计）</h2>
        {summary ? (
          <div className="statGrid">
            <span><b>{total}</b><small>总对局数</small></span>
            <span><b className="qingqiuText">{percent(summary.qingqiuWins ?? 0, normalTotal)}</b><small>青丘胜率</small></span>
            <span><b className="tianmenText">{percent(summary.tianmenWins ?? 0, normalTotal)}</b><small>天门胜率</small></span>
            <span><b>{percent(summary.draws ?? 0, normalTotal)}</b><small>平局率</small></span>
            <span><b>{abnormal}</b><small>异常局</small></span>
            <span><b>{formatNumber(summary.averageRounds)}</b><small>平均回合</small></span>
            <span><b>{formatNumber(summary.averageKills)}</b><small>平均击杀</small></span>
            <span><b>{formatNumber(summary.averageCaptures)}</b><small>平均占点</small></span>
            <span><b>{formatNumber(summary.averageSkillUses)}</b><small>平均技能</small></span>
            <span><b>{formatRate(summary.firstActorWinRate)}</b><small>先手胜率</small></span>
          </div>
        ) : <p className="muted">暂无统计</p>}
      </section>

      <section className="modeCard">
        <h2>最近日志</h2>
        <div className="recentLogs">
          {logs.length ? logs.map((item) => (
            <p key={item.id}><span>{item.type}</span>{item.message}</p>
          )) : <p className="muted">暂无日志</p>}
        </div>
      </section>

      <nav className="bottomNav">
        <button type="button">首页</button>
        <button type="button">对局记录</button>
        <button type="button">AI统计</button>
        <button type="button">图鉴</button>
        <button type="button">设置</button>
      </nav>
    </main>
  );
}
