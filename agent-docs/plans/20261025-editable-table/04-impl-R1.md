# 实施记录 — R1（人工 3 缺陷修复，修复模式）

STATUS: BLOCKED(设计遗漏)（见「偏离」——R1 白名单 6 文件已全部实施并验证，仅 #16② 的 textarea 文本左缘子项因白名单外文件 table-ex.vue:52 的内联样式无法闭合）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|-------------|------|
| `src/components/table-ex/painter.js` | R1 表 ① | `paintCellRange` 增第 5 参 `bandToX`：行背景 fillRect 宽 = `max(x1, bandToX ?? x1) − x0`；滚动区五调用点（paint 整幅 / paintRowBand / paintColBand / paintCellRegion / paintResizeBand）传 `layout.stickyWidth`，paintFixedArea 内调用不传；hover 编辑描边（paintOverlay）改 `cellRectAt(layout, row, col)` 四周内缩 `EDITOR_GAP`（import 自 editor.js，strokeRect x/y = rect.x/y + EDITOR_GAP + 0.5、宽高 = rect − 2×EDITOR_GAP − 1），取色/时机/hoverMode none 抑制不变 |
| `src/components/table-ex/editor.js` | R1 表 ② | 新导出 `EDITOR_GAP = 4`；`computeEditorStyle` 重写为统一等距内缩矩形（left/top = 格原点 + EDITOR_GAP、width/height = 格宽高 − 2×EDITOR_GAP、height 经 `max(…, 0)` 防负值）；删 per-type editorH 分支 / inset / 垂直居中式与 `CONTROL_HEIGHT_FALLBACK`/`CELL_PADDING_FALLBACK`/`CELL_LINE_HEIGHT_FALLBACK`/`TEXTAREA_MAX_LINES` 四常量；`bordered` 判定与返回字段形状不变；`theme` 参数不再解构（头注标注保留签名兼容）；模块头注同步 |
| `src/components/table-ex/table-ex.scss` | R1 表 ③ | `__editor > .mu-input` padding `0` → `0 0 0 calc(var(--cell-padding, 8px) - 5px)`；`__editor > textarea.mu-input` padding `3px 10px` → `calc(var(--cell-padding, 8px) - 5px)`；`__editor--borderless > .mu-input` 删除自身 `padding: 0` 覆盖（保留 border-color/background）；注释同步 |
| `demo/src/data/table-ex/main-view.vue` | R1 表 ④ | `.ct-resize-handle` 本体 background/opacity 移除（16×16 命中区与 `cursor: nwse-resize` 不变），新增 `.ct-resize-handle::after`（本 vue 样式块为普通 CSS，`&::after` 写为独立规则）：`inset: 0; background: var(--mu-primary-color); opacity: 0.5; clip-path: polygon(100% 0, 100% 100%, 0 100%)`；模板与 `onStageResizeStart` 零改动；新增「窄列」场景（radio 选项 + `narrowColumns`：rec_no 56 / 名称 280 / 数量 240，Σ=576 ≈ 60% 舞台宽 960，striped 恒开、列不配 editor，records 复用默认数据源——stageRecords default 分支覆盖 narrow） |
| `demo/src/data/table-ex/self-checks/painter.js` | R1 表 ⑤ | 新增断言组「行背景带宽度」：窄列夹具（4 列全定宽 Σ=350 < W=600、固定 1 列）整幅后 (a) 延伸区 x=450 斑马/普通/选中三态底色原色；(b) hover 行带延伸区 = blend(hoverBg, 行底色)；(c) 行横带脏区 hover 进出重绘保持/还原；(d) 固定 pass 不扩带（滚动区首列文字像素存在）；(e) Σ > W（既有夹具 Σ=630）x=W−1 行底色（画布裁剪）。既有「hover 编辑感知」组采样点改 `cellRect.x + EDITOR_GAP` / `cellRect.y + EDITOR_GAP`（1px 描边全覆盖像素）并补「描边外缘距格缘 = 4」（x−1 / y−1 处纯行带）；`makeState` 增 `columns` 参数支持窄列夹具；import `EDITOR_GAP`；模块头注同步 |
| `demo/src/data/table-ex/self-checks/editor.js` | R1 表 ⑥ | `computeEditorStyle` 断言组按 A5.4 R1 重写：`EDITOR_GAP === 4`；input/switch/textarea 三类型同矩形（fixed 列 left/top/width/height = 4/68/92/28）；border/borderless 两态矩形相同仅 bordered 标记差异；滚动列（54/40/72/28）固定列横向滚动对照保留；变高行（heightAt 100 → top 76/height 92）；退化 rowHeight 0 → height 0 防负值；`theme: undefined` 与传 theme 矩形逐边相等（theme 不再消费）；uniform 等高回退 top = headHeight + rowIndex×rowHeight − scrollTop + 4；删 clamp 上限/居中差/`[7,34]`/taEdge padding−1 等旧口径断言；import `EDITOR_GAP`；模块头注同步 |

白名单外零改动（`src/components/table-ex/table-ex.vue`、interactions.js、layout.js、theme.js、cell-painters.js、self-checks/index.js 等均未触碰；git status 核对仅上述 6 文件 + `.pipeline/` 产物）。

## 偏离

**设计第 R1 步（改动清单「缺陷修复 R1」表 table-ex.scss 行 + A5.4 现行文本）：BLOCKED(设计遗漏)——table-ex.vue:48-52 的 textarea 内联样式未被 R1 改动清单覆盖，导致「textarea 文本左缘/首行顶一致」无法达成。**

- 现象（playwright #16② 实测，editable 页「多行备注」列行 0，行高 70）：浮层 rect = (1022, 40, 212, 62) = 格矩形 (1018, 36, 220, 70) 四周内缩 4px，逐边精确相等（此半通过）；但 textarea 元素 `computed padding-left: 0px`（`padding-top: 3px` 生效自 scss calc），文本左缘 = 格左 + 4(EDITOR_GAP) + 1(边框) + 0 = **格左 + 5 ≠ 格左 + 8**（首行顶 = 格顶 + 8 正确）。
- 原因：`src/components/table-ex/table-ex.vue:52` textarea 分支模板带内联 `style="padding-right: 0; padding-left: 0;"`——该内联样式是**前稿口径的配套**（02-design.md 前稿 editor.js 行「textarea 模板/scss 约定 padding-left 0 → 文本左缘 = 浮层 left + 边框 1 = 格左 + padding」，即被 R1 整体删除的「inset = padding−1」旧公式）。R1 修订将左缘补偿移入 scss 基础规则（`calc(var(--cell-padding) - 5px)`）后，该内联覆盖使 scss 左/右两向失效（内联 style 优先级高于任何选择器；padding-top/bottom 未被内联覆盖故垂直方向正确）。
- 缺口定性：达成 A5.4 R1 现行文本「textarea：padding: calc(var(--cell-padding, 8px) - 5px)（四边）」必需删除该内联 padding-left/right 声明（保留行内其余内容），但 table-ex.vue 不在 R1 白名单（R1 表 :209 只列 scss；table-ex.vue 仅在历史 G3 文件集）。按并发模式口径二选一：该文件属设计 G3 步骤文件集 → `拆分过粗`；必需改动不在 R1 表任何行中 → `设计遗漏`。主报 `设计遗漏`（R1 修订遗漏旧口径配套点的清理）。
- 证据：`table-ex.vue:48-54`（textarea 内联 style）；02-design.md `:208`（R1 scss 行未提模板内联样式）；`:637`（A5.4 textarea 四边 calc 口径）；`:864`（#16② textarea 首行文本左缘断言）。
- 修复方式（供调度者裁量，本实例未执行——越白名单）：删除 `table-ex.vue:52` 内联 style 的 `padding-right: 0; padding-left: 0;`（或整条 style 属性），随后 #16②/#7 的 textarea 左缘子项复验。**不采用 scss `!important` 对抗内联**（项目 stylelint 约束与层叠卫生均不允许，且属设计外改动）。

## 自检

命令（均本轮实跑）：

| 命令 | 结果 |
|------|------|
| `npx stylelint src/components/table-ex/table-ex.scss --fix` | exit 0，无输出无错误 |
| `npm run build` | exit 0（dev `mussel.js 603.16 kB / mussel.css 120.69 kB`、prod `mussel.min.js 282.77 kB / min.css 97.60 kB`，两次 `✓ built in`） |
| 自检面板 `/data/table-ex/`（rollup watch :3000 热编译后首载） | **144/144 通过，0 ✗**（143 基数 + painter 新增「行背景带宽度」1 组；分组 text-wrap 10 / row-geometry 12 / tree 8 / theme 15 / layout 21 / cell-painters 28 / **painter 15** / interactions 18 / **editor 13** / data 4——组数不变，index.js 无注册改动）。控制台唯一 error 为既有夹具故意 badSrc（05-verify-2 已记录的测试行为） |

playwright（合成事件驱动真实处理器链；后台页 rAF 挂起 → 会话内注入 `requestAnimationFrame → setTimeout` 等价驱动 + Node 侧 ≥1s 等待，不改源码；像素经 `getImageData`，dpr=1）：

| 断言 | 结果 | 证据 |
|------|------|------|
| #16① 行背景充满（窄列场景 Σ=576 < W=956） | PASS | 延伸区 x=656：普通行 [255,255,255]=bgNormal、斑马行 [246,246,246]=bgStripe、选中行 [237,249,255]=selectBg，与列区内 x=200 逐点一致；hover 行带延伸区 = 列区内 = [242,242,243] = blend(hoverBg, bgNormal)（±2），leave 后还原白；行网格线全宽 [201,205,209]=borderColorSoft（回归） |
| #16① 横向滚动（默认 10 万行场景 Σ=1434 > W=986） | PASS | scrollLeft=448 拉满后 x=W−2=984 处行底色 = bgNormal（不越界） |
| #16① 固定列 + 窄列（固定 pass 不扩带） | PASS | e2e 由自检组 (d) 覆盖（窄列固定 1 列整幅后滚动区首列文字像素存在）；e2e 固定场景未见回归（#14 双区命中见下） |
| #16② hover 描边 = 编辑浮层矩形 + 4px（editable 页名称格 cellRect (52,36,150,70)） | PASS | 描边像素在 x=56（r.x+4）/ y=40（r.y+4）= 0.45 主色混合 [136,186,230]；外缘 x=55 / y=39 无描边色（描边恰 1px，外缘距格缘 4）；hover cursor = `text`；单击进编辑浮层 rect (56,40,142,62) 与描边矩形逐边相等（edgesOk true） |
| #16② 全编辑器类型同矩形（#12） | PASS | input (56,40,142,62) / switch (812,40,62,62，容器挂 `--borderless`) / textarea (1022,40,212,62) 各自 = 格矩形 inset 4，含变高行（行高 70 → 高 62 = heightAt−8）；textarea 元素高 62 |
| #12 两态文本左缘一致（边框开/关列，scrollLeft=530） | PASS | borderOn：浮层 left 1022 = 格视口左 1018+4，input 文本左缘 1026 = 格左+8；borderOff：`--borderless` 类生效，input 文本左缘 1156 = 格左(1148)+8（scss 删除 padding 覆盖后基础规则 padding-left 3px 对两态同效） |
| #16② textarea 文本左缘 = 格左 + 8 | **FAIL** | 见「偏离」：table-ex.vue:52 内联 `padding-left: 0` 覆盖，实测 padding-left 0px、文本左缘 = 格左 + 5 |
| #7 新口径子项（浮层 rect 4px 口径 / textarea 高 = heightAt−8） | PASS | 浮层 rect 三类型逐边 = inset 4；textarea 高 62 = 70−8（垂直首行顶 = 格顶+8：padding-top 3 + border 1 生效） |
| #4 整幅绘制窗口 | PASS | refreshTheme 整幅后 lastPaint.rowCount 14 ≤ ceil(viewH/36)+2+1 = 15 |
| #6 调宽拖拽 | PASS | 名称列右缘 pointerdown+move+up：colWidths 160→218、`column-resize {"column":"name","width":218}`；拖后紧随同任务序 click 被吞（无排序/编辑新日志，clickGuard 正常） |
| #11 树 toggle | PASS | 箭头槽内（cellX=8 < 16）点击：`update:tree-expanded-keys` count 2000（平铺 10003→9996）、再点 count 2001（回 10003）；槽外点击走选中链不 toggle（回归，与 05-verify-2 一致） |
| #14 条目命中 | PASS | 按钮列首条目点击：`cell-item-click {"record":"#1","column":"buttons","button":{"caption":"编辑"},"recordIndex":0}` + cell-click 冒泡照发 |
| `npx stylelint … --fix` | PASS | 上表命令结果 |
| `npm run build` | PASS | exit 0（上表命令结果） |

环境说明：demo watch（:3000）两页 200 常驻，热编译后验证，未重启服务；playwright 页面 `visibilityState=hidden`（后台页），原生输入/scroll 停发——交互全部合成 PointerEvent/KeyboardEvent/scroll Event 驱动 sticky 层与滚动容器真实处理器链（生产路径）；hidden 页 rAF 不回调 → 会话内 `window.requestAnimationFrame = cb => setTimeout(cb, 16)` 一次性注入（仅测试环境，不改源码，验证后随页面丢弃）。

## 遗留

1. **#16② textarea 文本左缘子项 FAIL**（偏离节）：待调度者将 `src/components/table-ex/table-ex.vue:52` 内联 `padding-right: 0; padding-left: 0;` 的删除纳入 R1 白名单（最小 1 行改动），复验该子项即可；其余 R1 判据已全绿。
2. 自检面板总数 143 → 144（painter 新增 1 组），下游验证基线需按 144 更新；组数 10 不变（9 模块组 + data 组）。
3. `self-checks/painter.js:73` 既有夹具注释「备注 未定宽 → 均摊 130」与 G2 后实际值 160（TYPE_DEFAULT_WIDTHS.text 基线、Σ=630 > W）不符——G2 引入的注释漂移，非 R1 范围（既有断言不依赖该注释值，且 (e) 断言实际利用 Σ>W 形态），留待后续轮次修正注释。
4. 后台页环境限制（rAF 停发、setTimeout 节流、原生 click 停发）沿用 05-verify-2 的手段等价适配；帧感/视觉观感仍建议真实前台人工复核（05-verify-2 需人工检查项沿用）。

---

# 续做（R1 白名单增补处置，续做模式）

STATUS: DONE（本节为 [R1] 裁决后的续做轮记录；上方原记录为修复轮 BLOCKED(设计遗漏) 记录，本轮闭合其唯一 FAIL 项 #16②）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|-------------|------|
| `src/components/table-ex/table-ex.vue` | R1 表新增行（[R1] 裁决补列） | 删除 textarea 分支模板内联 `style="padding-right: 0; padding-left: 0;"`（删除前位于 :52，整条 style 属性移除——该 style 仅含此二声明，模板其余内容零改动）。该内联为 R1 前稿「inset = padding−1」旧口径配套残留，覆盖 scss `calc(var(--cell-padding, 8px) - 5px)` 左/右两向补偿；删除后 scss calc 补偿生效（左缘/右缘 = 格左/格右内 + 8） |

白名单外零改动（git status 核对：仅上述文件 + `.pipeline/` 两份文档 02-design.md / 04-impl-R1.md 本身；interactions.js、layout.js、theme.js、editor.js、painter.js、scss 等均未触碰）。

## 偏离

无。本轮改动即 decisions.md [R1] 裁决授权项本身，无新增偏离。

范围说明（非偏离）：未跑 `npm run build`（按派发豁免——本轮为模板属性删除，无 JS 逻辑改动；demo watch（:3000）已热编译新代码并完成全部验证）。库产物 `dist/` 内残留旧内联声明，待下次构建自然更新，不影响源码正确性。

## 自检

命令（本轮实跑）：

| 命令 | 结果 |
|------|------|
| `npx stylelint src/components/table-ex/table-ex.vue` | exit 0，无错误（.vue 在 stylelint 覆盖范围） |
| 自检面板 `/data/table-ex/`（demo watch 热编译后新载） | **144/144 通过，0 ✗**（DOM 实测 summary「自检结果（144/144 通过）」、144 个 .ct-check-item、✗ 0 条）。控制台唯一 error = 既有夹具故意 badSrc（`data:image/png;base64,AAAA` ERR_INVALID_URL，05-verify-2 已记录的测试行为） |

playwright 复验（editable 页；合成 PointerEvent/KeyboardEvent/scroll Event 驱动真实处理器链；后台页 setTimeout 强节流，等待改用微任务 flush（Vue nextTick 语义），rAF→setTimeout shim 一次性注入沿用，不改源码）：

| 断言 | 结果 | 证据 |
|------|------|------|
| **#16② textarea 文本左缘 = 格左 + 8（原 FAIL 项恢复）** | **PASS** | 「多行备注」col 10 行 0（格 220×70）：textarea 元素 `style` 属性 = null（内联已除）、computed padding 四边 = 3px（calc 生效，含原被内联清零的 padding-right）、borderLeft 1px → 文本左缘偏移 = **8**、首行顶偏移 = **8** |
| #16② 浮层矩形 = 格 inset 4（textarea） | PASS | 浮层 (1040,159,212,62) vs 格 (1036,155,220,70)：四边 gap 均 4；textarea 元素高 62 = heightAt − 8 |
| #7 新口径子项（三类型同矩形） | PASS | input col 9（.mu-input）/ switch col 8（.mu-switch，borderless）/ textarea col 10：浮层四边 gap 均 4、高 62 = 70 − 8（本轮改动后回归复测，与前轮 PASS 一致） |
| #12 两态文本左缘一致（边框开/关） | PASS | col 13 边框开（bordered）文本左缘偏移 = 8（pad 3px + border 1px）；col 14 边框关（`--borderless` 类生效）文本左缘偏移 = **8**（borderless 规则实测 cssText 仅 `background: none; border-color: transparent`，无 padding 覆盖——两态同效的样式层证据） |
| #16② textarea「两态一致」说明 | PASS（bordered 实测 + 样式层推证） | 夹具无 borderless textarea 列（标签数组/链接数组均 editor:true），bordered textarea 实测左缘 +8；borderless 态无独立 padding 规则（样式层证据同上）且透明边框仍占 1px，几何与 bordered 全同——与 A5.4「两态仅差边框可见性」口径一致 |

## 遗留

1. 02-design.md 实施步骤 R1 行（:877 附近）「改动清单『缺陷修复 R1』表 6 文件」引用计数未随本轮补行更新为 7——超出本轮白名单「仅限 R1 表补行」，表述以改动清单 R1 表实际行数为准。
2. `dist/` 库产物含旧内联声明（未重建，理由见「偏离」范围说明）；下次 `npm run build` 自然消除。
3. 原记录遗留 2/3/4（自检基数 144 供下游基线、painter.js:73 夹具注释漂移、后台页帧感建议人工复核）继续有效。
