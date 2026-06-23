import React from 'react';
import { runAIUntilHumanOrEnd, runAIStep } from '../ai/aiRunner';
import { autoDeploySquad, deployUnit, allFormalUnitsDeployed } from '../engine/deployment';
import { generateLegalActions } from '../engine/actionGenerator';
import { resolveAction } from '../engine/actionResolver';
import { createMatch } from '../engine/matchFactory';
import { beginFirstRound } from '../engine/turnManager';
import { addLog, type DecreeId, type GameAction, type MatchState } from '../engine/rules';
import { saveCurrentMatch } from '../storage/localMatchStorage';
import { loadAIStats } from '../storage/localStatsStorage';
import ActionPanel, { type SelectedActionMode } from './ActionPanel';
import AIDebugPanel from './AIDebugPanel';
import BattleBoard from './BattleBoard';
import BattleLog from './BattleLog';
import PhaseHeader from './PhaseHeader';
import UnitInfoPanel from './UnitInfoPanel';
import type { AIBatchProgress } from '../ai/aiSimulator';
import { getPortraitAssetPath } from './assets';

const FIXED_MAP_ID = 'tutorial_battlefield';
const FIXED_MODE = '玩家 vs AI';
const FIXED_PLAYER_SQUAD = 'qingqiu';

function detectDecreeEffect(logMessage: string): DecreeId | null {
  if (logMessage.includes('禁行令')) return 'forbid_movement';
  if (logMessage.includes('戒严令')) return 'martial_law';
  if (logMessage.includes('追捕令')) return 'pursuit';
  return null;
}

export default function App() {
  const [selectedDeployUnitId, setSelectedDeployUnitId] = React.useState<string | null>(null);
  const [selectedActionMode, setSelectedActionMode] = React.useState<SelectedActionMode | null>(null);
  const [drawer, setDrawer] = React.useState<'log' | 'ai' | null>(null);
  const [stats] = React.useState<unknown>(() => loadAIStats());
  const [effect, setEffect] = React.useState<DecreeId | null>(null);
  const [match, setMatch] = React.useState<MatchState>(() => createMatch(FIXED_MODE, FIXED_MAP_ID, FIXED_PLAYER_SQUAD));
  const legalActions = React.useMemo(() => generateLegalActions(match), [match]);
  const playerDeployUnits = match.units.filter((unit) => unit.squad === match.playerSquad && !unit.summon);
  const allDeployed = allFormalUnitsDeployed(match);
  const aiBatchProgress = React.useMemo<AIBatchProgress>(() => ({
    running: false,
    total: 1000,
    completed: 0,
    normalFinished: 0,
    abnormalFinished: 0,
    qingqiuWins: 0,
    tianmenWins: 0,
    draws: 0,
    percent: 0,
  }), []);

  React.useEffect(() => saveCurrentMatch(match), [match]);

  React.useEffect(() => {
    const latest = match.logs[0];
    if (latest?.type !== 'skill') return;
    const nextEffect = detectDecreeEffect(latest.message);
    if (!nextEffect) return;
    setEffect(nextEffect);
    const timeout = window.setTimeout(() => setEffect(null), 1050);
    return () => window.clearTimeout(timeout);
  }, [match.logs]);

  function startDeployment() {
    setSelectedDeployUnitId(null);
    setMatch((current) => autoDeploySquad({ ...current, phase: 'deployment' }, 'tianmen'));
  }

  function deployToTile(tileId: string) {
    if (!selectedDeployUnitId) return;
    setMatch((current) => deployUnit(current, selectedDeployUnitId, tileId));
    setSelectedDeployUnitId(null);
  }

  function startRound() {
    setMatch((current) => {
      if (!allFormalUnitsDeployed(current)) return current;
      return runAIUntilHumanOrEnd(beginFirstRound(current));
    });
  }

  function selectUnit(unitId: string | null) {
    setSelectedActionMode(null);
    setMatch((current) => ({ ...current, selectedUnitId: unitId }));
  }

  function executeAction(action: GameAction) {
    setSelectedActionMode(null);
    setMatch((current) => runAIUntilHumanOrEnd(resolveAction(current, action)));
  }

  function rejectTargetSelection() {
    setMatch((current) => addLog(current, 'action_rejected', '请选择合法目标'));
  }

  function aiStep() {
    setMatch((current) => runAIStep(current));
  }

  function aiFull() {
    setMatch((current) => runAIUntilHumanOrEnd(current, 500));
  }

  return (
    <main className="battleScreen battleApp">
      <PhaseHeader match={match} />
      <section className="battlefieldLayer">
        <BattleBoard
          locked={false}
          match={match}
          legalActions={legalActions}
          selectedActionMode={selectedActionMode}
          selectedDeployUnitId={selectedDeployUnitId}
          effect={effect}
          onAction={executeAction}
          onInvalidTarget={rejectTargetSelection}
          onSelectUnit={selectUnit}
          onDeployTile={deployToTile}
        />
      </section>
      {match.phase === 'map_preview' && (
        <div className="phasePrompt">
          <button className="primaryBattleButton" onClick={startDeployment}>开始部署</button>
        </div>
      )}
      {match.phase === 'deployment' && (
        <section className="deployActionBar actionBar">
          <div className="deployRoster">
            {playerDeployUnits.map((unit) => (
              <button
                className={`deployChip ${selectedDeployUnitId === unit.id ? 'picked' : ''}`}
                disabled={unit.deployed}
                key={unit.id}
                onClick={() => setSelectedDeployUnitId(unit.id)}
              >
                <b>{getPortraitAssetPath(unit) ? <img src={getPortraitAssetPath(unit) ?? ''} alt="" /> : unit.name.slice(0, 1)}</b>
                <span>{unit.deployed ? '已部署' : unit.name}</span>
              </button>
            ))}
          </div>
          <button className="primaryBattleButton compact" disabled={!allDeployed} onClick={startRound}>开战</button>
        </section>
      )}
      {match.phase !== 'map_preview' && match.phase !== 'deployment' && (
        <ActionPanel actions={legalActions} locked={false} onAction={executeAction} onSelectActionMode={setSelectedActionMode} onAIStep={aiStep} onAIFull={aiFull} />
      )}
      <UnitInfoPanel match={match} />
      <div className="floatingTools">
        <button onClick={() => setDrawer((current) => current === 'log' ? null : 'log')}>日志</button>
        <button onClick={() => setDrawer((current) => current === 'ai' ? null : 'ai')}>AI</button>
      </div>
      {drawer && (
        <section className="debugDrawer">
          <header>
            <b>{drawer === 'log' ? '战斗日志' : 'AI决策'}</b>
            <button onClick={() => setDrawer(null)}>关闭</button>
          </header>
          <div className="debugDrawerBody">
            {drawer === 'log' ? <BattleLog match={match} /> : <AIDebugPanel match={match} stats={stats} aiBatchProgress={aiBatchProgress} />}
          </div>
        </section>
      )}
    </main>
  );
}
