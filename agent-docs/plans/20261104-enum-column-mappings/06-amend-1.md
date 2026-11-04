VERDICT: AMENDED

## 检查项结论（每项一行）

1. **覆盖**：A1-A6 均有设计与测试计划（单片 + 终验），手段可验证；自检文件已列入改动清单与步骤 4。本轮补两处覆盖缺口（台账 #1/#2）后成立。
2. **事实一致**：路径/符号/行号逐项核对通过（enum.js/text.js/bool.js/mappings.js/editor.js/cell-painters.js/layout.js/spans.js 与自检行号）；三处引用纠错见台账 #7。INDEX.md「条目 N」按其文件行号核对一致（33 mappings text 独有、34 color、35 双通道、36 enum 废弃、28 像素锚、43 eslint）。
3. **约定一致**：符合双通道协议、`ensureFn` 包装、`COLUMN_TYPE_EDITORS` 单一事实源；decisions D1（A4 解释为 text 新增 `column.color`）与代码事实一致——text.js:15-22 仅经 mappings 对象值取 color，全文无 `column.color` 读取，确认该解释。
4. **影响面**：已核 mu-table/table-ex 双端、`spans.js` autoRowSpan、`layout.js` 默认宽、demo 页与自检；补 color/短路口径（台账 #1）、两处自检断言（#2/#5）、非任务 demo 页记录（#4）。
5. **可实施**：步骤 1-5 有序，依赖与完成判据明确，无循环依赖。
6. **风险与回滚**：双向门、可单次 revert；爆炸半径与像素锚已列；补 enum 语义收敛（#3）与 demo 页不同步（#4）。
7. **范围**：改动均在 A1-A6 面内；文档三处与知识库按约束延后。
8. **切片**：未切片，跳过。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
|---|---|---|---|---|
| 1 | 方案概述 3 / 改动清单 `ex/cell-painters.js` / 接口 `isPlainTextColumn` / 测试计划 A4 | 仅删 mappings/options 排除 → 追加 `column.color == null` 条件 | text 列染色须经 compile 产 color；canvas 短路分支 `if (col._plainText) return { text: value }`（cell-painters.js:217-231）不含 color，text+color 列一旦短路则 A4 canvas 断言与备注列染色丢失；自检 `content()` 走 `resolveCellContent`（self-checks/cell-painters.js:95-97）同样受影响 | 是 |
| 2 | 改动清单 `self-checks/editor.js` / 测试计划 A5、A6 | 仅列 `resolveEditorType` 块（:427-468）等 → 补「编辑器解析」块 :118-210 同步 | 该块断言实现后必失败：:127 `text+mappings → MuSelect`、:132 `enum → input`、:136-143 `text + 非法 editor.type + mappings → select`、:202/:205 组件身份与直调断言；不改则终验「demo 自检全绿」不通过 | 是 |
| 3 | 风险「预期内行为断裂」后新增条目 | 无 → enum 显示语义随 createDisplayMapper 收敛说明 | 旧实现 enum.js:28 `enumMap[value] ?? enumMap.default ?? { text: value }` 对 `value == null` 兜底 default；新实现 mappings.js:55 `v == null ? null : ...` 落占位链；数组形式 mappings 旧按 `Object.entries` 下标为键、新按 `mappingsFromOptions` 元素值 | 否 |
| 4 | 风险段新增条目 | 无 → 非本任务 demo 页不同步说明 | `demo/src/data/table/main-view.vue:108-150`、`demo/src/data/table-ex-basic/main-view.vue:152`、`demo/src/data/table-ex/main-view.vue:713` 均为 text+mappings 夹具，改动后显示原值；三者不在 A1-A6 验收路径（验收只用 `/data/table-ex/`） | 否 |
| 5 | 改动清单 `self-checks/cell-painters.js` | 未列 → 补 :773-795「各类型离屏绘制非空像素」的 `text+mappings` 项改 enum、新增 EnumColumn/resolveColumnType import、头注释 :3-8 同步 | 该块夹具标签与「text 不再映射」不符；`resolveColumnType('enum') === EnumColumn` 身份断言需自 `column-types/index.js:30` 导入；头注释 :5-7 仍写 mappings text 独有 | 否 |
| 6 | 「不改动」段 | 未列 → 补 `ex/layout.js`、`ex/spans.js` 及理由 | layout.js:16-21 已含 `enum: { width: 100, minWidth: 60 }`；spans.js:31-40/357 消费 `_mapText` 取 autoRowSpan 显示值，行为随挂载点变化但代码不改 | 否 |
| 7 | 改动清单 `ex/editor.js` 行 / 接口节 | 「头注释与函数注释同步（:7、:135-138）」→「函数注释同步（:135-138）」；「editor.js:241/422」→「editor.js:241；自检 self-checks/editor.js:422」 | ex/editor.js:7 为 import 行（`ROW_TOP_INSET`），相关注释在 :135-138；:422 为 `buildEvents` 的 select/date 分支闭合，空数组断言实为 self-checks/editor.js:422 | 否 |
| 8 | 实施步骤 5 | 「playwright 按测试计划逐条断言 A1-A6」→「按测试计划逐条验证（手段列：自检 / 浏览器 / 命令）」 | A6 手段仅自检、构建项为命令，原表述超出测试计划手段列 | 否 |
| 9 | 未解问题 1 | 补「若剔除 color 增项，`isPlainTextColumn` 的 color 条件与 A4 text+color 断言一并省略」 | 保持未解问题与改动清单/测试计划一致 | 否 |

## 未解决异议（累计）

无。
