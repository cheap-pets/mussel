# 验证报告（终验）

VERDICT: FAIL

模式：终验（集成实施，片 1–3 一次完成）。验证范围：02-design.md 修订 4「验证」节全部可自动化项 + 00-task.md 验证命令。所有结论基于本验证实例自跑的证据，不采信 04-impl.md 自检结论。

## 上轮问题核对（第 2 轮起）

首轮终验（无上轮报告）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
| --- | --- | --- |
| `node --check` × 11 个改动 .js（src/icons/index.js、column-types/icon.js、column-types/index.js、ex/cell-painters.js、ex/editor.js、ex/row-geometry.js、ex/constants.js、ex/painter.js、self-checks/cell-painters.js、self-checks/painter.js、self-checks/editor.js） | PASS | 11 个全部 `OK`（逐文件循环输出，无 FAIL） |
| .vue `<script setup>` 提取后模块语法校验（`vm.SourceTextModule`，evidence/check-vue-syntax.mjs；table-ex.vue / demo table-ex main-view.vue / demo table main-view.vue） | PASS | 3 个 `OK`（48067 / 41411 / 10078 chars）。首次用 `new Function` 报「Cannot use import statement outside a module」系校验脚本非模块上下文，换 SourceTextModule 后通过——非源码问题 |
| `grep -rn "editorButton\|editor-button\|EDITOR_BUTTON" src/ demo/src/` | PASS | 0 命中（无输出行） |
| self-checks 面板（浏览器，http://localhost:3000/data/table-ex/ 调试面板） | FAIL | 221/223 通过；2 项 ✗（见「失败项」） |
| demo 页 canvas 验证（playwright，DOM/截图/像素） | PASS | 清单逐项见「验收标准核对」 |
| base table DOM 验证（http://localhost:3000/data/table/） | PASS | 见「验收标准核对」 |

本项目无 eslint / typecheck 配置（设计已声明），静态手段 = node --check + .vue 提取校验。

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
| --- | --- | --- | --- |
| icon 列双通道 compile 产物（canvas kind/icon/color/size；DOM mu-icon + text-{color} + innerHTML） | self-checks 面板 | ✗ 断言失败 1 项（DOM cell class，见失败项 1）；canvas 侧产物断言通过（kind/icon/color/size/title 逐键） | FAIL（断言） |
| icon 列非法值/未注册名空产物 + dev warn、null 静默、占位落地 | self-checks 面板 + demo 页 | ✓「icon 列：非法值/未注册名空产物…」块；demo 页 row4(noRegGlyph)/row5(null) 开 placeholder 后两列均显示「待填写」（evidence/table-ex-icon-placeholder-dark.png） | PASS |
| icons install：cls 码点解析（转义/字面两形态、glyphStatus ready、whenGlyphReady、幂等） | self-checks 面板 | ✓「icons install：cls 项码点解析…」块（转义 `\25CF` 与字面 `●` 两注入 class 均 ready、重注册幂等继承） | PASS |
| drawIconGlyph 双路径（cls fillText font/x/锚/color；svg drawImage 尺寸 = size） | self-checks 面板 | ✓「drawIconGlyph：cls 路径 fillText…svg 路径同步 Image 桩 drawImage」块 | PASS |
| resolveIconEntry 命中/未注册（四处共用单一入口） | self-checks 面板 | ✓「resolveIconEntry：注册命中返回原引用 / 未注册返回 null」块 | PASS |
| icon 列 canvas：svg 名显示 | demo 页截图 | evidence/table-ex-items-canvas-right.png row1 时钟图标（clock） | PASS |
| icon 列 canvas：注入 cls 名转义/字面两形态解析显示 | demo 页截图 + 像素 | 同上 row2/row3 实心圆点（demoGlyphA/B），bbox ≈15×14px 深灰实心（glyph fillText 形态，区别于 svg 描边） | PASS |
| icon 列 canvas：column.color 染色 | demo 页截图 + 像素 | 「图标（color/size）」列 row1-3 primary 蓝（色桶 32,128,224 ≈ rgb(28,126,214)）；「图标」列同值正文深灰 | PASS |
| icon 列 canvas：iconOption.size 生效（20 vs 16） | demo 页像素 | 「图标」列 bbox 宽 14–15px（size 16 描边框）vs「图标（color/size）」列 18–20px（size 20）；DOM 侧 font-size 16px/20px 见下 | PASS |
| icon 列 canvas：暗色主题切换 svg 重着色（缓存分键） | demo 页截图 | evidence/table-ex-icon-columns-dark.png：切 mu-dark 后 clock 描边深灰→浅灰白、primary 蓝保持；cls glyph 同步变浅色（fillStyle 随主题） | PASS |
| icon 列 canvas：同一图标多行/多消费点首帧后全部显示 | demo 页截图 | clock 出现于 row1「图标」「图标（color/size）」「按钮 icon+caption」三处；demoGlyphA 出现于 row2 两 icon 列 + row1 按钮 icon-only，全部显示（多监听 flush 后无空白格） | PASS |
| icon 列 canvas：未注册名/空值落占位文本 | demo 页截图 | evidence/table-ex-icon-placeholder-dark.png row4/row5 两列均「待填写」（demo 默认关 placeholder，开启后验证） | PASS |
| icon 列 DOM：td 挂 mu-table__icon-cell、mu-icon 渲染 svg | base table 页 DOM | td.className 含 `mu-table__icon-cell text-center`；span.mu-icon innerHTML 含 `<svg …>` | PASS |
| icon 列 DOM：text-{color} 染色 | base table 页 DOM | 「图标（color/size）」列 span.className = `mu-icon text-primary` | PASS |
| icon 列 DOM：内联 font-size = size | base table 页 DOM | 「图标」列 `font-size: 16px`、「图标（color/size）」列 `font-size: 20px` | PASS |
| icon 列 DOM：title 属性（title: true → 注册名） | base table 页 DOM | span mouseenter 后 `title = "clock"`（table-row.vue 动态 setTitle） | PASS |
| button 列：icon-only / icon+caption / link 三形态 | demo 页截图 | evidence/table-ex-items-canvas-right.png：「按钮」列 `[✎编辑][●][删除]`、「链接按钮」列同源 `✎编辑 ● 删除`（无 pill） | PASS |
| button 列：hover 反转图标色跟随 | demo 页截图 | evidence/verify-button-hover-e1.png（icon+caption hover：实蓝底白字白钟）＋ evidence/table-ex-button-icononly-hover.png（icon-only hover：实蓝底白点；常态浅蓝底蓝点） | PASS |
| button 列：未注册名降级 caption-only | demo 页截图 + self-checks | 「删除」pill 纯红字无图标（noRegBtnGlyph）；self-checks ✓「未注册降级」子断言在失败块内（x 序断言先抛出，降级断言经独立 tooltip 矩阵块 ✓ 覆盖——见失败项 2 说明） | PASS（行为） |
| button 列：点击 payload 不变 | demo 页事件日志 | 点击「编辑」→ `cell-item-click {"record":"#1","column":"buttons","button":{"caption":"编辑","icon":"clock"},"recordIndex":0}` | PASS |
| editButton：hover 显示已注册图标（svg） | demo 页截图 | evidence/table-ex-editbutton-hover3.png：hover 备注格 row1 右缘显示 dots 图标 | PASS（svg 形态） |
| editButton：hover 显示已注册图标（注入 cls 形态） | demo 页夹具 | demo 夹具仅 `editButton: { icon: 'dots' }`（svg），无 cls 形态夹具；cls 绘制原语由 self-checks drawIconGlyph cls 路径 ✓ 覆盖 | UNVERIFIED（demo 页，见下） |
| editButton：点击触发 edit-button-click（payload { record, recordIndex, column }） | demo 页事件日志 | `edit-button-click {"record":"#1","recordIndex":0,"column":"memo"}` | PASS |
| editButton：不选中行、不开编辑、不发 cell-click | demo 页事件日志 + DOM | 点击 dots 后日志仅 `edit-button-click` 一条（无 cell-click / update:selected-record）；`.mu-table-ex` 内无 input/textarea/select 编辑器（editorOpen=false） | PASS |
| editButton：未注册名不绘制不命中 | self-checks 面板 | ✓「editButton 门控 resolveIconEntry：注册名命中…未注册名判失败（不绘制不命中）」块；demo 页无未注册 editButton 夹具 | PASS（self-checks 证据） |
| 性能与 API 便利权衡（修订要求 4） | 人工审 | 设计「性能与 API 便利权衡」节 8 条权衡说明齐备（无自动化手段） | 需人工 |
| 旧名残留核查 | grep | src/ 与 demo/src/ 0 命中（含常量 EDITOR_BUTTON_*、事件 editor-button-click、符号 editorButton*) | PASS |

补充说明（button 列 tooltip 溢出矩阵）：失败块 2 内的 tooltip 子断言（「icon-only 固定宽计入计宽 44 溢出 / 70 不溢出」「icon+caption 含 12+4 计宽」）位于 x 序断言之后，因 x 序断言先抛出未执行；独立证据 = 同块 tooltip 断言组在 self-checks「resolveCellTooltip：button 组」既有块 ✓ + 新增矩阵断言编写正确（静态复核 demo/src/data/table-ex/self-checks/cell-painters.js:2416-2437）。该组断言需在失败项 2 修复后重跑确认。

## 范围核对

基线（00-task.md 2026-11-05）：`?? agent-docs/plans/20261105-table-ex-icon-column/`。

当前 `git status --short`：15 个 M + 2 个 ??：

- 设计/实施清单 16 文件全部在列且一一对应（15 M + 新文件 src/components/table/column-types/icon.js）：`src/icons/index.js`、`column-types/{icon.js,index.js,style.scss}`、`ex/{cell-painters,editor,row-geometry,constants,painter}.js`、`ex/table-ex.vue`、`demo/src/{common/style.css,data/table/main-view.vue,data/table-ex/main-view.vue,data/table-ex/self-checks/cell-painters.js,painter.js,editor.js}`。
- `?? agent-docs/plans/20261105-table-ex-icon-column/`：基线已有项。
- 验证产物：evidence/（本验证实例截图与校验脚本，已并入任务目录 evidence/，随任务目录未跟踪）。
- 无法区分：无。设计外改动：无（15 M 与清单完全一致，diff --stat 无清单外文件）。

## 测试质量问题

1. 失败项 1：断言手段与被测链路错位（用 canvas 通道解析函数 resolveCellContent 断言 DOM 产物顶层 class）——断言未断言到真实消费链（base/table-row.vue）。
2. 失败项 2：期望值数组计算错误（未叠加连续横排布局），非「只断言不抛错」类问题。
3. 其余 221 项断言真实锚定验收标准（产物形状逐键、门控、几何值、像素、事件 payload、warn 捕获），质量良好。

## 需人工检查

1. 真实 icon-font 字体时序：仓库无字体资产（设计「不可验证项」已声明）——pending → 两跳重试 → failed 链路与真实字体 tofu 替换，由使用方项目端到端验证。检查步骤：使用方注册 iconfont cls 图标后，① 断网/延迟加载字体场景观察首帧 tofu 是否在 fonts.ready 后重绘；② install 早于样式注入场景观察两跳重试后 ready。
2. 设计「实测确认点」观感项：button icon+caption 的 12px 图标与文字在 20px pill 内基线观感（evidence/table-ex-button-row1-nohover-zoom.png 可辅助目视）；editButton cls 形态 hover overlay 与 svg 形态视觉一致性（svg 形态已验，cls 形态 demo 无夹具）。
3. 性能与 API 便利权衡的认可（验收标准 4，设计「性能与 API 便利权衡」节 8 条，人工审）。

## 验收入口（FAIL，供修复轮复验，每条 ≤5 分钟）

1. icon/button/editButton canvas：访问 http://localhost:3000/data/table-ex/ → 场景选「条目/新列型」→ 横向滚动至最右（标准：icon 列显示/color/size/占位、button 三形态）；点「调试面板 - 重跑自检」看断言（标准：self-checks 全量）。
2. 暗色重着色：同页勾选「mu-dark 挂组件根」（标准：svg/cls 图标重着色）。
3. editButton：同页场景回「默认」→ 鼠标悬停「备注」列格右缘看 dots → 点击后看事件日志 `edit-button-click` 且无编辑器（标准：editButton 三语义）。
4. DOM 通道：访问 http://localhost:3000/data/table/ → 检查「图标」「图标（color/size）」列 td/span class、font-size、hover title（标准：DOM 通道四项）。
5. 静态：`node --check src/components/table/ex/cell-painters.js` 等 11 文件；`grep -rn "editorButton\|editor-button\|EDITOR_BUTTON" src/ demo/src/` 应 0 命中。

## 环境阻塞

无。3000 端口服务已在运行（直接访问成功），无服务启停记录。

手段限制记录（不影响判定）：demo canvas 的 `getImageData` 单像素读数与页面合成显示存在系统性不一致（多轮同帧互证），canvas 视觉断言最终以「同帧截图目视 + self-checks recordingCtx 断言」双证据为准；全部清单项均已取得可靠证据，无项因此降级。

## 失败项（FAIL 时，不含环境阻塞）

1. **self-checks：icon 列双通道 compile 产物——DOM 通道 cell class 断言失败**
   - 命令/标准：self-checks 面板块「[cell-painters] icon 列：双通道 compile 产物…」
   - 关键错误：`DOM 通道 cell class 期望 mu-table__icon-cell，实际 undefined`
   - 断言位置：demo/src/data/table-ex/self-checks/cell-painters.js:2187（`assertEqual(domSvg.class, 'mu-table__icon-cell', …)`）
   - 根因定位：断言经 `resolveCellContent` 取产物，该函数按既有语义解构剥离顶层 `class/style/title`（src/components/table/ex/cell-painters.js:300-303；模块头注释 :23-27「class/style 为 DOM 通道字段忽略，canvas 通道」）。实现按设计返回 `class: 'mu-table__icon-cell'`（src/components/table/column-types/icon.js:93）；真实 DOM 消费链 src/components/table/base/table-row.vue:60-66 正常消费该字段挂到 td（本验证 DOM 通道已实测 td class 含 mu-table__icon-cell）。
   - 实际 vs 预期：实际 undefined / 预期 'mu-table__icon-cell'。
   - 修复方向（二选一，归实施/设计裁决）：断言改直调 `compile(column, true)` 产物断言（绕过 canvas 解析链）；或 `resolveCellContent` 放行 DOM 通道 class 字段。
2. **self-checks：button 图标测宽/绘制 x 序断言失败**
   - 命令/标准：self-checks 面板块「[cell-painters] button 图标：icon-only/icon+caption 测宽与绘制…」
   - 关键错误：`期望 ["●@16","编辑@32","●@12","编辑@16"]，实际 ["●@16","编辑@32","●@70","编辑@102"]`
   - 断言位置：demo/src/data/table-ex/self-checks/cell-painters.js:2358-2362
   - 根因定位：期望值按「每条目独立从内容起点 8 起算」编写，未叠加连续横排布局的前序条目宽。连续横排 + 条目间 gap = padding(8) 是既有语义（同文件既有断言 :1040「pill 34×2 + gap 8 = 76、左基线 8/50」）。实现自洽：条目 2 起点 = 8+50+8=66 → icon-only 图标 x = 66+(20−12)/2=70（src/components/table/ex/cell-painters.js:1467）；条目 3 起点 = 66+20+8=94 → 降级 caption-only x = 94+8=102（:1485）。宽度断言 [50,20,34] 与实现一致（位于 x 序断言后，本轮未执行到）。
   - 实际 vs 预期：实际 x 序 70/102 正确反映连续布局；期望 12/16 为断言编写错误。
   - 修复方向：期望数组改为 `["●@16","编辑@32","●@70","编辑@102"]`（或注释改「逐条目独立绘制」语义并分三条断言单条目用例）。

## UNVERIFIED（无法验证项与原因）

1. editButton 注入 cls 形态 hover 显示（demo 页）：demo 夹具仅 svg 名（dots），无 cls 形态 editButton 夹具；cls 绘制原语已由 self-checks drawIconGlyph cls 路径断言覆盖（✓），demo 页 hover 整链未直接验证。
2. install 解析 pending → 两跳重试 → failed 链路：依赖异步样式/字体时序，设计「验证」节已声明不入同步断言；常规路径 ready 态断言 ✓（「icons install」块）。demo 页常规路径（样式表已就绪）即 ready 态，重试链无触发场景。
3. 真实 icon-font 字体文件的 tofu/字体加载时序：仓库无字体资产（设计已声明不可验证），列入需人工。

（环境阻塞导致的 UNVERIFIED：0）
