# 修改规格（用户确认方案 + peer review 修正版）

> 本文件为设计副本（调度者代存的用户确认方案）。implementer 按此实施。
> 行号基于 HEAD 710d515 工作区，改动时以实际代码为准。

## 批① 缺陷修复

### B1 tag 列 dots 误判 — `ex/composables/use-cell-click.js:262`

- 现状：`isCappedDotsItem(item, items, col)` 只判 `items.length > maxItems && item.index === maxItems - 1`，未区分绘制路径。
- 事实链：dots 仅 link/list 列 `drawLinkItems` 产出（`cell-paint/link-items.js:51-52` 溢出时 `slice(0, maxItems - 1)`、`:105` 末位合成 dots）；**tag 列走 `drawItems`（`cell-paint/item-painters.js`）无 maxItems 截断**，溢出走 +n pill（tooltip-only 设计，不改）。tag 条目 >10 时点击第 10 个真实 tag（index 9）被误判 dots，payload 错发 `'...'` 且 `onItemClick` 被跳过（`use-cell-click.js:247-254`）。
- 修复：判定加 `item.kind === 'link'` 门控（list/link 的 canvas 条目 kind 恒 `'link'`，tag 条目 kind `'tag'`），tag 不再进入 dots 分支。
- 断言：`demo/src/data/table-ex/self-checks/` 补用例——若把判定提取为可测纯函数则补 interactions self-check；否则用 demo 页 tagsOverflow 夹具（`main-view.vue:772` 列宽 150，需加宽至能显示 ≥10 条）playwright 点击第 10 个 tag 断言 payload。

### B2 resolveEditorProps 双口径 — `ex/editing/editor-resolve.js:152` + `ex/editing/editor.js:176-187`

- 现状：`editor.js:178` 带 `{ rawValue, record }` 解析 `editorType`；`:187` 调 `resolveEditorProps(column)`，其内部 `:154` 再调 `resolveEditorType(column)` **不带 record** → `resolveTextLikeEditorType`（`:42-47`）以 `undefined` record 调 `column._resolveMaxLines(undefined)`，用户 `lineClamp: record => ...` 回调收到 undefined（解引用 record 时点击直接抛 TypeError）。
- 修复：`resolveEditorProps(column, { editorType, record })` 接收外部已算出的 `editorType`（与可选 `record`），`editor.js` 调用点传入 `:178` 已算值，消除二次求值与双口径。原无第二参调用形态（raw column）保持向后兼容。
- 断言：`demo/src/data/table-ex/self-checks/editor.js` 现有 `resolveEditorProps` 用例只覆盖 raw column（约 :498-538），补 prepared multiline 列 + 函数形态 `lineClamp` 用例：断言不抛错、回调收到真实 record、`editorType` 一致。

### B3 base 空列崩溃 — `base/table.vue:212`

- 现状：`columns.at(-1)._ctrlClass.push('last-col')`，`columns` 省略（默认 `[]`）或传空数组时 TypeError。文档 `docs/quick-reference_components.md:1690` 默认值写"—"（省略合法）。
- 修复：`columns.at(-1)?._ctrlClass.push('last-col')` 一行守卫。
- 断言：`demo/src/data/table/` 增空列用例（`:columns="[]"`）或最小挂载；若新增 demo 页须同步 `demo/README.md` 地址清单（项目约定）——优先在现有 base table demo 页内加空列场景，避免新页。

### B4 pointercancel 缺失 — `ex/composables/use-column-resize.js:61-118`

- 现状：`startResize` 只挂 `pointermove`/`pointerup`；触屏/系统手势接管后监听器残留、`widthOverrides` 停中间值、clickGuard 保持 armed。
- 修复：对齐项目统一语义（**cancel ≈ up，按当前宽度提交**）：`pointercancel` 挂到与 `pointerup` 相同的处理器 + 对应 `removeEventListener`。参照 `src/components/modal/resize-shared.js:21-29`。
- 断言：拖拽开始后向 window 派发 `pointercancel`，断言参考线清除、监听释放、宽度定格当前值（demo 页 playwright 或 self-checks，视现有设施取最低成本路径）。

## 批② 同源收敛（T3，行为不变）

### C1 取值链单一事实源

- 六处副本（实测行号）：`ex/geometry/row-geometry.js:46-48`、`ex/spans/spans-auto.js:10-12`、`ex/cell-paint/cell-content.js:123`、`ex/composables/use-cell-click.js:218` 与 `:285-287`、`ex/editing/editor.js:176-177`。
- 模式：`col._value?.(record) ?? (col.field != null ? record?.[col.field] : undefined)`（各处细微差异，收敛到最宽防御形态；行为等价性以调用点逐一核对）。
- 修复：`src/components/table/utils.js` 新增导出 `readCellValue(col, record)`（零依赖纯函数，该文件已被 base/ex 共引不引环）；六处改引。
- **红线**：不吞 `_mapText`（row-geometry 取 `.text`、spans-auto 取映射对象，各自调用点自持）；不改 spans 分组键语义；row-geometry 为估高热路径，helper 保持纯函数无测量。

### C4 orderBy 解析单一事实源

- 三处：`base/table.vue:151-152`、`ex/table-paint/paint-utils.js:97-102`（已封装 `sortDirectionOf`）、`ex/interaction/click-resolve.js:17-22`。
- 修复：`utils.js` 新增 `parseOrderBy(orderBy)` → `{ field, direction }`；三处改引（base 的 `sortDirection` computed、ex 的 `sortDirectionOf` 内部、`resolveOrderByNext`）。
- **红线**：保留"只替换第一个冒号"语义（`replace(':', ' ')` 而非 `split(':')`）；`null`/`undefined` 入参行为不变。
- 断言：`demo/src/data/table-ex/self-checks/interactions.js` 已有 `resolveOrderByNext` 用例（约 :204-212），补 parser 断言（含 `null`、`'a:b:c'` 异常值）。

## 不做清单（红线，勿顺手改）

- C2 条目包装归一（用户裁定不做）
- C3 date/datetime/number/currency 四类型合并（peer 裁决过度抽象，剔除）
- C5 maxLines 读取三式：第三处为 raw column 防御兼容**非缺陷**，不统一、不删除；仅允许在 `editor-resolve.js:43-45` 补一行注释说明 raw 兼容分支
- tag +n pill tooltip-only 协议（知识库既定设计）
- 结构拆分/搬移、host 袋改造、fenwick.rebuild（均为已登记已知项）

## 全局约束

- 纯 JS 无 TS；Vue 3 `<script setup>`；`--mu-*` 变量
- 改后不 commit（项目约定，用户未要求提交）
- `agent-docs/knowledge/project/table-ex-structure-map.md` 漂移同步由调度者收尾处理，implementer 不改 agent-docs
- eslint 告警基线口径：零新增（历史遗留不清零）
