# table/table-ex 批①缺陷修复 + 批②同源收敛

## 目标

按 design-input.md（用户确认方案 + peer review 修正）实施 4 项缺陷修复（B1/B2/B3/B4）与 2 项同源收敛（C1/C4），行为等价红线见 design-input.md「不做清单」与各条目红线段。

## 基线

HEAD 710d515 @ dev；基线脏文件 0 个（init 检出的 2 个为任务目录自身文件）；详见 00-baseline.txt

## 验收标准

1. B1：tag 列条目数 >10 且第 10 个真实绘制时，点击第 10 个 tag 的 `cell-item-click` payload 为该 tag 对象（非 `'...'`），`onItemClick` 正常触发；link/list 列 dots 行为不变
2. B2：打开 text+multiline 可编辑格，用户函数形态 `lineClamp` 回调收到真实 record（非 undefined）、不抛 TypeError；`editorType` 单次求值（双口径消除）
3. B3：`<mu-table>` 省略 columns 或 `:columns="[]"` 渲染不抛 TypeError
4. B4：列宽拖拽中派发 `pointercancel` 后：window 监听释放、调宽参考线清除、宽度按当前值提交（对齐 resize-shared.js 语义）
5. C1：六处取值链改引 `utils.js` 的 `readCellValue(col, record)`；不吞 `_mapText`，spans 分组键语义不变
6. C4：三处 orderBy 解析改引 `utils.js` 的 `parseOrderBy(orderBy)`；只替换第一个冒号的语义保留，null/undefined 入参行为不变
7. 全量：`npm run build` 通过；`npx eslint src/components/table demo/src/data/table-ex` 零新增告警；demo self-checks 输出与基线逐字一致（新增断言除外）

## 验证命令

- `npm run build`
- `npx eslint src/components/table demo/src/data/table-ex`
- demo self-checks：http://localhost:3000 table-ex demo 页（rollup watch 常驻）

## 验证环境

- demo 站 :3000（开发模式常驻，先直接访问确认可用）
- playwright MCP（浏览器交互断言）

## 忽略路径

dist/

## 开关与策略

临时组合（用户指定）：primary→implementer，exec→verifier；修复轮上限 R=2；无设计评审、规范审查关、TDD 关、不 commit（项目约定无明确要求不提交）
