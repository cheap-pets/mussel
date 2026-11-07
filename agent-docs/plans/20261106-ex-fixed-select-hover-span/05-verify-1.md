VERDICT: PASS

终验（整体实施，核对全部验收标准）。环境：HEAD a4460ce（= 00-task 基线），demo 服务 http://localhost:3000/data/table-ex/（常驻 watch 构建，非本验证启动，HTTP 200 已确认加载含修复产物）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | PASS（exit 0） | 两次 vite build 均 `✓ 330 modules transformed`，产出 dist/mussel.ex.js 730.84 kB / mussel.ex.min.js 332.37 kB / 两个 css |
| `npx eslint src/.../paint-overlay.js src/.../use-pointer.js` | PASS（0 问题） | 无输出 |
| `npx eslint demo/src/data/table-ex/self-checks/painter.js` | PASS（0 新增问题） | 2 处 `spaced-comment`（1256/1266）——基线 HEAD 1242/1252 已存在（`git show HEAD | grep -nF -e '//（'` 逐字同文，行号 +14 = 本轮新增 import 1 行 + 夹具 13 行的偏移），本轮 diff 未触及；不在 00-task 验证命令清单内，按范围克制不处理 |
| HTTP `GET /data/table-ex/` | PASS | 200；`/assets/catalog.js` 含 `clipX0 = selected.col < layout.fixedCount ? 0 : layout.fixedWidth`、`colBandRegionsOf` 共 6 处命中——watch 产物已含本轮修复 |

证据文件：`evidence/verify-1-build-eslint-scope.log`

## 验收标准核对

环境前置：playwright mcp 在本 agent 工具集不可用 → 按 00-task「验证命令与环境」与 02-design「canvas 像素验证分级」预案降级：构建验证 + 代码走查 + 自检面板代码逻辑核对；canvas 像素级判定标「需人工」。

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1 固定列覆盖 | 浏览器（降级：构建+走查+自检逻辑核对） | 代码走查：`paintCellSelection` strokeRect 已外包 `withClip`，`clipX0 = selected.col < layout.fixedCount ? 0 : layout.fixedWidth`，clip `[clipX0, headHeight, stickyWidth-clipX0, stickyHeight-headHeight]`（paint-overlay.js:202-210），与设计伪代码逐字一致。几何独立核算：自检夹具 fixedWidth=60，scrollLeft=250 时 col 2 视口 x∈[-50,50) 全落固定覆盖区、clip x0=60 裁净 → 断言 A 前半 null 成立；scrollLeft=180 时 x∈[20,120)，x<60 段被裁、[60,120) 段保留 → 断言 A 后半非 null 成立（painter.js:1424-1440）。固定列格分支 col 0 < fixedCount=1 → x0=0 不裁固定区（断言 B，painter.js:1447-1458）。自检面板断言 A/B 在位且为真像素断言（`colorBoundsOf` null/非 null，非"不抛错"）。构建通过；服务产物含修复 | 需人工（像素级判定：打开 demo 自检面板看 A/B 绿 + fixed 场景目测，见「需人工检查」1/3） |
| 2 合并 hover | 浏览器（降级：构建+走查+自检逻辑核对） | 代码走查：`paintHoverHighlight` 统一 `cellRect = rowValid && colValid ? spanRectOf(...) : null`（paint-overlay.js:89-91），`paintHoverRow`/`paintHoverCol` y/height、x/width 取 cellRect、null 回退原式（60-80）；脏区侧 `colBandRegionsOf` = `regionAt` 的 `[colFrom, colTo)`、无区域回退 `[col, col+1)`、col<0 跳过、区间去重（use-pointer.js:95-116），`hoverRegions` 增 spans 参、唯一调用点传 `ctx.spans.value`（122-140、154），与设计伪代码逐字一致。期望色口径核算自洽：rowspan 区域内部底色 = 锚行背景（paint-body.js:191-193 `rowBackground(state, region.row)`）→ 断言 F 的 (250,90) 期望 blend(hoverBg, bgNormal) 与断言 D 的 (300,90)（区域外，各行自身斑马）期望 blend(hoverBg, bgStripe) 不矛盾。夹具核算：colLefts [0,60,200,300,420,470] → colspan 区域 [300,470) 宽 170、采样 x=350/425 在带内、x=560 在带外（painter.js:1483-1499）。断言 D/E/F 在位（1464-1517），`makeState` 经 `...rest` 透传 spans/hoverMode（117-157）；`buildSpans({records, columns, spanMethod, fixedCount})` 签名核对一致（spans.js:64-73） | 需人工（像素级 + 残影动态行为：自检面板 D/E/F + spans 场景三模式目测，见「需人工检查」2/3） |
| 3 回归 | 命令 + 自检 + 浏览器 | 命令部分已验：`npm run build` 通过（exit 0）；eslint 无新增问题。代码走查：无 spans 回退路径 = `spanRectOf` 普通格分支与原 paintHoverRow/paintHoverCol 几何同源（spans.js:211-216：viewportXOf/viewportYOf + colWidths/heightAt）；既有无 spans 物理带断言仍在位未改动（painter.js:526-531 行 hover blend、535-538 列 hover blend）；`paintCellSelection` 无 selectedCell 早退路径保留（paint-overlay.js:169-171）；`fixedCount=0` → x0=0，clip = 表体区全宽（与 paintHoverOverlay:256 同口径） | 部分已验（命令 PASS）；自检面板全绿与默认场景目测 → 需人工（见「需人工检查」3/4） |

## 范围核对

基线 HEAD a4460ce = 当前 HEAD；00-task 记录建目录时工作区干净（无基线脏文件）。

- `git status --short`：3 个修改文件 + 未跟踪 `agent-docs/plans/20261106-ex-fixed-select-hover-span/`（任务目录产物，按 `.pipeline/` 同类排除）。
- `git diff --stat`：paint-overlay.js +55/-22、use-pointer.js +41、self-checks/painter.js +114 —— 与 02-design「改动清单」三文件逐一对应，diff 逐行核对无清单外改动（paint-overlay 仅 paintHoverRow/Col/Highlight/paintCellSelection 四函数与注释；use-pointer 仅 import/colBandRegionsOf/hoverRegions/updateHover；painter.js 仅 import + 夹具 + 5 个检查项追加）。
- dist/ 构建产物被 .gitignore 忽略，未出现在 status。
- 设计外改动：无。

## 测试质量问题

无。5 个新增检查项均为真像素断言：A/B 用 `colorBoundsOf` 区域主色存在性（null / 非 null 双向，含"未过度裁剪"反向断言），D/E/F 用 `assertPixel` + `blendColor` 精确混色期望（tolerance 0），并各配区域外不变断言；A、B、D、E、F 按设计各自独立检查项（runChecks 单项抛错短路不影响其余，self-checks/index.js:44-63）。断言不依赖"不抛错"。

## 需人工检查

1. 验收 1（像素级）：浏览器打开 http://localhost:3000/data/table-ex/ → 场景切「固定列组合」→ hoverMode 任意 → 点击名称列（col 2）行 0 选中 → 控制台执行 `document.querySelector('.mu-table-ex__canvas')` 所在表格滚动至最右（或拖横向滚动条到底）→ 目测选中描边不压在左侧两条固定列上（注意：勿以固定列整体变色判断——固定链接列为 link 主色文本，属正常）；再目测选中固定列自身格时描边照常显示。原因：canvas 像素绘制，无 playwright mcp 无法自动采样。
2. 验收 2（像素级 + 动态行为）：同页场景切「合并单元格」→ hoverMode=row hover 分类列合并大区 → 目测整行带高亮覆盖区域全部 7 行；hoverMode=column hover 小计行 → 目测小计列区域整宽高亮（延伸到末列）；hoverMode=cell hover 合并格 → 目测区域整体高亮；三模式下 hover 快速纵向/横向移出合并区域 → 目测无残影残带。原因：同上 + 残影为动态行为，自检面板静态断言不覆盖。
3. 自检面板全绿：同页「自检结果」面板（onMounted 自动运行）→ 确认 painter 模块新增 5 项全绿：「固定列选中遮挡…断言 A」「固定列格选中描边照常绘制（断言 B）」「合并 hover…断言 D」「…断言 E」「…断言 F（现状回归）」，且既有断言无红。原因：面板为浏览器在位 canvas 运行，无法在本环境自动执行。
4. 验收 3 目测回归：同页默认场景（无固定列无合并）→ hoverMode=row hover 行带、hoverMode=cell hover 单格、点击选中格描边，目测与修复前行为一致（行带全宽、无异常裁剪）。原因：视觉效果类，无法自动化。

## 验收入口（PASS 时必填）

- 验收 1 — 打开 http://localhost:3000/data/table-ex/ → 场景「固定列组合」→ 点击名称列首格 → 横向滚动条拖到底 → 描边不压左侧两条固定列。
- 验收 2 — 同页场景「合并单元格」→ 分别以 row / column / cell 三种 hoverMode hover 分类合并大区与小计行 → 高亮覆盖整个合并区域、移出无残影。
- 验收 3 — 同页「自检结果」面板全绿（含断言 A/B/D/E/F 五个新增项）；默认场景 hover 行带 / cell 高亮 / 选中描边目测不变。
- 以上均约 3-5 分钟；页面与 watch 构建已就绪（HTTP 200，产物含修复），无需打包。

## 环境阻塞

1. playwright mcp 在本 agent 工具集不可用 → 验收 1/2 的浏览器像素终验手段、验收 3 的自检面板自动执行与目测回归均无法自动完成（已按 00-task 预案降级并标「需人工」4 项）；对 `npm run build`、eslint、HTTP、代码走查无影响。00-task「canvas 像素验证分级」已预先声明此降级路径。

## 失败项

无（除「需人工检查」4 项与上述环境阻塞外，全部判定 PASS）。
