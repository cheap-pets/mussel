# 设计评审记录 — table-ex（第 1 轮）

VERDICT: REVISE

## 上轮问题核对（第 2 轮起）

无（第 1 轮）。

## 检查项结论（每项一行）

1. 覆盖：不通过 — A1-A9 均有对应章节，但 A3/A4 测试依赖未暴露的接口与未列入的调试开关，A1 的方法/插槽未纳入测试手段；G1/G2 步骤的验证依赖后置的 demo。
2. 事实一致：不通过 — `placeholder` 语义、demo 路径/URL、`rec_no` 的 `compile`、`MuSwitch` 事件面与源码不符。
3. 约定一致：不通过 — demo 目录与 catalog/vite 规则冲突；`placeholder` 偏离现有 table 语义。
4. 影响面：不通过 — 渲染相关 props 与 `records` 就地变更均无重绘触发；`cell-painters` 未覆盖 `column.text` / `rec_no` / check `disabled`。
5. 可实施：不通过 — sticky 层与 spacer 的结构/高度不可用；编辑器事件隔离不足；步骤无法独立验证。
6. 风险与回滚：基本通过 — 有风险表与新增文件回滚；但 sticky 回退方案未覆盖 B1 的流内顺序问题。
7. 范围：通过 — 新增 API 与范围边界均有验收依据，文档延后符合项目规约。
8. 并行组：跳过（设计未标并行组）。

## 问题清单

### Blocker

[blocker] `02-design.md:149-159`、`02-design.md:467` — sticky canvas 排在 spacer 之后且 spacer 高度自相矛盾；按此结构 canvas 大部分滚动范围位于视口下方，滚动几何不成立。 — 证据：DOM 骨架 `02-design.md:150` 将 `__spacer` 放在前、`__sticky` 放在后，`:159` 又要求 spacer 高度减去一个视口高；`:467` 的测试断言 spacer 高度 = 表头高 + 100000×36。`position: sticky; top:0` 只会限制元素不越过视口上缘，不会把静态位置在视口下方的元素上拉；spacer 在前时 sticky 层的静态位置≈内容底部。 — 建议：把 `__sticky` 放到 `__spacer` 之前（两者都在流内，spacer 高 = 内容总高 − 视口高），或改为 absolute canvas + 独立 spacer 撑高；同时统一 `:150`/`:159`/`:467` 的高度口径与断言。

[blocker] `02-design.md:54-55`、`02-design.md:461`、`02-design.md:489` — demo 页面路径与 catalog 规则不一致；按文档执行 `npm run demo:build` 会在构建期抛错，测试 URL 404。 — 证据：改动清单写 `demo/src/table-ex/main-view.vue + main.js`，catalog 写 `data/table-ex`；`vite.demo.config.js:60-80` 要求入口为 `demo/src/<page.path>/main.js` 且 `page.path` 必须以分类 `data/` 开头（`demo/src/catalog.js:96-107`），产物输出到 `demo/dist/data/table-ex/`；测试计划 `02-design.md:461` 与 S2 `:489` 使用 `http://localhost:3000/table-ex/`。 — 建议：目录改为 `demo/src/data/table-ex/`，URL 改为 `/data/table-ex/`，并同步改动清单、S2 判据与测试计划。

[blocker] `02-design.md:289-295`、`02-design.md:313-318`、`02-design.md:470` — 编辑浮层只阻止 pointerdown 冒泡，但画布单元格选择/提交走 click；且 `@blur="commitEdit"` 会在点击 `MuSelect`/`MuDateInput` 下拉项时先触发，编辑器先关闭、选项点击丢失，A6 的 enum/date 用例无法通过。 — 证据：设计 `:295` 仅声明“浮层内 pointerdown 阻止冒泡”，而 A5 的单元格交互是 `click`（`:268-270`）；`MuSelect`/`MuDateInput` 内部是可聚焦的 input（`src/components/form/combo-wrapper.vue:9-12`），blur 由 `src/components/form/input.js:65` 转发；下拉项是普通 div、未阻止 mousedown 默认行为（`src/components/dropdown/dropdown-item.vue:1-7`），点击选项先让 input 失焦。 — 建议：在 `__editor`/`__overlay` 同时拦截 `click`/`pointerup`，或在 `editing` 状态下屏蔽画布命中；blur 提交改为延迟判定或外部 pointerdown 判定；select/date 改用 `dropdown:hide`/值变化提交，不把 blur 作为唯一提交源。

[blocker] `02-design.md:201`、`02-design.md:228`、`02-design.md:315` — 组件只监听 `records` 引用变化；现有 `update:cell-value` 的消费方普遍就地修改 record 字段，引用不变则 canvas 不重绘，check 点击翻转与编辑提交后格子不更新。 — 证据：设计 `:201` 为 `watch(records)`：引用变化；`:315` 依赖“父级修改 records → watch”；现有 table 的 check 列用法即 `record[column.field] = value`（`demo/src/data/table-advanced/main-view.vue:197-204`），且 A1 `:93` 宣称“check 列点击翻转（现有能力）”；A3 的重绘表 `:223-231` 也未列出 check 点击后的重绘。 — 建议：明确并提供数据变更的重绘机制（提交/check 点击后主动 invalidate；或提供 records 版本号/deep watch 策略），并在 A1/A4 写明父级更新数据的契约与性能代价。

### Major

[major] `02-design.md:82`、`02-design.md:404` — `placeholder` 被重新定义为“空态文案”，但现有 table 的 `placeholder` 是空单元格占位文本，设计却标为“相同”；现有占位能力（含列级 placeholder）会静默丢失。 — 证据：`src/components/table/table.vue:84`、`:195` 与 `src/components/table/table-row.vue:25` 用 `placeholder` 渲染空单元格；`docs-site/components/table.md:242` 明确写“空单元格占位文本”；设计 A1 `:82` 写“相同（空态文案…）”，A7 `:404` 将其用于空态。 — 建议：保留 `placeholder` 的空单元格语义，另加 `emptyText`（或只保留 `empty` 插槽）；若必须改语义，A1 标为差异并提供等价能力。

[major] `02-design.md:100-111`、`02-design.md:465-469` — 测试计划依赖不存在的暴露接口/调试开关，A3/A4 断言无法执行，A1 的方法与 `empty` 插槽也没有测试手段。 — 证据：方法表只有 `scrollToRecord`/`refreshTheme`（`:100-111`），测试计划 A4 `:468` 要“读组件暴露的列宽数组”；A3 `:467` 要“demo 提供调试开关”；A5 `:469` 写“组件 expose 数据或 canvas 像素采样”但未定义数据接口；A1 `:465` 只覆盖事件日志。 — 建议：暴露只读的布局快照/列宽 API（或在测试中明确用像素采样与坐标），把调试开关/事件日志区写进 demo 文件任务与 S2 判据，并补方法、`empty` 插槽的验证方式。

[major] `02-design.md:482-487`、`02-design.md:489` — G1-a/b/c 与 G2-b/c 的完成判据都要求 demo 页验证，但 demo 页文件只在 S2 创建；这些步骤在当前顺序下不能独立验证，形成对后置步骤的隐性依赖。 — 证据：G1-a `:482` 要“demo 页触发 refreshTheme()”，G1-c `:484` 要“demo 调试入口”，G2-b `:486` 要“demo 上 hover/选中/排序/调宽可操作”，G2-c `:487` 要“demo 可开编辑器”；而 demo 文件只在 S2 `:489` 的“注册与验证页”步骤出现。 — 建议：把 demo 骨架与调试入口提前为 G0，或把各模块判据改为可脱离 demo 的独立脚本/断言，并列入文件清单。

[major] `02-design.md:286-291`、`02-design.md:330` — 统一用 `@blur`/`@keydown.enter`/`@keydown.esc` 提交/取消，但 `MuSwitch` 根是普通 div，无 focus/blur/keydown 事件，设计却把 bool 映射到 MuSwitch；bool 列无法用 Enter/Esc 提交或取消，blur 提交永不触发，“聚焦内部 input”也不存在。 — 证据：`src/components/form/switch.vue:2` 根为 `div.mu-switch`，仅有 `@click="toggle"`，`defineModel` 与 `toggle` 见 `:15`、`:22-38`，未声明 emits、未设置 tabindex；设计 `:330` 的映射为 `bool→MuSwitch`，`:286-291` 的模板统一绑定 blur/keydown。 — 建议：为 MuSwitch 包一层可聚焦容器，或定义专用路径（click 切换 + 外部/滚动提交 + 容器级 keydown），并在测试计划补 bool 用例。

[major] `02-design.md:115-141`、`02-design.md:415` — A4 宣称“完全兼容”现有列定义，但 `cell-painters` 只描述“取现有 compile() 的 text 描述符”，未覆盖 `column.text` 的优先覆盖、`rec_no` 无 `compile` 且需要 `recordNumber`、check 列的 `disabled`；这些字段会被静默丢弃或行为回归。 — 证据：`src/components/table/table-row.vue:44-69` 先用 `col._text(record)` 覆盖显示文本，`col._render` 仅是回退；`src/components/table/column-types/record-number.js:1-6` 只有 `render`，入参是 `{recordNumber}` 而非 `value`；`src/components/table/column-types/check.js:4-8` 的 `disabled` 决定能否点击翻转。 — 建议：在 A4/绘制管线中明确 `text`→`value`→`field` 的取值优先级、`rec_no` 走 `render({recordNumber})`、check 的 `disabled` 判定；不支持的项写入差异表/范围边界。

### Minor

[minor] `02-design.md:365` — `fontFamily` 用 `readVar('--mu-font-sans')`，但 `readVar` 读取的是 `color`（`:353-358`），与同处注释“字体名走 getPropertyValue 即可”矛盾，会得到错误字体值。 — 证据：`:353-358` 的 `readVar` 固定读 `getComputedStyle(probe).color`；`:365` 却把字体名交给它。 — 建议：字体名单独用 `getPropertyValue`/`readFont` 读取。

[minor] `02-design.md:379-384` — 正文称观察目标包含组件根自身，但代码只 observe(`root`)，`root = closest('.mu-root') || documentElement`；把 `mu-dark` 直接挂在组件根时不会触发刷新。 — 证据：`:379` 注释“观察目标同时含组件根自身”，`:380-381` 只有 `new MutationObserver(...).observe(root, ...)`。 — 建议：同时 observe 组件根，或删掉该承诺并明确挂载约定。

[minor] `02-design.md:195` — dpr 只在每次尺寸响应时重读；跨 DPI 显示器迁移若容器尺寸不变则不会更新，canvas 会模糊。 — 证据：`:195` 仅说明“外接屏迁移通常伴随 window resize → 容器 sizechange”，设计无 `resize`/`matchMedia` 监听。 — 建议：增加 window resize 或 `matchMedia('(resolution: …)')` 监听，或把 `refreshTheme()` 作为 DPR 兜底并写明。

[minor] `02-design.md:395` — 单元格字体使用 `--mu-font-size-normal`，但现有 table 单元格是 `font-size: inherit`，只有跟随外层字号才真正对齐；该取值会在用户自定义根字号时偏离。 — 证据：`src/components/table/table.scss:53` 为 `font-size: inherit`；设计 `:395` 使用固定 token。 — 建议：探针读取父级 computed `font-size`，或删除该项并保持继承。

[minor] `02-design.md:265-267` — 事件序列只为“可排序列”发 `header-click`，A1 `:90` 却称与现有 table 相同；现有 table 对所有表头点击都 emit。 — 证据：`src/components/table/table.vue:20` 的 `th @click="onHeaderClick"` 无 sortable 条件，`:336-338` 直接 emit；设计 `:265-267` 将 emit 放在“可排序列”分支。 — 建议：对所有表头点击都发 `header-click`，或把 A1 改为差异并在文档中说明。

[minor] `02-design.md:251-252` — “不允许调固定列”只排除了固定区分界最右列的手柄，其他固定列表头仍可调宽，且调宽后固定区宽度如何重算未说明。 — 证据：`:251-252` 的判定仅对最右列右缘返回 -1；固定区宽度由 `fixedLeftColumns` 与列宽共同决定（A2/A3 未给出重算规则）。 — 建议：明确固定列 resize 策略，并在命中检测中整体排除固定列。
