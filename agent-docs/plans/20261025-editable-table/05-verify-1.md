# 验证报告 — I2 第 1 轮（verifier）

VERDICT: FAIL

验证环境：demo watch 常驻 :3000（先行检查 200，非本轮启动，无 PID 需回收）；playwright 页面 `document.visibilityState = 'hidden'`（后台页，原生输入事件/原生 scroll 事件停发，rAF 分钟级节流，bringToFront 后 rAF 延迟 ~0.5–0.9s）。全部交互经合成 PointerEvent/MouseEvent/scroll Event 驱动 sticky 层真实处理器链（生产路径）；需浏览器真实派发顺序的场景（clickGuard）已按真实顺序（pointerup 与 click 同任务）模拟。像素断言经 `getImageData`（dpr=1）。

## 命令结果

| 命令 | 状态 | 关键输出 |
|---|---|---|
| `npm run build` | exit 0 | dev `mussel.js 600.74 kB / css 120.64 kB`；prod `mussel.min.js 282.16 kB / min.css 97.55 kB` |
| `npx stylelint "src/components/canvas-table/*.scss" src/styles/link.scss` | exit 0 | 无输出无错误 |
| `ls src/components/canvas-table/` | 12 文件 | canvas-table.vue/.scss/index.js/theme/row-geometry/text-wrap/tree/layout/cell-painters/painter/editor/interactions.js——与设计 A7 一致（#9 PASS） |
| 自检面板首载（/data/canvas-table/） | 通过 | 「自检结果（142/142 通过）」；分组计数 text-wrap 10 / row-geometry 12 / tree 8 / theme 14 / layout 21 / cell-painters 28 / painter 14 / interactions 18 / editor 13 / data 4 = 142，0 失败 |
| 自检面板页内重跑 | 通过 | JS 触发「重跑自检」→ 仍 142/142、0 ✗ |
| 控制台 | 2 error | 均为自检夹具故意 badSrc（`data:image/png;base64,AAAA1/AAAA2`），既有测试行为非缺陷 |

## 验收标准核对（00-task.md 十条 + 测试计划 #3–#15 抽验）

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1 选型决策（四维对比 + 结论） | 人工（文档核对） | 02-design.md「选型决策」节：DOM/canvas 四维表（性能/资源/可扩展性/开发便利）+ mussel 现状评估 + 结论明确（canvas） | PASS |
| 2 优化 vs 重构 | 人工（文档核对） | 「路线决策」节：能力盘点表（10 行对照）+ 八项差距扩展性判断 + 重构拒绝理由（被拒绝备选 #3） | PASS |
| 3 API 对照 | 浏览器 | 事件实测全量：`update:order-by` 三态 `name:asc→name:desc→''`、`header-click`、`update:header-checked {column:checked,value:true}`、`cell-click`/`update:selected-record(-key)` 选中链（顺序正确）、`update:cell-value`（typeof number/string/array 三形态）、`column-resize {column:name,width:199}`、`update:tree-expanded-keys {count:2000}`、`cell-item-click`（link 对象 `{caption:'主色链接',color:'primary'}`/dots `'...'`/tag `{caption:'新品',color:'green'}`/button `{caption:'删除',color:'red'}` + recordIndex 附加键）；方法：`getThemeSnapshot()` 22 键（21 固定字段 + colors 17 色 gray 不入；controlHeight 32）、`getLayoutInfo().rowGeometryMode`、`getCellRect` 变高行高 70/88/196、`scrollToRecord(90002)` 树 key 定位（scrollTop 216 = 行 6 topAt，行顶恰在表头下 36）、`expandAll/collapseAll/getTreeExpandedKeys` | PASS |
| 4 渲染架构/虚拟滚动 | 浏览器 | 默认场景（variable 全 36 行）：refreshTheme 整幅后 `lastPaint.rowCount 13 == viewRows.count 13`；树场景底部 `lastPaint 9991-10003 n=12 == viewRows`；顶部 start=0 行 0 y=36；overscan 语义正确（start = 首可见行 −2）；底部命中对位精确：点击行 9994 → `cell-click recordIndex 9994`（record #17993） | PASS（#15 单调性除外，见失败项 1） |
| 5 列定义 | 浏览器 | 默认场景 `colWidths [48,56,160,100,100,120,120,180,80,90,150,110,120]`：显式 width 定宽、无 width 列回退 160；enum/date/currency/number 格式化文本渲染正常（画布 fillText 采样「启用/2026-01-09/NaN…」——NaN 见测试质量 2）；text 覆盖列正常 | PASS |
| 6 调宽与排序 | 浏览器 | 拖拽 160→199 + `column-resize` 事件；收缩 −300 钳制 **80**（text 类型最小宽经 resolveTypeMinWidth 接线生效）；clickGuard：pointerup+click 同任务序（真实浏览器顺序）→ 只发 `column-resize {width:110}`，header-click/order-by 被吞；排序三态循环 | PASS |
| 7 编辑 | 浏览器 | editable 页：单击开编辑（INPUT number 聚焦，浮层 left=格左+7、宽 76=90−2×7、高 34=controlHeight+2——A5.4 公式精确）；Enter(keyCode 13) 提交 → 编辑器关 + 「最近提交」`typeof number`（42）；只读列（金额）click 不开编辑；validate 清空提交 → 编辑器保持 + `invalid="true"` 落 mu-input 根；滚动即提交（`typeof string`）；textarea：maxLines 列开 TEXTAREA 高 **54 = clamp(70−16,32,196) 精确**、class `mu-input`、聚焦；数组列开值 `直采\n冷链\n当日达`（join）→ Ctrl+Enter 提交 `typeof array`；switch 编辑器高 32 = controlHeight、--borderless | PASS（price clearable null e2e 未独立实测 → UNVERIFIED，自检 null 规整断言覆盖） |
| 8 样式/暗色 | 浏览器 | 根挂 `mu-dark` → 700ms 内快照刷新（bgNormal `rgb(255,255,255)`→`rgb(7,8,8)`、colors 重读）+ 画布像素 `237,249,255`→`0,24,61` + 移除还原；colors 17 色（12 彩+5 语义、gray 不入） | PASS（`--row-height`/根字号覆盖后 variable 行高重估跟随的数值断言未独立实测 → UNVERIFIED；同链路 onThemeChange 确实会触发〔见失败项 1 根因〕） |
| 9 文件结构 | 命令 | 12 文件（上表）；build exit 0 | PASS |
| 10 范围边界 | 人工 | A8 二十二条存在且明确；demo 页未见范围外能力实现（行级 editable/插槽通道/树 check 级联等未出现）；文档三处同步未做（边界 #15 待用户确认，符合项目规约） | PASS |
| 11 树 | 浏览器 | 平铺 key/parentKey 1 万节点：defaultExpandLevel 矩阵（非受控态，重载后）——首开 1→2001 keys/10003 行、0→2000/10001、2→2001/10003、−1→0/2000 全收起（约束 9）；箭头槽内点击（cellX=16）→ toggle：expanded 2001→2000、平铺 10003→9996（−7=4 叶+3 深层）、contentHeight Δ **−252**（=7×36）、不发 cell-click；槽外（cellX=120）→ 选中链三连发、不 toggle；expandAll 2001/collapseAll 0；收到底 scrollTop clamp（359728→71620 不越界）；treeProps 字段名切换（id/pid↔id/parentId）平铺/展开保持；树形列+maxLines：root 40 行高 70（长文本折行）；scrollToRecord 树 key 精确 | PASS |
| 12 编辑 UI | 浏览器 | 单击一次完成：选中链 → 浮层（内部 INPUT 聚焦、value=开值）；hover 可编辑格 cursor `text` / 只读格 `default`（getComputedStyle）+ 左缘描边色调（226,237,243 ≠ hover 带 237,249,255；描边像素断言另由 painter 自检组覆盖）；边框两态文本左缘：border 态 = 格左+8（input left 1556 = cellX 1548+8，边框 1px+浮层 padding−1）、borderless 态 = 格左+9（透明边框 1px），差 1px ≤ 设计容差（≤1px）；switch 高 32；textarea 见 #7 | PASS（borderless 态 clear/下拉可用性未实测 → UNVERIFIED；scss 白名单设计 + G2 自检覆盖） |
| 13 默认列宽 | 浏览器 | widths 场景 `colWidths [50,50,160,100,110,100,110,160,60,140,140,100,140,80,80]`：check/rec_no 50（type.width 定宽）、bool 60（不被 80 抬高）、无 type 160、currency 110、自定义 80——与 TYPE_DEFAULT_WIDTHS 表逐列一致；默认场景 '80px' 字符串解析（自检 layout 组「'80px' 解析 Number 非 NaN」通过） | PASS |
| 14 新列型 | 浏览器 | 像素采样（容差 ±40，命中数）：link 四态 primary 152/danger 157/disabled muted 612/teal 199；tag green 154/blue 161/violet 96/orange 82；progress success 134/warning 356/danger 232（progressOption `record=>` 记录级色）；button red 148/indigo 160/disabled muted 483——14 项全 >0；行高 70/88/36/196（条目列行数=min(条目,10)）；dots（第 10 条）点击 `cell-item-click {link:'...'}`；disabled 条目点击只发选中链不发 item 事件（干净态实测）；button payload `{caption:'编辑'}`/`{caption:'删除',color:'red'}`；progress 点击不命中（只 cell-click）；固定区 link + 滚动区 tag 双区命中均发事件（双 pass itemHits 正常）；DOM 参照段：对象数组 caption 文本（无 [object Object]）+ `mu-link--primary/red/danger/teal/lime` class + getComputedStyle 色（rgb(28,126,214)/rgb(240,62,62)/rgb(12,166,120)/rgb(116,184,22)）+ disabled muted | PASS（固定场景 button 列夹具缺陷见失败项 2——button 滚动区命中断言因夹具不可执行；组件双区命中能力已由 tag/link 两区独立证实） |
| 15 多行变高 | 浏览器 | 行高矩阵：items 70/88/36/196、multiline 196（maxLines 10）/52（2 行）/70（3 行）；锚定补偿实测（7200→7234 = +34 精算增长上方补偿）；底部跳转窗口 9991-10003 正确；**但滚动条单调不回缩 FAIL（失败项 1）**；自检新增组全绿（142 含 text-wrap/row-geometry/tree/layout/painter/cell-painters 新增断言） | **FAIL**（其余子项 PASS；"10 万行 20% 长文本帧感" 需人工且无专用夹具） |

### 实施约束 11 条逐条核对

| # | 约束 | 证据 | 结果 |
|---|---|---|---|
| 1 | painter 读行 `displayRows ?? records` 回退 | painter.js `rowsOf(state)`（选中判定/hover/绘制三处同源）；G2 期运行时验证（壳未组装时 10 万行 contentHeight/lastPaint 正常） | PASS |
| 2 | G1-a 夹具不依赖 prepareColumn | self-checks/row-geometry.js 手写 `_maxLines/_resolveMaxLines/_maxItems`（G1-a 记录 + 自检通过；抽查代码确认手写夹具） | PASS |
| 3 | cellX 内容区相对口径 + 箭头右半可 toggle | hitTest `cellPadding` 参数（缺省 8，代码）；e2e 槽内 cellX=16 toggle、槽外 cellX=120 选中链；自检 interactions 组（箭头中心/右半）通过 | PASS |
| 4 | 溢出/dots 字符 `'...'`（三半角点） | e2e dots payload `'...'`（三个 ASCII 点，事件日志原文）；自检 text-wrap「末行 '...'（'...' 三点半角点，实施约束 4）」、painter dots 收集、cell-painters 数组值 `['1','二','...']` 全绿 | PASS |
| 5 | textarea 编辑/非编辑文本左缘一致 | 实测 textarea left = cellX+7 + padding-left:0（内联）+ 边框 1px → 文本左缘 = 格左+8 精确一致；自检 editor 组同断言通过 | PASS |
| 6 | 树形列 contentWidth = 列宽−2×padding−(16×level+16) | treeIndents(colIndex,row) 签名 + inset 仅扣树形列（自检 row-geometry 组「row0/row1=52（inset 折行）；非树形列 36」通过）；e2e root 40 行高 70（扣减后仍折 3 行） | PASS |
| 7 | link disabled 存在性判定两处一致 | 干净态实测 disabled 条目只续链不发 item 事件（绘制侧 muted 像素 612 + 事件侧不发）；谓词 `attrs.disabled != null && attrs.disabled !== false`（G2/G3 代码） | PASS |
| 8 | self-checks 文件计数按实际 | 10 文件（9 断言 + index.js），注册 9 模块组 + data 组，面板全部出现 | PASS |
| 9 | defaultExpandLevel 解析时机 | 非受控态实测矩阵：首次入场（tree watch immediate）+ tree 关→开重解析（0/1/2/−1 四档重解析正确）+ treeProps 变化重解析；受控态（demo 首次 toggle 后）受控优先直取——与设计一致 | PASS |
| 10 | theme.js 仅信号，重估在壳 onChange | theme.js createThemeWatcher 仅快照+onChange/refresh（代码）；壳 onThemeChange（:1434 一带）执行 wrap 缓存重建+重估+rebuild+锚定 | PASS（该链路本身即失败项 1 的误触发路径——机制按设计落地，但触发源过宽） |
| 11 | DOM 参照段 link 对象数组 | 上表 #14：6 锚点 caption + class + computed color 全实测 | PASS |

## 范围核对

- 基线排除项（00-task.md 基线已含，不计改动）：`src/components/canvas-table/`（untracked，基线即有）、`src/components/index.js`、`demo/src/catalog.js`、`.gitignore`（前序任务脏文件）、`demo/src/data/canvas-table*/`（untracked 基线即有）。
- 验证产物：`dist/`（npm run build，被 .gitignore 忽略，git status 不可见）；`.playwright-mcp/`（截图/日志，未入 git status 输出）。
- 无法区分：无（基线脏文件与本任务改动文件不相交）。
- 设计外改动：
  - `src/components/table/column-types/tag.js`（+5/−1，对象条目保留）——**已记录**（04-impl-集成.md BLOCKED 处置 + decisions.md「[S1 集成]」授权），设计改动清单**未覆盖**（共享文件表仅 link.js/link.scss）。
  - `demo/src/data/canvas-table/self-checks/cell-painters.js` 的 TagColumn 断言——该文件在 G2/G3 改动清单内（已覆盖）。
- 并行组白名单核对：G1-a（3 新模块 + 3 自检 + index）、G1-b（theme + 自检）、G2（layout/painter/cell-painters/scss + 共享 2 + 3 自检）、G3（interactions/editor/vue + 2 自检 + 2 demo 页）——各组改动均未越出白名单（tag.js 例外已由 decisions 授权增补）。
- 结论：无「未记录」改动；1 项「已记录-未覆盖」（tag.js）。

## 测试质量问题

1. **S1「滚动条单调不回缩」验证方向不全**：实施记录 #15 行仅以正向增长序列（360144→360178→360212）作为单调性证据，未执行「滚回已访问区域」的反向检查——本轮 FAIL 1（回缩）即由此漏检。
2. **fixed 场景夹具缺陷（失败项 2）**：button 列未配 `buttons`（main-view.vue:650），该列渲染为空、无 itemHits——设计测试计划 #14「link/button 分居两区均命中」的 button 半边实际不可执行；G3 记录声称「固定列组合（link 固定区 + button 滚动区）夹具落地」与实测不符（以实测为准）。另 `itemRecords` 无 `count` 字段致该场景数量列绘制 "NaN" 文本（fillText 采样证实）——夹具数据缺陷。
3. 自检断言质量总体良好：142 条均为行为断言（具体期望值/像素/计数），非「不抛错」式；断言名与验收点对应清晰。
4. 自检面板重跑稳定性好（首载 + 重跑 + 多次 reload 均 142/142；G1-b 期的 img 时序竞争已消除——本轮多次重跑未见该失败）。

## 需人工检查

1. 验收 1/2（选型与路线决策的判断是否成立）——文档结构完整、论证自洽，但结论性判断建议人工终审。
2. #15「10 万行含 20% 长文本滚动流畅（帧感）」——无专用夹具（现有最重为树 1 万节点含长文本），建议真实前台浏览器在 :3000 树场景/ multiline 大数据下手感复核（本会话后台页 rAF 节流无法测帧率）。
3. 编辑器视觉细节（focus 光环形态、描边观感、暗色下编辑浮层）——DOM 断言已过，视觉观感需人工。
4. 文档三处同步（skills/docs/docs-site）——范围边界 #15，待用户确认启动（非缺陷）。

## 环境阻塞

1. 后台页（visibilityState=hidden）：原生鼠标输入与原生 scroll 事件停发（page.mouse.click 无效果、scrollTop 赋值不派发事件）——所有交互改经合成事件驱动真实处理器链；不影响行为结论（处理器为生产路径），但 clickGuard 类依赖事件时序的行为必须按真实派发顺序模拟（已做）。影响手段：全部浏览器交互项。
2. rAF 分钟级节流（bringToFront 后 ~0.5–0.9s）：滚动/重绘断言需 ≥600ms 等待；一轮早期读数因帧延迟出现过期窗口值（已用加长等待复测修正）。未注入 rAF shim（bringToFront 后可接受）。
3. MuInput 的 enter 事件依赖 keyCode 13（input.js 映射）：合成 KeyboardEvent 需显式携带 keyCode，否则 Enter 提交不触发（自动化适配项，非缺陷）。

## 失败项

### 1.【FAIL·测试计划 #15 / 设计 A2.2 单调性 / A2.4 行高缓存承诺】变高行滚动后 contentHeight/scrollHeight 回缩，已精算行高丢失

- 现象：树场景（variable 模式，1 万节点含长文本行）滚动到包含长行的区域后滚离，行高被重置为 36px 估高：row 9998（根 2000，长文本）实测 70 → 滚回中部后 **36**；contentHeight **360178 → 360144**、spacer DOM **359762px → 359728px**、scrollHeight 同步回缩（滚动条变短）。底部↔中部往返 3/3 轮确定性复现（360178↔360144 交替），零交互干净重载后同样复现。
- 根因链（逐步实证据证）：滚动边界切换根 class（`mu-canvas-table--y-scrolled-end` 等，canvas-table.vue:298-300）→ theme.js:259-262 MutationObserver 观察组件根 `attributeFilter:['class','style']`，将滚动状态 class 翻转误判为主题变更（页面级 MutationObserver 实测捕获两次 class 翻转，与回缩时刻对应）→ `scheduleRefresh('mutation')` → 壳 onThemeChange（canvas-table.vue:1434 一带）→ `relayoutAndRedraw` → `computeRowHeights` 纯估高 + `variableGeometry.rebuild(heights)`（canvas-table.vue:485-506）——**rebuild 无 record 引用级行高缓存，窗外已精算高度全部丢弃**（设计 A2.4「行高缓存按 record 引用为键，未变行复用」「已精算行经 record 引用缓存保留真值」未实现）；随后窗口重精算只恢复当前窗口行。
- 影响：滚动条在往返滚动中收缩/增长抖动；已访问区域行位置漂移；违反测试计划 #15「滚动条单调不回缩（滚动全程 scrollHeight 只增）」与设计 A2.2「行高只增不减 → totalHeight/spacer 单调增长，无回缩抖动」。
- 疑似位置：`src/components/canvas-table/theme.js:259-262`（观察器未排除滚动状态 class——触发源过宽）；`src/components/canvas-table/canvas-table.vue:485-506`（估高 rebuild 不保留已精算值）；`src/components/canvas-table/canvas-table.vue:298-300`（滚动状态 class 挂在被观察的根上）。

### 2.【FAIL·测试计划 #14 夹具】固定列组合场景 button 列未接数据，双区命中 e2e 的 button 半边不可执行

- 现象：fixed 场景 button 列（滚动区）画布零绘制（红色像素 0、fillText/roundRect 零调用——fillText 全量日志证实该列 body 无任何绘制调用），点击只发 cell-click 不发 `cell-item-click`。
- 原因：`demo/src/data/canvas-table/main-view.vue:650` button 列定义缺 `buttons` 配置（items 场景同型列配有 `buttons: record => record.buttons`）——`getButtons(record) ?? []` 得空数组，drawButton 直接返回。文件 mtime 早于本会话，非验证过程改动。
- 影响：设计改动清单（demo main-view.vue 行）「固定列组合（fixedLeftColumns ≥ 2 且 item 列分居两区——双 pass 命中 e2e 夹具）」中 button 滚动区夹具失效；测试计划 #14「两区条目均命中」button 半边无法执行。组件双 pass 命中能力本身正常（固定区 link 命中 + 滚动区 tag 命中均实测发事件）。
- 附带：同场景数量列渲染 "NaN"（itemRecords 无 count 字段）——夹具数据缺陷。

### 3.【范围】tag.js「已记录-未覆盖」

- `src/components/table/column-types/tag.js` 改动有 decisions.md 授权与 04-impl-集成.md 记录，但设计文档改动清单未更新（共享文件表仅 link.js/link.scss）。按判定规则计入「已记录-未覆盖」，阻碍 PASS 口径（本轮已因失败项 1 判 FAIL，此为附加范围项）。

## UNVERIFIED 项

| 项 | 原因 |
|---|---|
| #7 price clearable 清空 → null e2e | 时间预算未独立实测；自检 editor 组 null 两分支断言通过（面板 142 内） |
| #8 `--row-height`/根字号覆盖后 variable 行高重估数值跟随 | 未独立实测数值；onThemeChange 链路触发已被证实（失败项 1 根因即该链），重估机制在跑（rebuild 确实发生），但「行高跟随到 48px/18px」的精确断言未做 |
| #12 borderless 态 clear 按钮/select 下拉可用性 | 未实测；scss 白名单覆盖设计（仅 border-color/background/padding 三项） |
| #14 progress 17 色抽样中 primary/red（已测 success/warning/danger，均记录级 `(record)=>` 色） | 抽样 3+ 色要求已满足，未逐一覆盖全部色名 |

（以上 UNVERIFIED 均非环境阻塞导致，为本轮抽验范围取舍；核心路径已有等价证据。）
