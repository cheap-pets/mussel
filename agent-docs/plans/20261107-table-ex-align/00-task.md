# 任务：table-ex 单元格文本/图标对齐 —— 实测字体度量改进

## 目标
实现更完善的 table-ex 单元格文本与图标对齐：用运行时实测的字体度量与图标渲染高度参与位置计算，消除不同系统（字体渲染/DPI/字体回退差异）下文本、图标位置的偏差。

## 基线
- 分支 dev @ 095cfdf（快照 2026-11-07）：工作区改动集中于 AGENTS.md 与 agent-docs/**（知识库维护、旧 plans 删除），与本任务无关，不纳入产物核对范围；源码无未提交改动。

## 流水线（用户指定）
primary 设计(D1) → peer 修订(X=design-amender) → primary 最终修订(R=designer 修订模式) → (fast 实施(I1) → fast 检验(I2)) × n，n ≤ 2
- 设计阶段任意轮次后如有疑问/未解问题 → 停下等人工确认再继续；设计结论不可行 → 直接停止流水线。
- 设计完成且无未解问题 → 直接进入实施（用户预授权，不停顿）。

## 预设与开关
- standard 预设；评审方式：交叉（用户指定，仅一轮 X→R，无 X 复审）；实施粒度：整体；修复轮 R=1（键：整体，即 n≤2）；规范审查关、TDD 关、逐片验收关、并发 1。

## 槽位映射
- designer → pipeline-primary；design-amender → pipeline-peer；implementer → pipeline-fast（用户指定，覆盖默认 Primary）；verifier → pipeline-fast
- 评审模型：异构；验证：独立实例（fast 槽）

## 约束（用户要求）
1. 参考方案仅供参考，设计者自行找最优方式达成目标：
   - 表格绘制前用当前绘制字体/字号/典型 CJK 字符实测高度，同字体+字号已有测量则不重复测。
   - 每个字体图标绘制前实测渲染高度，字号未变化则不重复测。
2. 充分考虑性能：与既有测量/渲染环节（widthCache、measureText 调用、relayout 时机）协同，不得引入逐帧/逐行重复测量等隐患。
3. 须明确回答：测量数据是否适合保存为全局（结论 + 理由）。
4. 测量方案确定后，须复核现有对齐位置算法是否需要调整（结论写入设计）。
5. 结论不可行 → 立即停止流水线（designer 返回"不可行"）。

## 验收标准
1. 文本垂直定位基于运行时实测字体度量（非硬编码常数/平台默认值）；同字体+字号测量有缓存，不重复测量。
2. 图标绘制定位基于实测渲染高度；字号未变化时不重复测量。
3. "测量数据是否全局保存"有明确设计结论，并按结论落实。
4. 现有对齐算法已按测量方案复核，需调整处已调整（设计文档记录复核结论）。
5. 性能：相对基线 measureText 总调用次数无显著增量（方法见知识条目 table-ex-performance-profiling），无每次绘制重复测量。
6. 既有 table-ex demo 页面绘制/交互无回归（自检 + demo 页验证）。

## 验证命令与环境
- lint：npx eslint（口径限 src 与 demo/src；.eslintignore 已含 demo/dist）
- 浏览器验证：demo watch 服务 3000 端口（rollup watch + serve）；playwright mcp 优先，先直接访问不打包；页面路径以知识条目为准（/data/<name>/）
- 性能验证：按知识条目 table-ex-performance-profiling（劫持 measureText/setTransform 计数 + lastRelayout 归因）

## 必读知识（按角色取用）
- INDEX-table.md 相关条目，尤其：table-ex-structure-map.md（设计前必读）、canvas-text-optical-centering.md（现状：alphabetic 基线 + fontBoundingBox 半差锚）、table-ex-item-column-align.md、table-ex-performance-profiling.md、table-ex-recordsversion-height-contract.md；验证者另读 canvas-pixel-assert-anchor-drift.md、table-ex-demo-interaction-verify.md、demo-watch-new-entry-restart.md

## 预算
- 预估派发 7（D1+X+R=3；I1+I2=2；修复+复验=2）；派发上限 11。
- 设计修订 k/N：1/1；修复轮 整体 k/R：0/1；回设计/回方案 j：0/2；派发 d：5/11。
