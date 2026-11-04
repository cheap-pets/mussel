# DOM/行为验证证据 — http://localhost:3000/data/table-ex/（2026-11-04，playwright mcp）

## A1/A4 DOM 参照表（默认场景 columns，偏离 1 落位）
- list 列 cells（8 个）：span 纯文本「条目 N」+ a.text-primary「链接条目」+ a.text-danger「危险条目」
- text.link 列：td class = `mu-table__td text-primary mu-table__cell-link`（「链接 1~5」）
- 「text 数组值（占位）」列：单元格文本空（落占位，无 list-cell/link 类）
- 既有 link 列（对象数组 + color）：渲染为 .mu-table__list-cell，色 text-red / text-danger / text-teal / text-lime

## A9 代码审查
- src/components/table/ex/cell-painters.js:219-226 isArrayValueRejected：type null/''/字符串且非 link/list/tag/button → {}（置于 _plainText 短路前 :239）
- cell-painters.js 全文无 drawArrayLines；drawTextValue 无数组分支（:552 注释 A9）；resolveTooltipText 无数组分支（:1455）
- src/components/table/ex/row-geometry.js:116 `if (Array.isArray(value)) return 1`；:340-341 indicatesVariableMode 仅 isLinkColumn(col) && count > 1
- src/components/table/ex/editor.js:38 NON_EDITABLE_TYPES 含 'list'

## A4 canvas 绘制（像素行带分布，非截图）
- 「条目/新列型」场景，canvas 956x416 dpr=1，1:1 映射
- list 列（col 2，内容 x[290,460)）首行文字带 y：[50-60]/[68-78]/[86-96]（3 条目竖排，与 links 列同分布）
- 首行变高 70px（getCellRect(0,2).height=70，rowGeometry variable 模式）

## A6 canvas 条目点击（FAIL 证据）
- list 列条目点击：y 内容 30~140 步进 4px 扫描（26 点）+ 精确坐标 (340,49)/(340,55) + hover 预热 + refreshTheme 后 + 重跑自检后 + 真实/合成 MouseEvent —— 均仅触发 cell-click（column="list"），无 cell-item-click
- list 列条目 hover：canvas style.cursor = default
- links 列（col 1，同 drawLinkItems 产物）对照：
  - 上次会话（同一 demo 进程，跑过「重跑自检」后）：click → `cell-item-click {"record":"#1","column":"links","item":{"caption":"Mussel 文档"},"recordIndex":0}`（payload 键 item、含 recordIndex ✓）；hover cursor = pointer ✓
  - 本次会话（刷新后）：links 列条目点击同样无 cell-item-click（真实/合成/hover 预热/refreshTheme/重跑自检后均失败）——link 列命中能力存在操作序列/时序依赖
- canvas payload 结构（上次会话成功样本）：键 item、含 recordIndex、column 为原始列引用 —— emitDomItemClick/emitCellItemClick 源码链路（table-ex.vue:1173-1230）正确

## self-checks 面板（重跑自检后）
- 自检结果：199/201 通过（非 0 FAIL，设计终验要求 0 FAIL）
- FAIL 1 [cell-painters] link 列竖排：`list link 条目缺省 primary 期望 #0066ff，实际 #8c3cc8`
  - 断言 demo/src/data/table-ex/self-checks/cell-painters.js:1523 cssColorOf(THEME.primaryColor)
  - 实现走 ListColumn color 缺省 'primary' → linkTextColorOf 查 theme.colors['primary'].color
  - stub THEME_COLORS.primary.color = rgba(140,60,200,1)（:71-72 17 色公式），THEME.primaryColor = rgba(0,102,255,1)（:92）
  - 真实主题两者同源（theme.js readColors 语义色读 --mu-primary-color，与 readSnapshot primaryColor 同变量）→ 真实渲染无差异，属 stub 夹具口径缺陷
- FAIL 2 [cell-painters] linkHoverColorOf：`默认 → colors.primary.hover 期望 rgba(140, 130, 245, 0.85)，实际 rgba(0, 102, 255, 1)`
  - 断言 :1748（HEAD 既有断言 :1630 同文）
  - HEAD 实现：`palette = item.danger ? colors.danger : colors.primary; return palette?.hover ?? palette?.color ?? theme?.primaryColor`（无 danger 条目 hover 查 colors.primary 谱系）
  - 本次实现：linkPaletteOf 无 color/danger → null → `item.link === false ? textColor : primaryColor`（cell-painters.js:700-708）—— 丢失 colors.primary.hover 悬停谱系，老式自定义 kind:'link' 条目 hover 色变化，违反设计「行为不变」承诺 → 实现回归
- 其余模块（row-geometry / spans / editor / 数据生成器）用例全部通过

## console
- caption 兼容警告出现 1 次（once 去重）：`[MUSSEL:Table] list 列条目 "caption" 键已废弃，请使用 "label"`
- 1 个 ERROR：data:image/png;base64,AAAA 加载失败 — 来自 self-checks/cell-painters.js:749 img 容错用例（故意非法 url），既有基线行为，与本次改动无关
