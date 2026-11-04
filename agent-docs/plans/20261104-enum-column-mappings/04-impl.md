# 实施记录

## 改动文件

| 路径 | 设计步骤 |
|---|---|
| `src/components/table/column-types/enum.js` | 步骤 1：重写 EnumColumn——删 warnDeprecated 与废弃注释；`compile(column, dom)` 双通道 + `createDisplayMapper`（mappings 优先、options 转换）；保留 `align: 'center'` |
| `src/components/table/column-types/index.js` | 步骤 1：import EnumColumn，`ColumnTypes` 注册 `enum: EnumColumn` |
| `src/components/table/column-types/text.js` | 步骤 1：删 `createDisplayMapper` import 与 mapper；新增 `getColor = ensureFn(column.color)`；`text = value`，空值门控 `if (!value) return null`；multiline/lineClamp/title/dom class 管线不变 |
| `src/components/table/ex/cell-painters.js` | 步骤 2：`_mapText` 门控 `type === EnumColumn`（import 替换 TextColumn→EnumColumn）；`isPlainTextColumn` 删 mappings/options 排除、加 `column.color == null`；:29-30/:165-171/:202-203/:225 注释同步 |
| `src/components/table/ex/editor.js` | 步骤 3：`COLUMN_TYPE_EDITORS` 加 `enum: 'select'`；`resolveEditorType` 删 text+hasSelectSource 分支；删 `hasSelectSource`；函数注释同步 |
| `demo/src/data/table-ex/main-view.vue` | 步骤 4：状态列 type text→enum（mappings/editor/title 不变）；等级列 type number→enum + `options: [{value:1,label:'低'},{value:2,label:'中'},{value:3,label:'高'}]`，注释更新；备注列加 `color: (r, v) => (v ? 'primary' : null)` 夹具 |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 步骤 4：「mappings 显示映射」块夹具改 enum 并补 A1 断言（resolveColumnType 身份、align center、无映射源原值）；「mappings/options 优先级」块夹具 text→enum（number Intl 断言保留）；「_mapText/_plainText 判定」块重写（text+mappings/options 短路原值、enum 挂载不短路）；新增「text color 双通道」断言块（字符串/函数色名、canvas 平铺 / dom text-{c}）；离屏像素块 text+mappings 项改 enum+mappings；新增 TextColumn/EnumColumn/resolveColumnType import；头注释同步 |
| `demo/src/data/table-ex/self-checks/editor.js` | 步骤 4：「编辑器解析」块 text+mappings→input、enum→select、非法 editor.type+mappings→input、组件身份断言改 enum 源；`resolveEditorType` 块重写（enum 恒 select、text 按形态判定、props.options 不再升级）；「仅 options 的 select」块夹具 text→enum；`numericEnumColumn` 与 usesDerivedOptions/commit 规整层夹具 type text→enum（断言值不变）；头注释同步 |
| `demo/src/data/table-ex/self-checks/painter.js` | 步骤 4：status 夹具 3 处（RAW_COLUMNS、blankTail 窄列、行背景带窄列）type text→enum 并显式 `align: 'left'`（防像素采样漂移） |

## 偏离

1. **设计第 4 步（editor.js 自检同步清单）— 范围内补两处夹具**：设计改动清单逐字列了 7 处 editor.js 自检同步点，未含「提交矩阵」块 `selectColumn`（原 :819）与 blur 块 `selectColumn`（原 :1052）。但该两夹具为 `text + mappings`，源码改后解析为 input，块内 select 事件矩阵断言（`['blur','esc']`）必失败，与步骤 4 完成判据「自检清单全部 PASS」冲突。按设计同型夹具（"numericEnumColumn 夹具 type text→enum，断言值不变"）同步为 `type: 'enum'`，全部断言原值不变。证据：`resolveEditorType({type:'text',mappings})` 改后走 `resolveTextLikeEditorType`（editor.js resolveEditorType 现实现），input 的 `commitOnValueChange === false`（editor.js open 内）。
2. **设计第 4 步（cell-painters 自检）— 两处过时文案**：bool 块断言消息与 number 注释中「mappings 特性 text 独有」同步为「enum 独有」（属头注释同步同范畴，仅文案，断言行为不变）。
3. **text.js 产物形态微调（非行为偏离）**：mapper 删除后原 `...attrs`（恒空）与 `itemClass = [mClass]`（mClass 恒 undefined）分别收敛为无展开与 `[]`，渲染等价（Vue class/style 绑定归一空项）；设计代码片段已隐含此形态（"以下管线与现状一致"）。

设计其余步骤逐条落地，无 `BLOCKED` 事项。

## 自检

已运行命令与结果（TDD 关，无 Red 阶段）：

- 步骤 1：`npx eslint src/components/table` 无错；`npm run build` 通过。
- 步骤 2：`npx eslint src/components/table/ex/cell-painters.js` 无错；`npm run build` 通过。
- 步骤 3：`npx eslint src/components/table/ex/editor.js` 无错；`npm run build` 通过。
- 步骤 4：`npx eslint src demo/src` → **0 errors**（12 warnings 为改动前既有，均在 `demo/src/layout/split-box/main-view.vue`、`src/events/resize.js` 等无关文件）。
- 终验：`npm run build` 通过（dev+prod 双份）；`npx eslint src demo/src` 0 errors。
- 临时 node 断言脚本（派发授权的"命令"手段；`agent-docs/plans/20261104-enum-column-mappings/evidence/{check.mjs,loader.mjs}`，运行后已删除）：覆盖 A1-A6 纯逻辑断言 **15/15 PASS**——A1 注册身份/align center/无映射源原值；A2 命中/对象形式 `{text,color}`/default/`value==null` 占位/`_mapText` 挂载/dom `text-{c}`；A3 mappings 优先/仅 options label/`resolveSelectOptions` 三级来源与排除 default/空数组兜底；A4 text+mappings 原值短路 `_plainText===true`+`_mapText===null`、text color 双通道两形态（canvas 平铺 / dom `text-{c}`）；A5 enum→select（类型+MuSelect 身份）、派生 open 字符串化/提交回写 number、options 原样通道保持 number；A6 text/number/currency/bool/无 type 带 mappings·options·props.options 不派生 select、number+mappings 仍 Intl 文本。
- demo 站点探活：`http://localhost:3000/data/table-ex/` → HTTP 200（常驻 watch 未中断）。
- 浏览器侧（demo 自检清单全绿、A2/A3/A4/A5 的 DOM 断言、像素采样）按派发由验证员执行，本步骤未覆盖。

## 遗留

1. **设计枚举缺口**：`demo/src/data/table-ex-scene/main-view.vue:91-99` 状态列为 `type: 'text' + mappings + editor`（设计改动清单与"非本任务 demo 页不同步"风险清单均未列出，清单只列了 `data/table`、`data/table-ex-basic`、`table-ex` widths 场景三处）。text 去映射后该页状态列将显示原值、编辑回退 input。按设计对同类非验收页面的处理（维持原样、文档推迟）未动，建议任务收尾随文档三处一并同步。
2. enum 显示语义随 `createDisplayMapper` 收敛（设计"预期内行为断裂"，提醒验证员对照）：`value == null` 有 `default` 时落占位链不再兜底 default（旧 enum.js:28 行为）；数组形式 mappings 按 options 口径转换；text+mappings/options 列显示原值、编辑器不再自动 select；enum 不再输出 dev 废弃警告；DOM 侧 `type: 'enum'` 恢复渲染且 align 由 left（text 回退期）变 center。
3. 知识库 INDEX.md 条目 33/36 冲突与文档三处同步（skills/mussel-ui、docs/quick-reference、docs-site）：按 decisions 推迟至用户确认后，不在实施范围。
