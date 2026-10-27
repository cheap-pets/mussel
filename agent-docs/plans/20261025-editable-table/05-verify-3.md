# 验证报告 — I2 第 3 轮（verifier，R1 人工 3 缺陷专项 + 回归）

VERDICT: PASS

验证环境：demo watch 常驻 :3000（先行检查两页均 200，非本轮启动，无 PID 需回收）。playwright 页面 `visibilityState=hidden`（后台页）——原生输入/scroll 停发，全部交互经合成 PointerEvent/MouseEvent/KeyboardEvent/scroll Event 驱动组件真实处理器链（生产路径）；rAF 停发 → 会话内一次性注入 `window.requestAnimationFrame = cb => setTimeout(cb, 16)` shim（仅测试环境，随页面丢弃，不改源码）；像素断言经 `getImageData`，dpr=1（`canvas.width / getBoundingClientRect().width` 实测）。R1 三缺陷逐条独立实测（不采信 04-impl-R1.md 自述），全部命令自跑。验证毕已关闭浏览器。

## 上轮问题核对（第 3 轮）

上轮验证报告 05-verify-2.md 为 PASS 基线（无失败项）。04-impl-R1.md 两节遗留逐项核对：

| # | 来源遗留项 | 本轮结论 | 证据 |
|---|-----------|---------|------|
| 1 | 修复轮唯一 FAIL：#16② textarea 文本左缘 = 格左+5（canvas-table.vue:52 内联 padding 覆盖） | **已解决（PASS）** | 本轮实测「多行备注」col 10 行 0：textarea `getAttribute('style')` = null（内联已删）、computed padding 四边 3px（scss calc(8−5) 生效）、文本左缘偏移 = 格左+8、首行顶 = 格顶+8（见 #16② 表 textarea 行） |
| 2 | 续做轮遗留 2：dist/ 残留旧内联声明（续做未重建） | **已解决** | 本轮 `npm run build` 复跑 exit 0（dev+prod 两次 built in），产物已重建（evidence/build-r3.log） |
| 3 | 续做轮遗留 1：02-design.md 实施步骤 R1 行「6 文件」计数未更新 | **未解决（文档小项，不影响 verdict）** | 见「文档一致性小项」节 |
| 4 | 修复轮遗留 3：self-checks/painter.js:73 夹具注释「均摊 130」漂移 | 未解决（既有 G2 注释漂移，非 R1 范围，实施记录已声明留待后续） | 本轮读取 :75 确认注释仍在；既有断言不依赖该值（自检 144/144 含该文件全部断言通过） |
| 5 | 修复轮遗留 2：自检基数 143→144 | 已核对 | 本轮首载 + 页内重跑均 144/144、0 ✗ |
| 6 | 修复轮遗留 4：帧感人工复核 | 沿用「需人工」 | 见「需人工检查」 |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|------|------|-------------------|
| `npm run build` | exit 0 | dev `mussel.js 603.08 kB / mussel.css 120.69 kB`、prod `mussel.min.js 282.73 kB / min.css 97.60 kB`，两次 `✓ built in`（555ms/559ms）。日志：`evidence/build-r3.log`（R1 canvas-table.vue 模板改动后重建，覆盖续做轮 dist 残留） |
| `npx stylelint "src/components/canvas-table/*.scss" src/styles/link.scss`（验证态，不带 --fix） | exit 0 | 无输出无错误（00-task.md 验证命令带 --fix；无错误时 fix 无可修项，等价） |
| `npx stylelint src/components/canvas-table/canvas-table.vue` | exit 0 | 无输出无错误（续做轮改动文件的样式面回归） |
| 自检面板首载（/data/canvas-table/） | 通过 | 「自检结果（144/144 通过）」、144 个 .ct-check-item、✗ 0 |
| 自检面板页内重跑 | 通过 | rAF shim 注入 + 合成 click「重跑自检」→ 仍 144/144、0 ✗ |
| 控制台 | 2 error | 均为既有夹具故意 badSrc（`data:image/png;base64,AAAA1/AAAA2` ERR_INVALID_URL，05-verify-2 已记录的测试行为） |

## 人工 3 逐条核对（#16，全部独立实测）

### 意见 1：行背景充满表格宽度（#16①）

| 子项 | 手段 | 证据 | 结果 |
|------|------|------|------|
| 三态行底色到达视口右缘（窄列场景 Σ=576 < W=956，striped 恒开） | 浏览器（getImageData） | 延伸区采样 x=596/954 与列区内 x=200 逐点一致：普通行（行 0/2）[255,255,255]=bgNormal、斑马行（行 1/3）[246,246,246]=bgStripe；选中行（合成 click 行 2）延伸区 = [237,249,255]=selectBg（三采样点一致） | PASS |
| hover 行带延伸区 = blend(hoverBg, 行底色)、与列区一致；leave 还原 | 浏览器 | 合成 pointermove 行 0：x=200/596/954 均 [242,242,243] = 0.1×rgb(123,130,136) 混 bgNormal（理论 [242,243,243]，±1 容差）；hover 期间行 1 保持 bgStripe 不受影响；pointerleave 后行 0 还原 [255,255,255]、行 2 保持 selectBg | PASS |
| 行网格线全宽（回归） | 浏览器 | y=72/108/144（行底）处 x=200/596/954 均 [201,205,209]=borderColorSoft | PASS |
| 横向滚动 Σ>W 背景不超出真实内容宽（默认场景 Σ=1434 > W=956） | 浏览器 | scrollLeft 拉满 478（=1434−956）后 x=W−2=954 行 0 = [255,255,255]=bgNormal（画布裁剪，不越界） | PASS |
| 固定列 pass 不扩带（遮挡关系） | 浏览器 | ① 自检 painter「行背景带宽度」组 (d)（固定 1 列 + Σ<W 整幅后滚动区首列文字像素存在）含于 144/144；② e2e fixed 场景（fixedLeft 2 列，Σ=1040 > W）scrollLeft=84 后：固定列 0 区文本像素 35 个、滚动区首列（col 2，视口 x=230）文本像素 324 个均存在——固定区正常重绘且未覆盖滚动区内容 | PASS |

### 意见 2：hover 描边 = 编辑浮层位置 + 4px 间距（#16②）

| 子项 | 手段 | 证据 | 结果 |
|------|------|------|------|
| 描边像素位置与颜色、外缘距格缘 4px（editable 名称列 input 态，格 (52,36,150,70) 变高行） | 浏览器（getImageData） | 四边采样均 [145,190,230] = withAlpha(primary rgb(28,126,214), 0.45) 叠 hover 行带 [242,242,243]（理论 r 145.7/g 189.8/b≈230）：左 x=56(=格左+4)、上 y=40、右 x=197(=格左+150−5)、下 y=101(=格顶+70−5)；外缘 x=55 / y=39 = [242,242,243] 纯行带（描边恰 1px，四周距格缘 4） | PASS |
| 描边矩形 = 编辑浮层矩形逐边相等 | 浏览器 | 单击进编辑浮层 rect (74,159,142,62)，与格矩形四边 gap = 4/4/4/4（= 描边 inset 4 矩形，逐边差 0 ≤ 1） | PASS |
| input 态文本左缘 = 格左+8（border 开） | 浏览器 | textLeftOffsetFromCell = 8（浮层 4 + 边框 1 + padding-left 3） | PASS |
| input 态文本左缘 = 格左+8（border 关，col 14「边框关」） | 浏览器 | `--borderless` 类生效；.mu-input computed padding "0px 0px 0px 3px"（基础 calc 生效、borderless 无 padding 覆盖）；textLeft = 8（透明边框仍占 1px） | PASS |
| textarea 态（「多行备注」col 10 行 0，格 220×70） | 浏览器 | 浮层四边 gap 4/4/4/4、浮层高 62 = 70−8（= heightAt−8）；textarea `getAttribute('style')` = **null**（canvas-table.vue:52 内联 padding 已删——续做核心项）；computed padding = 3px 四边；文本左缘 = 格左+8、首行顶 = 格顶+8 | PASS |
| 两态一致（#12 口径） | 浏览器 | border 开（名称列）/ border 关（col 14）/ textarea 三者文本左缘偏移均 = 8；浮层三类型（input/textarea 实测 + 自检 editor 组三类型同矩形断言）均 = 格 inset 4 | PASS |

### 意见 3：右下角 grip 改右下三角（#16③）

| 子项 | 手段 | 证据 | 结果 |
|------|------|------|------|
| 本体透明、16×16、cursor 不变 | 浏览器（getComputedStyle） | background rgba(0,0,0,0)（transparent）、width/height 16px/16px、cursor nwse-resize、本体 opacity 1 | PASS |
| ::after 右下三角 | 浏览器 | getComputedStyle(::after)：clipPath = `polygon(100% 0px, 100% 100%, 0px 100%)`、background rgb(28,126,214) = var(--mu-primary-color)、opacity 0.5、content "" | PASS |
| 16×16 命中区拖拽仍触发 onStageResizeStart | 浏览器 | 合成 pointerdown（grip 中心）+ move(+60,+30) + up → .ct-stage 990×440 → 1050×470（Δ=+60/+30 精确跟随）；判别性断言：左上角 (grip+3,+3)（三角视觉外、方形命中区内）pointerdown+move(−40,−20)+up → stage 1050 → 1010（Δ−40）——clip-path 仅裁视觉未裁命中（若误挂本体则此点不命中） | PASS |

## 回归抽查表

| 项 | 手段 | 证据 | 结果 |
|----|------|------|------|
| 自检 9 组全绿（首载 + 页内重跑） | 浏览器 | 144/144 ×（首载 1 次 + 重跑 1 次）、0 ✗（首载含 144 条 .ct-check-item 全无 ✗） | PASS |
| #4 整幅绘制窗口（R1 判据：canvas-table.vue 模板改动后） | 浏览器 | refreshTheme 整幅后 variable 模式 lastPaint.rowCount = 14 ≤ ceil(410/36)+2+1 = 15 | PASS |
| #6 调宽拖拽 | 浏览器 | 名称列表头列缘 pointerdown+move(+58)+up：colWidths 160→218、`column-resize {"column":"name","width":218}`；拖后同任务序 click 被吞（无 header-click/order-by/cell-click 新增，clickGuard 正常） | PASS |
| #11 树 toggle | 浏览器 | 树形列（col 0 name）箭头中心（cellX=16）合成 click：单条 `update:tree-expanded-keys {"count":2000}`、keys 2001→2000、平铺 10003→9996（Δ−7 = 4 叶+3 深层）、contentHeight 360144→359892（Δ−252 = 7×36，与 05-verify-2 记录一致）；再点恢复 2001/10003/360144；槽外（cellX=120）不 toggle 走选中链（update:selected-record + cell-click column name）；反向验证：非树形列（memo）cellX=16 单 click 不触发 toggle（仅选中链）。备注：初次误点 memo 列时观察到的 2 条 tree-expanded 日志为场景切换初始展开集解析事件（count 2000/2001 同 keys 前缀、无平铺变化），非点击 toggle | PASS |
| #14 条目命中 | 浏览器 | items 场景 button 列（col 4）首条目合成 click：`cell-item-click {"record":"#1","column":"buttons","button":{"caption":"编辑"},"recordIndex":0}` + update:selected-record + cell-click 冒泡照发 | PASS |
| #7/#12 编辑浮层子项（R1 判据行：浮层 rect / textarea 高 / 两态左缘） | 浏览器 | 已含于 #16② 表（浮层三态 inset 4、textarea 高 62=heightAt−8、border 开/关/textarea 左缘均 +8）；Esc 关闭编辑器多次生效（编辑器移除实测） | PASS |
| npm run build 复跑（模板改动后重建） | 命令 | exit 0（命令结果表） | PASS |
| stylelint | 命令 | scss 集合 + canvas-table.vue 均 exit 0 无错误 | PASS |

## 文档一致性小项（minor，不影响 verdict）

- 02-design.md **:878 实施步骤 R1 行**「改动清单『缺陷修复 R1』表 **6 文件**」与 **:202 表标题行**「源文件 4 + demo 夹具 1 + 自检 2」（合计 6）两处计数未随 [R1] 裁决补列更新；改动清单「缺陷修复 R1」表实际 **7 行**（:206-212，含 :209 canvas-table.vue [R1] 裁决补列行）。该表本体与续做改动一致，仅两处计数文字漂移。已记录（04-impl-R1.md 续做节遗留 1），超出续做白名单未修——留待后续轮次同步（若修正：:878 「6 文件」→「7 文件」、:202 「源文件 4」→「源文件 5」）。

## 范围核对

- 基线排除项（00-task.md 基线已含，不计改动）：`.gitignore`、`demo/src/catalog.js`、`src/components/index.js`（M，前序任务脏文件）；`src/components/canvas-table/`、`demo/src/data/canvas-table*/`、`.pipeline/`（untracked，基线即有）。`git status --short` 与 05-verify-2 记录完全一致（含 link.js/tag.js/link.scss 三个 G2 共享文件）。
- 无法区分：无（基线脏列表与本任务改动文件不相交；R1 的 7 文件全部位于基线即有的 untracked 目录内，属任务内演进现状）。
- 设计外改动：无。R1 全部改动（painter.js / editor.js / canvas-table.scss / canvas-table.vue（[R1] 裁决增补）/ demo main-view.vue / self-checks painter.js + editor.js）均在改动清单 R1 表 7 行内；source 侧关键点 grep 复核在位（painter.js:281/:300 bandToX、:650-653 描边 EDITOR_GAP；editor.js:90/:373-375 统一公式、死常量已删；scss:129/:144 calc、:153-154 borderless 无 padding 覆盖；canvas-table.vue 无内联 padding 残留；main-view.vue:1163-1169 grip ::after）。
- 并行组白名单：主实施（G1-S1）无新增改动面（05-verify-2 已核对，沿用）；R1/续做两轮均未越出各自白名单（续做轮仅 canvas-table.vue 1 处 style 属性删除，decisions.md [R1] 授权内）。
- 验证产物：`dist/`（npm run build 重建，被 .gitignore 忽略）；`evidence/build-r3.log`；`.playwright-mcp/`（仓库根，.gitignore 含 `*` / `!.gitignore` 已核对在位）。

## 测试质量

- R1 新增自检「行背景带宽度」组（painter.js 断言组）与 editor 新口径断言组均为行为断言（三态底色原色/blend 合成色/脏区重绘保持/固定 pass 不扩带/画布裁剪边界；EDITOR_GAP 值/三类型同矩形/borderless 同矩形/theme 不消费/退化防负），非「不抛错」式；含于 144/144 首载 + 重跑双绿。
- 上轮（05-verify-2）无测试质量问题遗留；本轮回归抽查未发现断言质量退化。
- e2e 断言与自检断言互补（自检模块级夹具 Σ=350<W=600，e2e 窄列场景 Σ=576<W=956），覆盖口径一致。

## 需人工检查（沿用前轮，非本轮新增）

1. #16②「帧感/描边观感」：hover 描边与编辑浮层的视觉观感（0.45 主色 1px 描边在真实显示器下的细腻度）——后台页像素断言已证几何与取色正确，观感建议前台复核。
2. #16③ grip 三角视觉形态（右下直角三角形大小/透明度观感）——computed clip-path 已证，形态观感建议前台复核。
3. #15 滚动流畅帧感（沿用 05-verify-2）。
4. 文档三处同步（skills/docs/docs-site，范围边界 #15）——待用户确认启动。

## 环境阻塞

无。环境限制与适配（手段等价、前轮同款，不影响结论）：
1. 后台页（visibilityState=hidden）：原生输入/scroll 停发 → 合成事件驱动真实处理器链。
2. rAF 停发 → 会话内一次性 rAF→setTimeout shim（不改源码，随页面丢弃）。
3. MuInput Enter/Esc 依赖 keyCode → 合成 KeyboardEvent 显式携带。

## UNVERIFIED 项

无（派发范围内全部实测）。

## 失败项（FAIL 时）

无。
