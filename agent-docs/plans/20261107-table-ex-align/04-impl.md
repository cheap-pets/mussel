# 实施记录

按 02-design.md（经 06-amend-1 交叉审改后正文）整体实施，片1（步骤 1–2）→ 片2（步骤 3–5）→ 终验（步骤 6）。基线 dev@095cfdf，工作区 src/demo 无前置改动。

## 改动文件

| 文件 | 设计步骤 |
|---|---|
| src/components/table/ex/cell-paint/cell-text.js | 步骤 1：`CJK_PROBE_CHAR` 导出、`probeTextMetricsCapable` 探针化（measureText('永') 测 actualBoundingBox* 有限性）、`centeredTextAnchor` 测量基换 CJK 墨迹半差、缓存写入守卫 `fontsLoadedForCache`（document.fonts.status !== 'loaded' 即用即弃）；步骤 3：新增 `centeredGlyphAnchor` + `glyphAnchorCache`（键 = 能力位前缀 + glyph + '\u0000' + ctx.font），与文本锚共用纯函数 `inkHalfDiffOffsetOf`（度量缺失/非有限/墨迹零高 → null → 'middle' 回退） |
| src/components/table/ex/cell-paint/icon-image.js | 步骤 4：cls 路径锚从 `centeredTextAnchor` 换 `centeredGlyphAnchor(ctx, icon.glyph, centerY)`（import 同步替换，svg 路径 drawImage 不动） |
| src/components/table/ex/cell-paint/item-painters.js | 步骤 4：`drawCheck` ✓（:334 区域）换 `centeredGlyphAnchor(ctx, '✓', centerY)`；drawItemText/drawTag 文本锚不动 |
| src/components/table/ex/table-paint/paint-header.js | 步骤 4：`drawHeaderText` 换 `centeredTextAnchor`（500 字重自成缓存键）、`drawHeaderCheck` ✓ 换 `centeredGlyphAnchor`；新增 import '../cell-paint/cell-text'（新依赖边 PAINT→CELL，落既有边束） |
| demo/src/data/table-ex/self-checks/cell-painters.js | 步骤 2：`textAnchorOffset` 换 CJK 墨迹公式（import `CJK_PROBE_CHAR`，经共享基座 `inkOffsetOf`，含墨迹零高回退 0）、新增 `countMeasureTextDuring` 劫持计数助手、新增「文本锚缓存」跨实例断言（fonts loaded 前置 + A=2/B=1 + y 相同）；步骤 5：新增 `glyphAnchorOffset` 助手、:2286 图标锚断言换字形墨迹口径、新增「字形锚缓存」断言（首绘 1 / 同 glyph 同 font 二绘 0 / 19→21 基底恰 1，直调 drawIconGlyph） |

不改动（与设计一致）：paint-overlay.js、row-geometry 全链、shared/*；painter.js:588 表头 ✓ 区域像素断言实测不需改（自检面板全绿佐证）。

## 偏离

1. **步骤 2 / 步骤 5（测试计划行 1、行 2）：计数断言键改为「基底 + 每次运行随机小数」**。设计指定固定冷键（font 串 `13px sans-serif`、整数字号 19→21）。固定键在页内「重跑自检」第二次运行时必然被首次运行的模块级缓存预热（textAnchorCache/glyphAnchorCache 为模块级 Map，跨运行存续），A=2 / 首绘=1 断言不可复现——文件头注释既有约定要求自检重跑幂等（cell-painters.js 头注「规避页内重跑时序竞争——G1-b 遗留」、`noRegEntry${Date.now()}` 唯一名先例）。实现：文本锚用 `${(13 + Math.random()).toFixed(4)}px sans-serif`（theme.fontSize 传同值，ctx.font 序列化保小数、两侧同串同键）；字形锚因列路径 `iconOption.size` 经 `iconSizeOf` 的 `Math.round` 收敛整数，改直调 `drawIconGlyph(ctx, icons.demoGlyphA, { size: (19|21) + rand })`（glyph '●' 仍取 demoGlyphA 注册表项，19/21 基底冷口径保留——demo 页与其余自检只用 16/20/12 整字号）。设计协议语义（fonts loaded 前置、A=2/B=1、y 相同、同 glyph 同 font 不重测、size 变恰重测 1 次）全部保留，实测重跑幂等（见自检）。
2. **步骤 5 相邻必要修复（同一检查块内）**：`drawIconGlyph` 检查的消息串 `'font = \`${size}px ${fontFamily}\`'` 为 HEAD 存量 lint error（no-template-curly-in-string，对 HEAD 版本复跑 eslint 确认），该检查本轮必须改写（:2286 口径切换），消息随同改为无插值串；新增断言直调 `drawIconGlyph` 后其 import 由 HEAD 存量 unused error 转为使用。两项为满足步骤 6 全量 lint 判据的最小相邻修复，不改断言语义。

无其他偏离；未推翻 decisions.md 任何约束。

## 自检

- 步骤 1：`npx eslint src/components/table/ex/cell-paint/cell-text.js` 0 error（complexity 警告经对 HEAD 版本 stdin 复跑确认为存量）；`grep ^export` 导出面仅新增 `CJK_PROBE_CHAR`（步骤 3 后另增 `centeredGlyphAnchor`，符合分步口径）。
- 步骤 4 判据：`grep -rn "textBaseline = 'middle'" src/components/table/ex/` 仅剩 cell-painters.js:67（drawCell 默认态）——与设计判据逐字一致；三消费文件 eslint 0 error（measureItem/drawItem complexity 警告为存量）。
- 片1 中间态 demo 自检（rollup watch 重建后，/data/table-ex/ 面板）：233/233 通过，新断言输出「A=2 / B=1，y 恒 25（font 13.8743px sans-serif 跨实例不重测）」。
- 片2 后 demo 自检：234/234 通过，字形锚断言输出「首绘 1 / 同 font 二绘 0 / 变 size 恰 1」（19.3095px / 21.16px "Noto Sans SC"）；重跑自检后两新计数断言仍通过（新随机冷键 13.8135px、19.3747px/21.9016px，证明幂等）。
- 性能（验收 5，table-ex-performance-profiling 口径）：前置 `document.fonts.status === 'loaded'` ✓；劫持 `CanvasRenderingContext2D.prototype.measureText` 后——5 次滚动增量 34~35/次，byText 显示全部为首次入视口新文本的宽度测量且每文本恰 1 次（width 链与基线同构，未触碰）；回滚已见区增量 0；3 次 hover 增量 0；列宽拖动（160→190，整幅重绘）增量 0；拖后一帧增量 0；全程探针字符 '永' 计 0 次、字形 '●' 计 0 次 ⇒ 锚/字形缓存稳态全命中，无逐帧/逐行重复测量。
- 首帧对比基线（验收 5 上界）：基线 dev@095cfdf 不可实测（禁 checkout），按 HEAD 源码语义静态推导——基线首帧锚测量 = 每 font 串 1 次 measureText('')；改动后 = 每 font 串 1 次 '永'（次数同）+ 每 (glyph,font) 1 次 + 每 ctx 实例 1 次能力探测（探测次数两版相同）。净增 ≈ 字形锚新 font 串（demo icon 16px/20px ≈ 2）+ 表头 500 字重串（1）≈ 3，远小于上界「首绘 font 串数 + 图标字形数」。【推导结论，基线侧未实测】
- demo 交互回归（验收 6）：单元格点击 cell-click/update:selected-record ✓；列排序 header-click + update:order-by "count:asc" ✓；可编辑格打开 → 真实键盘输入 + Enter 提交 → update:cell-value + `.mu-table-ex__editor` 关闭 ✓；link 条目 hover cursor=pointer + 点击 cell-item-click（payload item）✓；button 条目 hover cursor=pointer + 点击 cell-item-click（payload button {icon:'clock'}）✓；树展开/收起 tree-expand/tree-collapse + update:tree-expanded-keys 双向 ✓；tooltip 溢出全文面板（`.mu-tooltip-panel` 文本「记录 000001」）✓；列宽拖动 colWidths 160→190 ✓。tag hover 无 pointer 属既定行为（use-pointer.js applyItemCursor 仅 link/button 给 pointer），tag 点击与 link/button 共用 resolveItemClick 管线、命中矩形由自检断言覆盖。
- 表头视觉抽查（验收 4）：表头 caption 墨迹行 [13..22] 中心 ≈17.5 vs 槽位中心 18、表体首行文本墨迹中心 ≈54.5 vs 槽位锚 54——caption 与表体同口径（±1px）；painter.js 自检表头 ✓ 区域断言随面板全绿。
- basic/scene 首屏（验收 6）：/data/table-ex-basic/、/data/table-ex-scene/ canvas 就位，表头/表体文本、link、bool、树箭头、合并区、按钮可见，0 控制台错误（截图 .playwright-mcp/table-ex-basic-first-screen.png、table-ex-scene-first-screen.png）。
- 风险节要求 grep：`fontBoundingBox` 全扫 demo self-checks 0 命中（残留口径清零）。
- 全量 lint：`npx eslint src/components/table/ex demo/src/data/table-ex` → 4 error 全部位于未触及文件（main-view.vue import/first ×2、self-checks/painter.js spaced-comment ×2，HEAD 即存在）；本任务 5 文件 0 error，剩余 warning 均 HEAD 存量（complexity ×5、max-len ×1 等）。

## 遗留

1. 存量（基线同病，非本任务引入）：自检「icon 列：非法值/未注册名空产物…」在页内「重跑自检」时恒败——`utils/warn.js` once 去重使固定消息第二次 warn 被抑制，断言「非 string dev warn 一次」落空（warn.js:6-16）。不在本设计改动清单，未处理。
2. 存量 lint error 4 个（main-view.vue ×2、self-checks/painter.js ×2）HEAD 即存在且不在改动清单，未处理；步骤 6「全量 lint 通过」判据在该意义上只能达到「本任务文件 0 问题」。
3. 设计已知残余按设计成立：fonts 未 loaded 窗口锚/字形度量即用即弃（demo 页无 @font-face，模块加载后即 loaded，不触发）；@font-face 在 status='loaded' 后再触发加载的极端场景与 widthCache 同病，量级不扩大。
4. 文档（skills / docs-site / docs）与 agent 知识条目（canvas-text-optical-centering.md 的锚公式结论等）按设计不入本清单：前者按项目规则待用户确认后另行更新，后者按 AGENTS.md 在任务收尾走 project-knowledge 沉淀。
5. 验证环境：demo watch 服务（3000 端口）为既有实例，rollup watch 自动重建，未重启/未打包。
