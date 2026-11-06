# 实施记录

设计输入：02-design.md（定稿）；基线约束（decisions.md）已遵守：未回退任何未提交改动，未执行 checkout/stash/commit。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| `src/components/table/column-types/text.js` | 片1 步骤1 | compile dom=false 产物增加 `link: isLink || null`；`text.js:41-43` 注释同步为「canvas 通道同口径（hover 下划线/pointer，点击仍走 cell-click）」 |
| `src/components/table/ex/cell-paint/cell-text.js` | 片1 步骤2 | `drawTextValue` 增加 `underline` 选项（单行/多行逐行 1px 下划线，`alignedLeftX` 按 align 反推左缘）与实绘文本块矩形返回值 `{ x, y, width, height } \| undefined` |
| `src/components/table/ex/cell-paint/cell-painters.js` | 片1 步骤3 | `drawDisplayText` 追加 `hoverItem, onItemRect` 参数，实现 link 分支（`isLinkEntryHovered` 谓词 + `CELL_LINK_ITEM` 常量、条目口径取色、`underline: hovered`、恒回报 `kind:'link'` 命中矩形）；`drawCell` 调用点透传两参；imports 增加 `isLinkEntryHovered/linkHoverColorOf/linkTextColorOf` |
| `src/components/table/column-types/button.js` | 片2 步骤1 | 模块级 `valueToButtons`（tag `valueToTags` 同构，键名 caption）；`ensureFn(column.buttons \|\| valueToButtons)`；`getButtons(record, value)` 透传；空组门控上提至双通道分支之前；文件头与分支注释同步 |
| `src/components/table/ex/table-paint/paint-gridlines.js` | 片3 步骤1 | `paintGridlines` 计算 `contentRightX` → `rowLineW = Math.min(W, contentRightX)` 传入 `paintRowGridlines`（整线与分段路径共用 W 入参）；`paintColGridlines` 计算 `contentBottomY`（`rowCount > 0` 门控，空表维持现状）替换整线高度与分段 `yTo` |
| `src/components/table/ex/table-paint/paint-header.js` | 片3 步骤2 | `paintHeader` 底边框 `fillRect` 宽度改 `Math.min(W, contentRightX)`（与 paintGridlines 同式）；表头背景 `fillRect(0, 0, W, headHeight)` 仍整宽 |
| `demo/src/data/table-ex-basic/main-view.vue` | 片1 步骤4 / 片2 步骤2 / 片3 步骤3 | 列类型段：链接文本列 ×2、`按钮(field)`、`按钮(field 对象)` 列、既有按钮列改 `(record, value) => value`、typeRecords 增 site/actions/actionObjs 与第 3 行（actions null）、`@cell-click`/`@cell-item-click` 日志行；新增「格线截断（行少 / 列少）」section（sparseColumns 90/110/90 定宽 × sparseRecords 3 行 × height 320px，wide） |
| `demo/src/data/table-ex/main-view.vue` | 片1 步骤1（改动清单第 1 行附带的注释同步） | `:784` text.link 注释同步为双通道同口径现状（仅注释，无逻辑改动） |

测试文件：无测试框架，未新增（按设计）。

## 偏离

无设计偏离。两点环境说明（不构成偏离）：

1. 派发验证 URL `http://localhost:3000/table-ex-basic/` 实际 404，站点实际路径为 `http://localhost:3000/data/table-ex-basic/`（demo 构建产物位于 `demo/dist/data/`）。验证均按实际路径执行，不影响实施。
2. 设计接口 2 中「既有两个调用方（`cell-painters.js:159` line-clamp 路径、`:215` drawDisplayText）」中 `:215` 的行号为设计时点，本文件因片1 改动后 drawDisplayText 调用点为唯一位点，行为判据与设计一致。

## 自检

项目无 lint/typecheck 脚本（纯 JS），语法检查用 `node --check`，行为验证走 demo + playwright（rollup watch 常开，直访未重复打包）。

- `node --check` 全部改动 `.js` 文件：通过。
- 片1（demo `/data/table-ex-basic/`，列类型表，像素探针 dpr=2）：
  - 需1-1 通过：hover「链接文本」row1 → 文本块下缘条带色相像素 +292（下划线 + hover 谱系色），`.mu-table-ex__sticky` `cursor === 'pointer'`；移出后 delta 3、cursor 复位 default。
  - 需1-2 通过：点击链接文本格 → 日志行 `cell-click：recordIndex=0，field=site，name=全部类型`，无 cell-item-click。
  - 需1-3 通过：hover「文本」（colored 0、cursor default）与「映射」（cursor default）列无变化。
  - 需1-4 通过：`/data/table/` DOM 通道 3 个 `.mu-table__cell-link`（td 内）渲染正常，`.mu-table__cell-link:hover { text-decoration: underline }` 规则原样。
- 片2（列类型表截图 + 目视判定）：
  - 需2-1/2/3/4/6 通过：`['编辑','删除','复制']` → 3 pill；`'查看'` → 单 pill；`actionObjs` → 保存（green）/ clock 图标 / 锁定（disabled 灰）；既有按钮列行1 编辑+删除(red)、行2 详情(indigo) 渲染不变；`actions: null` 行3 → 占位 `--`。
  - 需2-5 通过：既有按钮列 `(record, value) => value` 以 value 渲染出按钮，第二参生效。
- 片3（像素探针 + 截图目视）：
  - 需3-a 通过：末列右缘线 x=289 的 y 范围 0..144（= 表头 36 + 3×36 末行底部），y=160/y=300 处取样 alpha=0（已截断）。
  - 需3-b 通过：行线 y=144 在 x=340 处为透明、x=100 处为线色；表头底边框 y=35（headHeight=36）在 x=30 处线色 [97,103,109]、x=340 处为表头背景 [45,49,53]（已截断）；表头背景 y=18 全宽同色 [45,49,53]；末列右缘线本身存在。
  - 需3-c 通过：基础用法表行线 y=72 在 x=990（容器右缘）为线色；列线 x=55 在 y=494（容器底缘）为线色。
- `/data/table-ex/` 自检页：自检结果 218/223 通过；控制台 1 个 error 为既有负向夹具（`self-checks/cell-painters.js:779` `badSrc` 的无效 data URL，设计预期内）。
- `npm run build`：exit=0，4 段构建（base dev/prod + ex dev/prod）全部通过。

## 遗留

1. `/data/table-ex/` 自检页 5 项失败为**工作区基线遗留**，与本次改动无关：失败的 5 项全部为 link（list 兼容壳）/LinkColumn/ListColumn/link 竖排/link 悬停检查，断言明细为条目数不符（期望 3 实际 1 等）——自检夹具（`self-checks/cell-painters.js:1225,1266` 等）仍喂 `caption` 键条目，而基线未提交迁移已把 link/list 条目键改为 `label`（`column-types/link.js:14`）。本次改动文件与这 5 项检查的代码路径无交集（夹具同步不在设计的改动清单内，未越界修改）。
2. 需求 2 预期变化（设计「风险与回滚」已明示）：`/data/table-ex/` 列宽 section 仅配 field 的按钮列（`demo/src/data/table-ex/main-view.vue:852`）开始渲染 `buttons` 字段，属需求 2 的预期行为。
3. 文档三处同步（skills references / docs quick-reference / docs-site）按 00-task 约束不在本轮，待实现经用户确认后再更新。
4. 临时产物：`.playwright-mcp/` 验证截图与探针日志（未加入 git；项目根 `.gitignore` 是否覆盖该目录以仓库现状为准，未改动）。
