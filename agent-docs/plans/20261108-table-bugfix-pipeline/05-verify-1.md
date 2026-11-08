# 验证报告（第 1 轮 · 整体实施验证）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

不适用（首轮验证）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | exit 0 | 4 次 vite build 全成功（dev/prod 主构建 + ex-development/ex-production），`✓ built in ~620ms` ×2 可见；仅 npm 配置 warning（`Unknown env config "home"`），无构建错误。日志：`evidence/build.log` |
| `git grep rawWasArray`（src/ demo/src/） | 0 命中 | 无输出（3.2 判据 ✓） |
| `git status --short` | — | 20 M + 10 ??，与基线+声明清单一致（见范围核对） |
| `git log --oneline -2` | — | 33a5613（skills/docs 任务外提交，13:33:07）、0ef008b（table 注释优化，基线）；无任务文件被提交 |
| 浏览器 console（4 个 demo 页） | 无任务相关错误 | 仅 `Failed to load resource: net::ERR_INVALID_URL @ data:image/png;base64,AAAA1:0`（demo 夹具故意坏图，修复前后一致） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. 7 项逐项结论（6 修复 + 1 非缺陷不改） | 人工 | 02-design.md「逐项结论」逐条有 path:line；04-impl.md 终审裁决（4 major/5 minor 全采纳）与评审对应；独立复核：`bool.js` 不在 git status M 列表（未改 ✓），其余 6 项修复 diff 与设计/裁决一致 | PASS |
| 2. 修复正确 + 注释同步 | 人工（diff 评审） | 逐文件 diff 过目：`base/table.vue:182-199`（固定块重写+注释）、`:286-292`（offset 公式+注释）、`paint-body.js` 头注/`trimItemHits` 注释/`endSpanFrame` 豁免集注释、`painter.js:10-12` 头注豁免口径、`click-resolve.js:184-189` JSDoc 例外、`layout.js:294-299` spacerWidthOf JSDoc、`use-column-resize.js:55-56`、`spans-method.js:262-271`（m2 文案逐字一致）、demo note 同步——注释与行为一致 | PASS |
| 3. `npm run build` | 命令 | exit 0（上表） | PASS |
| 4. demo 页面行为无回归 | 浏览器 | 4a/4b/4c/4d 逐项见下 | PASS |
| 5. 不扩大范围 | 命令 | 见范围核对：新增 M 恰为 04-impl.md 声明 10 文件 | PASS |

### 4a. 固定列 N 列边界 + 列指示深滚动（重点，/data/table-advanced/?t=verify20261108c）

- 类断言：th0 ID=`fixed-col`、th1 名称=`fixed-col last-fixed-col`、th2 邮箱/th3 地区无 `fixed-col` —— 恰好 2 列固定 ✓
- 位置断言（滚至 max scrollLeft=282.67）：th0/th1 `getBoundingClientRect().left` delta=0（钉住），th2/th3 delta=−282.66（随内容滚动）✓（修复前 idx===N 的邮箱列会 delta=0，判据有判别力）
- 列指示（M3 修正口径，mouseenter + ≥400ms 等待节流）：
  - 深滚部分遮挡列（地区，offsetLeft=440、宽 120，遮挡 62.67px）：`--hover-col-left=502.67 = 固定区右缘 220 + scrollLeft 282.67` ✓、`--hover-col-width=57.33 = 120 − 62.67` ✓（旧公式恒 scrollLeft 会得 left 722.67/width 负值 → 判据有判别力）
  - 固定列 hover：left=283=0+scrollLeft、width=80 ✓；滚回顶部无遮挡列：left=440（布局位）、width=120（offset 0）✓
- m4 已知限制实测复现：滚动后 sticky th offsetLeft 283/363（含 scrollLeft）、普通 td offsetLeft 440 恒定 —— 与 04-impl.md 记录一致（记录性，不判缺陷）

### 4b. spans 锚行命中保留（重点，M1 全帧类型）/data/table-ex/?t=verify20261108a

- 面板「自检结果（243/243 通过）」，其中新增断言「spans 锚行滚出窗口：区域内 link 条目命中保留（整幅 + header 帧 + 区域外行带帧均不丢，20261108 问题 3）」✓，明细「锚行 0 条目 10 条在整幅/header/行带帧后均保留；窗口 [8,16)」
- 断言内容（demo/src/data/table-ex/self-checks/painter.js:1681-1760 diff）：整幅 draw 后 `itemHits.get(0).get(1).length===10`；`drawRegion({header:true})` 后仍 10（修复前 header 帧 keepRows 恒空即删，M1 点名入口）；`invalidate({rows:[15,16]})` 区域外行带帧后仍 10；无 spans 对照窗口外删除不变、窗口内行照常收集
- 实现与 M1 建议一致：`endSpanFrame(itemHits, viewRows, spans)` 以 `regionsForRows(spans, start, end)` 锚行集为豁免集（src/components/table/ex/table-paint/paint-body.js:16-30），与帧内容解耦 → 数学上对任意帧类型（hover/选中/单格 veil）成立
- `?scene=spans&t=verify20261108b` 面板同样 243/243 ✓

### 4c. 杂项回归（/data/table-ex/?t=verify20261108e、?scene=spans&t=verify20261108f）

- 自检面板 243/243 全绿（含问题 7 断言：警告 1 条、文案「spanMethod 返回值须为 { 列键: 跨度 } 对象，收到数组，返回值忽略（同类不再重复提示）」逐字符合 m2；`buildSpans` 数组形态返回 null；对象路径不回归）
- 拖拽调宽（问题 4）：真实手柄识别（x=46 cursor=`col-resize`）；合成 pointerdown(46,15)→window pointermove(246)→pointerup：拖拽中 spacer 即 1944→2142px（`applyOverrideGeometry` 的 `spacerWidthOf` 路径），up 后 spacer 2142px、`colWidths[0] 48→246` —— spacer 撑宽/横向滚动范围随内容增长 ✓
- spans 场景名称列编辑（问题 5）：click (210, 54) → 编辑浮层出现（INPUT，值=原值「数码-电脑-item-1」）→ 改值 + 点击他格 → `__ctStage().records[0].name` 变「数码-电脑-item-1-已改」（提交 ✓；编辑器未关系点击目标为另一可编辑格，属「提交+选中新行」既有语义）；重开编辑器值=已改 ✓；Esc keydown → 编辑器关闭、record 值保持 ✓

### 4d. 经典 table 回归 /data/table/?t=verify20261108d

- 15 个 mu-table 渲染 ✓；cross hover 表列指示 offset=0（left=0px、width=56px 与首列 td offsetLeft 0/宽 56 一致）✓；bool 列显示「是/否」（10 格）✓

## 范围核对

- **声明内 10 文件**全部呈 M 状态，与 04-impl.md「改动文件」一一对应；`bool.js`/`table.scss`/`onResize`/docs-site 未触碰（不在 M 列表）✓
- **基线排除项（任务外既有 M，未触碰）**：agent-docs/knowledge/ ×4、demo self-checks 其余 4 文件（cell-painters/index/interactions/spans）、src/styles/background.scss、todo/misc.md
- **基线漂移（非任务实施行为）**：run.log 基线中 skills/mussel-ui ×7 M + upgrade-* ×5 D 经流水线期间外部提交 33a5613（13:33:07，仅 skills/docs 文件，无任何任务文件）离场——非本任务 commit/push 行为（验证员未执行任何 git 写操作）
- **无法区分**：demo/src/data/table-ex/self-checks/painter.js（基线 M + 本任务声明改动）。diff 中顶部 import 调整（`cellRectAt` 改自 `paint-utils.js` 导入）为他人基线改动所必需——HEAD 上 `painter.js` 已不导出 cellRectAt（`git show HEAD:...painter.js` 仅 export draw/drawRegion/createPainter），属基线既有修复；本任务增量为 checks 末尾 2 条断言（与 impl 声明一致）
- **验证产物**：agent-docs/plans/20261108-table-bugfix-pipeline/evidence/build.log；.playwright-mcp/（已按规范内置 .gitignore，不入 status）
- **设计外改动**：无。?? 现 10 项 = 本任务 plan 目录自身 + 9 任务外（含基线后出现的 20261108-mussel-ui-skill-opt/、scripts/，均不含 src/demo 任务范围文件；00-task 基线口径「未跟踪目录若干」未逐项枚举，无法逐一溯源，但不涉任务范围）

## 测试质量问题

- 新增 2 条自检断言均为行为断言（值/组相等、警告条数、文案内容、对照路径），非「不抛错」式 ✓，且对旧代码有判别力（旧 trim 条件对 row<start 无条件删除 → 断言必红；数组走索引串警告 2 条 → 条数断言必红）
- 修复前 red 状态未独立复现（契约禁止 checkout 回退）：以旧条件逻辑必然性推导 + 04-impl.md red 记录（241/243，恰 2 条新增断言红）佐证，UNVERIFIED 不成立（判据逻辑闭环）
- 问题 3 断言覆盖整幅/header/行带三帧；hover/单格帧未单独断言，但豁免集仅依赖（窗口, spans）与帧内容解耦（M1 采纳后实现），任意帧数学等价，风险有限

## 需人工检查

- AC1/AC2 设计手段即「人工」。验证员已完成独立 diff 评审与行为复核（证据见验收标准核对表）；如需二次人工复核：`git diff` 逐文件对照 04-impl.md「改动文件」表与 03-review-1.md 裁决项
- 问题 1 边界矩阵「fixed ≥ 列数 → 全列 sticky + 末列兜底 last-fixed-col」：demo 无该配置，DOM 未覆盖；代码评审佐证 src/components/table/base/table.vue:186-199（`idx === props.columns.length - 1` 兜底）。如需行为级确认需临时夹具
- 视觉类（列指示条视觉对齐、固定区分界线）仅 DOM 变量断言，未截图比对：如需视觉确认，按验收入口 3 肉眼复核

## 验收入口（PASS 时必填）

1. AC3 — 在项目根执行 `npm run build`，退出码 0
2. AC4b/4c（自检链路）— 浏览器打开 `http://localhost:3000/data/table-ex/?t=v1`（demo 服务已在 :3000 运行），等待调试面板「自检结果（243/243 通过）」；列表末两条 painter 断言（20261108 问题 3/7）应为 ✓；「重跑自检」按钮可重跑
3. AC4a（问题 1/2）— 打开 `http://localhost:3000/data/table-advanced/?t=v1`，滚至「固定列」分区：横向拖动滚动条，肉眼确认仅 ID/名称两列钉住、邮箱列滚入固定区下方；hover 第 4 列（地区）表体格，列指示条不被固定列遮挡（或控制台执行 04-impl.md「自检」1.2/1.3 段脚本读 `--hover-col-left/width`）
4. AC4d — 打开 `http://localhost:3000/data/table/?t=v1`：15 表渲染、布尔列显示是/否
5. AC5 — `git status --short` 对照 04-impl.md「改动文件」表（M 新增恰为 10 声明文件）

## 环境阻塞

1. Playwright 真实鼠标按压（down/up）在本环境被抑制：document capture 级监听 pointerdown/mousedown/pointerup/mouseup 全部零事件（move 正常、buttons 状态正常）。影响「真实鼠标」执行拖拽/点击 e2e。已改用合成 PointerEvent/MouseEvent 驱动同一 handler 链（`onPointerDown`→`startResize`→window move/up；`onClick` 编辑链；`mouseenter` hover 链）完成等价验证——验证对象为同一生产代码路径，判据未降级，不影响结论
2. 无其他阻塞：demo 服务为既有运行实例（非本验证启动，无 PID 管理义务），build/自检/浏览器手段均实际执行成功

## 失败项（FAIL 时）

无。
