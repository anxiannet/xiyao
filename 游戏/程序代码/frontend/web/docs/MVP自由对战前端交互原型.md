# 《夕妖》MVP自由对战前端交互原型

## 当前实现

当前网页版前端已从单纯交互壳调整为：

```text
前端交互
本地地图生成
本地地图校验
本地部署流程
本地回合流程
本地AI评分
LocalStorage保存
离线运行
```

禁止内容仍然保持：

```text
不连接 Supabase
不连接后端
不上传服务器
不实现联网对战
不新增玩法
不修改规则
```

## 页面结构

```text
前端入口
├─ 顶部阶段栏 PhaseHeader
├─ 对局创建栏
│  ├─ 模式选择：玩家 vs AI / AI vs AI
│  ├─ 地图选择：test_map_a / test_map_b / test_map_c
│  ├─ 小队选择：青丘使团 / 天门执法队
│  └─ 创建对局 / 进入预览
├─ 地图预览 MapPreview
├─ 部署面板 DeploymentPanel
├─ 战场区
│  ├─ BattleBoard
│  └─ 右侧信息区
│     ├─ UnitInfoPanel
│     ├─ ActionPanel
│     └─ AIDebugPanel
└─ BattleLog
```

## 完整流程

```text
match_created
↓
map_preview
↓
deployment
↓
round_start
↓
turn_start
↓
unit_action
↓
turn_end
↓
round_end
↓
match_end
```

界面顶部显示：

```text
当前阶段
当前大回合
当前行动方
当前行动单位
当前AP
当前模式
当前地图
本地保存状态
```

## 地图生成流程

当前前端禁止直接把格子数据画成最终战场。

实际流程：

```text
读取地图配置 mapConfigs
↓
读取地图格子 tiles
↓
validateMap 校验地图合法性
↓
buildBattlefield 生成地形层 terrainLayer
↓
生成部署区 deploymentOwner
↓
生成据点信息 objectiveOwner
↓
生成状态层 statusLayer
↓
生成单位层 unitLayer
↓
生成最终战场 BattlefieldTile[]
```

## 地图校验

当前校验项：

```text
地图格子数量是否为25
青丘部署格是否不少于5
天门部署格是否不少于5
据点是否不在部署区
障碍是否不在部署区
中央据点是否存在
边缘据点是否存在
地形类型是否合法
每个格子坐标是否唯一
```

校验失败时：

```text
禁止开始部署
禁止开始对战
界面显示错误原因
```

## 地图预览页

地图预览页显示：

```text
地图名称
地图ID
地图类型说明
地形统计
据点数量
双方部署区数量
地图合法性校验结果
开始部署按钮
```

只有地图校验通过时，开始部署按钮可点击。

## 部署阶段

部署阶段支持：

```text
青丘使团 4名单位
天门执法队 3名单位
```

部署规则：

```text
单位只能放在己方 deploymentOwner 对应格
一个格子最多一个正式单位
不能部署在障碍格
不能部署在非己方部署格
```

玩家 vs AI：

```text
玩家部署己方
AI方自动部署
```

AI vs AI：

```text
双方自动部署
```

## 地图显示分层

每个格子按以下层级显示：

```text
terrainLayer   地形层
statusLayer    状态层
unitLayer      单位层
highlightLayer 高亮层
```

状态层预留：

```text
单位状态：狐印、迷踪、逃逸、护阵
地块状态：狐火残留、勘验区
小队状态：狐火充盈
全局状态：禁行状态、戒严状态、追捕状态
```

## AI调试显示

AI vs AI 模式显示 AI 决策面板：

```text
当前AI单位
候选动作列表
每个动作总分
每个动作评分组成
最终选择动作
执行结果
```

评分组成显示：

```text
据点分
协同分
生存分
状态分
位置分
击杀分
```

## 日志事件

当前日志记录：

```text
match_created
map_validated
deployment_start
unit_deployed
deployment_complete
round_start
turn_start
move
attack
skill
capture
turn_end
round_end
match_end
ai_decision
```

## LocalStorage

当前使用：

```text
xiyao_current_match
xiyao_match_history
xiyao_ai_decision_log
xiyao_ai_stats
```

保存内容：

```text
当前对局快照
地图校验结果
部署状态
战斗日志
AI决策日志
对局结束结果
```

## 目录结构

```text
frontend/web/src
├─ ai
├─ data
├─ engine
├─ state
├─ storage
├─ ui
├─ global.d.ts
├─ main.tsx
└─ styles.css
```

## 离线运行

```bash
cd 游戏/程序代码/frontend/web
npm install
npm run dev
```

打包：

```bash
npm run build
```

当前不依赖任何服务器接口。
