# 任务：table-ex 代码文件文件夹分类（dev-pipeline，用户指定流水线）

## 目标
对 `src/components/table/ex/` 全部源码文件按功能域做文件夹分类（归入语义子目录），纯移动 + import 同步，行为零变化。延续任务 1（9d61316 拆分为 ≤500 行小文件）与 873f6e4（单元格选中）之后的结构整理。

## 约束
- 纯重构：不改行为、不改公开 API/组件注册名；被移动文件内容除 import 路径外零改动（移动不重写函数体）
- 分类须覆盖 ex/ 全部源码文件（js/vue/scss）；个别文件留根须给出理由（目录入口、跨域共享等）
- 目录名小写 kebab-case，参照既有先例 `src/components/table/column-types/`
- `index.js` 保持为目录入口可用；ex/ 目录外若有对 ex/ 内部文件的直接 import，须同步更新并在实施记录中逐条列出（预期不存在，须实际 grep 证实）
- 文件移动用文件系统 mv（不用 git mv / git add，不提交）；本任务不 commit（用户未要求）
- 每个文件仍 ≤500 行；eslint 无新增 error
- knowledge 条目命中即采用（先读 agent-docs/knowledge/INDEX.md；重构安全网：demo 自检 + 构建 + 冒烟）

## 验收标准
1. ex/ 内文件按功能域归入子目录，实施记录含完整「旧路径 → 新路径」映射与分组依据
2. 无遗留旧路径 import：`npm run build` 退出码 0
3. demo 冒烟（headless Edge CDP，复用 agent-docs/plans/20261105-table-ex-refactor/02-design.md 附录 A 与 evidence/smoke-interaction.mjs）：自检 223/223、编辑浮层、选中/复制、console 无错误
4. 行数复核：全部文件 ≤500
5. git 改动范围：仅 src/components/table/ex/（含新子目录）+ 上述目录外 import 引用处（如存在）
6. 分类理由记录于实施记录，供评审；本流水线无设计阶段，分类方案由实施者确定

## 验证命令 / 环境
- 构建 `npm run build`；demo watch 3000 端口（未运行则 `npm run demo:build`）
- demo URL：http://localhost:3000/data/table-ex/
- 子 agent 无 playwright mcp：headless Edge CDP（knowledge: headless-edge-dom-verification.md）

## 流水线与槽位（用户指定）
(fast 实施 → fast 检验) × n（n ≤ 2）：第 1 轮实施+检验；检验 FAIL → 修复 + 再检验（第 2 轮，最后一轮）；仍 FAIL 停下问用户
- implementer / verifier → pipeline-fast；无设计阶段；standard 修复轮按用户 n≤2 收敛为「整体」k ≤ 1

## 预算
- 派发 d ≤ 6（预估 2；上限含 1 轮修复与失败重派余量）
- 修复轮「整体」k ≤ 1

## 基线
git f573055 (dev)，`git status --short`：clean（2026-11-06 建目录时快照）
