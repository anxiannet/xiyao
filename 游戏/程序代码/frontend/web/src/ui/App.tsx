import React from 'react';
import { mapConfigs, type MapId, type SquadId } from '../data/maps';
import { runAIUntilHumanOrEnd, runAIStep } from '../ai/aiRunner';
import { runLocalSimulations } from '../ai/aiSimulator';
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
import MapPreview from './MapPreview';
import PhaseHeader from './PhaseHeader';
import UnitInfoPanel from './UnitInfoPanel';

export default function App() {
  const [mode, setMode] = React.useState<Mode>('AI vs AI');
  const [mapId, setMapId] = React.useState<MapId>('test_map_a');
  const [playerSquad, setPlayerSquad] = React.useState<SquadId>('qingqiu');
  const [selectedDeployUnitId, setSelectedDeployUnitId] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<unknown>(() => loadAIStats());
  const [match, setMatch] = React.useState<MatchState>(() => createMatch('AI vs AI', 'test_map_a', 'qingqiu'));
  const legalActions = React.useMemo(() => generateLegalActions(match), [match]);

  React.useEffect(() => saveCurrentMatch(match), [match]);

  function createNewMatch() {
    setSelectedDeployUnitId(null);
    setMatch(createMatch(mode, mapId, playerSquad));
  }

  function startDeployment() {
    const validation = validateMap(mapConfigs[match.mapId]);
    if (!validation.ok) return;
    let next: MatchState = { ...match, phase: 'deployment' };
    if (mode === 'AI vs AI') next = autoDeploySquad(autoDeploySquad(next, 'qingqiu'), 'tianmen');
    else next = autoDeploySquad(next, playerSquad === 'qingqiu' ? 'tianmen' : 'qingqiu');
    setMatch(next);
  }

  function deployToTile(tileId: string) {
    if (!selectedDeployUnitId) return;
    const next = deployUnit(match, selectedDeployUnitId, tileId);
    setSelectedDeployUnitId(null);
    setMatch(next);
  }

  function autoDeployAI() {
    setMatch((current) => current.mode === 'AI vs AI' ? autoDeploySquad(autoDeploySquad(current, 'qingqiu'), 'tianmen') : autoDeploySquad(current, current.playerSquad === 'qingqiu' ? 'tianmen' : 'qingqiu'));
  }

  function startRound() {
    setMatch((current) => runAIUntilHumanOrEnd(beginFirstRound(current)));
  }

  function selectUnit(unitId: string | null) {
    setMatch((current) => ({ ...current, selectedUnitId: unitId }));
  }

  function executeAction(action: GameAction) {
    setMatch((current) => runAIUntilHumanOrEnd(resolveAction(current, action)));
  }

  function aiStep() {
    setMatch((current) => runAIStep(current));
  }

  function aiFull() {
    setMatch((current) => runAIUntilHumanOrEnd(current, 500));
  }

  function run1000() {
    const summary = runLocalSimulations(1000);
    setStats(summary);
  }

  return (
    <main className="shell">
      <PhaseHeader match={match} />
      <section className="homebar">
        <div className="field"><span>模式</span><select value={mode} onChange={(event) => setMode(event.target.value as Mode)}><option>玩家 vs AI</option><option>AI vs AI</option></select></div>
        <div className="field"><span>地图</span><select value={mapId} onChange={(event) => setMapId(event.target.value as MapId)}>{(Object.keys(mapConfigs) as MapId[]).map((id) => <option value={id} key={id}>{id}</option>)}</select></div>
        <div className="field"><span>玩家阵营</span><select value={playerSquad} onChange={(event) => setPlayerSquad(event.target.value as SquadId)}><option value="qingqiu">青丘使团</option><option value="tianmen">天门执法队</option></select></div>
        <button onClick={createNewMatch}>创建对局 / 进入预览</button>
      </section>
      {match.phase === 'map_preview' && <MapPreview mapId={match.mapId} onStartDeployment={startDeployment} />}
      {match.phase === 'deployment' && <DeploymentPanel match={match} selectedDeployUnitId={selectedDeployUnitId} onPickUnit={setSelectedDeployUnitId} onAutoDeployAI={autoDeployAI} onStartRound={startRound} />}
      <section className="gamegrid">
        <BattleBoard match={match} legalActions={legalActions} selectedDeployUnitId={selectedDeployUnitId} onSelectUnit={selectUnit} onDeployTile={deployToTile} />
        <aside className="side">
          <UnitInfoPanel match={match} />
          <ActionPanel actions={legalActions} onAction={executeAction} onAIStep={aiStep} onAIFull={aiFull} onRun1000={run1000} />
          <AIDebugPanel match={match} stats={stats} />
        </aside>
      </section>
      <BattleLog match={match} />
    </main>
  );
}
