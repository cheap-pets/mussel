# 实施记录 — G2-b（interactions.js 纯逻辑 + interactions 自检断言）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/canvas-table/interactions.js` | G2-b | 指针交互纯逻辑（不绑任何事件，DOM 接线留 S1）：`RESIZE_MIN_WIDTH=40` 契约常量；`hitTest`（isHeader/colIndex/rowIndex/resizeCol 四元组，手柄仅表头区检测，行列换算与固定列排除委托 layout.js `colAt/rowAt/findResizeColumn`）；`resolveCursor`（col-resize / pointer / default）；`resolveOrderByNext`（无→asc→desc→无，orderBy 解析同 table.vue sortDirection，异常方向按无处理）；`isCheckHeaderColumn` + `resolveHeaderClick`（check ✓ 表头只发 `update:header-checked` 不发 header-click，headerChecked 受控对象缺失时 ✓ 不渲染回退普通表头——table.vue:20/22/25 同款；其余表头均发 header-click，可排序列另发 `update:order-by`，payload 取 `_raw` 原始列）；`resolveCellClick`（check disabled 跳过翻转但仍续行选中+cell-click；事件顺序 cell-value→selected-record-key→selected-record→cell-click；key/record 与当前选中一致时不发对应事件；返回 `toggled` 供 S1 nextTick 重绘该行）；`resolveResizeWidth`（clamp(pointerX+scrollLeft−columnLeft, minWidth??40, maxWidth??∞)）；`resolveResizeDirty`（move 脏区左界=列左缘至视口右端 + 表头整幅 flag）；`resolveHoverDirtyRects`（row/column/cross/cell 模式旧+新脏带矩形，同位置去重，固定列视口坐标/滚动列减 scrollLeft）；`resolvePointerdown`（editing 中先同步 commitEditing 再续命中，手柄命中 startResize）；`resolveCellDblclick`（仅表体可编辑格 openEditor，cellEditable 由组件壳按 A6 只读链解析后传入）；`createClickGuard`（拖拽误触抑制：consume 消费即清除；pointerup 后 release() 延时清除，schedule 可注入——decisions「[I1 前]⑧」）；`createFrameScheduler`（rAF 合帧，同帧多次 schedule 合并为一次回调，cancel 供卸载，raf 可注入）。无 DOM 依赖，两个工厂的定时器/raf 均可注入以便同步测试 |
| `demo/src/data/canvas-table/self-checks/interactions.js` | G2-b | 13 条断言填充（替换 G0 占位空数组）：hitTest 表头/表体/手柄/越界（手柄仅表头区）；resolveCursor 三态；排序 next 循环（含其他字段、非法方向、无方向后缀）；表头点击事件序列（可排序列双事件、非排序列仅 header-click、payload 为 _raw）；check ✓ 表头仅 update:header-checked + headerChecked 缺失/无 headerCheckbox 回退普通表头；check 列翻转并续行（4 事件顺序 + toggled）；disabled 跳过翻转仍续行 + 选中一致去重 + 非 check 无翻转；调宽 clamp（scrollLeft 补偿、缺省下限 40、min/max）；move 脏区左界=列左缘（含加宽场景左界不随旧右缘收缩、超视口带宽 clamp 0）；hover 脏带（行带/列带/交叉/单格/去重/移出移入/none/固定列视口坐标）；pointerdown（editing commit 先行、手柄开拖、二者并存）与 dblclick 门控（表头/列越界/cellEditable 缺省不开）；clickGuard（consume 即清、release 延时窗口内消费、延时后清除、canvas 外释放无残留——注入同步队列验证）；frameScheduler（同帧合并/帧边界重置/cancel/缺省 raf 容错） |

decisions「[I1 前]」影响本模块的一条已落实：⑧ 拖拽误触抑制为「pointerup 后延时清除」实现（`createClickGuard.release()` 经可注入 schedule 挂延时任务清 flag；缺省 setTimeout 0——click 在 pointerup 同一任务内同步触发，先于延时任务被 consume 消费，commit 语义与 kaka EventBinding「消费即清除」一致）；「按 pointerup 坐标判定」为决策给出的二选一备选，未采用（延时清除已覆盖 canvas 外释放残留场景，且有判定坐标的方案需在 guard 内持坐标状态，纯逻辑契约更重）。

## 偏离

无。补充说明（非偏离）：

1. **interactions.js 与 layout.js 的分工**：命中检测的坐标↔行列换算与手柄判定不重复实现，`hitTest` 组合调用 G1-b 的 `rowAt/colAt/findResizeColumn`（G1-b 遗留 3 预告的对接口径：x/y 为相对 canvas 视口坐标）；本模块新增的是命中之上的**决策层**（事件序列、动作列表、脏区、光标）。
2. **check disabled 的来源契约**：`resolveCellClick` 的 `disabled` 由 S1 从单元格 items `attrs.disabled`（check.js compile 经 ensureFn 产出）解析后传入——disabled 函数闭包在列准备阶段已编译进 `_render`，纯函数无法从列定义重算，与 G1-c cell-painters 的绘制判定同源（同一 attrs 驱动置灰与点击跳过，二者天然一致）。
3. **emit 动作以 `{ name, args }` 列表返回**而非函数内直接 emit：保持纯函数无副作用（A8 模块间通信约定），S1 循环 `emit(ev.name, ...ev.args)` 执行；自检据此对事件序列做精确断言。

## 自检

| 检查 | 命令/方式 | 结果 |
|------|----------|------|
| 断言逻辑（Node 预验） | 临时脚本：interactions.js 与 self-checks/interactions.js 原文（仅重写 import 路径 + getPixelNumber/resolveColumnType stub，layout.js 用真实源码）在 Node 24 执行全部 13 条 | 13/13 PASS（期间修正 1 条自检预期错误：「选中一致去重」用例传了 check 列且未禁用，update:cell-value 本应发出，按语义修正断言预期；模块代码无改动）；临时脚本已删除 |
| 编译校验 | `npx vite build --config vite.demo.config.js`（一次性；与后台 watch 进程并存，按派发约定） | 通过：built in 573ms，无报错；`demo/dist/data/canvas-table/main.js` 136.19 kB（含并行组已落地模块与本模块） |
| 页面自检区浏览器执行 | playwright 访问 `http://localhost:3000/data/canvas-table/`，读自检结果面板 DOM | 全站自检 56/56 通过；其中 `[interactions]` 模块 13/13 全绿（failing 列表为空）；console 0 errors（3 条 warning 来自 cell-painters 自检的 getImageData，G1-c 范围） |
| eslint | — | 未安装（同 G1-b 记录：node_modules 无 eslint bin、package.json 无 lint script）；已按 standard 风格（无分号/单引号/2 空格/函数名后空格）与 layout.js 既有风格人工核对 |
| stylelint | — | 不适用：本步骤无 scss 改动 |

## 遗留

1. **S1 对接契约（本步骤定义，S1 实施者需知）**：
   - 事件绑定接线（`__sticky` 层 pointermove/pointerdown/click/dblclick、拖拽期 window 级 pointermove/pointerup）全部留 S1；S1 在处理器内调用本模块决策函数后执行 emit 与状态更新；
   - `resolveCellClick` 入参 `recordKey/disabled/value` 由 S1 解析：recordKey 按 keyField（无 keyField 时经 key-builder）；disabled/value 从 `resolveCellContent` 产出的 check items attrs 读取（`disabled != null && disabled !== false`，与 G1-c drawCheck 判定同款）；
   - `resolveResizeWidth` 的 `pointerX` 为相对 canvas 视口 x（window 级 pointermove 的 clientX 需先减 canvas rect.left）；move 中 S1 自行以 widthOverrides（按列 key）暂存拖宽并临时更新列几何（G1-b 遗留 3 同款），up 时 `release()` → emit `column-resize` → relayout；`resolveResizeDirty` 返回值交 painter 做带 clip 的脏区重绘（band + 表头整幅）；
   - `resolveHoverDirtyRects` 产出视口坐标矩形数组，S1 在 `createFrameScheduler` 合帧回调内交 painter clip 重绘（rAF 合帧已在本模块提供调度器本体）；
   - `resolveCellDblclick` 的 `cellEditable` 链（A6 只读控制：editable / column.editable / editor 配置 / 列类型排除表）归 editor.js（G2-c）与组件壳，本模块只做命中门控；
   - click 处理器统一先 `guard.consume()`：true 则丢弃该 click（含表头排序点击），再走 resolveHeaderClick/resolveCellClick。
2. `painter.js`（G2-a）与 `editor.js`（G2-c）为并行组文件，本步骤未触碰；页面当前全站自检 56/56（theme 11 + layout 14 + cell-painters 18 + interactions 13）已包含并行组已落地部分。
3. 坐标级交互实测（真实拖拽/点击手柄）属 S3 验证阶段（依赖 S1 的 DOM 绑定与 getCellRect 坐标辅助），本步骤纯逻辑断言已在浏览器内全部执行通过。
