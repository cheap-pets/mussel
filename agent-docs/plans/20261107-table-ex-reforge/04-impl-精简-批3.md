# 实施记录 — 注释精简 批3（cell-paint 簇）

## 改动文件（仅注释，零代码 token 变更，diff 已核）

| 文件 | wc 前→后 | 处理 |
|---|---|---|
| src/components/table/ex/cell-paint/cell-painters.js | 287→286 | 过时引用更新 1 + 三行注释合二：L16-18 `painter.drawHeaderCheck`（painter 门面已无此成员）→ `paint-header.js drawHeaderCheck`（现状 paint-header.js:67 模块内函数） |
| src/components/table/ex/cell-paint/canvas-kind-painters.js | 305→304 | 删 1 条重复表述：layoutButtonEntries 内 `// ellipsize 空文本 → null 哨兵，停止绘制后续按钮`，与 ellipsizeButton JSDoc（null 哨兵终止后续契约）重复 |
| src/components/table/ex/cell-paint/item-painters.js | 412→412 | 无改动：逐条核验均为契约/交叉引用注释，无可删项 |
| src/components/table/ex/cell-paint/cell-text.js | 267→267 | 无改动：几乎全量为保列契约注释 |

合计 1271→1269（−2 行）；精简注释 2 处，过时引用更新 1 处。

## 保留的契约注释（逐字未动）

- cell-text.js：光学居中锚整块（alphabetic+墨迹半差、CJK 探针 '永'、缓存键+实例级能力位、fonts-loaded 写守卫）、fontsLoadedForCache / inkHalfDiffOffsetOf JSDoc、字形墨迹锚块、alignedLeftX 防口径漂移、linkUnderlineY 防公式漂移、drawTextValue 行为与返回矩形契约、文件头职责行
- cell-painters.js：首行行框槽位、centerY 全文唯一垂直锚公式、maxLines 绘制期求值、text.link 命中矩形链路（itemHits→updateHoverItem→applyItemCursor）、CELL_LINK_ITEM 谓词门控、drawTreeAffordance 估高扣减口径
- item-painters.js：itemsStartX 超宽回退左对齐、命中矩形=绘制区、reportHitRect tag/link 命中区口径、isLinkEntryHovered 横竖排共用防漂移、check DOM 规格、tag pill 色板口径
- canvas-kind-painters.js：layoutButtonEntries 两遍式测宽平移契约、drawButton 对齐两遍式说明、ellipsizeButton pill/link 形态互斥契约、drawButtonLink / drawButtonPill 形态契约、命中矩形高度口径（pill=快照值、link 沿用 TAG_HEIGHT）

四文件均无 @host-* 注解；无注释掉的死代码块（死代码存疑清单：无）。

## 偏离

无。

## 自检

- `git diff --unified=0`（两触碰文件）：仅注释行增删，无代码 token/字符串/结构变更
- 全部注释引用符号/文件核验存在：readSnapshot（shared/theme.js）、row-geometry（ex/geometry/row-geometry.js 用 wrapLines 同源）、drawHeaderCheck、column-types/style.scss .mu-table__cell-check、tag.scss 12px、emitDomItemClick、paintState.itemHits、compile（cell-content.js type.compile）、textAnchorOffset（自检 demo self-checks/cell-painters.js:241 局部函数）
- `/d/npm/global/eslint` 四文件：0 error、6 warning（全部存量：max-len 122>120 于 canvas-kind 原第 139/263 行、complexity 4 处；本次编辑未触及，注释增删不影响 complexity/行内容）

## 遗留（白名单外观察，未动，供后续批次参考）

- src/components/table/ex/shared/text-wrap.js:25 注释 `见 painter.headerFontOf`：headerFontOf 现为 paint-header.js 模块内函数（paint-header.js:39），painter 成员访问形式已过时
- src/components/table/ex/cell-paint/icon-image.js:64 注释 `painter.paintEditButton`：paintEditButton 现为 paint-overlay.js 模块内函数（paint-overlay.js:188）
