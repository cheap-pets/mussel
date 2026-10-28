# 实施记录 — I2 修复第 1 轮（implementer，修复模式）

对应 05-verify-1.md 失败项 1/2/3，处置依据 decisions.md「[I2-1]」。

## 改动文件

| 文件 | 对应失败项 | 说明 |
|------|-----------|------|
| `src/components/canvas-table/theme.js` | 失败项 1①（触发源收窄） | ①新增导出 `snapshotsEqual(a, b)`（内部 `colorsEqual` 子函数）：21 固定字段逐键严格相等 + colors 每色 color/translucent 严格相等；②`createThemeWatcher.applyChange` 增变更抑制门控——`reason === 'mutation'` 且重读快照与上次逐字段相等时不通知 onChange（`snapshot` 赋值一并后移到门控之后）。**方案选型说明**：派发候选三案（忽略已知滚动 class / 滚动 class 移出被观察根 / 仅认探针属性变化）中取「快照相等门控」——机制上属第三案（mutation 只有在重读出真实差异时才升级为变更信号），但不枚举滚动 class 名单（theme.js 不依赖壳的 class 命名，新增滚动状态 class 无需同步；模块隔离不破坏），也不改 DOM 结构与 scss（不扩白名单）。真实主题变更（暗色切换、变量覆盖、DPR）重读必有差异，门控不拦；`dpr`（画布物理尺寸）与 `manual`（refreshTheme 显式兜底）两个 reason 不抑制 |
| `src/components/canvas-table/canvas-table.vue` | 失败项 1②（A2.4 record 引用级行高缓存） | ①壳内新增 `measuredRowHeights = new WeakMap()`（record 引用为键）+ `measuredHeightsSig`（失效签名）；②新增 `applyMeasuredHeightCache(heights, rows, colWidths, snapshot)`：签名（colWidths.join + fontSize/fontFamily/rowHeight/cellPadding/cellLineHeight）变化 → 缓存整体失效重建（仅颜色变化的暗色切换签名不变、缓存保留），随后估高结果逐行 `Math.max` 混入缓存真值（估高 = 下界 ≤ 精算），`relayoutAndRedraw` 的 variable 分支在 `createVariableRowGeometry`/`rebuild` 前调用——**两条 rebuild 路径（行数变/不变）均复用未变行已精算真值**；③`remeasureVisibleRows`/`remeasureRow` 两处 `ensureRowMeasured` 返回后 `measuredRowHeights.set(rows[row], height)` 写缓存；④columns watch 置空 `measuredHeightsSig`（列定义 maxLines/maxItems/类型变化使行高语义失效，下次 relayout 重建）。树 toggle 的 levels 按 record 不变，无需纳入签名 |
| `demo/src/data/canvas-table/main-view.vue` | 失败项 2 | fixed 场景：①`fixedColumns` 按钮列（L650 一带）补 `buttons: record => record.buttons`（与 items 场景 L588 同型）；②`itemRecords` 4 条记录补 `count` 字段（120/456/789/24）——数量列（type number）NaN 消除。count 同被 items 场景数据源复用，该场景无数量列，零影响 |
| `demo/src/data/canvas-table/self-checks/theme.js` | 失败项 1①（自检补断言） | 新增 1 条断言组「snapshotsEqual：快照相等判定（mutation 变更抑制门控，verify-1 失败项 1 回归）」：同环境两次快照相等 / 同引用短路 / 空值不等 / fontSize 维度 / colors 单色 color、translucent 两维度 / colors 浅拷贝相等 / 键集合缺失防护。面板总数 142 → **143** |
| `agent-docs/plans/20261025-editable-table/02-design.md` | 失败项 3（文档补记） | 仅三处补记，不改技术内容：①改动清单「共享文件（2）」→「共享文件（3）」，增补 `tag.js` 一行（valueToTags 对象条目原样保留，标量路径不变；原因列注明与 link.js P1 同型孪生缺口 + S1 裁决授权 + 「已实施并验证，仅补记」）；②共享文件改动汇总段同步列 tag.js；③self-checks cell-painters.js 行的 TagColumn compile 断言补归属说明（S1 补记，tag.js 共享文件改动的 DOM 版回归断言，镜像 LinkColumn 写法，27→28 条） |

## 偏离

无。三项修复均在 [I2-1] 授权范围与文件白名单内（自检文件按派发说明新增于 self-checks/ 下）。

说明（非偏离）：`canvas-table.vue` 存在 2 个 eslint error（L1036 `isObjectEditor(editor)` 参数 shadow、L1082 `startResize` 内 `containerWidth` 未使用）——均为本轮未触碰的既有代码（行号因本轮插入 ~30 行整体下移），按范围克制与前序实例口径（04-impl-集成.md 同类处置）不动，留待后续处理。

## 自检

环境：demo watch 常驻 :3000（改动后自动重建，产物经 `/assets/catalog.js` 轮询确认含新代码）。页面 `visibilityState = 'hidden'`（浏览器窗口后台，与 verify-1 同环境）：原生 scroll/输入停发，交互经合成事件驱动真实处理器链；等待用 Node 侧 `waitForTimeout`（页内 chained setTimeout 在后台页嵌套 ≥5 级触发 1 次/分钟密集节流，首轮实测超时后全部改 Node 侧等待）。rAF 落地等待 ≥1.2s/步。

| 项 | 结果 |
|---|---|
| eslint（4 个改动文件） | 0 新增问题：theme.js 本轮新增 `snapshotsEqual` complexity warning 已拆 `colorsEqual` 消除，canvas-table.vue `relayoutAndRedraw` 20→17（缓存逻辑提取为 `applyMeasuredHeightCache`）；剩余 2 error 为既有遗留（见偏离说明） |
| 自检面板 | 首载 143/143（改动后）、页内「重跑自检」143/143、reload 后再首载 143/143——三轮全绿，0 ✗（142 + 新增 snapshotsEqual 1 条；2 个 console error 仍为夹具故意 badSrc） |
| **修复①核心断言：快照门控** | 默认场景滚底↔回顶 2 轮 + 树场景底部↔中部 7 腿：`getThemeSnapshot()` 对象引用全程不变（旧行为滚动边界 class 翻转即换快照对象）；暗色切换（mu-dark 挂根）快照正常更新（bgNormal `rgb(255,255,255)`↔`rgb(7,8,8)`）、refreshTheme 后引用更新——真实变更不被门控拦截 |
| **修复②核心断言：滚动单调（verify-1 复现场景）** | 树场景（variable，1 万节点含长文本）底部↔中部往返 **3 轮** + 终回中部：scrollHeight `360144(初始估高)→360178(底部精算)→360212(中部增量)` 后 6 次读数恒 360212，**单调不回缩**（旧行为 360178↔360144 交替回缩）；row 9998 行高 7 次读数恒 **70**（旧行为滚离后回缩 36）；重构等价性复验（提取 applyMeasuredHeightCache 后 fresh reload 重测）同结果 |
| 修复②辅证：rebuild 路径缓存保留 | refreshTheme（全量重估 + rebuild）后 contentHeight 360212 不回缩；树 toggle 收起→重展开 contentHeight 精确恢复 360212（未变行复用真值，非估高基线 360144） |
| 失败项 2：fixed 场景 | fillText 探针（整幅重绘采样 106 条）：`120`/`456` 等 count 数字渲染、全量无 `'NaN'`；button 列有绘制（『编辑』『删除』文本）；点击滚动区按钮 → `cell-item-click {"record":"#1","column":"buttons","button":{"caption":"编辑"},"recordIndex":0}` + 选中链（update:selected-record(-key)、cell-click）照发——#14 双区命中 button 半边恢复可执行 |
| 回归：树 toggle | row 0 箭头点击：expandedKeys 2001→2000（contentHeight 359960）→2001（360212），toggle 正常 |
| 回归：单击编辑 | editable 页单击可编辑格 → 编辑浮层打开（INPUT 聚焦，高 34 = controlHeight+2，与 verify-1 记录一致）；fixed 场景未配 editor 的名称列单击只发选中链不开编辑（isCellEditable 既有语义，行为正确） |

未跑 `npm run build`（归 verifier 复跑；demo watch 直接以 src 为源打包，页面验证即真实产物）。

## 遗留

1. UNVERIFIED 4 项（#7 price clearable e2e、#8 行高变量覆盖数值跟随、#12 borderless clear/下拉、#14 progress 全色抽样）本轮未处理——属抽验范围取舍非 FAIL，其中 #8 的链路触发已被本輪门控回归覆盖（变量覆盖 → refreshTheme 通道不抑制）。
2. canvas-table.vue 2 个既有 eslint error（位置见「偏离」说明）。
3. verify-1「需人工检查」4 项（选型结论终审、10 万行帧感、编辑器视觉、文档三处同步）不属代码修复范围。
