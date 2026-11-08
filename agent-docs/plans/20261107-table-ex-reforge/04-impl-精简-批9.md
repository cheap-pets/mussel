# 实施记录（注释精简 · 批9）

## 改动文件
- src/components/table/ex/table-ex.vue 474→474（±0）：1 处旧引用更新——行几何步骤注释「文件头 @getters 声明」→「@param deps 声明」（B2 ctx→deps 后控制器 getter 清单在 createRowGeometryController JSDoc @param deps，文件头并无 @getters 注解，已核对 row-geometry-controller.js 现状）
- src/components/table/ex/table-ex.scss 186→186（±0）：1 处旧行号引用更新——「table.scss:155 硬编码 rgba 双阴影」→「base/table.scss」（该硬编码现位于 base/table.scss:152，行号已漂移，删行号防再腐化）
- src/components/table/ex/index.js 2→2（±0）：纯 re-export，无注释，零改动
- 合计 662→662（0 行）；精简注释 2 处（均为旧引用更新为现状，非删除）

## 偏离
无

## 保留的契约注释（逐字未动）
- table-ex.vue：模板 3 处交互/编辑/tooltip 协议注释；props 契约（spanMethod 入口 B、treeProps、treeExpandedKeys、defaultExpandLevel）；12 步组装顺序注释 1–12（含 9.5）及第 3 步依赖/不依赖清单；host 袋不变式与 3 处前向槽/惰性读取说明；状态槽注释（hoverItem/selectedCell/measureFn/lastRelayout/editingCellRef）；TDZ 约束；JSDoc（resolveRecordKey/cellEditableOf/devWarn）；update:cell-value 数据契约；headerShadowStyle 收口口径
- table-ex.scss：变量分层与 theme.js 探针说明、滚动几何（A2）、DOM 职责层、overlay overflow:clip 不变量（G3）、投影条锚定 +1px hairline 覆盖区间、文本左缘一致性、textarea 口径、borderless 白名单、tooltip 锚点协议
- @host-* 注解：本批 3 文件 grep 确认无此类注解，无保留对象

## 死代码存疑清单
无：通读 3 文件确认无注释掉的死代码块（模板/scss 注释均为活性说明）

## 自检
- git diff 确认仅 2 行注释行变更，零代码 token / 字符串 / 模板结构 / 样式规则变更
- eslint（table-ex.vue + index.js，/d/npm/global/eslint）退出码 0，零新错
- stylelint（table-ex.scss）退出码 0，零新错（未 --fix）
- 未跑 build（派发指定终验统一做）

## 遗留
- 白名单内已无 interactions/cellRectAt/ctx 旧符号残留（grep 验证 0 命中）
