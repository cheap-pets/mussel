# 任务：table / table-ex 组件文档更新与优化（dev-pipeline，用户指定流水线）

## 目标
更新并优化 mu-table / mu-table-ex 组件相关文档，使其与当前组件特性一致；文字简洁无冗余；更新 mussel-ui SKILL.md 版本与日期。用户已明确授权本次文档更新。

## 范围（仅列文件，table 相关内容）
- skills/mussel-ui/SKILL.md —— 版本检查块与 frontmatter date（现 4.1.5 / 2026-10-13、date 2026-10-29 → 4.3.0 / 2026-11-06，package.json version=4.3.0）
- skills/mussel-ui/references/components/data.md —— table/table-ex 相关节
- docs/quick-reference_components.md —— MuTable（≈L1610）/ MuTableEx（≈L1752）节
- docs-site/components/table.md（326 行）、docs-site/components/table-ex.md（339 行）
- 条件范围：docs/quick-reference_styles.md、docs-site/guide/styles*.md、skills/mussel-ui/references/styles.md 中 table 相关条目仅在过时时才动

## 验收标准
1. 文档与 HEAD 3b346ab 源码实际特性一致：以 src/components/table/（含 column-types/、ex/）为准逐一核对；近期特性须入册——icon 列类型、button 列图标按钮、editButton 注册名收敛与 emit 变更、enum 列、color 参数、list/link 列体系 v2、table-ex 单元格选中/复制/方向键移动等（列举不完整，以源码核对为准）；已废弃/已删除 API 的描述清除或标注废弃
2. 三处文档内容互相同步（同一 API 三处描述一致；按项目约定三处须一同更新）
3. 文字简洁清晰，无冗余重复内容
4. SKILL.md 版本与日期按上述更新
5. 全部特性描述可溯源到 src/，不发明特性
6. `npm run docs:build` 退出码 0

## 验证命令 / 环境
- 构建：`npm run docs:build`（VitePress）
- 一致性抽查：同一 props/事件/列类型在三处的描述 grep 比对

## 项目知识（先读 agent-docs/knowledge/INDEX.md，命中即采用）
table 列类型体系 v2 / mappings enum / color 参数 / tag 颜色协议 / item 列对齐 / table-ex 编辑、选中复制等条目

## 流水线与槽位（用户指定）
primary 编写 → peer 修订
- 编写：pipeline-primary（implementer 契约，改文档 + 自检 docs:build）
- 修订：pipeline-peer（amender 契约，独立核对源码后直接共写修订 + 06-amend-1.md；不读 04-impl.md）
- 评审模型：异构；peer OBJECT → 停下问用户

## 预算
- 派发 d ≤ 5（预估 2）；无修复轮键（peer 修订即最终轮）

## 基线
git 3b346ab (dev)，`git status --short`：clean（2026-11-06 建目录时快照）
