import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { mapConfigs, type MapId, type SquadId, type TerrainId } from './data/maps';

type Mode = '玩家 vs AI' | 'AI vs AI';
type Phase = 'map_preview' | 'deployment' | 'unit_action' | 'match_end';
type Unit = { id: string; name: string; squad: SquadId; hp: number; ap: number; tileId: string | null; deployed: boolean };
type Tile = { id: string; q: number; r: number; terrainLayer: TerrainId; deploymentOwner?: SquadId; objectiveOwner?: SquadId | 'neutral'; statusLayer: string[] };
type LogItem = { type: string; message: string };
type Match = { mode: Mode; mapId: MapId; phase: Phase; round: number; activeSquad: SquadId; tiles: Tile[]; units: Unit[]; logs: LogItem[]; selectedUnitId: string | null; result?: string };

const squads: Record<SquadId, { name: string; mark: string }> = { qingqiu: { name: '青丘使团', mark: '狐' }, tianmen: { name: '天门执法队', mark: '令' } };
const terrainName: Record<TerrainId, string> = { plain: '普通格', central_objective: '中央据点', edge_objective: '边缘据点', high_ground: '高台', cover_shadow: '掩影', dusk_rift: '黄昏裂隙', obstacle: '障碍' };
const terrainIcon: Record<TerrainId, string> = { plain: '□', central_objective: '坛', edge_objective: '碑', high_ground: '台', cover_shadow: '影', dusk_rift: '裂', obstacle: '阻' };

const unitSeed: Unit[] = [
  { id: 'suling', name: '苏绫', squad: 'qingqiu', hp: 7, ap: 2, tileId: null, deployed: false },
  { id: 'azhao', name: '阿照', squad: 'qingqiu', hp: 6, ap: 2, tileId: null, deployed: false },
  { id: 'qingluo', name: '青萝', squad: 'qingqiu', hp: 6, ap: 2, tileId: null, deployed: false },
  { id: 'liuwei', name: '琉尾', squad: 'qingqiu', hp: 5, ap: 2, tileId: null, deployed: false },
  { id: 'xuanzhao', name: '玄照', squad: 'tianmen', hp: 8, ap: 2, tileId: null, deployed: false },
  { id: 'baijin', name: '白烬', squad: 'tianmen', hp: 7, ap: 2, tileId: null, deployed: false },
  { id: 'chixiao', name: '赤霄', squad: 'tianmen', hp: 9, ap: 2, tileId: null, deployed: false },
];

function validateMap(mapId: MapId) {
  const config = mapConfigs[mapId];
  const ids = new Set(config.tiles.map((t) => t.id));
  const qingqiuDeployment = config.tiles.filter((t) => t.deploymentOwner === 'qingqiu').length;
  const tianmenDeployment = config.tiles.filter((t) => t.deploymentOwner === 'tianmen').length;
  const errors: string[] = [];
  if (config.tiles.length !== 25) errors.push('地图必须为25格');
  if (ids.size !== config.tiles.length) errors.push('地图坐标不能重复');
  if (qingqiuDeployment < 5) errors.push('青丘部署格不足');
  if (tianmenDeployment < 5) errors.push('天门部署格不足');
  if (!config.tiles.some((t) => t.terrain === 'central_objective')) errors.push('缺少中央据点');
  if (!config.tiles.some((t) => t.terrain === 'edge_objective')) errors.push('缺少边缘据点');
  if (config.tiles.some((t) => t.deploymentOwner && t.terrain === 'obstacle')) errors.push('部署区不能是障碍');
  if (config.tiles.some((t) => t.deploymentOwner && (t.terrain === 'central_objective' || t.terrain === 'edge_objective'))) errors.push('据点不能在部署区');
  return { ok: errors.length === 0, errors, qingqiuDeployment, tianmenDeployment };
}

function createMatch(mode: Mode, mapId: MapId): Match {
  const config = mapConfigs[mapId];
  const validation = validateMap(mapId);
  const tiles: Tile[] = validation.ok ? config.tiles.map((t) => ({ id: t.id, q: t.q, r: t.r, terrainLayer: t.terrain, deploymentOwner: t.deploymentOwner, objectiveOwner: t.terrain.includes('objective') ? 'neutral' : undefined, statusLayer: [] })) : [];
  return { mode, mapId, phase: 'map_preview', round: 0, activeSquad: 'qingqiu', tiles, units: unitSeed.map((u) => ({ ...u })), selectedUnitId: null, logs: [{ type: 'match_created', message: `创建对局：${mode} / ${config.name}` }, { type: 'map_validated', message: validation.ok ? '地图校验通过' : validation.errors.join('；') }] };
}

function log(match: Match, type: string, message: string): Match { return { ...match, logs: [{ type, message }, ...match.logs].slice(0, 120) }; }
function occupied(match: Match) { return new Set(match.units.filter((u) => u.tileId).map((u) => u.tileId)); }
function deployAll(match: Match): Match {
  const used = occupied(match);
  const units = match.units.map((unit) => {
    if (unit.deployed) return unit;
    const slot = match.tiles.find((t) => t.deploymentOwner === unit.squad && !used.has(t.id));
    if (!slot) return unit;
    used.add(slot.id);
    return { ...unit, tileId: slot.id, deployed: true };
  });
  return log({ ...match, units, phase: 'unit_action', round: 1 }, 'deployment_complete', '双方单位部署完成');
}
function save(match: Match) { localStorage.setItem('xiyao_current_match', JSON.stringify(match)); }

function App() {
  const [mode, setMode] = React.useState<Mode>('AI vs AI');
  const [mapId, setMapId] = React.useState<MapId>('test_map_a');
  const [match, setMatch] = React.useState<Match>(() => createMatch('AI vs AI', 'test_map_a'));
  React.useEffect(() => save(match), [match]);
  const config = mapConfigs[match.mapId];
  const validation = validateMap(match.mapId);
  const selectedUnit = match.units.find((u) => u.id === match.selectedUnitId) ?? null;

  function start() { setMatch(createMatch(mode, mapId)); }
  function startDeployment() { if (!validation.ok) return; setMatch(log({ ...match, phase: 'deployment' }, 'deployment_start', '进入部署阶段')); }
  function runAiStep() { setMatch((m) => log(m, 'ai_decision', 'AI执行一步：当前为本地调试占位')); }
  function runAiFull() { setMatch((m) => log({ ...m, phase: 'match_end', result: 'AI本地调试结束' }, 'match_end', 'AI跑完整局：当前为本地调试占位')); }
  function runAi1000() { localStorage.setItem('xiyao_ai_stats', JSON.stringify({ games: 1000, note: '本地统计占位，待接入正式AI评分表' })); setMatch((m) => log(m, 'ai_decision', '本地1000局测试完成：统计已写入LocalStorage')); }

  return <main className="shell">
    <header className="phase"><b>阶段：{match.phase}</b><span>大回合：{match.round || '-'}</span><span>行动方：{squads[match.activeSquad].name}</span><span>模式：{match.mode}</span><span>地图：{match.mapId}</span><span>本地保存：LocalStorage</span></header>
    <section className="homebar"><div className="field"><span>模式</span><select value={mode} onChange={(e) => setMode(e.target.value as Mode)}><option>玩家 vs AI</option><option>AI vs AI</option></select></div><div className="field"><span>地图</span><select value={mapId} onChange={(e) => setMapId(e.target.value as MapId)}><option value="test_map_a">test_map_a</option><option value="test_map_b">test_map_b</option><option value="test_map_c">test_map_c</option></select></div><button onClick={start}>创建对局 / 进入预览</button></section>
    {match.phase === 'map_preview' && <section className="card preview"><h2>地图预览</h2><p>{config.name}</p><p>{config.typeNote}</p><p>部署区：青丘 {validation.qingqiuDeployment} / 天门 {validation.tianmenDeployment}</p><p className={validation.ok ? 'ok' : 'bad'}>校验结果：{validation.ok ? '通过' : validation.errors.join('；')}</p><button disabled={!validation.ok} onClick={startDeployment}>开始部署</button></section>}
    {match.phase === 'deployment' && <section className="card deployment"><h2>部署阶段</h2><p>当前版本使用本地配置自动部署，后续改为逐个点击部署。</p><button onClick={() => setMatch(deployAll(match))}>自动部署双方</button></section>}
    <section className="gamegrid"><section className="map"><div className="board">{match.tiles.map((tile) => { const unit = match.units.find((u) => u.tileId === tile.id); return <button key={tile.id} className={`hex ${tile.terrainLayer} ${tile.deploymentOwner ? `deploy-${tile.deploymentOwner}` : ''}`} style={{ left: 360 + tile.q * 82 + tile.r * 41, top: 210 + tile.r * 70 }} onClick={() => setMatch({ ...match, selectedUnitId: unit?.id ?? null })}><span className="terrainLayer">{terrainIcon[tile.terrainLayer]}</span><span className="coord">{tile.id}</span>{tile.objectiveOwner && <span className="owner">{tile.objectiveOwner === 'neutral' ? '中立' : squads[tile.objectiveOwner].mark}</span>}{unit && <span className={`unitLayer ${unit.squad}`}>{squads[unit.squad].mark}<i>{unit.name.slice(0, 1)}</i></span>}</button>; })}</div></section><aside className="side"><section className="card"><h2>单位信息</h2>{selectedUnit ? <><p>{selectedUnit.name}｜{squads[selectedUnit.squad].name}</p><p>HP {selectedUnit.hp} ｜ AP {selectedUnit.ap}</p></> : <p>未选中单位</p>}<h2>动作按钮区</h2><button disabled={match.phase !== 'unit_action'} onClick={runAiStep}>执行AI一步</button><button disabled={match.phase === 'match_end'} onClick={runAiFull}>AI跑完整局</button><button onClick={runAi1000}>本地1000局测试</button></section><section className="card ai"><h2>AI决策面板</h2><p>等待接入正式 AI行为评分表.md。</p></section></aside></section>
    <footer className="log"><strong>战斗日志</strong>{match.logs.map((item, i) => <p key={`${item.type}-${i}`}><b>{item.type}</b>｜{item.message}</p>)}</footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
