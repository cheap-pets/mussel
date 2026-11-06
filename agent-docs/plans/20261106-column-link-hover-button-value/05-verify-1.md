# 05-verify-1（终验，N=1）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

首轮验证，无上轮报告。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | exit=0 | 4 段构建全部通过：base dev（285 modules，✓ built in 478ms）、base prod（✓ 275ms）、ex dev（330 modules，✓ 312ms）、ex prod（✓ 308ms）；日志 `evidence/build.log` |
| `git status --short` | exit=0 | 13 个 M + 1 个 ??（`agent-docs/plans/20261106-column-link-hover-button-value/`），见范围核对 |
| `git diff --stat` | exit=0 | 13 files changed, 257 insertions(+), 63 deletions(-) |
| `curl http://localhost:3000/data/table-ex-basic/` | 200 | demo 服务（常开，非本验证启动）可达 |

注：首次 build 因 `evidence/` 目录不存在重定向失败（EXIT=1），`mkdir -p` 后重跑成功，最终以第二次 exit=0 为准。

## 验收标准核对

验证环境：demo 服务常开，实际路径带 `/data/` 前缀；canvas 像素探针 `getImageData` 按 `cssX × canvas.width / canvas.clientWidth`（本机 dpr=2）取样；列类型表行 1 高 52px（含两行按钮条目），行高 36px（表头 36 + 行线 y=72/108/144）。

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 需1-1 link:true hover 下划线 + pointer，移出消失 | 浏览器（像素探针 + 截图） | hover「链接文本」row1：`.mu-table-ex__sticky` cursor `default→pointer`；文本众数色 `(28,126,214)→(77,151,207)`（hover 谱系色）；对照同排「映射」格（仅行带）diff，y=63 出现连续实线（mid=71/72 采样、maxRun=146 设备px ≈ 文本实绘宽），y=54-60 字形变色；移出后区域 diff 全零、cursor 复位 `default`。截图 `evidence/req1-1-hover.png`（下划线+hover 色可见）、`req1-1-normal.png` | PASS |
| 需1-2 点击仍 cell-click，payload 不变 | 浏览器（DOM 日志）+ 源码判据 | 点击链接格日志：`cell-click：recordIndex=0，field=site，name=全部类型`（payload 含 recordIndex/column/record）。「无 cell-item-click」：canvas 通道 `finishCellClick` 先 item 后 cell（`use-cell-click.js:108-124`），日志会被 cell-click 覆盖，故以源码短路为准——text 格 compile 无 `items` 字段，`emitDomItemClick` 在 `use-cell-click.js:236-239`（`canvasItem` 判空）返回，不发 cell-item-click；对照点「删除」按钮日志仍以 cell-click 收尾，与该派发序自洽 | PASS |
| 需1-3 未配 link / link:false 无下划线、光标不变 | 浏览器 | hover「文本」（x=100）cursor `default`；以 hover「映射」（band 对照）为基，hover「文本」时「文本」列区域 diff 仅左右噪声（mid=0，无下划线/无变色）；hover「映射」cursor `default` | PASS |
| 需1-4 DOM 通道不受影响 | 浏览器（DOM 断言） | `/data/table/`：3 个 `.mu-table__cell-link`（td 内）、cursor `pointer`；规则 `.mu-table__cell-link { cursor: pointer }` 与 `.mu-table__cell-link:hover { text-decoration: underline }` 原样；真实 hover 首链格 `textDecorationLine: none→underline` | PASS |
| 需2-1 字符串数组渲染按钮 | 浏览器（截图） | 「按钮(field)」row1（`actions: ['编辑','删除','复制']`）：3 个 pill（编辑/删除/复制），`evidence/req2-buttons.png` | PASS |
| 需2-2 单字符串渲染单按钮 | 浏览器（截图） | 同列 row2（`'查看'`）：单 pill | PASS |
| 需2-3 对象数组 caption/icon/color/disabled 生效 | 浏览器（截图） | 「按钮(field 对象)」row1：保存（green）、clock 图标 pill、锁定（disabled 灰显） | PASS |
| 需2-4 已配置 column.buttons 回归 | 浏览器（截图） | 「按钮」列 row1 编辑（缺省色）+ 删除（red）、row2 详情（indigo），与 `typeRecords.buttons` 值一致无缺条 | PASS |
| 需2-5 buttons 函数收到 (record, value) | 浏览器（截图） | 「按钮」列 `buttons: (record, value) => value` 以字段值渲染出全部按钮（未传 value 则恒空），第二参生效 | PASS |
| 需2-6 空值/null 落占位 | 浏览器（截图） | 「按钮(field)」row3（`actions: null`）：无按钮，显示列级占位 `--` | PASS |
| 需3-a 行少：垂直格线止于末行底部 | 浏览器（像素探针） | 格线截断表（3 行 × 320px）：列线 x=89/199/289 在 y=100 与末行底 y=144 处为线色 `(97,103,109)`；y=146/160/300 处 alpha=0（已截断）。截图 `evidence/req3-sparse.png` | PASS |
| 需3-b 列少：水平格线止于末列右侧（含表头底边框），表头背景整宽 | 浏览器（像素探针） | 行线 y=72/108/144 在 x=100 为线色；x=340（末列右缘 290 以右）y=72/108 为体背景 `(7,8,8)`（非线色）、y=144 alpha=0；表头底边框 y=35：x=30 线色、x=340/x=900 为表头背景 `(45,49,53)`（已截断）；表头背景 y=18 全宽同色（x=30/340/900/990 均 `(45,49,53)`）；末列右缘线 x=289 本身存在（y=20/50/143 线色），x=291 为体背景 | PASS |
| 需3-c 行满/列满铺满容器不回归 | 浏览器（像素探针 + 自检页） | 基础用法表（996×498，200 行 flex 列铺满）：末可见行线 y=468 在 x=960/985/990/994 均线色（达右缘）；列线 x=815 在 y=480/490/495 线色（达底缘）；`/data/table-ex/` 自检页 218/223 通过（5 项失败为基线遗留，见环境阻塞） | PASS |
| 编译检查 | 命令 | `npm run build` exit=0（见命令结果） | PASS |

## 范围核对

基线（00-task）：M `demo/src/data/table-ex-basic/main-view.vue`、`table-ex-scene`、`table-ex`、`layout/split-box`；M `src/components/table/column-types/{button,link,list}.js`、`todo/misc.md`；?? `agent-docs/plans/20261106-.../`。

- **基线排除项**（基线脏文件且不在设计改动清单，diff 内容与本次任务无关，已逐一核对）：`demo/src/data/table-ex-scene/main-view.vue`（link→tag 夹具改动）、`demo/src/layout/split-box/main-view.vue`（splitter resizable）、`src/components/table/column-types/link.js` / `list.js`（caption→label 迁移）、`todo/misc.md`（划线）。
- **无法区分**（基线脏列表 ∩ 设计改动清单，不下结论）：`demo/src/data/table-ex-basic/main-view.vue`、`demo/src/data/table-ex/main-view.vue`、`src/components/table/column-types/text.js`、`button.js`。
- **设计内改动**（基线外新增脏文件，均在改动清单）：`src/components/table/ex/cell-paint/cell-painters.js`、`cell-text.js`、`ex/table-paint/paint-gridlines.js`、`paint-header.js`。
- **验证产物**：`dist/`（`npm run build` 重建，已被 .gitignore 覆盖，未入 status）；`.playwright-mcp/`（验证截图/快照，未入 status，已忽略）。
- **设计外改动**：无（无基线 ∪ 改动清单之外的文件变更）。
- 未执行任何改变工作区状态的 git 命令；未回退基线改动（diff 核对 link/list 基线迁移原样保留）。

## 测试质量问题

项目无测试框架，按设计不新增测试（验证走 demo 夹具 + playwright）。demo 夹具与设计「demo 夹具」节逐项一致（链接文本列 ×2、按钮(field) ×2、`(record, value) => value`、site/actions/actionObjs 数据、第 3 行 null 组、格线截断 section 90/110/90 × 3 行 × 320px），夹具完整覆盖全部验收点，无「只断言不抛错」问题。

## 需人工检查

无（设计测试计划全部为浏览器/命令手段，均已执行；视觉形态经截图亲读复核：下划线、pill 色与灰显、格线截断观感均与判据一致）。

## 验收入口（PASS 时必填）

1. 需1-1/1-3 — 浏览器打开 `http://localhost:3000/data/table-ex-basic/`，「列类型」表：悬停「链接文本」列第 1 行文字 → 出现下划线、光标变 pointer、文字变亮蓝；移出后恢复；悬停「文本」列无任何变化。
2. 需1-2 — 点击「链接文本」格 → 表格下方日志行显示 `cell-click：recordIndex=0，field=site，name=全部类型`。
3. 需2-1/2/3/4/5/6 — 同表横向滚动到最右：「按钮(field)」列 row1 三个按钮、row2 一个「查看」、row3 `--`；「按钮(field 对象)」列 保存(绿)/时钟图标/锁定(灰)；「按钮」列 编辑+删除(红)、row2 详情(紫)。
4. 需3-a/b/c — 页面底部「格线截断（行少 / 列少）」表：垂直格线止于第 3 行底部、水平格线止于「数量」列右缘、表头背景仍整宽至容器右缘；「基础用法」表格线铺满容器。
5. 编译检查 — 项目根目录执行 `npm run build`，退出码 0。

## 环境阻塞

1. **派发 URL 404（基线/环境，不判 FAIL）**：派发与 00-task 的 `http://localhost:3000/table-ex-basic/` 实际 404（console 有 `ERR 404` 记录），实际路径 `http://localhost:3000/data/table-ex-basic/`。与 04-impl.md 偏离 1 一致，本次验证按实际路径执行，不影响任何标准。
2. **/data/table-ex/ 自检页 5 项失败（基线遗留，派发明示不判本任务 FAIL）**：218/223 通过。5 项全部为 link/list 条目键 caption→label 基线迁移遗留（自检夹具仍喂 `caption` 键）：
   - `[cell-painters] link（list 兼容壳）/tag 双通道条目结构`：link 3 条目 期望 3，实际 1；
   - `[cell-painters] LinkColumn compile 产物（dom 通道）`：期望 3，实际 1；
   - `[cell-painters] ListColumn compile 产物（R1 列级 link）`：期望 2，实际 1；
   - `[cell-painters] link 列竖排`：期望 `["A","B","C","..."]`，实际 `["D","E"]`；
   - `[cell-painters] link 悬停（问题 7/A7）`：hover fillStyle 期望 `rgba(160,130,245,0.85)`，实际 `rgba(0,130,245,0.85)`。
   该 5 项代码路径（LinkColumn/ListColumn compile、link 列竖排/悬停绘制）与本次改动文件无交集；夹具同步不在设计改动清单内。
3. **自检页 console 1 error（基线行为）**：`net::ERR_INVALID_URL @ data:image/png;base64,AAAA1`——既有负向夹具（`self-checks/cell-painters.js:779` badSrc），非本次引入。本次改动相关页面（/data/table-ex-basic/、/data/table/）console 无新增错误（仅验证自身 getImageData 的 willReadFrequently warning 与既有 demo 噪声）。

## 失败项（FAIL 时）

无。
