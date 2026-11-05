# 05-verify-1（第 1 轮独立验证）

VERDICT: PASS

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build`（4 次 vite build） | 退出码 0 | ex-development / ex-production 各 `✓ 330 modules transformed`；产出 mussel.ex.js 725.14 kB / mussel.ex.min.js 330.93 kB |
| 移动保真 diff（41 文件 `git show HEAD:<旧>` vs 新路径，仅 import 行外计数） | 0 异常 | `total=41 missing=0 nonimport_files=0` |
| grep 残余旧路径（src/ + demo/src/）三式 | 0 命中 | ① `table/ex/<旧文件名>` 直接引用 0；② ex/ 子目录内 `../<旧文件名>` 0；③ 目录外引用仅 `src/components/index.ex.js:2 → './table/ex/index.js'`（入口） |
| `find src/components/table/ex -type f -exec wc -l {} +` | PASS | 44 文件，最大 478（geometry/row-geometry-controller.js），全部 ≤500 |
| `eslint src demo/src`（全局 8.57.0） | 4 error（均基线既有） | main-view.vue 344/346 import/first；self-checks/cell-painters.js 49 no-unused-vars、2288 no-template-curly-in-string。stdin 跑 HEAD 基线同文件：同 4 error 同位置同规则 → 无新增 |
| `node evidence/smoke-interaction.mjs`（headless Edge CDP :9333） | 退出码 0 | `pass:true … "summary":{"passed":223,"total":223},"fails":0,"sel":{"row":0,"col":2},"copied":["记录 000001"],"editor":true,"selAfterEditor":null,"errors":[]`，完整结果见 evidence/smoke-result.json |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. ex/ 文件按功能域归入子目录 + 实施记录含完整映射与分组依据 | 命令（独立推导映射）+ 记录内容核对 | 41 个旧根文件全部在 8 个子目录找到同名新路径（cell-paint 8 / composables 10 / editing 2 / geometry 4 / interaction 4 / shared 4 / spans 3 / table-paint 6），内容 diff 仅 import 行（41/41）；映射与分组依据在 04-impl.md 中的完整性：派发约束独立验证禁止读 04-impl.md → 见「需人工检查」 | 实质 PASS（独立证实）；记录完整性需人工 |
| 2. 无遗留旧路径 import：build 退出码 0 | 命令 | `npm run build` 退出码 0；三式 grep 旧路径 0 命中（见命令结果） | PASS |
| 3. demo 冒烟：自检 223/223、编辑浮层、选中/复制、方向键、console 无错误 | 浏览器（CDP） | evidence/smoke-result.json：223/223 通过 fails=0；sel(0,2)→↓(1,2)→→(1,3)→←(1,2)；Ctrl+C 复制"记录 000001"=expectedCopy；编辑浮层出现且 selectedCell 清空、logDelta=2；scrollTop=120 viewChanged=true；errors=[] | PASS |
| 4. 行数复核全部 ≤500 | 命令 | 最大 478 行（geometry/row-geometry-controller.js） | PASS |
| 5. git 改动范围仅 ex/（含子目录）+ 目录外 import 引用处 | 命令（git status/diff） | ex/ 内：41 D（旧根文件）+ 8 新子目录 ?? + table-ex.vue M（28 行全 import）；目录外 import：demo/src/data/table-ex/ 13 文件 M（84 行改动全为 import 行，grep 非行计 0）。例外一项见范围核对 | PASS（含 1 项设计外 IDE 杂项） |
| 6. 分类理由记录于实施记录 | 记录内容核对 | 同标准 1，派发约束不读 04-impl.md | 需人工 |

## 范围核对

基线：f573055，00-task 快照 clean。对照 `git status --short` / `git diff --stat HEAD`：

- 任务范围内：`src/components/table/ex/`（41 旧根文件 D + 8 新子目录 ?? + table-ex.vue M + table-ex.scss / index.js 未动，index.js 仅导出 table-ex.vue）；`demo/src/data/table-ex/` 13 文件 M（目录外 import 引用处，84 行全为 import 行）
- 验证产物（gitignored / 工作区外）：`dist/`（本次 build 重刷）、`demo/dist/`（watch 06:55 重建，晚于源 06:52:59，服务内容为当前结构）、`/tmp` Edge 临时 profile、`evidence/`（edge-cdp.log、smoke-interaction.mjs、smoke-result.json）
- 无法区分：无
- 设计外改动：`.vscode/settings.json`（cSpell 词典追加 `"relayout"`，1 词，IDE 自动行为，零代码影响）。是否已在实施记录「偏离」节登记无法核对（派发禁止读 04-impl.md）→ 记录状态待人工确认；如按严格口径判「未记录」，本项可单独翻为 FAIL，余项不受影响

## 测试质量问题

无新增测试（纯重构任务，冻结行为为验收目标）。安全网有效：既有 223 条自检为真实断言（assertEqual 等，非"不抛错"）；本次 CDP 冒烟为运行时行为断言（选中坐标序列、复制文本精确比对 records[0].name、方向键坐标迁移、编辑浮层存在性 + 编辑/选中互斥）。

## 需人工检查

1. 04-impl.md「旧路径 → 新路径」映射完整性与分组依据（标准 1、6 的记录侧）：独立验证按派发约束未读取该文件；映射实质已由本次 diff/构建/运行时独立证实。
2. `.vscode/settings.json`（cSpell +relayout）是否登记于实施记录偏离节；未登记则属 IDE 杂项，建议人工确认去留。

## 验收入口（PASS）

1. 标准 2 — `npm run build`，退出码 0。
2. 标准 3 — demo watch 未运行则 `npm run demo:build`；打开 http://localhost:3000/data/table-ex/ ：①调试面板自检摘要"自检结果（223/223 通过）"；②点击"名称"列任一单元格出现选中描边，Ctrl+C 后粘贴应为"记录 000001"；③按 ↓ → ← 选中格随之移动；④点击"状态"列单元格出现编辑浮层；⑤DevTools console 无错误。
3. 标准 4 — `find src/components/table/ex -type f -exec wc -l {} +`，全部 ≤500。
4. 标准 1/5 — `git status --short`：改动仅 src/components/table/ex/（41 删 + 8 新子目录 + table-ex.vue）与 demo/src/data/table-ex/（import 更新），8 子目录即分类结果。

## 环境阻塞

无。3000 端口已有服务运行（PID 10184，非本会话启动，复用、未关闭）；headless Edge 由本会话在单次 Bash 调用内启动（CDP :9333，日志 evidence/edge-cdp.log），结束经 netstat 定位 PID `taskkill //F //T` 关闭，事后 9333 无监听（netstat 空输出）。

## 失败项

无。
