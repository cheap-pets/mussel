# 实施记录 — G1-a 纯函数基建

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/canvas-table/text-wrap.js` | G1-a | 前次中断执行已产出完整实现（tokenize / estimateLineCount 短路 / wrapLines 贪心折行 + maxLines 钳制 / createWrapCache；溢出字符 = `'...'` 按实施约束 4）。本轮核对设计 A2.2/A3.5 后仅修正 tokenize JSDoc 的空白规则描述（实际行为 = 空白并入后续词词首，原注释"并入前一个 token"与代码相反） |
| `src/components/canvas-table/row-geometry.js` | G1-a | 前次中断执行已产出（uniform/variable 几何 + Fenwick + computeRowHeights/ensureRowMeasured/computeAnchorShift）。本轮两处设计口径内修正：① `isTextPresentingColumn` 排除 link（设计 A2.2/A3.5：文本呈现列不含 link，原实现会使 link 单条数组误触发 hasArrayValues）；② `computeRowHeights` 的 link 列 hasArrayValues 复用已求得的条目计数（`count > 1`），消除每格对 `_render` 的重复调用（估高计数 + 模式判定各调一次 → 单次） |
| `src/components/canvas-table/tree.js` | G1-a | 前次中断执行已产出，本轮逐条核对 A2.4 + 实施约束 9（buildChildrenIndex O(n)、buildFlatRows 迭代 DFS/visited 防环/孤儿挂根/hasChildren 平行数组、resolveInitialExpandedKeys 受控优先 + 内部 BFS 计层不依赖 buildFlatRows 产物 + `level <= defaultExpandLevel` 0-based、toggleKey 纯函数）——实现正确，无改动 |
| `demo/src/data/canvas-table/self-checks/text-wrap.js` | G1-a | 前次中断执行已产出 10 条断言。本轮修正 3 处与实现不符的期望：tokenize 空白形态（`['hello',' world']` / `['a1b2',' c']`，原期望尾随空白形态自相矛盾——同文件 '中文 english' 用例即为前导形态）与 wrapLines 拉丁词折行结果 |
| `demo/src/data/canvas-table/self-checks/row-geometry.js` | G1-a（新建） | 12 条断言：uniform 与等高算式及 `layout.computeViewRows` 恒等（5 组 scrollTop 含非行对齐 1800018）；variable topAt/totalHeight/offsetToRow/visibleRange 与测试内朴素参考实现随机对照（LCG 种子确定性、整数高度 1000 行、50 次单点更新 Δ、30 组窗口 + 包含性）；rebuild 一致与空集合/越界安全；computeAnchorShift；computeRowHeights 零测量估高 + 数组值 `min(length, maxItems)` 真值 + hasArrayValues 四态 + link `min(render 计数, maxItems)`（含 render 每格单次调用回归）；ensureRowMeasured 短路零测量 + maxLines 常量钳制 + `_resolveMaxLines(record)` 函数形态行级求值（deep?3:1 两 record 各自 70/36）；treeIndents(colIndex, row) 参数顺序断言 + inset 仅扣树形列（含无树对照 36 与非树形列 36 回归）。夹具按实施约束 2 手写 `_maxLines`/`_resolveMaxLines`/`_maxItems`/`_render`，零 prepareColumn 依赖 |
| `demo/src/data/canvas-table/self-checks/tree.js` | G1-a（新建） | 8 条断言：childrenIndex（同父出现序 + hasChildren 集含孤儿父键 42）、DFS 展开序/层级/hasChildren 平行数组/parentKeys（含"2 未展开 → 21 隐藏"语义）、全收起仅根 + 孤儿挂根、环防护（纯环 A→B→A 终止 + 根+环不扩散）、字段名可配（code/pcode）、defaultExpandLevel 0/1/2/−1/缺省、受控优先直返 + 深链 BFS 计层独立于平铺产物 + childrenIndex 复用、toggleKey 不写回入参 |
| `demo/src/data/canvas-table/self-checks/index.js` | G1-a | 聚合注册 6 → 9 组（text-wrap / row-geometry / tree），模块头注释 G 编号按当前实施步骤表同步（G1-a / G1-b / G2 / G3） |

## 偏离

- **现状发现（非设计偏离）**：派发时工作区已存在前次中断执行的 G1-a 部分产物（3 个 src 新文件 + `self-checks/text-wrap.js`，但 `self-checks/row-geometry.js`、`tree.js` 缺失、`index.js` 仍为 6 组）。本轮按现状校验、修正并补齐，未重写已验证正确的部分。
- **row-geometry.js 两处代码修正**（见改动文件表）：属设计 A2.2 文本呈现列定义与"render 为轻量数组构造"语义的落实修正，不改变设计接口与行为契约。
- 其余无偏离，未触发 BLOCKED 条件。

## 自检

- demo watch（`npm run demo:build`，vite build --watch + :3000）构建通过：`demo/dist/data/canvas-table/main.js 196.20 kB`，0 error（过程中一次 `assertArrayEqual` 重复声明 PARSE_ERROR 为本轮中间态，已修复后构建恢复）。
- playwright 访问 `http://localhost:3000/data/canvas-table/` 自检面板：**107 条断言 0 失败**；text-wrap（10）/ row-geometry（12）/ tree（8）三组全部出现且全绿——G1-a 完成判据满足；既有 theme/layout/cell-painters/painter/interactions/editor/data 组全绿不受影响。
- 调试过程中出现过的 4 处断言失败均为测试期望/夹具错误（tree 展开集漏算 21 隐藏、孤儿 parentKeys 实存原始 parentKey 42、treeIndents 单列表夹具键列错误、visibleRange 包含性端点越界），实现本身无失败。
- 项目无 JS lint/typecheck 配置（package.json scripts 仅 build/demo:build/docs/pub，无 eslint 配置；本轮无 scss 改动不涉 stylelint）；编译验证 = rollup watch 构建。

## 遗留

- :3000 demo watch 原未运行，本轮已后台启动并保持常驻（后续步骤直接访问，勿重复起服务）。
- 自检随机对照使用固定种子（LCG 48271，seed 20261025/36/777），结果可复现；如需更强覆盖可调种子重跑。
- 约束应用备忘：约束 2（夹具手写内部列字段）✓；约束 4（maxLines 溢出字符 `'...'`，text-wrap 既有实现与断言一致）✓；约束 6（contentWidth = 列宽 − 2×padding − 16×level+16，padding 缺省 8，treeIndents 断言覆盖）✓；约束 9（resolveInitialExpandedKeys 首次入场解析语义，供 G3 壳消费）✓。G2/G3 消费侧接线不在本步范围。
