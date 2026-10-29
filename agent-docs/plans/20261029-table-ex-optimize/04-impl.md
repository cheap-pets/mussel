# 实施记录

基线 `mussel-table` @ `1c8f326` + 上轮 fixes 未提交改动（基线内产物）。按 02-design.md 实施步骤 1→6 串行执行；中途一次模型配额中断（非任务失败），续做完成，2026-10-30。

## 续做对账（中断时点 → 续做完成）

| 步骤 | 中断时状态 | 续做处置 |
|---|---|---|
| 1 eslint 配置与清零 | 已完成（0 error / 19W） | 无需补 |
| 2 性能基线采集 | 已完成（数值已采） | 无需补 |
| 3 B 线重构 + 豁免 | 主体完成、**探针未删**（冻结基线已比对逐字一致、188/188 全绿、性能复测完成） | 补删探针 → 复验 187/187 |
| 4 C 线 watch 合一 | 未开始（console.count 埋点仍在） | 完整合一 + P1 计数验证 + 删埋点（`grep console.count` = 0） |
| 5 D 线 demo 两页 | 未开始 | 完成（两页 + catalog + 端口定位重启 + 全链断言） |
| 6 文档三处 + 终验 | 未开始 | 完成（三处更新 + 验收 1-4 + 回归行全过） |

## 改动文件

### 既有配置变更（A 线单列留痕，设计裁定 #1/#5）

| 文件 | 改动 |
|---|---|
| `.eslintignore` | 补一行 `demo/dist`（构建产物非源码，既有 `/dist`、`/examples/dist` 同意图补齐；00-task 字面命令随之可达零 error；防 `--fix` 误写产物） |
| `.eslintrc` | `globals` 增 `"__version__": "readonly"` + 注释指向 vite.demo.config.js / vite.config.js 的 define 注入（demo 构建真实全局契约；替代内联 disable，避免掩盖未来真错） |

### src

| 文件 | 改动 | 设计线 |
|---|---|---|
| `src/components/table/ex/spans.js` | B 线重构（行为冻结）：`registerRegion` 抽出 `fillCoveredCells`/`fillRowRegions`；`applySpanMethod` 抽出 `buildSpanInfo`/`resolveDeclColumns`/`parseSize`（= `normalizeSpanValue` + `validateSpanSize`）/`resolveDeclaredColspan`/`errorMessageOf`；`applyAutoRowSpan` 抽出 `autoSpanKeyOf`/`collectAutoRowSpanColumns`/`isTreeBoundary`/`isCascadeBoundary`/`warnNonPrimitiveKey`/`isNonPrimitiveSpanKey`/`advanceSegment`（seg 每列一次，承担闭合 + 开段）；主循环复杂度 25/18/12/12 → 全部 ≤10（eslint 实测零告警）；:345 spaced-comment 随 --fix | B |
| `src/components/table/ex/cell-painters.js` | `prepareColumn` 抽出 `resolveMaxLinesBuilder`/`isPlainTextColumn`（15 → ≤10） | B |
| `src/components/table/ex/row-geometry-controller.js` | `remeasureVisibleRows` 加 complexity 豁免注释（性能路径，不改逻辑） | A② |
| `src/components/table/ex/row-geometry.js` | `computeRowHeights` 加豁免注释（同上） | A② |
| `src/components/table/ex/table-ex.vue` | C 线 P1：五个 relayout watch 语句（六源：records/columns/recordsVersion/spanMethod/orderBy/fixedLeftColumns）合一为单一 watch，回调内按源 diff 执行前置副作用（records → scrollTo(0,0)；columns → resetOverrides + invalidateMeasureCache）后一次 `relayoutAndRedraw()`；注释随迁移。**注意**：此文件同时含上轮 fixes 改动（基线内产物），hunk 级区分 | C |
| `src/components/table/ex/painter.js`、`tree.js`、`use-tree-rows.js`、`interactions.js` | 仅上轮 fixes 改动 + :1346 等注释格式随 --fix（本轮无实质新改动） | A |

### demo

| 文件 | 改动 | 设计线 |
|---|---|---|
| `demo/src/data/table-ex-basic/`（新） | main.js + main-view.vue（~210 行）：基础用法（选中/cell-click）、列类型一览（全类型 + canvas 专属 progress/button）、排序与固定列（order-by 受控 + fixed-left-columns=2 + resizable）、样式与 hover（gridlines/hover-mode/striped 控制） | D |
| `demo/src/data/table-ex-scene/`（新） | main.js + main-view.vue（~250 行）：单元格编辑（update:cell-value 就地改 + recordsVersion）、树 + **isLeaf 懒加载活样例**（tree-props isLeaf 映射、tree-expand/tree-collapse、回填就地 push + recordsVersion++）、合并单元格（autoRowSpan + spanMethod 'rest' 小计行）、异步数据（增量 push + recordsVersion） | D |
| `demo/src/catalog.js` | data 分类增两条目（`data/table-ex-basic`、`data/table-ex-scene`，置于 data/table-ex 验证页之前） | D |
| `demo/src/data/table-ex/main-view.vue` | 仅 lint：script-indent ×2 随 --fix；createSpanRecords 内 `records` 改名 `rows`（no-shadow）；验证页职责不动 | A |
| `demo/src/data/table-ex/self-checks/` 四文件 | tree/interactions/cell-painters 为上轮产物 + quotes 随 --fix；spans.js 仅 quotes 随 --fix（**临时探针已按设计删除**，交付 diff 无探针） | A |
| `demo/src/` 其余 ~24 文件 | auto-fixable 格式 warning 随 --fix（newline ×210+2、quotes ×6、spaced-comment 等，纯换行/缩进/引号零语义变更）；`feedback/status-box` 删未用 `ref` 导入；`navigation/side-menu` `_` 遮蔽改名 `_unused`；`home` 无代码改动（globals 修复后 error 消失） | A |

### 文档（用户已授权）

| 文件 | 改动 |
|---|---|
| `skills/mussel-ui/references/components/data.md` | MuTableEx 节：`tree-props` 行补 `isLeaf`（映射语义 + 未映射不生效 + 回填通道）；扩展事件表补 `tree-expand`/`tree-collapse`（载荷 `{ key, record, level }`） |
| `docs-site/components/table-ex.md` | 三处：树模式正文补 isLeaf 懒加载段（术语对齐 tree.md 的 isLeaf/node-expand）；属性表 `tree-props` 行；事件表补两行 |
| `docs/quick-reference_components.md` | MuTableEx 节同步（与 data.md 互为副本；事件名沿该文件无反引号风格） |

## 偏离

无 BLOCKED 级偏离。三处实施内裁量留痕：

1. **B 线实施中发现并修复两处重构缺陷**（探针 + 自检安全网拦截，未流出）：① `advanceSegment` 首版键变时只闭合未立即开新段（原逻辑闭合后同 row 开段）→ 级联分段用例失败（区域 4→2）；修正为 close 回调作参数、advanceSegment 承担「闭合 + 开段」全程。② `fillRowRegions` 解构 `{ row, rowTo, region }` 中 `region` 键在 region 对象上不存在（存了 undefined、被窗口查询去重合并）→ rowRegions 用例失败；修正签名 `(index, region)` 直取属性。两处修复后探针与冻结基线逐字一致、187/187 全绿。
2. **`applySpanMethod`/`applyAutoRowSpan` 复杂度实测 11（设计 R2 推演 10）**：差 1 来自 `err?.message ?? err`（`?.`+`??` 各计 1，R2 口径未计）与 `!autoCols.length` 早退。按设计「超限继续抽取，不得改用豁免」处置：抽 `errorMessageOf`、`isNonPrimitiveSpanKey`，主循环均 ≤10 零余量通过（eslint 实测无告警）。
3. **demo:build 重启方式**：:3000 在步骤 2 前已死亡（上轮实例），重启一次；步骤 5 新增目录后按约束经端口 netstat 定位实际 PID（17484）taskkill 再重启——两次重启后均复测 200。

## 自检（终验，全部通过）

| 检查 | 命令/手段 | 结果 |
|---|---|---|
| eslint 字面命令 | `npx eslint "src/**/*.{js,vue}" "demo/**/*.{js,vue}"` | **0 errors** / 12 warnings = 范围外 complexity ×2（case-grid-designer `onResizeMove` 12、events/resize.js `sweep` 12，政策保留）+ max-len ×10（政策保留）；与设计「裁定 #2」表逐条对账：table-ex 内 complexity 7 处全部清除（5 重构 + 2 豁免） |
| 构建 | `npm run build` | 4 次 vite build 全部 ✓ |
| stylelint | `npx stylelint "src/**/*.scss"` | exit 0 零输出 |
| demo 自检 | `:3000/data/table-ex/`「重跑自检」 | **187/187**（上轮基线保持；临时探针验证 188/188 后删除回到 187） |
| 性能（C 线协议） | console.count 埋点 + wall-clock + lastPaint（埋点已删，`grep console.count` = 0） | 见下表 |
| demo 新页 | playwright DOM/像素断言 | 两页 200；基础页 4 section/canvas 渲染/导航收录；场景页编辑提交（`#1 name → "编辑后的名称"`）、树懒加载全链（懒根 102 三角 ink 73px → `tree-expand { key: 102 } 已回填 3 个子级` → scrollHeight 324 = 8 行）、异步增量（5→8 行） |
| 文档 | `git grep` 反引号事件名 + isLeaf | 三处 `tree-expand`/`tree-collapse`/`tree-props` isLeaf 全部命中，措辞对齐 tree.md |
| 回归（上轮三问题） | 验证页抽查 | 多行文本切后 contentHeight 即 444（经合并 watch 路径）；懒加载回填 3→6 行/252px/scrollTop 0 不闪顶；tag 文本 ink 中心 delta 0.83px（≤1） |

### 性能数据留痕（C 线测量协议，100k 行 default 场景）

| 指标 | 基线（五 watch） | P1 后（合一） | 判据 |
|---|---|---|---|
| 切换 default→multiline relayout 计数 | +2 | **+1** | N→1 ✓ |
| 切换 multiline→default | +2 | **+1** | ✓ |
| props 仅 records 替换 | +1 | +1 | 单源不变 ✓ |
| props records+columns 双替 | +2 | **+1** | ✓ |
| 双替批量 wall-clock（3 次中位） | 179.9ms | **165.4ms** | ≤基线 ✓（↓8%） |
| 单次 lastRelayout（multiline 切换） | elapsed 0.3ms / scanCount 0（两次中后一次零扫描） | elapsed 1.9ms / scanCount 3 / rebuild true（单次合并完成全部工作） | ≤原两次之和 ✓ |
| 滚动 lastPaint 稳态中位（6 样本） | 1.4ms | 1.2ms（B 线后） | ≤×1.1 ✓ |
| contentHeight 锚点 | 444 / 3,600,036 | 444 / 3,600,036 | 不变 ✓ |
| spans 场景 | — | 切换正常（32 行 1188px）、自检全绿 | 行为不变 ✓ |

## B 线冻结基线比对（探针，已删除）

冻结基线（重构前采集）：9 条警告消息原文序列 + regions 构建序 `["2-3x5-7", "2-4x2-3", "0-2x6-7"]`（夹具覆盖 5 个未断言警告分支 + reserved ×2 + none/值无效/clamp/throw + 去重 + takenOver/orderBy info + spanMethod 占用切断路径）。重构后逐字一致 ✓（含上述两处缺陷修复的中间轮，安全网有效性的实证）。

## 遗留

1. 范围外 complexity ×2（`demo/src/advanced/case-grid-designer` `onResizeMove` 12、`src/events/resize.js` `sweep` 12）与 max-len ×10 为政策保留 warning（设计裁定 #2 第三档/第四档），非本次清零目标。
2. use-tree-rows 三条树 watch 未并入 P1 合帧（设计残留 #7：树 props 极少与 records 同批；tree + records 同批时 relayout 可能 ≥2 次，属 P1 范围外）。本轮验证未观察到该场景退化。
3. demo watch 服务现由本会话后台维持（:3000），供 verifier 复验；若调度者接管请按端口 netstat 定位 PID 重启。
4. 本轮改动与上轮 fixes 未提交改动在 8 个文件上叠加（table-ex.vue、spans.js、cell-painters.js、painter.js、tree.js、use-tree-rows.js、interactions.js、demo 验证页）——回滚须按本记录「改动文件」表对照 `git diff` 以 hunk 为单位执行，不整文件 reset。
