# 05-verify-3（追加轮重验，N=3）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

05-verify-2 的 5 项失败逐项核对（夹具现状独立读取 + 页面实测双重证据）：

| # | 上轮失败项 | 核对结论 |
|---|---|---|
| 1 | link（list 兼容壳）/tag 双通道条目结构（`link 3 条目 期望 3，实际 1`） | **已解决**。夹具 `cell-painters.js:1225`（canvas）、`:1266`（dom）喂入已迁移为 `{ label: 'A', danger: true }` / `{ label: 'B', disabled: true }` + `'C'`；`:1233` 文案 "title = label"、`:1247` 断言 `item.label`、`:1257` "label join"；tag 半段（:1279/:1293，caption 键）契约未变未动——与 05-verify-2 修法逐条一致。页面实测该项 ✓（`evidence/self-check-223-223.json`） |
| 2 | LinkColumn compile 产物（dom 通道） | **已解决**。检查标题 `:1324` "label/color 激活"；`:1329`/`:1355`/`:1367`/`:1372` 喂入 label 键；`:1372` 保留 `{ color: 'red' }`（缺 label 被过滤）+ `{ label: 'ok' }`，`:1374` 期望 1 不变且语义更准（color 不豁免 label 过滤）；`:1332`/`:1335`/`:1374` 文案同步；字符串段（:1338-1352）未动；`:1356` 列级标题 `columnDef.caption` 范围外未动。页面实测 ✓ |
| 3 | ListColumn compile 产物（过期 caption 兼容断言） | **已解决**。原 `:1463-1467`「caption 条目保留、期望 2」反转为「caption 遗留键不再读取（兼容已删除）」：喂入不变 `[{ caption: '旧键' }, { label: '' }, 'ok']`，断言 `items.length === 1` + `items[0].text === 'ok'`（`:1466-1467`）；标题 `:1381` 与返回文案 `:1469` 同步。与组件现状契约（`src/.../list.js` normalizeEntries label-only 过滤）一致，属收紧到真实契约而非删断言放水。页面实测 ✓ |
| 4 | link 列竖排（`期望 ["A","B","C","..."]，实际 ["D","E"]`） | **已解决**。`:1548` 三对象条目迁移为 label 键；其后取色/锚点/dots/矩形断言（:1552-1564）语义原样成立未改。页面实测 ✓ |
| 5 | link 悬停（`期望 rgba(160,130,245,0.85)，实际 rgba(0,130,245,0.85)`） | **已解决**。`:1622` 与失败 4 同形迁移为 label 键；`:1628-1639` success hover/下划线/disabled 断言未改，条目移位消除后 success hover 命中正确。页面实测 ✓ |

上轮测试质量问题（失败 3 过期断言）：**已解决**——以反转断言（仍断言条目数与文本）修复，非放松判据。

05-verify-2 环境阻塞 3 条（URL 404 口径、5 项失败、console badSrc）中，第 2 条本轮已解决；其余 2 条为环境固有/基线预期，见「环境阻塞」。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/data/table-ex/` | exit=0 / HTTP 200 | demo 服务常开可达（非本验证启动，无 PID 管理义务） |
| playwright 直访 `http://localhost:3000/data/table-ex/` + DOM 提取 | 成功 | 面板「自检结果（223/223 通过）」；`li` 检查项 223 条、✗ 计 0、failItems=[]；5 项原失败检查全部 ✓（面板标题已是修复后新文案 "label/color 激活"、"caption 遗留键不再读取"，证明页面运行的是修复后夹具）。证据：`evidence/self-check-223-223.json`、`evidence/self-check-panel-223-223.png`、`evidence/self-check-header-223-223.png` |
| console 检查 | — | 1 error（`net::ERR_INVALID_URL @ data:image/png;base64,AAAA1`，基线 badSrc 负向夹具）+ 35 warnings，与 05-verify-2 基线逐字一致，**无新增** |
| `git status --short` | exit=0 | 14 M + 1 ??：基线 13 M + 1 ??（任务目录）之外**仅新增** `M demo/src/data/table-ex/self-checks/cell-painters.js`（修复边界文件）；`.playwright-mcp/` 已被 gitignore，无验证产物泄漏 |
| `git diff --stat` | exit=0 | 14 files, +277/−83；排除夹具文件后恰为 13 files, +257/−63，与 05-verify-2 记录（上轮 build exit=0 时的状态）**逐字一致** → src/ 零改动、基线未回退；夹具文件自身 +20/−20 与总量差精确吻合 |
| `git diff -- demo/src/data/table-ex/self-checks/cell-painters.js` | exit=0 | 12 个 hunk 全部落在 5 个失败区域内（逐 hunk 见「上轮问题核对」），无范围外编辑 |
| `npm run build` | 未重跑 | 00-task：涉及源码改动时验证者可跑；本轮仅夹具（demo）改动、src/ diff 与上轮 build exit=0 状态逐字一致，无重跑必要（同 05-verify-2 口径） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. 自检页 = 223/223（playwright 直访，✓/✗ 列表断言） | 浏览器 | 面板「自检结果（223/223 通过）」，223 项 li 全 ✓、✗ 列表空；`evidence/self-check-223-223.json`（url/capturedAt/summary/totalChecks=223/failItems=[]/5 项 target PASS）+ 截图 2 张 | PASS |
| 2. 原 5 项失败逐项转 ✓，断言语义与组件现状契约一致（label 标准键、caption 兼容删除、ListColumn 过滤语义正确反转） | 浏览器 + 夹具源码核对 | 页面 5 项全 ✓（标题为新契约文案）；夹具 diff 12 hunk 逐项核对：键迁移 + 文案 + 失败 3 反转断言（喂入不变、期望 2→1、仍断言 length 与 text），与 `src/.../list.js` label-only 过滤、`link.js` `{ label: el }` 包装现状契约一致；无删断言放水 | PASS |
| 3. 无新增失败项；console 除基线 badSrc 1 error 外无新 error | 浏览器 | 223 项 0 ✗；console 恰 1 error（badSrc）+ 35 warnings，计数与内容同 05-verify-2 基线 | PASS |
| 4. 范围：本轮改动仅 `demo/src/data/table-ex/self-checks/cell-painters.js`；src/ 零改动；不回退基线 | 命令（git status/diff） | 14 M + 1 ?? 中新增 M 仅该夹具文件；排除夹具后 diff = 13 files +257/−63 与上轮逐字一致（src/ 零改动、基线未回退的算术证据）；夹具 diff 无范围外 hunk | PASS |

## 范围核对

- **基线排除项**（基线 13 M，未回退）：`demo/src/data/table-ex-basic/main-view.vue`、`table-ex-scene/main-view.vue`、`table-ex/main-view.vue`、`layout/split-box/main-view.vue`、`src/components/table/column-types/{button,link,list,text}.js`、`src/components/table/ex/cell-paint/{cell-painters,cell-text}.js`、`src/components/table/ex/table-paint/{paint-gridlines,paint-header}.js`、`todo/misc.md`。
- **无法区分**（基线 ∩ 设计改动清单，同前两轮）：`demo/src/data/table-ex-basic/main-view.vue`、`demo/src/data/table-ex/main-view.vue`、`src/components/table/column-types/text.js`、`button.js`。
- **设计内改动**（主任务设计清单）：`src/.../cell-painters.js`、`cell-text.js`、`paint-gridlines.js`、`paint-header.js`（基线内）。
- **本轮新增改动**：仅 `demo/src/data/table-ex/self-checks/cell-painters.js`（+20/−20）——属 00-task「追加轮」修复边界明示的目标文件（"仅改自检夹具与断言"），非设计外改动。
- **验证产物**：无（`.playwright-mcp/` 已 gitignore；evidence 仅写入任务目录 `evidence/`）。
- **未记录 / 未覆盖**：无。

## 测试质量问题

无。失败 3 的修复为断言反转（保留喂入、断言 length===1 与 items[0].text==='ok'），对「caption 遗留键不读取 + 空 label 过滤」这一组件现状契约做正向实质断言；失败 2 的 `:1372-1375` 保留了「有 color 无 label 仍被过滤」的负向检查。5 项检查的断言均为条目数/文本/取色/hover 色/payload 原引用级实质断言，无"只断言不抛错"。

## 需人工检查

无（追加轮 4 条标准全部自动化验证）。

## 验收入口（PASS 时必填）

1. 标准 1/2/3 — 打开 http://localhost:3000/data/table-ex/（rollup watch 服务已常开），页面「调试面板」应显示「自检结果（223/223 通过）」且其下列表无 ✗ 条目；可点击面板内「重跑自检」按钮复验。
2. 标准 4 — 在仓库根执行 `git status --short`：应仅见基线 13 个 M + 任务目录 ??，外加 1 个 `M demo/src/data/table-ex/self-checks/cell-painters.js`（追加轮唯一修复文件）。

## 环境阻塞

无新增。派发 URL 口径（`/data/table-ex/`）本轮直访 200，前轮记录的 `/table-ex-basic/` 404 口径问题不涉及本轮验收。console 1 error 为基线 badSrc 负向夹具预期行为（00-task/05-verify-2 已认定的基线遗留，非本轮新增）。

## 基线遗留备注（不判 FAIL，仅记录）

`src/components/table/column-types/link.js:8` 与 `list.js:16` 注释仍描述已删除的 caption 兼容（"caption 键经 ListColumn 兼容读取" / "label ?? caption 为 null/'' 过滤"）——基线未提交改动自身的注释残留，05-verify-2 已记录「不在本轮修复边界（仅夹具与断言）」，本轮按约束未动，由用户/后续轮裁定。
