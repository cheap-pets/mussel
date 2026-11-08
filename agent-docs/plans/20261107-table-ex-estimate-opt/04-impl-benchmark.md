# 实施记录：demo benchmark 页面（追加子任务）

派发：implementer（追加子任务：demo benchmark 页面）。本子任务不在 02-design.md
实施步骤 0–5 内，按派发要求 1–7 执行；7733a6f 已合入（工作区基线）。

## 改动文件

- `demo/src/data/table-ex-benchmark/main.js`（新增）— 入口，与既有页面同模式
  （createVueApp）→ 派发要求 1
- `demo/src/data/table-ex-benchmark/main-view.vue`（新增）— 基准页本体：场景矩阵、
  指标面板、汇总矩阵 → 派发要求 2–5
- `demo/src/catalog.js` — 登记 `data/table-ex-benchmark` 页面（demo 全站清单
  单一事实源）→ 派发要求 1

最终 URL：`http://localhost:3000/data/table-ex-benchmark/`（catalog 路径 = 目录路径 =
URL 路径，`vite.demo.config.js buildInputs()` 构建 input、serve-handler cleanUrls 提供服务）。
派发文中 `/data/table-table-ex-benchmark/` 为笔误，以实际注册为准。

## 页面能力（对应派发要求）

- 场景矩阵（`:key` 重挂载取全新几何控制器——mode 只升不降，短路类场景必须新实例）：
  - `single` 全确定单行列（check/rec_no/text/enum/number/date，无 link/list、无
    maxLines>1/multiline）→ 表级短路，scanCount=0
  - `list` 条目列（全行 1–5 条、listOption.max=4 截断）→ 计数通道全量估高
  - `multiline` 变高列（maxLines=3 + multiline）→ variable + 进窗精算
  - `mixed` 图形列（check/tag/progress）+ 文本 + 条目 + 多行
- 规模：1k / 10k / 100k（`?scale=` 白名单；`?scene=` 白名单，默认 single@100k）
- 指标（`performance.now`，页面 data-metric 锚点可见）：
  records 构建耗时 / 首次 relayout（`getLayoutInfo().lastRelayout` 的 elapsed·
  scanCount·rebuild）/ 首绘 paint（`getLayoutInfo().lastPaint.elapsed`——经确认
  该字段可用，无需组件改动）/ rowGeometryMode / 端到端；「替换引用」同实例
  props 直替耗时 + scanCount；「自动滚动 100 帧」重绘次数 / 平均·最大 paint
  耗时 / 平均帧间隔（lastPaint 逐帧采样，相邻窗口不变判未重绘）
- 「运行全部场景（4 场景 × 3 规模）」逐格重挂载写入汇总矩阵（mu-table 自举）

## 偏离

无（本子任务无设计文档步骤可偏离；派发即设计）。两处实现内健壮性处理，非方案变更：

1. `nextFrame` rAF + 32ms 定时器竞速：隐藏标签页 rAF 暂停会使等待循环永不迭代
   （playwright 实测复现后修复）。
2. 滚动基准 15s 墙钟预算：隐藏标签页定时器节流（≥1s/次）令 100 步拖入长尾，
   预算内收束并显示实际步数。

## 自检

- `node -e "import('./demo/src/catalog.js')…"` — 新 entry 解析正常
- `npx stylelint "demo/src/data/table-ex-benchmark/*.vue" --fix` — 3 处
  properties-order 警告自动修复，复检 0 输出
- watch 拾取实证：编辑 catalog.js 后 dist 于 14:49:38 重建（catalog 在模块图中），
  但 `demo/dist/data/table-ex-benchmark/` 未出现、URL 404——`buildInputs()` 仅在
  配置加载期执行，新入口必须重启构建（catalog.js 头部注释同款结论）
- 运行时验证（隔离通道，未动 `demo/dist/`、未重启 watch）：临时配置复用
  `vite.demo.config.js`（滤除写死 demo/dist 的 copy-html-files 插件）单入口构建到
  系统临时目录 + serve-handler 同参数静态服务 :3210，验证后已全清理。playwright
  DOM 断言（标签页隐藏，radio/button 经原生 click 触发）：
  - 页面加载及全流程 console 0 error / 0 warning（会话历史中 3000 端口 table-ex
    页的消息与 3210 无关；favicon 404 在补 data:, link 前的首载，已消除）
  - `?scene=single` 首载 100k：scanCount=0、mode=uniform、rebuild=false、
    buildMs 38.4 / relayoutMs 5.6 / paintMs 4.2（数字均可见）
  - `?scene=list` 首载 100k：scanCount=100000、rebuild=true、mode=variable
  - 场景 radio 切换 single↔list 正常（scanCount 0 ↔ 100000）
  - 「运行全部」：汇总矩阵 12 行（4 场景 × 3 规模）全数字；single 三档规模
    scanCount 全 0（100k 档 relayout 1.4ms vs list 380.8ms），list/multiline/mixed
    = 行数
  - 「替换引用」：single 100k → swapScanCount=0、swapRelayoutMs=0.9（短路跨
    引用替换保持）；list/mixed → 100000
  - 「自动滚动」：预算内完成并显示 4 项指标（隐藏标签页仅采样 1 重绘/14 步，
    可见标签页预期满采样）

## 遗留

1. **需重启 `npm run demo:build`** 方可在 :3000 访问新页面（按派发要求未擅自重启）。
   重启后 URL 即本记录开头所列。
2. 滚动指标与端到端指标受隐藏标签页 rAF 暂停 / 定时器节流影响（浏览器物理限制）：
   可见标签页（人工基准的正常用法）下滚动约 100 步 × ~16ms 帧；隐藏标签页端到端
   含 ~1s/次的轮询粒度、scrollPaints 可为 0 或少量。指标面板显示实际采样数，不作假。
3. 上方验证基于隔离临时构建（同一源码、无 copy-html-files 差异——该插件只产
   index.html，临时通道手工等价生成）；重启正式构建后建议在 :3000 复跑一轮冒烟
   （首载 single scanCount=0 + 运行全部 12 行）。
