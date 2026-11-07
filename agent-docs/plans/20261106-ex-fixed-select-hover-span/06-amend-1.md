VERDICT: AMENDED

## 检查项结论（每项一行）

1. 覆盖：验收 1/2 各有片级自检 + 终验；验收 3「合并 cell hover 高亮」原无自动化判据（painter 自检 grep `buildSpans`/`spanMethod`/`selectedCell` 均 0 命中）→ 本轮补断言 F；「无固定列选择框」由断言 B（`selected.col < fixedCount` 的 x0=0 全宽分支）+ 目测覆盖。
2. 事实一致：路径/符号均在位；修正 `spans-method.js:213-224` → 215-232（夹紧函数本体）、描边采样参照 `908-916` → 900-908；修正 demo spans 场景「分类列 14 行区域」→ 7 行（小计行 cat/sub 置空为空值分段边界，spans-auto.js:170-175；main-view.vue:889/917-926）。
3. 约定一致：私有 `paintXxx` + 中文注释引节号、复用 spans/paint-utils 查询、色值取 theme 快照，与现存实现一致（paint-overlay.js:14-15、97-153、233）。
4. 影响面：`paintHoverRow`/`paintHoverCol`/`paintHoverHighlight`/`hoverRegions` 均为模块私有，无导出面变化；`hoverRegions` 唯一调用点 use-pointer.js:123 已补入改动清单；`paintState.spans` 已就位（use-paint-state.js:67）。
5. 可实施：步骤有序、无循环依赖；同一检查项内 `assert` 抛错会短路后续断言（self-checks/index.js:44-63），故 A/B、D/E/F「红/绿同时观察」原不可行 → 已明确分列独立检查项。
6. 风险与回滚：双向门、爆炸半径、退化路径、垂直裁剪行为变化均已列；「均由既有断言覆盖」的过度结论已改为断言 B 覆盖 x0=0 分支。
7. 范围：改动限 paint-overlay.js / use-pointer.js / painter 自检，符合 00-task 约束；y 向 clip（选中格滚入表头）超出验收 1 字面范围但属同源缺口、已在风险节披露并给出回退法，保留不提异议。
8. 切片：片 1/片 2 串行（共用 paint-overlay.js 与自检文件，不并发），各有可观察判据；验收 1→片 1、2→片 2、3→终验，依赖无环。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | 02-design.md:16 遵循约定 | `spans-method.js:213-224 夹紧` → `spans-method.js:215-232 resolveDeclaredColspan 夹紧` | 夹紧函数本体在 spans-method.js:215-232（夹紧条件 220、返回值 228），原行号只覆盖注释前段 | 否 |
| 2 | 02-design.md:28 改动清单（use-pointer） | 补「唯一调用点 `updateHover`（use-pointer.js:123）同步传 `ctx.spans.value`」 | grep 全仓：`hoverRegions` 仅 use-pointer.js:91 定义、123 调用（demo/dist 为构建产物）；不传则新参数恒 undefined | 否 |
| 3 | 02-design.md:29 改动清单（自检） | 追加 F（cell 模式区域整体高亮回归）+ `buildSpans` import + spans 夹具（行 0 status rowspan=3、行 3 amount colspan=2）+ A/B 与 D/E/F 各自独立检查项 | 验收 3 明确含「合并 cell hover 高亮」，原测试计划无任何 spans 绘制断言（painter 自检无 `buildSpans`/`selectedCell`）；cell 模式现状见 paint-overlay.js:87-91 | 是 |
| 4 | 02-design.md:71 测试计划 1/片 1 | 断言 A 补夹具几何（colLefts=200、宽 100）、`colorBoundsOf(0,58,36,252)` 具体调用、`scrollLeft=180` 时 [60,120) 正向断言（防过度裁剪）；断言 B 补 `selectedCell={row:0,col:0}` 与 colorBoundsOf 非 null；参照行号 908-916 → 900-908 | 夹具列几何 painter.js:88-91（colWidths [60,140,100,120,50,160]、colLefts [0,60,200,300,420,470]）；colorBoundsOf 签名 painter.js:311；描边 assertPixel(tolerance 2) 采样见 painter.js:897-908 | 否 |
| 5 | 02-design.md:72 测试计划 1/终验 | 「滚动至该格进固定区 + 固定列区无主色」→「滚动余量约 80、col 2 左缘 230→150 仅部分进入 + 只取选中格顶/底描边 1px 条带（x∈[0,230)），禁整块固定区断言」 | fixed 场景列宽 70+160+320+200+100+190=1040（main-view.vue:860-873）、舞台 960（main-view.vue:1190，.ct-stage 边框 1px）→ 可视滚动余量约 80px，无法整格进入；固定列 col 1 为 link 列（main-view.vue:862），默认主色文本（item-painters.js:53-61）→ 整块「无主色」断言必假阳性 | 否 |
| 6 | 02-design.md:73 测试计划 2/片 2 | 断言 D/E 补采样坐标、底色口径（区域底色 = 锚行背景，D 采样区外）、check 列 covered 说明；新增断言 F 及其采样点 | `paintSpanRegions` 以 `rowBackground(state, region.row)` 填区域底色（paint-body.js:190-193）；covered 格内容跳过（paint-body.js:159-165）；采样换算依 painter.js:88-91 列几何 | 否 |
| 7 | 02-design.md:74 测试计划 2/终验 | 「autoRowSpan 14 行区域」→「7 行区域（小计行 cat/sub 置空分段）」；`colspan 'rest'` 补「→ cols 5-7」；补 hoverMode=cell 回归 | 空值键作分段边界 spans-auto.js:170-175；每子类 7 条目后接 cat/sub=null 小计行（main-view.vue:889、904-926）→ 分类列区域 7 行；summary 索引 5 + 'rest' 展开到 colCount 8 → cols 5-7（main-view.vue:943-951） | 否 |
| 8 | 02-design.md:63 风险 | 「均由既有断言（519/526/530/531）覆盖回归」→ hover 带退化路径由既有断言覆盖；`fixedCount=0` 的 x0=0 全宽 clip 由断言 B + 验收 3 目测覆盖 | 519/526/530/531 均为 hover 带断言（painter.js:512-535），无选中描边断言；断言 B 走 `selected.col < fixedCount` 分支，clip=[0, headHeight, stickyWidth, …] 与 fixedCount=0 同式（paint-overlay.js 拟改点） | 否 |
| 9 | 02-design.md:78-79 像素验证分级 | 「断言 A/B/D/E」→「A/B/D/E/F」；「固定列区无 primaryColor」→「固定列区选中描边条带无 primaryColor」 | 与 #3/#5 联动，保持测试计划与分级口径一致 | 否 |
| 10 | 02-design.md:88 步骤 1 | 完成判据补「A、B 各自独立检查项（同一检查项内 A 抛错会短路 B）」 | runChecks 逐检查项 try/catch，首个 assert 抛错即终止该检查项（self-checks/index.js:44-63） | 否 |
| 11 | 02-design.md:91-92 步骤 3/4 | 步骤 3 补 D/E/F（含 `buildSpans` import + 夹具）与「F 绿」；步骤 4 判据 D/E → D/E/F | 与 #3 联动，保证改动清单、测试计划、步骤三者一致 | 否 |

## 未解决异议（累计）

无。
