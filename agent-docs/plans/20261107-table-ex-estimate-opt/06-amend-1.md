# 设计交叉记录（X 审改，第 1 轮）

VERDICT: AMENDED

## 检查项结论（每项一行）

1. **覆盖**：AC1–AC6 均有设计与测试计划；修正后 AC1/AC6 的浏览器手段可达（原「替换列」路径不可达）；4 个自检文件与 demo `main-view.vue` 场景均已列入改动清单与实施步骤。
2. **事实一致**：路径/符号 grep 核对通过（row-geometry.js:55-62/318-377、controller:146-151/176-201/306-336、list.js:86-136、text-wrap.js:270-299、link.js:41-55）；修正 main-view 行号 508-516→506-514、自检模块数 12→11（非实质）；发现并修正 demo `mode` 只升不降导致 AC1 手段不可行（实质）。
3. **约定一致**：遵循 rowHeightOf/wrapLines 单一事实源、compile 双通道、计数口径分层、自检冷键防预热；未违背 `decisions.md`（totalHeight 采样不纳入、交叉单轮）。
4. **影响面**：`_render` 消费者（cell-content.js:135、base/table-row.vue:65、use-cell-click.js:218、row-geometry.js:56）均只调用函数本身，附加属性无影响；wrapCache 消费者只用 get/set/size；`computeRowHeights`/`ensureRowMeasured` 调用方仅 controller。已补 demo `main-view.vue`。
5. **可实施**：步骤 0–5 有序、每步有判据、无循环依赖；步骤 4 依赖步骤 3 的 `isEntryColumn` 导出，明确。
6. **风险与回滚**：全部双向门，9 文件可单条 revert；已补短路收益边界（仅 uniform）与计数等价前提（同一 `shown` 表达式）两条对策。
7. **范围**：生产改动仅 AC1–AC4；demo 场景是 AC1/AC6 的验证载体，未扩大生产范围。
8. **切片**：单片（实施粒度=整体），跳过。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | 方案概述 #1、改动清单 controller 行、接口节「表级短路谓词与 `lastScan*` 一致性论证」 | 短路「不更新 `lastScan*`」→ 按「已扫描」写回 `lastScanRows/lastScanColumnSig/lastScanMetricsSig/lastScanSpans`（`lastScanColumns` 照常更新） | 原论证「谓词由真变假必令 `isScanDirty` 为真」有反例：① spans 回退到上次扫描用过的同一 SpansIndex（`lastScanSpans === spans`）；② 列 A（含 link，扫后仍 uniform）→ B 全单行（短路：`lastScanColumns=B` 但 sig 仍为 sig(A)）→ 回 A（`columnsChanged` 真但 `columnSig===lastScanColumnSig`）。基线在短路点：脏则执行一次 no-op 扫描并写入这些字段（controller:176-201 写入、146-151 判定），不脏则这些字段本就等于当前输入——两种情形写回后均与基线逐字段一致，且不再依赖长等价链 | 是 |
| 2 | 改动清单 list.js 行、接口节 `render.count` 伪代码 | `max > 0 ? Math.min(entries.length, max) : entries.length` → `(max ? entries.slice(0, max) : entries).length` | 渲染用 `const shown = max ? entries.slice(0, max) : entries`（list.js:111-112）并返回 `items: shown.map(...)`（:124/130）；`max` 为负（`slice(0,-1)` 丢末条）或小数（`slice(0,2.5)`→2 条）时 `Math.min` 语义不同 → 计数会偏离 `items.length`，行高与渲染不一致 | 是 |
| 3 | 改动清单新增 main-view.vue 行、方案概述触及边界、测试计划 1/6、实施步骤 0/4/5 | 「demo `main-view.vue` 不改，AC1 用现有『替换列』通道」→ 新增 `single` 场景（稳定 `singleLineColumns`、radio 选项、`?scene=` 白名单）+ 步骤 0 采集优化前基线 | `mode` 只升不降（controller:125-130、193-195）；默认场景含 list 列且前 5 行 3 条目（main-view.vue:397-399）→ 首绘即 variable；「替换列」只换列不降模式，短路谓词恒假，`scanCount = 0` 不可达。AC6 的「替换列后 = 0」同步改为 100000（列签名变脏、mode 已 variable），与 AC1 的 0 形成对照 | 是 |
| 4 | 接口节 wrapCache LRU、测试计划 4 | 补「淘汰必须单步 `if`，不得 `while`」+ `createWrapCache(0)` 不挂死且 size ≤ 1 断言 | `while (size >= limit)` 在 `limit ≤ 0` 时于空表死循环；现状 clear-all 在 limit=0 仍可写入（text-wrap.js:291-293），不设防会引入挂死 | 是 |
| 5 | 多处 | 「12 模块」→「11 模块」；风险「8 文件」/回滚「片内 8 文件」→「9 文件」；main-view 行号 508-516→506-514 | self-checks/index.js 实际 11 个模块（:26-38）；改动清单现 9 行；`createAlternateColumns` 实为 506-514 | 否 |
| 6 | 改动清单 row-geometry.js 行 | 补 `typeof col._render?.count === 'function'` 守卫；`flat` 度量明确取 `rowMetricsOf(theme)` 产物 | `_render` 可能是对象形态类型产物（cell-content.js:43 `type.render || type`）；度量需含缺省回退，与 `rowHeightOf` 同源（row-geometry.js:129-139） | 否 |
| 7 | 方案概述 #3 | 补 `_resolveMaxLines` 与 00-task「确定单行列」分类的对应关系 | prepared 列恒有 `_resolveMaxLines`（cell-content.js:90），其值仅由 `maxLines`/`multiline` 派生（:49-59、84-90）；避免实施者误加恒假条件 | 否 |
| 8 | 遵循约定、接口节（免取值/LRU）、一致性论证 | 补主题切换失效链（onThemeChange 重建 wrapCache，use-table-instances.js:50）、`__valueCalls` scan 期口径、`recordsVersion` 通道、`remeasureUniformRow` 升级路径、`count` 不消费 `recordNumber`（list.js:102） | 影响面与风险对策补全；均为源码核对结论 | 否 |
| 9 | 被拒绝的备选 | 强化 #2（独立闭包需在 link.js:27-39 抽取 `listItems`，并新增 geometry→column-types 依赖）；新增 #5（短路放 `isScanDirty`/`rescanRowHeights` 内部无法回传 `scanCount=0`）、#6（双向链表/两代缓存/FIFO 的取舍） | 回答「更优替代」：三处选型的取舍结论已落到设计正文 | 否 |
| 10 | 改动清单 list.js 行 | 明确 `render.count` 在 compile 作用域挂一次，不得写进渲染函数体 | 写进函数体会每次绘制重建闭包，抵消热路径收益 | 否 |

## 未解决异议（累计）

无。
