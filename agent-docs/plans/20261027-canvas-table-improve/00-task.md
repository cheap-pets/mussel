# 任务：canvas-table 改进（dev）

## 流水线

dev（S1 探索 → S2 设计+审核 → S3 确认门 → S4 实施+验证）。
S1 单 explorer：8 项问题集中在同一组件目录、子域强耦合，不拆并发探索。

## 目标

按下列 8 项问题清单改进 MuCanvasTable（`src/components/canvas-table/`）。

## 问题清单（用户请求原文转录）

1. 内容垂直居中偏上了一点，可能计算空间包括了单元格边线。同时检查水平居中时是否也有类似问题。多行文本时，首行需与居中的单行文本 top 对齐。
2. 顶部滚动阴影位置不对，应该在 header 下沿，现在在整个 table 顶部。
3. 可编辑单元格，去掉 hover 边框、输入框边框与单元格的间距，改为直接覆盖单元格区域。即：hover 边框与单元格边框重叠。进入编辑状态后，输入框尺寸、内间距与单元格一致，输入框边框也直接与单元格边框重叠。
4. 部分列类型不可支持编辑，如链接、按钮、标签、进度等。
5. 列定义中增加自定义编辑按钮定义（仅支持图标，仅支持一个按钮），hover 时显示在单元格最右侧（垂直居中对齐）。点击行为由用户自主定义。
6. 布尔值编辑时，使用的开关组件有不必要的白色背景。检查其他组件是否有类似问题。
7. 检查下按钮、链接的 hover 样式，包括鼠标光标形状，按需修改。
8. 树排序未生效。树排序按同级子节点排序，不跨节点排。评估树排序性能成本，若成本过高，树状态不支持排序，且不要显示排序箭头。
9. （检查点补充）当表格宽度超出所有单元格宽度时，最后一列增加单元格右侧边框，包括列头。

## 验收标准

- A1（问题1）垂直居中不受单元格边线 1px 影响：单行文本视觉中心 = 单元格内容区（不含边线）几何中心；水平居中同规则核查并修复。对齐口径为**列级**（检查点人工意见 1）：多行文本列与多行链接列整列垂直 top 对齐（文字 top = 内容区顶 + padding）；其余列按内容区中心垂直居中。
- A8（问题8，检查点裁决 A 案）树数据排序：同级子节点内排序生效、不跨节点（demo 树场景数据源接排序产物）；树态排序箭头正常显示；附树排序性能成本量化结论（demo 测量夹具实测回填）。
- A2（问题2）顶部滚动阴影出现于 header 下沿（贴 header 底边、不覆盖 header），而非 table 顶部。
- A3（问题3）可编辑格 hover 边框与单元格边框重叠、无附加间距；编辑态输入框覆盖整个单元格区域：外框与格边框重叠、内间距与单元格内间距一致。
- A4（问题4）链接、按钮、标签、进度等展示型列类型不可进入编辑态。
- A5（问题5）列定义支持自定义编辑按钮（仅图标、仅一个）；单元格 hover 时按钮显示于格内最右侧、垂直居中；点击触发用户自定义回调。
- A6（问题6）布尔值编辑开关无多余白色背景（融入单元格）；其余编辑用组件同类问题一并核查修复。
- A7（问题7）按钮、链接 hover 样式核查并按需修改，鼠标光标形状正确。
- A9 回归：demo 自检面板既有断言全数通过（以运行时面板实际总数为准：上轮记录 144，静态清点 147，运行时口径由 verifier 确认；实施新增断言后为新基线，须全通过）。
- A10 `npx eslint src/components/canvas-table/ demo/src/data/canvas-table/` 0 error 0 warning；`npm run build` 成功。
- A11（问题9）表格宽度 > 列宽总和（存在空白区）时，末列右侧绘制 1px 列边框（含表头），与既有列线同色同口径；无空白区时维持现状（末列右缘不画线）。

## 验证命令

- lint：`npx eslint src/components/canvas-table/ demo/src/data/canvas-table/`（基线 0 error / 0 warning）
- 构建：`npm run build`
- 浏览器：demo watch 已在 3000 端口运行，改动后须等 watch 重编译完成再验证
  - 页面与自检面板：http://localhost:3000/data/canvas-table/

## 基线

- 分支 `mussel-table` @ `3d41296`，工作区干净。
- 杂散未跟踪文件 `agent-docs/handoff/.!42003!handoff-create-dynamic-component-20261017.md`（如仍在）：与本任务无关，勿动。
- 本仓库 `.pipeline/` 有已跟踪先例（20261023 / 20261025 / 20261027-fixes 均入库），不提示 gitignore；本次任务目录保持未跟踪，是否收录由用户决定。

## 验证环境

- demo watch（vite build --watch + 3000 端口静态服务）由外部启动；无需也不得再启停服务。
- 浏览器验证用 playwright MCP；canvas 像素断言可在页面 JS 上下文执行（getImageData）。
- 无测试框架；组件行为经 demo 页面验证。
- 无凭据。

## 角色映射

- explorer → `pipeline-explorer`（已注册，副本正文校验通过）
- designer → `pipeline-designer`（GLM-5.3）
- 评审角色 → `pipeline-design-amender`（deepseek-flash；与 designer GLM-5.3 模型不同，用户在评审方式选项中确认）
- implementer → `pipeline-implementer`
- verifier → `pipeline-verifier`

## 开关

- 并发数：3
- 评审方式：交叉（用户选定）
- 修订轮数：1（用户选定；交叉计法 = 初始设计 + C 审改 1 次）
- 自动：off（确认门停下）
- 设计复核：off
- 实施循环上限：3 轮（流水线默认）

## 约束

- 允许改动：`src/components/canvas-table/**`、`demo/src/data/canvas-table/**`；其余源码、文档（skills/、docs-site/、docs/ 未经用户确认）、构建配置、依赖禁改。
- 不得回退既有性能优化：text-wrap 共享 ellipsize 缓存、hover 脏区去重、paintFixedArea 行区间收敛、估高扫描签名跳过。
- 纯 JavaScript；BEM、`--mu-*` 变量约定（AGENTS.md）。
- 角色不执行 git commit / push。

## 背景资料

- `agent-docs/plans/20261025-editable-table/`（可编辑表格功能的设计与实施，`02-design.md` 较大，按需检索）
- `agent-docs/plans/20261027-canvas-table-fixes/`（上一轮六项缺陷修复 + eslint 清零）
- `agent-docs/knowledge/patterns/canvas-table-performance-profiling.md`（性能验证方法）
