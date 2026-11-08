# 任务简报：cell-button 颜色调整

## 流水线与槽位
- 流水线：自定义（用户指定）：primary 修改 → fast 验证；未授权修复循环（验证 FAIL → 停下汇报）。
- 槽位：primary = pipeline-primary（implementer）；fast = pipeline-fast（verifier，独立实例）。

## 目标
table-ex cell-button（canvas 绘制的格按钮）颜色调整：
- 默认（cell hover 中、指针不在按钮区）：--mu-text-color-soft 对应主题色。
- hover（指针落在按钮区矩形内）：primary 主题色。

## 基线
- branch dev @ e6354ee；工作区含上一轮 cell-button 任务未提交改动（17 代码文件 + 知识库，已终验 PASS，见 agent-docs/plans/20261108-cell-button/）。
- 本轮在其上继续；范围核对以"本轮新增改动"为准，基线脏文件不计为设计外改动。

## 验收标准
- A1 默认态图标颜色 = --mu-text-color-soft 主题色值；指针在按钮区内 = primary 色值（页面像素断言）；指针移出按钮区恢复默认色、移出 cell 按钮消失。
- A2 颜色经主题快照既有通道获取，不硬编码 hex/rgba（项目约定禁硬编码颜色）；如需新增快照键仅限只读新增并在实施记录说明，不改既有键语义。
- A3 非按钮绘制路径（icon 列、条目按钮、其他 overlay 元素）颜色不受影响；self-checks 面板全绿，涉及颜色/绘制的既有断言如受影响须同批同步。
- A4 npm run build exit 0；eslint 改动文件 0 新增（存量报错须区分）。

## 验证命令
- npm run build
- eslint src demo/src（全局 8.57.0）
- demo 运行时：http://localhost:3000/data/table-ex/（cache-bust）；期望色值经页面 getComputedStyle 读 CSS 变量现算，不硬编码期望 RGB；像素扫描断言字形颜色切换。

## 验证环境
- demo 服务运行中（:3000）；playwright mcp 可用（上一轮已验证）。
- demo watch 对编辑器写入不触发重建（知识）：若改动未生效，touch 改动的 demo/src 文件（仅 mtime）并记录。

## 约束
- 纯 JS；颜色一律走 --mu-* 变量映射的主题快照值。
- 实施定位输入：上一轮任务目录 01-explore.md / 04-impl.md（含 paintCellButton / drawIconGlyph / 主题快照 / isCellButtonHit / cellButtonRectOf 链路锚点）。
- "hover" 释义（调度判定）：指针落在 cellButtonRectOf 按钮区矩形内；按钮仅在 cell hover 时绘制。

## 预算
- 预估 2（修改 1 + 验证 1）；上限 3。修复循环未授权：验证 FAIL → 停。
