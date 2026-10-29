VERDICT: FAIL

第 1 轮验证。输入：00-task.md、decisions.md、02-design.md、04-impl-G0/G1-a/G1-b/G1-c/G2-a/G2-b/G2-c/集成.md（无上轮验证报告）。

## 上轮问题核对（第 2 轮起）

不适用（第 1 轮）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|------|------|------------------|
| `npm run build` | exit 0 | 288 modules transformed；dist/mussel.js 511.74 kB / mussel.min.js 256.61 kB；dev+prod 两次构建均成功 |
| `npx stylelint "src/components/table-ex/*.scss" --fix` | exit 0 | 无错误，无改动产生 |
| `curl http://localhost:3000/data/table-ex/` | 200 | 页面与 main.js 均 200（watch 进程验证中途退出，验证者自行重启完成回归后关闭，见"环境阻塞"） |
| 回归抽查 curl | 全 200 | data/table、data/table-advanced、navigation/menu、form/form 均 200 |
| demo 自检面板（浏览器实测，首挂载与重载各一次） | 77/77 | theme 11 + layout 14 + cell-painters 14 + painter 11 + interactions 13 + editor 10 + data 4，失败 0 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|------|------|------|------|
| A1 API 对照 | 浏览器 | ① 单元格点击：`cell-click`+`update:selected-record`+新选行时 `update:selected-record-key`(载荷 4)；② 非排序列表头（备注）仅 `header-click`；③ 排序列表头（名称）三击 `update:order-by` 载荷依次 `"name:asc"`→`"name:desc"`→`""`；④ check ✓ 表头仅 `update:header-checked`，受控更新后表头 ✓ 像素 3 态严格跟随（dark 像素 0→45→0，state false→true→false）；⑤ check 单元格 4 事件同现（cell-value+cell-click+selected-key+selected-record，翻转载荷 value:false）；⑥ 替换 columns：13 列→5 列，colWidths [48,56,220,140,240]，contentW 704；⑦ scrollToRecord：见失败项 1；⑧ refreshTheme()（直接调实例）：快照打印更新（ct-snapshot 出现 17 字段 JSON）、画布正常重绘；按钮路径见失败项 2；⑨ 空态：`#empty` 插槽 DOM 可见（"自定义空态（#empty 插槽）"）、emptyText 渲染"暂无数据（emptyText）"、placeholder 开启后空值格 ink 0→237 | FAIL（scrollToRecord）+ demo 夹具缺陷，其余 PASS |
| A2 渲染架构/DPR | 浏览器 | `__scroll` 子元素顺序 `[mu-scrollbar__tracks, __sticky, __spacer]`；手柄拖高 +60：clientH 416→476、spacer 3599620→3599560 且 = max(0, contentH−clientH)、scrollHeight=contentH=3600036；dpr=1 基线 canvas.width/cssW=1；缩放 DPR 见"需人工" | PASS（DPR 缩放端到端 UNVERIFIED/需人工） |
| A3 虚拟滚动 | 浏览器 | 10 万行：spacer 高=3599620=headH+100000×36−clientH，scrollHeight=contentHeight=3600036；5 处跳跃滚动（0/1800000/5/3599964/123456）lastPaint.rowCount 11–13 ≤ ceil(视口高/36)+OVERSCAN+1=14 且 viewRows 与 lastPaint 逐字段一致；3 行/空 records spacer=0；hover 变行仅脏带重绘（lastPaint.rowCount=1 横带，rowStart 3→6）；就地改 record（check 翻转 ink 52→128）与 recordsVersion 异步按钮（memo ink 36→458，recordsVersion 0→8）两通道均生效 | PASS |
| A4 列定义 | 浏览器 | colWidths=[48,56,222,100,100,120,120,180,80,90,150,110,120]（1500 宽舞台）：名称列=222≥minWidth 80 且未超、备注 180∈[120,260]、总宽=clientW 1496 无留白；value:'固定值' 字符串列取值正确（DOM 参照"固定值"、canvas ink 232）；text 覆盖列显示"文本:记录 000001"（DOM 参照+ink 488）；enum"启用"/number/currency"¥0"/date"2026-01-01" DOM 参照与数据生成器一致、canvas 各列 ink 146/41/82 非空（格式化文本正确性另由 [cell-painters] 自检断言背书）；recordsOffset=100 → rec_no ink 15→79（"1"→"101"）；disabled check：demo 无此夹具，仅 [interactions]/[cell-painters] 模块自检覆盖 | PASS（disabled check 的 demo 端到端缺夹具，模块级已覆盖） |
| A5 调宽与排序 | 浏览器 | 拖备注列右缘 +40（page.mouse）：up 后 colWidths[7]=180→220、未定宽名称列 222→182 吸收、总宽 1496=clientW；拖前旧右缘列线 rgb(201,205,209) 拖拽中消失（lum 204→246，无残影）；拖拽中参考线主色 rgb(28,126,214) 在新右缘；hover 手柄 cursor=col-resize；up 后日志仅 `column-resize`（payload {column:memo,width:220}），无 header-click（误触抑制，干净重测：清日志→拖拽→仅 1 条 column-resize，静置 500ms 不变）；固定列缘（fixedLeftColumns=2）与列级 resizable:false 拖拽均无 colWidths 变化、cursor 非 col-resize；排序图标 asc 主色三角像素 0→19 | PASS |
| A6 编辑 | 浏览器 | dblclick 备注格：`__editor` 出现、rect 与 getCellRect 完全重合（180×36）、其内 `.mu-input` 根 180×36 100% 填充、焦点入 input；输入+Enter：载荷 `{"record":"#1","recordIndex":0,"field":"memo","value":"..."}`、浮层消失；Esc 取消无 update:cell-value、数据不变；validate 含"错误"→ `.mu-input[invalid]` + title"备注不能包含"错误"字样"、不关闭；Ctrl+A 重输后 Enter 提交成功；编辑中点其他格一步提交+选中（事件序 cell-value→selected-key→selected-record→cell-click）；点空白 blur 兜底提交；滚动即提交；enum：MuSelect 下拉恰 3 项（启用/待处理/已归档，default"未知"已排除）、点选提交恰 1 次且值=mapping key 字符串（"pending"/"archived"）；date：面板打开→点 chevronUp（date-input.vue:20 goPrevMonth）切 2025-12 编辑器与面板均保持→点 15 提交恰 1 次（值 2025-12-14T16:00:00.000Z 即本地 2025-12-15，Date 对象为 MuDateInput 自身 v-model 行为）；bool：容器聚焦（activeElement=__editor）、点 switch 切换即提交、Esc 取消无事件；editable=false dblclick 无浮层 | PASS |
| A7 样式/暗色 | 浏览器 | `.mu-root` 级暗色切换 70ms 内 canvas 像素变化 [105,111,116]→[165,171,178]；mu-dark 挂组件根变体 59ms 内变化；--row-height 48px+refreshTheme：rowH 36→48、spacer 3599620→4799620=max(0,4800036−416) 同步、可视行数收缩；根字号 18px+refreshTheme：snapshot.fontSize 14→18；与 DOM 版并排视觉比对见"需人工" | PASS（视觉比对需人工） |
| A8 文件结构 | 命令 | `ls src/components/table-ex/` = table-ex.vue/.scss/index.js/theme.js/layout.js/cell-painters.js/painter.js/editor.js/interactions.js 与设计 A8 一致；`npm run build` exit 0 | PASS |
| A9 范围边界 | 人工 | 见"需人工检查" | 需人工 |
| 构建/风格 | 命令 | 见"命令结果"前两行 | PASS |

### decisions.md「[I1 前]」①–⑧ 落实核对

| 条目 | 证据 | 结论 |
|------|------|------|
| ① blur 兜底判据③（面板内焦点或最近 pointerdown 目标在面板内） | editor.js:215-216 `isInDropdownPanel`、:241 `if (isInDropdownPanel(activeElement) \|\| isInDropdownPanel(lastPointerdownTarget)) return false`；[editor] 自检第 10 条（含不可聚焦按钮断言）通过；实测 date 面板 prev 月后编辑器不关 | 已落实 |
| ② G0 夹具（columns 替换/headerChecked·orderBy 受控/就地改处理器/resizable 开关/DOM 版参照） | main-view.vue 模板与处理器（onReplaceColumns/onHeaderChecked/onOrderByChange/onCellValueChange/sortedRecords computed/`<mu-table>` 参照区），且均实测生效（A1/A3/A4 证据） | 已落实 |
| ③ demo 暴露 getCellRect | `window.__tableEx.getCellRect(row,col)` 返回页面+视口坐标（table-ex.vue:760-777），本次全部坐标级交互经其完成 | 已落实 |
| ④ viewH/viewW 口径 | layout.js:9/134/151 注释与实现 `viewH=clientHeight−headHeight`、`viewW=clientWidth−fixedWidth`；[layout] relayout 断言通过 | 已落实 |
| ⑤ multiline 未识别 is 按文本绘制 | cell-painters.js:228 resolveItemKind、:236 注释；[cell-painters] 自检"div items 按文本落地不空白"含像素反证 | 已落实 |
| ⑥ widthOverrides 按列 key、不写回 props | table-ex.vue:153/:637/:799（columns 替换时清空）；[layout] 自检"按 key 优先且不写回"；实测拖拽→替换 columns→宽度复位 | 已落实 |
| ⑦ 枚举编辑值 = mapping key 字符串 | editor.js:113-123 resolveSelectOptions；实测提交载荷 value "pending"/"archived"（字符串键） | 已落实 |
| ⑧ 拖拽误触 flag pointerup 后延时清除 | interactions.js:368-395 createClickGuard（release 经 setTimeout 0 清除）；实测干净重测拖拽 up 后仅 column-resize 无 header-click | 已落实 |

## 范围核对

- 基线：分支 mussel-table，HEAD `04e157d`（与 00-task.md 基线一致），基线工作区 clean（仅 .pipeline/ 未跟踪）。
- `git status --short`：`M demo/src/catalog.js`、`M src/components/index.js`、`?? demo/src/data/table-ex/`、`?? src/components/table-ex/`、`?? .pipeline/`。
- `git diff --stat`：catalog.js +5、components/index.js +2，共 7 行新增，均与设计改动清单一致。
- 基线排除项：`.pipeline/`。验证产物：dist/、demo/dist/ 未出现在 git status（已被忽略）；.playwright-mcp 目录未入库。
- 设计外改动：无。无法区分：无。并行白名单越界：无（最终文件集合与设计改动清单一致）。

## 测试质量问题

1. A4"disabled check 点击无 update:cell-value 但有 cell-click 与选中（日志核对）"——demo 列定义无 disabled check 夹具，测试计划的 demo 手段无法执行；断言逻辑仅由 [interactions]（resolveCellClick disabled 分支）与 [cell-painters]（disabled 置灰像素）模块自检覆盖。建议后续给 demo check 列补 disabled 行夹具。
2. A3 断言口径：测试计划字面 `rowCount ≤ ceil(视口高/行高)+OVERSCAN` 在 scrollTop 落行中间时会超 1 行（G1-b 遗留 1 已预告）；本次按 +1 口径断言通过（11–13 ≤ 14），且 ≪ 全量 10 万行，虚拟滚动结论不受影响。属测试计划口径与实现口径的偏差，非缺陷。
3. demo eventLogs 为数组 unshift 最新在前，取"某事件载荷"需按方向查找——本次验证已按此处理，无影响（记录备查）。
4. 自检 img 用例首挂载 77/77；重跑时该断言可能因模块级缓存读到 loaded 而失败（04-impl-集成.md 遗留 1 已知，本 session 两次首挂载均全绿，未复现）。

## 需人工检查

1. **A2 浏览器缩放 DPR 端到端**：playwright 环境无法改变 devicePixelRatio（恒 1）。步骤：人工浏览器缩放 150%，检查 `canvas.width/getBoundingClientRect().width ≈ 1.5`、线条文字无模糊；跨屏迁移（外接屏）后表格自动重绘。（代码路径 dpr 参数正确性已由 [painter] 自检覆盖，dpr=1 基线 ratio=1 已实测。）
2. **A7 视觉并排比对**：demo 页主表与 DOM 版 mu-table 并排（同列同数据前 20 行），人工比对表头底/网格线/选中/hover 色值与整体观感；含设计声明的差异项——底部投影用 `--mu-shadow-float` 单变量（现有 table 为硬编码双阴影，设计有意不复刻）。
3. **A9 范围边界**：对照 02-design.md A9 清单 12 条逐条确认 demo 与实现无对应能力（本次验证过程中未见越界实现迹象，如 dblclick 才开编辑、无键盘导航、固定列整体不可调宽等与清单一致，但完整逐条确认为人工项）。
4. **A3 滚动流畅（人工）**：滚轮/触控板连续滚动手感。

## 环境阻塞

1. 实施者启动的 demo watch 进程（:3000）在本次验证中途自行退出（非验证操作所致）。影响：回归抽查一度受阻。处置：验证者以 `npm run demo:build`（后台任务 exec_44305865-e0f0-449c-ab3e-30a576743038，日志 evidence/demo-watch-verify.log）重启完成回归抽查，结束后已停止任务并按 PID 11848 关闭残留监听进程，:3000 已释放。无验收标准因此降级。
2. playwright 无法改变 devicePixelRatio / CDP 缩放（与 04-impl-集成.md UNVERIFIED 1 相同）→ A2 缩放项转需人工，非新阻塞。

## 失败项（FAIL 时，不含环境阻塞）

1. **scrollToRecord 目标行被表头遮挡（不可见）**
   - 命令/标准：A1 实例方法（浏览器实测）
   - 关键错误：`scrollToRecord(5000)`（keyField id=5000 → 行 index 4999）后 scrollTop=180000，目标行视口 y=0，整个被 sticky 表头（0–36px）遮挡；`getLayoutInfo().viewRows.start=5000`（视口首行是 id 5001）。对照：scrollTop=4999×36=179964 时目标行 y=36（表头下缘）可见且 rowStart=4999。方法语义"滚动到指定记录，不可见时置于视口顶部"未达成；实现内注释自称"行顶对准表头下缘"与代码行为矛盾（实际对准的是表头上缘/视口顶）。
   - 疑似位置：src/components/table-ex/table-ex.vue:723 `Math.max(cur.headHeight + row * cur.rowHeight, 0)`——多加了 `cur.headHeight`；按注释语义应为 `row * cur.rowHeight`。
2. **demo 夹具调用未定义函数 pollThemeSnapshot**
   - 命令/标准：A1"refreshTheme() 调用后……快照打印更新"的按钮路径（浏览器实测 + console）
   - 关键错误：点击「refreshTheme()」「打印主题快照」按钮抛 `ReferenceError: pollThemeSnapshot is not defined`（本 session 累计 4 次，console error）。组件 `refreshTheme()` 本身正常（直接调用实例方法：快照打印更新、画布重绘均通过；面板另有 200ms 轮询兜底，故面板实际有内容），但两个调试按钮的处理器在调用后中断、`logEvent` 不执行。
   - 疑似位置：demo/src/data/table-ex/main-view.vue:543、:548（调用 `pollThemeSnapshot()`）——全文件仅定义了 `pollDebugPanel`（:580），应为同名笔误。

### 附：瞬时异常记录（不判 FAIL）

验证会话 console 曾出现 1 次 `TypeError: Cannot read properties of null (reading 'onEsc')`（main.js:6145）。当前构建产物与源码已含空值防护（table-ex.vue:44 `editor.state.editing?.onEsc()`），以 input/switch 两种编辑器 Esc 复现失败（pageerror 0，编辑器正常关闭）。判定为验证期间 watch 增量构建窗口内旧产物的一次性行为，非当前代码缺陷；如后续再现在案排查。
