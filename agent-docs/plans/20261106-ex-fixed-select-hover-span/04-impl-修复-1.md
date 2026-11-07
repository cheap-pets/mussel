# 实施记录（修复轮 1：人工修订 1 / 验收 4 — hover 编辑描边固定列裁剪）

按 02-design.md「未解问题 1」初步方案（描边函数内加同源 clip）+ 人工意见落地。前置输入：00-task.md 追加验收 4、decisions.md（人工修订 1 裁定）、04-impl.md（首轮整体实施）、05-verify-1.md（PASS，遗留 4 项需人工）。

## 改动文件

| 文件 | 对应问题 | 改动 |
|---|---|---|
| `src/components/table/ex/table-paint/paint-overlay.js` | 人工修订 1（验收 4） | ① `paintHoverEditorStroke`（蓝描边）strokeRect 外包 `withClip`：`clipX0 = hover.col < layout.fixedCount ? 0 : layout.fixedWidth`，clip `[clipX0, headHeight, stickyWidth - clipX0, stickyHeight - headHeight]`（paint-overlay.js:128-141）② `paintHoverPlainStroke`（灰描边）逐字同源 clip（paint-overlay.js:171-181）。口径与 `paintCellSelection`（缺陷 1 修复，:223-230）完全一致 |
| `demo/src/data/table-ex/self-checks/painter.js` | 人工修订 1（验收 4） | 新增 2 个独立检查项：断言 G「部分滚入：蓝描边固定列区无主色像素 + 可见段保留（未过度裁剪）；灰描边同画布差分被裁」（painter.js:1517-1559）、断言 H「完全可见滚动区格 + 固定列格描边照常（回归保护）」（painter.js:1560-1580） |

行为边界（约束核对）：
- hoverMode='none' 抑制不变：clip 位于两描边函数内部，仅 `paintHoverOverlay`（mode ≠ 'none' 时）调用，抑制路径零触及。
- 灰/蓝分支互补谓词不变：仅 strokeRect 外包 clip，判定逻辑未动。
- 完全滚入固定列不可命中（colAt 固定列优先）：本修复仅影响"hover 状态已建立后描边绘制"，命中链路未改。
- 内容文本与选中描边裁剪现状不变：未触碰 paint-body / paintCellSelection。

## 偏离

- 无设计偏离。修复 = 02-design「未解问题 1」原文方案（"描边函数内加同源 clip（约 4 行）"），蓝/灰两函数各一段。
- 说明（非偏离，断言 G 灰描边差分实现调整）：最初灰描边用双画布逐像素一致断言（assertRegionSame），真浏览器实测两块独立 canvas 的文字抗锯齿栅格化存在 ±1 逐次抖动（id 列 rec_no 文字灰阶边缘像素 (26-30, 50-52) 通道差 1）导致假红；改为**同画布两次绘制差分 + 每通道容差 1**——hover 半径叠层相同（同行 hover 带），差异仅可能来自部分滚入灰描边，灰描边不透明 borderColorSoft 覆盖差值 ≥4/通道，不被容差吞掉。

## 自检

### 浏览器像素级（playwright mcp，本环境可用，取代 verify-1 的降级）

demo 自检面板 `http://localhost:3000/data/table-ex/`（onMounted 自动跑，真实在位 canvas）：

1. **红（修复前）**：229/230，唯一失败 = 断言 G「部分滚入蓝描边：固定列表体区 [0,58) 应无主色描边像素」——人工意见缺陷在真浏览器像素级复现（主色描边压固定列区）。断言 H 修复前即绿（回归项）。
2. **绿（修复后）**：230/230 全绿（断言 G/H 通过；断言 A-F 及既有全部断言无回归）。max-len 重构（`editableHover` 提取）后复跑仍 230/230。

### demo 真实场景（fixed 场景 = 人工意见复现场景，真实鼠标 pointermove）

- 固定列格分支：真实鼠标 hover 固定链接列（col 1 < fixedCount）行 0 → 描边顶/底缘横跨 [69,229] 全宽照常绘制（clip x0=0 分支，与断言 H 同口径）。
- 部分滚入场景：**环境受限未完成交互层自动化**——`.mu-table-ex__scroll` 置 scrollLeft=84（DOM 已滚）后画布仍按 scrollLeft=0 绘制（stroke 跨 [230,548]、名称文字起点 ≈242 均为未滚动几何）。取证：页面 rAF 停摆（`Promise.race(rAF vs 2s setTimeout)` → rAF 不触发），滚动→重绘经 `createFrameScheduler` rAF 调度（schedulers.js:48-52）无法泵帧；真实拖拽横向滚动条、`mouse.wheel`（后端挂起）均无法触发重绘。真实浏览器无此问题（人工意见即来自真实滚动场景）。该场景绘制层验证由断言 G 承担（painter.draw 走完整分区 1-5 绘制管线 + scrollLeft=180 夹具，固定列区覆盖顺序真实）。

### 命令

- `npx eslint src/components/table/ex/table-paint/paint-overlay.js demo/src/data/table-ex/self-checks/painter.js`：本轮新增代码 0 错误 0 警告；余 2 处 `spaced-comment`（painter.js:1256/1266）为基线 HEAD 既有（05-verify-1 已记录同两处，行号未再偏移——本轮追加在文件末尾），非本轮 diff 触及，按范围克制不处理。
- `npm run build`：通过（330 modules；mussel.ex.js 731.27 kB / min 332.60 kB / css 双产物）。

### 范围核对

`git diff`：本轮仅 paint-overlay.js（两描边函数 clip 块）+ self-checks/painter.js（末尾 2 检查项）。工作区另存的 use-pointer.js（首轮 04-impl 步骤 4 产物）与 agent-docs/knowledge/*（首轮知识沉淀，验证报告后出现）非本轮改动，未触碰。

## 遗留

1. 交互层"滚动后 hover 半遮格"建议随终验在真实浏览器目测 1 分钟（拖横向滚动条 → hover 部分滚入格 → 描边仅可见段、内容与选中描边现状不变）；本环境 rAF 停摆无法自动化，绘制层已由断言 G 全覆盖。
2. 真实鼠标 hover 链路（pointermove → hitAt → hover → 描边跟随）已在本环境验证可用（描边随鼠标位置正确绘制，固定列格分支通过）；仅"滚动重绘"一步环境受阻。
3. 自检面板 230/230 与 fixed 场景可直接访问复核（watch 构建已含修复，无需重新打包）。
