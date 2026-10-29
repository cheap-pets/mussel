# 设计评审记录 — table-ex（第 3 轮）

VERDICT: REVISE

## 上轮问题核对（第 3 轮）

逐条核对 `03-review-2.md`（blocker 2 / major 10 / minor 10）。`03-human-1.md` 未提出 review-2 之外的新意见；`decisions.md` 仅流程开关，无技术约束。

| 条目 | 状态 | 核对 |
|------|------|------|
| B1 enum mappings(Object) 误传 MuSelect.options(Array) | 已解决 | `resolveSelectOptions`（`02-design.md:432-445`）含显式 options 优先、排除 `default`、`{ value, label }` 转换；`option.vue:9` `label ?? value`、`select.js:35-39` `defaultComponent: 'mu-option'` 证实形状可用，`isObject` 在 `src/utils/type.js:42`；G2-c（`:621`）与 A6（`:603`）补断言 |
| B2 `__sticky` 首子断言与 scrollbar 注入 tracks 冲突 | 已解决 | 骨架补 `.mu-scrollbar__tracks`（`:161-163`），A2 断言改 `[tracks, __sticky, __spacer]`（`:599`），风险表同步（`:582`）；`scrollbar.js:105` `insertBefore(tracks, el.firstChild)` 核对属实 |
| M1 重绘触发遗漏 `columns/headerChecked/recordsOffset/placeholder/keyField` | 已解决 | watch 逐项补齐（`:230-231`、`:276`），A1 测试补 columns/headerChecked（`:598`） |
| M2 尺寸/主题变化未重算 sticky/spacer/可视窗口 | 已解决 | `relayout()` 五步与统一触发点（`:210-232`），A2/A7 断言同步（`:599`、`:604`） |
| M3 demo 夹具未列入改动清单与 G0 | 部分解决 | 已补空态/尺寸手柄/fixedLeftColumns/editable/validate/recordsVersion/主题覆盖/scrollToRecord/refreshTheme（`:54`、`:615`），但仍缺本表 A1/A3/A5/A6 新断言依赖的入口，见 Major 1 |
| M4 未断言"仅绘制可视区行" | 已解决 | `lastPaint`（`:109`、`:292`），A3 断言（`:600`），G2-a 判据（`:619`） |
| M5 自定义类型/格式化/mapping/tag-link 选项未落点 | 已解决 | A4 改复用 `resolveColumnType + compile/render`（`:142-152`），不支持子集入 A9 #12（`:562`）与备选 #11（`:576`）；残留意项见 Minor 2 |
| M6 宽度求解缺 minWidth/maxWidth；拖拽后重分配未定义 | 已解决 | `solveWidths` 与调用时机（`:252-265`），备选 #10（`:575`），A4/A5 断言（`:601-602`）；拖拽结果存放未定义，见 Minor 3 |
| M7 日期/下拉面板 Teleport 使 blur 兜底误提交 | **未解决** | ③ 判据 `activeElement.closest('.mu-dropdown-panel')`（`:405-410`）对 `mu-icon-button`（无 href 的 `<a>`）不成立，A6 用例（`:603`）仍会失败，见 Blocker 1 |
| M8 check 点击未续行单元格点击流程 | 已解决 | A1（`:94`）与 A5（`:326-328`）已改为续行，A1/A4 断言（`:598`、`:601`） |
| M9 拖拽 move 脏区留残影 | 已解决 | 左界改列左缘（`:275`、`:319`），A5 采样断言（`:602`），G2-b 判据（`:620`） |
| M10 编辑器控件 200×32 不随单元格填充 | 已解决 | scss 覆盖（`:376-388`），A6 断言（`:603`）；`input.scss:12-13` 与全局 `border-box`（`root.scss:167`）核对通过 |
| m1 check 表头 header-click 措辞 | 已解决 | `:93`、`:322`、A1 断言（`:598`） |
| m2 spacer 负高未 clamp | 已解决 | `max(0, …)`（`:172`、`:219`），A3 断言（`:600`） |
| m3 switch 容器 keydown 未展示 | 已解决 | `:342-354` |
| m4 底部投影硬编码 rgba | 已解决 | 改用 `--mu-shadow-float`（`:529`）；变量存在（`src/styles/root.scss:65`） |
| m5 img 跨域污染 canvas | 已解决 | `crossOrigin`（`:147`、`:278`）、风险行（`:588`） |
| m6 G1-a theme 自检依赖 S1 变量 | 已解决 | 内联声明（`:616`） |
| m7 S1 先于 S2 全局注册 | 已解决 | 本地 import（`:622`、`:677`）；路径层级核对正确 |
| m8 排序循环断言不一致 | 已解决 | `asc → desc → ''`（`:602`），与 `:99`、`:323` 一致 |
| m9 column.value 未 ensureFn | 已解决 | `_text/_value` 均 ensureFn（`:142`），A4 用例（`:601`）、A8（`:541`） |
| m10 空态仍写 placeholder | 已解决 | `:530` 改为 `empty` 插槽 / `emptyText` |

## 检查项结论（每项一行）

1. **覆盖**：不通过 — A1–A9 均有章节与测试行，但 A6 日期面板用例必失败（Blocker 1）；A1/A3/A5/A6 断言依赖的夹具未入 G0（Major 1）；canvas 交互断言的 Playwright 手段不可执行（Major 2）。
2. **事实一致**：不通过 — 日期工具栏 prev/next 为 `mu-icon-button`（无 href 的 `<a>`，不可聚焦），与 `:409` "焦点落在面板内"矛盾；其余引用（`scrollbar.js:105`、`root.scss:127-132`/`:141`、`table.scss:155`、`check.js:16`、`record-number.js:4`、`combo-wrapper.vue:4,12`、`dropdown-panel.vue:2,8`、`select.js:5`）逐项核对属实。
3. **约定一致**：通过 — demo 目录/URL 符合 catalog/vite 规则（`demo/src/catalog.js:97`、`vite.demo.config.js:64`）；BEM、`Mu` 前缀、`<script setup>`、纯 JS、UMD/外部 Vue、文档延后均符合 AGENTS.md。
4. **影响面**：不通过 — 日期面板失焦（Blocker 1）；测试夹具缺口（Major 1）；拖拽宽度无持久化落点（Minor 3）。
5. **可实施**：不通过 — 日期面板防误提交机制不成立；拖拽宽度存放未定义；canvas 交互测试手段不可执行。
6. **风险与回滚**：不通过 — 风险表 `:584` 的日期面板对策基于错误前提；其余风险（sticky/blur 时序/probe/相对色/img 异步/跨域/200 列）与回滚方案成立。
7. **范围**：通过 — 新增 `emptyText/recordsVersion/editable/resizable/editor/update:order-by/column-resize/getLayoutInfo/scrollToRecord/refreshTheme/empty` 均有验收依据；文档同步 S4 独立且需用户确认。
8. **并行组**：通过 — G1-a/b/c 与 G2-a/b/c 文件集合两两不相交；G0 为共同前置；`main-view.vue`（G0→S1）、`src/components/index.js`（S2）在串行步骤；`self-checks/index.js` 仅 G0 创建。

## 验收标准逐条（00-task）

| # | 结论 | 说明 |
|---|------|------|
| A1 完整 API + 对照 | 部分 | props/events/方法/插槽齐全；columns 替换、headerChecked、orderBy、check 点击、refreshTheme 的断言缺夹具（Major 1）；表头/单元格点击缺坐标级手段（Major 2） |
| A2 canvas 架构 | 通过 | 单 canvas 分区、DOM 边界、DPR 直乘、relayout 响应与 DOM 顺序断言齐全 |
| A3 虚拟滚动 | 部分 | 窗口/rAF/脏区/lastPaint 齐全；`viewH/viewW` 未定义，断言口径可差 1 行（Minor 1） |
| A4 列定义结构/映射 | 部分 | 取值链（含 value ensureFn）与自定义类型已补齐；`multiline/lineClamp` 的 items 落地与"单行省略"矛盾（Minor 2）；并排对照的 MuTable 夹具缺失（Major 1） |
| A5 调宽与排序 | 部分 | 设计完整；`browser_drag` 无法命中 4px 列缘/拖拽中采样（Major 2）；拖拽宽度存放未定义（Minor 3）；resizable 与 orderBy 夹具缺失（Major 1） |
| A6 单元格编辑 | 不通过 | enum 接线与尺寸已修；日期面板 prev/next 点击触发 blur 兜底关闭编辑器（Blocker 1）；其余用例可执行 |
| A7 样式与主题 | 部分 | 探针/观察/规格齐全；并排 MuTable 参照缺失（Major 1） |
| A8 文件结构 | 通过 | 目录、模块职责、改动清单与步骤一致 |
| A9 范围边界 | 通过 | 12 条边界清晰，含 #12 视觉子集 |

## 问题清单

### Blocker

[blocker] `02-design.md:405-412`（另见 `:409`、`:603`、风险表 `:584`） — 日期面板月份前后切换的防误提交判据不成立：blur 兜底第 ③ 条依赖 `document.activeElement?.closest('.mu-dropdown-panel')`，但日期工具栏的 prev/next 是 `mu-icon-button`，渲染为无 `href`/`tabindex` 的 `<a>`，点击不可聚焦；点击后 input 先 blur、activeElement 落回 `body`，③ 为假 → `setTimeout 0` 提交并关闭编辑器，A6 用例"切换月份后编辑器不关闭、仍可选日期"必失败。 — 证据：`src/components/button/icon-button.vue:2-9`（`<a class="mu-button mu-icon mu-icon-button" …>`，无 href/tabindex）；`src/components/form/date-input.vue:20-21`（prev/next 用 `mu-icon-button`）、`:123-124`（`date` 类型渲染该工具栏）；`src/components/form/input.js:65`（blur 转发）；`src/components/form/combo-wrapper.vue:12`（内部 input）；设计 `:405-410`。 — 建议：编辑期间在 editor 侧记录 window 级 pointerdown 目标（或把 Teleport 面板元素注册给 editor），blur 兜底改为"activeElement 在面板内 **或** 最近一次 pointerdown 目标在面板内"；同步修正风险表 `:584`，并补 date 面板 prev/next 的自检/用例。

### Major

[major] `02-design.md:54`、`:615`（G0 夹具清单）与测试 `:598`、`:600`、`:601`、`:602`、`:603`、`:604` — G0 仍缺新断言依赖的夹具/入口：① columns 引用替换控件（A1）；② `headerChecked` 受控绑定（A1 表头 ✓ 图形变化）；③ `orderBy` 受控绑定（A5 排序图标方向）；④ `update:cell-value` 处理器就地改 record（A3/A6 像素更新）；⑤ 表格 `resizable` 开启（A5 拖拽）；⑥ 同页 DOM 版 `mu-table` 参照（A4/A7 并排比对）。S3 无法按表执行。 — 证据：`:54`/`:615` 清单逐项无上述入口；`:598` 要求"替换 columns 数组后…✓ 立即变化"；`:600`/`:603` 要求"demo 事件处理器内就地改 record"；`:601`/`:604` 要求"DOM 版 table 并排比对"；`:602` 要求图标方向与拖拽。 — 建议：把 6 项写入改动清单 demo 行与 G0 任务/判据（`v-model:header-checked`、`v-model:order-by`、`resizable`、columns 替换按钮、就地改 record 的处理函数、参照 MuTable）。

[major] `02-design.md:598`、`:602`、`:603` — canvas 交互断言指定的 Playwright 手段不可执行：`browser_click`/`browser_drag`/`browser_hover` 只接受元素引用并按元素中心操作，canvas 是单个元素，无法命中表头某列、指定单元格或列右缘 4px 手柄，也无法在拖拽中途采样像素。A1 的"点击表头/单元格"、A5 的"拖非固定列缘 ± / 拖拽中像素采样 / 固定列缘 cursor"、A6 的"dblclick 文本格"按现手段无法验证。 — 证据：设计 `:598`、`:602`、`:603`；playwright MCP 的 `browser_click`/`browser_drag` 参数为 element ref（无坐标入参），`browser_drag` 从起点元素中心拖到终点元素中心。 — 建议：在 demo 暴露坐标辅助（如 `window.__tableEx.getCellRect(row, col)`，或基于 `getLayoutInfo()` 的 `colWidths/rowHeight/headHeight` + `scrollTop/scrollLeft` 计算），交互与中途采样改用 `browser_run_code_unsafe` 的 `page.mouse.move/down/up`；或给 demo 加调试用 DOM 手柄（列缘绝对定位标记），测试按元素引用拖拽。

### Minor

[minor] `02-design.md:244-246`（断言见 `:600`） — 窗口公式使用未定义的 `viewH`/`viewW`；若实现取容器高度（含表头）作为 `viewH`，`lastPaint.rowCount` 可比断言阈值 `ceil(视口高/行高)+OVERSCAN` 多 1 行而失败。 — 建议：定义 `viewH = clientHeight − headHeight`、`viewW = clientWidth − fixedWidth`，断言按同一口径书写。

[minor] `02-design.md:148`、`:152`、`:562` — multiline 落地自相矛盾：差异③ 称"单行省略"，但 `TextColumn` 在 `lineClamp > 1` 时返回 `items: [{ is: 'div', text }]`（`src/components/table/column-types/text.js:19-32`），而 items 落地只支持 text/check/link/tag/img，`div` 被忽略 → 单元格空白。 — 建议：对未识别 `is` 且 `item.text != null` 的条目按文本绘制；或显式声明多行列空白并同步差异③ / A9 #4。

[minor] `02-design.md:252-265`、`:318-320` — 拖拽后的列宽没有落点定义：`solveWidths` 从列定义的 `width` 取定宽列，A5 up 只说"拖拽列显式定宽"后重跑求解，未定义拖拽结果存放位置；若直接写原列定义的 `width` 会改 props。 — 建议：定义 `widthOverrides`（按列 key）并由 `solveWidths` 优先读取，同时说明 columns 引用替换时是否清空。

[minor] `02-design.md:438-441` — 枚举编辑值类型变化：`Object.entries(column.mappings)` 产生字符串键，record 原值为数字时，提交 `update:cell-value` 会把数字改为字符串，与 A4"既有列定义原样传入即可得到与现有 table 一致"的意图不符。 — 建议：写明枚举编辑值为 mapping key（字符串），或提交时按原值类型回写。

[minor] `02-design.md:321` — 拖拽误触抑制靠 click 消费 flag：拖拽在 canvas 外释放时不会产生 canvas click，flag 残留会吞掉下一次表头点击。 — 建议：pointerup 后延时清除 flag（或按 pointerup 坐标判定是否视为拖拽）。

---

本轮结论：review-2 的 22 项中 20 项已解决；M3 仍有夹具缺口，M7 的修复对 `mu-icon-button` 失效（A6 日期用例必失败）。另有 canvas 交互测试手段不可执行与 5 个 minor。建议按 Blocker 1、Major 1–2、Minor 1–5 修订后再复核。
