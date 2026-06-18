# 前端AI执行说明

## MVP原则

AI运行于前端本地。

不依赖服务器。

不调用ChatGPT。

不联网推理。

支持网页离线运行。

## AI模块

- RuleState
- ActionGenerator
- AIScorer
- BattleSimulator
- MatchStatistics

## 数据来源

仅允许读取：

- 地图状态
- 单位状态
- AP
- HP
- 技能冷却
- 据点状态
- 律令状态

禁止读取：

- 隐藏信息
- 未来结果
- 服务端数据

## 支持模式

- 玩家 vs AI
- AI vs AI

## 目标

验证规则闭环与自动对战。