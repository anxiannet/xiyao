# ai

前端本地 AI 模块。

当前逻辑入口仍由 `src/main.tsx` 统一组合，后续按下列模块拆分：

- actionGenerator：从当前本地 MatchState 生成候选动作。
- actionScorer：按目标分、位置分、资源分、状态分、据点分、协同分、击杀分、生存分评分。
- aiRunner：选择最高分动作并调用本地 engine 执行。

AI 不调用后端，不调用外部模型，不联网。
