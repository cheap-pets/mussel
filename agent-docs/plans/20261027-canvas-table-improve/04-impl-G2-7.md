# 实施记录：G2-7（self-checks/tree.js — A8 平铺排序重组断言）

模式：并发（波 2c / 步骤 G2-7）。白名单：`demo/src/data/canvas-table/self-checks/tree.js`（仅此文件）。依赖：G1-a（tree.js 纯函数为既有源码，本轮零改动，仅消费其导出）；排序比较器口径以 04-impl-G2-1.md 实际形态为准（main-view.vue applyOrder：字符串 → `localeCompare`，desc 取反，main-view.vue:737）。

## 改动摘要

既有文件上扩展（非新建），净变更 +253/−3，全部在 demo/src/data/canvas-table/self-checks/tree.js，对应 02-design.md 测试计划 A8 行 + 改动清单 self-checks/tree.js 行：

- **文件头 docblock**：标注「G2-7 扩 A8 排序重组断言」，记 A8 断言范围（父级 Array.sort 后 childrenIndex 同级收集 + DFS 重组的五项性质）。
- **A8 夹具与辅助（模块级，`export const checks` 之前）**：
  - `compareByName(direction)`：夹具排序比较器，与 demo main-view.vue applyOrder 字符串分支逐字同口径（`a.name.localeCompare(b.name)`，desc 取反）；注释明示「勿自创 a < b」、**不 import demo main-view.vue**（排序由父级执行的契约口径，decisions 检查点-人工2）。
  - `SORT_RECORDS`（13 行，刻意乱序、子先于父）：3 层（根/子/孙）、同级 ≥3 节点（3 根；k2 下 3 子）、不同父下同名子键（'子-a' 分布于 k1/k2、'孙-1' 分布于 k1-a/k2-a/k3-a）、同父同名兄弟（k2-c/k2-a 均 '子-a'，稳定性用例）。
  - `SORT_PARENT_OF` / `SORT_CHILDREN_OF`：结构不变断言的期望父链与期望子集合（由夹具派生）。
  - `rebuildSorted(direction)`：`[...SORT_RECORDS].sort(...)` → `buildChildrenIndex` → `buildFlatRows`（`expandedKeys` 直用 `hasChildren` Set 全展开，`childrenIndex` 复用传入）。
  - `replayStructure(rows, levels)`：栈式重放开放祖先链——每行层级相对前行至多 +1（更深即跨层级穿插报错）；非根行父 = 上一层开放行 = 夹具 pid（子节点仍在原父下）；返回 `Map<''|pid, 兄弟行数组>`。
  - `assertChildrenSets(groups)`：3 根 + 6 父桶子集合逐一与夹具一致；`assertSiblingOrder(groups, direction)`：每组兄弟 name 升序非递减 / 降序非递增（与夹具排序同比较器，不引入独立 collation 期望——全部断言为关系式，不依赖具体 collation 排序结果）。
- **`checks` 数组追加 4 条断言**（见断言清单）。既有 8 条断言未改。

## 断言清单（本步新增 4 条）

1. 平铺排序 → buildChildrenIndex 同级收集：同父桶按排序序（**升/降序两态**，asc/desc 各 6 桶；桶成员数 = 夹具子集合、逐 id 在桶、桶内 name 非递减/非递增）。
2. 乱序平铺升序排序 → childrenIndex + buildFlatRows 重组：全展开 13 行；replayStructure 逐行父链校验（父子结构不变、层级至多 +1 步进 = 不跨层级穿插）+ 6 父桶子集合与夹具一致 + 每级兄弟有序（根级与二级均覆盖）。
3. 降序两态：同级 name 非递增 + 父子归属与夹具一致 + 行集合（排序后 id 串）与升序产物一致（排序不改结构）。
4. 排序稳定性 + 不同父同名子键不穿插：k2 下同 key（同名 '子-a'）兄弟保持乱序夹具相对出现序（`[k2-c, k2-a]`，期望由夹具派生，非硬编码）；'子-a' ×3 分布 k1×1/k2×2、'孙-1' ×3 三父各 ×1，各归其父。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| demo/src/data/canvas-table/self-checks/tree.js | G2-7（测试计划 A8 行） | 文件头 docblock 扩注；新增 A8 夹具（SORT_RECORDS 等）+ 4 个断言辅助函数 + checks 追加 4 条断言；组件源码（src/components/canvas-table/tree.js）零改动 |

## 偏离

无。

（边界内说明，非偏离：① 新文件注册问题不适用——self-checks/tree.js 为既有文件，self-checks/index.js:15 已导入注册，index.js 的 `moduleChecks` 通用聚合机制使新增断言自动进入运行时面板，无需任何注册改动；② 断言对排序结果的期望全部为关系式（同比较器下的有序性、集合相等、相对序），不硬编码任何依赖 locale collation 的期望序列，Node/浏览器 ICU 差异不影响判定；③ 中途发现并修复断言代码自身一处笔误（`assertChildrenSets` 根数误取数组不存在的 `.size`，应为 `.length`，首跑即被 node 直调捕获），属本文件内部修复，非设计偏离。）

## 自检（完成判据逐条）

| 判据 | 命令 / 方式 | 结果 |
|---|---|---|
| eslint 单文件通过 | `NODE_PATH=/usr/local/lib/node_modules npx eslint demo/src/data/canvas-table/self-checks/tree.js` | **0 error / 0 warning**，exit 0（首跑 1 处 spaced-comment error，`eslint --fix` 修复后复跑通过；`.size`→`.length` 修复后三跑通过） |
| node 直调本文件断言全过 | 临时副本将 `@/components/canvas-table/tree.js` 别名改写为 file:// URL（tree.js 源文件无内部 import，可直跑），node ESM 顺序执行 `checks` 全部 12 条 | **12/12 PASS**，exit 0（既有 8 条不回归 + 新增 4 条全过；临时目录已清理） |
| 契约边界 | 断言仅 import `@/components/canvas-table/tree.js` 的 buildChildrenIndex/buildFlatRows（与既有 import 块共用），不 import demo main-view.vue；排序动作在夹具侧（Array.sort），组件侧纯函数只验重组性质 | PASS |
| 白名单 | 本轮仅改 self-checks/tree.js（git status 中其余 demo/src 文件为 G1/S4/S5/其他 G2 组在途状态，本组未触碰）；未启停服务、未 git commit/push、未做页面级验证（按派发本组不做） | PASS |

## 遗留

- 本组不做页面级验证（派发判据）。A8 的浏览器侧断言（树场景表头三态箭头、`window.__ctStage` 舞台数据兄弟序/不跨节点断言、「树排序成本测量」sortMs/relayoutMs/paintMs 实测与 stale 判据）及 A9 运行时面板新基线总数（本步 +4 条）由 V 集成验证执行。
- 树排序成本实测数字回填 02-design.md 问题 8 节（verifier 执行）。
- eslint 环境沿用前序各组备注：需 `NODE_PATH=/usr/local/lib/node_modules` 前缀（本地 node_modules 缺 eslint-config-standard）。
