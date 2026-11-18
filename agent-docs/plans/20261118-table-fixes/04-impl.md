STATUS: DONE
# 实施记录

## 改动文件

- src/components/table/utils.js — C1/C4（新增 readCellValue / parseOrderBy 导出）
- src/components/table/ex/interaction/click-resolve.js — B1（isCappedDotsItem 提取导出 + kind==='link' 门控）、C4（resolveOrderByNext 改引 parseOrderBy）
- src/components/table/ex/composables/use-cell-click.js — B1（本地判定删除改引）、C1（emitButtonItemClick / openEditorAt 两处取值改引）
- src/components/table/ex/editing/editor-resolve.js — B2（resolveEditorProps 第二参 { editorType, record }）、C5（raw 兼容分支注释）
- src/components/table/ex/editing/editor.js — B2（open 调用传入已算 editorType/record）、C1（rawValue 改引 readCellValue）
- src/components/table/base/table.vue — B3（columns.at(-1)? 守卫）、C4（sortDirection 改引 parseOrderBy）
- src/components/table/ex/composables/use-column-resize.js — B4（pointercancel 与 pointerup 同处理器挂/摘）
- src/components/table/ex/geometry/row-geometry.js — C1（valueOf 改引；_mapText 取 .text 保留在调用点）
- src/components/table/ex/spans/spans-auto.js — C1（displayValueOf 改引；_mapText 取映射对象保留在调用点）
- src/components/table/ex/cell-paint/cell-content.js — C1（resolveCellContent 取值改引）
- src/components/table/ex/table-paint/paint-utils.js — C4（sortDirectionOf 改引）
- demo/src/data/table-ex/self-checks/interactions.js — B1/B4/C4 断言（3 条新增）
- demo/src/data/table-ex/self-checks/editor.js — B2 断言（1 条新增）
- demo/src/data/table/main-view.vue — B3 断言（「边界与回归」内加 :columns="[]" 表格，未新增页面，README 地址清单无需变更）

## 自检与进度

| 步骤 / 修复项 | 命令 | 状态 | 关键输出（≤3 行） |
|---|---|---|---|
| B1 tag 列 dots 误判修复 | 源码编辑 | 完成 | isCappedDotsItem 提取至 click-resolve.js 并加 kind 门控 |
| B1 断言 | demo self-checks（interactions）+ playwright 集成 | 完成 | 断言 link 超限末位 true / tag 恒 false；集成：12 tag 列第 10 个 payload=真实对象 {caption:'标签 10'} 非 '...' |
| B2 resolveEditorProps 双口径修复 | 源码编辑 | 完成 | 第二参接收外部 editorType/record；raw column 无第二参形态兼容 |
| B2 断言 | demo self-checks（editor） | 完成 | 外部 editorType 不二次求值；lineClamp 回调收真实 record；raw column 回归 |
| B3 base 空列守卫 | 源码编辑 | 完成 | columns.at(-1)?._ctrlClass.push('last-col') |
| B3 断言 | demo /data/table/ 页面验证 | 完成 | 空列表格渲染 5 行 0 列、无 console error |
| B4 pointercancel 处理 | 源码编辑 | 完成 | 同处理器挂/摘 pointercancel（对齐 resize-shared.js：cancel≈up 按当前宽度提交） |
| B4 断言 | demo self-checks（interactions） | 完成 | 派发 pointercancel 后监听释放、参考线清 null、宽度 300 定格提交、relayout×1 |
| C1 readCellValue 收敛（六处） | 源码编辑 | 完成 | row-geometry/spans-auto/cell-content/use-cell-click×2/editor 六处改引；_mapText 留调用点 |
| C4 parseOrderBy 收敛（三处） | 源码编辑 | 完成 | base sortDirection / ex sortDirectionOf / resolveOrderByNext 改引；首冒号语义保留 |
| C4 断言 | demo self-checks（interactions） | 完成 | null/undefined → ['',undefined]；'a:b:c' → 'a'+'b:c'；next 推进回归 |
| 全量 build | npm run build | 完成 | dev+prod 两次构建成功，无 error/warning |
| 全量 eslint | npx eslint src/components/table demo/src/data/table-ex demo/src/data/table/main-view.vue | 完成 | 0 error / 2 warning（cell-tooltip、use-cell-tooltip 复杂度，历史遗留，本次未触碰，零新增） |
| demo self-checks 基线比对 | playwright 采集对比（baseline-selfchecks.txt，仓库根） | 完成 | 基线 246 全绿 → 改后 250/250；新增 4 条断言全绿；另 3 条同名用例仅 detail 计数/字体度量波动（随机冷键 measure 47/47→42/42、字体加载时序 13.6054px→13.8333px），非行为变化 |

## 偏离

无

## 遗留

- 自检基线快照存于仓库根 baseline-selfchecks.txt（改动前采集）与 after-selfchecks.txt（改动后采集），供 verifier 复核，均为 untracked 临时文件。
- B1 设计给了两条断言路径（纯函数提取 / demo 夹具加宽 + playwright），实施取纯函数提取路径（提取至 click-resolve.js 符合其纯决策模块定位），demo 夹具未改；另以 playwright 集成级点击完成行为复核（拖宽「标签（彩色）」列至 910 后第 10 个 tag payload 正确，页面已刷新还原夹具状态）。
- C4 中 parseOrderBy(null/undefined) 产出 `{ field: '', direction: undefined }`，与原三处 `String(orderBy ?? '')` 归一行为逐字一致；base/ex 两处 `if (!orderBy) return {}` 前置短路原样保留。
- demo self-checks 3 条计数类用例的 detail 数字随环境波动（已知非确定性输出，见知识库「计数断言冷键被预热致重跑恒败」同类现象），如 verifier 逐字比对基线，该 3 条需按同名用例口径豁免 detail 差异。
