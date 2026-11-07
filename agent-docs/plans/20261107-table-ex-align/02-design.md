# 设计

## 方案概述

核心：把文本垂直锚的测量基从 `measureText('')` 的 `fontBoundingBox`（主字体整字体包围盒——对 CJK 回退字体不敏感，跨系统字体栈漂移大）换成典型 CJK 字符 `'永'` 的 `actualBoundingBox` 墨迹半差；单字形内容（iconfont 图标、check ✓）另走逐字形墨迹锚。两者都保持 alphabetic 基线 + 整数取整 + 度量缺失回退 `'middle'` 的既有形态。

- 测量惰性发生在首次取锚（即首次绘制该 font 前）；fonts 已 loaded 时同 font 串（含字号/字重）只测一次，图标键含 glyph，字号变（font 串变）才重测——满足"绘制前实测、不重复测"且零预排开销。fonts 未 loaded 期间测得值不缓存（见守卫），该窗口内按 fillText 站点重复测量，有界于 fonts.ready、稳态为零。
- 缓存为模块级全局（结论与理由见下），`document.fonts.status !== 'loaded'` 期间测得值不入缓存（防 @font-face 加载前 tofu/回退度量固化）。

约束 3 结论（测量数据是否全局保存）：**适合全局（模块级）保存**。① 度量是 (font 串, glyph, 系统字体栈) 的纯函数，与表格实例无关，按实例存只会重复测同一数据；② 与既有模块级缓存先例一致（`textAnchorCache` 本就是模块级 cell-text.js:30、`measureCached` paint-header.js:23、`imageCache` icon-image.js:10）；③ 基数有界（绘制实际用到的 font 串 × 字形数），无需淘汰策略。

约束 4 结论（对齐算法复核）：已复核全部垂直定位站点（表见「接口 / 数据结构」复核表）。需调整 4 处：表头文本与表头 ✓（20261029 统一的 `'middle'` 遗漏站点，paint-header.js:79,137）、单元格 ✓（item-painters.js:334）、iconfont 字形（icon-image.js:91）；其余 8 个文本站点（含 tag 文本 item-painters.js:381）随测量基替换自动升级、svg/path 图标为几何居中无需动、下划线/itemHits/行高链与锚无耦合。

触及边界：L3 cell-paint/cell-text.js（测量基 + 新增字形锚）、icon-image.js、item-painters.js、table-paint/paint-header.js（新依赖边 paint-header → cell-paint/cell-text，同 paint-body → cell-painters 先例，无环）；L4 shared、行高/relayout 链路零改动（垂直锚不参与行高计算）。自检 demo/src/data/table-ex/self-checks/cell-painters.js 口径同批更新。

性能（约束 2 / 验收 5）：锚查询稳态 = 每次 fillText 前一次 `Map.get`（与现状同量级）；新增 measureText 仅"每 font 串 + 每 (glyph,font) 一次性"（fonts 未 loaded 窗口除外，见守卫）；不触 widthCache/wrapCache/measureCached/relayout 时机。性能基线与自检缓存计数须在 `document.fonts.status === 'loaded'` 后取数（demo 页无 @font-face，模块加载后即 loaded；引用页面 webfont 的消费方才存在 loading 窗口）。

## 遵循约定与复用

无探索报告，约定自行提取自源码与知识条目（00-task.md 必读知识）：

- 复用 cell-text.js 既有锚结构：`textAnchorCache` 模式、`ctx.__muTextAnchorCapable` 实例能力位（真 canvas 与 width-only stub ctx 分键，cell-text.js:56-60）、`Math.round` 整数锚、度量缺失回退 `{ y: centerY, baseline: 'middle' }`（cell-text.js:79-81）。
- 模块级缓存全局共享先例：`textAnchorCache`、`measureCached`（table-ex-structure-map.md §6.4）、`imageCache`（上限整体清空策略）——新缓存对齐该模式（基数有界，不加淘汰）。
- 自检口径同步约定（canvas-pixel-assert-anchor-drift）：锚点/断言同批改写，grep 旧公式全扫 self-checks——已定位需同步点：cell-painters.js:219-236 `textAnchorOffset`、:2286 图标锚断言。
- 性能验证方法（table-ex-performance-profiling）：劫持 `CanvasRenderingContext2D.prototype.measureText` 计数 + 稳态帧增量归因。
- 交互回归方法（table-ex-demo-interaction-verify）：demo 页 /data/table-ex/ 自检 + 事件日志抽查。

## 改动清单

| 文件 | 改动 | 原因 |
|---|---|---|
| src/components/table/ex/cell-paint/cell-text.js | 新增 `CJK_PROBE_CHAR` 导出；`probeTextMetricsCapable` 改用探针字符测 `actualBoundingBox*` 有限性；`centeredTextAnchor` 测量基换 CJK 墨迹半差；缓存写入加 fonts-loaded 守卫；新增 `centeredGlyphAnchor` + `glyphAnchorCache` | 验收 1/2/3：实测度量、缓存、全局结论落地 |
| src/components/table/ex/cell-paint/icon-image.js | cls 路径（:91）锚从 `centeredTextAnchor` 换 `centeredGlyphAnchor(ctx, icon.glyph, …)` | 验收 2：图标按实测渲染高度定位 |
| src/components/table/ex/cell-paint/item-painters.js | `drawCheck` ✓（:334）换字形墨迹锚 | 验收 4：复核调整（✓ 墨迹框 ≠ CJK 表意字） |
| src/components/table/ex/table-paint/paint-header.js | `drawHeaderText`（:137-138）换 `centeredTextAnchor`；`drawHeaderCheck` ✓（:79-80）换字形锚；新增 import cell-paint/cell-text | 验收 4：复核调整（`'middle'` 遗漏站点，同类缺陷收敛） |
| demo/src/data/table-ex/self-checks/cell-painters.js | `textAnchorOffset` 换 CJK 墨迹公式（import `CJK_PROBE_CHAR`，含墨迹零高回退 0）；:2286 换字形墨迹口径（新增 `glyphAnchorOffset` 助手）；新增断言（fonts loaded 前置 + 专属冷 font 串/字号，口径见测试计划 1/2 行）：跨 canvas 实例同 font 二次绘制仅新增能力探测 1 次、同 glyph 同 font 不重测 / size 变重测恰 1 次 | 自检口径同步（pitfall 条目）+ 验收 1/2/3 的行为断言 |

不改动：paint-overlay.js（树箭头几何居中；编辑按钮 svg 形态几何居中、cls 形态经共享 `drawIconGlyph` 自动生效）、row-geometry 全链、shared/*、table-ex-structure-map.md（无分层变化，新依赖边落在既有 PAINT→CELL 边束内）。文档（skills/docs-site/docs）按项目规则待用户确认后另行处理，不入本清单；agent 知识条目（canvas-text-optical-centering.md 的锚公式结论等）按 AGENTS.md 在任务结束走 project-knowledge 沉淀更新，也不入本清单。

## 接口 / 数据结构

```
// cell-text.js —— 签名全部不变/新增，无破坏性变更
export const CJK_PROBE_CHAR = '永'   // 永字八法全笔画类满高表意字，单字符即单字形度量

export function centeredTextAnchor (ctx, centerY)  // 既有签名，测量基变更
  // 内部：alphabetic 态 ctx.measureText(CJK_PROBE_CHAR)
  //   offset = Math.round((actualBoundingBoxAscent − actualBoundingBoxDescent) / 2)
  //   返回 { y: centerY + offset, baseline: 'alphabetic' }
  // 回退（同现状）：能力探测失败 / actualBoundingBox* 非有限 / 墨迹零高 → { y: centerY, baseline: 'middle' }
  // 缓存：textAnchorCache 键不变（能力位 + ctx.font 串，font 串含字号字重 ⇒ 同字体+字号不重测）

export function centeredGlyphAnchor (ctx, glyph, centerY)  // 新增：单字形墨迹锚
  // 键 = glyph + '\u0000' + ctx.font（+ 能力位）；offset 同式，用 glyph 自身 actualBoundingBox
  // 消费：icon-image cls 字形、单元格/表头 ✓；返回结构同 { y, baseline }

// 缓存写入守卫（两缓存共用谓词，仅 miss 路径执行）：
//   document.fonts?.status !== 'loaded' → 本次测量即用即弃，不写缓存
//   （无 FontFaceSet 视同 loaded；命中路径不查，稳态零开销）
// 能力探测保持每 ctx 实例一次（`__muTextAnchorCapable` 实例位，勿改为模块级）：
//   探测本身 = 一次 measureText(CJK_PROBE_CHAR)，与锚 miss 测量分开计——新实例首绘
//   固定 2 次探针字符测量（探测 1 + 锚 1），同 font 的第二实例仅 1 次（探测 1，锚命中）
```

### 对齐站点复核表（约束 4）

| 站点 | 现状 | 结论 |
|---|---|---|
| 单元格文本 8 站点：cell-text.js:136,182、canvas-kind-painters.js:51,251,308、item-painters.js:287,381（tag 文本）、link-items.js:29 | fontBoundingBox 半差锚 | 测量基替换后自动升级，站点代码零改动 |
| 表头文本 paint-header.js:137-138 | `textBaseline='middle'`（20261029 统一遗漏） | **调整** → `centeredTextAnchor`（headerFontOf 500 字重自成缓存键） |
| 表头 ✓ paint-header.js:79-80 | `'middle'` | **调整** → 字形墨迹锚 |
| 单元格 ✓ item-painters.js:334-338 | fontBoundingBox 半差 | **调整** → 字形墨迹锚（✓ 墨迹偏 em 框上部，CJK 探针不准） |
| iconfont 字形 icon-image.js:87-94 | fontBoundingBox 半差（CJK 探针在片 1 后亦不准） | **调整** → 字形墨迹锚（任务核心：实测渲染高度） |
| svg 图标 icon-image.js:80（drawImage size×size）、paint-overlay.js:256 编辑按钮（svg 形态几何居中；cls 形态经 `drawIconGlyph` 字形锚自动生效，该文件无需改）、树箭头 treeNodeExpand（svg） | 几何居中 / 共用 drawIconGlyph | 无需调整（无字体参与，或随共享函数生效） |
| 树箭头三角 paint-overlay.js:22、排序图标三角 paint-header.js:85 | path 绘制 | 无需调整 |
| link 下划线 `linkUnderlineY = anchorY + 2`（cell-text.js:206-208） | 基线相对常量 | 无需调整：锚只改变基线相对槽位的定位，CJK descent ≈ 0.12em < 2px 前提不变 |
| itemHits 命中矩形 / editor 几何 | centerY ± 框高/2（item-painters.js:164-168、link-items.js:66） | 不受影响（不消费锚 y） |
| 行高链 row-geometry / recordsVersion / relayout 时机 | `cellLineHeight` 快照驱动 | 不受影响（垂直锚不参与行高；table-ex-recordsversion-height-contract 契约无触点） |

设计取舍说明：CJK 探针对纯拉丁单元格存在 ≤1px 级光学偏移（拉丁墨迹中心与 CJK 表意字墨迹中心的固有差异），单一锚无法同时精确两种文字系；按任务方向（产品以中文为主、参考方案明示典型 CJK 字符）取 CJK 口径，与 DOM 行框居中的既有差异同量级，接受并记录。

## 被拒绝的备选

1. **逐单元格按实际文本测 actualBoundingBox**：测量次数随格内容数增长、缓存键含全文致基数失控，破坏 widthCache 缓解成果（违背验收 5），且任务明示"典型 CJK 字符"口径。
2. **保留 fontBoundingBox 半差、按平台探测加硬编码修正值**：回到硬编码常数（违背验收 1），且无法表达字体回退链差异。
3. **DOM 探针元素（span + getBoundingClientRect）测墨迹**：引入强制 reflow 与探针生命周期管理；theme.js 探针只读 CSS 变量不做布局测量，canvas `measureText` 已提供同等能力，成本更高收益相同。
4. **图标锚复用文本 CJK 探针（不逐字形测）**：iconfont 字形墨迹框与 CJK 表意字差异大（图标常不满 em 框），达不到"实测渲染高度"（验收 2）。

## 风险与回滚

- 门类型：**双向门**。纯绘制内 y 偏移口径变更，无 API/数据结构/持久化变更；回滚 = revert 改动清单 5 文件。
- 爆炸半径：仅 table-ex 画布内文本/图标垂直位置（预期移动 ≤2px 量级）；DOM 版 mu-table、编辑浮层、tooltip、其他组件零影响。
- 合并风险：低。唯一新依赖边 paint-header → cell-paint/cell-text（纯函数 import，无环：cell-text 仅依赖 shared/*）。
- 视觉变化面：全部 table-ex 文本/图标垂直位置随系统实测度量浮动——这正是目标行为，但对像素级视觉回归敏感；demo 截图对比差异属预期。
- 自检漂移（pitfall：canvas-pixel-assert-anchor-drift）：`textAnchorOffset` 与 :2286 断言同批更新；实施时 grep `fontBoundingBox` 全扫 self-checks 确认无残留口径（当前仅 cell-painters.js:221-230 一处）。
- 已知残余（既有行为类，非本次引入）：@font-face 在 `fonts.status` 已 `'loaded'` 后再触发加载的极端场景，锚与宽度缓存（widthCache 同病）均可能短暂陈旧至下次主题/尺寸变更；量级与现状相同，不扩大处理。
- fonts 未 loaded 窗口的取舍（本次引入）：该窗口内锚/字形度量即用即弃 → 每次整幅绘制按可见文本站点数重测（量级 = 视口行 × 文本站点，非全表），fonts.ready 后回稳态零增量；换取"不固化回退/tofu 度量"。demo 页无 @font-face（status 即 loaded），性能与缓存计数验证不受影响。
- 自检既有注释口径：painter.js:784/1399 的"middle 基线"描述在新锚下已过时，但容差断言与采样区（80..110）不受影响，不列入改动清单。

## 测试计划

| 验收标准 | 归属 | 手段 | 具体检查方式 |
|---|---|---|---|
| 1 文本实测度量 + 同字体字号缓存 | 片1 | 浏览器（demo 自检） | `textAnchorOffset` 改 CJK 墨迹公式（含墨迹零高回退 0）后槽位锚断言组（y = 19 + OFF）全绿；新增缓存断言（前置断言 `document.fonts.status === 'loaded'`；用全 self-checks 未用的专属 font 串 `13px sans-serif`，避开模块级缓存被前序用例预热；绘制文本用 '甲' 不混入计数）：单次 `drawRecorded` 内统计 `measureText(CJK_PROBE_CHAR)` 调用数——canvas A 首绘 = 2（能力探测 1 + 锚测量 1），canvas B（新实例）同 font 首绘 = 1（仅能力探测，锚命中模块级缓存），两者 fillText y 相同 ⇒ 跨实例不重测（兼证验收 3） |
| 2 图标实测高度 + 字号不变不重测 | 片2 | 浏览器（demo 自检） | :2286 锚断言改字形墨迹口径（新增 `glyphAnchorOffset(glyph, font)` 助手，含墨迹零高回退 0）后绿；新增缓存断言（同 fonts loaded 前置；cls 夹具 demoGlyphA glyph '●'，用全 self-checks 绘制未用的专属字号 19）：统计 `measureText('●')` 调用数（能力探测测的是 `CJK_PROBE_CHAR`，不混入）——19px 首绘 = 1；同 glyph 同 font 二次绘制（新 canvas）= 0；size 19→21 再绘 = 恰 1 次 |
| 3 全局保存结论落实 | 片1 | 浏览器（demo 自检）+ 人工 | 结论在本设计「方案概述」；落实观测 = 验收 1 的跨实例缓存命中断言 + 代码结构（模块级 Map） |
| 4 对齐算法复核结论 | 片2 + 终验 | 人工 + demo 视觉 | 本设计「对齐站点复核表」逐站点结论；表头两站点调整后 demo 页表头视觉抽查（caption 与表体文本同口径） |
| 5 性能无显著增量 | 终验 | 浏览器（劫持计数） | 按 table-ex-performance-profiling：先确认 `document.fonts.status === 'loaded'` 再取初始计数 C0（loading 窗口内锚测量不缓存，计数会失真）→ 5 次滚动 + 3 次 hover + 1 次列宽拖动 → C1；稳态帧增量须为 0（锚与宽度缓存全命中）；首帧（fonts.ready 后整幅重绘）相对基线（dev@095cfdf 同操作）差 ≤ 首绘 font 串数 + 图标字形数（一次性，量级 <10），且二次全幅重绘增量 0 |
| 6 demo 无回归 | 终验 | 浏览器 | /data/table-ex/ 自检面板全绿；按 table-ex-demo-interaction-verify 抽查：单元格点击、列排序、可编辑格打开/提交、link/tag/button hover、树列展开、tooltip；/data/table-ex-basic/、/data/table-ex-scene/ 首屏表头/表体文本与图标可见、无控制台错误 |

## 实施步骤

片1 文本 CJK 墨迹锚（对应验收 1、3）

1. 改造 cell-text.js：`CJK_PROBE_CHAR`、`probeTextMetricsCapable` 探针化、`centeredTextAnchor` 测量基替换、缓存写守卫。
   判据：`npx eslint src/components/table/ex/cell-paint/cell-text.js` 通过；模块导出面仅新增 `CJK_PROBE_CHAR`。
   文件：cell-text.js。依赖：无。
2. 同批更新自检 cell-painters.js：`textAnchorOffset` 换公式（含墨迹零高回退 0）；新增跨实例缓存命中断言（专属冷 font 串 `13px sans-serif` + fonts loaded 前置，口径见测试计划 1 行）；跑 demo 自检。
   判据：demo 页自检全绿（槽位锚断言组、多行/list/line-clamp 等消费 `TEXT_ANCHOR_OFF` 的断言随新口径通过；跨实例计数断言 A=2 / B=1）。
   文件：cell-painters.js（自检）。依赖：步骤 1。

片2 字形墨迹锚 + 表头收敛（对应验收 2、4）

3. cell-text.js 新增 `centeredGlyphAnchor` + `glyphAnchorCache`（守卫、零墨迹回退同文本锚）。
   判据：eslint 通过；与 `centeredTextAnchor` 无共享可变状态冲突。
   文件：cell-text.js。依赖：片1（同文件先后编辑，避免交叉）。
4. 消费切换：icon-image.js cls 路径、item-painters.js `drawCheck`、paint-header.js `drawHeaderText`/`drawHeaderCheck`（含新 import）。
   判据：eslint 通过；`grep -rn "textBaseline = 'middle'" src/components/table/ex/` 仅剩 cell-painters.js:67（drawCell 默认态，非 fillText 站点）——cell-text.js 回退分支是返回 `{ baseline: 'middle' }`（非赋值），四个目标站点无残留。
   文件：icon-image.js、item-painters.js、paint-header.js。依赖：步骤 3。
5. 自检更新：新增 `glyphAnchorOffset(glyph, font)` 助手、:2286 口径、图标缓存/重测断言（专属字号 19→21）、表头 ✓ 相对像素断言复核（painter.js:588 区域型，预期不需改）。
   判据：demo 页自检全绿（图标计数断言 19px 首绘 1 / 二次 0 / 19→21 恰 1）。
   文件：cell-painters.js（自检）。依赖：步骤 4。

终验（无代码改动）

6. 性能计数对比（验收 5 口径）+ demo 交互回归（含 table-ex-basic/scene 首屏）+ 表头视觉抽查；全量 lint。
   判据：见测试计划 5/6 行；`npx eslint src/components/table/ex demo/src/data/table-ex` 通过。
   依赖：片1、片2。

共享/生成文件（barrel/路由/i18n 等）：无——自检文件按片内步骤就地编辑，不单列集成片；跨片行为（性能、整页回归）归终验。

## 未解问题

无。
