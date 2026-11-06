# 05-verify-4（追加轮 2 终验，N=4）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

上轮验证报告 = 05-verify-3.md（追加轮 1 重验，VERDICT PASS），无失败项、无测试质量问题。逐项核对其结论在本轮（追加轮 2 实施 + 全量 build 后）是否保持：

| # | 上轮结论 | 本轮核对 |
|---|---|---|
| 1 | 追加轮 1 五项自检失败已修复，223/223 通过 | **保持**。本轮独立复测：`/data/table-ex/` 面板「自检结果（223/223 通过）」、223 li、0 ✗、failItems=[]（`evidence/self-check-223-223-round2.json`）；console 恰 1 error（基线 badSrc `net::ERR_INVALID_URL @ data:image/png;base64,AAAA1`）+ 35 warnings，与 05-verify-3 基线逐字一致，无新增 |
| 2 | 基线未回退（13 基线 M 全在，diff 逐字一致） | **保持**。本轮 `git status --short` 19 M 中 13 基线 M + 追加轮 1 `cell-painters.js` 全部在列；追加轮 2 新增 5 M 全为设计改动清单文件（见范围核对） |
| 3 | link.js/list.js 基线注释残留（不判 FAIL 的基线遗留） | **仍在，未恶化**。本轮未涉及该两文件逻辑（`link.js +7/−`、`list.js +15/−` 与上轮记录持平），按约束未动 |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `node --check` ×7（paint-utils/paint-header/paint-gridlines/paint-overlay/paint-body/use-pointer/self-checks painter.js） | exit=0 | `ALL-SYNTAX-OK` |
| `npm run build` | exit=0 | 4 段全过：285 modules ×2（base dev/prod）+ 330 modules ×2（ex dev/prod），无 error；日志 `evidence/build-round2.log` |
| `curl` 3 页 | exit=0 | `/data/table-ex/`=200、`/data/table-ex-basic/`=200、`/data/table/`=200（demo 服务常开，非本验证启动，无 PID 管理义务） |
| `git status --short` | exit=0 | 19 M + 1 ??（任务目录）；`.playwright-mcp/` porcelain 计 0（gitignore 生效，无验证产物泄漏） |
| `git diff --stat` | exit=0 | 19 files, +407/−113（上轮 14 files, +277/−83 + 追加轮 2 五文件 +154 变化行 + main-view.vue 本轮绑定增量） |
| playwright 自检页断言 | 成功 | 「自检结果（223/223 通过）」；「行背景带宽度」检查项文案为新口径且 ✓（证明运行的是追加轮 2 夹具） |

## 验收标准核对

探针口径：sparse 表 canvas 宽 996css、dpr=2、contentRightX=290、表头 36 + 3×36 末行底 144；取样 `getImageData`，坐标 `cssX × canvas.width / clientWidth`（02-design-2.md 测试计划口径）。暗色主题基色：bgFill=[45,49,53]、bgNormal=[7,8,8]、hover 混色=[30,32,33]、选中混色=[0,24,61]。

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 需A sparse 表头背景止于末列右缘 | 浏览器 | y=18：x=230/250=[45,49,53]（表头背景）、x=289=[97,103,109]（末列右缘线）、x=340/450=[0,0,0,0]（透明）；x=450 竖扫 y=0..35 全透明 | PASS |
| 需A 表头底边框与格线口径一致 | 浏览器 | y=35（底边框）：x=50/250/289=[97,103,109]、x=340/450=[0,0,0,0]；行线 y=72/108：x=250=[97,103,109]、x=450=[7,8,8]（无线）——同 cap 同缘 | PASS |
| 需A 末列内表头文字/分隔线正常（截图辅助） | 浏览器 | `evidence/round2-sparse-static-reqA.png`：「# / 名称 / 数量」文字清晰、列分隔线正常；透明区透出页面背景即设计声明预期（02-design-2.md 风险节） | PASS |
| 需A 行满/列满表头铺满不回归 | 浏览器 | 基础用法表 y=18：x=100/500/990=[45,49,53]（整宽铺满；x=950 为表头字形非透明） | PASS |
| 需B-1 行 hover 带不越末列右缘 | 浏览器 | hover 行 1：x=250=[30,32,33]（混色）、x=340/x=450=[7,8,8]（底色原色无混色）；移出后 (250,54) 还原 [7,8,8] | PASS |
| 需B-2 列 hover 带不越末行底部 | 浏览器 | column 模式 hover 名称列：y=54/100=[30,32,33]、y=143=[97,103,109]（行线重叠处）、y=145/200/250=[0,0,0,0]；异列 (250,54/120)=[7,8,8] | PASS |
| 需B-3 cell / cross 模式无回归 | 浏览器 | cell hover (250,100)：格内 [30,32,33]、同列异行/同行异列/延伸区均 [7,8,8]；cross hover (145,100)：交点 [49,51,53]、行带列内 [30,32,33]、行带延伸区 x=340/450=[7,8,8]、列带 y=54/126=[30,32,33]、y=200=[0,0,0,0]；截图 `evidence/round2-sparse-cross-hover.png` | PASS |
| R5 空白区命中放行保留（设计未解问题 1） | 浏览器 | hover 延伸区 (450,54)：列内 (250,54)=[30,32,33] 行带混色出现（止于末列右缘）、(450,54)=[7,8,8] 无混色、行 3 选中保持 | PASS |
| 需C 选中带止于末列右缘 + 延伸区补非选中底色（普通行 bgNormal） | 浏览器 | 点行 1（受控 selectedKey）：(250,54)=[0,24,61]（selectBg 混色）、(289,54)=[97,103,109]（缘线）、(340,54)/(450,54)=[7,8,8]（bgNormal）；点行 3：(250,126)=[0,24,61]、(340/450,126)=[7,8,8]；行 1 还原 | PASS |
| 需C 斑马行延伸区补 bgStripe（demo 无 striped，自检夹具覆盖） | 浏览器（自检） | 自检「行背景带宽度」检查项 ✓ 通过，含 (250,90)=selectBg、(450,90)=bgStripe、3 行夹具列带 (200,100)=blend(hoverBg,bgStripe)/(200,200)=[0,0,0,0]、表头 (450,4)=[0,0,0,0]/(300,4)=bgFill 断言（夹具 `painter.js` diff 与 06-amend-2.md 台账 #2 逐条一致） | PASS |
| 基线 行满/列满 hover 与选中不回归 | 浏览器 | 基础表 hover 行 1：x=100/500/985/993 全宽 [30,32,33] 混色铺至右缘；点击选中：全宽 [0,24,61]（现状口径铺满） | PASS |
| DOM 通道无回归 | 浏览器 | `/data/table/`：15 表、50 行、3 `.mu-table__cell-link`、首表可见渲染正常（本轮未涉及 DOM 改动） | PASS |
| 自检保持 223/223 | 浏览器 | 面板「自检结果（223/223 通过）」、223 项 0 ✗、failItems=[]；`evidence/self-check-223-223-round2.json` + `evidence/self-check-panel-223-223-round2.png` | PASS |
| `npm run build` exit=0 | 命令 | exit=0，4 段构建全过 | PASS |

色值备注：04-impl-2.md 记录 selectBg 混色 [25,45,75]，本轮实测 [0,24,61]，但 sparse 与基础表两场景一致、且延伸区精确等于 bgNormal 原色——判定为实施记录的参考值偏差（推测实施采样时 hover 未移出致叠色），非验收判据（判据为列内/延伸区差异与场景一致性），不影响结论。

## 范围核对

- **基线排除项**（13 基线 M，全部仍在 diff，未回退）：`demo/src/data/table-ex-basic/main-view.vue`、`table-ex-scene/main-view.vue`、`table-ex/main-view.vue`、`layout/split-box/main-view.vue`、`src/components/table/column-types/{button,link,list,text}.js`、`src/components/table/ex/cell-paint/{cell-painters,cell-text}.js`、`src/components/table/ex/table-paint/{paint-gridlines,paint-header}.js`、`todo/misc.md`。
- **追加轮 1 改动**：`demo/src/data/table-ex/self-checks/cell-painters.js`（+40/− 变化行，05-verify-3 已验）。
- **追加轮 2 新增改动**（6 文件，均在 02-design-2.md 改动清单）：`src/.../table-paint/paint-utils.js`、`paint-overlay.js`、`paint-body.js`、`src/.../composables/use-pointer.js`、`demo/src/data/table-ex/self-checks/painter.js`、（`demo/src/data/table-ex-basic/main-view.vue` sparse 绑定增量）。diff 内容与改动清单逐文件核对一致（含 `contentRightXOf`/`contentBottomYOf`/`baseRowBackground`/`isSelectedRow` 导出、表头背景 cap、hover 双带 cap、选中带 cap+补底、注释同步）。
- **无法区分**（基线脏 ∩ 设计清单，同前三轮）：`demo/src/data/table-ex-basic/main-view.vue`、`paint-header.js`、`paint-gridlines.js`（git diff 为多轮累计，单轮边界不可分；当前 diff 内容与设计一致，不下结论）。
- **验证产物**：无（`.playwright-mcp/` porcelain 计 0；证据仅写入任务目录 `evidence/`）。
- **设计外改动**：无「未记录」、无「未覆盖」。

## 测试质量问题

无。自检夹具断言均为实质断言：精确坐标 + 精确期望色值（含 alpha 数组）、负向断言（延伸区 = 原色而非仅"不抛错"）、脏区重绘保持、普通/斑马/选中三态口径、固定区不扩带与 Σ>W 裁剪回归保留；与 06-amend-2.md 台账 #2 逐条核对无缺漏。demo 探针由验证者独立取样复核，非采信实施记录。

## 需人工检查

无。测试计划全部条目（需A/需B-1..3/需C/基线/自检/编译）均已自动化验证；透明区分界视觉已由截图存证确认（`evidence/round2-sparse-static-reqA.png`、`evidence/round2-sparse-cross-hover.png`）。

## 验收入口（PASS 时必填）

1. 需A — 直访 http://localhost:3000/data/table-ex-basic/，滚动至「格线截断（行少 / 列少）」section：表头灰底与水平格线（含表头底边框）止于「数量」列右缘，右侧无表头背景；上方「基础用法」表表头铺满整宽不变。
2. 需B — 同页「样式与 hover 反馈」section 切 hover 模式 radio（row/column/cell/cross），在格线截断表上悬停：行带止于末列右缘、列带止于行 3 底部，均不绘入空白区。
3. 需C — 点击格线截断表任意行：选中高亮止于末列右缘，右侧延伸区为普通行底色；换选行正确切换。
4. 自检 — 访问 http://localhost:3000/data/table-ex/，调试面板显示「自检结果（223/223 通过）」且列表无 ✗（可点面板「重跑自检」复验）。
5. 编译 — 仓库根执行 `npm run build`，退出码 0。

## 环境阻塞

无。console 1 error 为基线 badSrc 负向夹具预期行为（`net::ERR_INVALID_URL @ data:image/png;base64,AAAA1`，与 05-verify-3 基线计数与内容逐字一致，非本轮新增）。

## 失败项

无（PASS）。
