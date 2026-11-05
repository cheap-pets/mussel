VERDICT: AMENDED

# 审改记录 — 20261105-table-ex-icon-column（轮 2，peer）

对象：02-design.md 修订 5（primary 二轮第 1 轮调整）。输入：00-task.md（「二轮设计调整」4 项用户裁决）、decisions.md（「二轮设计调整裁决」）、06-amend-1.md（一轮 peer 记录）、05-verify-终-2.md（上轮终验）。本轮直接修订设计正文，台账见下。

## 上次回应核对（第 2 次起）

本轮修订仅基于用户二轮裁决 + 补探索，非回应 06-amend-1（其「未解决异议（累计）」为空）。核对 = 抽样确认 amend-1 实质改动未被修订 5 回退，并核对上轮终验失败项的处置。

| 上次改动 / 失败项 | 设计者（修订 5）回应 | 核对结论 |
| --- | --- | --- |
| amend-1 #1 注册表规模 28 tabler + 3 复合 | 保留（权衡 3 仍为「31 个内置名」） | 已落实（`src/icons/tabler-icons.js` 28 个 `default as`；`src/icons/index.js:85-98` 3 复合） |
| amend-1 #2 color 上提 `column.color` | 保留 | 已落实（`column-types/icon.js:44-45` `ensureFn(column.color)`） |
| amend-1 #4 canvas 条目补 `size` | 保留 | 已落实（`column-types/icon.js:84`） |
| amend-1 #6 导出共享 `drawIconGlyph` | 保留 | 已落实（`cell-painters.js:138`，三处消费） |
| amend-1 #8 `requestImage` 多监听 | 保留 | 已落实（`cell-painters.js:90-117` `listeners` 累积 + 一次 flush） |
| amend-1 #10/#11 button 测宽 / 哨兵 / tooltip | 被用户裁决 b 取代（icon+caption 删除），修订 5 重写两形态口径 | 已落实（正文「button 列图标按钮」+ 步骤 14；本轮补显式 overflow 改写点，见台账 7） |
| amend-1 #14 `resolveIconEntry` 单一入口 | 保留 | 已落实（`column-types/icon.js:18-31`） |
| amend-1 #17 三片串行 | 保留 | 已落实（「片间依赖」段） |
| amend-1 #18 self-checks 浏览器运行 + `node --check` | 保留 | 已落实（「验证」节） |
| amend-1 #20 `self-checks/painter.js` editButton 夹具改注册名 | 保留 | 已落实（步骤 23） |
| 05-verify-终-2 失败项 1（ellipsizeButton 裁剪顺序） | 降级路径删除 +「结构性消解」 | **已落实但欠一件**：caption-only 省略为空串时的 `return null` 只写在注释、未写进伪代码；按伪代码字面实现会落空文本条目并绘制无文字 pill（台账 1）。回归断言仅断 fillText，无法发现该退化（台账 2） |
| 05-verify-终-2 UNVERIFIED（tooltip 矩阵） | 矩阵重算 + 重跑 | 已落实（「验证」节末句、步骤 16） |
| 用户裁决 ① pill 高 = `--mu-control-height-small` | 快照 `readPx` + constants 回退 24 | 已落实；值一致性核实：`root.scss:140` = 24px（见「自决点核对」1） |
| 用户裁决 ② icon+caption 互斥、文本优先 | 形态判定前移到源头；icon 忽略零解析零 warn | 已落实（正文形态判定 + 步骤 14/16） |
| 用户裁决 ③ icon-only 宽高一致、图标居中 | pill = 快照值；link 形态 12 | 已落实；link 12 语义确认（自决点 2） |
| 用户裁决 ④ 顺带修复裁剪顺序缺陷 | 「随降级路径删除结构性消解」 | **前提未写全**（台账 1）；d 回归断言已存在但强度不足（台账 2） |

## 检查项结论（每项一行）

1. **覆盖**：4 项用户二轮裁决与修订要求 1–4 均有设计与验证归属（①→步骤 12/13/16、②→步骤 14/15/16、③→步骤 14/16、④→步骤 14/16）；d 回归断言经本轮强化后验证「不绘制」而非仅「无文字」，新增高度变量跟随断言（步骤 16）。
2. **事实一致**：设计引用路径/符号逐条核对——button 链 `TAG_HEIGHT` 触点 `:1344`/`:1390`/`:1447`/`:1452`/`:1467`/`:1596`/`:1615` 全部在正文覆盖范围内；tag 链 `:863`/`:1082-1086` 不动；`--mu-control-height-small` 仅 `src/styles/root.scss:140` 定义、无 `.mu-dark` 覆盖。修正 1 处文件错标（`theme.js:5` → `demo/src/data/table-ex/self-checks/theme.js:5`，3 处）、注释落点 3 处，以及修订 4 落地后漂移的行号：`icons/index.js` install `:12-81`→`:233-304`、`sanitizeHTML :75`→`:296`、复合项 `:85-98`→`:306-320`、`solveIconHash :29`→`:247-250`、覆盖 `:33-38`/`:78`→`:253-259`/`:301`；`requestIconImage :105`→`:122`、`resolveItemKind :664`→`:726`、`centeredTextAnchor :514`→`:576`、`isCellEditable :117`→`:111`、`paintEditorButton :991`→`paintEditButton :994`。
3. **约定一致**：尺寸入快照沿用 `readPx`（`theme.js:40-43`）+ 消费侧回退（同 rowHeight 模式）；回退常量收拢 `constants.js`（C2 镜像常量惯例）；未新增跨链常量复用。
4. **影响面**：`theme.js` / `constants.js` / `self-checks/{theme,cell-painters}.js` / demo 两页 / 文档四处均在清单；`buttonsOverflowOf`、`drawButton`、`drawButtonPill/Link`、`onItemRect` 全覆盖；`row-geometry` 估高不读 pill 高（`GRAPHIC_ITEM_TYPES` 恒 1 行），无需改动。
5. **可实施**：步骤 12–17 有序；`buttonHeightOf` 在 cell-painters 内部、仅依赖 constants 常量（无环）；三片串行、同文件不同行处已标注。
6. **风险与回滚**：本轮拆分「新增 icon 键」与「pill 高 20→24」两项爆炸半径，后者明确为已发布 button 列的视觉变更（发布说明需注明）；快照字段与 button 形态的回滚路径明确。
7. **范围**：无超出用户 4 项裁决的改动；新增断言均直接对应用户裁决（高度变量跟随、d 条款不绘制、互斥短路零 warn）。
8. **切片**：切片结构未改；步骤 12–17 全在片 2，与片 1/3 的相交文件继续串行；每条验收标准仍归属某片或终验。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
| --- | --- | --- | --- | --- |
| 1 | 「button 列图标按钮」右缘裁剪 bullet /「button 列图标绘制」伪代码 / 修订 5 摘要 | caption-only 省略为空串仅在注释写「→ null 终止」，代码行为 `return { text, icon: null, width: … }` → 增加 `if (!text) return null` | 伪代码与注释自相矛盾；按代码行实现会返回空文本条目 → `drawButtonPill` 先 fill/stroke 再 `if (!text) return`（`cell-painters.js:1451-1461`、`:1477`）→ 绘制无文字 pill 并推进 x，违反 d 条款「该条目不绘制」；`ellipsize` 在 maxWidth 放不下单字符时返回空串（`text-wrap.js:182`、`:198`） | 是 |
| 2 | 实施清单步骤 16 / 验证节 button bullet | d 回归仅「0 次 fillText」→ 0 次 fillText + 0 次 pill fill/stroke + 0 条 onItemRect；删除原 glyph 位置断言（`:2386-2390`）；矩阵补「未注册 icon 配 caption 零 warn」 | `drawCell` 只画内容、pill fill 是唯一内容填充（`cell-painters.js:314` 注释）；仅断 fillText 时「空文本 pill 仍绘制」的退化实现同样通过（width 40 夹具下 fillText 恒 0）；原 glyph 断言 `find(...).x` 在无 glyph 时抛 TypeError | 是 |
| 3 | 实施清单步骤 16 / 验证节 button bullet / demo 页 button bullet | `THEME` 仅「24 快照 + 24 回退」两路 → 增自定义 `controlHeightSmall: 32` 断言（宽/高 32、命中矩形 `'3,32'`、图标居中 x = 起点 + 10）与 demo 页面覆写变量跟随 | 24 与回退 24 期望值相同，硬编码 24 的实现同样通过，无法验证用户裁决 ①「高度 = 变量」与权衡 9 的「覆写跟随」收益；centerY 19 − 32/2 = 3、`(32 − 12)/2 = 10` | 是 |
| 4 | 修订 5 补充事实 / 权衡 9 / 未解问题 1 | `theme.js:5` 注释载明 controlHeight 历史 → `demo/src/data/table-ex/self-checks/theme.js:5` | 该注释实际在自检文件 `:4-5`（「controlHeight 已随 C3 死代码清理移除」）；`src/components/table/ex/theme.js:5` 为「职责边界」段 | 否 |
| 5 | 实施清单步骤 12 | 「模块头注释」→ 三处注释（`:2`/`:107`/`:249`） | `grep -n "20 固定字段" src/components/table/ex/theme.js` = 2/107/249，三处均会与新字段矛盾 | 否 |
| 6 | 实施清单步骤 17 | 计数断言 `:241-280` → 补头注释 `:4-5`、块名 `:241` 与内联注释 `:270`/`:275`/`:279` | `self-checks/theme.js:4-5` 明写「20 固定字段…controlHeight 已随 C3 死代码清理移除」，二轮重引入后该句反向失真 | 否 |
| 7 | 实施清单步骤 14 | 「`buttonsOverflowOf` 同步」→ 显式列出：删除 `iconWidth` 扣减与 `remaining < padX*2 + BUTTON_ICON_SIZE` 提前返回、icon 解析移入 caption 空分支、icon-only 计宽 pill = 快照值 / link = 12 | `cell-painters.js:1586-1622` 现于循环顶部无条件 `resolveIconEntry` 并做图标扣减；只改 ellipsizeButton 会留下错的 tooltip 口径（绘制/测宽两链漂移，与 d 类缺陷同型） | 否 |
| 8 | 「button 列图标按钮」命中与点击 bullet | 「命中与点击链**零改动**」→「协议零改动（几何随 pill 高变化）」 | 本轮 `onItemRect` 高度 20 → 快照值（同节下一行已写），原文自相矛盾 | 否 |
| 9 | 风险与回滚 button bullet | 合并表述「非破坏性 API 变更，仅 demo 联动」→ 拆两项：新增 icon 键非破坏；pill 高 20→24 属已发布 button 列视觉变更（仓库外使用方 pill +4px，发布说明注明） | button 为既有 canvas 专属类型（`cell-painters.js:71` `CANVAS_ONLY_TYPES`），高度变化对既有 caption-only 应用可见；原表述低估爆炸半径 | 否 |
| 10 | 权衡 9 | 「无独立 reflow」→「同一探针批次读取、不进绘制热路径」 | `readPx`（`theme.js:40-43`）每次写 height 后 `getComputedStyle` 强制样式/布局刷新；新增 1 次读取是复用既有批次，不是「无 reflow」 | 否 |
| 11 | 验证节 button bullet / demo 页 button bullet | 补「未注册 icon 配 caption 零 warn（console.warn 捕获，`:2214-2232` 同款）」与「页面覆写 `--mu-control-height-small` 时 pill 随变量（刷新/切换后生效）」 | 断言手段已有仓库先例；变量跟随是裁决 ① 的端到端验收面 | 否 |
| 12 | 实测确认点 4 | 「`--row-height` < 30 贴近行线」→ 补「< 25 越行线」「pill 高为绘制期值、不参与行高估算」 | centerY = `round(1 + (h−1)/2 + 0.01)`：h=24 → centerY 13、pill y 1..25，`--row-height` 24 时越界 1px；`row-geometry.js:74` button 估高恒 1 行 | 否 |
| 13 | 未解问题 2 | 补证据与「12×12 即宽高一致」表述 | `drawButtonLink` 无底无边框（`cell-painters.js:1408-1437`） | 否 |
| 14 | 未解问题 1 | 补核实：变量仅 `.mu-root,.mu-light` 定义、无 `.mu-dark` 覆盖；高度仅绘制期消费 | `grep -rn "control-height" src/` 仅 `root.scss:140-142`；`row-geometry.js:74` | 否 |
| 15 | 配套文档 table-ex.md 落点 | 「编辑器不可编辑类型行」→ 补 `:298` | `docs-site/components/table-ex.md:298` 为不可编辑类型清单（需补 `icon`） | 否 |
| 16 | 现状依据 / 修订 2 补充事实 / 修订 5 补充事实 / 权衡 3 | 修订 4 落地前的行号与旧符号名 → 逐项复核为当前行号（`icons/index.js` install `:233-304`、`sanitizeHTML :296`、复合项 `:306-320`、`solveIconHash :247-250` / `:253-259`、覆盖 `:301`；`requestIconImage :122`、`resolveItemKind :726`、`centeredTextAnchor :576`；`painter.js` `paintEditorButton`→`paintEditButton :994`；`isCellEditable :111`）；「修订 2 补充事实」加现状时点注记 | 修订 4 实施改动这些文件后原行号指向错位（`grep -n` 逐项复核 2026-11-05 worktree）；符号改名后旧名已不存在 | 否 |

实质改动 3 项（#1–#3）；非实质 13 项。

## 自决点核对（派发要求 3）

| 设计者自决点 | 我的核实结论 | 依据 |
| --- | --- | --- |
| 1. CSS 变量取值策略 = 主题快照 `readPx` | **确认**（不改判），并补三点核实：变量无暗色覆盖；高度只在绘制期消费；快照相等判定泛型覆盖新字段 | `root.scss:29-151` 块内仅 `:140` 一处定义、无 `.mu-dark` 覆盖（`grep -rn control-height src/` 仅 `:140-142`）；`theme.js:255-274` `snapshotsEqual` 按 `Object.keys` 迭代；`row-geometry.js:74` button 估高恒 1 行、不读 pill 高；备选①JS 常量确实不跟随应用覆写、②项目无 CSS→JS 通道（`vite.config.js:80-82` 仅向 SCSS 注入 `$colors`，方向相反） |
| 2. link 形态 icon-only 宽 = 图标本体 12 | **确认**（不改判） | link 无 pill 几何（`drawButtonLink` 无底无边框，`cell-painters.js:1408-1437`）；图标 12×12 即「宽高一致」；命中框沿用 link 现状（`TAG_HEIGHT` 20 高框，与 caption-only link 同口径）；若取 24 宽会给纯文字链形态加 12px 不可见留白，与原形态语义冲突 |
| 3. caption 非空时 icon 完全忽略（不解析、不绘制、不 warn） | **确认**（不改判） | `resolveIconEntry` 是唯一 warn 源（`column-types/icon.js:23-28`），不调用即无 warn；符合「有文本文本优先」字面语义；代价（配 caption 的未注册 icon 静默）已在配套文档项要求写明 |

## 未解决异议（累计）

（无）
