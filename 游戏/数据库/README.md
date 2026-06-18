# 数据库

本目录只存放数据库相关文件。

不存放：

- 游戏规则正文
- 世界观正文
- 程序实现代码
- 测试说明

---

# 表类型边界

## 配置表

配置表用于保存游戏设定数据。

当前配置表：

```text
xiyao_cfg_squads
xiyao_cfg_units
xiyao_cfg_skills
xiyao_cfg_statuses
xiyao_cfg_terrains
xiyao_cfg_decrees
xiyao_cfg_maps
xiyao_cfg_map_tiles
```

## 运行表

运行表用于保存对局运行状态、事件日志、AI 对战结果与回放数据。

当前尚未建立运行表。

后续运行表统一使用：

```text
xiyao_match_*
```

---

# 子目录

## schema

表结构说明。

## sql

迁移脚本与可执行 SQL。

当前文件：

- [sql/003_重新生成测试地图.sql](sql/003_重新生成测试地图.sql)

## seeds

初始化数据。
