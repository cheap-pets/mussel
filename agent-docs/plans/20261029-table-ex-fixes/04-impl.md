# 实施记录

基线 `mussel-table` @ `1c8f326`。按 02-design.md 实施步骤 1→2→3 串行执行，2026-10-29 完成。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| `src/components/table/ex/cell-painters.js` | 步骤 2（问题 1/3） | 新增 `centeredTextAnchor`（文本光学居中锚，font 缓存 + 实例级度量能力位）；9 处 `fillText` 站点切换 `alphabetic` 基线 + 度量锚；`linkUnderlineY` 改 `anchorY + 2`（fontSize 参数移除）；`drawTreeAffordance` 判定源改 `expandableAt`；移除未用 import `FONT_SIZE_FALLBACK` |
| `src/components/table/ex/tree.js` | 步骤 2（问题 3） | `buildFlatRows` 增可选 `isLeafOf` 参数，产出第五平行数组 `expandable`（仅 `=== false` 触发，hasChildren 语义不变）；新增导出 `expandableAt(flatInfo, row)`（新形态直读、旧形态回退 `hasChildren`、树关恒 false） |
| `src/components/table/ex/interactions.js` | 步骤 2（问题 3） | `isTreeArrowSlot` 判定源改 `expandableAt`；三处 JSDoc 同步 |
| `src/components/table/ex/painter.js` | 步骤 2（问题 3） | `paintTreeArrowAccent` 判定源改 `expandableAt`；import 扩展 |
| `src/components/table/ex/use-tree-rows.js` | 步骤 2（问题 3） | `treeOptions` 增 `isLeaf` 字段（缺省 undefined = 特性关闭）；`flatRows` 传 `isLeafOf`；`applyTreeToggle(key, meta)` 增 meta 并 emit `tree-expand`/`tree-collapse`（载荷 `{ key, record, level }`）；**偏离补救**：`childrenIndex` computed 显式 `void props.recordsVersion`（见偏离 2） |
| `src/components/table/ex/table-ex.vue` | 步骤 2（问题 2/3） | `relayoutAndRedraw` 尾部 `redraw()` 替换为精算三连（`remeasureVisibleRows` + `recomputeViewWindows` + `redraw`，onThemeChange 先例同款）；emits 增 `tree-expand`/`tree-collapse`；`tryToggleTreeRow` 传 `{ record, level }` meta；`syncPaintState` flatInfo 增 `expandable` |
| `demo/src/data/table-ex/main-view.vue` | 步骤 1 | 「树（懒加载）」场景：radio 选项、`lazyTreeRecords` 夹具（根 A/B `isLeaf:false` 无子级、id 200001+ 与既有树夹具隔离）、`treePropsBind` 该场景固定 `{ key:'id', parentKey:'pid', isLeaf:'isLeaf' }`、`stageTree`/`stageRecords`/`stageColumns` 分支、`onTreeExpand`（防重复回填守卫 + 300ms 异步就地 push 3 子级 + `recordsVersion++`）/`onTreeCollapse` 处理器、模板 `@tree-expand`/`@tree-collapse` 绑定；`debugFlatRowsLength` 数据源改 `stageRecords`（懒加载场景行数正确）；状态栏树场景显示条件覆盖 tree-lazy |
| `demo/src/data/table-ex/self-checks/tree.js` | 步骤 2 | 追加用例：`buildFlatRows` + `expandableAt` isLeaf 语义断言（未映射关闭 / `===false` 触发 / `===true` 与缺字段不触发 / 有子级不变 / 展开懒节点无行变化 / 新旧形态两用 / 树关恒 false） |
| `demo/src/data/table-ex/self-checks/interactions.js` | 步骤 2 | 追加用例：`resolveTreeToggle`/`resolveCursor` 对 `expandable` 形态（懒节点槽内可 toggle、expandable 优先）与旧 `hasChildren` 形态回退断言 |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 步骤 2（锚点口径适配） | 知识库坑位「canvas 像素断言随锚点口径漂移」要求的同批改写：新增 `textAnchorOffset(font)` helper（与 `centeredTextAnchor` 同参口径现算，随运行时字体自适应）+ `TEXT_ANCHOR_OFF` 常量；8 处文本 y 断言与 2 处下划线 y 断言由固定值（19/26）改为 `19 + TEXT_ANCHOR_OFF` / `19 + TEXT_ANCHOR_OFF + 2` 口径（多行/单行/数组值/竖排 link/line-clamp 改道/槽位锚组 ×3/横竖下划线） |

无 scss 改动；`constants.js` 未改（设计声明）。

## 偏离

1. **设计「实施步骤 1 前置」（:3000 服务）**：调度者确认运行中的 :3000 demo 服务在本会话中途死亡（复现阶段一直可达，`npm run build` 后 `ERR_CONNECTION_REFUSED`、netstat 无监听、curl 000）。非本环境访问受限（派发约束针对的场景），按恢复验证需要后台重启 `npm run demo:build`（端口空闲无抢占），现已运行（供 verifier 继续使用）。若调度者另起服务请先停此实例。
2. **设计「方案概述·问题 3 裁定 #4b」的机制事实修正（use-tree-rows.js）**：设计称「回填后 childrenIndex/flatRows computed 因 records 数组就地变更而失效重建」——Vue 3 computed 对**普通数组**的就地 push 不失效（demo 夹具与既有 `treeRecords` 均为普通数组）。实测：回填 + `recordsVersion++` 后树平铺仍 3 行（contentHeight 停 144）。补救：`childrenIndex` computed 显式 `void props.recordsVersion`（`table-ex.vue` spans computed :224 同款先例；flatRows 经 childrenIndex 间接失效）。该文件在设计改动清单内、改动与裁定 #4b 目标（「子级行直接出现，无需二次 toggle」）一致；修后实测回填即展开 6 行（contentHeight 252）。
3. **设计「未解问题 #6」的回退分支按实测细化（cell-painters.js）**：`fontBoundingBoxAscent/Descent` 在目标浏览器（Chrome 基座）可用，但其**口径随 `ctx.textBaseline` 当前值变化**——`middle` 状态下返回相对 em 中点的换算值（12px 雅黑链实测 8.86/6.14，据此补偿会得到 offset=1，实测把文本移到更偏上 -4px）；`alphabetic` 状态下返回真实 ascent/descent（12/3，与 `fillText` 渲染字形一致）。实现按设计回退条款 + 两条实测约束处理：测量必须在 `alphabetic` 状态下取；缓存键并入 ctx 实例级「可度量」能力位（真 canvas 与自检 width-only stub ctx 同 font 串时能力不同，防止真 ctx 条目污染 stub 回退路径，painter 自检 y=55 断言因此保持原值通过）。
4. **设计「测试计划」问题 3-③ 的行数期望值**：设计 §5 伪代码每父 push 3 个子节点（3→6 行），但测试计划表写「records.length 由 3 增至 9」。按 §5 伪代码实现（3→6），验证以 6 行 + contentHeight 252（=36×6+36）断言通过。

另：demo 回填守卫 `lazyTreeRecords.some(r => r.pid === payload.key)` 使二次展开不重复加载（设计伪代码原文），收起后数据保留、再次展开直接显示子级——可视行回退 3（contentHeight 144）符合验收 3-④ 意图。

## 自检

命令与结果（均在最终代码上执行）：

| 命令 | 结果 |
|---|---|
| `npm run build`（build:base + build:ex × dev/prod 共 4 次 vite build） | 全部 `✓ built`，零错误 |
| `npx stylelint "src/**/*.scss"` | 零输出（exit 0） |
| demo 自检套件（调试面板「重跑自检」） | **187/187 通过**（含新增 tree ×1、interactions ×1、cell-painters 适配后的全部既有断言） |

playwright 验收断言（`http://localhost:3000/data/table-ex/`，DOM/canvas 像素断言）：

**步骤 1 复现数据（修复前留痕，dpr=1，rowHeight=36，字体 system-ui/雅黑链）**

- 问题 1（文本 ink 中心相对槽位 centerY 的偏移，负 = 偏上）：
  - tag「新品」[47,59] 中心 53 vs 55 → **-2.0px**；tag「V4」→ **-1.5px**
  - progress「30%」「75%」→ **-1.5px**；button「编辑」「详情」→ **-1.0px**
  - 受控实验证实机制：`middle` 基线 = centerY+3（em 方框中点语义），DOM 行框口径基线 = centerY + round((fbA−fbD)/2) = centerY+5 → 修复公式 delta 预期 0（汉字）/ +0.5（拉丁数字）
- 问题 2：切「多行文本」后 contentHeight = **354**（估高，行高 [196,52,70]）；经 refreshTheme（onThemeChange 精算链）触发后跳 **444**（精算 [196,70,142]，行 1/2 差异源 = long3 列行 1 长文本折 3 行、行 2 long10 折 7 行——字符串多行列估高恒 1 行下界即根因）；**估高 354 < 视口 417 → 表格不可滚动，scrollFrame 精算链完全不可达**（scrollTop 设不进、无 scroll 事件），格线停在估高位置且用户无自救途径
- 问题 3：懒根 A/B/C 箭头槽 ink 7/8/4px（全噪声级，无三角）；点击 A 箭头槽仅产生 cell-click + 选中事件链，无 tree-expand；展开集不变

**步骤 2/3 修复后复测**

- 问题 1（同口径复测）：tag「新品」+0.67 /「V4」+0.33、progress「30%」「75%」+0.33、button「编辑」+0.33 /「详情」+0.67 —— 全部 **|delta| ≤ 1px** ✓
- 问题 2：切「多行文本」后 contentHeight 即 **444**（精算，无需滚动）；行高 [196,70,142]；行线位置 232/302（估高旧位 232/284/354 已消失）✓
- 问题 3：懒根 A/B 箭头槽 ink 73/74px（三角实心）、普通叶 C 4px（噪声级）✓；点击 A 箭头槽 → 事件日志 `tree-expand {"key":200001,"record":"#200001","level":0}` ✓；300ms 回填后 records 3→6、contentHeight 144→**252**、`scrollTop === 0`（不闪顶）✓；再次点击 → `tree-collapse {"key":200001,...}` + contentHeight 回 144（可视行回退）✓
- 回归：普通树场景 toggle（`tree-expand {"key":1,...}` 正常发射，既有行为无回归）；default 100k 行滚动（contentHeight 3,600,036，variable）+ `refreshTheme()` 后滚动位置保持（锚定补偿幂等）；link 悬停下划线 = 光学锚 +2 处 1px 连续暗带、位于字形下方不穿字、cursor=pointer ✓

**验证手段说明**：本 playwright 会话中 `page.mouse.click` 对 canvas 不触发事件（move/hover 有效）——会话级 CDP 输入怪癖而非组件缺陷：同页面合成 `MouseEvent('click')` 走完整组件链路（`onClick → tryToggleTreeRow → applyTreeToggle`）全部正常，且 interactions 自检断言全绿。verifier 如遇同样现象可用页面内合成事件或重启浏览器会话。

## 复现数据汇总（验收标准 2 要求的重绘触发条件分析）

格线重绘触发链路（代码事实 + 实证）：格线 = `f(rowGeometry.topAt, colLefts)` 纯函数，随**行高真值**变化重绘。修复前行高真值仅三个入口：① 滚动帧 scrollFrame（onScroll→rAF）；② onThemeChange（relayout 后显式补精算）；③ 编辑提交 nextTick。夹具切换（records/columns watch）只走 relayout 估高（字符串列恒 1 行下界）不走精算；估高 354 < 视口时不可滚动 → ①不可达 → 格线永不重绘（比「滚 1px 即恢复」更彻底）。修复 = `relayoutAndRedraw` 尾部统一补精算三连（onThemeChange 先例），一切 relayout 出口的可视行恒为精算真值。

## 遗留

1. `yOverflowed`/`yScrolledEnd` 标志在 relayoutAndRedraw 中按估高 contentHeight 设置、尾部精算后不刷新（如估高 354 无溢出 → 精算 444 溢出，底部阴影状态滞后）——与 onThemeChange 先例行为一致（设计明示该先例保持不动），非本次范围。
2. 表头文本仍为 `'middle'` 锚（设计明确不改，用户未提表头；`centeredTextAnchor` 可直接复用于 painter.js 表头绘制，设计残留 #7）。
3. `tree-expand`/`tree-collapse`/`treeProps.isLeaf` 属 API 变更，三处文档（skills/mussel-ui/references、docs/quick-reference_*、docs-site）同步待用户确认后另行处理（派发约束：不更新文档）。
4. demo 页既有的 `data:image/png;base64,AAAA1:0` 资源加载报错与 enum 列废弃警告为基线既有，与本改动无关。
