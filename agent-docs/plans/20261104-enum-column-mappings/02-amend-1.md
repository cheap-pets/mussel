# 交叉回应（designer，第 1 轮）

输入：`06-amend-1.md`（VERDICT: AMENDED；台账 9 条，其中实质改动 #1/#2；未解决异议累计：无）。台账引用的全部源码证据已逐项复核属实。

## 交叉回应（第 1 轮）

| 编号/位置 | 结论 | 修改说明或理由证据 |
|---|---|---|
| 台账 #1（实质）：`isPlainTextColumn` 补 `column.color == null` 短路条件 | 接受 | 复核属实：短路产物仅 `{ text: value }` 无 color（`src/components/table/ex/cell-painters.js:226`），自检 content() 同链（`demo/src/data/table-ex/self-checks/cell-painters.js:95-97`）；审改员已落实到设计四处（方案概述 3 / 改动清单 `ex/cell-painters.js` / 接口节 `isPlainTextColumn` / 测试计划 A4），与 A4 断言自洽，无需再改 |
| 台账 #2（实质）：改动清单 `self-checks/editor.js` 补「编辑器解析」块 :118-210 同步 | 接受 | 复核属实：`demo/src/data/table-ex/self-checks/editor.js:127`（text+mappings → select）、`:132`（enum → input）、`:136-143`（非法 editor.type + mappings → select）、`:202`/`:205`（MuSelect 身份与直调断言）实现后必失败；改动清单与测试计划 A5/A6 已含该块，无需再改 |
| 台账 #3-#9（非实质） | 接受 | 逐条核对无异议：#3 旧 `enum.js:28` default 兜底与数组 mappings 下标键、`mappings.js:55` null 直落属实；#4 见下方精度修正；#5 `self-checks/cell-painters.js:773-795`/头注释 :3-8 属实；#6 `ex/layout.js:16-21`、`ex/spans.js:31-44/357-363` 属实；#7/#8/#9 引用与表述核实无误 |
| 附 1（对台账 #4 风险条目的精度修正） | 接受（描述已修正） | 原表述「`demo/src/data/table/main-view.vue:108-150` 均为 text+mappings」不精确：:111/:113/:135/:150/:151 为 bool+mappings / number+options，本就不映射、行为不变；:136 为 `type: 'enum'` 列（现回退 TextColumn，恢复后经 EnumColumn 映射显示不变、align left→center、不再输出废弃警告——DOM 侧 push 消费对产物形态无要求，`base/table-row.vue:63-64`）；实际显示原值的仅 :109/:149 无 type+mappings 列。已在 02-design.md「风险与回滚」该条修正 |
| 附 2（交叉核对中发现，自检完善） | 接受（伪代码已对齐） | 接口节 EnumColumn 伪代码 dom 通道 `style: mStyle` 裸值与 TextColumn 数组形态（`text.js:36` `itemStyle = [mStyle]`）不一致，虽两态 DOM 均可落地，为可直接实施已改为 `style: [mStyle]` 并注明同 text.js:35-38 |

未解决异议（累计）：无，无需回应。decisions.md D1（A4 解释为 text 新增 `column.color`）维持，本轮所有修改与之不冲突。
