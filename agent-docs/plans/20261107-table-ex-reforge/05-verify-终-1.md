# 终验报告 — 波次1+波次2 追加维护（05-verify-终-1.md）

VERDICT: PASS

验证人：pipeline-verifier（终验模式，全新独立实例；全部结论以自己运行的命令输出与代码现状为准，不采信实施记录自检结果）。基准 HEAD `ee16eb4`（与 02-design.md 设计基准一致），验证时间 2026-11-08。
证据目录：`evidence/`（build-verify-final-1.txt、eslint-verify-final-1.txt、diff-table-ex-vue-final.txt、console-final-errors.txt、codecheck.cjs 核对工具）。demo 服务非本验证启动，未做启停管理。

## 审查摘要（用户按此审查 diff）

**两波改了什么 / 为什么**：

| 波次 | 改动 | 文件 | 为什么 |
|---|---|---|---|
| 波次1-修复A | 头注释旧引用 interactions.js（B4 已删）→ 改指 hit-test.js / click-resolve.js，仅注释 | src/components/table/ex/composables/use-pointer.js:2-3 | 消除指向已删除文件的过时引用 |
| 波次1-修复B | runChecks 增加重跑计数：`checkRunCount` → `check.fn(isRerun)`（index.js）；icon 自检项 `fn: (isRerun)` + warn-once 重跑分支断言（cell-painters.js:2284,2298-2305） | demo/src/data/table-ex/self-checks/index.js、cell-painters.js（decisions.md 解除冻结的唯二文件） | 修复 verify-1 记录的「重跑自检 240/241」：icon 项固定消息键 warn 被 warn-once 去重，重跑不再发出而断言仍要求发出 |
| 波次2 | src/components/table/ex/ 全目录注释精简（9 批），要求仅注释行变更；含 table-ex.vue:336、table-ex.scss 等旧引用更新 | src ex/ 26 M + 3 untracked（新文件仅注释编辑）+ scss | 精简复述注释、更新 B1-B4 后过时引用（旧目录名/已移动符号），降低检索噪声 |

**先看哪些文件**：
1. `git diff demo/src/data/table-ex/self-checks/index.js demo/src/data/table-ex/self-checks/cell-painters.js` — 波次1 仅有的代码语义改动（重跑机制 + icon 项分支），授权依据 decisions.md「自检断言冻结仅对 icon 列重跑判错项解除」。
2. `git diff src/components/table/ex/table-ex.vue` — 仅 1 行注释（API 冻结复核项）。
3. 任一 src ex/ 文件 `git diff` — B1–B6 已验改动之外的全部 hunk 均为注释行（本次已逐文件机械核对，非抽样）。

**已验证项**（7/7 全过，下详）：build exit 0；eslint 零新错（4 error 均 HEAD 存量）；两门禁脚本 exit 0；API 冻结（index.js diff 空、table-ex.vue 仅注释）；demo 241/241 + 重跑×2 幂等 + console 仅夹具 error；范围核对全覆盖（去注释代码流逐文件比对，非抽样）；R4（自检断言变更仅两授权文件 + src 零设计外代码 token）。

**需人判断的点**：见「需人工检查」（视觉走查可选；untracked 三新文件的波次2注释-only 为佐证级核对非 diff 级）。

## 上轮问题核对（相对 05-verify-1）

| 上轮事项 | 本轮结论 |
|---|---|
| 重跑自检 240/241（icon 列 warn-once，记录为已知重跑工件非重构引入） | 已解决：波次1修复B 后重跑×2 均 241/241（本轮 playwright 实证） |
| 需人工1：视觉等价走查（可选） | 未执行（可选项），继续保留在「需人工检查」 |
| 需人工2：verify-<批>.md 落盘形态缺口 | 以替代形态闭合：波次记录 04-impl-精简-批1~9.md + 04-impl-fix-*.md 各附改动文件与自检；本报告顶部摘要覆盖全量 diff 审查入口 |

## 命令结果

| 命令 | 状态 | 关键输出 |
|---|---|---|
| `npm run build` | exit 0 | dev+prod 与 ex-development+ex-production 四通道全过；334 modules；dist/mussel.ex.js mtime 09:41（本轮新鲜） |
| `/d/npm/global/eslint src/components/table/ex demo/src/data/table-ex --ext .js,.vue` | exit 1（存量） | 17 problems = 4 error + 13 warning；4 error 均存量（见验收标准 2 核对）；src ex/ 内 0 error；evidence/eslint-verify-final-1.txt |
| `node scripts/table-ex-structure-check.mjs` | exit 0 | `OK — 扫描 46 个文件，零纯转发 re-export（豁免公共入口：index.js）` |
| `node scripts/table-ex-host-audit.mjs` | exit 0 | `OK — 审计 10 个 composables 文件，host 键声明零缺失`（10 文件逐行 used/declared 清单） |
| `git diff src/components/table/ex/index.js` | 空 | 输出为空行 |
| `git diff src/components/table/ex/table-ex.vue` | 1 行变更 | 仅 L336 注释：`文件头 @getters 声明` → `的 @param deps 声明`（evidence/diff-table-ex-vue-final.txt） |
| `node evidence/codecheck.cjs <31 文件>` | 18 CODE-IDENTICAL / 8 CODE-DIFF=B1-B6 / 1 D / 3 untracked 佐证 | 去注释代码流 HEAD vs 工作区逐文件比对（工具 evidence/codecheck.cjs，输出全文见本报告「范围核对」） |
| playwright：加载/重跑/console | 全过 | 241/241 ×3；✗=0；console error 仅 `data:image/png;base64,AAAA` ×3（每次运行 +1，夹具预期）；evidence/console-final-errors.txt |

## 验收标准核对（派发 7 项）

| # | 验证项 | 手段 | 证据 | 结果 |
|---|---|---|---|---|
| 1 | 构建 exit 0 且 dist 新鲜 | 命令 | `npm run build` exit 0；334 modules；dist/mussel.ex.js 2026-11-08 09:41 | PASS |
| 2 | 全局 eslint 零 error（存量豁免） | 命令 + HEAD 比对 | 4 error：main-view.vue:347,349 import/first（该文件不在 git status 改动集 = HEAD 原样，误差必为存量）；self-checks/painter.js:1259,1269 spaced-comment（`git show HEAD:…painter.js` L1258/1268 同款 `//（` 无空格注释，B1 import 拆行使行号 +1）→ 4/4 存量，零新 error。13 warning 全部存量口径（与 05-verify-1 基线 17 problems 同集） | PASS |
| 3 | 两门禁脚本 exit 0（注释精简未破坏 @host 注解与转口清零） | 命令 | structure-check：46 文件零纯转发 exit 0；host-audit：10 composables 声明零缺失 exit 0 | PASS |
| 4 | API 冻结 | git diff | index.js diff 为空；table-ex.vue diff 仅 1 行注释（L336），props/emits/defineExpose 零变化 | PASS |
| 5a | 全新加载自检 241/241 | 浏览器（DOM） | cache-bust URL `?v=finalverify-20261108a` 加载 → 面板「自检结果（241/241 通过）」 | PASS |
| 5b | 点「重跑自检」全部通过（icon 项不再判错） | 浏览器（DOM） | 重跑第 1 次 → 241/241，全页 ✗ 计数 0，icon 列项无 ✗ | PASS |
| 5c | 再重跑一次幂等 | 浏览器（DOM） | 重跑第 2 次 → 241/241，✗=0，iconFail=false | PASS |
| 5d | console 无新 error | 浏览器 | 3 error 全为 `Failed to load resource: net::ERR_INVALID_URL @ data:image/png;base64,AAAA`（自检夹具故意非法图片 URL，每次运行 +1），无其他错误类型 | PASS |
| 5-附 | 加载的是新 bundle | grep dist | demo/dist/data/table-ex/main.js 含 `isRerun`×6、`checkRunCount`×2；且 dist mtime 09:42:36（touch 后重建，前值 09:35:54） | PASS |
| 6 | 范围核对（改动集 ⊆ 设计清单 + 波次1 两文件 + src ex/ 注释） | git status + 逐文件代码流比对 | 见「范围核对」节，全部改动可归账，无未记录设计外改动 | PASS |
| 7 | R4：自检断言变更仅限两授权文件；src 无代码 token 变更 | 代码流比对 + diff | 见「范围核对 / R4」节 | PASS |

## 各验证项明细

### 波次1（修复A/B）核对
- use-pointer.js:2-3 头注释现指向 `interaction/hit-test.js 与 interaction/click-resolve.js`，与文件 import 行（:16-17）一致；`grep -rn "interaction/interactions" src demo/src --include="*.js" --include="*.vue"` → 0 命中（exit 1，本轮一手复跑）。
- index.js runner diff（U3，hunk @@ -40,13 +40,20）：仅 `let checkRunCount = 0`、`const isRerun = checkRunCount++ > 0`、`check.fn()` → `check.fn(isRerun)` + 机制说明注释；无断言变更。
- cell-painters.js diff（U3，hunk @@ -2281 / @@ -2295）：仅 icon 项 `fn: () =>` → `fn: (isRerun) =>`、重跑分支 `assert(!warnings.some(... '实际类型 number'), '非 string dev warn 未重复触发（warn-once 去重）')` + else 保留首跑原断言逐字 + 2 行注释；其余 240 项断言零触。

### 波次2（注释精简）核对 — 去注释代码流逐文件比对（evidence/codecheck.cjs）
对 `git diff --name-only -- src/components/table/ex` 全部 27 文件（26 M + 1 D）执行「剥离注释 + 字符串保护 + 空白归一后 HEAD vs 工作区全量比对」：

- **CODE-IDENTICAL（18 文件，零代码 token 变更）**：cell-paint/{canvas-kind-painters, cell-content, cell-painters, cell-tooltip, icon-image}、composables/{use-cell-select, use-tree-rows}、geometry/{layout, row-geometry}、shared/text-wrap、spans/{spans-auto, spans-method, spans}、table-ex.scss、table-ex.vue、table-paint/{paint-body, paint-header, paint-utils}。
- **CODE-DIFF 全部为 B1–B6 设计清单内改动（8 文件）**：use-cell-click / use-cell-tooltip / use-column-resize（B4 import 改引，各 1 处）、use-pointer（B4 import 拆分 1→2 行）、use-table-api（B1 import painter→paint-utils）、painter（B1 删 re-export 转口行，仅此 1 片段）、row-geometry-controller（72 片段全为 B2 ctx→deps + B6 recordNumberOf/syncAnchoredLayout 收敛）、paint-overlay（85 片段全为 B5 cellFrameOf/strokeBodyFrame 提取）。无任何 B1–B6 之外的代码变更。
- interaction/interactions.js：D（B4 设计内删除）。
- **untracked 3 新文件（hit-test 183 / click-resolve 218 / resize-resolve 18 行）**：无 HEAD 基线可 diff。佐证：行数与 05-verify-1 记录的 B4 后行数 184/218/18 之差恰为批7 自报的注释行增减（hit-test −1，其余 0）；批7 点名的 2+1 处编辑区实查均为注释（hit-test.js:15 contentRightEdgeX 单行注释、click-resolve.js:163 JSDoc 内 item-painters 引用更新）。结论：佐证级成立（标注见「需人工检查」）。

### R4 核对
- 自检断言变更：5 个改动 self-check 文件代码流比对 — painter.js/spans.js 仅 import 行（B1 设计内）、interactions.js 仅 import 块拆 3 条（B4 设计内）、index.js 仅重跑计数机制、cell-painters.js 仅 icon 项分支 → **断言级变更仅落波次1授权的两文件**，与 decisions.md 一致。
- src 组件：见上，除 B1–B6 设计内改动外零代码 token 变更；B1–B6 语义等价性已由 05-verify-1（探针基线逐字比对 + 等价性校验点）闭环，本轮未推翻其结论。

## 范围核对

git status 改动集逐项归账（对照 02-design.md 改动清单 + 波次1 两文件 + src ex/ 注释变更）：

| 归账 | 文件 |
|---|---|
| 02-design 改动清单内 | src ex/ 26 M + 1 D + 3 新（B1–B6）；self-checks/{painter,spans,interactions}.js（B1/B4 import 行）；scripts/ 恰 2 文件（structure-check / host-audit，ls 实证） |
| 波次1 授权两文件 | self-checks/{index.js, cell-painters.js} |
| src ex/ 注释行变更（波次2） | 上表 18 个 CODE-IDENTICAL 文件 + 3 untracked 新文件的注释编辑 |
| 收尾派发产物（decisions.md [收尾] 授权，run.log #9-11） | agent-docs/knowledge/INDEX-table.md（锚点更新）、agent-docs/knowledge/project/table-ex-structure-map.md（现状同步） |
| 基线脏文件（00-task 基线快照已有，排除） | todo/misc.md、agent-docs/knowledge/project/table-ex-performance-profiling.md |
| 基线未跟踪文档（排除） | agent-docs/plans/*（含本任务目录与既有 plans 子目录）、table-ex-structure-refactor-summary.md |
| 本验证新增产物 | 任务目录 evidence/ 5 文件（build/eslint/diff/console 日志 + codecheck.cjs 工具）、05-verify-终-1.md、知识条目 2 文件（见收尾节） |

无法区分：无。未记录设计外改动：无。

## 测试质量问题

- 波次1新增的重跑分支真实断言 warn-once 语义（重跑断言「未重复触发」），非「不抛错」式空断言；首跑口径逐字保留于 else 分支。
- 已知边界（实施记录遗留项，非缺陷）：HMR 组件重挂载不重置 `checkRunCount`，重挂载后首跑按重跑口径断言；demo 正常使用路径（onMounted 首跑 + 按钮重跑）不受影响，本轮 DOM 实证未受此影响。

## 需人工检查

1. **视觉等价走查（可选，承 verify-1）**：hover/选中描边 1px 观感。已有强等价证据链（verify-1 探针基线 + 本轮 build/自检/console 全过，且波次2 零代码 token 变更进一步排除回归源）。如需确认：访问 http://localhost:3000/data/table-ex/，hover 可编辑格（蓝）/不可编辑格（灰）/选中格。
2. **untracked 三新文件的波次2 注释-only 为佐证级**（非 diff 级）：依据为行数差吻合 + 点名编辑区实查为注释 + Edit 工具为唯一修改通道。如需 diff 级证明，可将三文件与 B4 批次时点快照比对（工作区无该快照，无法自动执行）。

## 失败项

无。

## 环境阻塞

无。demo 服务已在运行（/data/table-ex/ 200）；eslint v8.57.0、node、playwright mcp 均可用。已知环境 quirk（agent 编辑写入不触发 demo watch 重建、server 无 Cache-Control）按派发口径处理（touch + cache-bust + dist mtime 轮询），不构成阻塞。

## UNVERIFIED

无。

## 收尾：知识沉淀（派发特别授权）

按 project-knowledge 规范新增 1 条（读 INDEX.md 头部规则判定：症状可匹配 → `pitfall`；本项目 demo 环境 → project 作用域；无同主题既有条目）：

- 新建详情：agent-docs/knowledge/project/demo-watch-agent-edit-cache-bust.md（30 行，pitfall 模板）
- INDEX.md 加 1 行（Project 组，紧跟既有 demo-watch 条目）：`demo 验证：编辑工具写入不触发 watch 重建 + 浏览器缓存旧 bundle`，来源 `code@worktree(2026-11-08)`
- 证据：curl -I 实测响应无 Cache-Control；touch 后 dist mtime 09:35:54 → 09:42:36；INDEX.md 现 51 行（≤100）

## 验收入口

1. 门禁清零（验证项 3）：`node scripts/table-ex-structure-check.mjs && node scripts/table-ex-host-audit.mjs` → 两行 OK。
2. API 冻结（验证项 4）：`git diff src/components/table/ex/index.js` → 空；`git diff src/components/table/ex/table-ex.vue` → 仅 1 行注释。
3. 构建（验证项 1）：`npm run build` → 退出码 0。
4. lint（验证项 2）：`/d/npm/global/eslint src/components/table/ex demo/src/data/table-ex --ext .js,.vue` → 4 error + 13 warning（均为 HEAD 存量，src ex/ 内零 error）。
5. demo 行为（验证项 5，watch 服务运行中）：访问 `http://localhost:3000/data/table-ex/?v=<任意时间戳>`（加参数避缓存）→ 「自检结果（241/241 通过）」；点「重跑自检」两次 → 均仍 241/241（icon 列项不再判错）。
