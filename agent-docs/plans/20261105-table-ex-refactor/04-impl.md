# 实施记录

按 02-design.md（06-amend-1.md 修订后）四片 + 集成实施；commit `9d61316`（dev，未推送）。

## 改动文件

### 片 1：独立纯逻辑模块（步骤 1-4）
- `src/components/table/ex/fenwick.js`（新）— 步骤 2：row-geometry.js 158-214 整体迁入，`createFenwick` 加 export
- `src/components/table/ex/schedulers.js`（新）— 步骤 2：interactions.js 437-508（createClickGuard/createFrameScheduler 含 JSDoc）迁入
- `src/components/table/ex/editor-resolve.js`（新）— 步骤 3：editor.js 37-47 + 101-255 迁入
- `src/components/table/ex/editor.js`（改写）— 步骤 3：几何三函数/定位/blur 兜底/控制器保留，重导出 editor-resolve 全部 9 导出
- `src/components/table/ex/spans-method.js`（新）— 步骤 4：spans.js 61-355 迁入，导出 createIndex/applySpanMethod/registerRegion/isOccupied
- `src/components/table/ex/spans-auto.js`（新）— 步骤 4：spans.js 27-44 + 357-525 迁入，导出 applyAutoRowSpan
- `src/components/table/ex/spans.js`（改写）— 步骤 4：buildSpans 编排 + 查询函数保留，import 两个新模块
- `src/components/table/ex/interactions.js`（改写）— 步骤 2：决策函数保留，`export { createClickGuard, createFrameScheduler } from './schedulers'`
- `src/components/table/ex/row-geometry.js`（改写）— 步骤 2：Fenwick 段移除，`import { createFenwick } from './fenwick'`

### 片 2：cell-painters 簇（步骤 1-2）
- `src/components/table/ex/constants.js`（改）— 步骤 1：增 TAG_HEIGHT/TAG_PADDING_X/TAG_RADIUS/BUTTON_ICON_SIZE（注释随迁，注明镜像 tag.scss/图标档）
- `src/components/table/ex/cell-text.js`（新）— 步骤 2：67-68、524-665、957-966、1010-1013（7 导出）
- `src/components/table/ex/icon-image.js`（新）— 步骤 2：64-65、79-173
- `src/components/table/ex/cell-content.js`（新）— 步骤 2：24-41、73-77、175-305、397-405
- `src/components/table/ex/item-painters.js`（新）— 步骤 2：54（TAG_FONT_SIZE）、711-956、968-1008、1015-1097、1493-1522（10 导出）
- `src/components/table/ex/link-items.js`（新）— 步骤 2：1099-1201
- `src/components/table/ex/canvas-kind-painters.js`（新）— 步骤 2：60-62、70-71、1203-1491（drawProgress/drawButton/buttonHeightOf/EMPTY_BUTTON）
- `src/components/table/ex/cell-tooltip.js`（新）— 步骤 2：1524-1756
- `src/components/table/ex/cell-painters.js`（改写为入口）— 步骤 2：drawCell/drawCanvasKindContent/drawContentItems/drawDisplayText/drawTreeArrow/drawTreeAffordance 保留 + 4 行重导出

### 片 3：painter 簇（步骤 1-2）
- `src/components/table/ex/paint-utils.js`（新）— 步骤 1：77、118-213、239-241（13 导出，isSelectedRow 私有）
- `src/components/table/ex/paint-gridlines.js`（新）— 步骤 1：492-634
- `src/components/table/ex/paint-body.js`（新）— 步骤 1：79-82（spanKeepRows → begin/endSpanFrame 封装）、215-237、243-490、636-659
- `src/components/table/ex/paint-header.js`（新）— 步骤 1：72-75、84-116、661-889
- `src/components/table/ex/paint-overlay.js`（新）— 步骤 1：891-1054
- `src/components/table/ex/painter.js`（改写为入口）— 步骤 2：调度入口（1056-1449）+ paint() 接入 begin/endSpanFrame + 重导出 cellRectAt

### 片 4：table-ex.vue 组合式（步骤 1-3，按接口节组装顺序 0-12）
- `src/components/table/ex/edit-button.js`（新）— 步骤 1：isEditButtonHit 提参 `{ layout, spans, snapshot }`，逻辑逐字保留
- `src/components/table/ex/use-cell-tooltip.js`（新）— 步骤 2：197-209 状态 + 624-779 + delayHideCellTooltip（自 961-965 抽取）
- `src/components/table/ex/use-paint-state.js`（新）— 步骤 2：359-394、413-469
- `src/components/table/ex/use-pointer.js`（新）— 步骤 2：784-1028（isEditButtonHit 改调 edit-button.js）
- `src/components/table/ex/use-cell-click.js`（新）— 步骤 2：1030-1351 + veil watch（1500-1520）
- `src/components/table/ex/use-relayout.js`（新）— 步骤 2：317-319（yScrolled 族）、473-607、1522-1576 三 watch
- `src/components/table/ex/use-table-instances.js`（新）— 步骤 2：1406-1441、1601-1632
- `src/components/table/ex/use-table-api.js`（新）— 步骤 2：1353-1370、1374-1496 中 4 方法、1578-1599 selectedKey watch
- `src/components/table/ex/table-ex.vue`（改写）— 步骤 3：模板/props/emits 保留 + host 袋 + 0-12 组装；shell 实测 451 行，兜底阶梯 4a/4b 未触发（use-view-computed.js 未创建）

## 偏离

1. **片 2 行段重叠（同 peer 修过的 1010-1013 类）**：设计 item-painters 行"711-1008"与 cell-text 行"957-966"重叠（linkUnderlineY/cellLineHeightOf）。两文件重复定义会 build 报 duplicate declaration（证据：cell-painters.js 原文同段），按 cell-text 行明示归 cell-text，item-painters 经 import 消费；依赖方向 cell-text ← item-painters 与设计一致。
2. **设计"最小导出面"补 4 个跨文件消费必需导出**：icon-image.js `requestImage`（item-painters measureItem/drawCellImage 消费）、paint-gridlines.js `isGridlineMode`（paint-body rightInsetOf 消费）、paint-utils.js `FALLBACK_DPR`（painter.js paint() 消费，常量按设计归 paint-utils）、item-painters.js `linkTextColorOf`（link-items.js 消费）。均为设计依赖图已含的边，不导出即 import 报不存在。
3. **注释归属微调（仅注释，无代码）**：cell-painters.js 入口未保留 47-51（tag pill 注释随 TAG_* 常量迁 constants.js，入口 43-45 保留并补指 constants）；painter.js 入口未保留 69-75（表头 ✓ 互指注释与排序图标注释随 drawHeaderCheck/SORT_* 迁 paint-header.js）；spanKeepRows 注释（painter.js 79-82）迁 paint-body.js 并补 begin/endSpanFrame 封装说明。
4. **片 4 步骤 5 解构收窄**：设计"保留现有解构 { resizeGuideX, clickGuard, widthOverrides, startResize, resetOverrides }"与 treeApi 解构中 treeExpanded/applyTreeToggle —— 消费方均已迁入 composables（经 host 读取），shell 保留解构触发 eslint no-unused-vars（证据：首轮 eslint 12 errors）；改为不解构（Object.assign 并入 host），功能等价。
5. **spans.js 头部补 1 行拆分说明注释**（spans-method/spans-auto 去向），其余模块头注释按设计原样保留。

## 自检

- **冻结基线（片 1 步骤 1，改前采集）**：headless Edge dump-dom，`.ct-self-checks` md5 `3e2d61c7b4cb7b52966b98bcac4c9403`、归一化 MUSSEL 序列 6 条、自检 223/223、fail=0、canvas 956×416；写入任务目录 baseline.txt（交付前已删除）。
- **每片**：`npx eslint <本片文件>`（片 1 后全目录 0 error）；`npm run build` 退出码 0（dev+prod 四段）；新鲜度门（`find src/components/table/ex -newer demo/dist/assets/catalog.js` 为空）后跑 2b——四片 md5、MUSSEL 序列、223/223、fail=0、canvas 尺寸均与基线逐字一致。
- **lint 基线**：全目录 0 error / 6 warning（与改前基线持平，同为原 cell-painters.js 的 complexity×4 + max-len×2，拆分后分布于 item-painters/canvas-kind-painters/cell-tooltip）。
- **2c CDP 交互冒烟（集成，附录 A 脚本）**：`{"pass":true,"ok":true,"summary":"自检结果（223/223 通过）","fails":0,"canvas":[956,416],"editor":true,"logDelta":2,"viewChanged":true,"scrollTop":120,"errors":[]}`，退出码 0；与设计改前实测基线（editor=true、日志增量>0、viewChanged=true、errors=[]）一致。
- **目录外零改动**：`git status --short` 仅 `src/components/table/ex/` 内路径 + 任务目录；`git diff --stat -- src/components/table/ex` 8 改文件 259+/4652-。
- **行数（验收标准 1）**：全目录 `wc -l` 最大 478（row-geometry-controller.js，未改动）；本次改动文件最大 table-ex.vue 451；33 个源文件全部 ≤500。
- **临时文件不参与运行**：删 baseline.txt 与 smoke-interaction.mjs、确认 demo/dist 无临时资产后复跑 2b——md5/序列/fail=0 仍与基线一致。
- **提交**：`git add src/components/table/ex && git commit` → `9d61316 🔨: 拆分 table-ex 大文件为按功能关注点的小模块`（33 files，仅 src；任务目录不入库；未推送）。

## 遗留

- TDD 不适用：纯重构、项目无测试框架；安全网 = 冻结基线逐字比对 + demo 自检 223/223 + CDP 交互冒烟（设计测试计划口径）。
- commit 未推送（派发仅要求提交一次；后续修复轮如 FAIL 用 `git commit --amend` 并入）。
- 后续「单元格选中/复制/键盘导航」功能的归属预留未做任何实现（设计约束：本任务不实现）。
