# 任务：table / table-ex 列类型变更（text.link、list 类型、link 兼容）

## 目标
1. text 列增加 `link: Boolean`：true 时单元格渲染为 link 样式；颜色由 color 选项控制，mu-table 中将 color 转换为 `.text-{color}` class；不再接受 danger 选项；不支持数组值；保留 multiline 与 lineClamp。
2. 新增 list 列类型：只接受数组值；元素默认按文本行渲染；column 级 `link: Boolean` 为 true 时整列按 link 样式渲染（整个 list 全 text 或全 link）；每项单行、超长省略（...）；点击项 emit('cell-item-click', { record, column, item })。
3. 原 link 列保留为兼容项：内部转换为 list 渲染，共用 list 实现代码，不另写。

## 基线
分支 dev @ 6980b6f；建目录时 `git status --short`：
```
 M src/styles/link.scss
?? agent-docs/plans/20261104-table-ex-measure-perf/
```
基线内改动视为用户已有改动，与本任务无关，不还原、不提交。

## 约束
- 纯 JS；Composition API `<script setup>`；BEM `mu-` 前缀；颜色/间距用 `--mu-*` 变量，禁硬编码
- 本次不含文档更新（三处文档同步待实施完成、用户确认后另行处理）
- 项目不使用 mussel-ui skill、不使用 agent-task-report
- 角色不得执行 commit/push/stash/checkout/reset/clean，不得安装依赖

## 验收标准
- A1 text 列支持 `link: Boolean`，true 时渲染 link 样式；color 转换为 `.text-{color}` class 生效
- A2 text 列不再接受 danger（danger 渲染路径移除）；数组值不再被 text 接受
- A3 text 列 multiline 与 lineClamp 行为保留
- A4 list 列仅接受数组值，元素默认按文本行渲染；column 级 `link: true` 时整列按 link 样式渲染
- A5 list 列每项单行渲染，超长省略（...）
- A6 list 列项点击 emit('cell-item-click', { record, column, link })
- A7 link 列经内部转换为 list 渲染，共用同一实现代码（无重复实现）
- A8 `npm run build` 构建通过；demo 页面 DOM 验证 A1~A7 行为
- A9 table-ex 中除 list 列外，其他列类型一律不再支持数组数据

## 验证命令
- `npm run build`
- demo 页面行为验证（见验证环境）

## 验证环境
- demo：rollup watch 模式打包 + :3000 端口静态服务；页面 `http://localhost:3000/<name>/`
- 浏览器验证用 playwright mcp（子智能体具备该工具）；优先 DOM/可访问性快照断言
- 服务未运行时报告环境阻塞，不自行启动打包

## 流水线与预算
- 流水线：自定义临时组合（用户指定）：primary 探索（疑问确认停点）→ primary 设计 → peer 修订设计（交叉 X 一轮）→ primary 修订设计（回应 R 一轮，无 X 复审）→ fast 实施 + fast 验证（≤2 轮）
- 槽位映射：explorer/designer→pipeline-primary；design-amender→pipeline-peer；implementer/verifier→pipeline-fast
- 评审模型：异构；验证：独立实例
- 预设：standard，覆盖——无设计检查点停点（设计修订完成后直接实施）；修复轮 R=1（键：整体）
- 预估派发：6（正常）~ 8（含第二轮修复重验）
- 预算：设计修订 k/1；回设计 j/0；修复轮 整体 1/2；派发 d/12
