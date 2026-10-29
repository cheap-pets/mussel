# 实施记录 — G1-b（layout.js + layout 自检断言）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/table-ex/layout.js` | G1-b | 全部为纯函数（不持状态、不触 DOM、不写回入参）：`OVERSCAN=2 / COL_FALLBACK=80 / RESIZE_HANDLE=4` 契约常量；`solveWidths({ columns, containerWidth, widthOverrides })`（定宽列 `widthOverrides[key] ?? col.width ?? type.width` 经 getPixelNumber + min/max clamp；未定宽列初始 `clamp(80, minWidth ?? 80, maxWidth ?? ∞)`；剩余宽均摊、maxWidth clamp 消耗次轮再摊、上限 3 轮）；`computePrefixSums`（colLefts 前缀和 + colsWidth）；`computeViewRows / computeViewCols`（窗口起止，end 为排他边界；viewCols start ≥ 固定列数、含左缘跨列）；`rowAt / colAt`（坐标↔行列，表头区/越界 -1，固定列区按视口坐标线性查、滚动区按 contentX 二分）；`findResizeColumn`（±4px 手柄，右缘归命中列、左缘归左邻列；命中列或候选列任一 < fixedLeftColumns 即 -1（分界两侧）；列级 `resizable === false` -1）；`relayout(input)` 纯计算输出布局快照（colWidths/colLefts/colsWidth/fixedCount/fixedWidth/contentWidth/contentHeight/rowHeight/headHeight/sticky*/spacer*/viewH/viewW/viewRows/viewCols/scrollTop/scrollLeft），viewH = clientHeight − headHeight、viewW = clientWidth − fixedWidth（decisions「[I1 前]④」口径） |
| `demo/src/data/table-ex/self-checks/layout.js` | G1-b | 14 条断言填充（替换 G0 占位空数组）：契约常量；定宽列解析（px 字符串、type.width 缺省）与 clamp；widthOverrides 按列 key 优先（含 `_key` 命中、非法值回退、列定义不被写回）；未定宽列均摊（总宽=容器宽）；maxWidth 消耗迭代再摊收敛；全部触顶留白 + remain≤0 保持初始宽；前缀和；行/列窗口起止（OVERSCAN、跨行、越界 clamp、空数据）；坐标换算边界语义；手柄命中归一；固定列排除（分界两侧、列级/表格级开关）；relayout 全字段与 viewH/viewW 口径 + 入参不被改写；少量行/空 records/空列 spacerHeight=0 等 clamp |

decisions「[I1 前]」影响本模块的两条已落实：① viewH/viewW 口径在 relayout 内统一计算并输出（viewH/containerHeight−headHeight、viewW/containerWidth−fixedWidth），viewRows/viewCols 均按该口径求解，自检断言同口径（含 lastPaint 断言上界，见「遗留」1）；② solveWidths 接受 widthOverrides 参数、按列 key（`col.key ?? col._key ?? 下标`）优先于列定义 width、不写回 props，纯函数不持状态，overrides 存放/清空（columns 引用替换时清空）归 S1 组件壳——模块头注释与函数 JSDoc 已写明契约，自检断言优先级与不写回。

## 偏离

1. **设计 A3 宽度求解 step 3 公式「remain = containerW − Σ定宽列」按「Σ已定宽（定宽列 + 未定宽列初始宽）」实现**。证据：按字面「仅 Σ定宽列」，未定宽列初始 80 不入账，分配后总宽 = containerW + Σ初始宽，与设计自身不变量矛盾（A5 判据「总宽=容器宽无留白」、被拒绝备选 #10「保持未定宽列填满容器的分配不变量」、step 3 自身「remain ≤ 0：总宽超出容器 → 横向滚动」）。按「Σ已定宽」读法三条全部自洽（初始宽入账后均摊恰好填满；remain ≤ 0 即初始宽已超容器）。自检第 5/6/13 条以「总宽=容器宽」断言固化该口径。若设计方认定字面读法，需回改设计（会连带 A4/A5 总宽断言），本步骤未自行回改文档。
2. 无其他偏离。设计 A3「列宽变化时增量更新前缀和」以 `computePrefixSums` 全量重算实现（O(列数)，200+ 列内可忽略）——设计文字为性能建议，纯函数契约下的等价实现。

## 自检

| 检查 | 命令/方式 | 结果 |
|------|----------|------|
| 断言逻辑（Node 预验） | 临时脚本：layout.js 与 self-checks/layout.js 原文（仅剥离 import、注入忠实 getPixelNumber/resolveColumnType stub）在 Node 24 执行全部 14 条 | 14/14 PASS（期间修正 1 条自检预期错误：x=104 距列 1 左缘 4px 应归左邻列 0，非列 1）；临时脚本已删除 |
| 编译校验 | `npx vite build --config vite.demo.config.js`（一次性；与后台 watch 进程并存，按派发约定） | 通过：built in 579ms，无报错；`demo/dist/data/table-ex/main.js` 73.88 kB（G0 时 28.43 kB，含 layout 模块与断言）；bundle 内 grep 到 solveWidths/findResizeColumn |
| 页面可达 | `curl http://localhost:3000/data/table-ex/` 与 `/main.js` | 均 200 |
| eslint | — | 未安装（node_modules 无 eslint bin，package.json 无 lint script）；已按 standard 风格（无分号/单引号/2 空格/函数名后空格/operator 折行 before-`?`）人工核对 |
| stylelint | — | 不适用：本步骤无 scss 改动 |
| 自检区浏览器执行 | demo 页挂载即跑 | UNVERIFIED，留验证阶段（构建产物已含断言代码，Node 预验同码通过） |

## 遗留

1. **S3 lastPaint 断言口径注意**：scrollTop 落在行中间（上缘跨行）时，可视行必须多含 1 行跨行行，`viewRows.count`（= 未来 lastPaint.rowCount 同口径）上界为 `ceil(viewH/rowHeight) + OVERSCAN + 1`，设计 A3 测试行字面 `ceil(视口高/行高) + OVERSCAN` 会被跨行场景超出 1 行。建议 S3 断言写 `rowCount ≤ ceil(viewH/rowH) + OVERSCAN + 1` 或直接对 `getLayoutInfo().viewRows` 的 start/end 一致性断言（viewH 口径 decisions④ 已统一，本模块 relayout 输出 viewRows 可直接作为对照）。
2. **「上限 3 轮」为防御性边界**：均摊语义下（每轮有未封顶列则消耗恰好耗尽 remain），循环恒经「remain ≤ 0」或「剩余列为空」退出，3 轮截断实际不可达；实现保留该上限，行为与设计「未收敛列保持当前值」一致（该状态不可达）。设计若需字面可验证的 3 轮行为需另行定义分配策略。
3. **S1 对接契约（本步骤定义，S1 实施者需知）**：
   - `relayout(input)` 为纯计算：S1 读 theme 快照取 rowHeight/headHeight、读容器 clientWidth/Height 后调用，用返回的 `stickyWidth/Height` 同步 `__sticky`、`spacerWidth/Height` 同步 `__spacer`，布局数据整体存入组件 layout state（getLayoutInfo 的 colWidths/contentWidth/contentHeight/rowHeight/headHeight/viewRows 直接取自该快照）；
   - widthOverrides（按列 key）由 S1 持有：拖拽 move 中自行 clamp（`minWidth ?? 40, maxWidth ?? ∞`，A5）并临时更新列几何；up 时写入 overrides → `relayout` → 清空时机为 columns 引用替换（watch 内）；本模块不存任何状态；
   - 滚动路径（scroll 事件 rAF 内）无需重跑 solveWidths：直接以现有 colLefts 调 `computeViewRows / computeViewCols`；
   - 命中换算：interactions 以 `rowAt/colAt/findResizeColumn` 入口调用，x/y 为相对 canvas 坐标（getBoundingClientRect 差值，A5）。
4. demo 页自检区在浏览器内的实际执行结果（应 14/14 通过，另有 theme/cell-painters 等并行组断言）留验证阶段确认；本步骤未做任何浏览器内断言。
