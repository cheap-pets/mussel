# 05-verify-2（追加轮检查：自检页失败定位，N=2）

VERDICT: FAIL

追加轮验收 = `/data/table-ex/` 自检页 223/223（00-task「追加轮」）；当前 218/223，5 项失败全部复现，均为夹具侧 caption→label 迁移滞后（组件侧无回归，证据见下）。本轮为只读检查，未改任何源码与夹具。

## 上轮问题核对（第 2 轮起）

上轮 05-verify-1 判 PASS，无失败项；其「环境阻塞」3 条逐项核对：

1. **派发 URL 404**（`/table-ex-basic/` 实际 `/data/table-ex-basic/`）：未解决（环境固有）；本轮涉及页面 `/data/table-ex/` 直访 200，不影响追加轮验收。
2. **自检页 5 项失败（218/223）**：**未解决** —— 本轮亲自重跑仍 218/223，5 项失败名称与断言消息与上轮记录逐字一致，已逐项定位根因（见「自检页失败定位」）。该 5 项即追加轮修复目标，计入本轮失败项。
3. **console 1 error**（`net::ERR_INVALID_URL @ data:image/png;base64,AAAA1`）：未解决（既有负向夹具 badSrc，基线预期内）；本轮 console 仍仅此 1 error，无新增。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `curl -s -o /dev/null -w %{http_code} http://localhost:3000/data/table-ex/` | 0 / HTTP 200 | demo 服务常开可达（非本验证启动，无 PID 管理义务） |
| playwright 打开自检页 + DOM 提取 ✗/✓ 列表 | 成功 | 「自检结果（218/223 通过）」；✗ 5 项全部 `[cell-painters]`，断言消息原文见失败定位节；记录 `evidence/self-check-failures-218-223.json`、面板截图 `evidence/self-check-failures-panel.png` |
| console 检查 | — | 仅 1 error（基线 badSrc），35 warnings，无新增 |
| `git status --short` | exit=0 | 13 个 M + 1 个 ??（与 05-verify-1 记录完全一致，无新脏文件） |
| `git diff --stat` | exit=0 | 13 files changed, 257 insertions(+), 63 deletions(-)（与上轮逐字一致 → 工作区自上轮验证后零变化；本轮只读，未产生任何改动） |
| `npm run build` | 未重跑 | 00-task：涉及源码改动时验证者可跑；本轮只读无源码改动，工作区 diff 与上轮（build exit=0）完全一致，无重跑必要 |

## 自检页失败定位（追加轮逐项）

组件侧契约（基线未提交迁移，已核实源码）：

- `src/components/table/column-types/list.js:23-25`：`normalizeEntries` 仅读 `entry.label`，`label == null || label === ''` 过滤（caption 兼容读取 `labelOf` 已删除，diff 核实：`-  const label = labelOf(entry)` → `+  const label = entry.label`，`warn` import 一并删除）。
- `src/components/table/column-types/link.js:14-15`：`valueToLinks` 对象元素原样保留、primitive 包 `{ label: el }`（diff 核实：原 `{ caption: el }` → `{ label: el }`）。
- canvas 链路：`column-types/index.js:29-30`（`link: LinkColumn, list: ListColumn`）→ `cell-content.js:57`（`type.compile(column)`）→ 同一 `normalizeEntries`；`cell-painters.js:174-189` link/list 分支与 `link-items.js` 仅消费 `content.items`，不自取条目键。

**组件侧无回归的运行时证据**（同一页面同一轮自检）：

- ListColumn 检查（失败项 3）中，:1466 断言之前的全部 label 键断言（:1394-1461：domText/domLink/canvasLink/canvasText/payload 原引用/A6 全条目点击）**已通过**（失败发生在 :1466，说明其前无抛错）。
- `resolveCellTooltip：link 列竖排`（:2105-2123）喂字符串数组（`valueToLinks` 包 `{ label }`）全部通过。
- 失败项 5 的实际值 `rgba(0, 130, 245, 0.85)` = 夹具 `PRIMARY_HOVER`（cell-painters.js:74），正是无 color 条目（'D'，缺省 primary）悬停的**正确** hover 色——hover 链路本身工作正常，只是喂入的 success 色条目被过滤后索引移位。
- tag/button 仍用 caption 键、其检查全部通过（✗ 列表无 tag/button）——契约未变者不受影响，排除全局性破坏。
- DOM 参照表（同页）label 键 list 条目渲染正常（快照：「条目 1 / 遗留 link 键条目 / 附加键条目」）。

### 失败 1：link（list 兼容壳）/tag 双通道条目结构

- **检查名原文**：`[cell-painters] link（list 兼容壳）/tag 双通道条目结构：canvas 平铺 kind 条目 + onItemClick、dom 保持 DOM 形态`
- **断言消息原文**：`link 3 条目 期望 3，实际 1`
- **夹具位置**：`demo/src/data/table-ex/self-checks/cell-painters.js:1225`（喂入 `value: [{ caption: 'A', danger: true }, { caption: 'B', disabled: true }, 'C']`，**caption 键** + 裸字符串）→ 断言 `:1229`。caption 对象因无 label 被过滤，仅 `'C'` 包装保留 → 1。
- **根因归类**：**夹具侧**（未随基线 caption→label 迁移同步）。组件侧证据：`list.js:23-25` label-only 过滤、`link.js:14` `{ label: el }` 包装。
- **修复建议**（**在边界内**）：`:1225` 与 dom 通道 `:1266` 喂入改 `{ label: 'A', danger: true }` / `{ label: 'B', disabled: true }`；其后被首抛掩蔽的断言随键迁移同语义保留：`:1232` 条目文本、`:1233` 消息文案（"title = caption"→"title = label"）、`:1234-1236`（danger/disabled/缺省 primary，索引不变）、`:1244-1249` payload 断言 `item.caption`→`item.label`、`:1257` 文案（"caption join"→"label join"，喂入为字符串无需改）；tag 半段（:1277-1318，caption 键）契约未变**不动**。检查标题 ：1214 无 caption 字样，不用改。
- **边界核对**：仅夹具键名迁移 + 断言文案，不改组件行为 → **不触及边界**。

### 失败 2：LinkColumn compile 产物（dom 通道）

- **检查名原文**：`[cell-painters] LinkColumn compile 产物（dom 通道，兼容壳委托 list）：caption/color 激活、dots payload item、danger→color、disabled、过滤`
- **断言消息原文**：`3 个条目 期望 3，实际 1`
- **夹具位置**：`cell-painters.js:1329`（喂入 `value: [{ caption: 'A', color: 'success' }, { caption: 'B' }, 3]`，**caption 键** + 数字）→ 断言 `:1331`。caption 对象被过滤，`3` 包 `{ label: 3 }` 保留 → 1。
- **根因归类**：**夹具侧**（同上）。
- **修复建议**（**在边界内**）：`:1329`、`:1355`（`{ caption: 'P', color: 'blue' }` → label）、`:1367`（caption D/E → label）、`:1372`（`[{ color: 'red' }, { caption: 'ok' }]` → `[{ color: 'red' }, { label: 'ok' }]`，否则两元素皆被过滤、断言 `:1374` 期望 1 会得 0）改为 label 键；掩蔽断言 `:1332`（消息"对象元素 caption 文本"→label）、`:1335`（消息"{ caption: el } 行为不变"→"{ label: el }"）、`:1337` 注释、`:1355-1364`（payload 原引用，target 加 label 后语义不变）、`:1369-1370`、`:1374`（"缺 caption 对象被过滤"→"缺 label"）；检查标题 `:1324` "caption/color 激活"→"label/color 激活"、返回文案 `:1377` 同步。字符串喂入段（:1338-1352）无需动。
- **边界核对**：仅夹具键名迁移 + 断言/标题文案 + 期望值调整 → **不触及边界**。

### 失败 3：ListColumn compile 产物

- **检查名原文**：`[cell-painters] ListColumn compile 产物（20261104 list 列双通道，R1 列级 link）：仅数组值、列级 link 整列、非 link 列正文色、payload item、caption 兼容、过滤`
- **断言消息原文**：`空 label 条目过滤、caption 条目保留 期望 2，实际 1`
- **夹具位置**：`cell-painters.js:1464`（喂入 `value: [{ caption: '旧键' }, { label: '' }, 'ok']`）→ 断言 `:1466`。caption 兼容已删除：`{ caption: '旧键' }` 被过滤、`{ label: '' }` 被过滤，仅 `'ok'` 保留 → 1。
- **根因归类**：**夹具侧**。该块（`:1463-1467`）断言的"caption 兼容读取（开发期警告一次）"契约已随基线迁移**删除**（diff 核实 `labelOf`/`warn` 整体移除），属断言过期而非组件回归——组件现状契约（label-only + 过滤）已在同检查 `:1394-1461` 的 label 键断言中全部验证通过。
- **修复建议**（**在边界内**）：删除或反转子块：改为喂 `[{ caption: '旧键' }, { label: '' }, 'ok']` 断言 items.length === 1、`items[0].text === 'ok'`（消息如"caption 遗留键不再读取（兼容已删除）、空 label 条目过滤"）；或直接删除该子块仅保留空 label 过滤断言。检查标题 `:1381` 与返回文案 `:1469` 去掉"caption 兼容"。同检查其余段全部 label 键、已通过，**不动**。
- **边界核对**：断言语义更新 + 文案，不改组件行为 → **不触及边界**。

### 失败 4：link 列竖排

- **检查名原文**：`[cell-painters] link 列竖排：数组每条一行、color 查表/danger 映射/disabled 取色、超限 dots '...'、条目矩形回报`
- **断言消息原文**：`3 条 + dots（maxItems=4，第 4 条 '...'） 期望 ["A","B","C","..."]，实际 ["D","E"]`
- **夹具位置**：`cell-painters.js:1548`（`record.v = [{ caption: 'A', color: 'success' }, { caption: 'B', disabled: true }, { caption: 'C', danger: true }, 'D', 'E']`，**caption 键** + 字符串）→ 断言 `:1552`。caption 对象被过滤 → 仅 `'D'`、`'E'` 竖排，maxItems=4 未超限无 dots。
- **根因归类**：**夹具侧**。canvas 竖排经 `prepareColumn({type:'link'})` → `LinkColumn.compile` → 同一 `normalizeEntries`（`list.js:23-25`），`cell-painters.js:174-189` 分发仅消费产物 items——组件绘制链无条目键逻辑。
- **修复建议**（**在边界内**）：`:1548` 三对象条目改 label 键（`{ label: 'A', color: 'success' }` 等）；其后掩蔽断言 `:1553-1564`（y 锚、x 对齐、success/muted/danger/primary 四态取色、dots 条目、矩形回报、disabled 字段）键迁移后语义原样成立，无需改文案（无 caption 字样）。
- **边界核对**：仅夹具键名迁移 → **不触及边界**。

### 失败 5：link 悬停（问题 7/A7）

- **检查名原文**：`[cell-painters] link 悬停（问题 7/A7）：竖排与横排两路径色变 + 1px 下划线、disabled 不悬停、list 非 link 条目不悬停`
- **断言消息原文**：`竖排 hover 条目 fillStyle = item.color 查表 hover 谱系（success） 期望 rgba(160, 130, 245, 0.85)，实际 rgba(0, 130, 245, 0.85)`
- **夹具位置**：`cell-painters.js:1622`（record 同失败 4 形态，**caption 键**）→ 断言 `:1628`。caption 条目过滤后 hover index 0 落在 `'D'`（无 color → primary），实际 `rgba(0,130,245,0.85)` = 夹具 `PRIMARY_HOVER`（:74）= primary 条目 hover 的正确值；期望值是 success 条目（`THEME_COLORS.success.hover`，:89 按 index 计算 = `rgba(160,130,245,0.85)`）——期望/实际差异完全由夹具键名导致的条目移位解释。
- **根因归类**：**夹具侧**。hover 组件链路无回归：`cell-painters.js` `drawLinkItems` hover 取色（`linkHoverColorOf` 谱系）按产物条目 `color` 字段工作，本例产出的正是 primary hover 正确色。
- **修复建议**（**在边界内**）：`:1622` 改 label 键后，`:1628-1633`（success hover、下划线 y/x/宽高/fillStyle）与 `:1636-1639`（disabled 不悬停）按原语义成立；list/横排段（:1642-1679，label/字符串/自定义 render 喂入）已通过不动。
- **边界核对**：仅夹具键名迁移 → **不触及边界**。

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 追加轮验收：自检页 223/223 | 浏览器（playwright DOM 断言） | 实测 218/223，5 ✗（原文明细见定位节；`evidence/self-check-failures-218-223.json`、`evidence/self-check-failures-panel.png`） | FAIL |
| 修复边界约束：不改组件行为（本轮检查） | 命令 + 源码核对 | 本轮零改动（git diff 与上轮一致）；组件 label-only 契约经源码（`list.js:23-25`、`link.js:14`）+ 同页 label 键检查通过证明无回归 | PASS（约束未被本轮触碰） |

## 范围核对

基线 / 当前工作区（`git status --short` = 13 M + 1 ??，`git diff --stat` = 13 files, +257/-63，与 05-verify-1 逐字一致）：

- **基线排除项**（同上轮）：`demo/src/data/table-ex-scene/main-view.vue`、`demo/src/layout/split-box/main-view.vue`、`src/components/table/column-types/link.js` / `list.js`（caption→label 迁移本体）、`todo/misc.md`。
- **无法区分**（基线 ∩ 改动清单，同上轮）：`demo/src/data/table-ex-basic/main-view.vue`、`demo/src/data/table-ex/main-view.vue`、`src/components/table/column-types/text.js`、`button.js`。
- **设计内改动**（同上轮）：`src/components/table/ex/cell-paint/cell-painters.js`、`cell-text.js`、`ex/table-paint/paint-gridlines.js`、`paint-header.js`。
- **本轮新增改动**：无（只读验证）。
- **修复预计触及面**（派发第 5 项）：**仅 1 个文件** `demo/src/data/table-ex/self-checks/cell-painters.js`（5 个失败检查内的喂入键迁移、断言/标题/返回文案更新、失败 3 的过期断言删除/反转、失败 2 的 `:1372` 期望值调整）。检查项总数 **223**（修复目标 223/223；cell-painters.js 含 57 项，其余 166 项分布在其余 11 个模块与数据生成器断言，均通过、不动）。`editor.js` 的 caption 喂入（:185/:275/:964）属编辑器层契约、其检查当前通过，**不在迁移范围**（同 00-task 对 tag/button 的口径）。范围外不触及任何 `src/` 文件。
- **备注（基线内注释滞后，仅记录不处理）**：`src/components/table/column-types/link.js:8`（"caption 键经 ListColumn 兼容读取（开发期警告一次）"）与 `list.js:16`（"label ?? caption 为 null/'' 的条目过滤"）与迁移后代码（label-only、无兼容）不符。属基线未提交改动自身的注释残留，不在本轮修复边界（仅夹具与断言），不判 FAIL；如需清理由用户/后续轮裁定。

## 测试质量问题

失败 5 项不是"只断言不抛错"类缺陷，而是夹具喂入键滞后于组件契约（caption vs label）导致的过期断言——断言本身对条目数/文本/取色/悬停色的断言是实质性的。失败 3 暴露一处契约性过期断言（caption 兼容读取），属设计契约变更后夹具未同步，修复方向为删除/反转断言而非放松判据。

## 需人工检查

无（5 项失败全部为页面 DOM 断言可判定项，已逐项自动化定位）。

## 环境阻塞

无新增。demo 服务常开（非本验证启动）可达；console 仅基线 badSrc 1 error（负向夹具预期行为）。

## 失败项（FAIL 时）

追加轮验收标准（223/223）未达，失败项即上述 5 项自检（详析见「自检页失败定位」）：

| # | 检查 | 断言位置 | 关键错误 | 根因 | 疑似位置 |
|---|---|---|---|---|---|
| 1 | link（list 兼容壳）/tag 双通道条目结构 | `link 3 条目 期望 3，实际 1` | 夹具喂 caption 条目被 label-only 过滤 | 夹具侧 | `demo/src/data/table-ex/self-checks/cell-painters.js:1225` → `:1229`；组件契约 `src/components/table/column-types/list.js:23-25`、`link.js:14` |
| 2 | LinkColumn compile 产物（dom 通道） | `3 个条目 期望 3，实际 1` | 同上 | 夹具侧 | `cell-painters.js:1329` → `:1331` |
| 3 | ListColumn compile 产物 | `空 label 条目过滤、caption 条目保留 期望 2，实际 1` | 断言已删除的 caption 兼容契约 | 夹具侧（断言过期） | `cell-painters.js:1464` → `:1466-1467` |
| 4 | link 列竖排 | `期望 ["A","B","C","..."]，实际 ["D","E"]` | 同 1 | 夹具侧 | `cell-painters.js:1548` → `:1552` |
| 5 | link 悬停（问题 7/A7） | `期望 rgba(160,130,245,0.85)，实际 rgba(0,130,245,0.85)` | 同 1（条目移位后 hover 落 primary 条目，实际值正确） | 夹具侧 | `cell-painters.js:1622` → `:1628` |
