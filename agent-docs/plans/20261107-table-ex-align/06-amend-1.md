# 06-amend-1 设计交叉审改（design-amender，r=1）

VERDICT: AMENDED

上次回应核对：本轮为第 1 次审改（r=1），无上次改动/异议记录可核。

## 检查项结论

1. **覆盖**：6 条验收标准均有设计归属与测试计划；但原测试计划 1/2 行的缓存计数手段验证不了标准（能力探测的 measureText 未计入、模块级缓存可能已被前序用例/页面绘制预热），已改为可判定的计数协议。新增/修改的测试文件（自检 cell-painters.js）已列入改动清单与步骤 2/5。
2. **事实一致**：核对全部引用——cell-text.js:30,56-58,60,79-81、icon-image.js:80,91、item-painters.js:287,334,381、paint-header.js:79,137、self-checks 219-236/2286、structure-map §6.4 均属实。修正 2 处事实错误：文本锚站点漏计 item-painters.js:381（7→8）；步骤 4 的 grep 判据错误（cell-text.js 无 `textBaseline = 'middle'` 赋值，另有 cell-painters.js:67 drawCell 默认态）。
3. **约定一致**：沿用模块级缓存（cell-text.js:30、paint-header.js:23、icon-image.js:10 先例）、`__muTextAnchorCapable` 实例能力位、`Math.round` 整数锚、度量缺失回退 middle；新依赖边落于 structure-map 既有 PAINT→CELL 边束（§2 图 `PAINT --> CELL`）。
4. **影响面**：8 个文本锚站点（含 tag）+ 4 个调整站点（表头文本/表头 ✓/单元格 ✓/iconfont 字形）全覆盖；svg/path 站点几何居中不受影响；self-check 同批更新；agent 知识条目改走 project-knowledge 沉淀（已在设计注明，不入清单）。
5. **可实施**：片1→片2 无环；片1 中间态自检可绿（icon 仍走文本锚，自检 `textAnchorOffset` 同批改口径，2286 在片2 才切换）。
6. **风险与回滚**：双向门、回滚 5 文件；补记 fonts 未 loaded 窗口的重复测量取舍（约束 2）与计数前置条件。
7. **范围**：改动仅覆盖验收 1/2/3/4；未扩展至用户文档、其他组件、行高/relayout 链。
8. **切片**：片1/片2 顺序依赖、并发 1 无冲突；每条验收标准归属已补齐（原验收 4 归属为"—"，改为「片2 + 终验」）。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | 方案概述 bullet 1 | "同 font 串只测一次" 无条件 → 限定 "fonts 已 loaded 时；未 loaded 窗口即用即弃、重复测量有界于 fonts.ready" | 守卫使"只测一次"有条件，否则与守卫/测试口径矛盾；证据：设计「接口」守卫定义、cell-text.js:56-58 探测每实例一次 | 否 |
| 2 | 方案概述 约束 4 结论 | "其余 7 个文本站点" → "其余 8 个文本站点（含 tag 文本 item-painters.js:381）" | 实际 8 个站点调用 `centeredTextAnchor`：grep src/ 得 cell-text 2 + canvas-kind 3 + item-painters 2 + link-items 1 | 否 |
| 3 | 方案概述 性能段 | 追加"性能基线与缓存计数须在 document.fonts.status === 'loaded' 后取数；demo 页无 @font-face" | 守卫导致 loading 窗口计数失真；证据：src/icons/index.js:95 同款 status 判断、src/icons/index.js:23 注释（canvas fillText 不触发字面加载）、demo/src/common/style.css:346 无 @font-face | 否 |
| 4 | 改动清单 self-check 行 | 新增断言描述 → "fonts loaded 前置 + 专属冷 font 串/字号；跨实例仅新增能力探测 1 次、size 变重测恰 1 次" | 原断言次数口径不可达；证据：cell-text.js:56-58 探测在 ctx 实例位、self-checks 单页同进程运行（self-checks/index.js:44 同步顺序执行） | 是 |
| 5 | 不改动段 | "编辑按钮走 drawIconGlyph svg 路径自动受益或几何居中" → "svg 形态几何居中、cls 形态经共享 drawIconGlyph 自动生效"；补 agent 知识条目沉淀说明 | paint-overlay.js:243-262 经 drawIconGlyph，cls 形态同样消费新锚，原表述暗示仅 svg 路径 | 否 |
| 6 | 复核表 文本站点行 | "7 站点" → "8 站点（补 item-painters.js:381 tag 文本）" | 同 #2 证据 | 否 |
| 7 | 复核表 svg/编辑按钮行 | "svg 路径、几何居中" → 区分 svg 形态几何居中与 cls 形态经字形锚生效 | paint-overlay.js:256 经 drawIconGlyph 分支（cls 走 fillText 字形锚） | 否 |
| 8 | 接口块（缓存守卫后） | 新增 "能力探测保持每 ctx 实例一次；新实例首绘固定 2 次探针字符测量（探测 1 + 锚 1），同 font 第二实例仅 1 次" | 测试计划计数断言依赖该行为；若实现改为模块级能力位，断言 A=2/B=1 不成立 | 否 |
| 9 | 风险与回滚 | 新增 3 条：fonts loading 窗口取舍（每整幅绘制按可见文本站点重测，fonts.ready 后归零）、painter.js:784/1399 注释口径过时但断言不破 | 守卫的代价须显式记录（约束 2）；painter.js 注释与 ±2px 采样区不影响断言值 | 否 |
| 10 | 测试计划 行1 | "两 canvas 计探针字符测量 = 1" → "专属 font 串 `13px sans-serif` + fonts loaded 前置 + 文本 '甲'；A=2（探测+锚）、B=1（仅探测，锚命中），y 相同" | 原断言验证不了：探测本身即一次 `measureText(永)`（每实例），且 `14px sans-serif` 已被前序用例预热（self-checks 单进程）；证据：cell-text.js:56-58、设计探针化改动 | 是 |
| 11 | 测试计划 行2 | "同字号二次绘制计数不变、16→20 重测一次" → 统计 `measureText('●')`：19px 首绘 1 / 二次 0 / 19→21 恰 1 | 16/20 已被 demo 页绘制预热（main-view.vue:801 缺省 16、:803 size 20）；探测字符为 '永'，按 glyph 计数可分离探测与锚测量 | 是 |
| 12 | 测试计划 行4 归属 | "—" → "片2 + 终验" | 切片规则要求每条验收标准归属某片或标终验；表头/✓ 调整落实于步骤 4 | 是 |
| 13 | 测试计划 行5 | 追加 "先确认 fonts loaded 再取 C0；首帧定义为 fonts.ready 后整幅重绘" | loading 窗口内锚测量不缓存，计数会真实增长，易误判验收 5 失败 | 是 |
| 14 | 测试计划 行6 | 追加 "/data/table-ex-basic/、/data/table-ex-scene/ 首屏文本与图标可见、无控制台错误" | 验收 6 称"既有 table-ex demo 页面"；catalog.js:117,127 另登记两页且均用 mu-table-ex | 是 |
| 15 | 实施步骤 步骤2 判据 | 追加专属冷 font 串/前置与 "A=2 / B=1" 判据 | 同 #10 | 是 |
| 16 | 实施步骤 步骤4 判据 | "仅剩 cell-text.js 回退分支内赋值" → "仅剩 cell-painters.js:67（drawCell 默认态）；cell-text 回退是返回 baseline 非赋值" | grep 实测：cell-text.js 无 `textBaseline = 'middle'` 赋值（仅返回对象 baseline）；cell-painters.js:67 存在 | 是 |
| 17 | 实施步骤 步骤5 | 补 `glyphAnchorOffset(glyph, font)` 助手、19→21 计数判据 | 同 #11 | 是 |
| 18 | 实施步骤 步骤6 | 追加全量 lint（src/components/table/ex + demo/src/data/table-ex）与 basic/scene 回归 | 00-task「验证命令」含 lint（口径 src + demo/src），原步骤只对单文件跑 | 是 |

## 未解决异议（累计）

无。
