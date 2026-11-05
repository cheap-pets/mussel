# 实施记录

## 改动文件

| 文件 | 对应范围条目 |
|------|------------|
| `skills/mussel-ui/references/components/data.md` | MuTable / MuTableEx 相关节 |
| `docs/quick-reference_components.md` | MuTable（≈L1610）/ MuTableEx（≈L1752）节 |
| `docs-site/components/table.md` | table 文档页 |
| `docs-site/components/table-ex.md` | table-ex 文档页 |
| `skills/mussel-ui/SKILL.md` | 版本检查块 + frontmatter date（仅此两处） |

未动：`docs/quick-reference_styles.md`、`docs-site/guide/styles*.md`、`skills/mussel-ui/references/styles.md` —— grep 确认无 table 相关条目（`mu-table` / `mu-tag--` 零命中），条件范围不触发。

## 内容要点（均已回 src/ 核对）

- **`list` 列新增入册**（column-types/list.js）：竖排条目列、仅数组值、条目 `{ label, color, disabled, ...任意属性 }`（`caption` 兼容 + dev 警告）、`listItems` / `listOption { max, color, disabled, class, style }`、列级 `link: true`、payload 键 `item`。
- **`link` 列改述**（link.js）：兼容壳委托 `list`、DOM 竖排、`linkOption` 收敛为 `{ max, danger, disabled, class, style }`（`color` 键已移除，`danger: true` → 色 danger）。
- **`cell-item-click` 载荷键**（list.js:70/95、tag.js:93、button.js:65、use-cell-click.js:248）：`link/tag` → `item/tag/button`（三处同步）。
- **`button` 列移入 MuTable 基础列类型**（column-types/index.js:32 注册）：`buttons` 配置入基础 Column 配置表；DOM 通道恒 small、`color` 仅 4 色（button.js:19）、canvas 通道全色板；ex 侧保留 canvas 绘制细节说明。
- **`title` 列协议改述**（cell-tooltip.js、table-ex.vue:444）：`true` = 溢出才显示全文（ex 为 tooltip，依赖 `$mussel.tooltip`）、String/Function = hover 即显示；三处删除"`title` 为 DOM 通道字段不生效"的错误表述。
- **`maxItems` 范围修正**（cell-painters.js:179、row-geometry.js:80-85）：仅 `link` / `list` 条目列消费（原误标 link/tag/button）；DOM 通道用各 `*Option.max`。
- **table-ex 单元格选中/复制/方向键新增入册**（use-cell-select.js、cell-selection.js）：选中规则、clamp 移动 + 自动滚动、Ctrl+C 复制（图形列排除清单 CELL_COPY_EXCLUDED_TYPES）、清除时机。
- **合并单元格新增入册**（spans/、table-ex.vue:124-127）：`span-method(info)` 签名（spans-method.js:115-125 info 载荷）、列级 `autoRowSpan` 三形态（spans-auto.js:23-29）、约束（树形/check 列丢弃、colspan 夹紧、重叠丢弃、接管失效、orderBy 警告）。
- **`locales` 修正**（number.js:6/32）：number 与 currency 均读 `locales`，删除不存在的 `locale` 键（三处同步）。
- **`color` 类型清单补 `icon`**（icon.js:44）。
- **不可编辑列清单补 `list`**（editor-resolve.js:8 NON_EDITABLE_TYPES）。
- **列类型计数**：13 → 15（新增 list、button；img/image 计一）。
- **示例改标准 `label` 键**：三处 link 示例 `caption` → `label`（首次 docs:build 出现 `list 列条目 "caption" 键已废弃` 警告，改后消失）。
- **SKILL.md**：frontmatter `date: 2026-11-06`；版本块 `4.1.*`（`4.1.5`）/ 2026-10-13 → `4.3.*`（`4.3.0`）/ 2026-11-06（package.json version=4.3.0）。其余章节未动（L161 组件选型表含"等"示意，非事实错误，按追加约束不越界）。

## 偏离

无。

## 自检

- `npm run docs:build`：两次运行退出码均 0（第二次 8.15s，`list caption` 废弃警告已随示例改 `label` 消失）。
- 一致性 grep：`cell-item-click` 载荷（item/tag/button）、`linkOption` 键集、`maxItems` 表述、`span-method`/`autoRowSpan`、title tooltip、`locales`、单元格选中——同一 API 三处表述一致。
- 过时串扫描：`link/tag`（载荷）、`link/tag/button`、`13 种`、`条目最大显示数`、独立 `locale` 键——四文档零残留（table-ex.md 的 `editorButton` 命中为 v4.3.0 破坏性变更迁移说明，属有意保留）。
- `git status --short`：改动恰为范围所列 5 文件 + 任务目录（untracked），无越界文件。

## 遗留

- docs-site 演示页未为 list / 合并单元格 / 单元格选中新增可交互 live demo（文档以代码示例说明）；如需 live demo 可后续补充。
- `getLayoutInfo()` 已含 `selectedCell` 内省字段（use-table-api.js:88），三处方法表维持"布局快照，调试用"概述，未单列。
