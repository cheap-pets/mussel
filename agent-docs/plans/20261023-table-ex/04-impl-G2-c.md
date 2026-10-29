# 实施记录 — G2-c（editor.js 编辑状态机 + editor 自检断言）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/table-ex/editor.js` | G2-c | 新增。纯逻辑编辑状态机（不 import layout/theme/cell-painters，布局数据传参）：`NON_EDITABLE_TYPES` / `EDITOR_COMPONENTS`（MuInput/MuSelect/MuDateInput/MuSwitch，form/index.js 导入，本地组件对象不依赖全局注册）/ `DROPDOWN_PANEL_SELECTOR` 契约常量；`isCellEditable`（表格级 editable + 列级 editable + editor != null + 排除类型）；`resolveEditorType`（editor.type 显式优先、非法显式回退、列类型缺省映射 text/number/currency→input、enum→select、date/datetime→date、bool→switch）；`resolveSelectOptions`（editor.props.options 显式优先原样透传；否则 Object.entries(mappings) 过滤 default → `[{ value, label }]`，label 取对象 .text 或值本身；value 恒为 mapping key 字符串）；`resolveEditorProps`（editor.props 透传 + number/currency 缺省注入 `{ type: 'number' }`（显式 editor.type 不注入）+ select 缺省注入 options）；`resolveEditorComponent`；`computeEditorStyle`（固定列 left 不随 scrollLeft、top = headHeight + rowIndex×rowHeight − scrollTop）；`isInDropdownPanel` / `resolveBlurFallback`（纯函数三条判据）；`createEditorController({ onCommit })` 状态机——reactive state.editing（视图态：component(markRaw)/props/events/value/style/invalid/message/onEsc/commitOnValueChange/editorType），column/record/recordIndex 上下文持原始引用（emit payload 不经 reactive 代理，父级收到的引用一致）；open（只读判定 → 已在编辑先同步提交 → 组装 → window capture 记录 pointerdown 目标 → setTimeout 0 聚焦：input/select/date 查内部 input、switch 聚焦容器）；分类型提交矩阵：input events { enter 提交, esc 取消, blur 兜底 }、select/date { esc, blur }、switch {}（esc 挂容器 onEsc）；select/date/switch 值变化即提交 = flush:'sync' 的 v-model watch（source 哨兵 UNCHANGED：input 键入不触发、open/close 切换经 oldValue 守卫跳过）；blur 延迟兜底 setTimeout 0 → resolveBlurFallback(editing, activeElement, editorEl, lastPointerdownTarget)；commit 幂等（先清空再 emit，双通道不重复 emit）、validate 失败置 invalid/message 不关闭；cancel 幂等不发事件；destroy（卸载清理 + 停 watch）。模块头注释含 S1 对接契约（模板绑定/open 入参/画布 pointerdown 与滚动调 commit/onUnmounted destroy） |
| `demo/src/data/table-ex/self-checks/editor.js` | G2-c | 替换 G0 占位，10 条断言：编辑器组件/类型解析（四类映射、显式优先、非法回退、与 form/index.js 导出身份一致）；只读判定（表格级/列级/editor 缺失/排除类型含 image 别名）；enum options 转换（Array 形状、排除 default、对象取 text、数字键字符串化 = mapping key、显式透传、空 mappings → []）；resolveEditorProps（number/currency 注入、显式 props/options 优先、select options 注入、demo 数量列显式组合）；定位计算（固定列视口原点、滚动列减 scrollLeft、top/width/height 公式）；打开（value 经 _value → record[field] 回退、input 组装、只读四类拒绝）；提交矩阵·input（Enter 载荷与原始引用、值变化不提交、Esc 不发事件、commit/cancel 双幂等）；提交矩阵·select/date/switch（值变化同步提交恰一次、枚举提交值为 mapping key 字符串、布尔原样、switch 空事件矩阵）；校验（失败 invalid+message 不关闭不 emit、修正后提交、falsy 文案空串）；blur 兜底判据③（真实 DOM 夹具：.mu-dropdown-panel 识别、mu-icon-button 无 href 不可聚焦断言、resolveBlurFallback 四分支、控制器 window pointerdown capture 记录 + 同一判定输入集成断言、双通道幂等） |

decisions「[I1 前]」影响本模块的两条已落实：

- ① blur 兜底判据③ = "焦点在 `.mu-dropdown-panel` 内 **或** 最近一次 window pointerdown 目标在面板内"（编辑开启期间 window capture 记录目标，mu-icon-button 不可聚焦、activeElement 落 body 场景由 pointerdown 判据覆盖）；自检第 10 条含不可聚焦断言与控制器集成断言。
- ⑦ 枚举编辑提交值 = mapping key（字符串）：resolveSelectOptions 产出 value 为字符串键、v-model 回写后原样提交；自检第 3/8 条断言 `typeof value === 'string'` 口径（数字键 mappings 同断言）。

G1-b 衔接契约对齐：layout 数据（colLefts/colWidths/rowHeight/headHeight/scrollTop/scrollLeft/fixedCount）由组件壳经 `computeEditorStyle` 入参传入，editor.js 不 import layout.js；widthOverrides 等布局状态与本模块无关。

## 偏离

1. **`NON_EDITABLE_TYPES` 在设计排除清单 `['rec_no','img','link','tag','check']` 基础上追加 `'image'`**。证据：设计 A6 只读控制（02-design.md:427）字面无 image；但列类型注册表 `src/components/table/column-types/index.js:29` 存在别名 `image: ImageColumn`，img 与 image 同指无编辑器的图片列，字面实现会使 `type: 'image'` 列被误判可编辑。按设计意图补齐别名，自检第 2 条固化。
2. **值变化提交用 `watch(..., { flush: 'sync' })`（同步）而非默认 pre**。依据：MuSelect/MuDateInput 的内部 input 为 readonly（combo-wrapper `editable` 缺省 false → inputAttrs readonly，input.js:57），值变化只来自下拉/面板点选，无键入分帧问题；sync 保证自检可在同步断言"点选即提交恰一次"，且先于 blur 延迟兜底（宏任务），时序结论与设计一致（A6 提交矩阵、风险表 blur 时序行）。
3. **`state.editing.component` 以 `markRaw` 包装**。组件定义进入 reactive 深度代理会丢失组件身份（首次浏览器实测 2 条断言因此失败：editing.component（代理）!== MuInput），且 Vue 官方建议组件对象避免响应式包装；markRaw 后身份断言与模板 `<component :is>` 均正确。
4. 无其他偏离。设计 A6 的"提交时 validate 通过 → emit → 关闭 → nextTick 重绘"实现为"先清空关闭再经 onCommit 回调 emit"：幂等窗口要求先清 editing（设计自身"commit 幂等（editing 已清空则 no-op）"依赖该判据），emit 与关闭在父级观测上同帧同步发生，nextTick 重绘由 S1 在 onCommit 内安排（模块头契约已写明）。

## 自检

| 检查 | 命令/方式 | 结果 |
|------|----------|------|
| 编译校验 | `npx vite build --config vite.demo.config.js`（一次性，与后台 watch 并存，按派发约定；markRaw 修复后复跑） | 通过：built in 573ms，无报错；`demo/dist/data/table-ex/main.js` 173.46 kB（G1-b 后 73.88 kB，含 editor 模块与 form 编辑器组件） |
| 浏览器自检 | playwright 访问 `http://localhost:3000/data/table-ex/`，读取自检面板 | **66/66 通过，其中 editor 模块 10/10 全绿**（含修复 markRaw 前失败的 2 条组件身份断言）；页面 console 0 error（3 条 warning 为其他并行模块 getImageData 提示，非本模块） |
| eslint | — | 未安装（node_modules 无 eslint bin，package.json 无 lint script，同 G1-b）；已按 standard 风格（无分号/单引号/2 空格/`??=`/operator 折行）人工核对 |
| stylelint | — | 不适用：本步骤无 scss 改动 |
| `npm run build`（库构建） | — | 未跑：table-ex 尚未在 `src/components/index.js` 注册（S2 集成步骤），库入口当前不引用本文件；留 S2 全量校验（并发模式：不跑影响全局的命令） |

## 遗留

1. **S1 对接契约**（模块头注释已写全，要点）：`createEditorController({ onCommit })` setup 内创建；模板 `v-if="editor.state.editing"` + `:style="editing.style"` + `@keydown.esc="editing.onEsc"` + 内部 `<component :is="editing.component" v-model="editing.value" :invalid="editing.invalid || null" v-bind="editing.props" v-on="editing.events" />`，invalid/message 经容器 :title；open 入参 `{ column, record, recordIndex, editable, style, getEditorEl }`（style 用 computeEditorStyle）；画布 pointerdown（editing 中）与容器滚动调 `editor.commit()`；`editor.destroy()` 挂 onUnmounted。
2. **setTimeout 0 接线未在自检断言**（聚焦延迟与 blur 兜底定时器本体，各约 6 行薄封装）：check.fn 同步约束下不可等定时器；已断言定时器将使用的判定输入与纯判定函数全部分支，定时器行为留 S1 联调与 A6 浏览器用例（dblclick 聚焦、点空白兜底提交、面板切换月份不关闭）。
3. 自检第 8 条断言了"select 同值回写不触发提交"（watch value===oldValue 守卫）：点选与当前值相同选项时不提交、编辑器保持开启，由 blur/画布 pointerdown 通道关闭——设计未规定该场景，实现取"无变化即无提交"口径，S1/A6 如遇交互问题以此为排查锚点。
4. 浏览器自检在本步骤已实测全绿（与 G0/G1-b 的 UNVERIFIED 遗留不同）；同页其余模块（theme/layout/cell-painters/painter/interactions 占位/data 夹具）无失败项，页面自检汇总 66/66。
