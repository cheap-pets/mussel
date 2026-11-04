# evidence：/data/table-ex/ DOM + canvas 断言（verify-2，2026-11-04）

页面：默认场景 + 「条目/新列型」场景。构建标记：默认场景参照表含「list 列」「text.link」「text 数组值（占位）」列（R1 后 createDefaultColumns 产物，04-impl.md 偏离 1）。

## 默认场景 DOM 参照表

- 「list 列」4 行条目全 SPAN 无色类；「遗留 link 键条目」渲染 SPAN（负向断言 ✓）
- 「text.link」列 td class：`mu-table__td text-primary mu-table__cell-link`
- 「text 数组值（占位）」列：td 空内容（占位），无数组拆行结构

## canvas 点击复测（A6/A7 canvas 面，上轮失败项 2/3）

方法：坐标取 `window.__canvasTable.getCellRect(row, col)` 视口矩形内条目带（`left+20, top+18`，遵循 04-impl-修复-1.md 遗留 2 的条目 rect 口径，非列中心）。事件日志读 demo 事件面板 `.ct-event-log__item`。

布局（条目/新列型场景）：col1=links（type link）、col2=list 全 text、col3=list 全 link、col4=text.link；r0 h=70（3 条目变高）、r1 h=88、r2 h=36。

| 序列 | links(col1) | list 全 text(col2) | list 全 link(col3) |
|---|---|---|---|
| 1 直接点击 | ✓ cell-item-click | ✓ | ✓ |
| 2 先滚动出视口再滚回 | ✓ | ✓ | ✓ |
| 3 先 hover 他格再点击 | ✓ | ✓ | ✓ |
| 4 场景切默认再切回 | ✓ | ✓ | ✓ |

12/12 触发 `cell-item-click`，payload 样本：
- links：`{"record":"#1","column":"links","item":{"caption":"Mussel 文档"},"recordIndex":0}`
- list 全 text：`{"record":"#1","column":"list","item":{"label":"纯文本项"},"recordIndex":0}`
- list 全 link：`{"record":"#1","column":"listLink","item":{"label":"整列成链"},"recordIndex":0}`

payload 键名 `item`、含 `recordIndex`、column 为原始列 field。

## 光标断言（applyItemCursor 门控，R1-4 修复项）

逐列 hover 后 canvas computed cursor：

| 列 | cursor |
|---|---|
| links（link 列） | pointer |
| list 全 text | default |
| list 全 link | pointer |
| text.link | default |

## canvas 像素采样佐证（A1/A4 链色，r0 条目带 getImageData 非背景像素聚类）

- list 全 text 列 3 条目带：正文深灰（64,64,80 / 112,112,112），无主色像素 → 非 link 列条目正文色
- list 全 link 列：条目 1/2 带主色蓝（32,128,208）、条目 3 带 teal 绿（48,176,128）→ 列级 link 链色 + 条目 color 覆盖

## self-checks 面板

「重跑自检」后：**201/201，0 FAIL**。用例名确认含「ListColumn compile 产物（R1 列级 link）」「linkHoverColorOf：danger hover / 默认 primary hover / hover 缺失回退 color / disabled muted」。

## console

- caption 兼容警告：每次页面加载 1 次 `[MUSSEL:Table] list 列条目 "caption" 键已废弃，请使用 "label"`（utils/warn once 去重生效；console 日志文件 .playwright-mcp/console-2026-11-04T15-48-45-423Z.log）
- error 仅 `data:image/png;base64,AAAA1/AAAA4` 无效 URL 6 条 = img 容错用例基线夹具（04-impl-修复-1.md 自检节已注明），非本次实施引入
