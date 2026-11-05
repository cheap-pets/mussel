# 验证报告（第 1 轮 · 简单冒烟）

VERDICT: PASS

- 被检对象：工作区 HEAD `9d61316`（`🔨: 拆分 table-ex 大文件为按功能关注点的小模块`，父提交 `e3c55ea` = 00-task 基线）
- 独立验证：未读取 04-impl.md，全部结论来自本人执行
- 范围：派发限定的 4 项简单冒烟；设计测试计划中 eslint、冻结基线 md5/MUSSEL 序列比对、逐片细分项属详细检查，归后续流水线（见「范围外未检项」）

## 上轮问题核对（第 2 轮起）

首轮，无。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `git log --oneline -3` | 0 | `9d61316 🔨: 拆分 table-ex 大文件为按功能关注点的小模块` / `e3c55ea 🔨: 统一 button 列定义` / `0836783 …` |
| `find src/components/table/ex -type f \( -name '*.js' -o -name '*.vue' -o -name '*.scss' \) -print0 \| xargs -0 wc -l \| sort -rn` | 0 | 42 个文件全部 ≤500；最大 `row-geometry-controller.js 478`（本次提交未触及的既有文件），其余见证据文件 |
| `npm run build` | 0 | 4 段全过：base dev/prod（tail 截断前）+ ex-development `328 modules transformed, ✓ built in 503ms` + ex-production `328 modules transformed, ✓ built in 514ms`；无 error |
| `find src/components/table/ex -newer demo/dist/assets/catalog.js`（新鲜度门） | 0 | 输出为空 → demo 包不旧于任何 ex/ 源码 |
| `curl -s -o /dev/null -w %{http_code} http://localhost:3000/data/table-ex/` | 0 | `200`（3000 站点已在运行，非本人启动，无 PID 交接） |
| 附录 A 启动：headless Edge `--remote-debugging-port=9333 --user-data-dir=/tmp/edge-smoke`（后台，重定向至 evidence/edge-smoke.log） | — | 日志 `DevTools listening on ws://127.0.0.1:9333/devtools/browser/1cfd8d1f-…`；浏览器进程 PID 3308（netstat + 日志前缀 `[3308:…]` 双证） |
| `node evidence/smoke-interaction.mjs`（= 02-design.md 附录 A 脚本逐字执行） | 0 | `{"pass":true,"ok":true,"summary":"自检结果（223/223 通过）","fails":0,"canvas":[956,416],"editor":true,"logDelta":2,"viewChanged":true,"scrollTop":120,"errors":[]}` |
| `taskkill //F //T //PID 3308`（收尾） | 0 | 终止 3308 及 8 个子进程；随后 `netstat -ano \| grep :9333` 输出为空，端口已释放；`/tmp/edge-smoke` 已删除 |
| `git show --name-only --format= HEAD \| grep -cv '^src/components/table/ex/'` | 0 | `0`（提交内目录外文件数 = 0） |
| `git status --short`（构建后复核） | 0 | 仅 `?? agent-docs/plans/20261105-table-ex-refactor/`；`git check-ignore dist` = ignored（构建产物未入状态） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. ex/ 内所有源码文件 ≤500 行（wc -l 复核） | 命令 | 上表 wc -l 行：42 文件（41 .js/.vue + table-ex.scss… 即 ex/ 全部 .js/.vue/.scss），最大 478，无任何文件 >500 | PASS |
| 2a. 库构建无报错 | 命令 | `npm run build` 退出码 0，base/ex × dev/prod 四段全过（ex 两段见上表） | PASS |
| 2b. demo 页正常渲染、无 console 错误 | 浏览器（CDP，附录 A） | `ok:true`、`canvas:[956,416]`（宽高 >0）、`summary:"自检结果（223/223 通过）"`（= 设计记录的改前基线计数 223/223）、`fails:0`、`errors:[]`（`Runtime.exceptionThrown` / `console.error` 均无）；evidence/smoke-result.json | PASS |
| 2c. 滚动/编辑入口等基本交互正常 | 浏览器（CDP，附录 A 合成点击） | `editor:true`（列 3 点击 150ms 内 `.mu-table-ex__editor` 出现）、`logDelta:2 >0`（`.ct-event-log__item` 增加）、`viewChanged:true`（scrollTop=120 后 `getLayoutInfo().viewRows` 变化，`scrollTop:120`） | PASS |
| 范围：提交改动未超出 src/components/table/ex/（目录外零源码改动） | 命令 | `git show --name-only HEAD` 共 33 个文件全部位于 `src/components/table/ex/`，目录外计数 0；工作区除任务目录 untracked 外 clean | PASS |

附录 A 断言全项满足：`pass=true` 且退出码 0。

## 范围核对

- 基线排除项：`agent-docs/plans/20261105-table-ex-refactor/`（untracked，00-task 基线快照已登记的任务目录）。
- 验证产物：`dist/`（`npm run build` 产生，`git check-ignore dist` 确认被忽略）；`evidence/`（edge-smoke.log、smoke-result.json、smoke-interaction.mjs 存档）。
- 无法区分：无（基线快照 clean，无并发脏文件）。
- 设计外改动：无。提交 33 个文件全部在 ex/ 白名单内（追加约束"目录外零源码改动"满足）；对照 02-design.md 改动清单：33 文件 = 新增 25（cell-content/cell-text/icon-image/item-painters/link-items/canvas-kind-painters/cell-tooltip/paint-utils/paint-body/paint-gridlines/paint-header/paint-overlay/spans-method/spans-auto/editor-resolve/schedulers/fenwick/edit-button/use-cell-tooltip/use-paint-state/use-pointer/use-cell-click/use-relayout/use-table-instances/use-table-api）+ 改写 7（cell-painters/painter/spans/editor/interactions/row-geometry/table-ex.vue）+ constants.js 增 4 常量，与设计完全一致；确认零改动清单（index.js、table-ex.scss、demo/、docs*/ 等）均未出现在提交中。
- 说明：设计附录 A 约定临时脚本"交付前删除"（指交付 diff）；任务目录不入库（设计集成步骤 6"仅 src"），故存档于 `evidence/smoke-interaction.mjs` 不影响交付 diff，且留作执行证据。

## 测试质量问题

本轮无新增测试（重构任务，项目无测试框架；demo 自检 223 项为既有安全网）。冒烟脚本断言的是实质验收点（编辑浮层 DOM 出现、事件日志增量、viewRows 实际变化、console 错误为空），非"仅不抛错"。

## 需人工检查

设计测试计划无标"人工"的条目。以下属自动化断言覆盖之外的观感项，归后续详细检查：

- canvas 像素级视觉观感（tag 颜色、hover 高亮、行背景、格线对齐）——本冒烟仅断言 canvas 尺寸 >0 与自检计数，未做像素断言。

## 验收入口（PASS 时必填）

- 验收 1 — `wc -l src/components/table/ex/*.js src/components/table/ex/*.vue src/components/table/ex/*.scss`：输出最大 478 行（row-geometry-controller.js），无 >500。
- 验收 2a — `npm run build`：退出码 0。
- 验收 2b/2c — 若 3000 端口未运行先执行 `npm run demo:build`，然后浏览器打开 `http://localhost:3000/data/table-ex/`：① 页面渲染正常，自检区块显示「自检结果（223/223 通过）」；② 点击"状态"列单元格（或数量/金额/日期/备注/启用列）约 150ms 内出现编辑浮层，事件日志新增条目；③ 滚动表格后视图行随滚动更新；④ DevTools console 无错误。

## 环境阻塞

无。

## 失败项（FAIL 时）

无（VERDICT: PASS）。

## 范围外未检项（非本轮 FAIL 依据，归后续详细检查流水线）

- `eslint src/components/table/ex`（设计测试计划 lint 行）
- 冻结基线 md5 / 归一化 MUSSEL 消息序列逐字比对（baseline.txt 已按设计集成步骤删除，无法复核）
- `--dump-dom` 通道的 DOM md5 断言（本轮以 CDP `Runtime.evaluate` 取得等价 DOM 数据）

## 证据文件

- D:\workshop\cheap-pets\mussel\agent-docs\plans\20261105-table-ex-refactor\evidence\smoke-result.json
- D:\workshop\cheap-pets\mussel\agent-docs\plans\20261105-table-ex-refactor\evidence\smoke-interaction.mjs（附录 A 逐字存档）
- D:\workshop\cheap-pets\mussel\agent-docs\plans\20261105-table-ex-refactor\evidence\edge-smoke.log
