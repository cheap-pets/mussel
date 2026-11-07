# 设计回应（第 1 轮）

## 评审回应（第 1 轮）

输入：06-amend-1.md（VERDICT: AMENDED；未解决异议累计：无）+ input-code-delta-1.md（代码变动快照）。06-amend-1 无未解决异议、无人工意见；下表对其 11 项实质改动按当前工作区源码逐项复核，另列本轮独立修订 4 项（R1–R4）。所有行号均按 2026-11-06 当前工作区（含未提交改动）重新核实。

| 编号/位置 | 结论 | 修改说明或理由证据 |
|---|---|---|
| 台账#5 recordNumber 10 处 / 6 文件 | 接受（修正 1 处行号） | `git grep "recordsOffset \|\| 0"` + 两行形态核实共 10 处成立；row-geometry-controller 站点修正为 :392（归一行 `ctx.getRecordsOffset() \|\| 0`）+ :419（使用点），原 :292 已不存在；已在 O5 表更新 |
| 台账#6 O1① 消费方 7 行清单 | 接受（核实无漂移） | cell-painters.js:299–302 / table-ex.vue:81 / use-cell-click.js:11 / use-cell-tooltip.js:18 / paint-overlay.js:2 / demo 3 文件行号全部复核一致；仅补正措辞：drawTreeArrow 为 cell-painters.js:256 自身定义 |
| 台账#7 O1②③ 消费方 3 文件 | 接受（核实无漂移） | interactions.js:438 / use-column-resize.js:13 / use-relayout.js:9 / table-ex.vue:82 / demo editor.js:34–50（import 块 15 符号，其中 9 个为 re-export 符号）、interactions.js:20–36 复核一致；③ 归批次 2A |
| 台账#8 @ctx-* → @host-* | 接受 | 与 O3 一致性论证成立，未受代码漂移影响，未改 |
| 台账#10 O4 消费方 7 文件 + editor.js 保留面 | 接受（核实无漂移） | editor.js:61/78/94/114 四函数、:6–9 常量、:21–31 re-export、paint-overlay.js:3 / edit-button.js:7 / use-cell-click.js:10 / demo painter.js:25 / spans.js:29 复核一致；批次改 2A |
| 台账#11 isSamePoint 仅覆盖 2 函数 | 接受（核实无漂移） | use-cell-tooltip.js:37–41 与 use-pointer.js:70–74 逐字相同（未提交改动未触及）；isSameHoverItem 现为 use-pointer.js:158–168 五字段，保留独立结论不变 |
| 台账#12 withAnchorPreserved 落点 + resolveAnchorRow | 接受（修正行号） | 两处同构确认存在；行号更新：applyTreeToggle use-tree-rows.js:145–182（捕获 150–155 / 补偿 169–177）、onThemeChange use-table-instances.js:29–56（捕获 35–39 / 补偿 47–51）；批次改 2B |
| 台账#13 recordNumberOf(recordsOffset, row) 签名 | 接受 | 三形态调用侧证据成立（spans-method.js:120 / cell-selection.js:30,43 / paint-body.js:101），未改 |
| 台账#14 O6 拆分清单 12 函数 + 1 常量 | 接受（核实无漂移） | interactions.js 导出行 18/57/137/155/174/196/240/284/301/321/375/395/429 复核一致，未改（批次 3 可选项） |
| 台账#15 O7 drawCell 分组 + 2 调用点 | 接受（核实无漂移） | cell-painters.js:25 签名 19 字段、:60 centerY 派生；调用点 paint-body.js:317 / demo cell-painters.js:134 复核一致，未改 |
| 台账#17 §4.0–4.5 批次细化 | 接受（本轮扩展） | 框架保留；按 input-code-delta-1 与槽位现实扩展为避让策略表 + 批次 2A/2B 拆分（见 R2/R3） |
| R1 P5-1 / O5 描边链（本轮独立修订） | —（新增事实修正） | 未提交改动后描边三函数行号漂移：矩形链 113–126/143–156/180–193 → 112–126/154–168/201–214（paint-overlay.js:105–143/149–182/189–232），且"选中格额外 withClip 属差异"过时——hover 两描边同步加固定列裁剪（128–142/170–181/216–231 三处逐字同源）；已在 P5-1 与 O5 表更新 |
| R2 O5 批次拆分 2A/2B（本轮独立修订） | —（新增裁剪） | (fast 实施→fast 验证)×2 容量收敛：原批次 2（19 文件、5 项提取）超单轮 fast 负荷；2A（O4+isSamePoint+recordNumberOf+背景带，16 文件，机械归一）+ 2B（cellFrameOf+withAnchorPreserved，4 文件，双约束校验/签名设计）写入 §4.2/§4.2B，2B 待用户追加步骤 |
| R3 避让策略表（本轮独立修订） | —（新增） | §4.0 重写：4 个未提交文件 × hunk 行区 × 冲突判定 × 策略；use-pointer.js O3 判定不可 hunk 分离（未提交新增代码体 95–140 内部引用 ctx），裁决 (b) 时顺延 2A；paint-overlay/painter 仅动 import 行、行区禁触；paint-gridlines 全批次禁触 |
| R4 §4.2 grep 断言缺陷（本轮独立修订） | —（新增修正） | 原断言 `grep -rn "editing/editor"` 在 O4 落地后会误命中 `editing/editor-geometry.js`（前缀包含），改为 `grep -rn "editing/editor.js"`（字面含 .js，不匹配 editor-geometry.js） |

不接受（blocker/major）：0；不可行（人工意见）：0（无人工意见）。
