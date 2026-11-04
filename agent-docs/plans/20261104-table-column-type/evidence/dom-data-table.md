# DOM 验证证据 — http://localhost:3000/data/table/（2026-11-04，playwright mcp）

## A1 text.link（td class + hover 规则）
- 缺省 primary 行: td class = `mu-table__td text-primary mu-table__cell-link`
- color teal 行: td class = `mu-table__td text-teal mu-table__cell-link`
- multiline link（danger）行: div class = `text-danger mu-table__cell-link pre-line line-clamp` style = `--line-clamp: 2;`
- CSSOM 规则: `.mu-table__cell-link:hover { text-decoration: underline; }`、`.mu-table__list-cell > a { cursor: pointer; text-decoration: none; }`、`.mu-table__list-cell > a:hover { text-decoration: underline; }`
- 常态 computed textDecorationLine = none（td 与 list a 均 none，下划线仅 hover 态）

## A3 multiline/lineClamp 保留
- long 列（multiline + lineClamp:2）: div class 含 `pre-line line-clamp`，style `--line-clamp: 2`

## A4 list 列结构（「list 列 / text.link」section 第 1 表）
- 混合条目行 children:
  - `span`（cls=""）"纯文本项" — 纯文本无色类
  - `a.text-primary` "链接项"
  - `a.text-teal` "附加键链接"（id:42 color:teal）
  - `a.text-primary[disabled]` "禁用项"
  - `a.text-danger` "危险项"
- caption 兼容行: `span` "旧键条目" + `a.text-primary` "旧键链接"
- 标量值行（items:'不是数组'）: cell 文本 = "-"（占位）
- 超限 dots 行（12 条目, max=6）: 显示 条目1~5 + `span` "..."；link 交替（奇 a.text-primary / 偶 span）

## A5 每项单行省略
- computed: display block / white-space nowrap / text-overflow ellipsis / overflow hidden
- offsetTop 序列: 8,26,44,62,80,98（每项独立一行）
- 超长探针（临时 span，验后移除）: scrollWidth 3360 > clientWidth 607 → 截断生效

## A6 cell-item-click payload（demo-log span 实录）
- link 项: `list 列 record.id=1 column.field=items column.caption=list 列（max=6） item={"label":"链接项","link":true}`
- 纯文本项: `... item={"label":"纯文本项"}`
- 附加键项: `... item={"label":"附加键链接","id":42,"link":true,"color":"teal"}`（附加键原样保留）
- dots: `list 列 record.id=4 ... item="..."`
- disabled 条目: pointer-events none / color rgb(176,181,186)；真实鼠标 click 坐标 (1900,919) 后日志不变（拦截生效；dispatchEvent 绕过 hit-test 不算数）

## A7 link 兼容列（第 3 表）
- 渲染为 `.mu-table__list-cell` 竖排: a.text-primary "普通链接" / a.text-danger "危险链接"（danger:true 映射）/ a.text-teal "青色链接"（color 键激活）/ a.text-primary[disabled] "禁用链接"
- 单值 links:12345 → 单条目 a.text-primary "12345"
- 点击: `link 兼容列 record.id=1 column.field=links column.caption=link 兼容列 item={"caption":"危险链接","danger":true,"color":"danger"}` — payload 键 item、column 为原始列引用、danger 映射对象保留其余属性

## A2 数组拒绝（边界回归段末表）
- headers: 名称（text 数组值）/ 数量（无 type 数组值）
- 行内容: "-" / "-"（落占位）；td class 仅 `mu-table__td`（无 list-cell/link 类）

## caption 兼容警告（console）
- `[WARNING] [MUSSEL:Table] list 列条目 "caption" 键已废弃，请使用 "label"` — 出现 1 次（once 去重）
