import React from 'react';
import { mapConfigs, type MapId, type SquadId } from '../data/maps';
import { runAIUntilHumanOrEnd, runAIStep } from '../ai/aiRunner';
import { runBatchAITestAsync, type AIBatchProgress } from '../ai/aiSimulator';
import { deployUnit, autoDeploySquad } from '../engine/deployment';
import { generateLegalActions } from '../engine/actionGenerator';
import { resolveAction } from '../engine/actionResolver';
import { createMatch } from '../engine/matchFactory';
import { validateMap } from '../engine/mapValidator';
import { beginFirstRound } from '../engine/turnManager';
import type { GameAction, MatchState, Mode } from '../engine/rules';
import { saveCurrentMatch } from '../storage/localMatchStorage';
import { loadAIStats } from '../storage/localStatsStorage';
import ActionPanel from './ActionPanel';
import AIDebugPanel from './AIDebugPanel';
import BattleBoard from './BattleBoard';
import BattleLog from './BattleLog';
import DeploymentPanel from './DeploymentPanel';
import HomeScreen from './HomeScreen';
import MapPreview from './MapPreview';
import PhaseHeader from './PhaseHeader';
import UnitInfoPanel from './UnitInfoPanel';

type Page = 'home' | 'battle';

export default function App() {
  const [page, setPage] = React.useState<Page>('home');
  const [mode, setMode] = React.useState<Mode>('AI vs AI');
  const [mapId, setMapId] = React.useState<MapId>('test_map_a');
  const [playerSquad, setPlayerSquad] = React.useState<SquadId>('qingqiu');
  const [selectedDeployUnitId, setSelectedDeployUnitId] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<unknown>(() => loadAIStats());
  const [aiBatchProgress, setAiBatchProgress] = React.useState<AIBatchProgress>({
    running: false,
    total: 1000,
    completed: 0,
    normalFinished: 0,
    abnormalFinished: 0,
    qingqiuWins: 0,
    tianmenWins: 0,
    draws: 0,
    percent: 0,
  });
  const [match, setMatch] = React.useState<MatchState>(() => createMatch('AI vs AI', 'test_map_a', 'qingqiu'));
  const legalActions = React.useMemo(() => generateLegalActions(match), [match]);
  const locked = aiBatchProgress.running;

  React.useEffect(() => saveCurrentMatch(match), [match]);

  function createNewMatch(nextMode = mode, nextMapId = mapId, nextPlayerSquad = playerSquad) {
    if (locked) return;
    setSelectedDeployUnitId(null);
    setMode(nextMode);
    setMapId(nextMapId);
    setPlayerSquad(nextPlayerSquad);
    setMatch(createMatch(nextMode, nextMapId, nextPlayerSquad));
    setPage('battle');
  }

  function toggleMode() {
    if (locked) return;
    setMode((current) => current === 'AI vs AI' ? '玩家 vs AI' : 'AI vs AI');
  }

  function startDeployment() {
    if (locked) return;
    const validation = validateMap(mapConfigs[match.mapId]);
    if (!validation.ok) return;
    setMatch({ ...match, phase: 'deployment' });
  }

  function deployToTile(tileId: string) {
    if (locked || !selectedDeployUnitId) return;
    const next = deployUnit(match, selectedDeployUnitId, tileId);
    setSelectedDeployUnitId(null);
    setMatch(next);
  }

  function autoDeployAI() {
    if (locked) return;
    setMatch((current) => current.mode === 'AI vs AI' ? autoDeploySquad(autoDeploySquad(current, 'qingqiu'), 'tianmen') : autoDeploySquad(current, current.playerSquad === 'qingqiu' ? 'tianmen' : 'qingqiu'));
  }

  function startRound() {
    if (locked) return;
    setMatch((current) => runAIUntilHumanOrEnd(beginFirstRound(current)));
  }

  function selectUnit(unitId: string | null) {
    if (locked) return;
    setMatch((current) => ({ ...current, selectedUnitId: unitId }));
  }

  function executeAction(action: GameAction) {
    if (locked) return;
    setMatch((current) => runAIUntilHumanOrEnd(resolveAction(current, action)));
  }

  function aiStep() {
    if (locked) return;
    setMatch((current) => runAIStep(current));
  }

  function aiFull() {
    if (locked) return;
    setMatch((current) => runAIUntilHumanOrEnd(current, 500));
  }

  async function run1000() {
    if (locked) return;
    try {
      const summary = await runBatchAITestAsync(1000, 10, (progress, partialSummary) => {
        setAiBatchProgress(progress);
        setStats({ summary: partialSummary, abnormalSamples: partialSummary.abnormalSamples });
      });
      setStats({ summary, abnormalSamples: summary.abnormalSamples });
    } catch (error) {
      setAiBatchProgress((current) => ({ ...current, running: false }));
      setStats({ error: error instanceof Error ? error.message : 'AI批量测试失败' });
    }
  }

  if (page === 'home') {
    return (
      <HomeScreen
        aiBatchRunning={locked}
        match={match}
        mode={mode}
        stats={stats}
        onRun1000={run1000}
        onStartAi={() => createNewMatch('AI vs AI')}
        onStartBattle={() => createNewMatch(mode)}
        onStartPve={() => createNewMatch('玩家 vs AI')}
        onToggleMode={toggleMode}
      />
    );
  }

  return (
    <main className="shell">
      <PhaseHeader match={match} />
      <section className="homebar">
        <div className="field"><span>模式</span><select disabled={locked} value={mode} onChange={(event) => setMode(event.target.value as Mode)}><option>玩家 vs AI</option><option>AI vs AI</option></select></div>
        <div className="field"><span>地图</span><select disabled={locked} value={mapId} onChange={(event) => setMapId(event.target.value as MapId)}>{(Object.keys(mapConfigs) as MapId[]).map((id) => <option value={id} key={id}>{id}</option>)}</select></div>
        <div className="field"><span>玩家阵营</span><select disabled={locked} value={playerSquad} onChange={(event) => setPlayerSquad(event.target.value as SquadId)}><option value="qingqiu">青丘使团</option><option value="tianmen">天门执法队</option></select></div>
        <button onClick={() => setPage('home')}>返回首页</button>
        <button disabled={locked} onClick={() => createNewMatch()}>{locked ? '测试运行中...' : '创建对局 / 进入预览'}</button>
      </section>
      {match.phase === 'map_preview' && <MapPreview locked={locked} mapId={match.mapId} onStartDeployment={startDeployment} />}
      {match.phase === 'deployment' && <DeploymentPanel locked={locked} match={match} selectedDeployUnitId={selectedDeployUnitId} onPickUnit={(unitId) => !locked && setSelectedDeployUnitId(unitId)} onAutoDeployAI={autoDeployAI} onStartRound={startRound} />}
      <section className="gamegrid">
        <BattleBoard locked={locked} match={match} legalActions={legalActions} selectedDeployUnitId={selectedDeployUnitId} onSelectUnit={selectUnit} onDeployTile={deployToTile} />
        <aside className="side">
          <UnitInfoPanel match={match} />
          <ActionPanel actions={legalActions} locked={locked} onAction={executeAction} onAIStep={aiStep} onAIFull={aiFull} onRun1000={run1000} />
          <AIDebugPanel match={match} stats={stats} aiBatchProgress={aiBatchProgress} />
        </aside>
      </section>
      <BattleLog match={match} />
    </main>
  );
}
