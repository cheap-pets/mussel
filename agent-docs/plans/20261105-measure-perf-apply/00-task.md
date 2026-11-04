# 任务：table-ex 测量性能优化方案交叉修订 + 实施（按列类型变更后现状）

## 目标
1. 以源方案 `agent-docs/plans/20261104-table-ex-measure-perf/design.md`（副本为本目录 `02-design.md`）为基础，按列类型变更（commit b3528d7）后的实现现状交叉修订；修订作用于副本。
2. 方案可行则按修订后设计实施；不可行则停下汇报，不实施。

## 源方案概要
P1 滚动帧跳过已精算行（含 recordsVersion 失效补链）；P2 估高免无效求值（图形列免 valueOf / !precise 提前 / 免算宽 / 列级描述表）；P4 tokenize 码点判定 + shrinkToFit 二分；P5 循环外提 + visibleRange 直加。

## 列类型变更后必须核对的影响面（b3528d7）
- link 列重写为 list 兼容壳（注册表层委托，col.type 不变）：link 列渲染条目竖排每项一行，旧方案"link 列行数恒 1 / 不含 link 于 GRAPHIC_ITEM_TYPES / link 只计数不建条目"的论据全部失效，需按 list 条目列重估。
- 新增 list 列类型（数组条目列，column 级 link 选项）。
- text 列新增 link 选项（链色文本，单行不变）；text 列不再接受数组（canvas 拆行路径删除，落占位链恒 1 行）——P2-4 文本列估高三分支表达式的数组分支需改写。
- table-ex 除 list 外其他列一律不支持数组。
- 本次已改动：cell-painters.js、row-geometry.js、editor.js、interactions.js、table-ex.vue、column-types/{index,link,list,text}.js、demo self-checks×3——源方案全部行号引用漂移，修订须逐一重核。
- 源方案"不触碰 cell-painters.js"等边界须按新现状复核。

## 基线
分支 dev @ b3528d7（列类型变更已提交）；建目录时 `git status --short`：仅未跟踪 agent-docs/plans/ 三个任务目录，源码干净。

## 约束
- 纯 JS；Composition API；BEM；--mu-* 变量禁硬编码
- 不得执行 commit/push/stash/checkout/reset/clean；不得安装依赖
- src/styles/link.scss 已随 b3528d7 提交，无遗留基线脏文件
- 行为冻结目标不变：行高/格线/折行结果与现状相同（P2-1 0/1 边界例外）

## 验收标准（修订后按此验收）
- B1 demo 自检全绿：`http://localhost:3000/data/table-ex/` 重跑自检含新增 controller 自检模块 0 FAIL（含本次列变更既有 201 项）
- B2 `npm run build` 通过；eslint src 口径零 error；`npx stylelint "src/**/*.scss"` 零报错
- B3 playwright 冒烟：multiline 滚动锚定（格线不跳）、编辑提交行高重估、树展开 contentHeight 变化、recordsVersion 就地改值行高立即更新
- B4 性能指标：稳态滚动已见区域 `__valueCalls` 帧增量 0；估高段中位下降且 scanCount 不变；`lastPaint.elapsed` 稳态中位 ≤ 基线 ×1.1
- B5 修订设计与新列类型实现一致：list/link 条目列估高、精算、绘制路径不回归（demo data/table 与 data/table-ex 页面行为不变）

## 验证命令
- `npm run build`；`npx eslint src` 口径零 error；`npx stylelint "src/**/*.scss"`
- demo 自检 + playwright DOM 断言（见 B1/B3/B4）

## 验证环境
- demo：rollup watch + :3000；页面 `http://localhost:3000/data/table-ex/`、`/data/table/`
- playwright mcp；优先 DOM/可访问性快照断言
- 性能采样参照知识库 `table-ex-performance-profiling` 条目（props 直替 + setTimeout ≥ 60ms）

## 流水线与预算
- 流水线：自定义（用户指定）：primary 修订原始设计 → peer 修订设计（交叉 X 一轮）→ primary 修订设计（回应 R 一轮）→ (fast 实施 + fast 验证) × n（n ≤ 2）
- 槽位映射：designer→pipeline-primary；design-amender→pipeline-peer；implementer/verifier→pipeline-fast
- 评审模型：异构；验证：独立实例
- 预设：standard，覆盖——无设计检查点停点；方案不可行时停（不走实施）；修复轮 R=1（键：整体）
- 预估派发：6（正常）~ 8（含第二轮修复重验）
- 预算：设计修订 k/1；回设计 j/0；修复轮 整体 0/1；派发 d/12
