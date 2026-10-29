# 实施记录

流水线：design → amender → design 复审 → **impl（本记录）** → verify。
基线：mussel-table @ 7113e14，工作区 clean 起步；本轮实施未执行任何 git commit / push。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| `src/components/table-ex/mappings.js` | S1 | 新增零依赖共享模块（仅 import `@/utils/type` 的 `isObject`）：`isMappableColumnType` / `mappingsFromOptions` / `selectOptionsFromMappings` / `createDisplayMapper`，按设计 §1 逐条实现（含 `null/''/'-'`、`value == null`、带 `is` 对象项跳过与 label 缺省取 value 口径） |
| `src/components/table-ex/cell-painters.js` | S2 | `prepareColumn` 挂 `_mapText`（`!column.text` + 可映射类型门控，mappings 优先）/`_plainText`（非 multiline 原生 text 列），置于 `canvasOnlyKind` 求值之后（TDZ）；`resolveCellContent` 增加 P2 纯文本短路与 `_mapText` 映射分支（非空即终结，number 列不再走 Intl）；`drawCell` 新增 `colIndex` 选项、`onImageLoad` 契约改 `(row, colIndex) => void` 处理器，闭包创建点下沉 `measureItem` img 分支与 `drawCellImage`（P1b）；drawItems/drawItem/drawContentItems 增携 row/colIndex；全文件注释压缩（R5） |
| `src/components/table-ex/row-geometry.js` | S2 | `valueOf` 取值链后应用 `_mapText`（非空即按显示文本估高/精算，数组原值穿透）；`isTextPresentingColumn` 注释去 enum 字样；全文件注释压缩（Fenwick/估高下界/锚定补偿等关键锚点保留） |
| `src/components/table-ex/editor.js` | S3 | 删 `COLUMN_TYPE_EDITORS` 的 enum 条目；新增局部 `hasSelectSource`；`resolveEditorType` 重排（显式 type → text/number + 下拉来源 → select → text 形态判定 → 类型映射）；`resolveSelectOptions` 三级来源（editor.props.options > column.options > mappings 派生）；`usesDerivedOptions` 增 `column.options == null` 判定；`normalizeNumericEnumCommit` 更名 `normalizeDerivedSelectCommit`（逻辑不变）；import `selectOptionsFromMappings`；注释压缩 |
| `src/components/table-ex/layout.js` | S4 | `TYPE_DEFAULT_WIDTHS` 删 `enum` 条目；注释压缩 |
| `src/components/table-ex/table-ex.vue` | S5 | 仅注释压缩（含模板注释），无功能改动 |
| `src/components/table-ex/painter.js` | S6 | P1a：`paintBodyRow` 行级求 `recordKey`（`state.flatInfo ? recordKeyOf(...) : null`，置于 `record == null` 早退后），经 `drawCellClipped` 新参注入 drawCell；P1b：`drawCellClipped` 直传 `onImageLoad: state.onImageLoad`（relay 已是 `(row, col)` 处理器）并新增 `colIndex` 注入；`withImageRelay` 签名不变；注释压缩 |
| `demo/src/data/table-ex/main-view.vue` | S8 | 默认列“状态” `type:'enum'` → `type:'text'`（mappings/editor 原样）；“启用”后插入“等级”列（colIndex 9：`type:'number'` + `width:90` + `LEVEL_OPTIONS` 数值 options + 可编辑）；“全类型默认宽”场景状态列 enum → text |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | S8 | enum 夹具改写 text+mappings；新增 3 组断言：mappings/options 优先级与原值回退（含 number 命中终结/未命中原值不走 Intl、空值不映射落占位链）、`prepareColumn` `_mapText`/`_plainText` 判定（类型门控/column.text/multiline/空 options）、`onImageLoad` 新契约回归（同步 Image 桩断言 `(row, colIndex)` 恰回调一次） |
| `demo/src/data/table-ex/self-checks/editor.js` | S8 | enum 断言改写（text+mappings / number+options → select；select 值变化通道夹具补显式 `editor.type:'select'`）；“enum options”检查重写为三级来源优先级；新增 2 组断言：`resolveEditorType` 三来源缺省 select 及优先级（含范围限定 text/number）、仅 options 的 select 来源与数值提交类型保持（open 不字符串化、commit 原 number） |
| `demo/src/data/table-ex/self-checks/layout.js` | S8 | `TYPE_DEFAULT_WIDTHS` 断言表删 enum 行，条目数 14 → 13 |
| `demo/src/data/table-ex/self-checks/painter.js` | S8 | 3 处 enum 夹具（主夹具 / 2 处窄列夹具）改写 `type:'text'` + 原 mappings/width 100；像素断言数值不变（见自检“像素断言审计”） |
| `demo/src/data/table-ex/self-checks/row-geometry.js` | S8 | 新增 1 条：`_mapText` 显示文本参与 `ensureRowMeasured` 精算折行（maxLines 2 + 窄列长标签 → 52 / 短值 36）；估高路径仅确认不抛错（1 行下界，不作断言） |

不改动清单与设计一致：`theme.js` / `text-wrap.js` / `tree.js` / `interactions.js` / `row-geometry-controller.js` / `use-tree-rows.js` / `use-column-resize.js` / `constants.js` / `index.js` / `table/` 目录 / `self-checks/index.js` / `self-checks/{theme,tree,text-wrap,interactions}.js`。

## 偏离

无（设计步骤 S1–S8 全部按 02-design.md 落地）。S0 性能基线采集为**环境阻塞**而非设计偏离，见“遗留”第 1 条。

补充口径说明（非偏离）：验收 #6 的注释扫描脚本按**物理行**计块（`/**` 与 `*/` 行计入块行数，连续 `//` 行以空行/代码行分块），据此将 7 个源文件全部注释块压至 ≤3 物理行——严于按内容行计的口径，两种口径下均满足。

## 自检

已运行的命令与结果（Windows Git Bash）：

| 项 | 命令 | 结果 |
|---|---|---|
| 构建验收 #3 | `npm run build`（S1/S2/S4/S6 后及终检各一轮） | 退出码 0，dev + prod 两次 `✓ built` |
| 验收 #1 | `grep -rn "enum" src/components/table-ex/` | 0 命中（源码与注释均净） |
| S8 判据 | `grep -rn "enum" demo/src/data/table-ex/` | 0 命中 |
| S3 判据 | `grep -n "enum" src/components/table-ex/editor.js` | 0 命中 |
| S2 判据 | `grep -n "onImageLoad" src/components/table-ex/cell-painters.js` | 闭包仅在 `measureItem` img 分支与 `drawCellImage` 两处创建 |
| S6 判据 | `grep -rn "onImageLoad" src/ demo/src/data/table-ex/self-checks/` | 仅剩：cell-painters img 分支处理器闭包 + painter 直传 `state.onImageLoad` + `withImageRelay`（签名不变）+ `paintEditorButton` 自有闭包（覆盖层单次调用，非逐格）+ self-checks 零参回调（天然兼容）；`recordKeyOf` 调用点已移至 `paintBodyRow` |
| 验收 #6 | node 临时脚本扫描 7 个源文件连续 `//` 行块与 `/* */` 块（>3 行输出） | 0 输出（ALL CLEAN） |
| 语法检查 | `node --check`（5 个 self-checks .js）+ 提取 main-view.vue `<script setup>` 后 `node --check` | 全部通过 |
| 像素断言审计（knowledge `canvas-pixel-assert-anchor-drift`） | 全扫 self-checks 中 enum 改写夹具关联的像素采样坐标 | 不受影响（见下） |

像素断言审计明细（enum→text 使状态列 `_align` center→left）：
- painter.js 自检主夹具状态列 x∈[200,300)：采样点 (250,90) 期望 `bgStripe`——改后文本左对齐 [208,236) 远离采样点（改前 center 锚 [235,263) 亦未覆盖该列像素），通过且更稳；(250,100) 为参考线覆盖点，与对齐无关。
- L1019 `assertHasDarkPixels(208,80,...)` 属 veil 检查的自定义 itemColumns 夹具，与状态列无关；L1334 属 R4b 自定义两列夹具。
- “固定列表头”检查（scrollLeft=180）：状态 caption 改后左对齐 [28,56) 落入固定表头禁区 [24,58)——恰真实行使 `paintHeaderCells` 的 clip（改前 center 锚在区外、未触发该路径），断言 `zone == null` 仍成立。
- 2 处窄列夹具（Σ=350）：仅采样末列线 x=349 与延伸区 x=450，状态列文字坐标无断言。
- colWidths 断言：主夹具/窄列夹具状态列均带显式 width 100，列宽数值不变；“全类型默认宽”场景状态列默认宽 100→160 属 demo 页视觉（无断言），为设计 §8 既定改写。

人工抽样核对（#6 后半）：压缩后注释保留关键算法锚点——Fenwick 倍增下降（row-geometry）、估高 1 行下界与精算同源 wrapLines、滚动锚定补偿、槽位锚公式与 +0.01 浮点容差（cell-painters）、bandToX/blankTail 三处同源派生式（painter）、blur 兜底三判据（editor）。

## 遗留

1. **S0 性能基线未采集（环境阻塞，验收 #5 基线侧）**：实施环境无 playwright MCP 且 `http://localhost:3000/` demo watch 服务未运行（curl 000），M1/M2 改前基线无法按设计在 HEAD 7113e14 上采样。改动已落地，改前基线需调度者裁定补采方式（如独立 git worktree 检出 7113e14 起临时 demo 服务采样），或按“无基线单侧复测”豁免。M1/M2 采样口径见设计测试计划 #5（`host` = `.mu-table-ex`，7 次 props.records 直替 + 100ms 后读 `lastPaint.elapsed` / 归一化 `lastRelayout.elapsed`，中位数判据 ≤ 基线 ×1.10，`scanCount = 100000` 核对）。
2. **demo 服务未启动**：verifier 浏览器验证前需先起 `npm run demo:build`（rollup watch + :3000 serve）；URL 前缀 `/data/`（`http://localhost:3000/data/table-ex/`）。注意 knowledge `demo-watch-wipes-dist`（重建清空 outDir）。
3. **浏览器依赖项 UNVERIFIED（本环境）**：测试计划 #2②③（等级列/状态列下拉交互）、#4（页面渲染与像素采样）、#5（M1/M2 复测）留给 verifier；demo 自检面板断言已全部就位（页面加载自动跑，新增断言覆盖验收 #2 全部子项）。
4. **知识库过期条目**：`agent-docs/knowledge/INDEX.md` 中 “Cannot convert undefined or null to object（列夹具）`prepareColumn({type:'enum'})` 缺 mappings 即抛” 陷阱在本改动后失效（text 列不抛）——设计未解问题 4 已裁定不属本设计范围，由主会话按 project-knowledge 流程在任务收尾处理。
5. number 列带 mappings/options 时未命中的非空值按设计 §3 回退**原值**（不再经 Intl 千分位格式化）——demo 等级列取值域全覆盖不受影响；已以自检断言固化该语义，供 verifier 对照验收 #2 时知悉。
