# 验证报告：table-ex 改进（第 1 轮）

VERDICT: FAIL

基线 `mussel-table` @ `3d41296` 验证时未变（git rev-parse 确认）。验证手段：A10 命令实测；A1–A9/A11 按 02-design.md「测试计划」浏览器行 + 自检面板 + 页面 JS 上下文 getImageData（demo watch 外部运行于 :3000，面板 total=163 与 G2 各组新增计数 147+16=163 交叉吻合，确认载入最新构建）。两条 painter 自检失败的根因经独立 vite harness（真实 src 模块 + 真 canvas，源码与产物在 `evidence/verify-harness/`）实证定位，均为**测试断言自身缺陷**，非组件行为缺陷。

## 上轮问题核对（第 2 轮起）

首轮验证，无上轮报告。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `NODE_PATH=$(npm root -g) npx eslint src/components/table-ex/ demo/src/data/table-ex/` | PASS（exit 0） | 无任何 error/warning 输出 |
| `npm run build` | PASS（exit 0，二次确认） | dev: 296 modules，`dist/mussel.css 124.61 kB`、`dist/mussel.js 660.02 kB`，built in 519ms；prod: 296 modules，`mussel.min.css 100.96 kB`、`mussel.min.js 292.91 kB`，built in 324ms |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 垂直槽位锚 + 水平内容区中心 + 多行整列 top | 自检 + 浏览器 | 前置：`--head-row-height`=36px（覆盖开关关）。自检（面板内通过）：单行 y=18、rightInset 1→x=79.5 / 0→80、left x=8 不受影响、多行 [18,36]/[18,36,54]/[18,36,54,72]、超高行单行 y=18、painter row0=54、残差判据注释齐备。浏览器 default 场景（名称列 col2）：row0 墨迹中心 53.25 vs 内容区中心 54（−0.75px）、row1 89.25 vs 90.5（−1.25px）——≤2px 粗界内。multiline 场景（行高 196/70/142）：① 跨列首行 top 差：col0/col1/col2 偏移 12/11/11（r0）、12/11/11（r1）、12/12/11（r2），差 ≤1px ≤3px；② maxLines=3 列内 r0(3 行)offset 11 vs r2(单行)offset 12，差 1px ≤3px；③ 首行贴顶：11−9=2 / 12−9=3 ∈ [−2,+5]；超高行 r0（h=196）名称列墨迹 top=12 与多行列同顶（跨列首行同高）。水平居中 −0.5px 由自检 x=79.5 断言覆盖 | PASS |
| A2 阴影位于 header 下沿 | 浏览器 | ① `.mu-table-ex__header-shadow` offsetTop=37 == headHeight(36)+1（offsetParent=`__overlay`）；② 滚动 40px 后 header 内 y∈{10,20,30} 与未滚动帧逐点相等；③ 截图逐行比对（DPR2，overlay 坐标系）：差异带从 y=36 起（36/37 行 diff=600，38-45 行 diff=594），完整强度 hairline 不落入 header [0,36) | PASS |
| A3 描边/浮层覆盖整格 | 自检 + 浏览器 | 自检（面板通过）：editorRectOf 恒等、computeEditorStyle 整格期望值 [0,64,100,36]/[50,36,80,36]/[100,72,200,100]、五边逐点混色断言。浏览器：hover 备注格（1,7）左缘 [246,246,246]→[141,185,226]（主色描边贴格缘）、顶缘→[119,165,207]（与行线三重叠）、内邻 [234,234,235] 无描边、外邻 [193,197,201]=前列线叠行带；点击开编辑 `.mu-table-ex__editor` getBoundingClientRect 与 `getCellRect(1,7)` 四边 deltas 全 0（≤0.5px）；input `border-radius: 0px`；Esc 关闭。截图 `evidence/a3-hover-memo.png` | PASS |
| A4 展示型不可编辑 | 自检 + 浏览器 | 自检（面板通过）：link/button/progress 三类型 isCellEditable false + open 拒绝双判。浏览器 items 场景：点击链接/标签/进度/按钮四类格，`.mu-table-ex__editor` 均不出现 | PASS |
| A5 自定义编辑按钮 | 自检 + 浏览器 | 自检（面板通过）：editorButtonRectOf 几何（388,42,24,24；centerY=槽位式）、requestIconImage 着色/缓存/直通、加载中不半绘制。浏览器 default 场景备注列：hover 前按钮区墨迹 0 → hover 后 188（首次 onload 重绘，等待 0ms 即现=缓存命中路径同效）；图标中心 (863.5, 90) vs 格内容区中心 cy=90，垂直差 0px；移出格墨迹归 0；点击图标 → 事件日志「editorButton 点击」、editor 不打开；按钮区 cursor=pointer（dispatchEvent pointermove 实测，文字区 text 对照） | PASS |
| A6 开关无白色背景（veil） | 浏览器 | default 场景点「启用」列（bool）：`.mu-table-ex__editor` computed backgroundColor **rgba(0,0,0,0)**；编辑格画布区域（内缩 2px）墨迹 **0**（veil 跳绘，编辑前 223）；switch 控件可见；Esc 关闭后墨迹恢复 223 | PASS |
| A7 按钮/链接 hover 样式与光标 | 自检 + 浏览器 | 自检（面板通过）：linkHoverColorOf 五分支、两路径下划线 fillRect、按钮反转三色、disabled 不悬停、resolveItemClick disabled 两态、theme hover 三形态。浏览器 items 场景：① hover 第 0 条链接：格区域 1744 像素差（ctx 补丁实证 `fillText('主色链接',128,124)` style=#419de2 + 下划线 `fillRect(128,131,56,1)` #419de2）；移开条目/移出画布后与常态帧逐字节一致（baseVsRestore=0）；② hover 按钮 pill：仅 pill 区域差异（dx15/40 diff=2721，dx≥65 diff=0，非行带）；③ cursor（`.mu-table-ex__sticky` style）：启用链接 pointer / 禁用链接 default / 按钮 pointer / tag default / 普通文本 default | PASS（hoverMode=none 页面项见「需人工」） |
| A8 树排序 A 案 + 成本结论 | 自检 + 浏览器 | 自检（面板通过）：tree 模块平铺排序重组 4 条断言（同级有序/结构不变/降序两态/稳定性+同名不穿插）。浏览器（树开，n=10003=2000 根+8000 叶+3 深层，`window.__ctStage` 契约 `{records, treeProps}` 实测可用）：点击树形列表头 → asc：**2002/2002 个父组**（1 根桶+2001 子桶）兄弟 name localeCompare 全部非递减、根级变「根节点 1/10/100」；再点 → desc：2002/2002 组非递增（根 999/998/997）；三点 → 清空：恢复原序（首项「根节点 1」「根节点 2」，origMatch=true）；父链映射 10003 条 id→pid 恒定（不跨节点）；树关（treeOn false）点表头 asc 同样生效（首三项 1/10/100）；**箭头三态**（表头行差分 bbox）：asc vs desc 差异区 [218,12]-[227,23]、asc vs clear [218,12]-[227,16]（上三角）、desc vs clear [218,19]-[227,23]（下三角）——树态箭头正常显示三态切换。**成本实测（verifier 取样，见下节）** | PASS（排序行为；成本夹具缺陷见失败项 3，不影响结论） |
| A9 自检全过 | 浏览器 | 运行时面板 **total=163、passed=161、failed=2**（新基线总数 163 = 上轮 147 + G2 新增 16：painter+5、cell-painters+5 块、editor+1 块、theme+1 块、tree+4）。9 模块齐全（text-wrap/row-geometry/tree/theme/layout/cell-painters/painter/interactions/editor）。2 条失败均定位为**测试断言缺陷**（见失败项 1/2），组件实现经 harness 实证无问题 | **FAIL** |
| A10 lint/构建 | 命令 | 见「命令结果」：eslint 0 error 0 warning（exit 0）、build 成功（exit 0） | PASS |
| A11 空白区末列右边框 | 自检 + 浏览器 | 自检（面板通过）：窄夹具末列线两段、row 模式不画、无空白 (599,100)/(599,4) 无线。浏览器：窄列场景（widths [56,280,240]、Σ=576 < 视口 956，blankTail）末列右缘 x=575：表体段 y=60/150 与表头段 y=4/20 均 [201,205,209]，与前列既有列线同色同口径；空白区 x=605 [255,255,255] 无线无背景；default 场景（Σ=1434 > 956，无空白）横向滚至最右：末列右缘表体段 [255,255,255]（无线，现状维持）、表头段仅表头底色 [236,238,239]（非列线色；y=35 底边框 [201,205,209] 横贯如常）。截图 `evidence/a11-default-right-edge.png` | PASS |

### A8 成本实测（追加约束要求的回填数据；设计文档不回填）

「树排序成本测量」按钮程序化触发真实管线（orderBy ''→'name:asc'），每次点击 logCount 递增证实管线执行；因夹具第 ④ 步判据方向写反（失败项 3）恒 stale，verifier 改经 `getLayoutInfo()` 直接读本次管线产物并独立取样 sortMs：

| 项 | 实测（多次取样） |
|---|---|
| sortMs（纯排序+拷贝 n=10003，localeCompare 口径） | 1.4 / 1.5 / 1.6 / 1.6 / 1.7 / 1.8 / 2.0 ms（7 次） |
| relayoutMs（`lastRelayout.elapsed`，4 次按钮触发） | 4.2 / 6.0 / 6.1 / 6.3 ms |
| paintMs（`lastPaint.elapsed`，同上 4 次） | ≈0.2 ms（虚拟滚动下仅绘可视区） |
| 单次排序总成本 | ≈ 6–8.5 ms |

**结论：非过高**。实测远低于设计机制预期 <30ms，更远低于 100ms 的「过高」阈值；A 案（树态支持排序、显示箭头）成立，无降级需要。

## 范围核对

基线：00-task 声明 `mussel-table` @ `3d41296` 工作区干净；git rev-parse 实测 HEAD 一致。

- **验证产物**：`npm run build` 产物被 .gitignore 忽略（git status 不可见）；harness 构建产物在 `agent-docs/plans/20261027-table-ex-improve/evidence/verify-harness/`（任务目录内，未跟踪）。
- **基线排除项 / 无法区分**：无（基线干净）。
- **设计外改动（均与 table-ex 无关，内容为 badge 颜色 props / tones 原子类，疑似同机其他会话在途产物，各实施组白名单核对均声明未触碰且行数与 impl 记录吻合）**：
  - `src/components/badge/badge.scss`、`badge.vue`、`src/components/common/props.js` — **已记录**（G1-a 遗留节「badge.* 归属不明」；S4/S5/G2-1/G2-2 白名单行「badge.*/props.js 为前序在途状态」）— **未覆盖**（不在 02-design.md 改动清单）
  - `src/styles/atomic.js`、`src/styles/box-shadow.scss`、`src/styles/tones.scss`（未跟踪新文件）— **未记录**（全部 04-impl 记录零提及；G2-1/G2-2 提及的 background.scss 现已不在脏列表）
- 允许目录内的 20 个文件全部在 02-design.md 改动清单内；并行组白名单未越界（各组仅改本组文件，行数与 diff --stat 吻合）。

## 测试质量问题

- 新增断言总体对准验收标准（槽位锚精确值、五边混色期望、veil 墨迹计数、tree 兄弟序关系式断言、disabled 三通道同口径），非「不抛错」式断言。
- **实施者直调 harness 覆盖不到浏览器像素/DOM 层**：G2-4 两条新增/改写断言落地即错（失败项 1/2），G2-1 夹具判据方向反（失败项 3）——三者均由本轮页面验证捕获，实施记录中「经直调验证成立」的表述对像素/语义层不成立（G2-4 自检节已如实注明像素归浏览器）。
- A9 基线以运行时 163 为准记录在案；修复失败项 1/2 后面板应 163/163。

## 需人工检查

- **A7「hoverMode 切 none 后条目 hover 色立刻消失」**：demo 无 hoverMode 夹具入口（main-view.vue 无该控件），页面不可操作。代码层已确认归一存在：`table-ex.vue:387` `paintState.hoverItem = props.hoverMode === 'none' ? null : hoverItem.value`（syncPaintState，指针不动切 none 亦生效）。如需页面级验收，建议后续补夹具开关。
- A6 borderless input 形态（`editor.border:false` 的 input）：demo 全仓无 `border: false` 列夹具，设计明示按「问题 6 同类核查结论」作代码层结论（容器背景已删、--borderless 白名单既有规则），不新增夹具。
- A2 设计 ③ 行的「像素与未滚动帧不同」若以 canvas getImageData 为手段不可行（阴影是 overlay DOM 的 box-shadow，canvas 像素读不到）；本轮以截图合成像素完成，后续轮次沿用。

## 环境阻塞

无。eslint 缺本地依赖已按派发约束以 `NODE_PATH=$(npm root -g)` 前缀解决；demo watch 由外部运行，未启停任何服务。

## 失败项（代码/测试 FAIL，不含环境阻塞）

全部为**测试代码缺陷**（组件行为经实证正确），修复后 A9/A8 夹具可转绿：

1. **A9** `demo/src/data/table-ex/self-checks/painter.js:776`「单格裁剪覆盖行 1 下半」——采样区域 `(60,110,140,30)` 按旧居中锚（文字中心 y=144，墨迹 [137,151) 与区域相交 3px）设计；问题 1 槽位锚后行 1（格顶 y=72）文字锚 y=90、墨迹 [83,97)，与采样区完全不相交 → 重绘差异不可见、断言恒败。**实现正确**：harness 实证单格重绘与整幅重画逐点一致（freshVsInvalidatedDiff=null）、直调 drawCell 锚值正确（`fillText('变高行已修改',68,126)` 夹具 y=108 口径）。修复方向：采样区跟随新墨迹（如 y=80 起 30px）。
2. **A9** `demo/src/data/table-ex/self-checks/painter.js:1129`（配合 ：1135）「hoverMode=none 与无 hover 帧整幅一致」——对照帧误用 `makeState({ hover })`（hover={row:0,col:3} 且 hoverMode 缺省 'row' → 整行高亮带），并非「无 hover 帧」；两帧第一差异 (0,36)：[245,245,245]（hoverBg 叠加）vs [255,255,255]，该断言对任何实现恒败。**实现正确**：harness 实证 none 帧与真正无 hover 帧（`makeState({})`）整幅逐点一致（fixedAssert_firstDiff=null）、且与帧 A 叠加无残留。修复方向：对照帧改 `makeState({})`。
3. **A8 夹具** `demo/src/data/table-ex/main-view.vue:1045` 成本测量第 ④ 步有效性判据方向写反：`stageRows[i].name.localeCompare(stageRows[i-1].name) <= 0` 是**非递增**判定，对升序产物恒 false → 5 次实测全部 `stale: true` 中止、夹具不产出 relayoutMs/paintMs。与注释「非递减」及 applyOrder 口径相反（应为 `>= 0`，或比较 `prev,cur` 取 `<= 0`）。失效不影响成本结论（verifier 已直读 getLayoutInfo 回填上表），但夹具按 00-task A8「demo 测量夹具实测回填」的定位应修复。

## 判定说明

- 8 项行为验收（A1–A8 行为面、A10、A11）全 PASS；FAIL 由 **A9（2 条自检断言缺陷）+ A8 成本夹具判据缺陷（3 处测试代码）+ 范围核对（设计外文件：styles 三件未记录；badge/props 已记录-未覆盖）** 构成。
- 无环境阻塞；UNVERIFIED 仅「需人工」两项。
