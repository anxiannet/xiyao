const TERRAIN_LABELS = {
  plain: '普通格',
  central_objective: '中央据点',
  edge_objective: '边缘据点',
  high_ground: '高台',
  cover_shadow: '掩影',
  dusk_rift: '黄昏裂隙',
  obstacle: '障碍',
};

const SQUADS = {
  qingqiu: { id: 'qingqiu', name: '青丘使团', members: ['苏绫', '阿照', '青萝', '琉尾'] },
  tianmen: { id: 'tianmen', name: '天门执法队', members: ['玄照', '白烬', '赤霄'] },
};

const SKILLS = {
  苏绫: '狐步',
  阿照: '假身',
  青萝: '狐火引路',
  琉尾: '扰弦',
  玄照: '颁令',
  白烬: '勘验',
  赤霄: '护阵',
};

const UNIT_STATS = {
  苏绫: { hp: 8, ap: 2, mv: 2, rng: 1 },
  阿照: { hp: 7, ap: 2, mv: 2, rng: 1 },
  青萝: { hp: 7, ap: 2, mv: 2, rng: 1 },
  琉尾: { hp: 6, ap: 2, mv: 2, rng: 2 },
  玄照: { hp: 8, ap: 2, mv: 2, rng: 1 },
  白烬: { hp: 7, ap: 2, mv: 2, rng: 1 },
  赤霄: { hp: 10, ap: 2, mv: 2, rng: 1 },
};

const TERRAIN_CLASS = {
  plain: 'terrain-plain',
  central_objective: 'terrain-central',
  edge_objective: 'terrain-edge',
  high_ground: 'terrain-high',
  cover_shadow: 'terrain-cover',
  dusk_rift: 'terrain-rift',
  obstacle: 'terrain-obstacle',
};

const BASE_COORDS = Array.from({ length: 25 }, (_, index) => ({
  q: (index % 5) - 2,
  r: Math.floor(index / 5) - 2,
}));

function terrainFor(mapId, q, r) {
  const key = `${q},${r}`;
  const common = {
    '0,0': 'central_objective',
    '-2,0': 'edge_objective',
    '2,0': 'edge_objective',
    '-1,1': 'cover_shadow',
    '1,-1': 'cover_shadow',
    '-1,-1': 'high_ground',
    '1,1': 'high_ground',
  };
  const mapB = { ...common, '-2,1': 'dusk_rift', '2,-1': 'dusk_rift' };
  const mapC = { ...common, '-1,0': 'obstacle', '1,0': 'obstacle', '0,-1': 'cover_shadow', '0,1': 'dusk_rift' };
  if (mapId === 'test_map_b') return mapB[key] || 'plain';
  if (mapId === 'test_map_c') return mapC[key] || 'plain';
  return common[key] || 'plain';
}

const mockMaps = [
  { id: 'test_map_a', name: 'test_map_a：开阔对称图', desc: '验证基础移动、占点节奏、无障碍正面对抗。' },
  { id: 'test_map_b', name: 'test_map_b：裂隙侧路图', desc: '验证黄昏裂隙、侧路收益、狐火循环与禁行令判断。' },
  { id: 'test_map_c', name: 'test_map_c：障碍分流图', desc: '验证障碍绕行、视线阻挡、寻路与路线选择。' },
];

function createMockTiles(mapId) {
  return BASE_COORDS.map(({ q, r }) => {
    const terrain = terrainFor(mapId, q, r);
    return {
      id: `${q},${r}`,
      q,
      r,
      terrain,
      owner: terrain.includes('objective') ? '无归属' : null,
      statuses: [],
    };
  });
}

function createMockUnits(playerSquadId) {
  const enemySquadId = playerSquadId === 'qingqiu' ? 'tianmen' : 'qingqiu';
  const starts = {
    qingqiu: ['-2,-2', '-1,-2', '0,-2', '-2,-1'],
    tianmen: ['2,2', '1,2', '0,2'],
  };
  return [...SQUADS[playerSquadId].members, ...SQUADS[enemySquadId].members].map((name) => {
    const squad = SQUADS.qingqiu.members.includes(name) ? 'qingqiu' : 'tianmen';
    const squadIndex = starts[squad].shift();
    return {
      id: `${squad}_${name}`,
      name,
      squad,
      tileId: squadIndex,
      hp: UNIT_STATS[name].hp,
      ap: UNIT_STATS[name].ap,
      maxHp: UNIT_STATS[name].hp,
      maxAp: UNIT_STATS[name].ap,
      mv: UNIT_STATS[name].mv,
      rng: UNIT_STATS[name].rng,
      statuses: [],
      coreSkill: SKILLS[name],
    };
  });
}

const state = {
  screen: 'setup',
  setup: { mode: 'player_vs_ai', mapId: 'test_map_a', playerSquadId: 'qingqiu' },
  battle: null,
};

function tileDistance(a, b) {
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs((a.q + a.r) - (b.q + b.r)));
}

function getTile(tileId) {
  return state.battle.tiles.find((tile) => tile.id === tileId);
}

function getUnitAt(tileId) {
  return state.battle.units.find((unit) => unit.tileId === tileId && unit.hp > 0);
}

function getSelectedUnit() {
  return state.battle.units.find((unit) => unit.id === state.battle.selectedUnitId);
}

function getCurrentUnit() {
  return state.battle.units.find((unit) => unit.id === state.battle.currentUnitId);
}

function addLog(type, text) {
  state.battle.logs.unshift({ id: Date.now() + Math.random(), type, text });
}

function getReachableTiles(unit) {
  if (!unit) return [];
  const origin = getTile(unit.tileId);
  return state.battle.tiles
    .filter((tile) => tile.terrain !== 'obstacle')
    .filter((tile) => !getUnitAt(tile.id))
    .filter((tile) => tileDistance(origin, tile) <= unit.mv)
    .map((tile) => tile.id);
}

function getAttackableUnitIds(unit) {
  if (!unit) return [];
  const origin = getTile(unit.tileId);
  return state.battle.units
    .filter((target) => target.hp > 0 && target.squad !== unit.squad)
    .filter((target) => tileDistance(origin, getTile(target.tileId)) <= unit.rng)
    .map((target) => target.id);
}

function updateHighlights() {
  const unit = getSelectedUnit();
  state.battle.reachableTileIds = getReachableTiles(unit);
  state.battle.attackableUnitIds = getAttackableUnitIds(unit);
}

function startBattle() {
  const tiles = createMockTiles(state.setup.mapId);
  const units = createMockUnits(state.setup.playerSquadId);
  state.screen = 'battle';
  state.battle = {
    round: 1,
    phase: '回合开始',
    tiles,
    units,
    selectedTileId: null,
    selectedUnitId: units[0]?.id,
    currentUnitId: units[0]?.id,
    reachableTileIds: [],
    attackableUnitIds: [],
    logs: [],
  };
  updateHighlights();
  addLog('回合开始', `第 1 回合开始，当前行动方：${units[0].name}`);
  render();
}

function selectTile(tileId) {
  const tile = getTile(tileId);
  const clickedUnit = getUnitAt(tileId);
  const selectedUnit = getSelectedUnit();
  state.battle.selectedTileId = tileId;

  if (clickedUnit) {
    const canAttack = selectedUnit && state.battle.attackableUnitIds.includes(clickedUnit.id);
    if (selectedUnit && clickedUnit.squad !== selectedUnit.squad && canAttack) {
      clickedUnit.hp = Math.max(0, clickedUnit.hp - 1);
      selectedUnit.ap = Math.max(0, selectedUnit.ap - 1);
      addLog('单位攻击', `${selectedUnit.name} 攻击 ${clickedUnit.name}，造成 1 点 mock 伤害。`);
    } else {
      state.battle.selectedUnitId = clickedUnit.id;
      addLog('状态获得', `查看目标：${clickedUnit.name}。`);
    }
    updateHighlights();
    render();
    return;
  }

  if (selectedUnit && state.battle.reachableTileIds.includes(tileId)) {
    const from = selectedUnit.tileId;
    selectedUnit.tileId = tileId;
    selectedUnit.ap = Math.max(0, selectedUnit.ap - 1);
    addLog('单位移动', `${selectedUnit.name} 从 ${from} 移动至 ${tileId}。`);
  } else if (tile.terrain.includes('objective')) {
    addLog('据点占领', `查看据点：${TERRAIN_LABELS[tile.terrain]}，当前归属：${tile.owner}。`);
  }

  updateHighlights();
  render();
}

function triggerAction(action) {
  const unit = getSelectedUnit();
  if (!state.battle || !unit) return;
  if (action === '移动') addLog('单位移动', `${unit.name}：请选择高亮格执行移动。`);
  if (action === '攻击') addLog('单位攻击', `${unit.name}：请选择高亮敌方目标执行攻击。`);
  if (action === '技能') {
    unit.ap = Math.max(0, unit.ap - 1);
    addLog('技能释放', `${unit.name} 释放核心技能「${unit.coreSkill}」（本地 mock，不结算真实规则）。`);
  }
  if (action === '占领') {
    const tile = getTile(unit.tileId);
    if (tile.terrain.includes('objective')) {
      tile.owner = SQUADS[unit.squad].name;
      unit.ap = Math.max(0, unit.ap - 1);
      addLog('据点占领', `${unit.name} 占领 ${TERRAIN_LABELS[tile.terrain]}。`);
    } else {
      addLog('据点占领', `${unit.name} 当前不在据点格，无法占领。`);
    }
  }
  if (action === '结束行动') {
    const alive = state.battle.units.filter((item) => item.hp > 0);
    const index = alive.findIndex((item) => item.id === unit.id);
    const next = alive[(index + 1) % alive.length];
    if (next.id === alive[0].id) state.battle.round += 1;
    state.battle.currentUnitId = next.id;
    state.battle.selectedUnitId = next.id;
    next.ap = next.maxAp;
    addLog('回合结束', `${unit.name} 结束行动。`);
    addLog('回合开始', `当前行动方：${next.name}。`);
  }
  updateHighlights();
  render();
}

function setupOption(name, value, label) {
  const active = state.setup[name] === value ? 'active' : '';
  return `<button class="choice ${active}" data-setup-name="${name}" data-setup-value="${value}">${label}</button>`;
}

function renderSetup() {
  return `
    <main class="setup-shell">
      <section class="hero-card">
        <p class="eyebrow">夕妖 · MVP 自由对战</p>
        <h1>前端交互原型</h1>
        <p class="muted">本页面仅使用本地 mock 状态，不连接 Supabase，不调用后端，不实现 AI 决策与规则引擎。</p>
      </section>
      <section class="setup-grid">
        <div class="panel"><h2>选择模式</h2><div class="choice-row">
          ${setupOption('mode', 'player_vs_ai', '玩家 vs AI')}
          ${setupOption('mode', 'ai_vs_ai', 'AI vs AI')}
        </div></div>
        <div class="panel"><h2>选择地图</h2><div class="choice-column">
          ${mockMaps.map((map) => setupOption('mapId', map.id, `${map.name}<small>${map.desc}</small>`)).join('')}
        </div></div>
        <div class="panel"><h2>选择小队</h2><div class="choice-row">
          ${setupOption('playerSquadId', 'qingqiu', '青丘使团')}
          ${setupOption('playerSquadId', 'tianmen', '天门执法队')}
        </div></div>
        <button class="start-button" id="startBattle">开始对战</button>
      </section>
    </main>`;
}

function renderMap() {
  return `<div class="hex-map">
    ${state.battle.tiles.map((tile) => {
      const unit = getUnitAt(tile.id);
      const selected = state.battle.selectedTileId === tile.id || state.battle.selectedUnitId === unit?.id ? 'selected' : '';
      const movable = state.battle.reachableTileIds.includes(tile.id) ? 'movable' : '';
      const attackable = unit && state.battle.attackableUnitIds.includes(unit.id) ? 'attackable' : '';
      return `<button class="hex ${TERRAIN_CLASS[tile.terrain]} ${selected} ${movable} ${attackable}" style="--q:${tile.q};--r:${tile.r}" data-tile-id="${tile.id}">
        <span class="coord">${tile.id}</span>
        <span class="terrain">${TERRAIN_LABELS[tile.terrain]}</span>
        ${unit ? `<strong class="unit ${unit.squad}">${unit.name}</strong>` : ''}
      </button>`;
    }).join('')}
  </div>`;
}

function renderInfoPanel() {
  const unit = getSelectedUnit();
  const tile = state.battle.selectedTileId ? getTile(state.battle.selectedTileId) : unit ? getTile(unit.tileId) : null;
  return `<aside class="panel info-panel"><h2>选中信息</h2>
    ${unit ? `<dl>
      <dt>单位名称</dt><dd>${unit.name}</dd>
      <dt>所属小队</dt><dd>${SQUADS[unit.squad].name}</dd>
      <dt>当前 HP</dt><dd>${unit.hp} / ${unit.maxHp}</dd>
      <dt>当前 AP</dt><dd>${unit.ap} / ${unit.maxAp}</dd>
      <dt>当前状态</dt><dd>${unit.statuses.length ? unit.statuses.join('、') : '无'}</dd>
      <dt>核心技能</dt><dd>${unit.coreSkill}</dd>
    </dl>` : '<p class="muted">未选中单位。</p>'}
    ${tile ? `<div class="tile-card"><h3>格子</h3><p>${tile.id} · ${TERRAIN_LABELS[tile.terrain]}</p><p>归属：${tile.owner || '无'}</p><p>可占领：${tile.terrain.includes('objective') ? '是' : '否'}</p></div>` : ''}
  </aside>`;
}

function renderBattle() {
  const current = getCurrentUnit();
  return `<main class="battle-shell">
    <header class="battle-header">
      <button class="ghost" id="backSetup">返回首屏</button>
      <div><p class="eyebrow">${state.setup.mode === 'player_vs_ai' ? '玩家 vs AI' : 'AI vs AI'}</p><h1>${mockMaps.find((map) => map.id === state.setup.mapId).name}</h1></div>
      <div class="turn-box"><span>当前回合</span><strong>${state.battle.round}</strong></div>
      <div class="turn-box"><span>当前行动方</span><strong>${current?.name || '-'}</strong></div>
      <div class="turn-box"><span>AP</span><strong>${current?.ap ?? '-'}</strong></div>
    </header>
    <section class="battle-grid">
      <section class="board-panel panel"><h2>六角格地图区域</h2>${renderMap()}</section>
      ${renderInfoPanel()}
      <aside class="panel action-panel"><h2>可行动作</h2>${['移动', '攻击', '技能', '占领', '结束行动'].map((action) => `<button data-action="${action}">${action}</button>`).join('')}</aside>
      <aside class="panel log-panel"><h2>对战日志</h2><div class="logs">${state.battle.logs.map((log) => `<p><b>${log.type}</b>${log.text}</p>`).join('')}</div></aside>
    </section>
  </main>`;
}

function bindEvents() {
  document.querySelectorAll('[data-setup-name]').forEach((button) => {
    button.addEventListener('click', () => {
      state.setup[button.dataset.setupName] = button.dataset.setupValue;
      render();
    });
  });
  document.getElementById('startBattle')?.addEventListener('click', startBattle);
  document.getElementById('backSetup')?.addEventListener('click', () => {
    state.screen = 'setup';
    state.battle = null;
    render();
  });
  document.querySelectorAll('[data-tile-id]').forEach((button) => {
    button.addEventListener('click', () => selectTile(button.dataset.tileId));
  });
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => triggerAction(button.dataset.action));
  });
}

function render() {
  document.getElementById('app').innerHTML = state.screen === 'setup' ? renderSetup() : renderBattle();
  bindEvents();
}

render();

// TODO: 后续规则引擎接入点
// 1. createMockTiles -> 替换为后端/配置表 xiyao_cfg_map_tiles 读取结果。
// 2. createMockUnits -> 替换为 xiyao_cfg_units 与对局初始化结果。
// 3. getReachableTiles / getAttackableUnitIds -> 替换为规则引擎可行动作查询。
// 4. selectTile / triggerAction -> 替换为后端 action command 与事件流回放。
// 5. addLog -> 替换为 match_ 日志与 replay 事件数据。
