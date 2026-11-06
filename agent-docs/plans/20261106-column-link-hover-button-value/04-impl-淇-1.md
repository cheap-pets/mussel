# 实施记录（修复轮 1）

输入：05-verify-2.md（FAIL 5 项 + 修法）、00-task.md「追加轮」修复边界、04-impl.md（偏离 1 背景）；decisions.md 追加轮决定已遵守（仅夹具侧收紧、不改组件行为、不回退基线、不提交）。

## 改动文件

| 文件 | 对应失败项 | 说明 |
|---|---|---|
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 失败 1~5（05-verify-2） | link/list 夹具条目键 caption→label，断言/检查标题/返回文案同步当前契约（label 标准键、caption 兼容已删除）；失败 3 过期断言反转为「caption 遗留键不再读取、空 label 过滤」 |

逐项明细（均按 05-verify-2「修复建议」执行）：

- 失败 1：`:1225` canvas 喂入、`:1266` dom 喂入 caption→label；`:1233` "title = caption"→"title = label"、`:1247` `item.caption`→`item.label`、`:1257` "caption join"→"label join"（喂入为字符串未改）。tag 半段（:1279/:1293/:1316，caption 键）契约未变，未动。
- 失败 2：检查标题 `:1324` "caption/color 激活"→"label/color 激活"；`:1329`/`:1355`/`:1367`/`:1372` 喂入 caption→label（`:1372` 保留 `{ color: 'red' }` 被过滤元素，仅第二元素改 `{ label: 'ok' }`，期望 1 不变）；`:1332` "对象元素 label 文本"、`:1335` "{ label: el } 行为不变"、`:1374` "缺 label 对象被过滤"。字符串喂入段（:1338-1352）未动。
- 失败 3：过期子块（原 `:1463-1467`，断言已删除的 caption 兼容契约）反转为：喂 `[{ caption: '旧键' }, { label: '' }, 'ok']` 断言 `items.length === 1`、`items[0].text === 'ok'`（消息「caption 遗留键不再读取（兼容已删除）、空 label 条目过滤」）；检查标题 `:1381` 与返回文案 `:1469` "caption 兼容"→"caption 遗留键不再读取、空 label 过滤"。同检查其余段（label 键，上轮已通过）未动。
- 失败 4：`:1548` 喂入 caption→label；其后掩蔽断言（:1552-1564 y 锚/取色/dots/矩形回报）无 caption 字样且键迁移后语义原样成立，未改。
- 失败 5：`:1622` 喂入 caption→label（与失败 4 夹具行同形，一并替换）；`:1628-1639` success hover/下划线/disabled 断言未改。

## 偏离

无。5 项修法与 05-verify-2 逐条一致；范围外 caption（tag 检查 :1478-1538、button 检查 :970-1033/:1690-1858/:2126-2546、editor 检查、列级标题键 `columnDef.caption` :1356）全部未动；`src/` 零改动；未回退基线（其余 13 个 M 文件 diff 与 05-verify-2 记录一致）。

## 自检

- `node --check demo/src/data/table-ex/self-checks/cell-painters.js`：通过。
- `grep -n caption` 复核：link/list 5 个检查内仅余失败 3 新断言文案中的「caption 遗留键不再读取」字样；其余命中全在 tag/button/editor/列级标题（范围外，契约未变）。
- playwright 直访 `http://localhost:3000/data/table-ex/`（rollup watch 自动重建后）：
  - 面板「自检结果（223/223 通过）」，✗ 列表为空；5 项原失败检查（link（list 兼容壳）/tag、LinkColumn compile、ListColumn compile、link 列竖排、link 悬停）全部 ✓。
  - console：1 error（基线 `net::ERR_INVALID_URL @ data:image/png;base64,AAAA1`，badSrc 负向夹具）+ 35 warnings，与 05-verify-2 基线一致，无新增。
- `git status --short`：14 M + 1 ??（基线 13 M + 本轮夹具 1 M），改动面未越界。

## 遗留

1. `src/components/table/column-types/link.js:8` / `list.js:16` 注释滞后（仍描述已删除的 caption 兼容）为基线遗留，05-verify-2 已记录「不在本轮修复边界」，未改。
2. tag/button/editor 的 caption 键夹具契约未变，不在迁移范围（同 00-task 口径）。
3. 文档三处同步（skills references / docs quick-reference / docs-site）按 00-task 约束待用户确认后再更新。
