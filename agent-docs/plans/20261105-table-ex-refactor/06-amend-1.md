VERDICT: AMENDED

## 检查项结论（每项一行）

1. **覆盖**：AC1/2a/2b/2c 均有设计与手段；原 2c「留待主会话 playwright 点验」验证不了 AC2「基本交互正常」，已改为可执行 CDP 冒烟（附录 A）；25 个新增文件全部落在改动清单与片步骤内。
2. **事实一致**：路径与符号全量核对通过（demo 自检 8 符号、editor 15 符号、spans/row-geometry/painter/interactions 导出面均有余量）；行号/边界 2 处已改（item-painters 1010-1013 归 cell-text；`use-tree-rows.js:226`→211-214）；`isEditButtonHit` 968-988 与源码一致（注释 968-972 + 函数 973-988），保留原值；`BUTTON_ICON_SIZE` 归属与原文不符，已改。
3. **约定一致**：kebab-case、ctx getter 注入、C2 常量收拢、就近 import 均符合；`BUTTON_ICON_SIZE` 漏收拢已补入 constants（跨 2 文件消费）。
4. **影响面**：目录外消费方仅 `src/components/index.ex.js` 与 demo 6 个 self-checks，逐个符号核对后入口重导出全覆盖；无遗漏调用方/配置。
5. **可实施**：原「调用顺序」在 setup 期必然 TDZ（`relayoutAndRedraw` 拆出后为 const，tree immediate watch 步骤 3 就调用它）；ctx 契约缺十余键（含 `paintState`/`syncPaintState`/`hitAt`/`clickGuard`/`delayHideCellTooltip`/`genRecordKey`/`getLastRelayout` 等），T3 无法照做。已改为 host 袋 + 前向槽，逐键列出。
6. **风险与回滚**：补 shell 行数（原 420~470 估算偏低，按保留段 + ctx 项逐条计约 520）、demo 包新鲜度两条风险与对策；单向门仍为无，回滚 = revert 单 commit。
7. **范围**：无超出 AC 的改动；文档/skills/demo 仍零改动（基线只读 demo 页，不写 demo）。
8. **切片**：4 片 + 集成，判据可观察、AC 归属齐、片间无环；兜底 b 若触发新增 `use-view-computed.js` 已记入片 4 文件集合。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | 方案概述 #2、接口节「组合式 ctx/返回」 | 7 份独立 ctx 伪代码 → 单一 `host` 袋 + `Object.assign(host, useX(host))`，逐 composable 列全读取键与返回 | 原 ctx 清单缺十余键，T3 无处取：`paintState.getRecordKey`（table-ex.vue:382）、`syncPaintState`（:881）、`paintState.hoverItem` 写入（:929）、`itemHits`（:1105）、`clickGuard`（:1143）、`hitAt`（:1145）、`delayHideCellTooltip`（:956-966，与 hideCellTooltip 语义不同：delayHide vs hide）、`getPainter`（:1124 veil watch / :1457）、`genRecordKey`（:1369）、`getLastRelayout`（:1457）、`refreshTheme`（:1489）、`scrollFrame`/`onResize`（:1630-1631）、`tooltipController`（:636） | 是 |
| 2 | 接口节「组装顺序」+ 验证不变量 | 「tree immediate watch → relayoutAndRedraw → scrollEl 空早退」→ host `relayout: () => {}` 前向槽，useRelayout 后覆盖 | 拆出后 `relayoutAndRedraw` 是 const，useTreeRows 在 setup 期同步调用（use-tree-rows.js:211-214）必抛 `Cannot access 'relayoutAndRedraw' before initialization`；等价性：table-ex.vue:499-501 早退 + tooltip-core.js:129-131 `isAnchorIn(null)=false` | 是 |
| 3 | 改动清单 四 use-table-instances 行 | 实例槽 304-306/351-354 迁入 composable → 留在 shell 状态枢纽，经 host setter 写入 | 迁入后 `usePaintState/useRelayout/useTableApi` 需反向取实例（TDZ + 所有权歧义），且 `onThemeChange` 写 `wrapCacheObj`（:1428）无 setter 契约；留 shell 与现实现同作用域，diff 更小 | 是 |
| 4 | 改动清单 四 use-pointer 行 | 310-315 hover/hoverItem/cursor 迁入 use-pointer → 留 shell | hover/paintState 双向读（table-ex.vue:441-446、:881、:928-929），且 paintState 需在 pointer 之前创建（paintState 读 hover）；留 shell 与现实现同作用域 | 是 |
| 5 | 常量收拢、三 constants 行、片 2 步骤 1 | 3 个常量 → 4 个：`BUTTON_ICON_SIZE` 一并迁 constants | 原文称其「单文件消费」，实际 `cell-painters.js:1613`（buttonsOverflowOf→cell-tooltip）也消费；不迁则 cell-tooltip 无法 import（非导出） | 是 |
| 6 | 改动清单 一 item-painters 行 | 711-1097 → 711-1008、1015-1097；fontFamilyOf（1010-1013）明示归 cell-text | 原行段与 cell-text 的 1010-1013 重叠，照做会重复定义 `fontFamilyOf`（build 报 duplicate declaration）；证据 cell-painters.js:1010-1013 | 否 |
| 7 | 四「估算」+ 片 4 步骤 4 | 「420~470，兜底两条」→「≈400~450（host 袋）」+ 三步阶梯（spans→paint-state / 视图 computed→新文件 / 停下回报），每步给范围与预算 | 按保留段 387 行 + 原 ctx 约 100 项 × ~1.3 行 ≈ 520 行，超 AC1；原兜底第 2 条「editor→use-cell-click」会击穿 usePointer/useRelayout 的 editor 契约，未给 ctx 变更 → 不可执行 | 是 |
| 8 | 测试计划（2b/2c/冻结基线/lint/git status） | 2c「dump-dom + 留待主会话」→ CDP 实测脚本（附录 A）；基线补 md5 + 归一化 MUSSEL 序列命令；lint 补 0 error/6 warning 基线；`git status` 补任务目录 | 原「console 逐字比对」不可执行：console 含 `Date.now` 后缀（如 `noRegEntry1793890737242`）与 bundle 行号 `(13503)`，拆分后必变；实测两次 dump：`.ct-self-checks` md5 一致、MUSSEL 6 条序列归一化后一致；CDP 实测：223/223、editor=true、日志 1→3、viewChanged=true、errors=[]；lint 实测 0 error/6 warning | 是 |
| 9 | 实施步骤 片 1 / 片 4 / 集成 | 基线采集具体化；片 4 改 0-12 步 host 组装；集成加新鲜度门、CDP、提交范围（仅 src） | 原步骤「按接口节签名」在缺键/顺序错误下无法照做；旧 demo 包会让断言假通过（demo/dist/assets/catalog.js 为 watch 产物） | 是 |
| 10 | 未解问题 | 2 条未解 → 0 条，写入两项裁定 | 派发追加约束要求两项给出裁定并写入设计 | 是 |
| 11 | 命名先例、依赖图、paint-body 导出描述 | `use-tree-rows.js:226`→211-214；依赖图删去不存在的 `cell-text ← paint-header`；删「paintGridlines 由 paint-body 导出」自相矛盾表述 | 事实核对：painter.js 无 cell-text 符号引用；paintGridlines 定义在 paint-gridlines.js | 否 |
| 12 | 接口节「新文件导出」 | 只列 cell-painters 簇导出 → 补 painter 簇最小导出面 + spans-method/spans-auto/fenwick/schedulers/link-items 导出 | T3 无法从范围描述反推跨文件符号；漏一个即 build 报 import 不存在：painter.js:1215-1246（paintFull 消费 paintGridlines/paintFixedArea/paintHeader/paintOverlay/viewColsRange 等）、spans.js:474/490（registerRegion/isOccupied 跨文件） | 是 |

## 未解决异议（累计）

无。
