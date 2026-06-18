# ai

前端本地 AI 模块。

当前 AI 已接入 `src/main.tsx` 的本地对局流程，并提供独立辅助代码文件：

```text
ai/
├─ actionGenerator.ts
├─ aiLogTypes.ts
├─ scoringWeights.ts
└─ README.md
```

## 已实现

- 从本地 MatchState 读取公开状态。
- 生成合法候选动作：移动、攻击、技能、占领、律令、结束行动。
- 按评分表计算：目标分、位置分、资源分、状态分、据点分、协同分、击杀分、生存分。
- 支持风险惩罚。
- 按青丘、天门不同权重计算总分。
- 选择最高分动作。
- 执行 AI 一步。
- AI vs AI 跑完整局。
- 本地 1000 局自动测试。
- AI 决策日志保存到 `xiyao_ai_decision_log`。
- AI 统计保存到 `xiyao_ai_stats`。

## 禁止

- 不调用后端。
- 不调用 Supabase。
- 不调用 ChatGPT。
- 不调用外部 AI 模型。
- 不联网推理。
- 不读取隐藏信息。
- 不读取未来结果。
