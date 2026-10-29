# 验证报告（第 1 轮）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

不适用（本任务第 1 轮验证）。派发指定「上轮三问题回归抽查」（上一任务链 table-ex-optimization 验收口径）已并入下方验收标准核对「回归」行，逐项重跑通过。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `eslint "src/**/*.{js,vue}" "demo/**/*.{js,vue}"`（全局裸命令 v8.57.0，PATH 实测） | 通过（exit 0） | `✖ 12 problems (0 errors, 12 warnings)`；warning 逐条对账 = 政策允许项：complexity 范围外 ×2（`demo/src/advanced/case-grid-designer/main-view.vue:245` `onResizeMove` 12、`src/events/resize.js:60` `sweep` 12）+ max-len ×10（case-form ×3 / gesture / table-ex main-view:217 / self-checks spans.js:336 / data/table:16 / grid-box:5 / scrollbar:113 / split-box:89）；`src/components/table/ex/` 内 complexity 零告警（B 线 5 处重构 + 2 处豁免均生效） |
| `npm run build` | 通过（exit 0） | 4 次 vite build 全部 `✓ built`（日志存 `evidence/build.log`，mussel.ex.js 653.40 kB） |
| `npx stylelint "src/**/*.scss"` | 通过（exit 0） | 零输出 |
| `grep -rn "console.count" src/ demo/src/` | 通过 | 零命中（C 线临时埋点无残留，04-impl 声明证实） |
| `curl http://localhost:3000/data/table-ex/` | 200 | 验证环境存活（实施会话维持的 watch 服务，本验证未启停服务） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1. eslint 零 error + warning 政策留痕 | 命令 | 见命令结果表：0 error / 12 warning，与设计「裁定 #2」表逐条对账吻合（豁免注释实测存在于 `row-geometry-controller.js:349-350`、`row-geometry.js:370-371`，`git diff` 证实两文件为纯注释增量 +2 行） | PASS |
| 2. 优化落地无回归 + 性能不劣化 | 命令 + 浏览器 | ① 「重跑自检」**187/187**（真实点击按钮后重跑，非仅初始值）；② `npm run build` ✓；③ stylelint ✓；④ 性能协议（playwright evaluate，`CanvasRenderingContext2D.prototype.setTransform` 劫持为每 paint 恰 1 次的绘制计数器——painter.js:1243 为 ex 模块唯一调用点）：夹具 default→多行文本真实点击 **paints=1**（04-impl 基线 +2 → 判据 ≤1 达成），`lastRelayout = {elapsed 1.8ms, scanCount 3, rebuild true}`（单次合并完成全部工作，与 04-impl P1 签名逐字同构）；props 同批双源替换 ×3 → 每次 **paints=1**、批量 wall-clock 中位 **192.0ms**（190.7/192.0/193.2；04-impl 留痕 165.4ms、五 watch 基线 179.9ms——同量级；本口径含 1ms 轮询检测延迟，另一固定 80ms 等待口径将工作量上界压至 ~137ms，均不劣于五 watch 基线量级）；滚动 lastPaint 6 样本中位 **1.6ms**（1.2–1.8）vs 04-impl 1.2ms——绝对差 0.4ms < 1ms 判据 ✓；锚点 **444 / 3,600,036 / 懒加载 3→6 行** 逐一不变 ✓；spans 场景切换 ch=**1188**（32 行）与留痕一致 ✓；⑤ C 线单源等价冒烟：仅 records / 仅 recordsVersion / 仅 fixedLeftColumns / 仅 orderBy 各源变化每次恰 **1** relayout ✓ | PASS |
| 3. demo 两新页 | 浏览器（playwright DOM/像素断言） | ① `/data/table-ex-basic/`、`/data/table-ex-scene/` 均 200（导航成功、标题正确）；② 基础页 4 section = 设计①最小挂载/②列型/③排序固定列/④样式 hover；列型表横向滚动后 tag 绿 pill（rgb≈56,184,72）、进度蓝填充（≈72,152,248）、红/indigo 按钮 pill、img 蓝块像素齐；排序真实点击表头三态循环 `orderBy: ''→name:asc→name:desc→''`（tip 文本实测），首行墨迹 hash 三态互异（行序随排序重绘）；固定列（收窄容器触发溢出，运行时样式不动源码）：scrollLeft 0→182 后固定区 0..188css 逐字节 hash+ink 不变（5103px 相等）= 不位移，滚动区 hash 全变；③ 场景页：编辑真实点击进编辑器（INPUT 预填「物料 1」）→ 真实键盘 Enter → tip `最近提交：#1 name → "编辑后的名称"` + record[0].name 就地改值 ✓；树懒加载全链见「回归」行；合并区：autoRowSpan 合并列段内无横线（分类列 y72/y108 ratio=0，边界 y144/y180=1.0）、spanMethod 小计行 `rest` 吞段内纵线（x=590 小计行 0 vs 普通行 0.33）✓；异步「模拟异步增量」点击 → records 5→8（末行 `增量行 8`）、ch 216→324 ✓；④ 首页导航两条目收录且序 = 基础 → 场景 → 验证页（catalog.js:117/122 与设计逐字一致） | PASS |
| 4. 文档三处同步 | 命令 + 代码交叉 | `git grep` 反引号事件名三处命中：`skills/mussel-ui/references/components/data.md:266-267`、`docs-site/components/table-ex.md:196/255-256`、`docs/quick-reference_components.md:1770/1781-1782`；三处 `tree-props` 行均含 `{ key, parentKey, isLeaf }` + 未映射不生效语义；docs-site 树模式正文（:191/:196）含 isLeaf 懒加载段；措辞与实现一致：`tree.js:135` `hasKids \|\| isLeafOf?.(record) === false` ↔ 「`字段 === false` 且无子级显三角」，`use-tree-rows.js:161` emit expand/collapse ↔ 事件表，实测载荷 `{ key: 200001, record: "#200001", level: 0 }` ↔ 文档 `{ key, record, level }`，回填描述 ↔ 就地 push + records-version++（demo 活样例同款） | PASS |
| 回归. 上轮三问题保持 | 浏览器 | ① 单元格文本居中像素断言（items 夹具，ink 质心 lum<170，dpr1.5）：tag/进度/按钮 ×6 格 ink 中心 54.66–55.31 / 125.03–125.19，与上轮同锚 55/125 偏移 ≤0.7px（上轮口径 ≤1px）✓；② 夹具「多行文本」切换（真实点击）：`paints=1`、contentHeight=**444**、variable、scrollTop=0；全宽格线实测 css **35.67/232.33/302.33** ≈ 精算累加 36/232/302（±0.33px），估高旧位 284/354 邻域零格线 ✓；③ isLeaf 懒加载全链（真实鼠标点击）：懒根箭头槽 ink 114/120px 实心三角、普通叶 18px（与上轮逐字一致）→ `tree-expand {"key":200001,"record":"#200001","level":0}` + `update:tree-expanded-keys {keys:[200001]}` → 回填 `懒加载回填（recordsVersion++）` → records **3→6**、contentHeight **144→252**、scrollTop **0**（不闪顶）→ 再次点击 `tree-collapse` 同载荷、keys=[]、ch 回 144 ✓（场景页独立复测：懒根 102 三角 120px → expand → 3 子级 2001-2003 → 5→8 行、ch 216→324、scrollTop 0、expandedKeys [101,102]） | PASS |

## 范围核对

- 基线：`mussel-table` @ `1c8f326`，与 00-task 一致；HEAD 未移动（`git log --oneline -1` = `1c8f326`），无 commit。
- 基线排除项（上轮任务链产物，00-task 基线声明）：src/ex 6 文件（cell-painters/interactions/painter/table-ex/tree/use-tree-rows）、demo/src/data/table-ex 4 文件（main-view.vue + self-checks ×3）、`agent-docs/knowledge/INDEX.md` + project ×3（INDEX:39-41 已索引，diff 为行尾归一）、`agent-docs/plans/20261029-table-ex-fixes/`。其中与设计改动清单重叠的 8 文件（table-ex.vue、spans.js、cell-painters.js、painter.js、tree.js、use-tree-rows.js、interactions.js、demo 验证页 main-view.vue）标**无法区分**——设计「风险与回滚」已记录叠加事实并约定 hunk 级回滚，04-impl「改动文件」表逐文件登记，不下结论。
- 本轮新触文件逐一对照设计改动清单：`.eslintignore`（+`demo/dist`）、`.eslintrc`（globals `__version__` readonly + 注释）diff 与设计逐字一致；`demo/src/catalog.js` 两条目插于 `data/table-ex` 之前，与设计接口节逐字一致；demo 21 个非 table-ex 文件经空白剥离 hash 比对 = **15 个纯格式**（SAME）+ **6 个内容差异全部为设计点名项**（calendar/color-input/date-input/pagination quotes --fix、status-box 删未用 `ref` 导入、side-menu `_`→`_unused` 改名），零清单外内容变更；`row-geometry-controller.js`/`row-geometry.js` 纯注释 +2 行 ✓；`self-checks/spans.js` 仅 :125/:259 quotes 两处（探针已删 ✓）；`spans.js`/`cell-painters.js`/`table-ex.vue` 为 B/C 线主体 ✓；新目录 `demo/src/data/table-ex-basic|scene/` ✓；文档 3 文件 ✓。
- 未跟踪：`agent-docs/knowledge/project/` ×3 + `agent-docs/plans/20261029-table-ex-fixes/`（基线内产物）、`agent-docs/plans/20261029-table-ex-optimize/`（任务目录，排除）、`demo/src/data/table-ex-basic|scene/`（设计内）。
- 验证产物：`dist/`（.gitignore 覆盖）、`.playwright-mcp/`（自带 `*` / `!.gitignore` 合规）、`evidence/build.log`（任务目录内）。均不入 status。
- 设计外改动：无「未记录」项。并行白名单：不适用（串行实施）。

## 测试质量问题

无。本轮按设计不新增测试文件（187 自检套件为安全网，临时探针按设计删除，交付 diff 已证实零残留）；demo 两新页本身即验收载体，断言由本验证以事件日志/数据/像素级证据完成，非「不抛错」级。上轮 187 自检断言的价值级已在上一轮验证确认（值级断言）。

## 需人工检查

无剩余项。设计测试计划标准 4 标注的「人工通读措辞」已由代码级交叉核对覆盖（事件名/载荷/回填语义与 `tree.js:135`、`use-tree-rows.js:161-166` 实现逐点一致，术语对齐 tree.md）。

## 环境阻塞

无。:3000 全程可用；本会话真实鼠标/键盘输入正常（上一轮曾出现的 CDP 输入不投递怪癖未复现）。

## 失败项

无。

## 发现项（非阻塞，建议后续处理）

1. 【小问题】`demo/src/data/table-ex-basic/main-view.vue` 列型表 `img: null` 夹具触发一次控制台 404：`GET /data/table-ex-basic/null`。定位：`src/components/table/ex/cell-painters.js:821`（`measureItem` img 分支）`requestImage(item.attrs?.src, ...)` 缺空值守卫，`image.src = null` 被浏览器转为相对路径 `"null"`；绘制端同文件 `:1265` 已有 `if (!src) return`，度量端漏配。每次页面加载至多一次（缓存键 null 后不再重发），无功能影响，不属验收标准范围。
2. 【备忘】批量 wall-clock 192.0ms 与 04-impl 留痕 165.4ms 的差值主要来自测量协议差异（1ms 轮询检测延迟 vs nextTick 精确时刻），非行为劣化证据；后续轮次建议统一采用 `lastRelayout.elapsed`（组件内计时）作主口径。
