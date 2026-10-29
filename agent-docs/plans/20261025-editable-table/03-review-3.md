VERDICT: APPROVE

## 上轮问题核对（第 2 轮）

| 上轮 # | 级别 | 结论 | 证据与说明 |
|---|---|---|---|
| 1 | major | 已解决 | 三处修正均落地：① `self-checks/cell-painters.js` THEME 补 `bgStrong` 并新增「固定底色 → drawCell → 盒中心合成值」断言（02-design.md:117）；② 测试计划 #8 改合成色口径、明确采样点（禁用行、未勾选、盒中心、同行实测行底色、鼠标移开、±2，:448）；③ G1-b 文件集合与判据同步（:459）。源码复核：`cell-painters.js:364-371` 半透明 roundRect 填充、`painter.js:213-215` 先行底色、`CHECK_SIZE=16`（cell-painters.js:23）、`main-view.vue:281` 全行 `checked:false`、`root.scss:54/:110` 8% alpha——合成色口径与采样点成立；`--mu-gray-translucent`(20%×gray10) 与 `bgStrong`(8%×gray19) 在白/斑马底上差 ≈5–6，±2 容差可区分。残留细节：问题 1、2、5（均为 minor，不影响该 major 关闭） |
| 2 | minor | 已解决 | 事实修正到位：`02-design.md:13`、:72、:90、:314-315、:340、:427-428 已按「type=number 自动 looseToNumber」重述；demo 夹具改 `stock: { type:'input' }`（文本输入，改动前 string）、`price: { props:{ clearable:true } }`（仍注入 type=number），测试 #7 主/次/回归断言分层（:118、:447、:495）。复核 Vue 3.5.39 `runtime-dom.esm-bundler.js:1577/:1580`、`shared.esm-bundler.js:96-99`、`input.vue:6`、`input.js:54-59`、`editor.js:147-149` 成立。残留：问题 3（概括句仍写「number 或 null」，与规则①末支不符） |
| 3 | minor | 已解决 | A7 文件树改「lastPaint 统计外露（外部断言来源）」（:385），四维表同款残句一并统一（:43）；self-checks/editor.js 旧口径同步列入改动清单与 G1-a（:115、:458）。残留：问题 4（:363 注释未列入同步范围） |

第 1 轮 11 条在 review-2 已复核关闭，本轮抽查其证据（painter 外露统计、9 文件/3,696 行、`+1` 口径、theme 计数、G1-a/G1-b 文件集、page.mouse 拖拽、activeElement 断言）仍成立。

## 检查项结论（每项一行）

1. 覆盖 — PASS：10 条验收标准均有章节与测试计划行（:441-452），手段逐条标明；新增/修改测试文件全部进入改动清单（:115-119）与 G1-a/G1-b/G2。问题 4、5 为局部精度问题，不阻断覆盖。
2. 事实一致 — PASS：路径/符号/数字重核一致（9 文件 3,696 行、theme 17→18、layout.js:139-146 与 +1 上界、root.scss:54/:110、painter.js:694-697、check.js:7、DOM `[disabled]` 用 `--mu-bg-strong`、Vue 版本与行号、editor.js:147-149/420/449-468/345-360）。问题 2、3 为文档表述与概括错误，不影响实现。
3. 约定一致 — PASS：纯 JavaScript、`<script setup>`、BEM `mu-`、`--mu-*`、受控 `update:*`、就近 scss import、无新增依赖；三处增量均在既有文件内。
4. 影响面 — PASS：theme 快照消费方仅 self-checks 计数断言（已列同步）；`update:cell-value` 消费方为两 demo（已列）；仓库内 validate 均在 text 列（规整不触达）；`bgStrong` 消费点仅 cell-painters 一处；无其他快照字段数硬编码。问题 1 为回退口径不一致。
5. 可实施 — PASS：G1-a/G1-b 并行（文件集不相交），G2 依赖 G1-a，S1 统一 build + 全量测试；各步有可独立判定的完成判据。问题 5（e2e 像素读取换算）、6（回滚手段）为局部缺口。
6. 风险与回滚 — PASS：类型漂移、null 清空、enum 相等语义、focusAfterRender 删除、bgStrong 缺失均有对策；`git stash -u` 表述有问题 6，但「目录副本」主路径可用。
7. 范围 — PASS：三处增量（类型规整/快照补齐/死路径清理）均在既有文件内，无新增文件、未动注册与 catalog；文档三处同步按项目规约延后（A8 #15）。
8. 并行组 — PASS：G1-a `{editor.js, table-ex.vue, self-checks/editor.js}`、G1-b `{theme.js, cell-painters.js, self-checks/theme.js, self-checks/cell-painters.js, main-view.vue}`、G2 `{table-ex-editable/main-view.vue}` 两两不相交；共享 `dist/` 已移入 S1。

## 问题清单

1. [minor] 02-design.md:113（改动清单 cell-painters 行）、:352、:368（A6）与 :432（风险表）、:459（G1-b）— 底衬取色口径不一致：文件级改动与 A6 写成无回退的 `theme.bgStrong`，而风险表与 G1-b 要求 `bgStrong || hoverBg` 回退 — 证据：:113「`theme.hoverBg` → `theme.bgStrong`」、:352「改为 `theme.bgStrong`」 vs :432「check disabled 底衬回退 `bgStrong || hoverBg`」、:459「改 bgStrong（缺省链回退 hoverBg）」；现行 `cell-painters.js:364-371` 为单一 `theme?.hoverBg`，无链式回退可参照 — 建议：二选一统一——改动清单/A6 补 `|| theme?.hoverBg`，或删除风险表/G1-b 的回退要求并说明 `--mu-bg-strong` 在 `.mu-root` 明暗双态恒定义（root.scss:54/:110）故无需回退。

2. [minor] 02-design.md:494（评审回应第 2 轮 #1，未采纳备选的理由）— 事实错误：「DOM table 与 table-ex 不在同一 demo 页」不成立 — 证据：10 万行页同一页面既挂 table-ex（demo/src/data/table-ex/main-view.vue:11-40）又有「DOM 版 mu-table 参照」段（:151-164），本设计 :445/:448 也以「与 DOM 版 table 并排比对」作为检查项 — 建议：改写未采纳理由（跨实现逐像素对齐需处理抗锯齿/尺寸差，合成色口径已直接可查），或采纳该比对；不要保留可被源码推翻的事实陈述。

3. [minor] 02-design.md:13、:162 — 概括与 A5 细则矛盾：两处写 number/currency「提交收敛为 number 或 null」，而规则①末支（:331）为「否则保留原字符串（非数值输入交由 validate 拦截）」，自检也断言「非数值串保留」（:115、:458）— 证据：:13、:162、:331 原文 — 建议：两处概括补「；非数值输入保留原字符串、交由 validate」，避免验收按「只能 number/null」误判。

4. [minor] demo/src/data/table-ex/self-checks/editor.js:363 — 旧口径同步范围不全：设计 :115、:458 只列 :8、:176、:375，但 :363 仍写「值为 mapping key 字符串（decisions⑦）」，引用的正是本期修订的前序决策；G1-a 判据「文件内无『提交值 = mapping key 字符串』旧口径残留」按字面 grep 命不中该行 — 证据：设计 :115/:458 的同步清单 vs 源码 :363 — 建议：把 :363 加入同步清单（改为「字符串原值 → key 字符串；number 原值保持 number」），或把判据改为检索 decisions⑦ 引用。

5. [minor] 02-design.md:448（测试计划 #8 e2e）— 只规定采样点与期望值，未规定从组件 canvas 读取实际像素的坐标换算：画布后备存储按 dpr 放大（:208「canvas.width = cssW × dpr」），`getCellRect` 返回的是 CSS 坐标（table-ex.vue:769-776），dpr≠1 时 `getImageData` 会采样错位 — 证据：:448 无读取手段；前序环境为 dpr=1 基线（agent-docs/plans/20261023-table-ex/05-verify-2.md:57）— 建议：写明 `getImageData(x*dpr, y*dpr)`（dpr = canvas.width / getBoundingClientRect().width），或明确该用例仅在 dpr=1 环境执行。

6. [minor] 02-design.md:433（风险与回滚）— 回滚手段含「实施前 `git stash -u`」：table-ex 与两个 demo 数据目录均为 untracked（00-task.md:65、本行自述），`git stash -u` 会把它们从工作区移入 stash，并非「实施前的目录副本」；按字面在实施前执行会使基线目录消失 — 证据：:433 原文 + 00-task.md:65 — 建议：删除 stash 建议，改为实施前用 `cp -r`/`robocopy` 把 `src/components/table-ex/`、`demo/src/data/table-ex/`、`demo/src/data/table-ex-editable/` 复制到 `.pipeline` 外的备份目录。
