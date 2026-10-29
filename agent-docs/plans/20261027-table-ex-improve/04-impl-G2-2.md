# 实施记录：G2-2（self-checks/editor.js）

模式：并发（波 2a / 步骤 G2-2）。白名单：`demo/src/data/table-ex/self-checks/editor.js`（仅此文件）。
依据：`02-design.md` 测试计划 A3/A4/A5 行、「改动清单」self-checks/editor.js 行、问题 3/4/5 节自检改写要点；最终 API 以 `04-impl-G1-a.md` 记录并经当前 `src/components/table-ex/editor.js` 源码核对（editorRectOf 恒等、editorButtonRectOf 槽位式、NON_EDITABLE_TYPES 含 link/button/progress、resolveEditorType 无 link 分支、computeEditorStyle 无 gridlines/theme 参）。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| demo/src/data/table-ex/self-checks/editor.js | G2-2（A3/A4/A5 断言同步） | 整文件改写：删 `EDITOR_GAP` 具名导入（原 :27），新增 `editorButtonRectOf` 导入；模块头 docblock 与各断言组按问题 3/4/5 新口径改写；checks 块 14 → 15（新增 editorButtonRectOf 几何块）。未改源码、未改其他 self-checks 文件 |

改动摘要（按块）：

1. **编辑器解析块**：link 直调断言由「→ textarea」改写为「→ input（分支已删，未知类型回退）」并注明实际被 isCellEditable 拦截；块返回消息「text/link 形态判定生效」收窄为「text 形态判定生效（link 回退 input）」。
2. **只读判定块（A4）**：块名改「link/button/progress 不可编辑」；删除 `assert(!NON_EDITABLE_TYPES.includes('link'))` 与 `link 列可编辑` 两条旧断言，反转/新增为——link/button/progress 三类型「在排除清单 + isCellEditable false」双断言循环，并新增 open 通道同判（createSpyController：三类型 open 返回 false、无编辑态、不产生提交）；返回消息更新为含 link/button/progress 的完整排除清单。
3. **值类型规整 open 块**：caption 拼接夹具列由 `{ type: 'link' }` 改 `{ type: 'text' }`（normalizeEditorOpenValue textarea 分支列类型无关，link 已不可编辑），注释改记「由 text 列的对象数组值承接」。
4. **computeEditorStyle 块（A3）**：base 夹具删 `theme` 字段；期望值全部按整格矩形重算——固定列 `[4,69,91,27] → [0,64,100,36]`、switch/textarea/borderless 三态同矩形 `[0,64,100,36]`、滚动列 `[54,40,72,28] → [50,36,80,36]`、变高行 `[77,91]（top/height）→ [100,72,200,100]（左/顶/宽/高 4 值）`、退化 height 0 保持、noFixed `left 54 → 50`、`top` 期望去掉上格线 +1（`36+72−100 = 8`）；删除「EDITOR_GAP 导出值 = 4」「gridlines none 全向无扣除」「theme: undefined 同矩形」三条失去语义断言；三类型/border 两态同矩形断言保留、理由改注「矩形恒等」。
5. **editorRectOf 块（A3）**：由「R3 格线内缘等距」改写为「恒等映射 = 整格矩形」——常规格 `[64,77,131,27] → [60,72,140,36]` 恒等四值 + 边缘格 `[0,0,80,36]` 恒等（topGridline/rightGridline 特判参数已删）；删除原块内 `gridlines: 'none'` 的 computeEditorStyle 断言。
6. **新增 editorButtonRectOf 块（A5）**：默认参几何 `[128,6,24,24]`（right-align x = 格右−padding−24；centerY = 格顶+ROW_TOP_INSET(1)+padding+lineHeight/2 = 18）；超高行 h=88 时 x/y 不变（显式断言槽位锚不使用 rect.height，与 A1 同式）；自定义 padding/lineHeight `[204,51,24,24]`；偏移格 `[188,206,24,24]`。
7. **提交矩阵·textarea 块**：原 link 列 caption 拼接段（:754-769）改由 **text 列 + 对象数组**承接（normalizeEditorOpenValue/normalizeTextareaCommitValue 通用逻辑覆盖不丢失）——open → textarea、开值取 caption 拼接 `A\nB`、Ctrl+Enter 提交 `['A','B','C']`（属性不保留）；块返回消息同步。
8. 未动块 8 个：commit 规整、enum options、resolveEditorProps、打开、提交矩阵·input、提交矩阵·select/date/switch、校验、blur 兜底（既有惯例 withCanvas/assertPixel 不涉及本文件；本文件既有 assert/assertEqual/assertArray/createSpyController/mountBlurFixture 惯例全部保留）。

## 断言清单（计数）

- **新增**：checks 块 +1（editorButtonRectOf，5 条断言）；只读判定块新增 open 同判段（5 条断言：3 类型 open false + 无编辑态 + 零提交）与清单成员断言（3 条，循环内）。合计新增断言调用 13 条。
- **改写**：6 个断言组的期望值/谓词（编辑器解析 link 回退、只读判定 link/button/progress 反转、open 规整夹具列、computeEditorStyle 整格期望值（含变高行 2 值 → 4 值、noFixed 2 条）、editorRectOf 恒等 2 条、textarea 提交矩阵对象数组段 4 条）。
- **删除**：3 条 outright（`EDITOR_GAP === 4`、`gridlines: 'none' 无扣除`、`theme: undefined 同矩形`）+ 2 条以反转形式重写（`link 不在排除清单`、`link 列可编辑`）。
- 块数：14 → 15。

## 自检（完成判据逐条）

| 判据 | 方式 | 结果 |
|---|---|---|
| eslint 单文件通过 | `NODE_PATH=/usr/local/lib/node_modules npx eslint demo/src/data/table-ex/self-checks/editor.js` | **0 error / 0 warning**，exit 0（沿用 G1/S 各组环境备注：本地 node_modules 缺 eslint-config-standard，经全局 NODE_PATH 解析） |
| 断言可被 node 直调可行性走查 | /tmp 最小 vite 构建（复用项目 pluginVue/pluginSvg/`@`、`~icons` alias/`$colors` 注入同参，vue 内联，产物写 /tmp 未触碰仓库）→ node 直调 checks 数组 | **14 passed / 0 failed / 1 skipped**。skipped = blur 兜底块（挂真实 DOM 夹具 document/PointerEvent，既有惯例即浏览器面板运行，非本次改动引入）。node 侧需两个环境桩：`window`（控制器 open/teardown 挂 window pointerdown 监听，浏览器既有行为）、`__version__`/`__env__` define（项目 vite.config 同名注入）；均为走查 harness 产物，非代码改动 |
| 断言对齐 G1-a 实际导出 | 直调结果逐块与 `src/components/table-ex/editor.js` 当前实现核对：editorRectOf 恒等、editorButtonRectOf 槽位式（centerY 18 不随 rect.height）、NON_EDITABLE_TYPES 八类型、link open 拒绝、computeEditorStyle 整格四值 | PASS（设计测试计划 A3 行的整格期望值 `[0,64,100,36]`/`[50,36,80,36]`/`[100,72,200,100]` 与实测一致） |
| 白名单 | `git status`：本轮本组仅 `demo/src/data/table-ex/self-checks/editor.js`；树中 main-view.vue 为 G2-1 并发在途，badge.*/props.js/background.scss 为先前已在途状态，均未触碰 | PASS |

## 偏离

无。两点边界内说明（非方案偏离）：

1. 值类型规整 open 块的 caption 夹具列由 `type: 'link'` 改为 `type: 'text'`——设计改动清单仅点名 :709-777 提交矩阵块「改由 text 列承接」，但同一断言组内 open 侧夹具同为 link 列载体，与「link 已不可编辑」口径不一致；normalizeEditorOpenValue 的 textarea 分支本就列类型无关，改夹具列不改变断言语义，属同一改写要点的连带同步。
2. node 直调走查中 blur 兜底块跳过——该块挂真实 DOM 夹具，既有惯例即浏览器自检面板运行（文件头注「留浏览器用例」同口径），不属于本组可 node 验证范围；页面级验证（A9 全量）按派发约束不在本组执行，待 G2 整组落地后由 V 集成验证执行。

## 遗留

- 本文件改写后自身断言已绿，但 demo 页面 boot 仍依赖其余 self-checks 文件收口（self-checks/painter.js:20 的 `EDITOR_GAP` 具名导入归 G2-4），整包可运行性按设计属 G2 集成态，不在本组判据。
- eslint 需 `NODE_PATH=/usr/local/lib/node_modules` 前缀（环境备注，同 G1/S 各组记录；V 步 A10 全量 lint 时沿用）。
