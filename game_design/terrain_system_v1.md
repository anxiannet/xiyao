# 《夕妖》地形系统 V1.3

## 核心结论

《夕妖》的地图不依赖固定手绘棋盘。

MVP 采用：

- 背景图负责氛围。
- 六角网格由程序生成。
- 地形标签由程序摆放。
- 特殊地形和临时地形通过覆盖资源层加载美术。
- 技能、百宝囊、状态、地形必须形成闭环。

地图背景不是规则本体。

规则读取的是格子坐标、地形标签、覆盖层、状态标签和持续时间。

---

# 地图分层

## 1. 背景层 background_layer

纯视觉氛围。

例如：青丘谷黄昏、天门关雪夜、室内神殿、林中祭坛。

背景不参与规则计算。

## 2. 网格层 grid_layer

程序生成六角格。

推荐 axial 坐标：

```text
q, r
```

## 3. 地形标签层 terrain_layer

程序给格子添加基础地形标签。

例如：

```text
plain
central_objective
edge_objective
high_ground
cover_shadow
dusk_rift
daylight_altar
choke_point
obstacle
```

## 4. 覆盖资源层 overlay_layer

技能、宝物、事件生成的临时地形或残留。

例如：

```text
foxfire_residue
decree_zone
rift_sealed
temporary_obstacle
sanctuary_barrier
pursuit_mark
```

覆盖层必须有：

```text
type
asset
turns_remaining
rule_tags
source_id
```

示例：

```json
{
  "q": 1,
  "r": -2,
  "terrain": "cover_shadow",
  "terrain_asset": "assets/terrain/forest_shadow.png",
  "overlays": [
    {
      "type": "foxfire_residue",
      "asset": "assets/overlays/foxfire_residue_01.png",
      "turns_remaining": 2,
      "rule_tags": ["foxfire", "qingqiu"]
    },
    {
      "type": "pursuit_mark",
      "asset": "assets/overlays/pursuit_mark.png",
      "turns_remaining": 1,
      "rule_tags": ["tianmen", "mark"]
    }
  ]
}
```

---

# 名词规范

## 暮炁

世界本源资源。

含义：黄昏变化之力，夕妖能够感知和积累的本源。

用于：化形、部分战役事件、四象系统。

## 狐火

青丘派生状态。

含义：青丘狐族用暮炁点燃的战术火痕。

用于：状态、地格残留、青丘战术标记。

## 威仪

天门战帮资源。

含义：天门律令在战场上形成的秩序压迫感。

用于：追缉、封界、强化攻击和防御。

区分：

- 暮炁：世界资源。
- 狐火：青丘状态和残留。
- 威仪：天门战帮资源。

---

# 覆盖层互斥规则

同一格可同时存在多个非互斥覆盖层，但以下覆盖互斥：

```text
foxfire_residue ↔ decree_zone
```

后生成者覆盖前者。

例如：

- 青丘在律令领域上生成狐火残留：移除律令领域，生成狐火残留。
- 天门在狐火残留上生成律令领域：移除狐火残留，生成律令领域。

该规则是 MVP 地形争夺的核心。

---

# 地形变体原则

同一规则地形可根据地图氛围使用不同美术。

## 掩影 cover_shadow

室外：林地、竹林、狐影林。

室内：阴影、帷幕、屏风、暗廊。

## 高台 high_ground

室外：山坡、石台、城墙。

室内：楼阁、祭台、二层回廊。

## 黄昏裂隙 dusk_rift

室外：黄昏裂缝、暮炁裂隙。

室内：破碎镜门、夕门、裂纹阵眼。

## 昼曜令台 daylight_altar

室外：天门令台、神像台、审判石座。

室内：法坛、律令阵眼、昼曜碑。

---

# P0 地形与覆盖层总表

## 1. 普通格 plain

无特殊效果。

宝物关系：可被山河印临时改为障碍。

## 2. 中央据点 central_objective

规则：回合结束时控制者获得气运。

天门关系：

- 赤霄在中央据点占点权重更高。
- 天门控制中央据点可获得威仪。
- 天律囊和镇守思路围绕中央据点建立阵地。

青丘关系：

- 青丘通常不硬抢中央。
- 可用边缘据点和狐火残留拉扯天门。

美术：

```text
assets/terrain/objective_central.png
```

## 3. 边缘据点 edge_objective

规则：回合结束时控制者获得气运。

天门关系：

- 天门移动慢，难以快速响应。
- 巡天囊用于弥补该短板。

青丘关系：

- 青丘适合偷边缘据点。
- 边缘格上的狐火残留持续+1回合。

美术：

```text
assets/terrain/objective_edge.png
```

## 4. 高台 high_ground

规则：

- 远程攻击距离+1。
- 若技能特别指定，可改为攻击骰+1；二者不叠加。

天门关系：

- 玄照在高台使用律令封界距离+1。
- 镇妖钉从高台使用距离+1。
- 天罚令在高台攻击时距离+1。

青丘关系：

- 琉尾可利用高台骚扰中央。
- 青丘可用假身诱导天门浪费高台封印。

美术：

```text
assets/terrain/high_ground_marker.png
```

## 5. 掩影 cover_shadow

规则：

- 防御方位于掩影时，防御骰+1。
- 假身在掩影生成时持续+1回合。

天门关系：

- 破妄镜、天眼令用于侦测掩影。
- 昼曜令台可削弱附近掩影的假身收益。

青丘关系：

- 阿照在掩影生成假身更强。
- 青丘狐影囊围绕掩影运作。

美术：

```text
assets/terrain/forest_shadow.png
assets/terrain/indoor_shadow.png
```

## 6. 黄昏裂隙 dusk_rift

规则：

- 青丘单位可通过裂隙进行特殊移动。
- 单位经过裂隙时可获得暮炁。
- 裂隙可被关闭或临时打开。

天门关系：

- 石门令、山河印、封界石、天门索可限制裂隙。
- 律令领域相邻裂隙时，可压制青丘特殊移动。

青丘关系：

- 苏绫从裂隙移动后攻击可施加狐火。
- 裂隙针可临时打开裂隙。

美术：

```text
assets/terrain/dusk_rift.png
assets/overlays/rift_sealed.png
assets/overlays/rift_temporary.png
```

## 7. 昼曜令台 daylight_altar

规则：

- 天门单位在令台上封印和律令效果增强。
- 令台可清除附近狐火残留。
- 令台可识破附近假身。

天门关系：

- 玄照封界范围+1。
- 白烬净化额外清除狐火残留。
- 生成律令领域时可能返还威仪。

青丘关系：

- 青丘应避免在令台附近堆狐火与假身。
- 青丘可用边缘据点迫使天门离开令台。

美术：

```text
assets/terrain/daylight_altar.png
```

## 8. 狐火残留 foxfire_residue

类型：覆盖层。

来源：青丘技能、狐火囊、苏绫裂隙攻击、青萝狐火引路。

持续：1回合。

若位于边缘格、掩影格或黄昏裂隙旁，持续+1回合。

规则：

- 青丘单位经过：获得1暮炁。
- 天门单位经过：获得迷踪，除非有昼行靴等反制。
- 与律令领域互斥。

天门反制：

- 白烬净化。
- 昼曜令。
- 昼曜令台。
- 净世符。
- 律令领域覆盖。

美术：

```text
assets/overlays/foxfire_residue_01.png
assets/overlays/foxfire_residue_02.png
assets/overlays/foxfire_residue_indoor.png
```

## 9. 律令领域 decree_zone

类型：覆盖层。

来源：玄照律令封界、赤霄立界、天律囊、昼曜令台互动。

持续：1回合。

规则：

- 天门单位位于其中时，防御骰+1。
- 青丘单位在其中使用特殊位移需要额外消耗1 AP。
- 假身进入后持续时间-1。
- 与狐火残留互斥。

青丘反制：

- 在边缘据点分散天门。
- 后生成狐火残留覆盖律令领域。
- 利用非特殊移动离开范围。

美术：

```text
assets/overlays/decree_zone.png
assets/overlays/decree_zone_indoor.png
```

## 10. 追缉标记 pursuit_mark

类型：单位覆盖层 / 状态视觉。

来源：玄照宣令追缉、镇妖钉、破妄镜、锁妖链。

规则：

- 被追缉目标受到天门攻击时防御骰-1，最低1。
- 被追缉目标离开律令领域时，天门获得1威仪。

美术：

```text
assets/overlays/pursuit_mark.png
```

---

# P1 地形

## 圣坛 sanctuary

回复与净化地形。

白烬、晨辉类宝物收益更高。

## 窄路 choke_point

路径受限地形。

赤霄、山河印、锁妖链在此更强。

## 障碍 obstacle

不可进入，阻挡视野。

可由山河印临时生成。

---

# 程序生成模板

```text
map_size: small | medium | large
background_theme: tianmen | qingqiu | muyuan | indoor | forest
asset_theme: outdoor | indoor | ruins | forest | temple
terrain_budget:
  central_objective: 1
  edge_objective: 2
  high_ground: 2
  cover_shadow: 4
  dusk_rift: 2
  daylight_altar: 1
  choke_point: 1
initial_overlays:
  foxfire_residue: 0
  decree_zone: 0
```

背景只决定视觉氛围，不能决定规则。

---

# 地形与 AI

AI 需要理解：

- 天门优先占昼曜令台、中央据点、高台、律令领域。
- 青丘优先利用掩影、边缘据点、黄昏裂隙、狐火残留。
- 玄照优先在高台或令台生成律令领域。
- 白烬优先清理狐火残留、迷踪和易伤。
- 赤霄优先进入中央据点、窄路和律令领域。
- 苏绫优先从裂隙或边缘格攻击。
- 阿照优先在掩影生成假身。
- 青萝优先在边缘、裂隙和掩影附近留下狐火残留。

---

# MVP 地形闭环

```text
青丘：掩影 / 裂隙 / 边缘据点
↓
生成狐火残留
↓
天门：昼曜令台 / 中央据点 / 高台
↓
生成律令领域覆盖狐火
↓
青丘绕边或重新点燃狐火
↓
天门追缉核心单位
```

该闭环必须在 MVP 中完整实现。
