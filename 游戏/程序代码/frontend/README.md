# frontend

本目录存放《夕妖》的多个前端工程。

## 目录规划

```text
frontend/
├─ web
├─ app
├─ admin
└─ shared-ui
```

## web

当前已建立。

用途：

- MVP自由对战网页版
- 玩家 vs AI
- AI vs AI
- 地图调试
- 状态展示
- 战斗日志

入口：

```text
web/README.md
```

运行：

```bash
cd 游戏/程序代码/frontend/web
npm install
npm run dev
```

## app

预留。

用途：

- 后续手机端
- iOS
- Android

## admin

预留。

用途：

- 地图编辑器
- 单位配置
- 状态配置
- 对局日志与回放查看

## shared-ui

预留。

用途：

- 公共色板
- 公共图标
- 状态标记
- 小队徽记
- 通用组件

## 当前边界

当前 `web` 只允许：

- 页面
- 组件
- 前端状态
- 前端资源
- mockMaps
- mockTiles
- mockUnits
- mockActions
- mockBattleLog

当前禁止：

- Supabase 连接
- 后端 API 连接
- AI 逻辑
- 规则引擎
- 联网对战
- 数据库迁移脚本
