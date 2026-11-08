# 任务简报：table-ex edit-button → cell-button

## 流水线与槽位
- 流水线：自定义（用户指定）。顺序：探索(free) → primary 修改(直修) → (free 验证 → free 修复)×n，n<3。
- 槽位映射：primary = pipeline-primary（implementer，直修）；free/fast = pipeline-fast（explorer / verifier；修复轮为 implementer 修复模式，用户指定覆盖默认槽位绑定）。
- 修复轮上限 R=2（即 n<3）；每轮修复后必须复验，验证最多 3 次；所有派发均为全新独立实例。

## 目标
table-ex 的 edit-button 功能调整：
1. 改名为 cell-button，对外事件名同步更名。
2. 图标仅支持已安装图标（项目实际安装的图标集）。
3. 进入编辑态后不显示该按钮。

## 基线
- git：branch dev @ e6354ee，status clean（2026-11-08 建目录时记录）。

## 验收标准
- A1 命名与事件：src 与 demo/src 中 edit-button 及其事件名全部更名 cell-button，无旧名残留（grep 全扫为证）；不改无关文件、不重构。
- A2 图标白名单：探索证实现状已满足（resolveIconEntry 注册表查表：未注册不绘制、不命中、dev warn 一次保留），无代码改动；验证仅需确认无回归（页内 self-checks resolveIconEntry 注册/未注册用例通过 + demo 无运行时报错）。
- A3 编辑态隐藏（用户裁定：仅被编辑格）：格 X 处于编辑态期间，X 自身按钮不绘制、点击不可触发（改名后）cell-button-click 事件；其他格按钮行为不变；退出编辑后恢复。时序事实：编辑格 pointerdown 先 commit 再走 click 决策链（use-pointer.js:265-269 → hit-test.js:146-151），门控须在该时序下仍成立。
- A4 `npm run build` 通过；eslint（口径 src demo/src，全局 8.57.0）无新增错误。

## 验证命令
- npm run build
- eslint src demo/src
- demo 运行时验证（浏览器）：http://localhost:3000（知识：实际路径前缀 /data/<name>/，访问需 cache-bust 参数；页面路径以探索报告为准）

## 验证环境
- demo 服务：rollup watch + :3000（可能未运行；起不来 → 相关标准标 UNVERIFIED 环境阻塞，不降级判 PASS）
- 浏览器工具：playwright mcp；子智能体不可用 → 标环境阻塞

## 约束
- 纯 JS、Composition API、BEM mu- 前缀、--mu-* 变量；不新增依赖。
- 不改 docs-site / docs / skills 文档（项目规则：实现经用户确认后才更新文档）。
- 实施前先读 agent-docs/knowledge/project/table-ex-structure-map.md（知识索引指定）。

## 预算
- 预估派发 5（探索1+实施1+验证1+修复1+复验1）；派发上限 8。
- 修复轮：整体 k/R = 1/2；派发 d/上限 = 5/8。
