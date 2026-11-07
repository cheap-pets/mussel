# 项目知识

使用规则：

- 命中即采用，不重复查证（含不进外部仓库复核）；待改代码须实际读取，不凭知识库推断。
- 报错先匹配 `pitfall` 条目。
- 依据条目执行或验证发现不符时，重新查证并调用 `project-knowledge` 覆写条目。
- 来源 `user` 的条目直接采信，与代码冲突先告知用户；其余冲突以代码为准。
- 只按索引读取相关条目，禁止遍历知识库。
- table / table-ex 相关条目单列主题页：[INDEX-table.md](./INDEX-table.md)，不在本页重复。

## Project

- [sizechange 事件：监听元素尺寸变化](./project/sizechange-event.md) `convention`：监听元素尺寸变化统一 `@sizechange`，禁止直接 new ResizeObserver；首挂即触发一次、不冒泡、卸载不解绑。
- [headless Edge 做 DOM/控制台断言（无 playwright 时）](./project/headless-edge-dom-verification.md) `convention`：无 playwright 时用 Edge `--dump-dom` 断言 DOM 与 console 输出，脚本走 dist/mussel.js dev 构建。
- [包裹层 display: contents 兼容既有扁平布局](./project/wrapper-display-contents-legacy-layout.md) `convention`：新增包裹层默认 display: contents 保扁平布局；`& > *` 不再命中孙元素，overflow/max-width 须下放。
- [桌面环境下触摸手势的运行时验证](./project/touch-gesture-runtime-verification.md) `convention`：桌面无 ontouchstart 手势拦截器不注册；addInitScript 伪造门槛 + 合成触摸事件 + page.clock 驱动长按。
- [国际化：locale 无响应式，运行时不可切换](./project/langs-locale-not-reactive.md) `convention`：locale 仅安装时确定一次；依赖文案宽度的计算不必为切语言预留重算路径。
- [Teleport 弹层与宿主组件的 CSS 变量级联断裂](./project/teleport-popup-css-vars.md) `pitfall`：弹层 Teleport 到根后宿主类上的组件级 CSS 变量不生效；弹层类须重复声明默认值。
- [级联延时收起：hide 不可向上清祖先计时器](./project/cascade-delay-hide-clears-ancestor-timer.md) `pitfall`：链离开后祖先面板滞留不关——hide 向上清了祖先未触发计时器；hide 只清自身。
- [集中样式拆分到各组件后，同特异性覆盖规则跨文件失效](./project/css-split-equal-specificity-order.md) `pitfall`：叠加态样式盖不住——覆盖对随 import 顺序漂移失效；覆盖规则须随被覆盖选择器同文件置尾。
- [demo 页 URL 前缀 /data/ 与新增页构建重启](./project/demo-watch-new-entry-restart.md) `pitfall` `code@worktree(2026-10-30)`：`/<name>/` 404——验证页实际在 `/data/<name>/`（AGENTS.md 表述过时）；新增页须 catalog.js 登记 + 重启 demo:build。
- [demo watch 重建会清空 demo/dist](./project/demo-watch-wipes-dist.md) `pitfall`：手工放入的临时资产重建后 404 / `Vue is not defined`——watch 重建清空 outDir；资产随用随放。
- [Playwright 验证延时收起弹层：整场景须单调用内完成](./project/playwright-delay-hide-popup-testing.md) `pitfall`：调用间隙链自关、同坐标重进无 mouseenter——hover→停留→断言须单脚本完成，重开前先移出移入。
- [容器 display:none 期间测量污染溢出折叠宽度缓存](./project/overflow-measure-hidden-container-cache.md) `pitfall`：恢复显示后全部项展开、触发器消失——隐藏期 0 宽写入 widthCache；0 宽须视同未测量。
- [Playwright 断言 modal 可见性须用 mask 的 display](./project/playwright-modal-visibility-assert.md) `pitfall`：关闭后 `.mu-dialog` display 恒非 none——自身值不受祖先 v-show 影响；须取 closest('.mu-modal-mask')。
- [Playwright 模拟 splitter 拖拽：真实 mouse + scrollIntoView + 方向语义](./project/playwright-splitter-drag-verify.md) `pitfall`：合成 PointerEvent 拖不动（setPointerCapture 抛错）——须真实 mouse 先 scrollIntoView；collapse-only 向 prev 方向拖为折叠。
- mu-split-box 侧栏面板初始尺寸 `pitfall` `code@9517eb6`：侧栏初始仅约 37px 无拖拽余地——`__start/__end` flex-grow:0 且 basis auto；须给 min-width 或固定宽。
- mu-dialog / mu-drawer 的 dismissible 无默认值 `pitfall` `code@9517eb6`：不传 dismissible 时 ESC 与遮罩点击均不关闭；需此交互须显式传 dismissible。
- [eslint 报错爆量 13 万：demo/dist 被拾取](./project/eslint-demo-dist-false-positives.md) `pitfall` `code@worktree(2026-10-30)`：`demo/**` glob 拾取 demo/dist 产物假报错；项目用全局 eslint 8.57.0，.eslintignore 须含 demo/dist，口径限 src 与 demo/src。

## Global

- [throttle-debounce trailing 参数覆盖丢批次](./global/throttle-debounce-trailing-args.md) `pitfall` `doc@5.0.2`：节流回调依赖入参过滤事件源时 trailing 只带最后一次调用参数，前序批次被静默丢弃；过滤须移到节流前逐批判定。
- [Playwright 经组件实例内部通道验证](./global/playwright-props-swap-verification.md) `convention`：dev 产物可 `__vueParentComponent.props` 直替驱动 watch（替换后勿触发父重渲）；production 无内部态，改走真实 UI 控件 + DOM/像素断言。
- [Playwright 后台页面：rAF / ResizeObserver 停发，定时器节流，transition 不启动](./global/playwright-hidden-page-resize-observer.md) `pitfall`：页面 hidden 时 rAF/RO 停发、定时器节流、transition 永停旧值；手动派发 / page.clock 驱动，canvas 帧依赖用截图强制 BeginFrame。
- [grid-template-rows 0fr↔1fr 展开动画的坑](./global/grid-rows-animation-pitfalls.md) `pitfall`：收起残留（margin 泄漏）、行抖动（auto 轨道隆起）、多余 item 漏出、动画中滚动错位；间距入内容/首轨定长/收敛层/动画后再滚。
- [Vue 卸载元素不会移除模板事件监听](./global/vue-unmount-no-listener-removal.md) `pitfall`：依赖卸载自动解绑的记账不归零——Vue 3 卸载只 hostRemove；需确定性释放须显式 removeEventListener。
- [flex 压缩截断破坏 rect 内容宽测量](./global/flex-ellipsis-breaks-rect-measurement.md) `pitfall`：行溢出时 rect 跨度被截断量抵消、判定虚高——用 Range 补回文本自然宽并计入首尾 margin。
- [inert 子树内元素不参与 hit-test：:hover 不匹配、点击无效](./global/inert-subtree-no-hover-no-click.md) `pitfall`：hover 显现/可点的附属元素移入 inert 行内即失效；置于 inert 容器外不受影响。
- [Boolean prop 未传被转换为 false](./global/boolean-prop-absent-casts-false.md) `pitfall`：`??` 兜底链失效——Boolean prop 未传且无 default 时为 false 非 undefined；须显式 default: undefined。
- [watch immediate 回调的 TDZ 陷阱](./global/watch-immediate-callback-tdz.md) `pitfall`：`Cannot access 'xxx' before initialization`——immediate 回调在 watch 返回前同步执行；标志前置 + nextTick 停表。
- [响应式 style patch 异步：递归重定位读到旧 rect](./global/reactive-style-patch-vs-recursive-rect-read.md) `pitfall`：递归重定位后子层原地不动——style patch 异步、锚点 rect 仍旧值；递归前清旧键同步 Object.assign。
- [被滚动裁剪容器滚出的行 rect 仍在视口内](./global/clipped-row-rect-still-in-viewport.md) `pitfall`：滚出滚动容器的元素误报可见——getBoundingClientRect 不受裁剪影响；须与裁剪容器可见矩形求交。
- [fixed 弹层可见性断言不可用 offsetParent](./global/fixed-popup-offset-parent-visibility.md) `pitfall`：可见 fixed 弹层被误判隐藏——fixed 元素 offsetParent 恒 null；用 :visible 或 getClientRects().length 断言。
- [fixed 弹层 right/bottom 定位基准不含滚动条](./project/fixed-popup-scrollbar-viewport-base.md) `pitfall` `code@worktree(2026-11-07)`：left/top 侧弹层偏移一个滚动条宽——innerWidth 含滚动条，视口量须用 documentElement.clientWidth/Height；tooltip/dropdown/context/popup-menu 已修。
- Vue reactive 代理引用相等比较恒 false `pitfall` `code@worktree(2026-10-28)`：代理 ≠ 原对象 / 另一代理——断言对象同一性须 `toRaw` 后比较原引用。
- 自检断言 Intl 数字格式化结果失败 `pitfall` `code@worktree(2026-10-28)`：手写期望值易错（分组分隔、尾零：`'1,234.50'` 实为 `'1,234.5'`）——先 node 复算实际输出。
- npm 后台脚本记录的是 shell PID，dev 服务杀不掉 `pitfall` `code@worktree(2026-10-28)`：shell PID ≠ node 服务进程——按端口 netstat 定位实际 PID 再 taskkill，事后验证端口释放。
