# 《夕妖》MVP自由对战前端交互原型

## 1. 页面结构图

```text
首屏
├─ 模式选择
│  ├─ 玩家 vs AI
│  └─ AI vs AI
├─ 地图选择
│  ├─ test_map_a｜开阔对称图
│  ├─ test_map_b｜裂隙侧路图
│  └─ test_map_c｜障碍分流图
├─ 小队选择
│  ├─ 青丘使团
│  └─ 天门执法队
└─ 开始对战

对战界面
├─ 顶部：大回合 / 当前行动方 / 模式 / 地图
├─ 左侧：六角棋盘地图
├─ 右侧：单位信息面板 / 选中格信息 / 动作按钮
└─ 底部：战斗日志
```

## 2. UI组件树

```text
App
├─ HomeScreen
│  ├─ OptionGroup(mode)
│  ├─ OptionGroup(map)
│  ├─ OptionGroup(squad)
│  └─ StartButton
└─ BattleScreen
   ├─ TopBar
   ├─ HexBoard
   │  └─ HexTile[]
   │     ├─ TerrainIcon
   │     ├─ CoordinateLabel
   │     ├─ OwnerBadge
   │     ├─ TileStatusBadge[]
   │     └─ UnitToken
   ├─ UnitPanel
   │  ├─ UnitIdentity
   │  ├─ HP/AP
   │  ├─ StatusList
   │  ├─ CoreSkill
   │  ├─ SelectedTileInfo
   │  └─ ActionButtons
   └─ BattleLog
```

## 3. 视觉规范

- 定位：东方神话、黄昏、战棋、卷轴、阵图、古代执法、狐火。
- 气质：克制、冷静、肃穆、神秘。
- 程序版优先级：调试优先、信息优先、状态优先。
- 地图表现为战棋棋盘、卷轴、阵图、沙盘，不做自然地貌地图。
- MVP单位表现：头像感棋子底座 + 状态图标，不做 Live2D、复杂动画、全身演出。

## 4. 色板

| 用途 | 名称 | 色值 |
|---|---|---|
| 主色 | 暮金 | `#C9A86A` |
| 青丘色 | 狐火青 | `#4FA3A5` |
| 天门色 | 执法白金 | `#D8D2BF` |
| 危险色 | 赤赭 | `#B85A3C` |
| 背景色 | 墨蓝灰 | `#2A313B` |

## 5. 地形规范

| 地形ID | 显示名 | 程序图标 | 桌游表现 |
|---|---|---|---|
| plain | 普通格 | □ | 普通地面纹理 |
| central_objective | 中央据点 | 坛 | 祭坛 / 石台 |
| edge_objective | 边缘据点 | 碑 | 界碑 / 烽火台 |
| high_ground | 高台 | 台 | 岩台 |
| cover_shadow | 掩影 | 影 | 树林 / 残墙 |
| dusk_rift | 黄昏裂隙 | 裂 | 发光裂缝 |
| obstacle | 障碍 | 阻 | 不可通行障碍 |

## 6. 小队视觉规范

### 青丘使团

- 关键词：狐火、灵巧、变化、游击。
- 元素：狐尾、灵纹、狐火、符纸。
- 主色：狐火青 `#4FA3A5`。
- 禁止：性感狐妖风。

### 天门执法队

- 关键词：律令、秩序、执法、压制。
- 元素：令牌、锁链、法印、甲胄。
- 主色：执法白金 `#D8D2BF`，辅以深灰。
- 禁止：西方圣骑士风。

## 7. 图标规范

| 状态 | 程序短标 | 桌游标记物 |
|---|---|---|
| 狐印 | 印 | 圆形单色印记 |
| 迷踪 | 迷 | 圆形单色雾纹 |
| 逃逸 | 逃 | 圆形单色足迹 |
| 护阵 | 护 | 圆形单色盾阵 |
| 狐火残留 | 火 | 圆形单色火纹 |
| 勘验区 | 验 | 圆形单色法印 |
| 狐火充盈 | 盈 | 圆形单色满月火纹 |

统一要求：单色、高识别、统一线宽，程序状态图标、桌游标记物、规则书插图复用同一母版。

## 8. 特效规范

| 动作 | 程序表现 | 原则 |
|---|---|---|
| 移动 | 路径 / 可移动格高亮 | 短、清楚、低成本 |
| 攻击 | 赤赭目标高亮 / 闪白 | 不做长演出 |
| 狐火 | 青色火焰光晕 | 强识别，不遮挡坐标 |
| 律令 | 金色法印 | 用于天门技能反馈 |
| 占领 | 升旗 / 归属徽记切换 | 状态优先 |

## 9. mock数据结构

当前只允许使用：

```text
mockMaps
mockTiles
mockUnits
mockActions
mockBattleLog
```

前端已落地的数据类型：

```ts
type Tile = {
  id: string;
  q: number;
  r: number;
  terrain: TerrainId;
  deploy?: SquadId;
  owner?: SquadId | 'neutral';
  statuses: StatusId[];
};

type Unit = {
  id: string;
  name: string;
  squad: SquadId;
  hp: number;
  maxHp: number;
  ap: number;
  tileId: string;
  statuses: StatusId[];
  coreSkill: string;
  role: string;
};
```

## 10. 前端状态流

```text
首屏选择
↓
startBattle()
↓
初始化 mockTiles / mockUnits / mockBattleLog
↓
进入 BattleScreen
↓
点击单位
├─ 选中单位
├─ 更新右侧单位面板
├─ 显示可移动格
└─ 显示可攻击目标

点击空格
├─ 移动模式：执行 mock 移动
└─ 查看模式：切换选中格

点击敌方
├─ 攻击模式：显示攻击目标反馈
└─ 查看模式：显示敌方信息

点击据点
├─ 显示归属
└─ 显示占领状态

结束行动
↓
切换当前行动方
↓
写入战斗日志
```

## 11. MVP资源清单

优先制作：

1. 7种地形图标。
2. 6种状态图标：狐印、迷踪、逃逸、护阵、狐火残留、勘验区。
3. 2支小队标识：青丘使团、天门执法队。
4. 7名单位头像：苏绫、阿照、青萝、琉尾、玄照、白烬、赤霄。
5. 3张测试地图：test_map_a、test_map_b、test_map_c。
6. 移动高亮。
7. 攻击特效。
8. 律令特效。
9. 占领特效。

## 12. TODO后端接入点

仅作为未来接入点，不在当前原型实现：

```text
mockMaps       -> maps API / cfg_maps
mockTiles      -> map_tiles API / cfg_map_tiles
mockUnits      -> units API / cfg_units
mockActions    -> match action endpoint
mockBattleLog  -> match event log endpoint
```

当前禁止接入：Supabase、后端服务、AI逻辑、规则引擎、联网对战。
