VERDICT: AMENDED

## 检查项结论

1. **覆盖**：7 条验收标准均有设计 + 可执行手段；本轮新增改动文件（`base/table-row.vue`）已同步进改动清单、测试计划与实施步骤；无自动化测试文件符合项目「无测试框架」现状（AGENTS.md）。
2. **事实一致**：抽查路径/符号全部存在（`base/table.vue:180`、`base/table-row.vue:12-23`、`cell-painters.js:195-204/1213-1217/1297/1301/1323/1396-1418`、`editor.js:38`、`row-geometry.js:74`、`layout.js:30`、`theme.js:60-65`、`button.js:6-25`、`button.scss:37-48/62-65/96-139`、`style.scss:46-51`、`table.scss:3`）；一处引用有误已改（disabled Boolean prop 在 `button.js:7`，非 `button.vue:6`）；`is: MuButton` + 空 `item.text` 的插槽阻断已实测确认并改入。
3. **约定一致**：符合 column-types 双通道与 items 协议（知识 `table 列 compile(column, dom) 双通道协议`、`items 协议 events 可选`）；文档三处不同步为人工意见 1-2 裁决，非偏离。`self-checks/cell-painters.js:975` 返回文案将过时（不影响断言），已在设计内注记。
4. **影响面**：原设计称「消费端零回改」不成立——`table-row.vue:21` 的 `{{ item.text }}` 恒生成文本 vnode，会顶掉 MuButton 内部 slot fallback（caption/icon 不渲染）；已补消费端改动并登记回归面。canvas 侧 `self-checks`/`layout.js`/`row-geometry.js`/`editor.js` 无遗漏。
5. **可实施**：片1 → 片2 → 终验顺序与依赖成立，每片有独立完成判据；无循环依赖。
6. **风险与回滚**：双向门、单 commit 回滚；已补共用消费端回归面（table-row 影响全部 items 列）。
7. **范围**：无超出验收标准的改动；文档同步项已由人工意见 1-2 剔除。
8. **切片**：片1（button.js / column-types-index / cell-painters / editor / row-geometry）与片2（table-row / style.scss / table demo）文件集合两两不相交；共享注册文件随片1；片2 依赖片1，无环。

## 人工意见核对（03-human-1）

- [1-1] dom 侧直接用 mu-button、强制 small：已落实（`is: MuButton` + `size:'small'` + `buttonStyle:'link'`）；但原设计缺消费端插槽修正，指令在此形态下会渲染空 `<button>`——本轮已补 `table-row.vue:21`，闭环。
- [1-2] 文档三处不同步：已落实（改动清单与未解问题均无文档项，decisions.md 已记录）。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
| --- | --- | --- | --- | --- |
| 1 | 改动清单；方案概述 L7；风险·爆炸半径 | 「消费端零回改」→「需改 `base/table-row.vue:21`：`{{ item.text }}` 改为 `<template v-if="item.text != null">…`」，并新增该文件条目与共用消费端回归面 | 遗漏影响面：`renderSlot` 用 `ensureValidVNode` 判文本 vnode 为有效内容（node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:3393、3419-3426，Vue 3.5.44）；实测等价组件（单根 `<button>` + `<slot>` fallback）传空文本 vnode 默认插槽时输出空 `<button>`，MuButton fallback（button.vue:9-12）不渲染 | 是 |
| 2 | 接口 / 数据结构（新增「插槽约定变更」bullet；`is` 扩展 bullet） | 补 text 槽条件化契约与实证 | 同上；`is` 组件对象若无此约定，验收 4 的 caption/icon 断言必失败 | 是 |
| 3 | 实施步骤·片2（新增步骤 4，原 4/5 重编号 5/6，终验 6→7；文件集合与完成判据） | 新增 `base/table-row.vue` 步骤并补「caption 文本可见（非空 button）」判据 | 改动清单与实施步骤须一致；`{{ item.text }}` 为空时组件内文字不可见 | 是 |
| 4 | 测试计划（新增「回归：共用消费端 text 槽」行；终验步骤补「含回归行」） | 新增回归覆盖 | table-row.vue:21 对其他 items 列生效（icon/img 为 `text: null`，text/list/tag/check 均带 text），需验证既有 section 无空单元格 | 是 |
| 5 | 接口·dom 产物 | 补 `button ?? {}`（同 canvas `EMPTY_BUTTON`，cell-painters.js:1297）、`Array.isArray`/空组返回 undefined（同 `drawButton` 门控 :1323）、`isDisabled = disabled != null && disabled !== false`（同 `isTruthyAttr` :1014-1016） | 原伪代码对 `buttons: [null]` 直接解构会抛错；非数组返回 `.flatMap` 会抛错；disabled 真值口径与 canvas 不一致（`0`/`''`） | 否 |
| 6 | 接口·dom 产物注释（icon 跳过语义） | 「canvas 同语义不绘制」→「canvas 空哨兵同时终止后续条目（cell-painters.js:1301），差异仅见残缺配置」 | 事实与原注释不符（`layoutButtonEntries` 遇 null 哨兵 `break`） | 否 |
| 7 | 接口·dom 产物注释（disabled prop 出处） | `button.vue:6` → `button.js:7`（button.vue:23 展开） | 引用行号与源码不符（button.vue:6 为 `:class` 绑定） | 否 |
| 8 | 测试计划·验收 4 | 补 `textContent` 含 caption（非空 button）、禁用条目 `pointer-events: none` 时用 `dispatchEvent`/`force: true` 点击 | 原「点击无日志」裸 `.click()` 会在 `pointer-events: none` + disabled 上超时（button.scss:127-132），手段不可执行 | 否 |
| 9 | 测试计划·验收 6 | 「片1 前后各采一次点击日志对照」→「self-checks 未改即冻结基线（知识 `table-ex-refactor-frozen-probe`）+ payload 键与字段不变」 | 实施后无法补采「改动前」基线，原手段事后不可执行 | 否 |
| 10 | 测试计划·验收 7 | 「未改动基线页」→「基线已含与本任务无关的未提交改动，按 decisions 保留原样，非本任务回归基线」 | `git status` 显示 `M demo/src/data/table-ex-basic/main-view.vue`（仅 height/striped 等无关改动） | 否 |
| 11 | 遵循约定 L18；改动清单后注 | 补 text 槽提示；注记 `self-checks/cell-painters.js:975` 返回文案将过时（断言不受影响） | 交叉引用一致性；避免验证期误判口径漂移 | 否 |

## 未解决异议（累计）

无。
