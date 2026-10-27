# 验证报告（第 1 轮）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

本轮为第 1 轮，无上轮报告。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npx eslint src/components/canvas-table/ demo/src/data/canvas-table/` | 退出 0 | 无任何 error/warning 输出（基线 39 error / 19 warning → 0/0） |
| `npm run build` | 退出 0 | dev + prod 两次 vite build 均 ✓（mussel.js 642.55 kB / mussel.min.js 289.44 kB，✓ built in 588ms/530ms） |
| demo 产物一致性抽查 | — | `grep -rl "beyondCols\|editorRectOf" demo/dist/assets/` 命中 `\catalog.js`：3000 端口服务的产物包含本轮新符号，与当前源码一致（未启停任何服务） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| R0 回归（自检面板全通过） | 浏览器（自检面板 DOM） | 页面加载即跑：**147/147 通过、0 fail**（模块分布 text-wrap 10 / row-geometry 12 / tree 8 / theme 15 / layout 21 / cell-painters 28 / painter 18 / interactions 17 / editor 14 / data 4）；`location.reload()` 后复测仍 147/147（evidence/r0-selfchecks.json） | PASS |
| R1 固定列表头无残影 | 浏览器 + 页面 JS 像素断言 | 场景一：fixed 场景（fixedW=230）scrollLeft=84，固定表头区 `[0,228)×[0,36)`（避开分界强化线列）滚动前后**逐像素一致**；名称列表头文字（视口 x 154 起）被完全裁剪，分界右侧 0 文字像素。场景二：default + fixedLeftColumns=2（fixedW=104）scrollLeft=180，状态列表头文字部分跨入固定区（视口 x 92 < 104）：固定区仍逐像素一致，分界右侧文字像素 120→280（裁剪边界精确，应可见部分正常绘制）。自检面板 R1 断言（`固定列表头：横向滚动后滚动列表头文字/分隔线不绘入固定表头区`）通过（evidence/r1-fixed-header.json） | PASS |
| R2 check 表头 checkbox 居中 | 浏览器 + 像素断言 | default 场景 col 0（check，宽 48）：✓ 方框像素包围盒 `[16,32)×[10,26)`（16×16），中心 (24,18) == 表头格几何中心 (24,18)，**dx=0, dy=0**（±0.5px 内）；自检面板 R2 断言通过（evidence/r2-header-check.json） | PASS |
| R3 hover 内边框四周等距 | 浏览器 + 像素断言 | default 场景 row2/col3（状态列，非首行非末列）：hover 描边差分包围盒 `[268,359)×[113,140)`，四边距最近格线内缘空白 **left 4 / top 4 / right 4 / bottom 4（差 0px）**；点击开编辑浮层 DOM 盒 (268,113,91,27) 与描边**逐边相等**，Esc 正常关闭；自检面板 `editorRectOf` 四边等距断言通过（evidence/r3-hover-editor.json） | PASS |
| R4a/R4b 文字居中/多行首行 | 浏览器 + 像素断言 | multiline 场景 row 1（h=52）：四列（单行省略 / wrap 单行 / 数组单元素 / lineClamp 单行）文字墨迹均 `[251,263)`、centerY=257 **全等（差 0px ≤1px）**；R4a 单行列墨迹中心 257 vs 格几何中心 258，偏移 -1px，为字体 middle 基线与墨迹固有差（±2px 容差内），非格线 1px 系统性偏移；自检面板 R4a/R4b 断言通过（evidence/r4-multiline.json） | PASS |
| R5 空白区 hover/选中 | 浏览器交互 + 像素/事件断言 | narrow 场景（Σ=576 < 画布 956）：空白区 (700,54) hover 前 [255,255,255] → hover 后 **[242,242,243] 与列区内 (300,54) 同色**（行高亮满宽）；点击空白区仅发 `update:selected-record-key=1` → `update:selected-record #1`，**无 cell-click**，选中底色 [225,236,243] 满宽覆盖；回归：点击列区内普通格 cell-click 正常发出（record #1, column name）；自检面板 R5 beyondCols 六态断言通过（evidence/r5-blank-area.json） | PASS |
| R6 eslint 清零 | 命令 | `npx eslint src/components/canvas-table/ demo/src/data/canvas-table/` 退出 0，0 error 0 warning | PASS |

console 检查：全程仅 1 个既有错误 `ERR_INVALID_URL @ data:image/png;base64,AAAA1:0`（demo 夹具非法 img src，实施记录已注明任务前存在，与改动无关），验证期间未新增错误。

## 范围核对

基线 `mussel-table @ b5c43ea`。`git status --short` / `git diff --stat` 结果：

- 基线排除项（第一步产物，不计）：`demo/src/catalog.js` (M)、`demo/src/data/canvas-table-editable/` (D)。
- 设计改动清单内（允许范围 `src/components/canvas-table/**`、`demo/src/data/canvas-table/**`，共 16 文件）：painter.js、cell-painters.js、editor.js、interactions.js、canvas-table.vue、row-geometry.js、use-column-resize.js；demo 侧 main-view.vue + self-checks 8 文件。与 04-impl.md 改动文件表逐项一致，无范围外源码改动。
- 未跟踪：`.pipeline/20261027-canvas-table-fixes/`（任务目录，decisions 已记录保持未跟踪）；`agent-docs/handoff/.!42003!handoff-create-dynamic-component-20261017.md`（基线杂散文件，未动）。
- 验证产物（单列）：`dist/`（npm run build 产物，已 gitignored）；`.playwright-mcp/`（playwright 会话目录，未出现在 git status，已按规范补 .gitignore）；`evidence/` 下 6 个 JSON（本报告证据）。
- 无法区分：无。设计外改动（未记录/已记录-未覆盖）：无。

## 测试质量问题

无。新增 5 条 self-checks 断言（painter +3 / interactions +1 / editor +1）均断言具体验收口径而非"不抛错"：

- R1 断言：scrollLeft=180 时固定表头区 `darkBoundsOf` 为 null + 滚动列表头文字存在（双向）。
- R2 断言：✓ 方框像素盒中心 == 表头格几何中心 ±0.5px。
- R4a/R4b 断言：单行锚 ≈ 格中心 ±2px、数组路径与省略路径 centerY ±1px。
- R5 断言：beyondCols 放行/列区/表头/行越界/右缘边界/scrollLeft 六态。
- R3 断言：editorRectOf 四边等距期望值 `[64,77,131,27]`（含 gridlines none 分支）。

既有断言像素口径同步修正（editor 期望值、cell-painters 多行 y 期望）属设计文档预留的夹具修正，已在 04-impl.md 偏离 1 记录。

## 需人工检查

无。设计的测试计划手段（命令/浏览器像素/浏览器交互）全部自动化完成，无标注"人工"的标准。

## 环境阻塞

无。3000 端口静态服务全程外部运行，未启停、未占用；demo watch 进程僵死为已知外部状态（04-impl.md 偏离 4 / 遗留），其产物经符号抽查与源码一致，不影响验证。

## 失败项（FAIL 时）

无。

## 备注（不计失败）

1. 断言基线数：00-task.md 记基线 144 条，实测页面运行 142 条（module 138 + data 4）。04-impl.md 偏离 3 已说明，本轮经 git diff 逐文件核对：self-checks 各文件 checks 数只增不减、无删除断言，142 + 5 = 147 与面板一致。
2. R4a 实施裁量（单行路径未按可视区中心 +0.5px 调整）已在偏离 2 记录理由；e2e 实测 -1px 与字体墨迹固有差一致，判 PASS。
3. 验证过程中页面曾残留实施者会话的场景状态（narrow/3 行/舞台 2414），已 `location.reload()` 复位后重测；验证结束时已将 fixedLeftColumns 复位 0、场景复位默认、scrollLeft 复位 0。
