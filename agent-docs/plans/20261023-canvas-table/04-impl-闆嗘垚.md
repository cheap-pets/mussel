# 实施记录 — 集成（S1 组件壳与样式 + demo 接入；S2 组件库注册）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/canvas-table/canvas-table.vue` | S1 | 组件壳：模板骨架（`.mu-canvas-table > __scroll(v-mu-scrollbar) > [.mu-scrollbar__tracks 注入位][__sticky>canvas>__overlay(投影条/空态/__editor)][__spacer]`，实测 DOM 顺序 `[tracks, sticky, spacer]`）；props/emits 全量按 A1（含 emptyText/recordsVersion/editable/resizable，emit 清单 8 项）；`defineExpose` scrollToRecord/refreshTheme/getLayoutInfo/getThemeSnapshot/getCellRect；模块组合与生命周期（onMounted 建 painter/themeWatcher → nextTick relayout；onUnmounted editor.destroy/themeWatcher.destroy/painter.dispose/frameScheduler.cancel/throttle.cancel）；watch 全套（records 引用复位滚动、columns 清 overrides、recordsVersion/gridlines/hoverMode/striped/orderBy/recordsOffset/placeholder → 整幅、headerChecked → 表头区、selectedKey → 旧/新选中行横带、fixedLeftColumns → relayout）；interactions DOM 接线（__sticky 层 pointermove/pointerleave/pointerdown/click/dblclick，拖拽期 window 级 move/up，clickGuard 误触抑制）；editor 浮层模板（分类型 v-on 合成、容器 tabindex=-1、`@keydown.esc` 空值防护） |
| `src/components/canvas-table/canvas-table.scss` | S1 | BEM + 局部尺寸变量镜像 table.scss（--row-height/--cell-padding/--cell-line-height/--head-row-height）+ 探针宿主/浮层/投影条（--mu-shadow-float，y-scrolled/y-overflowed/y-scrolled-end 类驱动）+ `__editor`（flex/center/overflow hidden/背景 `--mu-bg-normal`/`.mu-input` 100%×100% 填充） |
| `src/components/canvas-table/index.js` | S1 | `export { default }` + `export { default as MuCanvasTable }`（命名导出，S1 本地 import 与 S2 全局注册共用） |
| `demo/src/data/canvas-table/main-view.vue` | S1 | 替换 G0 占位为真实组件（本地相对路径 import `{ MuCanvasTable }`，不依赖 S2 全局注册）；`window.__canvasTable` 挂组件实例（onMounted 整体替换 G0 占位对象）；props/事件/插槽按 G0 注释全量接线；两处夹具修正见偏离 4 |
| `src/components/index.js` | S2 | import 并注册 `MuCanvasTable`（`_install` 列表，对齐 MuTable 先例） |

## 各模块契约落实（04-impl-*.md「遗留/契约/偏离」逐条）

| 契约来源 | 落实 |
|---------|------|
| G0 遗留 1/2/3/4 | `.ct-placeholder` 替换为 `<mu-canvas-table>`；`window.__canvasTable` onMounted 换组件实例；`getThemeSnapshot()` 经 defineExpose 暴露（返回 watcher.snapshot）；调试面板经 getLayoutInfo 轮询 lastPaint 自动生效（实测重绘计数/lastPaint 有值） |
| G1-a 遗留 | `createThemeWatcher({ probeHost: __sticky, componentRoot: 根元素, onChange → relayoutAndRedraw })`；refreshTheme = watcher.refresh()（onChange 同步 relayout + 整幅）；rowHeight/headHeight 消费方缺省兜底 `\|\| 36` |
| G1-b 遗留 3 | relayout(input) 纯计算 + sticky/spacer 以返回值落 DOM；widthOverrides 由壳持有（`widthOverrides` 普通对象按列 `_key`），拖拽 move 自行 clamp 并临时更新列几何（computePrefixSums 增量），up → emit column-resize → relayout 重跑求解；columns 引用替换 watch 内清空（实测拖 140 → 替换 → 换回 80）；滚动路径不重跑 solveWidths（recomputeViewWindows 直调 computeViewRows/Cols）；命中换算以 rowAt/colAt/findResizeColumn 经 hitTest 调用 |
| G2-a 遗留 3 | `createPainter({ canvas })` + onUnmounted dispose；持久 state 原地变更（syncPaintState）后 invalidate；触发点→region 映射：hover/选中 → rows/cols/cell、headerChecked → `{header:true}`、编辑提交/check 点击 → invalidateRow（nextTick）、调宽 move → `{colFrom}`、滚动 → draw 整幅（rAF 合帧 createFrameScheduler）；`getLayoutInfo().lastPaint` 直取 painter.lastPaint；canvas 物理尺寸（DPR 直乘 round）归壳 relayout 路径 |
| G2-b 遗留 1 | __sticky 层监听 + window 级拖拽监听；recordKey 按 keyField（无则 key-builder）；disabled/value 从 resolveCellContent check items attrs 读取（`!= null && !== false`）；resolveResizeWidth 的 pointerX 为 canvas 视口坐标（clientX − canvasRect.left）；up → release() → emit → relayout；resolvePointerdown 先 commit 再续命中；click 统一先 guard.consume() |
| G2-c 遗留 1 | `createEditorController({ onCommit → emit update:cell-value + nextTick invalidateRow })`；模板按 A6（v-if/:style/:title/tabindex=-1/三层 .stop/keydown.esc）；open 入参含 computeEditorStyle 定位与 getEditorEl；画布 pointerdown（editing 中）与容器滚动调 editor.commit()；onUnmounted destroy |
| decisions「[I1 前]」壳内条目 | ④ viewH/viewW 口径经 layout relayout 全链消费；⑥ widthOverrides 壳持有、columns 替换清空（自检+实测固化） |

## 偏离

1. **G2-c editor.js「Vue :style 自动补 px」假设不成立**（设计 A6/G2-c 注释均按数值定位）。证据：编辑浮层 `getAttribute('style')` 为 null、无定位无尺寸（浏览器丢弃非法值 `el.style.left = '624'`）——Vue 不做 px 补全（React 行为）。处理：壳侧 `toPxStyle()` 把 computeEditorStyle 产出转 px 串后再入编辑态；editor.js 不在白名单，未改动。实测浮层 style = `left: 624px; top: 36px; width: 180px; height: 36px`，与 getCellRect 单元格矩形完全重合。
2. **G2-c editor.js focusAfterRender 聚焦不可达**：`if (state.editing !== editing) return` 拿 reactive 代理与原始对象做严格比较，恒为真。证据：页面级插桩 `HTMLElement.prototype.focus` 零调用、activeElement 恒 body。处理：壳侧 `focusEditor()`（open 后 nextTick，input/select/date 聚焦内部 input、switch 聚焦容器），editor.js 未改动。实测聚焦稳定生效。
3. **容器级 keydown.esc 空值防护**：input 内 esc 经组件转发 cancel 后，同一 keydown 事件冒泡到 `__editor` 容器，此时 `state.editing` 已 null，原样绑定 `editing.onEsc` 抛 `TypeError: Cannot read properties of null`（实测 console error 一次）。模板改为 `editor.state.editing?.onEsc()`。
4. **demo 夹具修正**（main-view.vue，G0 创建、本轮白名单内）：① mu-dark 原只绑 `.ct-stage` 容器——theme watcher 观察根为 `.mu-root` 与组件根，中间容器 class 变化感知不到，暗色切换实测不重绘；改为组件标签 `:class="{ 'mu-dark': darkOnRoot }"` 双绑（G0 记录已预告「S1 类落在组件标签上」），实测 600ms 内 canvas 暗色重绘。② `--row-height` 覆盖原写 stage 内联——组件根自身声明 `--row-height: 36px`（table.scss 镜像语义）覆盖父层继承值，与 DOM 版 `.mu-table` 同语义，覆盖应落在组件根；改绑组件标签 `:style`，实测 48px 生效、spacer 同步、可视行数 13→10。
5. **scss 补 `__editor` 背景 `--mu-bg-normal`**（设计 A6 的 scss 片段无背景）：bool 列 canvas 绘制文本（是/否）而编辑器为 switch 小控件（不铺满浮层），透明浮层与 canvas 内容叠影；输入类控件自身有底色不受影响。
6. **脏区重绘一律 `immediate: true`**（非偏离，实现说明）：painter 的 rAF 队列 flush 应用的是上次绘制时的 state 浅拷贝，本壳以持久 state 原地变更后必须同步应用才能以新状态重绘（G2-a invalidate 契约「state 缺省用最近一次 draw 的 state」的字面行为）；hover/选中仍为脏带范围，滚动整幅仍走壳侧 rAF 合帧。

## 自检

| 检查 | 命令/方式 | 结果 |
|------|----------|------|
| stylelint | `npx stylelint "src/components/canvas-table/*.scss" --fix` | 通过（exit 0，--fix 调整属性顺序一次后复跑无错误） |
| demo 全功能（playwright，`http://localhost:3000/data/canvas-table/`） | browser_run_code_unsafe 坐标级交互 + evaluate DOM/像素断言 | 全部通过，逐项：**渲染** canvas 满幅非空、表头/表体底色、斑马纹（行 1 = --mu-bg-stripe）、选中行底色（--mu-primary-faint）、hover 行高亮（灰透混合）、排序图标主色三角 12px 采样、固定区分界强化线；**虚拟滚动** 10 万行 scrollTop=1800000 → lastPaint.rowCount 13 ≤ ceil+OVERSCAN+1、spacer 高 = max(0, contentH − clientH) 恒成立；**DOM 顺序** `[tracks, sticky, spacer]`；**事件序列** 排序列表头 = header-click + update:order-by（asc→desc→'' 循环）、非排序列仅 header-click、check ✓ 表头仅 update:header-checked、单元格点击 = selected-key/selected-record/cell-click、check 单元格 = cell-value+选中+cell-click、disabled 场景经 G2-b 自检固化；**调宽** 手柄 col-resize 光标、move 中参考线主色像素、up emit column-resize、拖后 click 被抑制（无 header-click）、固定列缘与列级 resizable:false 排除（fixedLeftColumns=2 下分界两侧 -1）；**编辑** dblclick 定位/100% 填充/聚焦、Enter 提交载荷、validate 失败 invalid+title 不关闭、Esc 取消无事件、enum 下拉 3 选项（mappings 转换排除 default）点选提交恰一次且值为 mapping key 字符串（decisions⑦）、date 面板点不可聚焦 prev（review-3 Blocker 1 场景）编辑器不关、面板选日提交、bool 编辑器点 switch 切换即提交、blur 兜底（点空白提交）、编辑中点其他格一步提交+选中新行、滚动即提交、editable=false 无浮层；**实例方法** scrollToRecord(5000) scrollTop 精确对准、refreshTheme 后快照/行高/字号更新、getLayoutInfo/getThemeSnapshot/getCellRect 可用；**夹具** 空态三变体（无/emptyText/#empty 插槽）、placeholder 空值格像素 0→233、recordsOffset 100 → rec_no "101" 像素 13→53、3 行 spacer=0、容器手柄高度 +60 → spacer −60 且公式成立、y-scrolled 投影类、recordsVersion 异步递增、列宽拖拽后 columns 替换 override 清空（140→220→换回 80）；**暗色** mu-dark 挂组件根 600ms 内 canvas bg 白→[7,8,8]→白；**自检面板** 首次挂载 77/77 全绿 |
| S2 构建 | `npm run build`（dev + prod） | 通过：288 modules，dist/mussel.js 511.74 kB / mussel.min.js 256.61 kB，产物含 MuCanvasTable 与 --row-height tokens |
| 回归抽查 | playwright 访问 `data/table`、`navigation/menu`、`form/form`、`data/table-advanced` | 均 200、#app 渲染正常、console 0 error |
| 最终 smoke | 重载 canvas-table 页 | 自检 77/77、编辑器定位/填充/聚焦/提交、console 0 error |

## UNVERIFIED（判据无法在本环境覆盖，如实标注）

1. **A2 浏览器缩放 DPR 路径**：playwright MCP 环境无法改变 devicePixelRatio（CDP `newCDPSession` 被禁、Ctrl+缩放无效，dpr 恒 1）。代码路径（themeWatcher window resize → dpr 变化 → relayout → syncCanvasSize 直乘 → setTransform）中 dpr 参数下的绘制正确性已由 G2-a 自检覆盖，dpr>1 的端到端（canvas.width/clientWidth ≈ 1.5）留验证阶段或人工浏览器缩放复核。
2. **img onload → invalidateCell rAF 异步端到端**（G1-c/G2-a 遗留沿用）：自检 runChecks 同步约束覆盖到窗口校验同步返回值，真实图片加载联动重绘留 S3。
3. **A3「滚动流畅（人工）」与 A7「与 DOM 版 table 并排人工比对一次」**：属人工判据，本步骤未执行，留 S3。

## 遗留

1. **自检 img 用例重复执行必 fail 1 条**（非本轮引入，G1-c 已知时序特性）：data URI 首次加载后进 getImageEntry 模块级缓存，重跑自检时「加载前 loading」断言读到 loaded。本 session 首次挂载两次实测 77/77 全绿；S3 验证时以首挂载结果为准，或后续把该断言改为「loading 或 loaded 皆合法 + 独立 src」。
2. demo watch 进程（:3000）保持后台运行，期间多次自动增量构建均成功。
3. 浏览器 zoom 相关 console warning（Canvas2D willReadFrequently）为自检 getImageData 读回所致，生产绘制路径无 readback，不处理。
4. S3 验证阶段可复用本页 `window.__canvasTable.getCellRect(row, col)`（页面坐标 + 视口坐标）做坐标级交互。
