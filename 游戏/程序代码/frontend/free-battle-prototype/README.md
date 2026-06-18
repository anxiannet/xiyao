# 《夕妖》MVP 自由对战前端交互原型

位置：`游戏/程序代码/frontend/free-battle-prototype/`

## 范围

本原型只覆盖当前 MVP：

- 自由对战
- 玩家 vs AI
- AI vs AI

不包含：

- 剧情模式
- 抽卡
- 养成
- 商城
- 登录
- 用户系统
- 联网
- 世界观页面
- 小说页面

## 文件结构

```text
free-battle-prototype/
├── index.html
├── app.js
├── styles.css
└── README.md
```

## 页面结构

### 1. 首屏 BattleSetup

包含：

- 选择模式
  - 玩家 vs AI
  - AI vs AI
- 选择地图
  - test_map_a：开阔对称图
  - test_map_b：裂隙侧路图
  - test_map_c：障碍分流图
- 选择小队
  - 青丘使团
  - 天门执法队
- 开始对战按钮

### 2. 对战界面 BattleScreen

包含：

- 六角格地图区域
- 当前回合显示
- 当前行动方显示
- AP 显示
- 选中单位信息面板
- 可行动作按钮区
- 对战日志区

## 组件划分建议

当前为静态原型，所有组件写在 `app.js` 内。后续接入 React/Vue/Svelte 时建议拆分为：

```text
BattleSetup
BattleScreen
BattleHeader
HexMap
HexTile
UnitToken
UnitInfoPanel
ActionBar
BattleLog
```

## mock 数据结构

### mockMaps

```js
{
  id: 'test_map_a',
  name: 'test_map_a：开阔对称图',
  desc: '验证基础移动、占点节奏、无障碍正面对抗。'
}
```

### mockTiles

由 `createMockTiles(mapId)` 生成。

```js
{
  id: '0,0',
  q: 0,
  r: 0,
  terrain: 'central_objective',
  owner: '无归属',
  statuses: []
}
```

### mockUnits

由 `createMockUnits(playerSquadId)` 生成。

```js
{
  id: 'qingqiu_苏绫',
  name: '苏绫',
  squad: 'qingqiu',
  tileId: '-2,-2',
  hp: 8,
  ap: 2,
  maxHp: 8,
  maxAp: 2,
  mv: 2,
  rng: 1,
  statuses: [],
  coreSkill: '狐步'
}
```

### mockBattleLog

```js
{
  id: 123,
  type: '单位移动',
  text: '苏绫 从 -2,-2 移动至 -1,-1。'
}
```

## 交互状态流

### 首屏

```text
选择模式 / 选择地图 / 选择小队
↓
点击开始对战
↓
创建本地 battle state
↓
进入对战界面
```

### 点击单位

```text
点击单位
↓
高亮选中单位
↓
显示单位信息
↓
计算并显示可移动格
↓
计算并显示可攻击目标
```

### 点击空格

```text
点击空格
↓
若在 reachableTileIds 内：执行本地 mock 移动并写入日志
↓
若不在 reachableTileIds 内：只切换选中格 / 查看格子信息
```

### 点击敌方单位

```text
点击敌方单位
↓
若在 attackableUnitIds 内：执行本地 mock 攻击并写入日志
↓
若不可攻击：只显示目标信息
```

### 点击据点

```text
点击据点
↓
显示据点类型
↓
显示当前归属
↓
显示是否可占领
```

## TODO：后续后端接入点

当前没有连接 Supabase，没有调用真实后端，没有写 AI 决策，没有写规则引擎。

后续接入点：

1. `createMockTiles` 替换为配置表 `xiyao_cfg_map_tiles` 或后端地图接口。
2. `createMockUnits` 替换为 `xiyao_cfg_units` 与对局初始化接口。
3. `getReachableTiles` / `getAttackableUnitIds` 替换为规则引擎可行动作查询。
4. `selectTile` / `triggerAction` 替换为后端 action command。
5. `addLog` 替换为 match_ 对局日志与 replay 事件流。
6. AI vs AI 当前只显示模式，不实现 AI 决策；后续由 AI 行为评分与规则引擎驱动。

## 本地预览

直接用浏览器打开：

```text
index.html
```

或在该目录启动任意静态文件服务。
