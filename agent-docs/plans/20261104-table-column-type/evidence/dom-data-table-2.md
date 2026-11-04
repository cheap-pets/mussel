# evidence：/data/table/ DOM 断言（verify-2，2026-11-04）

页面构建标记：`list 全 text` / `list 全 link` 文案存在（R1 后最新构建，规避 04-impl-修复-1.md 偏离 2 模块缓存问题）；`.mu-table__list-cell` 16 处。

## A4 列级 link（list 全 text 列，max=6）

| 行 | 条目结构 |
|---|---|
| 混合条目 | SPAN「纯文本项」+ SPAN「遗留 link 键项」（负向断言：遗留 `{label, link:true}` 条目渲染为 SPAN，条目 link 键不参与渲染）+ SPAN「附加键项」，均无色类 |
| caption 兼容 | SPAN「旧键条目」+ SPAN「旧键链接」正常渲染 |
| 标量值 | td 文本 `-`（占位，仅接受数组值） |
| 超限 dots | 5×SPAN + SPAN「...」（dots） |

## A4 列级 link（list 全 link 列，column.link，max=6）

| 条目 | 结构 |
|---|---|
| 文本项也整列成链 | A.text-primary（缺省 primary） |
| 附加键链接 | A.text-primary |
| teal 变体 | A.text-teal |
| 禁用项 | A.text-primary + `disabled=""` |
| 危险项 | A.text-danger |
| dots | A.text-primary「...」 |

## A1 text.link

- 缺省行 td class：`mu-table__td text-primary mu-table__cell-link`
- teal 行：`text-teal mu-table__cell-link`
- hover（playwright 真实 hover）：`text-decoration-line: underline`、`text-decoration-style: solid`、`cursor: pointer`；CSSOM 存在 `.mu-table__cell-link:hover` 规则

## A3 multiline + lineClamp

- div class：`text-danger mu-table__cell-link pre-line line-clamp`
- computed：`-webkit-line-clamp: 2`、`overflow: hidden`
- text.js:11-27 lineClamp 分支与原实现同构（无 link 时产物不变，代码审查）

## A5 单行省略

- 条目 computed：`display: block`、`white-space: nowrap`、`text-overflow: ellipsis`、`overflow: hidden`
- 探针（临时注入后移除）：scrollWidth 672 > clientWidth 607（截断发生）
- offsetTop 8 → 26 → 44：每项一行（竖排）

## A6 cell-item-click payload（真实鼠标点击）

| 点击目标 | 日志 |
|---|---|
| 全 text 列「遗留 link 键项」 | `record.id=1 column.field=items column.caption=list 全 text 列（max=6） item={"label":"遗留 link 键项","link":true}`（条目原引用，遗留键传出） |
| 全 link 列「附加键链接」 | `record.id=1 column.field=links item={"label":"附加键链接","id":42}`（id 附加键保留） |
| 全 text 列 dots | `record.id=4 item="..."` |
| link 兼容列「危险链接」 | `record.id=1 column.field=links column.caption=link 兼容列 item={"caption":"危险链接","danger":true,"color":"danger"}`（danger 映射对象） |
| disabled 条目（禁用项/禁用链接） | 无日志（pointer-events 拦截） |

## A2 数组拒绝（边界与回归段）

- 「名称（text 数组值）」「数量（无 type 数组值）」两列 → td 文本 `-`，无 `mu-table__list-cell` / `mu-table__cell-link` 类

## A7 link 兼容列渲染

- 混合形态：A.text-primary / A.text-danger（danger:true 映射）/ A.text-teal（color 键激活）/ disabled 置灰
- 单值 `12345`：包装为 A.text-primary 渲染
