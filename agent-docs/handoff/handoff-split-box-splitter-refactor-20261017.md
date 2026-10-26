# Handoff

## Goal

重构 split-box（split-h-box / split-v-box）与 splitter 的外观/交互 prop 体系：三个正交维度（占位/形态/显形时机）+ split-box 职责重拆（显示/可拖/可收拢三能力独立）。方案已定稿，尚未动代码。

## Current State

- 方案定稿：本会话经 5 轮设计迭代收敛，最终方案见 Key Context。
- 代码零改动：本会话纯设计讨论，未修改任何文件。
- 工作区存在**前一会话的未提交中间态改动**（git status 中 layout 相关 M 文件），实现的是旧版设计（`size: none|slim|normal` + `shape: hidden|line|pill`）。本次重构在其基础上继续改，废弃 prop 回退逻辑也属这批未提交改动（已用 `git diff HEAD` 确认），未发布。

## Key Context

### 定稿方案 — splitter 组件

| prop | 取值 | 默认 | 语义 |
|---|---|---|---|
| `size` | `zero \| slim \| normal` | `normal` | **纯占位**（flex-basis），非外观尺寸。`zero`：不占容器空间，伪元素悬浮溢出显示、`::before` 恒 4px 热区保留（可交互的机制核心），面板无缝贴合 |
| `shape` | `line \| pill` | `line` | 纯形态。`hidden` 选项废除 |
| `visibility` | `always \| hover` | `always` | 显形时机。`hover` = 仅 hover（语义含 `[active]` 拖拽中）显示 `::after` |

组合语义：

- `slim + line`：静止 `::after` 2px，hover/active 涨 4px（现状行为，保留）。
- `slim + pill`：视觉同 `normal + pill`，仅占位差 2px（伪元素尺寸不随 size）。
- `zero + always`：零占位常显悬浮线——定义良好的怪组合，不做 validator 拦截，文档标注 "zero 通常搭配 visibility: hover"。
- 正交模型的自然冗余用文档消化，不写代码特判。

### 定稿方案 — split-box（h/v 两组件同构）

- 新增 `leftSplitter | rightSplitter: Boolean, default: true`：控制分隔条显隐（splitter 的 `v-if` 从 `isLeftResizable` 改绑它）。
- `leftResizable | rightResizable: Boolean, default: true`：仅控制可拖调整尺寸。
- 级联失效：`splitter=false` 时 `resizable` / `collapsible` / `splitterCollapseHandle` / `splitterDblclickReset` 均无实际作用。
- `resizable=false + collapsible=true`：拖拽不实时调整尺寸（不 emit `resizing`），仅超越阈值时收拢/展开：
  - 收拢 = 往面板方向拖超阈值；展开 = 收拢态（面板 `display:none`、`startSize=0`）反向拖超阈值 → `reset()` 恢复 initialSize。
  - 阈值用独立常量，30–50px 级别，**不沿用** `COLLAPSE_THRESHOLD=200`（200 是实时拖拽的收拢尺寸阈值，作拖拽距离太大）。
  - 拖拽全程无尺寸变化，需预览反馈防"拖了没反应突然跳变"（形式实现时定：面板透明度/handle 渐进高亮等）。
  - 现有 `onPointerMove`（splitter.vue:120-130）无此分支，是新增交互。
- `collapsible=false` 时 handle 不显示。handle 显示条件：`collapsible && collapseHandle && shape !== 'pill'`（从 `shape === 'line'` 放宽；`visibility=hover` 与 `size=zero` 静止全隐形时 handle 是用户发现交互区的唯一锚点）。
- box 层新增 `splitterVisibility` 传递 prop。
- 最终默认组合 = 4px 常显可拖线。相对当前库行为（未传时无分隔条）是 breaking，未提交窗口内可接受，迁移说明需标注。

### 修订决策（用户确认）

- cursor：`resizable=false + collapsible=true` 时改 `pointer`，其余保持 `col-resize`/`row-resize`。
- 废弃 prop `resizable` / `collapsible` 及回退逻辑、`warnDeprecated` 调用**直接删除**（整批未提交未发布，无兼容负担）。
- 检查报告中 4 条警告全部采纳（默认值矩阵补齐 / 废弃 prop 删除 / 阈值交互语义补全 / handle 条件补维度）。

### 待实现时定的小决策

- `resizable=false + collapsible=true` 时双击语义：建议 = toggle（与 handle 点击一致）；`resizable=false` 且非 collapsible 时双击无意义，纳入级联失效。
- visibility=hover 的类名（建议 `--reveal`）与放置位置。

### 关键发现（代码读不出来的）

- `::before` 未被 `--none` 覆盖（splitter.scss:117-122 只压 `::after` 宽度），恒 4px absolute 透明层 = zero 模式的悬浮命中区。曾误判"zero 不可交互、hover 涨宽是死代码"，已纠正——**不要删 hover 涨宽规则**。
- `--hidden` 的 `background: unset`（splitter.scss:44）与 `:hover` 主色规则（:79）特异性同为 (0,2,0)，靠源码顺序取胜。重构 visibility 类时须置于 hover 块之后或提高特异性，别把坑带进新代码。
- 旧设计 9 组合中 3 个退化、2 个近似重复——"正交"是假的，本方案以此为主要论据。

### 被否决的方案（不要再走回头路）

1. `shape` 单枚举合并（`none/slim/line/pill/ghost` 五值）——基于 "zero 不可交互" 的错误判断推出，zero 与形态实际正交（`zero+pill` 有独立意义）。
2. `shape` 三值含 `ghost`——ghost 混合形态与可见性，非纯形状；hidden/ghost 的命名争议由此而来。
3. `hoverReveal: Boolean`——被 `visibility` 枚举取代（扩展性：未来可加 `focus-visible` 等档位）。
4. `size: 'none'` 保留原名——`none` 是存在性词汇混进尺寸档位，`zero` 纯尺寸量词。

### 迁移映射（demo 及用法）

| 旧写法 | 新写法 |
|---|---|
| `shape="hidden"` | `visibility="hover"` |
| `size="none"`（原行为） | `size="zero"` + `visibility="hover"`，或按需 |
| `splitter-size="slim"` / `"normal"` | 不变（`size` 保留） |
| `resizable` / `collapsible` 旧 prop | 直接改 `left/right-resizable` / `left/right-collapsible`，或删（默认 true） |
| 未传任何 resizable | 行为变更：默认出现 4px 可拖条；不想要用 `left/right-splitter="false"` |

## Changed Files

本会话无代码改动，仅创建本交接文档。

## Next Steps

1. 实现 splitter.vue：新 props（size 改名 zero / shape 收窄 / 新增 visibility）、阈值收拢交互分支、cursor 条件、`showCollapseHandle` 放宽。
2. 实现 splitter.scss：`--none`→`--zero`、删 `--hidden` 增 visibility hover 类（注意放置顺序）、清理 pill 内 `&--none` 分支。
3. 实现 split-h-box.vue / split-v-box.vue：新增 `leftSplitter`/`rightSplitter`、`splitterVisibility`，改 v-if，删废弃 prop 与回退逻辑，dblclick 语义调整。
4. 更新 demo/src/flex-layout/main-view.vue（选项：size 含 zero、shape 两值、visibility 开关；默认值改 `normal`）。
5. playwright 验证 `http://localhost:3000/flex-layout/`（项目 watch 模式常驻，直接访问）：各组合外观、拖拽、阈值收拢/展开、handle 显隐。
6. 文档三处同步（`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/`）——按项目规矩先问用户再动。

## References

- 相关源码：`src/components/layout/splitter.vue`、`splitter.scss`、`split-h-box.vue`、`split-v-box.vue`、`split-box.js`
- 验证页：`demo/src/flex-layout/main-view.vue`

## Suggested Skills

- `mussel-ui`：仅在第 6 步更新组件参考文档时按需查阅现有文档结构（实现代码时项目规则禁止使用）。
