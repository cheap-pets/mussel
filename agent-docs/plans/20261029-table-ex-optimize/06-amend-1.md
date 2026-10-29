VERDICT: AMENDED

## 上次回应核对（第 2 次起）

不适用（X 阶段第 1 次审改，无前次设计者回应）。

## 检查项结论（每项一行）

1. 覆盖：原设计的 P1 次数判据数不出 relayout（repaintCount/lastRelayout 均非计数器）；B 线冻结缺 5 个警告分支、去重键与 regions 顺序覆盖；docs-site 树模式正文漏列；步骤 1 完成判据的 complexity 余量写错。已逐一修正，其余验收标准 1-4 均有设计与可执行手段。
2. 事实一致：P1 段「六个 relayout watch」与 `:1289/:1299/:1307/:1312` 与代码不符（实为 5 个 watch 语句、六源，`1305/1315/1323/1328/1370`）；其余路径与符号（spans 四热点、prepareColumn、row-geometry 两函数、catalog、文档三处）Grep 属实。
3. 约定一致：eslint 双轨、全局 8.57 裸命令、catalog 单一事实源 + 重启、demo 三件套、文档三处同步、constants 镜像隔离均符合；`.eslintrc` 加 `//` 注释可行（eslint@8.57 的 `@eslint/eslintrc` 经 strip-json-comments 解析）。
4. 影响面：`docs-site/components/table-ex.md:191` 树模式正文（同页第三处 tree-props 描述）原设计漏改，已补入清单；`.eslintrc` globals 的注入来源补上 `vite.config.js:55-56`；guide 无涉及已留痕；其余调用方/依赖无遗漏。
5. 可实施：步骤 1→6 串行无环；步骤 2 现含临时 `console.count` 埋点（文件集合已同步改写），步骤 4 末尾删除；步骤 1 的 warning 余量判据修正后可独立验收。
6. 风险与回滚：B/C/A/新页/上轮共存均有对策；新增「探针与埋点不得残留」的完成判据（`git diff` 检查）。
7. 范围：未超验收标准；新增 `buildSpanInfo`/`advanceSegment` 只是达成既有 complexity 目标所需的分解，公共导出与签名不变。
8. 并行组：设计声明串行、未标并行组，跳过。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
|---|---|---|---|---|
| 1 | C 线「问题」段、接口节标题 | 「六个 relayout 触发 watch」、`records（:1289）`/`columns（:1299）`/`recordsVersion（:1307）`/`[spanMethod, orderBy]（:1312）` → 「五个 watch 语句、六个源」、`1305/1315/1323/1328` | 代码实测：`table-ex.vue:1305/1315/1323/1328/1370` 为 5 个 watch 语句，spanMethod/orderBy 同块两源；原文与接口节「五个 watch」自相矛盾 | 否 |
| 2 | C 线测量协议首行 + 表下注 + 测试计划 2④ + 步骤 2/4 | 用 `repaintCount` 差值 + `lastRelayout` 判 relayout 次数 2→1 → 改为临时 `console.count('relayout')` 计数 + 同批 `$nextTick` wall-clock；并注明两者为何不可用 | `demo/src/data/table-ex/main-view.vue:1262-1278` 为 200ms 轮询、仅 lastPaint 键变化才 +1；`table-ex.vue:518` 每次覆盖 lastRelayout；`:425-428` redraw 同步整幅——同批两次 relayout 只留最后一次，两者都数不出次数，原判据不可验证 | 是 |
| 3 | B 线「冻结的可验证性」+ 步骤 3 + 测试文件节 | 「警告键与文案逐字不变（自检断言按键捕获）」→ 列出 5 个未覆盖警告分支（`spans.js:225` 值形态无效、`:240` colspan、`:283` reserved、`:347` takenOver、`:361` orderBy）、键不可观测（`createWarner` 48-59 只传 message）、regions 顺序无断言，加临时探针前后逐字比对后删除 | `self-checks/spans.js` 仅 `includes`/条数断言，上述 5 分支无任何断言；187/187 + 现有单元自检守不住这些分支与去重语义 | 是 |
| 4 | B 线分解 + 接口节 applySpanMethod | 仅抽 `resolveDeclColumns`/`parseSize`/`resolveDeclaredColspan` → 增 `buildSpanInfo(records, columns, row, rowCount, recordsOffset)`；目标 `<10` 改 `≤10`（eslint 仅 >10 告警，计入 `&&`/`\|\|`/`??`） | eslint@8.57 Linter 对分解后的等价骨架实测 complexity **13**（>10 仍告警），加 `buildSpanInfo` 后通过；计入口径见 `eslint/lib/rules/complexity.js:105` `LogicalExpression` | 是 |
| 5 | B 线分解 + 接口节 applyAutoRowSpan | 原抽取清单 → 增 `advanceSegment(seg, key, row, segStartByCol, colIndex)`（`seg` 每列一次），close 保留 | 同法实测原分解 **12**（>10 仍告警），加 `advanceSegment` 后通过 | 是 |
| 6 | B 线 parseSize + 接口节 | `normalizeSpanValue(raw)` → `(raw, row, colIndex, emitWarn)`，由 `parseSize(raw, row, colIndex, emitWarn)` 组合 normalize+validate | 值形态无效警告文案含 `row`/`colIndex`（`spans.js:224-228`），原签名搬不过去，会丢掉该分支 | 是 |
| 7 | 文档变更清单 docs-site 行 + D 线 | 只改属性表 tree-props 行 + 事件表 → 追加 `docs-site/components/table-ex.md:191` 树模式正文 | 该行现写 `{ key, parentKey }`（`grep` 实测），只改表格会留下同页自相矛盾；测试计划 4 同步加正文检查 | 是 |
| 8 | 步骤 1 完成判据 | 「warning 余量 = complexity 范围外 ×2 + max-len ×10」→ 「complexity ×9（table-ex 5 + 待豁免 2 + 范围外 2）+ max-len ×10；步骤 3 后降至范围外 ×2」 | 步骤 1 时 B 线尚未实施，9 条 complexity 告警全在；原判据在步骤 1 必然不成立 | 是 |
| 9 | 测试计划 4 | 裸词 grep `tree-expand`/`tree-collapse` → 改为匹配反引号包裹的事件名 | 既有 `` `tree-expanded-keys` `` 含 `tree-expand` 子串（data.md:256、quick-reference:1770 等），裸词必然假阳性 | 否 |
| 10 | A 线裁定 #5 理由 + 配置清单 | 仅指 `vite.demo.config.js:206-209` → 补 `vite.config.js:55-56`；注明 `.eslintrc` 为 JSON 但 eslint 8 允许 `//` 注释 | `src/env.js:1` 已有 `/* global __version__ __env__ */`；库构建亦注入 `__version__`（vite.config.js:56）；注释可解析已核实 | 否 |
| 11 | 遵循约定 G2-a 行号 | `table-ex.vue:427-434` → `:430-433`（契约注释）+ `:425-428`（redraw 同步整幅） | 代码实测 | 否 |
| 12 | 其余措辞 | 「实施第一步」→「步骤 2」；prepareColumn/cell-painters 的 `<10` → `≤10`；repaintCount 注明非 relayout 计数；tree watch 不并入的理由改为「tree/treeProps 带 resolveInitialExpansion、tree 带 immediate」 | 与实测口径、`use-tree-rows.js:211/218/226` 一致 | 否 |
| 13 | 未解问题残留 6/7/8 | 原三项 → 逐条加「X 审改表态」与证据/约束 | 派发要求逐条表态；#6 维持（`--fix` 仅加首尾换行，Vue condense 不改渲染文本）；#7 维持（含 tree+records 同批属 P1 范围外的口径）；#8 维持（两页不得删 isLeaf/tree-expand 活样例） | 否 |

## 异议

无（全部问题已直接改入 `02-design.md`）。

残留表态：**#6 维持**（接受全量 `--fix`，理由与证据见 02-design.md 残留节）；**#7 维持**（树 watch 不并入 P1，并补「tree+records 同批只记录、不判 P1 退化」口径）；**#8 维持**（两页章节可微调，但不得删 isLeaf 懒加载与 `tree-expand`/`tree-collapse` 活样例，catalog 条目与 path 不动）。
