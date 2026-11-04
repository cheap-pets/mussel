# 实施记录

基线：分支 dev @ b3528d7（列类型变更已提交）。设计：02-design.md 定稿（含 06-amend-1 / 02-amend-1 全部修正）。实施顺序按 §7：步骤 0（夹具+基线）→ 1（P5+P2-2/P2-3）→ 2（P4）→ 3（P1）→ 4（P2-1/P2-4）。

## 改动文件

| 路径 | 对应设计步骤 |
|---|---|
| `src/components/table/ex/row-geometry.js` | 步骤 1：P5-2 `visibleRange` 尾部 Fenwick prefix O(log n) → heights 直加 O(window)；P2-2 `textLineCountOf` 的 `!precise` 提前至 `resolveMaxLinesOf` 之前；P2-3 `computeRowHeights` 删宽/inset 求值（spanRole excluded 判定保留）。步骤 4：P2-1 `GRAPHIC_ITEM_TYPES`（tag/button/check/img/image/progress）图形列免 `valueOf`；P2-4 `estimateColumnDescOf` 列级描述表 `{ isEntry, graphicItem, maxItems }` + 非条目列内联三分支（数组恒 1 行 / 空值 0 / 非空 1） |
| `src/components/table/ex/row-geometry-controller.js` | 步骤 1：P5-1 `remeasureVisibleRows` 循环外提 `getSpans`/`getRecordsOffset`。步骤 3：P1 缓存条目改快照 `{ height, indent, recordsVersion }` + 三条件跳过（几何值 + 版本 + 缩进）；`mergeMeasuredHeights` 取 `.height`（max 混入语义不变）；`remeasureVariableRow` 经 `measuredSnapshot` 同规则写快照；`needIndent` 仅树开且 `isVariableCandidate()` 时启用；粘性契约注释（缓存字段处 + 方法 jsdoc）；ctx jsdoc 补 `getRecordsVersion` |
| `src/components/table/ex/table-ex.vue` | 步骤 3（P1 阻塞项）：controller ctx 注入 `getRecordsVersion: () => props.recordsVersion`（合并 watch 不改） |
| `src/components/table/ex/text-wrap.js` | 步骤 2：P4 tokenize 逐字符正则 test → `charCodeAt` 范围比较（`isWhitespaceCode` JS \s 全集 / `isCjkCode` 原 CJK_PATTERN 四段，空白优先顺序保持）；`shrinkToFit` 逐字符线性回退 → 二分（与 `ellipsize` 同单调假设，边界一致：空前缀 → `ELLIPSIS` 超宽返回 `''`） |
| `demo/src/data/table-ex/main-view.vue` | 步骤 0：验证夹具——性能计数列开关（默认场景列尾追加 `__perf` 列，width 4000 初始水平视口外，`_value` 计数落 `window.__valueCalls`）+ `recordsVersion++（仅通知）`按钮（默认关闭/无副作用，既有场景与 DOM 参照表不动） |
| `demo/src/data/table-ex/self-checks/text-wrap.js` | P4 验证：+4 断言（码点边界空白分词 NBSP/BOM/0x2028/OGM/U+2005 + 全角标点/谚文 + U+3000 空白优先顺序锚点；码点空白断行；超长词逐字断含全角标点边界；钳制末行收缩与 maxLines=1 逐字一致 + 极端窄列空串退化） |
| `demo/src/data/table-ex/self-checks/row-geometry.js` | P2 验证：+3 断言（六类图形列 `_value` 零调用；P2-1 的 0/1 行边界——低 rowHeight 主题空图形格 34/空文本格 30；估高期 `_resolveMaxLines`/`treeIndents` 零调用 + 条目列 render 每格 1 次不受 P2-4 影响）；"treeIndents 估高路径可用"断言改名（判据不变，heights [36,36] + 零测量） |
| `demo/src/data/table-ex/self-checks/row-geometry-controller.js` | P1 验证：新增模块，8 断言（设计 §6 断言 1~8：跳过 / recordsVersion 失配 / 列宽签名清空 / buildSpans 真实 SpansIndex 身份清空 / 几何抬高回落 / 条目列粘性契约 / 树缩进失配 36→52 / 重扫 rebuild merge 不回缩） |
| `demo/src/data/table-ex/self-checks/index.js` | 注册 `row-geometry-controller` 模块 |

## 偏离

1. **P4 tokenize 空白词首判定**（设计 §3 P4 第 1 条，71 行 `!/\S/.test(current)`）：实现取 `isWhitespaceCode(current.charCodeAt(0))` —— current 在该点只可能是空串或纯空白累积，判首字符与逐字判定等价（该等价性即设计注明的前提），已注释。
2. **eslint complexity 豁免**：`isWhitespaceCode` 范围链复杂度 13 > 10，沿用仓库热路径先例（row-geometry.js / controller 的 `#2②` 注释同款）加 `eslint-disable-next-line complexity`，换取最快的链式比较（tokenize 每字符调用）。
3. **首扫基线采集方式**（§6"重载页面 3 次"）：实测重载后 mount 期有多次 relayout，读到时 `lastRelayout.scanCount = 0`（首扫记录被覆盖）→ 改用设计列出的备选口径"数据规模 few↔full 切换 3 次"（scanCount = 100000 确认全量扫描）。
4. **perfColumn 计数写法**：`window.__valueCalls = (window.__valueCalls || 0) + 1`（设计伪代码为 `window.__valueCalls++`）——未显式重置时不产生 NaN；采样方显式置 0 后与设计逐字一致。
5. **controller 自检断言 6 render 次数判据细化**：设计文字"recordsVersion++ 后重算并反映新计数"已满足；实现复核发现版本是全表快照维度（bump 后窗口内全部行失配重算，与断言 2 同口径），故 render 次数断言为"+10（全窗）"而非"仅行 0"，行 0 高度 106 判据不变。
6. **P2-4 后 computeRowHeights 局部变量清理**：估高路径不再消费 `font`/`fontSize`（unused 删除局部变量，`cellFontOf` 仍被 `ensureRowMeasured` 使用）；`measure`/`wrapCache`/`colWidths`/`treeIndents` 保留入参兼容（函数签名与调用方不动）。均在设计 §3 P2-3/P2-4 允许范围内。

## 自检

已运行命令与结果（每步先自检再进下一步）：

- **node 直跑自检**（临时加载器：`@/` → `src/` 映射、扩展名补全、`.scss` 空桩、`env.js` define 桩；脚本在 `%TEMP%/mussel-selfcheck/`，不入库）：
  - 步骤 1：row-geometry.js 13/13 PASS（既有 201 项中的该模块判据不变）
  - 步骤 2：text-wrap.js 14/14 PASS（10 既有 + 4 新增）
  - 步骤 3：row-geometry-controller.js 8/8 + row-geometry.js 13/13 PASS
  - 步骤 4：row-geometry.js 16/16 + controller 8/8 + text-wrap 14/14 PASS（共 38）
- **demo 面板自检**（:3000/data/table-ex/，rollup watch 重建后）：步骤 1 → 201/201；步骤 2 → 205/205；步骤 3 → 213/213；步骤 4/终验 → **216/216，0 FAIL**（201 既有 + 4 P4 + 8 controller + 3 P2）
- **lint / build**：
  - `npx eslint src`：0 error（1 个预存在 warning：`src/events/resize.js:60` complexity，非本轮改动文件）
  - `npx stylelint "src/**/*.scss"`：0 报错
  - `npm run build`：exit 0（dev + prod 全部产物）
- **B4 性能复采（默认场景 100k，perf 列开关，与基线同流程）**：
  - 稳态测量侧：12 帧合成 scroll，`__valueCalls` 帧增量 **全 0**（基线每帧 16 = viewRows.count，P1 前实测）
  - 稳态绘制：`lastPaint.elapsed` 12 帧中位 **1.3ms** = 基线中位 1.3ms（≤ ×1.1 判据满足）
  - 首扫混合口径（`lastRelayout.elapsed − lastPaint.elapsed`，few↔full 切换）：基线 3 轮 199.9/238.3/248.4（中位 238.3ms），改后 5 轮 256.7~313.7（中位 283.4ms）。**数值上升，判定为环境漂移 + 口径噪声，非估高回归**。证据：同环境 node A/B（100k 行 × 17 列，估高本体计时）：新实现 49.1~51.1ms vs 基线逻辑复刻 72.0~75.9ms（**约 -33%**），扫描产物一致（heights/total/hasArrayValues 相同）；且该口径含尾精算+重绘+框架成本，设计 §6 已注明"不能直接比"。待验证轮空载复测确认。
- **B3 冒烟（playwright DOM 断言）**：
  - recordsVersion 就地改值（multiline）：改 `records[1].long10` → 仅通知按钮 → contentHeight 444→570、cell(1,2) 70→196（P1 后两轮复测与基线逐项一致）
  - 稳态滚动锚定：12 帧 scrollTop 恒 200000、contentHeight 恒 3600206（无补偿扰动）
  - 编辑提交行高重估：multiline row1 long3 改短文本 Ctrl+Enter 提交 → contentHeight 444→426、cell(1,1) 70→52（`remeasureRow → remeasureVariableRow → measuredSnapshot` 路径覆盖）
  - 树展开：collapseAll 360144→72036 → expandAll →360144（scanCount 10003、rebuild true）
- **B5 锚点（与基线逐项相等）**：items 场景 contentHeight 426、links/list/listLink 行高 [70, 88, 36, 196]×3 列；multiline 444；100k contentHeight 3600206；data/table（DOM 版，共用 column-types）0 console error 正常渲染

## 遗留

1. **B4-2 首扫口径待验证轮确认**：浏览器混合口径复采高于基线（详见自检节证据链）；建议验证轮空载状态下同口径复测，或改采估高本体口径（node A/B 已给出 -33% 证据）。基线与复采采样期间 rollup watch 均在常驻重建，负载差异无法事后消除。
2. 编辑冒烟首次用合成 blur 事件未提交（组件提交契约 = Ctrl/Cmd+Enter 或画布外点击，editor.js `buildEvents`）——测试手法问题，非组件回归；改用 Ctrl+Enter 成功。
3. perf 计数列仅默认场景接线（设计 §5/§6 口径即默认场景 100k）；multiline 场景未接。
4. 文档未更新（decisions.md：未经用户确认不更新三处文档）。
5. 供验证轮：夹具开关 caption 为「性能计数列（默认场景，初始水平视口外）」、按钮 caption 为「recordsVersion++（仅通知）」，均默认关闭。
