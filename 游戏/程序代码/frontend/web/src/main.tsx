import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type SquadId = 'qingqiu' | 'tianmen';
type Mode = '玩家 vs AI' | 'AI vs AI';
type TerrainId = 'plain' | 'central_objective' | 'edge_objective' | 'high_ground' | 'cover_shadow' | 'dusk_rift' | 'obstacle';
type UnitStatus = '狐印' | '迷踪' | '逃逸' | '护阵';
type TileStatus = '狐火残留' | '勘验区';
type TeamStatus = '狐火充盈';
type GlobalStatus = '禁行状态' | '戒严状态' | '追捕状态';
type MapId = 'test_map_a' | 'test_map_b' | 'test_map_c';
type Phase = 'match_created' | 'map_preview' | 'deployment' | 'round_start' | 'turn_start' | 'unit_action' | 'turn_end' | 'round_end' | 'match_end';
type ActionKind = 'move' | 'attack' | 'skill' | 'capture' | 'end_turn';

type MapTileConfig = { id: string; q: number; r: number; terrain: TerrainId; deploymentOwner?: SquadId };
type MapConfig = { id: MapId; name: string; typeNote: string; tiles: MapTileConfig[] };
type ValidationResult = { ok: boolean; errors: string[]; stats: Record<TerrainId, number>; qingqiuDeployment: number; tianmenDeployment: number; centralObjectives: number; edgeObjectives: number };
type BattlefieldTile = { id: string; q: number; r: number; terrainLayer: TerrainId; statusLayer: TileStatus[]; deploymentOwner?: SquadId; objectiveOwner?: SquadId | 'neutral' };
type Unit = { id: string; name: string; squad: SquadId; hp: number; maxHp: number; ap: number; tileId: string | null; unitLayer: true; statusLayer: UnitStatus[]; teamStatusLayer: TeamStatus[]; coreSkill: string; role: string; deployed: boolean; defeated: boolean };
type MatchLogType = 'match_created' | 'map_validated' | 'deployment_start' | 'unit_deployed' | 'deployment_complete' | 'round_start' | 'turn_start' | 'move' | 'attack' | 'skill' | 'capture' | 'turn_end' | 'round_end' | 'match_end' | 'ai_decision';
type MatchLog = { type: MatchLogType; message: string };
type ScoreBreakdown = { 据点分: number; 协同分: number; 生存分: number; 状态分: number; 位置分: number; 击杀分: number };
type CandidateAction = { id: string; kind: ActionKind; label: string; unitId: string; targetTileId?: string; targetUnitId?: string; score: number; breakdown: ScoreBreakdown };
type AIDecision = { unitName: string; candidates: CandidateAction[]; selected?: CandidateAction; result: string };
type MatchState = { id: string; mode: Mode; playerSquad: SquadId; mapId: MapId; phase: Phase; round: number; activeSquad: SquadId; activeUnitId: string | null; firstSquad: SquadId; tiles: BattlefieldTile[]; units: Unit[]; validation: ValidationResult; logs: MatchLog[]; aiDecisionLog: AIDecision[]; selectedTileId: string | null; selectedUnitId: string | null; selectedDeployUnitId: string | null; result?: string };

const TERRAIN_IDS: TerrainId[] = ['plain', 'central_objective', 'edge_objective', 'high_ground', 'cover_shadow', 'dusk_rift', 'obstacle'];
const squads: Record<SquadId, { name: string; mark: string }> = { qingqiu: { name: '青丘使团', mark: '狐' }, tianmen: { name: '天门执法队', mark: '令' } };
const terrainView: Record<TerrainId, { name: string; icon: string }> = { plain: { name: '普通格', icon: '□' }, central_objective: { name: '中央据点', icon: '坛' }, edge_objective: { name: '边缘据点', icon: '碑' }, high_ground: { name: '高台', icon: '台' }, cover_shadow: { name: '掩影', icon: '影' }, dusk_rift: { name: '黄昏裂隙', icon: '裂' }, obstacle: { name: '障碍', icon: '阻' } };
const statusMark: Record<UnitStatus | TileStatus | TeamStatus | GlobalStatus, string> = { 狐印: '印', 迷踪: '迷', 逃逸: '逃', 护阵: '护', 狐火残留: '火', 勘验区: '验', 狐火充盈: '盈', 禁行状态: '禁', 戒严状态: '戒', 追捕状态: '追' };
const mapTypeNotes: Record<MapId, string> = { test_map_a: '开阔对称图：验证基础移动、占点节奏与正面对抗。', test_map_b: '裂隙侧路图：验证黄昏裂隙、侧路收益、狐火循环与禁行令判断。', test_map_c: '障碍分流图：验证障碍绕行、路线选择与视线阻挡。' };
const coords = Array.from({ length: 25 }, (_, i) => ({ q: (i % 5) - 2, r: Math.floor(i / 5) - 2 })).map((p) => ({ ...p, id: `${p.q},${p.r}` }));

function makeMap(id: MapId): MapConfig {
  const special: Record<string, TerrainId> = { '0,0': 'central_objective', '-1,2': 'edge_objective', '1,-2': 'edge_objective', '-1,-1': 'cover_shadow', '1,1': 'cover_shadow', '-1,1': 'high_ground' };
  if (id === 'test_map_b') { special['-2,1'] = 'dusk_rift'; special['2,-1'] = 'dusk_rift'; special['1,-1'] = 'high_ground'; }
  if (id === 'test_map_c') { special['-1,0'] = 'obstacle'; special['1,0'] = 'obstacle'; special['-2,1'] = 'cover_shadow'; special['2,-1'] = 'cover_shadow'; special['1,-1'] = 'high_ground'; }
  const tiles = coords.map(({ id: tileId, q, r }) => ({ id: tileId, q, r, terrain: special[tileId] ?? 'plain', deploymentOwner: q === -2 ? 'qingqiu' as SquadId : q === 2 ? 'tianmen' as SquadId : undefined }));
  return { id, name: `${id}｜${id === 'test_map_a' ? '开阔对称图' : id === 'test_map_b' ? '裂隙侧路图' : '障碍分流图'}`, typeNote: mapTypeNotes[id], tiles };
}

const mapConfigs: Record<MapId, MapConfig> = { test_map_a: makeMap('test_map_a'), test_map_b: makeMap('test_map_b'), test_map_c: makeMap('test_map_c') };
const baseUnits: Unit[] = [
  { id: 'suling', name: '苏绫', squad: 'qingqiu', hp: 7, maxHp: 7, ap: 2, tileId: null, unitLayer: true, statusLayer: ['狐印'], teamStatusLayer: [], coreSkill: '狐步', role: '队长 / 狐印来源', deployed: false, defeated: false },
  { id: 'azhao', name: '阿照', squad: 'qingqiu', hp: 6, maxHp: 6, ap: 2, tileId: null, unitLayer: true, statusLayer: [], teamStatusLayer: [], coreSkill: '假身', role: '召唤干扰 / 支援', deployed: false, defeated: false },
  { id: 'qingluo', name: '青萝', squad: 'qingqiu', hp: 6, maxHp: 6, ap: 2, tileId: null, unitLayer: true, statusLayer: [], teamStatusLayer: [], coreSkill: '狐火引路', role: '狐火残留 / 供能', deployed: false, defeated: false },
  { id: 'liuwei', name: '琉尾', squad: 'qingqiu', hp: 5, maxHp: 5, ap: 2, tileId: null, unitLayer: true, statusLayer: ['迷踪'], teamStatusLayer: [], coreSkill: '扰弦', role: '远程断后 / 输出', deployed: false, defeated: false },
  { id: 'xuanzhao', name: '玄照', squad: 'tianmen', hp: 8, maxHp: 8, ap: 2, tileId: null, unitLayer: true, statusLayer: [], teamStatusLayer: [], coreSkill: '颁令', role: '队长 / 律令', deployed: false, defeated: false },
  { id: 'baijin', name: '白烬', squad: 'tianmen', hp: 7, maxHp: 7, ap: 2, tileId: null, unitLayer: true, statusLayer: [], teamStatusLayer: [], coreSkill: '勘验', role: '勘验区 / 反制地块', deployed: false, defeated: false },
  { id: 'chixiao', name: '赤霄', squad: 'tianmen', hp: 9, maxHp: 9, ap: 2, tileId: null, unitLayer: true, statusLayer: ['护阵'], teamStatusLayer: [], coreSkill: '护阵', role: '承伤 / 护卫', deployed: false, defeated: false },
];

function neighbors(id: string) { const [q, r] = id.split(',').map(Number); return [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]].map(([dq, dr]) => `${q + dq},${r + dr}`); }
function emptyStats(): Record<TerrainId, number> { return { plain: 0, central_objective: 0, edge_objective: 0, high_ground: 0, cover_shadow: 0, dusk_rift: 0, obstacle: 0 }; }
function validateMap(config: MapConfig): ValidationResult {
  const errors: string[] = []; const stats = emptyStats(); const ids = new Set<string>(); let qingqiuDeployment = 0; let tianmenDeployment = 0; let centralObjectives = 0; let edgeObjectives = 0;
  if (config.tiles.length !== 25) errors.push(`地图格子数量错误：当前 ${config.tiles.length}，应为 25。`);
  config.tiles.forEach((tile) => {
    if (ids.has(tile.id)) errors.push(`坐标重复：${tile.id}`); ids.add(tile.id);
    if (!TERRAIN_IDS.includes(tile.terrain)) errors.push(`非法地形：${tile.id} / ${tile.terrain}`);
    stats[tile.terrain] += 1;
    if (tile.deploymentOwner === 'qingqiu') qingqiuDeployment += 1;
    if (tile.deploymentOwner === 'tianmen') tianmenDeployment += 1;
    if (tile.terrain === 'central_objective') centralObjectives += 1;
    if (tile.terrain === 'edge_objective') edgeObjectives += 1;
    if (tile.deploymentOwner && ['central_objective', 'edge_objective'].includes(tile.terrain)) errors.push(`据点不能在部署区：${tile.id}`);
    if (tile.deploymentOwner && tile.terrain === 'obstacle') errors.push(`障碍不能在部署区：${tile.id}`);
  });
  if (qingqiuDeployment < 5) errors.push(`青丘部署格不足：${qingqiuDeployment}/5。`);
  if (tianmenDeployment < 5) errors.push(`天门部署格不足：${tianmenDeployment}/5。`);
  if (centralObjectives < 1) errors.push('缺少中央据点。');
  if (edgeObjectives < 1) errors.push('缺少边缘据点。');
  return { ok: errors.length === 0, errors, stats, qingqiuDeployment, tianmenDeployment, centralObjectives, edgeObjectives };
}
function buildBattlefield(config: MapConfig, validation: ValidationResult): BattlefieldTile[] { return validation.ok ? config.tiles.map((tile) => ({ id: tile.id, q: tile.q, r: tile.r, terrainLayer: tile.terrain, statusLayer: [] as TileStatus[], deploymentOwner: tile.deploymentOwner, objectiveOwner: tile.terrain.includes('objective') ? 'neutral' : undefined })) : []; }
function log(type: MatchLogType, message: string): MatchLog { return { type, message }; }
function createMatch(mode: Mode, mapId: MapId, playerSquad: SquadId): MatchState {
  const config = mapConfigs[mapId]; const validation = validateMap(config); const tiles = buildBattlefield(config, validation); const firstSquad: SquadId = playerSquad;
  return { id: `match_${Date.now()}`, mode, playerSquad, mapId, phase: 'map_preview', round: 0, activeSquad: firstSquad, activeUnitId: null, firstSquad, tiles, units: baseUnits.map((u) => ({ ...u, statusLayer: [...u.statusLayer], teamStatusLayer: [] })), validation, logs: [log('match_created', `创建对局：${mode} / ${config.name}`), log('map_validated', validation.ok ? '地图校验通过' : `地图校验失败：${validation.errors.join('；')}`)], aiDecisionLog: [], selectedTileId: null, selectedUnitId: null, selectedDeployUnitId: baseUnits.find((u) => u.squad === playerSquad)?.id ?? null };
}
function appendLog(match: MatchState, type: MatchLogType, message: string): MatchState { return { ...match, logs: [log(type, message), ...match.logs].slice(0, 80) }; }
function saveMatch(match: MatchState) { localStorage.setItem('xiyao_current_match', JSON.stringify(match)); localStorage.setItem('xiyao_ai_decision_log', JSON.stringify(match.aiDecisionLog)); }
function saveHistory(match: MatchState) { const old = JSON.parse(localStorage.getItem('xiyao_match_history') ?? '[]') as MatchState[]; localStorage.setItem('xiyao_match_history', JSON.stringify([match, ...old].slice(0, 20))); }
function getUnit(match: MatchState, unitId: string | null) { return match.units.find((u) => u.id === unitId) ?? null; }
function occupiedMap(match: MatchState) { return new Map(match.units.filter((u) => u.tileId && !u.defeated).map((u) => [u.tileId as string, u])); }
function pendingUnits(match: MatchState, squad: SquadId) { return match.units.filter((u) => u.squad === squad && !u.deployed); }
function allDeployed(match: MatchState) { return match.units.every((u) => u.deployed); }
function firstActiveUnit(match: MatchState, squad: SquadId) { return match.units.find((u) => u.squad === squad && u.deployed && !u.defeated) ?? null; }
function deploymentSlots(match: MatchState, squad: SquadId) { return match.tiles.filter((t) => t.deploymentOwner === squad && t.terrainLayer !== 'obstacle'); }
function autoDeploySquad(match: MatchState, squad: SquadId): MatchState { let next = match; const slots = deploymentSlots(next, squad); pendingUnits(next, squad).forEach((unit, index) => { const slot = slots[index]; if (slot) next = deployUnit(next, unit.id, slot.id, true); }); return next; }
function deployUnit(match: MatchState, unitId: string, tileId: string, silent = false): MatchState {
  const unit = getUnit(match, unitId); const tile = match.tiles.find((t) => t.id === tileId); const occupied = occupiedMap(match);
  if (!unit || !tile) return appendLog(match, 'unit_deployed', '部署失败：单位或格子不存在');
  if (tile.deploymentOwner !== unit.squad) return appendLog(match, 'unit_deployed', `${unit.name} 部署失败：不是己方部署区`);
  if (tile.terrainLayer === 'obstacle') return appendLog(match, 'unit_deployed', `${unit.name} 部署失败：障碍格不能部署`);
  if (occupied.has(tileId)) return appendLog(match, 'unit_deployed', `${unit.name} 部署失败：格子已有单位`);
  const units = match.units.map((u) => u.id === unitId ? { ...u, tileId, deployed: true } : u);
  const next = { ...match, units, selectedDeployUnitId: pendingUnits({ ...match, units }, unit.squad)[0]?.id ?? null };
  return silent ? next : appendLog(next, 'unit_deployed', `${unit.name} 部署到 ${tileId}`);
}
function startDeployment(match: MatchState): MatchState { if (!match.validation.ok) return appendLog(match, 'deployment_start', '地图校验失败，禁止部署'); let next = { ...match, phase: 'deployment' as Phase, selectedDeployUnitId: pendingUnits(match, match.playerSquad)[0]?.id ?? null }; next = appendLog(next, 'deployment_start', '进入部署阶段'); if (match.mode === 'AI vs AI') { next = autoDeploySquad(next, 'qingqiu'); next = autoDeploySquad(next, 'tianmen'); } else { next = autoDeploySquad(next, match.playerSquad === 'qingqiu' ? 'tianmen' : 'qingqiu'); } return allDeployed(next) ? completeDeployment(next) : next; }
function completeDeployment(match: MatchState): MatchState { let next = appendLog({ ...match, phase: 'round_start', round: 1, activeSquad: match.firstSquad }, 'deployment_complete', '双方单位部署完成'); next = appendLog(next, 'round_start', '大回合 1 开始'); return enterTurnStart(next); }
function enterTurnStart(match: MatchState): MatchState { const active = firstActiveUnit(match, match.activeSquad); const units = match.units.map((u) => u.squad === match.activeSquad ? { ...u, ap: 2 } : u); const next = { ...match, units, phase: 'unit_action' as Phase, activeUnitId: active?.id ?? null, selectedUnitId: active?.id ?? null }; return appendLog(next, 'turn_start', `${squads[match.activeSquad].name} 行动开始：${active?.name ?? '无可行动单位'}`); }
function endTurn(match: MatchState): MatchState { let next = appendLog({ ...match, phase: 'turn_end' }, 'turn_end', `${squads[match.activeSquad].name} 回合结束`); if (match.activeSquad === 'tianmen') { next = appendLog({ ...next, phase: 'round_end' }, 'round_end', `大回合 ${match.round} 结束`); if (match.round >= 3) return finishMatch(next); next = appendLog({ ...next, round: match.round + 1, activeSquad: 'qingqiu', phase: 'round_start' }, 'round_start', `大回合 ${match.round + 1} 开始`); return enterTurnStart(next); } return enterTurnStart({ ...next, activeSquad: 'tianmen', phase: 'turn_start' }); }
function finishMatch(match: MatchState): MatchState { const q = match.units.filter((u) => u.squad === 'qingqiu' && !u.defeated).length; const t = match.units.filter((u) => u.squad === 'tianmen' && !u.defeated).length; const result = q === t ? '平局：存活单位相同' : q > t ? '青丘使团胜利：存活单位更多' : '天门执法队胜利：存活单位更多'; const next = appendLog({ ...match, phase: 'match_end', result }, 'match_end', result); saveHistory(next); localStorage.setItem('xiyao_ai_stats', JSON.stringify({ lastResult: result, mapId: match.mapId, mode: match.mode, rounds: match.round })); return next; }
function legalMoveTargets(match: MatchState, unit: Unit | null) { if (!unit?.tileId) return []; const occupied = occupiedMap(match); return neighbors(unit.tileId).filter((id) => match.tiles.some((t) => t.id === id && t.terrainLayer !== 'obstacle') && !occupied.has(id)); }
function legalAttackTargets(match: MatchState, unit: Unit | null) { if (!unit?.tileId) return []; const occupied = occupiedMap(match); return neighbors(unit.tileId).map((id) => occupied.get(id)).filter((u): u is Unit => Boolean(u && u.squad !== unit.squad && !u.defeated)); }
function moveUnit(match: MatchState, unitId: string, tileId: string): MatchState { const unit = getUnit(match, unitId); if (!unit || unit.ap <= 0 || !legalMoveTargets(match, unit).includes(tileId)) return appendLog(match, 'move', '移动失败：目标非法或AP不足'); const units = match.units.map((u) => u.id === unitId ? { ...u, tileId, ap: Math.max(0, u.ap - 1) } : u); return appendLog({ ...match, units, selectedTileId: tileId }, 'move', `${unit.name} 移动到 ${tileId}`); }
function attackUnit(match: MatchState, unitId: string, targetUnitId: string): MatchState { const unit = getUnit(match, unitId); const target = getUnit(match, targetUnitId); if (!unit || !target || unit.ap <= 0) return appendLog(match, 'attack', '攻击失败：目标非法或AP不足'); const units = match.units.map((u) => u.id === targetUnitId ? { ...u, hp: Math.max(0, u.hp - 2), defeated: u.hp - 2 <= 0 } : u.id === unitId ? { ...u, ap: Math.max(0, u.ap - 1) } : u); return appendLog({ ...match, units }, 'attack', `${unit.name} 攻击 ${target.name}，造成2点伤害`); }
function useSkill(match: MatchState, unitId: string): MatchState { const unit = getUnit(match, unitId); if (!unit || unit.ap <= 0) return appendLog(match, 'skill', '技能失败：AP不足'); let tiles = match.tiles; let units = match.units.map((u) => u.id === unitId ? { ...u, ap: Math.max(0, u.ap - 1) } : u); if (unit.coreSkill === '狐火引路' && unit.tileId) tiles = tiles.map((t) => t.id === unit.tileId ? { ...t, statusLayer: Array.from(new Set([...t.statusLayer, '狐火残留' as TileStatus])) } : t); if (unit.coreSkill === '勘验' && unit.tileId) tiles = tiles.map((t) => t.id === unit.tileId ? { ...t, statusLayer: Array.from(new Set([...t.statusLayer, '勘验区' as TileStatus])) } : t); return appendLog({ ...match, tiles, units }, 'skill', `${unit.name} 使用核心技能：${unit.coreSkill}`); }
function captureObjective(match: MatchState, unitId: string): MatchState { const unit = getUnit(match, unitId); if (!unit?.tileId || unit.ap <= 0) return appendLog(match, 'capture', '占领失败：单位非法或AP不足'); const tile = match.tiles.find((t) => t.id === unit.tileId); if (!tile?.objectiveOwner) return appendLog(match, 'capture', `${unit.name} 占领失败：当前格不是据点中心`); const tiles = match.tiles.map((t) => t.id === tile.id ? { ...t, objectiveOwner: unit.squad } : t); const units = match.units.map((u) => u.id === unitId ? { ...u, ap: Math.max(0, u.ap - 1) } : u); return appendLog({ ...match, tiles, units }, 'capture', `${unit.name} 占领 ${terrainView[tile.terrainLayer].name}`); }
function scoreAction(kind: ActionKind, label: string, unit: Unit, targetTileId?: string, targetUnitId?: string): CandidateAction { const breakdown: ScoreBreakdown = { 据点分: kind === 'capture' ? 30 : targetTileId === '0,0' ? 24 : 8, 协同分: kind === 'skill' ? 20 : 10, 生存分: kind === 'move' ? 16 : 10, 状态分: kind === 'skill' ? 16 : 8, 位置分: kind === 'move' ? 18 : 6, 击杀分: kind === 'attack' ? 22 : 0 }; const score = Object.values(breakdown).reduce((a, b) => a + b, 0); return { id: `${unit.id}_${kind}_${targetTileId ?? targetUnitId ?? 'self'}`, kind, label, unitId: unit.id, targetTileId, targetUnitId, score, breakdown }; }
function generateAIActions(match: MatchState, unit: Unit): CandidateAction[] { const moves = legalMoveTargets(match, unit).map((id) => scoreAction('move', `移动到 ${id}`, unit, id)); const attacks = legalAttackTargets(match, unit).map((target) => scoreAction('attack', `攻击 ${target.name}`, unit, undefined, target.id)); const actions = [...moves, ...attacks, scoreAction('skill', `${unit.coreSkill}`, unit), scoreAction('capture', '占领当前据点', unit)]; return actions.sort((a, b) => b.score - a.score); }
function runAI(match: MatchState): MatchState { const unit = getUnit(match, match.activeUnitId) ?? firstActiveUnit(match, match.activeSquad); if (!unit) return endTurn(match); const candidates = generateAIActions(match, unit); const selected = candidates[0]; let next = match; if (selected.kind === 'move' && selected.targetTileId) next = moveUnit(match, unit.id, selected.targetTileId); if (selected.kind === 'attack' && selected.targetUnitId) next = attackUnit(match, unit.id, selected.targetUnitId); if (selected.kind === 'skill') next = useSkill(match, unit.id); if (selected.kind === 'capture') next = captureObjective(match, unit.id); const decision: AIDecision = { unitName: unit.name, candidates, selected, result: `${unit.name} 执行：${selected.label}` }; next = { ...next, aiDecisionLog: [decision, ...next.aiDecisionLog].slice(0, 40) }; return appendLog(next, 'ai_decision', `AI决策：${decision.result}`); }
function isAIControlled(match: MatchState, squad: SquadId) { return match.mode === 'AI vs AI' || squad !== match.playerSquad; }

function App() {
  const [mode, setMode] = React.useState<Mode>('玩家 vs AI'); const [mapId, setMapId] = React.useState<MapId>('test_map_a'); const [playerSquad, setPlayerSquad] = React.useState<SquadId>('qingqiu');
  const [match, setMatch] = React.useState<MatchState>(() => createMatch('玩家 vs AI', 'test_map_a', 'qingqiu'));
  const activeUnit = getUnit(match, match.activeUnitId); const selectedUnit = getUnit(match, match.selectedUnitId); const selectedTile = match.tiles.find((t) => t.id === match.selectedTileId) ?? null; const latestAI = match.aiDecisionLog[0]; const moveTargets = legalMoveTargets(match, activeUnit); const attackTargets = legalAttackTargets(match, activeUnit).map((u) => u.tileId).filter(Boolean) as string[];
  React.useEffect(() => { saveMatch(match); }, [match]);
  React.useEffect(() => { if (match.phase === 'deployment' && allDeployed(match)) setMatch((m) => completeDeployment(m)); }, [match.phase, match.units]);
  function newMatch() { setMatch(createMatch(mode, mapId, playerSquad)); }
  function setNext(next: MatchState) { setMatch(next); }
  function clickTile(tile: BattlefieldTile) {
    if (match.phase === 'map_preview') { setNext({ ...appendLog(match, 'map_validated', `查看格子：${tile.id} / ${terrainView[tile.terrainLayer].name}`), selectedTileId: tile.id }); return; }
    if (match.phase === 'deployment') { const unitId = match.selectedDeployUnitId; if (!unitId) { setNext(appendLog(match, 'unit_deployed', '没有待部署单位')); return; } const next = deployUnit({ ...match, selectedTileId: tile.id }, unitId, tile.id); setNext(allDeployed(next) ? completeDeployment(next) : next); return; }
    const occupied = occupiedMap(match).get(tile.id); if (occupied && occupied.squad === match.activeSquad) { setNext({ ...match, selectedUnitId: occupied.id, activeUnitId: occupied.id, selectedTileId: tile.id }); return; }
    if (occupied && activeUnit && occupied.squad !== activeUnit.squad && attackTargets.includes(tile.id)) { setNext(attackUnit(match, activeUnit.id, occupied.id)); return; }
    if (activeUnit && moveTargets.includes(tile.id)) { setNext(moveUnit(match, activeUnit.id, tile.id)); return; }
    setNext({ ...appendLog(match, tile.objectiveOwner ? 'capture' : 'map_validated', tile.objectiveOwner ? `查看据点：${terrainView[tile.terrainLayer].name} / ${tile.objectiveOwner}` : `查看格子：${tile.id}`), selectedTileId: tile.id });
  }
  function startFirstRound() { setMatch(completeDeployment(match)); }
  function runAiStep() { setMatch(runAI(match)); }
  function playerAction(kind: ActionKind) { if (!activeUnit) return; if (kind === 'skill') setMatch(useSkill(match, activeUnit.id)); if (kind === 'capture') setMatch(captureObjective(match, activeUnit.id)); if (kind === 'end_turn') setMatch(endTurn(match)); }
  return <main className="shell"><PhaseHeader match={match} activeUnit={activeUnit} /><section className="homebar"><div className="field"><span>模式</span><select value={mode} onChange={(e) => setMode(e.target.value as Mode)}><option>玩家 vs AI</option><option>AI vs AI</option></select></div><div className="field"><span>地图</span><select value={mapId} onChange={(e) => setMapId(e.target.value as MapId)}><option value="test_map_a">test_map_a</option><option value="test_map_b">test_map_b</option><option value="test_map_c">test_map_c</option></select></div><div className="field"><span>小队</span><select value={playerSquad} onChange={(e) => setPlayerSquad(e.target.value as SquadId)}><option value="qingqiu">青丘使团</option><option value="tianmen">天门执法队</option></select></div><button onClick={newMatch}>创建对局 / 进入预览</button></section>{match.phase === 'map_preview' && <MapPreview match={match} onStart={() => setMatch(startDeployment(match))} />}{match.phase === 'deployment' && <DeploymentPanel match={match} onPick={(id) => setMatch({ ...match, selectedDeployUnitId: id })} onAuto={() => setMatch(autoDeploySquad(autoDeploySquad(match, 'qingqiu'), 'tianmen'))} onStart={startFirstRound} />}<section className="gamegrid"><BattleBoard match={match} moveTargets={moveTargets} attackTargets={attackTargets} onTile={clickTile} /><aside className="side"><UnitInfoPanel unit={selectedUnit ?? activeUnit} tile={selectedTile} /><ActionPanel match={match} activeUnit={activeUnit} aiControlled={isAIControlled(match, match.activeSquad)} onAI={runAiStep} onAction={playerAction} /><AIDebugPanel decision={latestAI} visible={match.mode === 'AI vs AI'} /></aside></section><BattleLog logs={match.logs} /></main>;
}
function PhaseHeader({ match, activeUnit }: { match: MatchState; activeUnit: Unit | null }) { return <header className="phase"><b>阶段：{match.phase}</b><span>大回合：{match.round || '-'}/3</span><span>行动方：{squads[match.activeSquad].name}</span><span>行动单位：{activeUnit?.name ?? '-'}</span><span>AP：{activeUnit?.ap ?? '-'}</span><span>模式：{match.mode}</span><span>地图：{match.mapId}</span><span>本地保存：LocalStorage</span></header>; }
function MapPreview({ match, onStart }: { match: MatchState; onStart: () => void }) { const config = mapConfigs[match.mapId]; const v = match.validation; return <section className="card preview"><h2>地图预览</h2><p>{config.name}</p><p>ID：{config.id}</p><p>{config.typeNote}</p><div className="stats">{TERRAIN_IDS.map((id) => <span key={id}>{terrainView[id].name}：{v.stats[id]}</span>)}</div><p>据点：中央 {v.centralObjectives} / 边缘 {v.edgeObjectives}</p><p>部署区：青丘 {v.qingqiuDeployment} / 天门 {v.tianmenDeployment}</p><p className={v.ok ? 'ok' : 'bad'}>校验结果：{v.ok ? '通过' : '失败'}</p>{!v.ok && <ul>{v.errors.map((e) => <li key={e}>{e}</li>)}</ul>}<button disabled={!v.ok} onClick={onStart}>开始部署</button></section>; }
function DeploymentPanel({ match, onPick, onAuto, onStart }: { match: MatchState; onPick: (id: string) => void; onAuto: () => void; onStart: () => void }) { return <section className="card deployment"><h2>部署阶段</h2><div className="deployCols">{(['qingqiu','tianmen'] as SquadId[]).map((squad) => <div key={squad}><h3>{squads[squad].name}</h3>{match.units.filter((u) => u.squad === squad).map((u) => <button key={u.id} disabled={u.deployed} className={match.selectedDeployUnitId === u.id ? 'picked' : ''} onClick={() => onPick(u.id)}>{u.name} {u.deployed ? `已部署 ${u.tileId}` : '待部署'}</button>)}</div>)}</div><button onClick={onAuto}>自动部署双方</button><button disabled={!allDeployed(match)} onClick={onStart}>开始第一回合</button></section>; }
function BattleBoard({ match, moveTargets, attackTargets, onTile }: { match: MatchState; moveTargets: string[]; attackTargets: string[]; onTile: (tile: BattlefieldTile) => void }) { const occupied = occupiedMap(match); return <section className="map"><div className="board">{match.tiles.map((tile) => { const unit = occupied.get(tile.id); const cls = ['hex', tile.terrainLayer, tile.deploymentOwner ? `deploy-${tile.deploymentOwner}` : '', match.selectedTileId === tile.id ? 'selected' : '', moveTargets.includes(tile.id) ? 'moveable' : '', attackTargets.includes(tile.id) ? 'attackable' : ''].join(' '); return <button key={tile.id} className={cls} style={{ left: 360 + tile.q * 82 + tile.r * 41, top: 210 + tile.r * 70 }} onClick={() => onTile(tile)}><span className="terrainLayer">{terrainView[tile.terrainLayer].icon}</span><span className="coord">{tile.id}</span>{tile.objectiveOwner && <span className="owner">{tile.objectiveOwner === 'neutral' ? '中立' : squads[tile.objectiveOwner].mark}</span>}<span className="statusLayer">{tile.statusLayer.map((s) => <b key={s}>{statusMark[s]}</b>)}</span>{unit && <span className={`unitLayer ${unit.squad}`}>{squads[unit.squad].mark}<i>{unit.name.slice(0,1)}</i><em>{unit.statusLayer.map((s) => statusMark[s]).join('')}</em></span>}<span className="highlightLayer" /></button>; })}</div></section>; }
function UnitInfoPanel({ unit, tile }: { unit: Unit | null; tile: BattlefieldTile | null }) { return <section className="card"><h2>单位信息</h2>{unit ? <><p>{unit.name}｜{squads[unit.squad].name}</p><p>HP {unit.hp}/{unit.maxHp} ｜ AP {unit.ap}</p><p>状态：{unit.statusLayer.join('、') || '无'}</p><p>小队状态：{unit.teamStatusLayer.join('、') || '无'}</p><p>核心技能：{unit.coreSkill}</p><p>{unit.role}</p></> : <p>未选中单位</p>}<h3>格子信息</h3>{tile ? <p>{tile.id}｜{terrainView[tile.terrainLayer].name}｜部署：{tile.deploymentOwner ? squads[tile.deploymentOwner].name : '无'}｜据点：{tile.objectiveOwner ?? '无'}</p> : <p>未选中格</p>}</section>; }
function ActionPanel({ match, activeUnit, aiControlled, onAI, onAction }: { match: MatchState; activeUnit: Unit | null; aiControlled: boolean; onAI: () => void; onAction: (kind: ActionKind) => void }) { const disabled = match.phase !== 'unit_action' || !activeUnit; return <section className="card"><h2>动作按钮区</h2>{aiControlled ? <button disabled={disabled} onClick={onAI}>执行AI一步</button> : <><button disabled={disabled} onClick={() => onAction('skill')}>技能</button><button disabled={disabled} onClick={() => onAction('capture')}>占领</button><button disabled={disabled} onClick={() => onAction('end_turn')}>结束行动</button></>}<p>移动：点击可移动格。攻击：点击高亮敌方。</p></section>; }
function AIDebugPanel({ decision, visible }: { decision?: AIDecision; visible: boolean }) { if (!visible) return null; return <section className="card ai"><h2>AI决策面板</h2>{decision ? <><p>单位：{decision.unitName}</p><p>最终选择：{decision.selected?.label ?? '-'}</p><p>执行结果：{decision.result}</p><h3>候选动作</h3>{decision.candidates.map((c) => <div key={c.id} className="candidate"><b>{c.label} {c.score}</b><small>据点分 {c.breakdown.据点分} / 协同分 {c.breakdown.协同分} / 生存分 {c.breakdown.生存分} / 状态分 {c.breakdown.状态分} / 位置分 {c.breakdown.位置分} / 击杀分 {c.breakdown.击杀分}</small></div>)}</> : <p>等待AI行动。</p>}</section>; }
function BattleLog({ logs }: { logs: MatchLog[] }) { return <footer className="log"><strong>战斗日志</strong>{logs.map((item, i) => <p key={`${item.type}-${i}`}><b>{item.type}</b>｜{item.message}</p>)}</footer>; }

createRoot(document.getElementById('root')!).render(<App />);
