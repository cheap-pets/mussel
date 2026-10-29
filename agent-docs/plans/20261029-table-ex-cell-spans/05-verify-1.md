# 验证报告（轮 1）— mu-table-ex 合并单元格实施

VERDICT: FAIL

## 上轮问题核对（第 2 轮起）

首轮验证，无上轮报告。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | PASS (exit 0) | mussel dev/prod + mussel.ex dev/prod 四段全过；`dist/mussel.ex.js 643.56 kB`、`dist/mussel.ex.min.js 305.59 kB`；`✓ built in 288ms/301ms/320ms`，0 error |
| headless Edge `--dump-dom http://localhost:3000/data/table-ex/` | PASS | 自检面板 `自检结果（184/185 通过）`；185 条中唯一 FAIL = spans 自检 5（详见验收 1） |
| demo 夹具 Node 冒烟（esbuild bundle spans.js，evidence/repro-demo-fixture.mjs） | PASS | `regions=12 warnings=1`，`ALL PASS`（cat 4 段×rowspan 7 起点 0,8,16,24、sub 4×7、summary 4 段 rest→colTo 8、tags true 警告 ×1） |
| 自检 5 复现冒烟（evidence/repro-check5.mjs） | 复现 | 警告 `spanMethod 声明 (0, 3) 与已登记合并区域重叠，整条丢弃`；`assert includes("(1, 3)") = false` |
| CDP 交互断言（evidence/cdp-steps.log + cdp-spans-verify2/3 输出） | 见验收 4 | hover 残影/载荷主行/覆盖行警告/滚动态归一/条目命中/排序警告均取到证据 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. spans.js 自检覆盖 §9 自检 1–13，全部断言通过 | 命令 + HTTP（dump-dom 自检面板） | 面板 13 条中 **12 PASS / 1 FAIL**：自检 5「spanMethod 键解析」抛 `重叠丢弃警告带坐标`；其余 12 条（级联分段/键形态/树父链/rest+夹紧/重叠越界/resolveSpanCell/spanRectOf/行高分层/rowRegions/异常处置/editorGridlineFlags）全过 | **FAIL** |
| 2. 既有 self-checks 全量回归（null 分支零回归） | HTTP（自检面板逐条比对各模块 check name） | text-wrap 10 / row-geometry / tree / theme 16 / layout 21 / cell-painters / painter 23 / interactions / editor 全部 PASS（唯一 fail 属 spans 模块；name 比对中 not-in-dom 项均为夹具数据串非断言名）；代码级：`paintBodyRow` HEAD 939ch 逐字相同 | PASS |
| 3. tree.js 补 parentKeys 断言 | HTTP（面板）+ 文件 | `buildFlatRows：parentKeys 平行数组（根行 null、子行父 key，与 rows/levels 同序）` 在面板 PASS；demo/.../self-checks/tree.js 断言存在 | PASS |
| 4. demo 示例组覆盖场景 14–20 | 浏览器（CDP headless Edge，知识库 headless-edge-dom-verification 替代 playwright mcp） | 14 hover cell 残影：覆盖行 (6,1) 采样 hover 变化→移出恢复 baseline-equal；15 滚动 150px（viewRows.start=2）后点击覆盖行载荷 `record:"#1",recordIndex:0` + link 条目像素定位点击 `cell-item-click {record:"#2",recordIndex:1}` + 截图主格内容/img 绘制；16 点击锚行后覆盖行底色像素随动 + 受控选中警告 `[MUSSEL:TableEx] 选中 key "2" 落在合并区域的覆盖行上…`；17 结构 Node 冒烟 ALL PASS（12 regions）+ console tags true 警告 ×1 + 截图；18 覆盖格 (2,0) 点击载荷 `#1/0`（非合并名称格 (5,2) 载荷 `#6/5` 原行，语义正确）；19 collapseAll 后 count 列 0 区域、展开态无跨父区域；20 `update:order-by "name:asc"` + 警告 `orderBy 非空且存在启用中的 autoRowSpan…` | PASS（15 的 img 异步 onload 重绘链路未单独刺激，见需人工） |
| 5. npm run build 双版本产出 | 命令 | exit 0，mussel 与 mussel.ex 各 dev/prod 四文件产出 dist/ | PASS |
| 6. 范围限 §11 清单；null 分支逐字保留 | 命令（git show eeec1fd 比对）+ 范围核对 | 当前 `paintCellRange`：`if (!state.spans) { for … paintBodyRow(ctx, state, records, columns, r, cols, x0, bandWidth, W, H) } return`——循环体与 HEAD 逐字相同；`paintBodyRow` 函数 HEAD 与当前 939ch **identical**；spans 分支走 `paintBodyRowSpans`+`paintSpanRegions`。范围核对见下节 | PASS |
| 7. 不修改 skills/、docs/、docs-site/ | mtime 核对 | 实施窗口 = 派发 13:51 → 04-impl 14:58；docs-site/.vitepress/config.mts 12:05、docs-site/components/table-ex.md 12:11（未跟踪新文件，内容 0 处 span/合并）、docs/quick-reference_components.md 12:11、skills/mussel-ui/SKILL.md 12:26、skills/…/data.md 12:11——全部早于派发，属基线前期工作；窗口内无任何文档目录改动 | PASS |

## 范围核对

- 基线：分支 mussel-table，HEAD eeec1fd，57 个既有脏文件（前期 canvas-table→table-ex 工作，含已 staged rename）。当前 `git status --short` 60 行 = 基线 + 本任务 14 文件 + 任务目录。
- 验证产物：`dist/`（构建，已 ignore 不在 status）；`/tmp/verify-*-bundle.mjs`（esbuild 冒烟）；`evidence/`（任务目录内）。
- 实施窗口（13:51–14:58）内被改文件穷举（mtime）恰 14 个 = 设计 §11 清单 13 个 + `demo/src/data/table-ex/self-checks/index.js`（04-impl 偏离 1，自检注册接线）。
- 无法区分：清单内 13 文件同时出现在基线脏列表与改动清单，git 无法区分两层改动（mtime 已归位实施窗口）；`src/components/table/mappings.js`(11:36)、`docs-site/components/table-ex.md`(12:11) 等窗口外改动均属基线，不计。
- 设计外改动：无「未记录」项。偏离 1（self-checks/index.js）：**已记录-未覆盖**（不在 §11 清单字面内；04-impl 论证为 §9 标题「及同步」+ 验收 1「全部断言通过」的必要接线，仅 import + moduleChecks 一行，判定合理，留协调者裁定）。

## 测试质量问题

无。spans.js 13 条断言均断言具体契约（rowspan/colTo 数值、警告文本含坐标、浅拷贝仅改 rowIndex/colIndex、静默丢弃不警告等），非「不抛错」式；既有模块回归断言密度充足。

## 需人工检查

1. demo 17 视觉细部（网格线 1px 分段对齐、区域底色与斑马/选中叠加、固定列分界线）：已出截图 `evidence/spans-scene.png`（初始态）与 `evidence/spans-scrolled.png`（锚行滚出态：数码/配件组区域 pass、cat/sub 列内行线分段、小计 rest 跨列、img 蓝块可见），建议人工目验一次。
2. demo 15 的「img 加载后重绘」invalidateCell 放行链路：夹具 img 为 data URI 加载即时，截图中 img 已绘制（间接证据）；异步 onload 触发 invalidate 的路径未单独刺激。可用弱网/大图夹具人工复验。

## 环境阻塞

无。playwright mcp 不可用，已按 00-task.md 允许的备用手段（知识库 headless-edge-dom-verification + CDP Runtime.evaluate）完成；demo watch 服务（PID 19789）为既有常驻，未重启。验证用 headless Edge（PID 43342）已按 PID 关闭。

## 失败项（FAIL 时，不含环境阻塞）

1. 标准 1（spans 自检全部通过）：自检 5「spanMethod 键解析：key 优先、field 唯一命中、多列命中警告、无命中警告、info 载荷」失败，错误 `重叠丢弃警告带坐标`。
   - 断言位置：`demo/src/data/table-ex/self-checks/spans.js:207`——期望警告文本含 `(1, 3)`。
   - 实现位置：`src/components/table/ex/spans.js:113`——警告输出 `spanMethod 声明 (0, 3) 与已登记合并区域重叠，整条丢弃`，坐标为声明主格 `(row=0, col=3)`。
   - 定性：功能行为正确（fb 对列 3 的声明与 kb 区域 [0,3)×{3} 重叠→整条丢弃，警告存在且含「重叠」，`anchors(0,3).rowspan=3`、`anchors(1,3)=undefined` 均符合设计 §2.3/§3.2）；设计 §7 的坐标语义 = 声明主格 `(row, col)`，声明来自 `recordIndex 0` 的行 → 实现输出 `(0, 3)` 正确，断言期望 `(1, 3)` 疑为编写期笔误。修复方向：修正该断言期望值为 `(0, 3)`（不涉库代码）。
