# 交叉审改记录 1（design-amender / pipeline-peer）

VERDICT: AMENDED

本轮为第 1 次审改（r=1），无上次回应核对。

## 检查项结论（每项一行）

1. **覆盖**：A1~A9 均有对应设计与测试手段；补齐 A6 全条目点击、A7 danger/color 夹具、A9 统一数组门控与 self-checks 更新；A8 为构建 + 两 demo 页断言。
2. **事实一致**：设计引用的路径/符号经 Read/Grep 核对存在（link.js:21、text.js:11、cell-painters.js:397/:701/:1092/:1469/:1531、row-geometry.js:31/:127/:352、editor.js:38、table-ex.vue:1218）；decisions 条目编号原引用全部错位，已改；`import.meta.env` 机制与项目 `__env__`/utils/warn 约定不符且 demo 实为 vite dev，已改。
3. **约定一致**：list 类型走 `column-types/<type>.js` + 注册表；dev 警告改用 `src/utils/warn.js`（spans.js/table-ex.vue 同款）；颜色走 `text-{color}` 与 `theme.colors`；不引入新依赖；非 link 项不再消费 color（回 decisions 第 3 条）。
4. **影响面**：补入 3 份 self-checks（否则终验必 FAIL）、table-ex multiline 场景数组列（否则 demo 与 A9 相反）、payload `column` 原列引用（`_raw`）；其他 link 使用页仅形态变化已在风险中标明。
5. **可实施**：步骤按片1→片2→片3 排列，self-checks 归入片2 步骤6，依赖无环；style.scss 与 demo data/table 的同文件多次编辑已标串行。
6. **风险与回滚**：link 兼容与 A9 均为双向门（按文件还原）；爆炸半径、self-checks 更新、editor 不在 A9 范围均已列明。
7. **范围**：收窄非 link 项 color；A9 限定渲染链路（editor textarea 数组开值/提交不动）；未新增 listOption 之外的能力。
8. **切片**：片1/片2/片3 文件集合两两不相交（除串行同文件：style.scss、demo data/table），self-checks 仅片2；每片有可观察判据。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
|---|---|---|---|---|
| 1 | 方案概述 P2、改动清单 cell-painters ②、测试 A9 | 「仅 `_plainText` 短路追加 `!Array.isArray`」→「`resolveCellContent` 取值后统一数组门控：type 为 null/''/字符串且非 link/list/tag/button → `return {}`（字符串 type / 无 type 列全覆盖，非字符串 type 豁免）」 | number/date/bool 列不走 `_plainText`（cell-painters.js:167-171 仅 text/无 type），数组仍进 compile（number.js:15 `Intl.NumberFormat.format(array)` → NaN、bool 真值化），A9 未覆盖；且 `typeof undefined !== 'string'` 的写法会让无 type 列漏门控；00-task.md:31 「除 list 列外一律不再支持数组」 | 是 |
| 2 | 方案概述 P2、改动清单 cell-painters ④、接口 canvas 产物 | 「`item.color` 查表，无则回退 primary」→「link 项回退 primary、非 link 项回退 `theme.textColor`」 | 现状 `linkTextColorOf` 无 color 恒回退 primaryColor（cell-painters.js:707），list 纯文本项会被染成链色，违背 A4「元素默认按文本行渲染」 | 是 |
| 3 | 接口 listOption、link 兼容壳 | 新增 `listOption.link?: Boolean`；兼容壳设 `link:true` | 原设计兼容壳只映射 color/disabled，条目无 `link` 键 → DOM 全渲染为 `span` 且无 click、canvas `link:false`，A7 的 link 列不再是链接（decisions 第 4 条要求 link 列保留为链接渲染） | 是 |
| 4 | link 兼容壳代码块、list 列 `listItems` 签名 | `listItems?: (record)` / `record => getLinks(record)` → `(record, value)` / `getLinks(record, value)` | 缺省 `valueToLinks(record, value)` 依赖 value（link.js:9-18）；丢掉 value → 所有走 field 取值的 link 列渲染为空，A7 直接失败 | 是 |
| 5 | 接口 payload、link 壳委托对象 | 委托 `{...column,type:'list'}`，payload column 改为 `column._raw ?? column` | ListColumn.compile 闭包捕获派生对象，`cell-item-click` 的 `column` 会由原始列变成派生副本；canvas 侧 table-ex.vue:1174 本就用 `_raw`，双端需一致 | 是 |
| 6 | 接口 条目解析规则（色）、canvas 产物 | 非 link 项 `entry.color ?? null` → 非 link 项不消费 color（恒正文色） | decisions 第 3 条只裁决「list link 项颜色」；A4 要求纯文本项按文本行渲染，落 `text-{color}` 超出验收与决策范围 | 是 |
| 7 | 方案概述 P4、接口 DOM/canvas 产物、cell-painters ⑤、测试 A4/A6 | 「events/onItemClick 仅 link 项；report 仅 `link !== false`」→「所有条目绑定 click / onItemClick 并 report；hover 样式在 `isLinkEntryHovered` 追加 `item.link !== false`」 | 00-task.md:28 A6「list 列项点击 emit…」无 link 限定；tag.js:92-93 先例为全条目不区分。原设计把纯文本项点击丢弃，A6 不通过 | 是 |
| 8 | 改动清单 + 实施步骤 6 | 新增 3 份 self-checks 改动（cell-painters/row-geometry/spans）及用例位置 | 现有断言直接依赖被删除行为：row-geometry.js:296/314（文本数组→多行/true）、spans.js:431-435（对照组 true）、cell-painters.js:1067/1172-1218/1276-1315/1408-1412/1834-1857（数组多行、payload `link`、`mu-link`、color 不消费）；不改必新增 FAIL，与测试计划冲突 | 是 |
| 9 | 改动清单 demo/table-ex ②、风险 | 仅「追加 text 数组夹具」→「multiline 场景 `strings`/`nums` 改 list（`strings` 用 `listOption.max:3`）+ 新增 text 数组占位夹具 + 注释同步」 | demo/src/data/table-ex/main-view.vue:599-615 现有文本数组列在 A9 后变占位（且页面注释仍宣称逐元素多行），不处理则 demo 与验收相反 | 是 |
| 10 | 遵循约定、接口条目解析、未解问题 | `import.meta.env?.MODE === 'dev'` + 模块级去重 → `warn({ component:'table', message })`（utils/warn once） | src/utils/warn.js:6-19 为项目统一 dev 警告出口；`vite.demo.config.js:208` 定义 `__env__='development'`，design 原判断「demo 不触发」事实错误；且自造环境判断偏离约定 | 是 |
| 11 | 改动清单 cell-painters ⑥ | 删除 `drawArrayLines`/`drawTextValue` 数组分支 → 同时删除 `resolveTooltipText` 数组分支（:1469-1481） | 绘制路径删除后 tooltip 仍按逐元素 join 描述数组，与 A9「不支持数组」矛盾；该分支在门控后仅剩 `column.text` 数组可触发 | 是 |
| 12 | 测试计划 A3/A6/A7/A9、改动清单 demo | 补：A7 需 danger/color:teal 夹具（data/table 新 section + table-ex `linkReferenceRecords`）、A3 需 multiline+lineClamp text.link 夹具、A6 需点击纯文本项与 item 含 id、A9 需 text 数组占位夹具 | 原 A7 指向的 data/table linkColumns（:160-173）无 danger/color，断言不可执行；A3/A6/A9 条目缺对应夹具，验收手段不可验证 | 是 |
| 13 | 实施步骤 4 完成判据 | 「非 link 项点击无 payload」→「list 纯文本项点击产出 cell-item-click（A6）」 | 与 A6 直接冲突（同 #7） | 是 |
| 14 | 遵循约定值归一条、接口 list 定义/条目解析、link 壳注释、测试 A4、demo 表格 | 「ListColumn 沿用单值包装」→「ListColumn 缺省仅接受数组，标量落占位；单值包装只在 link 兼容壳 valueToLinks 内」；A4 增标量夹具断言 | 00-task.md:26 A4「list 列仅接受数组值」；沿用 valueToLinks 的 `[{ caption: value }]` 包装会让 list 列接受标量，违反验收；link 的 `links: 12345` 夹具由壳内 valueToLinks 保留即可 | 是 |
| 15 | 全文 decisions 引用 | 第 8/9/10/11/5/6 条 → 第 5/6/7/8/2/3 条等 | decisions.md 实际 10 条，原引用整体错位（payload=第 5、语义 danger=第 6、文本数组拒绝=第 7、canvas text.link=第 8、项结构=第 2、list 色=第 3、映射=第 4） | 否 |
| 16 | 接口 DOM 产物示例 | `[..._class]` → `[样式项, _class]` | `_class` 为 listOption.class 求值结果（可为 undefined），展开 undefined 会抛 TypeError | 否 |
| 17 | 风险段 link breaking | 去掉「所有条目可点击」作为 link 列新变化 | link 列条目本就全可点击（link.js:92-93），该描述仅对 list 列成立，已移至 list 风险条 | 否 |
| 18 | 未解问题 | 删除原 1（isTextPresentingColumn grep）与原 3（DEV 警告环境）；保留 canvas 目检限制 | 全仓 grep 确认 `isTextPresentingColumn`/`GRAPHIC_ITEM_TYPES` 仅 row-geometry.js:128/:353 消费；DEV 机制已按 #10 裁定 | 否 |
| 19 | 实施步骤 3/6/8 表述 | link 兼容列夹具落位、self-checks 文件集合、text.link 夹具内容与改动清单对齐 | 原步骤 3 说「回归段 link 兼容列已有」与改动清单「新 section 新增兼容列」矛盾；步骤 6 未列 self-check 文件 | 否 |
| 20 | 被拒绝备选 2/4、测试 A6 措辞 | 「闭合结构」→「既定项结构」；「门控 report」→「区分样式/hover」；A6 的 column 断言改为 field/caption 与原始配置一致 | decisions 第 2 条含「...任意属性」非闭合；#7 后 report 已无门控；浏览器无法断言对象身份 | 否 |

实质改动 14 项，非实质 6 项。

## 未解决异议（累计）

无。本轮所有问题均可依据 00-task.md 验收标准、decisions.md 已确认条目或仓库现有约定直接裁定，已全部改入 02-design.md。
