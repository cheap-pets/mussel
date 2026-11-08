# 实施记录（修复模式，第 1 轮）

输入：05-verify-1.md FAIL 项 1（唯一失败项）。基线：branch dev @ e6354ee（工作区含 04-impl 已落地改动，未推翻任何已通过项）。

## 改动文件

- `demo/src/data/table-ex/self-checks/interactions.js`（377-403 用例）— 修复问题①：`[interactions]resolvePointerdown` 4 组 `Object.values` 断言由旧 2 键形状同步为新 3 键形状 `[commitEditing, committedEditCell, startResize]`（`[true,null,false]` / `[false,null,false]` / `[true,null,true]` / `[false,null,true]`）；注释补返回形状说明与 `editingCell` 未传时 `?? null` 归一事实；用例 return 摘要句补"快照键随返回"。断言风格（`Object.values` 数组）与文件既有惯例（如 resolveCellClickOpen 用例）保持一致，未改断言机制。

未改 `src/components/table/ex/interaction/hit-test.js`（修复范围第 3 条：实现语义不动，A3 门控已被 05-verify-1 终验运行时证实 PASS）。

## 偏离

无。

## 自检

- 波及面全扫（修复范围第 2 条）：`git grep -n "resolvePointerdown\|committedEditCell\|commitEditing\|startResize" -- demo/src src` → 断言侧依赖 `resolvePointerdown` 返回形状的唯一位置即 interactions.js:377-403（已同步）；src 侧消费方 use-pointer.js:281-286 按**具名键**取 `decision.commitEditing/committedEditCell/startResize`，对键数不敏感，无需改；interactions.js:684 与 layout.js:269 的 `startResize` 为列宽拖拽链（resolveResizeWidth/use-column-resize）注释，与该返回形状无关（已读上下文确认）。
- eslint（全局 8.57.0）：`npx eslint demo/src/data/table-ex/self-checks/interactions.js` → exit 0，0 problems。
- 静态核对（最小实验）：node 从 hit-test.js 真实源文件逐字提取 `resolvePointerdown` 函数体求值，与 interactions.js 用例中实际提取的 4 组调用/期望数组对跑 → 4/4 PASS（首跑 4 FAIL 为验证脚本空白比较 bug，规范化后全过，非代码问题）。
- 未运行浏览器复验：归验证槽位（00-task 流水线 (free 验证 → free 修复)×n，修复后必复验）。

## 遗留

- 页面"自检结果"面板 243/243 待复验确认（复验入口见 05-verify-1.md 验收入口：http://localhost:3000/data/table-ex/ 带 cache-bust）。
- 04-impl.md 遗留不变：文档三处旧名（禁改，decisions 已确认）、知识库 table-ex-structure-map.md 旧名（归收尾知识沉淀）。
