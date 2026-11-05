# 实施记录

模式：集成（片 1 → 片 2 → 片 3 串行，一次完成）。依据：02-design.md 修订 4（实施清单 19 项 + 片间依赖）。前次派发（run.log #6）因配额超限中断，片 1 改动已落地但 04-impl.md 未产出；本轮核实片 1 全部改动与设计一致后，补齐片 2、片 3。

## 改动文件

### 片 1：icon 列 + install 时码点解析（前次派发落地，本轮逐项核实）

| # | 文件 | 步骤 | 内容 |
| --- | --- | --- | --- |
| 1 | `src/icons/index.js` | 1 | install 时 cls 项码点解析：`{ glyph, fontFamily, glyphStatus }` 存注册表项（glyph 不参与 hash）；两跳重试（fonts.ready + rAF，模块级去重调度）；SSR / 无 body 跳过；同名同 cls ready 幂等继承（定案 e）；导出 `whenGlyphReady`；ready 但字体未就绪的单次 `fonts.ready` flush 集 |
| 2 | `src/components/table/column-types/icon.js` | 2（新文件） | `IconColumn` 双通道 compile（canvas 单条目 items 数组 kind/icon/color/size/title；DOM `mu-table__icon-cell` + mu-icon + text-{color} + 内联 font-size，svg 形态 innerHTML、cls 形态省略键）；`resolveIconEntry` 导出（查表 + 未注册 dev warn，无负缓存）；size 归一（非正回退 16）；value == null 静默、非 string / 未注册空产物 + warn |
| 3 | `src/components/table/column-types/index.js` | 3 | `ColumnTypes` 注册 `icon: IconColumn` |
| 4 | `src/components/table/column-types/style.scss` | 4 | `.mu-table__icon-cell > .mu-icon`（inline-block 1em + `> svg` block 1em，不依赖 icon.scss 打包） |
| 5 | `src/components/table/ex/cell-painters.js` | 5 | 导出 `drawIconGlyph`（svg → requestIconImage 管线 loaded 才 drawImage；cls 直读注册表项 ready 才 fillText、pending 登记	whenGlyphReady、failed 跳过；无 glyphCache/resolveIconGlyph 状态机）；`requestImage` 多监听（listeners 累积、onload 一次 flush、onerror 清空，返回契约不变）；`measureItem` icon 分支（min(size, contentWidth) 方形占位）；`drawItem` icon 分支（maxWidth ≤ 0 防御、色名查表回退 textColor、textAlign left） |
| 6 | `src/components/table/ex/editor.js` | 6 | `NON_EDITABLE_TYPES` 追加 `'icon'` |
| 7 | `src/components/table/ex/row-geometry.js` | 7 | `GRAPHIC_ITEM_TYPES` 追加 `'icon'` |
| 8 | `demo/src/data/table-ex/main-view.vue` | 8 | icon 列夹具两列（内置 svg 名 `clock` + 注入 cls 名 `demoGlyphA/B` + 未注册 `noRegGlyph` / 空值负向夹具；color 函数 + iconOption.size 20 用例）；页面 `installIcons({ demoGlyphA/B })` |
| 9 | `demo/src/data/table/main-view.vue` | 9 | base table icon 列夹具两列（svg 名 4 行 + title: true；color/size 用例），type 列表说明补 icon |
| 10 | `demo/src/common/style.css` | 10 | `.mu-demo-glyph-a::before`（`\25CF` 转义）与 `.mu-demo-glyph-b::before`（`●` 字面）注入 class |
| 11 | `demo/src/data/table-ex/self-checks/cell-painters.js` | 11 | recordingCtx 增记 `drawImage`；icon 断言 5 块：双通道 compile 产物形状、非法值/未注册空产物 + warn 捕获 + placeholder、install cls 解析（转义/字面两形态 ready + whenGlyphReady 不回调 + 重注册幂等）、drawIconGlyph cls fillText（font/x/锚/color）与 svg 同步 Image 桩 drawImage（16×16 @72,11）、resolveIconEntry 命中/未注册 |

### 片 2：button 列图标按钮（本轮）

| # | 文件 | 步骤 | 内容 |
| --- | --- | --- | --- |
| 12 | `src/components/table/ex/cell-painters.js` | 12 | `BUTTON_ICON_SIZE = 12` / `BUTTON_ICON_GAP = 4`（常量与 `drawCanvasKindContent` 的 onImageLoad/row/colIndex 透传为前次派发提前落地，本轮核实）；本轮补：`ellipsizeButton` 图标感知测宽（caption 区 maxWidth 扣 12+4、空 text + 无图标 null 哨兵 / 有图标 icon-only 固定宽降级、右缘剩余 < 内距 + 图标宽终止）；`drawButton` 接收并透传 onImageLoad/row/colIndex（onLoad 闭包）；`drawButtonPill` 图标前置（icon+caption icon x = x + 8、icon-only pill 内居中 x = x + 4；色 = 同一文本色变量常态 buttonTextOf / hover 反转 bgNormal；icon-only 不 fillText）；`drawButtonLink` 图标前置（x = 条目起点、色 = 同一 fillStyle 链含 hover 谱系与 disabled 置灰；icon 恒保留、caption x = 12+4 偏移）；`buttonsOverflowOf` 哨兵改「caption 空且无有效图标」（icon-only 固定宽计入）、计宽含 12+4、图标放不下整体不绘制、caption 区放不下降级 icon-only |
| 13 | `demo/src/data/table-ex/main-view.vue` | 13 | 第 1 行 buttons 改三形态夹具：icon+caption（`clock` svg 名）/ icon-only（`demoGlyphA` cls 名）/ 未注册名降级（`noRegBtnGlyph`）；「按钮」「链接按钮」两列同源消费，pill 与 link 形态各渲染一遍 |
| 14 | `demo/src/data/table-ex/self-checks/cell-painters.js` | 14 | button 图标断言块：三形态测宽（50 / 20 / 34）与绘制 x 序（16/32/12/16）、超宽省略只作用 caption（icon x 不变）、右缘剩余 < 28 终止、空哨兵两态（空条目终止 / icon-only 继续）、未注册降级、tooltip 溢出矩阵（纯图标组 null、icon-only 20 计入计宽 44 溢出 / 70 不溢出、icon+caption 含 12+4 计宽 149 > 144 溢出） |

### 片 3：editButton 改造（注册名 + emit + 全局改名，本轮）

| # | 文件 | 步骤 | 内容 |
| --- | --- | --- | --- |
| 15 | `src/components/table/ex/constants.js` | 15 | `EDITOR_BUTTON_AREA`/`EDITOR_BUTTON_ICON_SIZE` → `EDIT_BUTTON_AREA`/`EDIT_BUTTON_ICON_SIZE`，注释改 column.editButton 与收敛说明 |
| 16 | `src/components/table/ex/editor.js` | 16 | `editorButtonRectOf` → `editButtonRectOf`（含 import 改名与 ROW_TOP_INSET 注释引用同步） |
| 17 | `src/components/table/ex/painter.js` | 17 | `paintEditorButton` → `paintEditButton`：门控改 `resolveIconEntry(column?.editButton?.icon)`（未注册不绘制）；绘制改共享 `drawIconGlyph`（svg 走 requestIconImage 缓存管线、cls 直绘 glyph；色 theme.textColor、尺寸 EDIT_BUTTON_ICON_SIZE、x 左对齐区内 16px 槽、centerY = 区矩形中心）；import 改名（editButtonRectOf、EDIT_BUTTON_*、drawIconGlyph 替换 requestIconImage、新增 resolveIconEntry）；调用点改名 |
| 18 | `src/components/table/ex/table-ex.vue` | 18 | `isEditorButtonHit` → `isEditButtonHit` 且门控改 `resolveIconEntry(col?.editButton?.icon)`；`tryEditorButtonClick` → `tryEditButtonClick` 且 `onClick` 属性移除、改 `emit('edit-button-click', { record, recordIndex, column: col._raw ?? col })`（payload 与原 onClick 参数逐字一致）；`defineEmits` 追加 `'edit-button-click'`；import 改名 + 新增 resolveIconEntry；`:810-811`/`:965-968`/`:1043-1045` 注释同步改名 |
| 19 | `demo/src/data/table-ex/main-view.vue` | 19 | 夹具改 `editButton: { icon: 'dots' }`（内置注册名，移除 pencilIcon 直传与 onClick）；模板追加 `@edit-button-click="onEditButtonClick"`（logEvent 记录 payload）；移除 `~icons/outline/pencil.svg` import |
| 20 | `demo/src/data/table-ex/self-checks/painter.js` | 20 | editButton 夹具改注册名：一次性唯一 svg 经 `install({ [editIconName]: svg }, 'svg')` 注册（imageCache 跨检查持存前提保持，「加载中按钮区不半绘制」断言不空转）；「首帧图标加载中」断言改经 `icons[editIconName].svg` 请求（与 paintEditButton 查表链同源）；`editorButtonRectOf` → `editButtonRectOf`（import 与调用） |
| 21 | `demo/src/data/table-ex/self-checks/editor.js` | 21 | `editorButtonRectOf` 引用改名（文件头注释 / import / 断言块名与 4 处调用）；新增 `editButton 门控 resolveIconEntry` 断言块（install 注册夹具名后断言命中返回原引用、未注册名与 undefined 均 null） |

## 偏离

1. 设计「button 列图标绘制」节终止条款「右缘剩余 < padX*2 + 图标宽 → 该条目不绘制并终止」未细分 icon-only 形态（icon-only pill 内距 4px 而非 TAG_PADDING_X 8px，固定宽 20 < 28）。按设计意图（「与 caption 放不下同义」+「icon 恒保留」）修正：icon-only 以固定宽放不下（remaining < TAG_HEIGHT / BUTTON_ICON_SIZE）为终止条件；icon+caption / caption-only 维持设计字面（remaining < padX*2 + BUTTON_ICON_SIZE 终止）。小冲突，不改变协议与行为语义。
2. 设计「icon-only（无 caption）」的判定落地为「caption 经 ellipsize 后空 text」（与既有空哨兵 `!text` 语义完全一致，覆盖空串与纯空白），非字面 `caption === ''` 预判。
3. `drawButtonPill` / `drawButtonLink` 签名追加 `icon` / `onLoad` 位置参数——设计未规定函数签名形态，按周边代码风格（位置参数链）落地；icon 解析在 `ellipsizeButton` / `buttonsOverflowOf` 各查表一次（设计权衡 4：绘制期查表 O(1)，不做预解析缓存）。
4. `self-checks/painter.js`「首帧图标加载中」断言由 `requestIconImage(icon, …)` 改为 `requestIconImage(icons[editIconName].svg, …)`——设计步骤 20 要求夹具改注册名（并指出直传串会使断言空转），该断言取 svg 的路径为必要配套（与 paintEditButton 的 resolveIconEntry 查表链同源），非行为变更。

## 自检

- `node --check` 全部通过（11 个 .js：`src/icons/index.js`、`column-types/icon.js`、`column-types/index.js`、`ex/cell-painters.js`、`ex/editor.js`、`ex/row-geometry.js`、`ex/constants.js`、`ex/painter.js`、`self-checks/cell-painters.js`、`self-checks/painter.js`、`self-checks/editor.js`；3 个 .vue 的 `<script setup>` 提取后校验：`src/components/table/ex/table-ex.vue`、`demo/src/data/table-ex/main-view.vue`、`demo/src/data/table/main-view.vue`）。本项目无 eslint / typecheck 配置。
- 全库旧名核对：`grep -rn "editorButton|editor-button|EDITOR_BUTTON"` 于 src/ 与 demo/src/ 0 命中（新增/触达代码全部为新名 editButton / edit-button-click / EDIT_BUTTON_*）。
- self-checks 断言编写核对（对照 02-design.md「验证」节清单）：icon 5 块（双通道产物 / 非法值门控 + placeholder / install 解析 + whenGlyphReady / drawIconGlyph 双路径 / resolveIconEntry）、button 图标 1 块（测宽 / 绘制 / 省略 / 哨兵 / 降级 / tooltip 矩阵）、editButton 门控 1 块 + painter 夹具注册名化 + editButtonRectOf 几何沿用组——断言代码均已写入对应文件。
- self-checks 的运行（demo 页「自检结果」面板）与 demo 页 playwright 验证属 verifier 职责，本轮未运行。

## 遗留

- 实施清单第 19 项终验（demo 页全量验证 + self-checks 全跑，`http://localhost:3000/data/table-ex/` 与 `/data/table/`）待 verifier 执行。
- 文档同步四处（`skills/mussel-ui/references/components/data.md`、`docs/quick-reference_components.md`、`docs-site/components/table.md`、`docs-site/components/table-ex.md`）按设计「实施阶段经用户确认后更新」，不在本轮范围。
- install 解析的 pending → 两跳重试 → failed 链路依赖异步样式/字体时序，未入同步断言（设计「验证」节已声明；demo 页常规路径 ready 态可断言，重试链留浏览器验证）。
- demo 页 icon 列未注册名夹具（`noRegGlyph`、`noRegBtnGlyph`）会按设计各产生一条 dev warn（去重后一次），验证时属预期输出。
