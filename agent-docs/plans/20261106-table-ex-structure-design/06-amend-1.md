VERDICT: AMENDED

## 检查项结论（每项一行）

1. **覆盖**：原稿缺少验收标准 4（对外 API 冻结）的核验手段、标准 3 用"12 文件"泛指未列受影响文件——已补 §4.4 diff 核验与 §4.1/4.2/4.3/4.5 受影响文件清单；现 4 条标准均归属到批次且手段可验证。
2. **事实一致**：O1/O4 消费方清单、O5 recordNumber 站点数、O6 拆分清单、O7 drawCell 分组、drawHeaderText 参数数均与源码不符——已按 `path:line` 逐项改正（见台账）。
3. **约定一致**：新增文件落点符合 `src/components/table/ex/` 目录约定（editing/、shared/、interaction/），元数据标签统一 `@host-*` 与 O3 改名方向一致，无词表/ADR 冲突。
4. **影响面**：已补 demo self-checks 5 个受影响文件、`table-ex.vue:82`、`editor-resolve` 直引、`editor.js` 的 constants import 删除、3 个未提交改动文件的重叠与裁决点。
5. **可实施**：批次严格串行（文件集合相交），批内固定顺序 O1→O3→O2；依赖无环（`shared/cell-identity.js` 零内部依赖，`editor-geometry.js` 仅依赖 shared/constants）。
6. **风险与回滚**：已补每批行为判据、前置裁决点、双向门判定与爆炸半径（§4.0/§4.4）；O5 提取失败可按提取项局部回退。
7. **范围**：改动全部落在既有 O1–O8 内，未新增重构项，未触碰 §5「明确不做」的任何条目。
8. **切片**：3 片均有可观察判据，验收标准归属见 §4.5；片间文件集合相交，已明确禁止并发/交错提交，共享的 demo self-checks 文件随各自批次同步。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | §1 表 / P4 | `drawHeaderText 12 参` → `11 参` | `src/components/table/ex/table-paint/paint-header.js:120` 签名为 11 参 | 否 |
| 2 | §1 表 / P5-1 | 描边链 `15 行` → `14 行` 并补行号 | `src/components/table/ex/table-paint/paint-overlay.js:113–126 / 143–156 / 180–193` 各 14 行 | 否 |
| 3 | P5-2 | 背景带 `~14 行` → `16 行（80–95 / 130–145）` | `src/components/table/ex/table-paint/paint-body.js:80–95、130–145` 逐字相同 | 否 |
| 4 | P5-3 | `isSame×3 近同构` → `isSameCell/isSameHover 逐字相同 + isSameHoverItem 5 字段` | `composables/use-cell-tooltip.js:37`、`composables/use-pointer.js:70,158` | 否 |
| 5 | P5-5 | recordNumber `4 处` → `10 处 / 6 文件` | grep 命中：use-cell-click:95,200、use-cell-tooltip:108、paint-body:101,151,207、row-geometry-controller:292,419、cell-selection:43、spans-method:120 | 是 |
| 6 | §3 O1① | 消费方概述（含 paint-body）→ 7 行文件级清单，剔除 paint-body | `paint-body.js:2` 引用的 `drawCell` 为 `cell-painters.js:25` 自身定义，非 re-export；实际 re-export 消费方见 `table-ex.vue:81`、`use-cell-click.js:11`、`use-cell-tooltip.js:18`、`paint-overlay.js:2` 与 3 个 demo 文件 | 是 |
| 7 | §3 O1②③ | "剩余 resolve 消费方仅 use-cell-click" → 3 文件；补 demo interactions.js；③ 明确归批次 2 | `table-ex.vue:82` 引 `isCellEditable`（仅 `editor-resolve.js` 定义，经 `editor.js:21–31` re-export）；`demo/.../self-checks/editor.js:34–50` 引 9 个 re-export 符号 | 是 |
| 8 | §3 O2 | 标签 `@ctx-reads/writes/calls` → `@host-*`；补 controller `@getters` 落点与批内落笔顺序 | 与 O3 改名冲突（O3 后 `ctx` 仅指 canvas），旧标签会重新引入三义；14 getter 见 `table-ex.vue:337–357` | 是 |
| 9 | §3 O3 | 补文件级清单与行号（10 composables / spans 3 / interactions 1） | grep `export function use*(ctx)` 10 命中；`spans.js:90`、`spans-method.js:242`、`spans-auto.js:119`；`interactions.js:137` | 否 |
| 10 | §3 O4 | 消费方 3 文件 → 7 文件；补 `constants` import 整体删除与 editor.js 保留面 | `paint-overlay.js:3`、`edit-button.js:7`、`use-cell-click.js:10`、demo `editor.js:34–50`/`painter.js:25`/`spans.js:29`、`table-ex.vue:82`；`editor.js:6–9,96–104` 4 常量仅被移出的 4 函数使用 | 是 |
| 11 | §3 O5 | `isSamePoint` 归一 3 函数 → 仅 2 函数，isSameHoverItem 保留 | `use-pointer.js:158–166` 比 row/col/kind/index/disabled 5 字段，替换会改变 hoverItem 脏区行为 | 是 |
| 12 | §3 O5 | `withAnchorPreserved` 落点 "use-relayout 或 rowGeometry" → `geometry/row-geometry.js`，签名收 `resolveAnchorRow` | `use-tree-rows.js:151–176` 按 record 反查行号 vs `use-table-instances.js:36–50` 用稳定行号；落 use-relayout 会新增 composable 横向 import 边 | 是 |
| 13 | §3 O5 | `recordNumberOf(state/host, row)` → `(recordsOffset, row)`，落点 `shared/cell-identity.js` | 调用侧为 props/state/纯参数三形态（`spans-method.js:120`、`cell-selection.js:43`、`paint-body.js:101`），纯函数模块无 host，原签名不可实现 | 是 |
| 14 | §3 O6 | 拆分清单补 `resolveTreeToggle` / `resolveResizeWidth` / `RESIZE_MIN_WIDTH` / `resolvePointerdown`；明确删除 interactions.js；消费方补 demo | `interactions.js:18,57,137,155,174,196,240,284,301,321,375,395,429` 共 12 函数 + 1 常量；`use-column-resize.js:13`、`use-pointer.js:6`、`use-cell-click.js:8`、demo `interactions.js:20–36` | 是 |
| 15 | §3 O7 | drawCell 分组 `geo{rect,centerY,…}` → `geo{rect,rightInset,regionHeight}`；补 2 调用点；JSDoc 批次 1 / drawCell 批次 3 | `cell-painters.js:25–45` 实参 19 个无 centerY，`centerY` 在 `:60` 派生；调用点 `paint-body.js:317`、`demo/.../self-checks/cell-painters.js:134` | 是 |
| 16 | §3 | 新增 O1–O8 结论表（保留/修改/删除/补充） | 派发要求逐项结论 | 否 |
| 17 | §4 | 3 行批次表 → §4.0 前置裁决点 + §4.1–4.3 文件级清单与行为判据 + §4.4 验证/回滚/合并风险 + §4.5 验收标准归属 | 派发要求文件级、可独立提交/验证；`git status` 显示 use-pointer/paint-overlay/demo painter 与批次 1/2 文件重叠 | 是 |
| 18 | §6 | `@ctx-*` → `@host-*` | 同 #8 | 否 |

## 未解决异议（累计）

无。
