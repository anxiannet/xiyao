import React from 'react';
import { runAIUntilHumanOrEnd, runAIStep } from '../ai/aiRunner';
import { autoDeploySquad, deployUnit, allFormalUnitsDeployed } from '../engine/deployment';
import { generateLegalActions } from '../engine/actionGenerator';
import { resolveAction } from '../engine/actionResolver';
import { createMatch } from '../engine/matchFactory';
import { validateMap } from '../engine/mapValidator';
import { beginFirstRound } from '../engine/turnManager';
import type { DecreeId, GameAction, MatchState } from '../engine/rules';
import { mapConfigs } from '../data/maps';
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
import type { AIBatchProgress } from '../ai/aiSimulator';

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
  const [stats] = React.useState<unknown>(() => loadAIStats());
  const [effect, setEffect] = React.useState<DecreeId | null>(null);
  const [match, setMatch] = React.useState<MatchState>(() => createMatch(FIXED_MODE, FIXED_MAP_ID, FIXED_PLAYER_SQUAD));
  const legalActions = React.useMemo(() => generateLegalActions(match), [match]);
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
    const validation = validateMap(mapConfigs[match.mapId]);
    if (!validation.ok) return;
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

  return (
    <main className="battleScreen">
      <PhaseHeader match={match} />
      <section className="battleMain">
        <BattleBoard
          locked={false}
          match={match}
          legalActions={legalActions}
          selectedDeployUnitId={selectedDeployUnitId}
          effect={effect}
          onSelectUnit={selectUnit}
          onDeployTile={deployToTile}
        />
        <section className="belowMap">
          {match.phase === 'map_preview' && <MapPreview locked={false} mapId={match.mapId} onStartDeployment={startDeployment} />}
          {match.phase === 'deployment' && (
            <DeploymentPanel
              locked={false}
              match={match}
              selectedDeployUnitId={selectedDeployUnitId}
              onPickUnit={setSelectedDeployUnitId}
              onAutoDeployAI={() => setMatch((current) => autoDeploySquad(current, 'tianmen'))}
              onStartRound={startRound}
            />
          )}
          <UnitInfoPanel match={match} />
          <ActionPanel actions={legalActions} locked={false} onAction={executeAction} onAIStep={aiStep} onAIFull={aiFull} />
          <AIDebugPanel match={match} stats={stats} aiBatchProgress={aiBatchProgress} />
          <BattleLog match={match} />
        </section>
      </section>
    </main>
  );
}
