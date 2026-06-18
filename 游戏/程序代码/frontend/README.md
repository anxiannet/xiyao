# frontend

本目录存放《夕妖》MVP 前端代码。

## 当前原型

MVP自由对战前端交互原型：

```text
玩家 vs AI
AI vs AI
```

入口文件：

```text
index.html
src/main.tsx
src/styles.css
```

交互与视觉规范：

```text
docs/MVP自由对战前端交互原型.md
```

## 运行

```bash
npm install
npm run dev
```

## 当前只允许

- 页面
- 组件
- 前端状态
- 前端路由
- 前端资源
- 前端测试辅助代码
- mockMaps
- mockTiles
- mockUnits
- mockActions
- mockBattleLog

## 当前禁止

- 后端服务代码
- 数据库迁移脚本
- 游戏规则原始设定
- 长篇设计文档
- Supabase 连接
- 后端 API 连接
- AI 逻辑
- 规则引擎
- 联网对战

## 原型边界

当前实现只负责视觉设计、UI设计、前端交互原型与美术资源规范。

不负责游戏规则设计、世界观设计、数据库设计、后端设计、AI逻辑设计、数值平衡或剧情设计。
