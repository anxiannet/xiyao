import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type SquadId = 'qingqiu' | 'tianmen';
type Mode = '玩家 vs AI' | 'AI vs AI';
type TerrainId = 'plain' | 'central_objective' | 'edge_objective' | 'high_ground' | 'cover_shadow' | 'dusk_rift' | 'obstacle';
type StatusId = '狐印' | '迷踪' | '逃逸' | '护阵' | '狐火残留' | '勘验区' | '狐火充盈';
type MapId = 'test_map_a' | 'test_map_b' | 'test_map_c';
type Action = '查看' | '移动' | '攻击' | '技能' | '占领';

type Tile = { id: string; q: number; r: number; terrain: TerrainId; deploy?: SquadId; owner?: SquadId | 'neutral'; statuses: StatusId[] };
type Unit = { id: string; name: string; squad: SquadId; hp: number; maxHp: number; ap: number; tileId: string; statuses: StatusId[]; coreSkill: string; role: string };

const squads: Record<SquadId, { name: string; mark: string }> = {
  qingqiu: { name: '青丘使团', mark: '狐' },
  tianmen: { name: '天门执法队', mark: '令' },
};

const terrain: Record<TerrainId, { name: string; icon: string; note: string }> = {
  plain: { name: '普通格', icon: '□', note: '无特殊规则' },
  central_objective: { name: '中央据点', icon: '坛', note: '归属方结算 +2 气运' },
  edge_objective: { name: '边缘据点', icon: '碑', note: '归属方结算 +1 气运' },
  high_ground: { name: '高台', icon: '台', note: '远程攻击 RNG +1' },
  cover_shadow: { name: '掩影', icon: '影', note: '防御方 DEF_DICE +1' },
  dusk_rift: { name: '黄昏裂隙', icon: '裂', note: '青丘经过 +1 狐火' },
  obstacle: { name: '障碍', icon: '阻', note: '不可进入，阻挡移动和直线视野' },
};

const statusIcon: Record<StatusId, string> = { 狐印: '印', 迷踪: '迷', 逃逸: '逃', 护阵: '护', 狐火残留: '火', 勘验区: '验', 狐火充盈: '盈' };
const mapInfo: Record<MapId, string> = { test_map_a: '开阔对称图', test_map_b: '裂隙侧路图', test_map_c: '障碍分流图' };
const coords = Array.from({ length: 25 }, (_, i) => ({ q: (i % 5) - 2, r: Math.floor(i / 5) - 2 })).map((p) => ({ ...p, id: `${p.q},${p.r}` }));

function buildTiles(mapId: MapId): Tile[] {
  const special: Record<string, TerrainId> = { '0,0': 'central_objective', '-2,0': 'edge_objective', '2,0': 'edge_objective', '-1,-1': 'cover_shadow', '1,1': 'cover_shadow', '-1,1': 'high_ground', '1,-1': 'high_ground' };
  if (mapId === 'test_map_b') { special['-2,1'] = 'dusk_rift'; special['2,-1'] = 'dusk_rift'; }
  if (mapId === 'test_map_c') { special['-1,0'] = 'obstacle'; special['1,0'] = 'obstacle'; special['-2,1'] = 'cover_shadow'; special['2,-1'] = 'cover_shadow'; }
  return coords.map(({ id, q, r }) => ({ id, q, r, terrain: special[id] ?? 'plain', deploy: q === -2 ? 'qingqiu' : q === 2 ? 'tianmen' : undefined, owner: ['0,0', '-2,0', '2,0'].includes(id) ? 'neutral' : undefined, statuses: mapId === 'test_map_b' && ['-1,1', '1,-1'].includes(id) ? ['狐火残留'] : mapId === 'test_map_c' && id === '0,1' ? ['勘验区'] : [] }));
}

const baseUnits: Unit[] = [
  { id: 'suling', name: '苏绫', squad: 'qingqiu', hp: 7, maxHp: 7, ap: 2, tileId: '-2,-2', statuses: ['狐印'], coreSkill: '狐步', role: '队长 / 狐印来源' },
  { id: 'azhao', name: '阿照', squad: 'qingqiu', hp: 6, maxHp: 6, ap: 2, tileId: '-2,-1', statuses: [], coreSkill: '假身', role: '召唤干扰 / 支援' },
  { id: 'qingluo', name: '青萝', squad: 'qingqiu', hp: 6, maxHp: 6, ap: 2, tileId: '-2,1', statuses: [], coreSkill: '狐火引路', role: '狐火残留 / 供能' },
  { id: 'liuwei', name: '琉尾', squad: 'qingqiu', hp: 5, maxHp: 5, ap: 2, tileId: '-2,2', statuses: ['迷踪'], coreSkill: '扰弦', role: '远程断后 / 输出' },
  { id: 'xuanzhao', name: '玄照', squad: 'tianmen', hp: 8, maxHp: 8, ap: 2, tileId: '2,-2', statuses: [], coreSkill: '颁令', role: '队长 / 律令' },
  { id: 'baijin', name: '白烬', squad: 'tianmen', hp: 7, maxHp: 7, ap: 2, tileId: '2,0', statuses: ['勘验区'], coreSkill: '勘验', role: '勘验区 / 反制地块' },
  { id: 'chixiao', name: '赤霄', squad: 'tianmen', hp: 9, maxHp: 9, ap: 2, tileId: '2,2', statuses: ['护阵'], coreSkill: '护阵', role: '承伤 / 护卫' },
];

function neighbors(id: string) {
  const [q, r] = id.split(',').map(Number);
  return [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]].map(([dq, dr]) => `${q + dq},${r + dr}`);
}

function App() {
  const [screen, setScreen] = React.useState<'home' | 'battle'>('home');
  const [mode, setMode] = React.useState<Mode>('玩家 vs AI');
  const [mapId, setMapId] = React.useState<MapId>('test_map_a');
  const [playerSquad, setPlayerSquad] = React.useState<SquadId>('qingqiu');
  const [tiles, setTiles] = React.useState<Tile[]>(buildTiles('test_map_a'));
  const [units, setUnits] = React.useState<Unit[]>(baseUnits);
  const [selectedUnitId, setSelectedUnitId] = React.useState('suling');
  const [selectedTileId, setSelectedTileId] = React.useState('-2,-2');
  const [action, setAction] = React.useState<Action>('查看');
  const [activeSquad, setActiveSquad] = React.useState<SquadId>('qingqiu');
  const [round, setRound] = React.useState(1);
  const [log, setLog] = React.useState<string[]>(['对局载入：MVP自由对战原型', '大回合 1 / 3 开始', '等待选择单位或格子']);
  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const selectedTile = tiles.find((t) => t.id === selectedTileId);
  const occupied = new Map(units.map((u) => [u.tileId, u]));
  const activeUnit = selectedUnit && selectedUnit.squad === activeSquad ? selectedUnit : units.find((u) => u.squad === activeSquad) ?? selectedUnit;
  const moveTargets = new Set(activeUnit ? neighbors(activeUnit.tileId).filter((id) => tiles.some((t) => t.id === id && t.terrain !== 'obstacle') && !occupied.has(id)) : []);
  const attackTargets = new Set(activeUnit ? neighbors(activeUnit.tileId).filter((id) => occupied.get(id) && occupied.get(id)?.squad !== activeUnit.squad) : []);
  const addLog = (item: string) => setLog((old) => [item, ...old].slice(0, 12));

  function start() {
    const nextTiles = buildTiles(mapId);
    setTiles(nextTiles); setUnits(baseUnits.map((u) => ({ ...u }))); setScreen('battle'); setActiveSquad(playerSquad); setRound(1);
    setSelectedUnitId(playerSquad === 'qingqiu' ? 'suling' : 'xuanzhao'); setSelectedTileId(playerSquad === 'qingqiu' ? '-2,-2' : '2,-2');
    setAction('查看'); setLog([`模式：${mode}`, `地图：${mapId} / ${mapInfo[mapId]}`, `小队：${squads[playerSquad].name}`, '大回合 1 / 3 开始']);
  }

  function clickTile(tile: Tile) {
    const unit = occupied.get(tile.id);
    setSelectedTileId(tile.id);
    if (unit) { setSelectedUnitId(unit.id); addLog(`查看单位：${unit.name}`); return; }
    if (action === '移动' && activeUnit && moveTargets.has(tile.id)) {
      setUnits((old) => old.map((u) => u.id === activeUnit.id ? { ...u, tileId: tile.id, ap: Math.max(0, u.ap - 1) } : u));
      addLog(`${activeUnit.name} 移动至 ${tile.id}`); return;
    }
    if (tile.owner) addLog(`查看据点：${terrain[tile.terrain].name} / 归属 ${tile.owner === 'neutral' ? '无归属' : squads[tile.owner].name}`);
    else addLog(`查看格子：${tile.id} / ${terrain[tile.terrain].name}`);
  }

  function clickAction(next: Action) {
    setAction(next);
    if (next === '攻击' && activeUnit) addLog(`${activeUnit.name} 显示可攻击目标`);
    if (next === '移动' && activeUnit) addLog(`${activeUnit.name} 显示可移动格`);
    if (next === '技能' && activeUnit) addLog(`${activeUnit.name} 准备核心技能：${activeUnit.coreSkill}`);
    if (next === '占领' && activeUnit) addLog(`${activeUnit.name} 尝试查看据点占领状态`);
  }

  function endAction() {
    const next = activeSquad === 'qingqiu' ? 'tianmen' : 'qingqiu';
    const nextRound = activeSquad === 'tianmen' ? Math.min(3, round + 1) : round;
    setActiveSquad(next); setRound(nextRound); setAction('查看'); addLog(`${squads[activeSquad].name} 回合结束`); addLog(`${squads[next].name} 回合开始`);
  }

  if (screen === 'home') return <main className="home"><section className="hero"><p className="eyebrow">夕妖 MVP / 自由对战</p><h1>黄昏阵图调试台</h1><p>只使用 mockMaps、mockTiles、mockUnits、mockActions、mockBattleLog；不连接后端、数据库或 AI 逻辑。</p></section><section className="setup"><Option title="选择模式" value={mode} items={['玩家 vs AI','AI vs AI']} onPick={(v) => setMode(v as Mode)} /><Option title="选择地图" value={mapId} items={['test_map_a','test_map_b','test_map_c']} label={(v) => `${v}｜${mapInfo[v as MapId]}`} onPick={(v) => setMapId(v as MapId)} /><Option title="选择小队" value={playerSquad} items={['qingqiu','tianmen']} label={(v) => squads[v as SquadId].name} onPick={(v) => setPlayerSquad(v as SquadId)} /><button className="start" onClick={start}>开始对战</button></section></main>;

  return <main className="battle"><header className="top"><button onClick={() => setScreen('home')}>返回首屏</button><strong>大回合 {round} / 3</strong><span>当前行动：{squads[activeSquad].name}</span><span>模式：{mode}</span><span>地图：{mapId}</span></header><section className="map"><div className="board">{tiles.map((tile) => { const unit = occupied.get(tile.id); const cls = ['hex', tile.terrain, selectedTileId === tile.id ? 'selected' : '', moveTargets.has(tile.id) ? 'moveable' : '', attackTargets.has(tile.id) ? 'attackable' : '', tile.deploy ? `deploy-${tile.deploy}` : ''].join(' '); return <button key={tile.id} className={cls} style={{ left: 360 + tile.q * 82 + tile.r * 41, top: 210 + tile.r * 70 }} onClick={() => clickTile(tile)}><span className="coord">{tile.id}</span><span className="terrain">{terrain[tile.terrain].icon}</span>{tile.owner && <span className="owner">{tile.owner === 'neutral' ? '中立' : squads[tile.owner].mark}</span>}{tile.statuses.map((s) => <span className="tileStatus" key={s}>{statusIcon[s]}</span>)}{unit && <span className={`unit ${unit.squad}`}>{squads[unit.squad].mark}<b>{unit.name.slice(0,1)}</b></span>}</button>; })}</div></section><aside className="panel"><h2>{selectedUnit ? selectedUnit.name : '未选中单位'}</h2>{selectedUnit ? <><p>{squads[selectedUnit.squad].name}</p><div className="bars"><span>HP {selectedUnit.hp}/{selectedUnit.maxHp}</span><span>AP {selectedUnit.ap}/2</span></div><p>当前状态：{selectedUnit.statuses.length ? selectedUnit.statuses.join('、') : '无'}</p><p>核心技能：{selectedUnit.coreSkill}</p><p>职责：{selectedUnit.role}</p></> : null}<hr/><h3>选中格</h3><p>{selectedTile?.id} / {selectedTile ? terrain[selectedTile.terrain].name : '-'}</p><p>{selectedTile ? terrain[selectedTile.terrain].note : '-'}</p><div className="actions">{(['移动','攻击','技能','占领'] as Action[]).map((a) => <button className={action === a ? 'active' : ''} key={a} onClick={() => clickAction(a)}>{a}</button>)}<button onClick={endAction}>结束行动</button></div></aside><footer className="log"><strong>战斗日志</strong>{log.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</footer></main>;
}

function Option({ title, value, items, onPick, label }: { title: string; value: string; items: string[]; onPick: (v: string) => void; label?: (v: string) => string }) {
  return <div className="option"><h2>{title}</h2>{items.map((item) => <button key={item} className={value === item ? 'picked' : ''} onClick={() => onPick(item)}>{label ? label(item) : item}</button>)}</div>;
}

createRoot(document.getElementById('root')!).render(<App />);
