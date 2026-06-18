# engine

前端本地规则执行层。

当前逻辑入口仍由 `src/main.tsx` 统一组合，后续按下列模块拆分：

- mapBuilder：读取地图配置、格子配置并生成最终战场。
- mapValidator：检查格子数量、部署区、据点、障碍、地形类型、坐标唯一性。
- matchFlow：match_created → map_preview → deployment → round_start → turn_start → unit_action → turn_end → round_end → match_end。
- deployment：部署合法性与单位放置。
- actionResolver：移动、攻击、技能、占领。
- turnManager：回合推进与对局结束。

禁止接入后端、Supabase、联网对战。
