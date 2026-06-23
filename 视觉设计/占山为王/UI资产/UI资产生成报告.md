# 《夕妖：占山为王》UI资产生成报告

## 本次执行结论

已完成：

- 读取并核对指定视觉规范、UI规范、卡牌框架、地盘横置方案、基础卡表与卡面技能文案
- 创建 `视觉设计/占山为王/UI资产/README.md`
- 创建本检查报告
- 明确禁止本地脚本几何占位图冒充商品级 UI 资产
- 明确 Codex / 后续执行必须使用大模型图像生成或专业设计工具导出正式 PNG

未完成：

- 未在本次连接器执行中直接写入 PNG 二进制资产
- 未生成 `ui_assets_preview.png`

原因：

当前 GitHub 连接器可安全写入 UTF-8 文本文档；本地运行环境无法访问 `github.com` 完成完整仓库克隆与 Git 推送；同时不能用本地脚本生成占位 PNG，因为任务要求明确要求使用大模型生成 UI 资产，而不是本地生成。

因此本次未用本地几何图、透明空图、占位图或错误整卡图冒充最终 UI 资产。

---

## 已确认的唯一来源

| 类型 | 唯一来源 / 优先来源 | 已读取 |
|---|---|---|
| 视觉总方向 | `视觉设计/占山为王/视觉总规范.md` | 是 |
| 视觉锚点 | `视觉设计/占山为王/视觉锚点规范.md`，其内容已合并至视觉总规范 | 是 |
| 卡牌框架 | `视觉设计/占山为王/卡牌框架规范.md` | 是 |
| 地盘横置与卡背规则 | `视觉设计/占山为王/UI修订说明-地盘横置方案.md` | 是 |
| UI与图标 | `视觉设计/占山为王/UI与图标规范.md` | 是 |
| UI资产拆分 | `视觉设计/占山为王/UI资产规范.md` | 是 |
| 基础卡表 | `游戏/卡牌游戏/占山为王/V1.2-基础卡表.md` | 是 |
| 卡面技能文案 | `游戏/卡牌游戏/占山为王/V1.2-卡面技能文案.md` | 是 |

---

## 成功生成的资产清单

### 文档资产

- `视觉设计/占山为王/UI资产/README.md`
- `视觉设计/占山为王/UI资产/UI资产生成报告.md`

### PNG资产

本次未生成 PNG 二进制资产。

---

## 缺失资产清单

### monster/

- `ui_monster_frame_common.png`
- `ui_monster_skill_scroll.png`
- `ui_star_1.png`
- `ui_star_2.png`
- `ui_star_3.png`
- `ui_name_plate_short.png`
- `ui_name_plate_long.png`

### artifact/

- `ui_artifact_frame.png`
- `ui_artifact_skill_plate.png`
- `ui_artifact_type_badge.png`

### land/

- `ui_land_frame.png`
- `ui_land_title_plate.png`
- `ui_land_faction_badge_baigu.png`
- `ui_land_faction_badge_huoyun.png`
- `ui_land_faction_badge_shituo.png`
- `ui_land_faction_badge_pansi.png`

### back/

- `ui_deck_back.png`
- `ui_land_back.png`

### common/

- `ui_corner_gold.png`
- `ui_corner_silver.png`
- `ui_corner_bronze.png`
- `ui_corner_purple_gold.png`
- `ui_trim_gold.png`
- `ui_trim_silver.png`
- `ui_trim_bronze.png`
- `ui_trim_purple_gold.png`

### preview

- `ui_assets_preview.png`

---

## 是否存在文字

当前已写入文档中存在说明文字。

PNG资产尚未生成，因此暂不存在 PNG 内文字问题。

后续 PNG 资产检查标准：

- UI叠加资产不得包含任何文字
- 卡背不得包含规则说明文字、妖怪名称、法宝名称、地盘名称、攻击力、防守力、编号、水印

---

## 是否存在非透明背景问题

PNG资产尚未生成，因此暂无法检查。

后续检查标准：

- `monster/`、`artifact/`、`land/`、`common/` 下全部 PNG 必须为透明背景
- `back/` 下卡背允许完整背景

---

## 是否误生成 monster_back / artifact_back

未发现误生成：

- `ui_monster_back.png`
- `ui_artifact_back.png`
- `monster_back.png`
- `artifact_back.png`

后续仍禁止生成上述文件。

---

## 是否符合妖怪 + 法宝共用卡背规则

文档规则已符合：

- 妖怪卡与法宝卡共用 `back/ui_deck_back.png`
- 不允许拆分妖怪卡背与法宝卡背

PNG资产尚未生成，待后续生成后复查。

---

## 是否符合地盘横版规则

文档规则已符合：

- 地盘正面 UI：`land/ui_land_frame.png`，横版 88×63mm
- 地盘卡背：`back/ui_land_back.png`，横版 88×63mm
- 不使用妖怪卡竖版模板
- 不使用法宝卡竖版模板

PNG资产尚未生成，待后续生成后复查。

---

## 后续 Codex 执行要求

后续执行 PNG 生成时，必须遵守：

1. 使用大模型图像生成或专业设计工具导出正式 UI PNG
2. 不允许用 PIL、Canvas、SVG、CSS、本地脚本生成几何占位资产冒充最终资产
3. 每个 UI 叠加资产必须透明背景
4. 卡背可以有完整背景，但不得有文字、水印、编号
5. 不生成完整卡牌正面
6. 不生成妖怪、法宝、地盘插画
7. 不写入妖怪名称、技能文字、地盘名称
8. 生成后必须重新创建 `ui_assets_preview.png`
9. 生成后必须更新本报告，将缺失清单改为实际通过 / 未通过清单
