# 实施记录

按 02-design.md 最终版「改动清单」「实施步骤」整体实施（片1→片2→片3 全量），decisions.md 全部条目为硬约束落地。整体实施模式（无分片）。

## 改动文件

| 路径 | 设计步骤 |
|---|---|
| src/components/table/column-types/list.js（新增） | 步骤 1：ListColumn 双通道 compile（`listItems(record, value)` 取值链、仅数组值、`entry.link ?? listOption.link ?? false`、色仅 link 项消费、caption 兼容 warn、条目原引用 payload） |
| src/components/table/column-types/index.js | 步骤 1：`ColumnTypes` 注册 `list: ListColumn` + import |
| src/components/table/column-types/link.js | 步骤 2：兼容壳重写（`danger:true → color 'danger'` 条目映射、`listOption.link:true`、`_raw: column`、`listItems` 透传 `(record, value)`、valueToLinks 单值包装保留，委托 `ListColumn.compile`，无自有渲染逻辑） |
| src/components/table/column-types/style.scss | 步骤 2/7：`.mu-table__list-cell`（并入 padding 收窄；条目 block 单行省略、a 常态无下划线/hover 下划线、`[disabled]` 置灰 + pointer-events:none）替代 `.mu-table__link-cell`（tag-cell 部分保留）；新增 `.mu-table__cell-link` |
| src/components/table/ex/cell-painters.js | 步骤 4：① isPlainTextColumn 排除 `column.link === true`；② resolveCellContent 统一数组门控（抽取 `isArrayValueRejected` helper，type null/''/字符串且非 link/list/tag/button → `{}`，非字符串 type 豁免，置于 `_plainText` 短路前）；③ drawContentItems :397 与 resolveTooltipItems :1531 分发扩为 `link \|\| list`；④ linkTextColorOf/linkHoverColorOf 增 `item.color` 查表（linkPaletteOf，danger 回退保留；无 color 时 link 项 primary、非 link 项 textColor）；⑤ isLinkEntryHovered 追加 `item.link !== false`（drawLinkItems 全条目 report 现状已有）；⑥ 删 drawTextValue 数组分支、drawArrayLines、resolveTooltipText 数组分支（drawTextValue 同步去掉失效的 maxItems 形参，两处调用点同步） |
| src/components/table/ex/row-geometry.js | 步骤 5：isLinkColumn 扩 `link \|\| list`；columnLineCount 数组分支改恒 1 行；indicatesVariableMode 仅剩 `isLinkColumn(col) && count > 1`；删 isTextPresentingColumn/GRAPHIC_ITEM_TYPES；模块头/估高注释同步（hasArrayValues 语义收窄，controller 消费点不改名） |
| src/components/table/ex/editor.js | 步骤 5：NON_EDITABLE_TYPES 追加 `'list'` |
| src/components/table/ex/table-ex.vue | 步骤 5：emitDomItemClick capped dots payload 键 kind 'link' → `item`（tag 键不变） |
| src/components/table/column-types/text.js | 步骤 7：`column.link === true`（色缺省 primary、DOM class 追加 mu-table__cell-link、canvas 仅链色文本）；首行门控 `if (!value \|\| Array.isArray(value)) return null`；dom 落地抽 domRenderOf helper（产物结构与原实现同构） |
| demo/src/data/table/main-view.vue | 步骤 3/8：新 section「list 列 / text.link」——list 列（string/link 对象/`{id}` 附加键/color/disabled/超限 dots 混合 + caption 兼容 + 标量值记录）+ 两个 `@cell-item-click` payload 日志 span + text.link 列（缺省 primary/color teal/multiline+lineClamp danger 变体）+ link 兼容列（caption/danger/color:teal/disabled + 单值 12345）；「列类型」note 增补 list；边界回归段追加 text 数组值占位夹具表；旧 linkColumns 保留作回归对照 |
| demo/src/data/table-ex/main-view.vue | 步骤 6：itemColumns 追加 list 列与 text.link 列、itemRecords 追加对应字段（含 12 条目超限 dots 与标量占位行）；multiline 场景 `strings`/`nums` 改 `type:'list'`（`listOption.max:3`）+ 新增 text 数组值占位夹具列 + multilineRecords 对应字段 + 列注释同步；默认场景 columns/records 追加 list/textLink/legacyArray 夹具（见偏离 1） |
| demo/src/data/table-ex/self-checks/cell-painters.js | 步骤 6：文件头覆盖说明更新；数组多行用例 → A9 占位断言（文本/number 数组落占位、自定义列豁免、list 照常）；link/tag 双通道用例 → 新产物（list-cell / text-{color} / payload item / link:true / color 查表）；LinkColumn dom 用例 → 兼容壳新产物；新增 ListColumn compile 用例（标量拒绝、span/a 分流、非 link 正文色、payload item/column、caption 兼容、全条目点击）；link 竖排用例 → item.color 生效 + list 非 link textColor；link 悬停用例 → color hover 谱系 + list 非 link 不悬停；linkHoverColorOf 直调用例补 color 查表/非 link 正文色分支；数组 tooltip 用例 → 文本数组无 tooltip + list/link 竖排口径 |
| demo/src/data/table-ex/self-checks/row-geometry.js | 步骤 6：估高用例改「list 条目计数真值 + 文本列数组恒 1 行」（夹具 listRenderOf 手写 `_render`，遵循该文件手写内部字段风格）；hasArrayValues 用例改「文本列数组不触发变高、list/link 条目 > 1 触发」 |
| demo/src/data/table-ex/self-checks/spans.js | 步骤 6：分层用例 ① 排除列改 list 列多条目，对照组改用 list 条目计数触发 hasArrayValues |

不改动（与设计一致）：base/table.vue、table-row.vue（render 协议不变）、src/styles/link.scss（用户工作区改动，未触及）、editor normalize* 数组开值/提交逻辑。

## 偏离

1. **设计改动清单 demo/table-ex ③「参照表与舞台同源，新增列自动同步」前提不完整**：DOM 参照表绑定的是 `columns` ref（默认场景列），`itemColumns`/`multilineColumns` 为场景独立数组，新增列不会出现在参照表——测试计划 A1/A4/A9 的「/data/table-ex/ DOM 参照表断言」将无法执行。证据：main-view.vue :230 `:columns="columns"`、:1055 `referenceRecords = displayRecords.slice(0, 20)`、stageColumns switch（:941-953）仅默认场景用 `columns.value`。处置：在 createDefaultColumns/createRecords 追加 list 列（listOption.max:4）、text.link 列、text 数组值占位列及对应字段（仅前 5 行/前 3 行配值，其余 undefined 落占位，避免 10 万行性能夹具承压）；itemColumns/multilineColumns 的设计改动照常保留。测试计划断言口径不变。
2. **style.scss 实现细节补充**（设计「接口/数据结构」未逐字列出，为达成 A1/A7 语义所必需）：`.mu-table__list-cell > a` 常态显式 `text-decoration: none`（浏览器 a 默认下划线，不关闭则「hover 下划线」不成立）；`[disabled]` 置灰用 `var(--mu-text-color-muted)`（与 canvas textColorMuted 同源）；list 条目不带旧 `.mu-table__link-cell > .mu-link` 的 margin/max-width/vertical-align（横排 inline 遗产，竖排 block 不适用）。
3. **list.js/text.js/cell-painters 为满足 eslint complexity ≤ 10 抽取模块级 helper**（canvasItemOf/domItemOf/entryColorOf/isLinkEntryOf/domRenderOf/isArrayValueRejected），render 产物结构与设计「接口 / 数据结构」逐字段一致，非行为偏离。
4. **非偏离澄清（实施中发现并已按设计接口落地）**：list primitive 元素 payload `item` 为包装对象 `{ label: el }`（设计「条目解析规则」明示「仅 primitive 包装为 { label: el }」）——self-checks 断言按包装对象写（node smoke 首轮 FAIL 系临时脚本断言写错，非实现缺陷）。

## 核对项（派发要求，结果记录）

1. **isTextPresentingColumn 消费方 grep**：`grep -rn "isTextPresentingColumn\|GRAPHIC_ITEM_TYPES" src demo/src` → 仅 src/components/table/ex/row-geometry.js 定义（:24/:36）与消费（:128/:353），demo 无引用。删除安全，与 06-amend-1 #18 结论一致。
2. **self-checks 基线**：改动前断言依赖旧行为的用例与 06-amend-1 #8 所列吻合——cell-painters.js :1066-1083（数组多行）/ :1161-1264（link 双通道旧产物 `mu-link`/payload link）/ :1266-1319（LinkColumn dom 旧产物）/ :1393-1508（恒两色取色、hover）/ :1833-1858（数组 tooltip join）；row-geometry.js :274-301（文本数组 min(length,maxItems)）/ :304-367（文本数组触发变高）；spans.js :403-467（数组对照组 true）。三份均随本次实施改写。editor 自检（self-checks/editor.js :217-229）对 NON_EDITABLE_TYPES 为动态循环遍历，`list` 追加后自动覆盖、无需改动（设计「editor 自检保持」成立）。

## 自检

| 命令 | 结果 |
|---|---|
| `npx eslint <12 个改动文件>`（两轮，修复后） | 0 error（首轮 4 error：3 spaced-comment + 1 no-unused-vars，已修） |
| `npx eslint src demo/src`（全量，终轮） | 0 error / 12 warnings，warnings 全部位于本次未改动的既有行（complexity/max-len 既有基线） |
| `npx stylelint src/components/table/column-types/style.scss` | 首轮 1 warning（属性顺序），`--fix` 后 clean |
| `npm run build` | exit 0；base dev/prod + ex dev/prod 共 4 次 vite build 全部 `✓ built`（301/283 modules） |
| node smoke（临时 harness：`--import` 全局预置 + loader hook 做 `@/` alias 与 .scss/.vue stub，TEMP 目录，验后已删除） | smoke1（list/link 双通道、payload、dots、注册表）18 ok / 0 FAIL；smoke2（text.link、A9 resolveCellContent 门控、row-geometry A9 估高）15 ok / 0 FAIL |

## 遗留

1. **demo 浏览器验证未执行（环境阻塞）**：:3000 端口服务未运行（curl 连接拒绝，exit 7）。按 00-task「服务未运行时报告环境阻塞，不自行启动打包」，A1~A7 的 playwright DOM 断言与 self-checks 面板 0 FAIL 核对留待验证轮；需先启动 `npm run demo:build`（rollup watch）+ :3000 静态服务，页面 `http://localhost:3000/data/table/`、`/data/table-ex/`（00-task 验证环境 URL 已由探索报告勘正为带 `/data/` 前缀）。
2. **caption 兼容警告**：按设计终验要求，demo（`__env__='development'`）控制台应出现一次 `[MUSSEL:Table] list 列条目 "caption" 键已废弃…`（utils/warn once 去重）——node smoke 已证实该警告通道工作，页面侧留验证轮核对。
3. **link 列 breaking 变化**（decisions 已裁决）：DOM 布局横排→竖排、payload 键 `link`→`item`、link 对象 `color` 键激活。demo 内全部 `type:'link'` 使用点（data/table、table-ex 各场景、linkReference 段）随共用实现自动获得新形态；设计风险节所列 table-advanced/case-form 等页面未逐一目检（设计已标明仅形态变化、无需代码改）。
4. canvas 侧颜色/布局（A1 链色、A5 逐条省略、A9 不拆行、list 竖排）无 DOM 断言手段，按测试计划以 DOM 参照表断言 + 并排目检 + self-checks 覆盖，留验证轮执行。
