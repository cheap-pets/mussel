# table-ex striped 行背景越界绘制修复

## 目标

table-ex 开启 striped 时，若所有列宽度之和 < 表格宽度，striped 行背景被绘制到超宽区域（最后一列右边界之外的空白区）。修复为：striped 行背景只绘制到列内容区宽度（各列宽度之和）为止，超宽区域保持表格底色，不出现 striped 色块。

列总宽 ≥ 表格宽（出现横向滚动）时行为不变。

补充（用户追加并澄清）：窄列情况下（列总宽 < 表格宽）发生滚动时，head 区绘制的滚动阴影越界——阴影越过列内容区右边界画入超宽空白区；并非超出整个表格区域之外。修复口径与 striped 收口一致：阴影止于列内容区右边界。

## 流水线与槽位

- 临时组合：(primary 修复 + fast 检验) × n，n ≤ 2；检验 FAIL → 修复再检，最多 2 轮
- implementer → pipeline-primary（定位 + 修复一体）；verifier → pipeline-fast（全新独立实例，独立于 implementer，不接收其推理/自检结论）
- 验证：独立实例。预设：lite 口径（无设计/评审环节）；并发 1

## 基线（建目录时 git status --short 快照）

- 修改 9：agent-docs/knowledge/project/table-ex-performance-profiling.md、demo/src/catalog.js、demo/src/common/demo-page.vue、demo/src/common/style.css、demo/src/data/table-ex-basic/main-view.vue、demo/src/data/table-ex-scene/main-view.vue、demo/src/data/table-ex/main-view.vue、demo/src/data/table-ex/self-checks/text-wrap.js、todo/misc.md
- 未跟踪 3：agent-docs/plans/20261107-table-ex-estimate-opt/（2 文件）、demo/src/data/table-ex-benchmark/
- 分支 dev。以上均为既有工作区改动，与本缺陷无关，不得回退。

## 约束

- 纯 JS；改动限 src/ 内 table-ex 相关文件，最小改动，不顺手重构
- 不改组件对外 API；颜色/间距用 --mu-* 变量，禁硬编码
- 自检断言与绘制特征同批漂移时，按知识条目 canvas-pixel-assert-anchor-drift 处理：grep 旧值全扫 self-checks 后同步修正断言，不伪装缺陷
- 不执行 git 提交；未经用户确认不更新文档（skills/docs-site/docs）

## 验收标准

1. 列总宽 < 表格宽：striped 行背景止于列内容区右边界，超宽区域无 striped 色块
2. 列总宽 ≥ 表格宽（横向滚动态）：striped 绘制行为与修复前一致
3. demo 页自检全绿（自检结果 x/x 通过）
4. 窄列（列总宽 < 表格宽）+滚动态：head 阴影止于列内容区右边界，超宽空白区无阴影色块；非窄列态阴影行为不变

## 验证环境与命令

- demo watch + :3000 serve 已在运行，直接访问 http://localhost:3000/data/table-ex/，不重新打包
- 自检入口：页面"自检结果"块（`demo/src/data/table-ex/self-checks/index.js` 的 runChecks）
- 像素断言建议：playwright 访问 demo 页，canvas getImageData 采样列总宽右侧区域，断言非 striped 色（striped 为 canvas 绘制，getImageData 可读）
- 产物级校验（如需）：npm run build

## 预算

- 派发上限 d = 5（首轮修复 1 + 补充修复 1 + 检验 ×2 + 追加修复轮 1）
- 修复轮键 `整体`：R = 1（第二轮修复）；耗尽停下汇报
