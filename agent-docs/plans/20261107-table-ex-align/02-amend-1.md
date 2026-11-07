# 02-amend-1 交叉回应（designer，r=1）

## 交叉回应（第 1 轮）

对 06-amend-1.md 改动台账实质改动逐条回应；非实质改动（#1/#2/#3/#5/#6/#7/#8/#9）抽查证据均成立，融入设计正文，无需逐条回应。未解决异议（累计）：无；无人工意见文件。

| 编号/位置 | 结论 | 修改说明或理由证据 |
|---|---|---|
| #4 改动清单 self-check 行 | 接受 | 断言口径改为冷串/前置 + 计数协议，已融入改动清单与测试计划；证据核实：runChecks 顺序执行（self-checks/index.js:44 起） |
| #10 测试计划 行1 | 接受 | 核实 `14px sans-serif` 已被预热（self-checks cell-painters.js:235 `CELL_FONT`）；`13px` 全 demo/src 0 命中，冷串成立；A=2/B=1 协议与能力探测实例位（cell-text.js:56-58）+ 探针化改动自洽 |
| #11 测试计划 行2 | 接受 | 核实 demo/src 无 `19px`（冷字号）、`●` 仅用于夹具断言（cell-painters.js:2250-2268）不涉绘制；16/20 预热属实（main-view.vue icon 列缺省 16 / iconOption size 20，795-802 区域）；探测字符 `永` 与 glyph `●` 计数可分离 |
| #12 测试计划 行4 归属 | 接受 | "片2 + 终验"已写入；表头两站点调整在步骤 4 落实，符合切片归属规则 |
| #13 测试计划 行5 | 接受 | fonts loaded 前置 + 首帧定义已写入；demo/src 与 src 均无 `@font-face`（grep 0 命中，仅 icons/index.js:23 注释提及），取数口径可行 |
| #14 测试计划 行6 | 接受 | catalog.js:117（basic）、:122（scene）两页登记属实（台账写 127 为行号偏差，不影响结论）；已并入终验回归范围 |
| #15 实施步骤 步骤2 判据 | 接受 | 与 #10 同口径，判据 A=2/B=1 已写入 |
| #16 实施步骤 步骤4 判据 | 接受 | grep 实测：`textBaseline = 'middle'` 仅 cell-painters.js:67、paint-header.js:79/:137；cell-text.js 无赋值（回退是返回 baseline，cell-text.js:79-81），判据正确 |
| #17 实施步骤 步骤5 | 接受 | `glyphAnchorOffset` 助手与 19→21 计数判据已写入，与 #11 同口径 |
| #18 实施步骤 步骤6 | 接受 | 全量 lint（src/components/table/ex + demo/src/data/table-ex）与 basic/scene 首屏回归已写入，对齐 00-task 验证命令 |

接受后一致性终检：方案概述 / 接口块守卫与探测说明 / 复核表 8 站点 / 测试计划 / 实施步骤 / 风险与回滚各节相互一致；headerFontOf 500 字重（paint-header.js:38-40）与复核表描述相符。设计正文无需进一步修改。

## 偏离处理

无（本轮为交叉修订，非实施偏离）。
