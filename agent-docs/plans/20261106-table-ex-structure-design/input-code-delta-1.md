# 代码变动快照（调度者采集，供修订参考）

上一轮 peer 修订（06-amend-1）后、本轮 primary 修订前，工作区相对基线新增/扩大了以下未提交改动（前一任务 20261106-ex-fixed-select-hover-span 的延续，无新 commit）：

| 文件 | 变化 | 内容 |
|---|---|---|
| `src/components/table/ex/composables/use-pointer.js` | +41/-…（基线时已存在，现扩大） | hover 高亮与脏区随合并区域联动（spanRectOf/regionAt） |
| `src/components/table/ex/table-paint/paint-gridlines.js` | **基线后新增** +8 | 同上任务（合并区域跳线口径） |
| `src/components/table/ex/table-paint/paint-overlay.js` | +80（基线时已存在，现扩大） | hover 带横穿固定列、选中描边另裁固定列区 |
| `demo/src/data/table-ex/self-checks/painter.js` | +275 | 同批新增像素断言 |
| `agent-docs/knowledge/INDEX.md` 等 | 知识沉淀 | 新增 hover-span-region 条目 |

对修订的约束含义：

1. 批次 1（O1/O2/O3/JSDoc）触及 use-pointer.js、paint-overlay.js 的 import 行——这两个文件有未提交改动，实施须避开其逻辑区、只动 import/注释，或由用户裁决先行提交。
2. structure-map.md §6.3/§4.1 中 paint-overlay 描边链、use-pointer hover 链的描述基于基线代码，O5（同源提取）的行号/清单可能已漂移，修订时须以当前工作区代码为准重新核实。
3. 知识库新增 `table-ex-hover-span-region` 约束：hover 带与脏区须同批按 spanRectOf/regionAt 取合并区域——O5 提取描边链时不得破坏该口径。
