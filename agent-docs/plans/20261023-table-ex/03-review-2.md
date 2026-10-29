# 设计评审记录 — table-ex（第 2 轮）

VERDICT: REVISE

## 上轮问题核对（第 2 轮起）

| 条目 | 状态 | 核对 |
|------|------|------|
| B1 sticky/spacer 结构与高度口径 | 已解决（主体），但 A2 首子断言与新发现冲突 | `__sticky` 置前、`__spacer` 后置，spacer 高 = 内容总高 − 视口高（`02-design.md:154-163`），A3 断言同口径（`:514`）。但 A2 的“`__sticky` 是 `__scroll` 第一个子元素”与 `v-mu-scrollbar` 注入 `.mu-scrollbar__tracks` 冲突，见 Blocker 2。 |
| B2 demo 路径与 catalog/vite 规则 | 已解决 | 目录/URL 已改 `demo/src/data/table-ex/`、`/data/table-ex/`（`02-design.md:54`、`:508`、`:529`）；`vite.demo.config.js:57-80` 要求 `page.path` 以分类 `data/` 开头，`demo/src/catalog.js` 的 `data` 分类存在，核对通过。 |
| B3 编辑器事件隔离 / blur 吞下拉点击 | 部分解决 | `__editor` 拦截 pointerdown/click/dblclick，画布 pointerdown 先同步提交，分类型提交矩阵（`02-design.md:314-346`）覆盖了“点下拉项”的时序；但 Teleport 的日期面板月份切换仍触发 blur 兜底提交（Major 7）。 |
| B4 records 就地变更无重绘 | 已解决（records 范围） | `recordsVersion`（`:85`）、emit 后 nextTick 行重绘（`:233`）、引用 watch（`:239-245`）已形成三条通道；但 `columns`/`headerChecked` 等渲染 props 仍未加重绘触发（Major 1）。 |
| M1 placeholder 语义 | 已解决 | `placeholder` 恢复为空单元格占位（`:83`、`:115`），空态改用 `emptyText`/`empty`（`:84`）。但 A7 视觉规格的空态行仍写“placeholder/empty 插槽”（`:449`），与 M1 结论矛盾（Minor 10）。 |
| M2 测试依赖未暴露接口/调试开关 | 部分解决 | `getLayoutInfo()`（`:109`）、事件日志/自检/重绘计数面板（`:54`、`:529`）已加入；但 `refreshTheme()` 仍无验证（M2 回应称经 A7 验证，`:554`，实际 A7 `:518` 无调用），方法调用入口与多数测试夹具未列入 demo 任务（Major 3）。 |
| M3 G1/G2 依赖后置 demo | 基本解决 | G0 先行 + `self-checks`（`:525-536`），G1/G2 文件集合不相交并各自带自检；但 G1-a 的 theme 自检依赖的 `--row-height` 等局部变量在 S1 的 `table-ex.scss` 才出现（Minor 6），S1 的 demo 注册时序（Minor 7）。 |
| M4 MuSwitch 无 focus/blur/keydown | 已解决（文字/矩阵），模板待补 | `__editor` 容器 `tabindex=-1`、打开聚焦、Esc 取消、值变化提交（`:337-343`、`:364`）；但 A6 模板片段未展示容器级 `keydown`，只写“esc 挂在上方容器”（Minor 3）。 |
| M5 cell-painters 未覆盖 text/rec_no/check disabled | 已解决（指定项） | 取值链、`rec_no` 的 `render({ recordNumber })`、check `disabled` 已补齐（`:142`、`:460`）；A4 “完全兼容”的自定义类型/格式化/mapping/tag-link 仍未覆盖（Major 5）。 |
| m1 fontFamily 误用 readVar | 已解决 | `readFont(name)`（`:385-387`），快照 `fontFamily: readFont('--mu-font-sans')`（`:406`）。 |
| m2 MutationObserver 未观察组件根 | 已解决 | `roots = new Set([closest('.mu-root') || documentElement, componentRootEl])`，两者均 observe（`:419-428`）。 |
| m3 dpr 跨屏迁移不更新 | 已解决 | 新增 window `resize` 仅重读 devicePixelRatio（`:204`）。 |
| m4 单元格字号应继承 | 已解决 | `readInheritedFontSize()`（`:388-390`）用于快照（`:405`）。 |
| m5 header-click 应对所有表头点击 | 已解决（措辞过度） | 所有表头点击发 `header-click`（`:93`、`:280`）；但现有 check 表头有 `@click.stop`（`src/components/table/table.vue:25`），“所有”不成立（Minor 1）。 |
| m6 固定列调宽策略 | 已解决 | 命中列或左邻列属于固定列区域即返回 -1（`:264-267`），A9 #6 已写（`:475`）。 |

无额外人工意见文件；`decisions.md` 仅两条流程开关，无与技术方案冲突。

## 检查项结论（每项一行）

1. **覆盖**：不通过 — A1–A9 均有对应章节，但 A1 的 `refreshTheme` 无验证、A2 的 DOM 首子断言必失败、A3 未断言“仅绘制可视区行”、A6 的 enum/date 用例受接线缺陷影响；测试计划依赖的 demo 夹具未列入改动清单与 G0（Blocker 1–2，Major 3、4、7、10）。
2. **事实一致**：不通过 — `.mu-scrollbar__tracks` 作为首子注入（`src/components/scrollbar/scrollbar.js:105`）；check 表头 `@click.stop`（`src/components/table/table.vue:25`）；`mappings` 为 Object 而 `MuSelect.options` 为 Array（`src/components/form/select.js:5`、`src/components/list/list-items.js:60`）；日期面板 Teleport（`src/components/dropdown/dropdown-panel.vue:2`）；`resolveColumnType` 支持自定义对象（`src/components/table/column-types/index.js:32-34`）；底部投影引用 `table.scss:155` 的硬编码 rgba。
3. **约定一致**：通过 — demo 目录/URL 已按 catalog/vite 规则修正；BEM、`Mu` 前缀、`<script setup>`、纯 JS、UMD/外部 Vue 均符合。`index.js` 建议仅用命名导出（现有组件目录均为命名导出）。
4. **影响面**：不通过 — `columns`/`headerChecked`/`recordsOffset`/`placeholder`/`keyField` 无 watch（Major 1）；容器尺寸/主题 rowHeight 变化未重算 `__sticky`/spacer/layout（Major 2）；列宽拖拽后未定宽列重分配未定义（Major 6）；日期面板失焦（Major 7）；编辑器控件自身尺寸溢出（Major 10）。
5. **可实施**：不通过 — enum 编辑器 options 接线错误（Blocker 1）；A2 首子断言（Blocker 2）；A6 编辑器尺寸与日期导航；A4 宽度求解缺 min/max；demo 夹具不足（Major 3、6、7、10）。
6. **风险与回滚**：不通过 — 风险表覆盖 sticky/blur 时序/probe/相对色/img 异步/200 列，但缺日期面板 blur、`columns`/`headerChecked` 重绘、尺寸/主题重算、跨域图片 taint；sticky 行的“DOM 顺序断言”依据的断言本身错误。回滚方案本身成立（新增文件 + 2 处共享文件）。
7. **范围**：通过 — 新增 `emptyText`/`recordsVersion`/`editable`/`resizable`/`update:order-by`/`column-resize`/`getLayoutInfo`/`scrollToRecord`/`refreshTheme`/`empty` 均有验收依据；文档同步延后符合 AGENTS.md，S4 独立步骤。
8. **并行组**：通过 — G1-a/b/c 与 G2-a/b/c 文件集合两两不相交，G0 为共同前置；共享文件 `main-view.vue`（G0/S1）、`src/components/index.js`（S2）均在串行步骤；`self-checks/index.js` 仅 G0 创建。

### 验收标准逐条（00-task）

| # | 结论 | 对应章节 / 缺口 |
|---|------|-----------------|
| A1 完整 API + 对照 | 部分 | API 表齐全（props/events/methods/slots）；`refreshTheme` 未验证（Major 3）；`headerChecked` 无重绘（Major 1）；check 点击的 selected/cell-click 语义（Major 8）；header check 表头 `header-click` 措辞（Minor 1）。 |
| A2 canvas 架构 | 部分 | 图层/DOM 边界/DPR 有；A2 DOM 首子断言与 scrollbar 注入冲突（Blocker 2）；容器尺寸/主题变化未重算 spacer（Major 2）。 |
| A3 虚拟滚动 | 部分 | 窗口计算/滚动 rAF/脏区有；未断言“仅绘制可视区行”（Major 4）；spacer 负高未 clamp（Minor 2）。 |
| A4 列定义结构/映射 | 部分 | 字段与取值链有；自定义类型/格式化/mapping 样式/tag-link 选项未落点（Major 5）；minWidth/maxWidth 未进入分配公式（Major 6）；`column.value` 未写 ensureFn（Minor 9）。 |
| A5 列头调宽/排序 | 部分 | 命中/光标/事件序列/固定列排除有；resize 脏区右侧起算会留残影（Major 9）；列宽后未定宽列重排未定义（Major 6）；固定列用例的 demo 夹具未列（Major 3）。 |
| A6 单元格编辑 | 部分 | 浮层/生命周期/提交矩阵/只读有；enum options 接线错误（Blocker 1）；日期面板导航触发 blur 兜底（Major 7）；编辑器控件 200×32 不随单元格填充（Major 10）；check 点击（Major 8）；switch 容器 keydown 模板（Minor 3）。 |
| A7 样式与主题 | 部分 | 探针/变量/暗色观察/视觉规格齐全；`--row-height` 覆盖未重算 layout/spacer（Major 2）；底部投影硬编码（Minor 4）；空态仍写 placeholder（Minor 10）。 |
| A8 文件结构 | 通过 | `table-ex.vue/.scss/index.js/theme.js/layout.js/cell-painters.js/painter.js/editor.js/interactions.js` 与改动清单、步骤一致；`index.js` 用命名导出即可。 |
| A9 范围边界 | 部分 | 11 条边界清晰；但 tag-link 的视觉选项、enum mapping 样式、自定义列类型未列入（与 Major 5 同源）。 |

## 问题清单

### Blocker

[blocker] `02-design.md:364`、`:517`（另见 `:135`） — enum 编辑器把 `column.mappings`（Object）直接作为 `MuSelect.options`（Array）传入，下拉项为空，A6 的 enum 用例无法通过。 — 证据：`src/components/form/select.js:5` `options: Array`；`src/components/list/list-items.js:60` 对非数组直接 `return`；`src/components/table/column-types/enum.js:8-16` 说明 mappings 是 Object；`docs-site/components/table.md:262` 标注 `mappings` 为 Object；A6 测试 `02-design.md:517` 要求“enum 列开 MuSelect 点下拉项”。 — 建议：在 editor 解析层把 mappings 转成 `[{ value, label: isObject(v) ? v.text : v }]`；或明确要求 `editor.props.options`，并在无 options 时将编辑器置为不可用，同时补 enum 自检。

[blocker] `02-design.md:154`、`:163`、`:513` — 设计断言 `__sticky` 是 `__scroll` 的第一个子元素，但 `v-mu-scrollbar` 的 `attach` 会把 `.mu-scrollbar__tracks` 插入到 `firstChild` 之前，实际顺序是 `[.mu-scrollbar__tracks, __sticky, __spacer]`；A2 的 DOM 顺序断言必失败，S3 无法通过。 — 证据：`src/components/scrollbar/scrollbar.js:105` `el.insertBefore(tracks, el.firstChild)`；`src/components/scrollbar/scrollbar.scss:19-31` tracks 为 `position: sticky !important`、0 尺寸；设计 `:153` 在 `__scroll` 上使用 `v-mu-scrollbar`；A2 测试 `:513` 断言“`__sticky` 是 `__scroll` 第一个子元素”。（几何本身不受影响：tracks 高 0，`__sticky` 静态位置仍在内容顶端。） — 建议：DOM 骨架补出注入的 tracks；A2 断言改为“`__sticky` 是除 `.mu-scrollbar__tracks` 外的第一个子元素”或“`__sticky` 在 `__spacer` 之前”，并同步风险表 `:498` 的 DOM 顺序断言。

### Major

[major] `02-design.md:235`（另见 `:73`、`:76`、`:78`、`:83`） — 重绘触发清单遗漏 `columns`、`headerChecked`（以及 `recordsOffset`、`placeholder`、`keyField`）；父级替换 `columns` 或受控更新 `headerChecked` 后画布不重排/不重绘。 — 证据：现有 table 的 `internalColumns` 是 computed，随 `columns`/`placeholder` 变化（`src/components/table/table.vue:159-197`）；表头 ✓ 读 `headerChecked[col.field]`（`table.vue:22-25`）；demo 的 `onHeaderChecked` 更新 `headerChecked`（`demo/src/data/table-advanced/main-view.vue:188-200`）；设计只列 `gridlines / hoverMode / striped / fixedLeftColumns / orderBy / selectedRecord / selectedRecordKey / recordsVersion`。 — 建议：watch `columns`（引用变化 + 列字段）、`headerChecked`、`recordsOffset`、`placeholder`、`keyField`，按需 relayout/整幅重绘；A1 测试补“点击表头 check 后 ✓ 立即变化”与“替换 columns 后列头/列宽更新”。

[major] `02-design.md:203-204`、`:160-163`、`:424` — 尺寸/主题变化只更新 canvas 物理尺寸与未定宽列分配；未重算 `__sticky` 尺寸、spacer 高度/宽度与可视窗口。容器高度变化或 `--row-height` 覆盖后，滚动范围与行定位不一致。 — 证据：spacer 高 = `内容总高 − 容器视口高`（`:160-163`）；A2 尺寸响应只写“重读 clientWidth/Height → 更新 canvas 物理尺寸与未定宽列分配 → 整幅重绘”（`:203`）；A7 覆盖 `--row-height` 的用例（`:518`）依赖该重算；A7 主题刷新只写“重读 snapshot → 整幅重绘”（`:424`）。 — 建议：抽出 `relayout()`（sticky 尺寸、spacer 宽高、列前缀和、rowHeight/headHeight），在 sizechange、window resize、theme 刷新、records/columns 变化、列宽 up 后统一调用；A2 补容器高度变化后的 spacer/scrollHeight 断言。

[major] `02-design.md:54`、`:529`、`:512-518` — 测试计划的多数断言依赖 demo 控件/夹具，但 demo 任务未列：空态/`empty` 插槽/`emptyText`、容器尺寸手柄、`fixedLeftColumns`、`editable=false` 变体、validate 列、`recordsVersion` 异步按钮、`--row-height`/根字号覆盖、`mu-dark` 挂组件根变体、`scrollToRecord`/`refreshTheme` 调用入口。S3 无法按表执行。 — 证据：A1 `:512` 要 `#empty` 插槽与方法；A2 `:513` 要右侧手柄；A4 `:515` 要 `recordsOffset`/check disabled；A5 `:516` 要固定列；A6 `:517` 要 validate/editable=false/滚动；A7 `:518` 要变体与覆盖；G0 `:529` 只列静态结构/10 万行/日志/面板。`refreshTheme` 在 M2 回应 `:554` 声称经 A7 验证，但 A7 `:518` 无该调用。 — 建议：在 G0 的 demo 文件任务中逐项列出上述夹具与调试入口（含 `window.__tableEx` 或按钮），并把 `refreshTheme` 用例写入 A1/A7；否则 S3 不可执行。

[major] `02-design.md:514`、`:223` — 验收 #3 要求“仅绘制可视区行，禁止一次绘制全部行”，A3 测试只验 spacer 高度、人工流畅与重绘计数，未断言每帧绘制行数/列数；实现画全量行也可能通过。 — 证据：`00-task.md:18`；设计 A3 声称 rAF 整幅约 20-30 行（`:223`）；A3 测试 `:514`；调试面板仅“重绘计数”（`:54`）。 — 建议：painter 暴露 `lastPaint` 统计（`rowStart/rowEnd/绘制行数/耗时`）到 `getLayoutInfo()` 或调试面板；A3 断言绘制行数 ≤ 可视行 + `OVERSCAN`。

[major] `02-design.md:142`、`:460` — A4 声明“完全兼容”，但 `cell-painters` 只列内置类型，未定义自定义列类型对象（`resolveColumnType` 支持对象/函数）与 `compile/render` 的复用；`number/currency/date/datetime/enum/bool` 的格式化、enum mapping 的 `class/style`、tag/link 的 `max/pill/flat/color/danger/disabled` 均无落点，也未列入差异/范围边界。 — 证据：`src/components/table/column-types/index.js:32-34` 返回自定义对象或函数；`src/components/table/table.vue:178` 使用 `type.compile ? type.compile(el) : (type.render || type)`；`enum.js:8-16` 返回 `{ text, class, style, ... }`；`tag.js`/`link.js` 的 options；A9 #4（`:473`）只覆盖列级 `class/style`/`multiline`/`lineClamp`。 — 建议：`cell-painters` 明确“先调用现有 `compile/render` 取 `text/items`（内置 + 自定义），canvas 只做文本/图标落地”；不支持的项（link/tag 颜色/扁平/省略、mapping 样式、自定义类型）逐条写入 A9，并补对应自检或从“完全兼容”降级。

[major] `02-design.md:143`、`:276`、`:515` — 未定宽列分配公式只有 80px 下限，未处理 `minWidth/maxWidth`；A4 测试却断言“minWidth 收敛”。列宽拖拽后也未说明未定宽列是否重分配（A5 `:278` 只更新前缀和/spacer）。 — 证据：公式 `:143`；resize clamp `col.minWidth ?? 40`（`:276`）；A4 测试 `:515`；`src/components/table/table.vue:176` 将 `minWidth/maxWidth` 传给 `<col>`；A2 只在容器 resize 时“更新未定宽列分配”（`:203`）。 — 建议：定义统一宽度求解：先固定列，再对未定宽列按 min/max clamp 并迭代分配剩余宽；列宽 up 后重跑该求解（或明确不重排、允许留白/横向滚动）；A4/A5 各补断言。

[major] `02-design.md:314-317`、`:337-346` — 编辑浮层的拦截只覆盖 `__editor` 子树；`MuDateInput`/`MuSelect` 的下拉面板 Teleport 到 body。日期面板的月份切换按钮点击会使内部 input 失焦，值未变 → 0ms blur 兜底提交并关闭编辑器，月份导航不可用；下拉滚动条同理。 — 证据：`src/components/dropdown/dropdown-panel.vue:2` Teleport；`src/components/form/date-input.vue:10-23` 工具栏 `goPrevMonth/goNextMonth`；设计 `:316` 只拦 `__editor` 的 pointerdown/click/dblclick；`:344` 的 blur 兜底判据是“焦点不在 `__editor` 内”；`:341` date 的值变化是唯一即时提交源。 — 建议：blur 兜底需识别下拉面板（把 panel 元素注册到 editor；或改用 `dropdown:hide`/外部 pointerdown 判定，blur 仅作延迟兜底且在 panel 内不提交）；A6 补“日期面板切换月份后仍可继续选择”的用例。

[major] `02-design.md:283-284`、`:96` — check 列点击在现有 table 里会继续冒泡到 `td`，触发选中行与 `cell-click`；设计把 check 点击写成独立分支且 `disabled` 时“忽略”整次点击，A1 又标 `cell-click` “相同”。 — 证据：`src/components/table/column-types/check.js:17-25` 的 click 未 `stopPropagation`；`src/components/table/table-row.vue:11` `td @click="onCellClick(...)"`；`src/components/table/table.vue:344-352` `onCellClick` emit `update:selected-record(-key)` 与 `cell-click`；`src/components/table/column-types/style.scss:29-33` `[disabled]` 仅 `pointer-events: none`，点击仍命中 `td`。 — 建议：check 点击在 emit `update:cell-value` 后继续执行单元格点击流程（选中 + `cell-click`）；`disabled` 仅跳过翻转，仍处理选中/`cell-click`；A1 补“check 点击同时出现 cell-click/selected”的断言。

[major] `02-design.md:234` — 列宽拖拽 move 的脏区从“该列右缘”到视口右端；加宽时新暴露的 `[旧右缘, 新右缘]` 区不在脏区，保留旧像素（下一列内容），拖拽中显示残影。 — 证据：`:234` 明确“该列右缘至视口右端的竖带”；`:276-278` 更新宽度/前缀和后才重绘该带；只有 up 的整幅重绘纠正。 — 建议：脏区左界取 `min(旧右缘, 新右缘)` 或直接取该列左缘；A5 补拖拽中的像素/截图断言（或至少检查重绘区）。

[major] `02-design.md:321-328`、`:517` — `__editor` 只设 `left/top/width/height`，编辑器组件自身 `.mu-input` 固定 `width: 200px` / `height: 32px`，不随单元格宽度/行高填充；浮层会超出单元格，A6 的“`.mu-input` 与单元格重合”断言无法通过，且溢出的输入框会拦截相邻单元格点击。 — 证据：`src/components/form/input.scss:12-13` `width: 200px; height: var(--height)`（`--height: var(--mu-control-height-normal)` = 32px，`src/styles/root.scss:141`）；设计 `:321-328` 无内部尺寸覆盖；A6 测试 `:517` 断言 `.mu-input` 的 `getBoundingClientRect`。 — 建议：`table-ex.scss` 对编辑器内 `.mu-input` 设 `width: 100%; height: 100%`（或按行高垂直居中），必要时 `overflow: hidden`；A6 断言改到 `__editor` 容器或明确检查控件填充。

### Minor

[minor] `02-design.md:93`、`:280` — “所有表头点击均 emit `header-click`”与现有 check 表头 `@click.stop` 不符；check 表头点击是否额外发 `header-click` 未定义。 — 证据：`src/components/table/table.vue:25` 的 `@click.stop`。 — 建议：明确 check 表头点击只发 `update:header-checked`（与现有一致），其余列发 `header-click`；A1 措辞改为“除 check ✓ 外”。

[minor] `02-design.md:160-163` — spacer 高度未 clamp；records 少于视口时 `contentH − viewH` 为负，CSS 忽略该值，“两元素高度相加 = 内容总高”不成立，测试无覆盖。 — 建议：`Math.max(0, ...)` 并补少量行/空 records 用例。

[minor] `02-design.md:298-309` — 模板只展示 `__editor` 的 pointerdown/click/dblclick 拦截，未展示 switch 依赖的容器级 keydown（Esc）；`:337-343` 仅文字说明。 — 建议：模板片段补 `@keydown.esc`（或 `editing.events` 的容器级挂载），避免实现遗漏。

[minor] `02-design.md:448` — 底部投影引用 `table.scss:155` 的硬编码 rgba 阴影，违反任务约束 #2“颜色/间距一律 `--mu-*`”；A7 测试不检查阴影。 — 证据：`src/components/table/table.scss:155-158` 为 `rgba(0, 0, 0, 0.1)`/`0.06` 硬编码。 — 建议：改用 `--mu-shadow-float` 或新增变量；若有意复刻现有硬编码值，在 A9/风险中说明豁免。

[minor] `02-design.md:237`、`:460`、`:516-518` — img 异步绘制未说明跨域/CORS；若 demo 或自检使用跨域图片（现有 table demo 用 dummyimage.com），canvas 被污染，`getImageData` 断言抛 `SecurityError`。 — 证据：`demo/src/data/table/main-view.vue:98-102` 使用 `https://dummyimage.com`；A8 `:460` 支持 img；A5/A6/A7 测试用 `getImageData`。 — 建议：图片设 `crossOrigin = 'anonymous'` 或测试用同源/data URI；在风险表补该风险。

[minor] `02-design.md:530`、`:536` — G1-a 的 theme 自检要读 `--row-height`/`--head-row-height` 等局部变量，但定义这些变量的 `table-ex.scss` 在 S1 才创建；G1-a 在当前顺序下读到 0/无效值。 — 建议：把局部变量声明提前到 G0 的 demo 主题层，或 theme 自检使用测试内联变量；判据写明变量来源。

[minor] `02-design.md:536-537` — S1 的 demo 接入发生在 `src/components/index.js` 注册（S2）之前；demo 的 app 只安装 `src/index.js`，若 `main-view.vue` 使用全局 `<mu-table-ex>` 会解析失败。 — 证据：`demo/src/common/app.js` 的 `install(app)` 来自 `mussel`（`vite.demo.config.js:213` alias 到 `src/index.js`）；`src/components/index.js` 在 S2 才注册新组件。 — 建议：S1 明确 `main-view.vue` 本地 import 组件，或把注册提前到 S1（S2 只剩构建校验）。

[minor] `02-design.md:516` — A5 断言 `update:order-by` 循环“asc→desc→''”，设计 `:99` 的循环是“无→asc→desc→无”；首次点击应发 `asc`，测试措辞与实现不一致。 — 建议：改为连续点击三次的完整断言（`asc`/`desc`/`''`）。

[minor] `02-design.md:142` — `column.value(record)` 的取值链未写 `ensureFn`；现有实现对 `value` 也先 `ensureFn`（`src/components/table/table.vue:170-171`、`table-row.vue:55-56`）。当 `value` 为 String（文档 `docs-site/components/table.md:256` 允许 String|Function）时按设计字面调用会抛错。 — 建议：A4/A8 明确 `text/value` 均 `ensureFn` 化。

[minor] `02-design.md:449` — A7 视觉规格的空态行仍写“`mu-table-ex--empty` + placeholder/empty 插槽”，与 `:83`/`:115`（`placeholder` 仅用于空单元格）矛盾；M1 的修订未同步到该行。 — 建议：改为“`empty` 插槽 / `emptyText`”。

---

本轮结论：设计已修复上轮 4 个 blocker 的主体，但仍存在 2 个会直接导致 A2/A6 验收失败的接线问题（enum options、DOM 首子断言），以及 10 个影响面/测试覆盖 major。建议按 Blocker 1–2、Major 1–10 修订后再复核。
