# 00-task：table-ex 列类型补齐（text link 悬停 / button 字段值渲染）+ 格线截断

## 目标
按 requirements.md 完成三项功能（canvas 通道 mu-table-ex 为主）：
1. text 列 `link: true`：hover 显示下划线 + pointer 光标，细节与验收见 requirements.md 需求 1。
2. button 列支持字段值直接渲染（仅配 `field` 时按 tag 同口径包装为按钮条目），
   细节与验收见 requirements.md 需求 2。
3. 格线截断（用户消息追加，requirements.md 未含）：
   - 所有行高之和 < 表格容器高度时，垂直格线不超过最后一行的底部；
   - 所有列宽之和 < 表格容器宽度时，水平格线不超过最后一列的右侧。

## 基线（git status --short @ 任务开始）
- M demo/src/data/table-ex-basic/main-view.vue、table-ex-scene、table-ex、layout/split-box
- M src/components/table/column-types/{button,link,list}.js、todo/misc.md
- ?? agent-docs/plans/20261106-column-link-hover-button-value/
- 注意：button/link/list 有未提交改动（注释清理 + caption→label 键名迁移）。
  requirements.md 中行号与条目键名（caption）可能滞后于代码，设计以工作区当前代码为准；
  实施不得回退既有改动。

## 约束
- 纯 JavaScript、Composition API；BEM / `mu-` 前缀；canvas 色值走 colors 色板谱系。
- 双通道（mu-table DOM / mu-table-ex canvas）行为一致；DOM 通道不回归。
- 不新增依赖；不执行 git 提交。
- 文档三处同步（skills references / docs quick-reference / docs-site）不在本轮，实现经用户确认后再更新。

## 验收标准
- 需求 1：requirements.md「验收标准」4 条。
- 需求 2：requirements.md「验收标准」6 条。
- 需求 3：demo 构造行少/列少场景：垂直格线止于末行底部、水平格线止于末列右侧；
  表头底边框（承担首行顶线语义）同口径截断：末列右缘以右、表头底边框 y 处取样为背景色，
  表头背景仍整宽；行满/列满场景格线铺满容器，现状不回归。

## 验证命令与环境
- 无测试框架。demo 页验证：http://localhost:3000/table-ex-basic/（rollup watch 服务常开，先直访不重复打包）。
- 编译检查：`npm run build`（涉及源码改动时验证者可跑）。
- playwright mcp 可用；DOM/可访问性断言优先，canvas 内容用截图辅助判断。

## 预设与开关
- 用户自定义序列（非内置预设）：design → design-amender → designer 最终修订 → (impl → verify) × n，n ≤ 2。
- 无设计确认门（用户已指定全自动序列）；实施粒度：整体；验证 FAIL 即进入第二轮修复后重验。

## 槽位与角色映射
- designer → pipeline-designer（Primary）；design-amender → pipeline-design-amender（Peer）
- implementer → pipeline-implementer（Primary）；verifier → pipeline-verifier（独立实例）

## 预算
- 设计修订 k/N：0/0（amender 直接审改并共写；designer 最终修订为固定序列步骤，不计修订轮）
- 修复轮 整体 k/R：0/1（verify FAIL → 实施者修复 + 重验 = 第二轮，n 上限 2）
- 派发 d/上限：5/11（预估 5~7 = 设计 3 + impl/verify 2~4；ceil(7×1.5) = 11）

## 追加轮（2026-11-06 用户指令）
- 目标：修复 http://localhost:3000/data/table-ex/ 自检页 5 项失败（现 218/223），验收 = 223/223。
- 流程：verify 检查 → impl 修复 → 重验；修复循环上限 2 轮。
- 已知事实：5 项失败全在 [cell-painters]（link 兼容壳 / LinkColumn / ListColumn / link 竖排 / link 悬停），
  断言为条目数不符；基线迁移（caption→label，list/link 条目键）后夹具未同步。
- 修复边界：仅改自检夹具与断言使其匹配组件现状契约（label 为标准键、caption 兼容已删除）；
  不改组件行为，不回退基线改动；button/tag 的 caption 键夹具不在迁移范围（其契约未变）。

## 追加轮 2（2026-11-06 用户指令）：背景截断补齐
- 需求 A：表头背景截断——格线截断落地时表头背景（paint-header.js fillRect(0,0,W,headHeight)）仍整宽，
  须把列宽和 < 容器宽时末列右缘以右的多余背景去掉（取代追加轮前「表头背景仍整宽」裁定，见 decisions.md）。
- 需求 B：hover 背景不越界——悬停高亮背景（单元格/行/列带等 hover 态背景填充）不得超出有效行、列范围：
  不得越过末行底部、末列右侧绘入空白区。选中（selection）背景高亮与 hover 同口径约束。
- 流程：design → amender（共写即定稿）→ (impl → verify)×2，修复循环上限 2 轮。
- 验收基线：行满/列满场景（铺满容器）hover 与表头背景现状不回归；「格线截断（行少 / 列少）」demo 表
  为验证场景；/data/table-ex/ 自检保持 223/223。
- 预算：本轮派发预估 4~6（设计 1 + 审改 1 + impl/verify 2~4），上限 ceil(6×1.5) = 9。
