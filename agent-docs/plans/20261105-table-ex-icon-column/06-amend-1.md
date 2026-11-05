VERDICT: AMENDED

# 审改记录 — 20261105-table-ex-icon-column（轮 2，peer）

对象：02-design.md 修订 1（primary）。输入：00-task.md、decisions.md。本轮直接修订设计正文，记录如下。

## 上次回应核对（第 2 次起）

上一轮为 primary 自修订轮（run.log:1），无 peer 交叉记录与未决异议可核；按 00-task.md「修订要求」4 条与 decisions D1–D6 逐条核对：

| 要求 / 裁决 | 设计者落实 | 核对结论 |
| --- | --- | --- |
| 要求 1 icon 列单图标 + 仅注册名 + 不支持 img + color | 已落实（值收敛为注册名 string、删除对象/数组/img/max；color 协议存在） | **已落实，但补正**：color 落在 `iconOption` 违反单值列约定，且 DOM 通道未染 color（已改）；「非法值不落 placeholder」不成立（已改）；注册表规模事实错误（见台账 1） |
| 要求 2 button 列图标按钮 | 已落实（条目协议、测宽、命中零改动） | **已落实，但遗漏影响面**：`buttonsOverflowOf` 空 caption 哨兵判死 icon-only 组（已补）；icon-only pill 几何与 TAG_PADDING_X 冲突（已明确） |
| 要求 3 editButton 仅注册图标 + onClick → emit | 已落实（协议收敛、emit、点击序不变） | **已落实，但落点矛盾**：「resolveEditorButtonIcon 落 table-ex.vue 内或 interactions.js 或组件壳」与 painter 共源互斥（已收敛为 column-types/icon.js 导出的 resolveIconEntry） |
| 要求 4 性能与 API 便利权衡 | 已落实（8 条权衡） | **已落实，但结论错误**：「tabler 全量已注册，常用图标零接入成本」与代码不符（28 个 tabler + 3 复合），直接改变 API 便利性结论（已改）；重绘链未覆盖多格共用图标的单监听缺陷（已改） |
| D1 渲染期解析 + 永久缓存 | 保留 | 保留；状态机语义自相矛盾，已重写（台账 7） |
| D2 svg 复用 requestIconImage | 保留并扩展 | 保留；cls 无分键、svg 含色分键结论不变 |
| D3 kind 平铺 + dom `{ is, attrs, events }` | 保留 | 保留；canvas 条目补 `size` 属协议缺口修补，不改变平铺路线 |
| D4/D5/D6 | 已落实 | 未发现与 decisions 冲突（冲突表保留并按本轮口径增补 color 行） |

## 检查项结论（每项一行）

1. **覆盖**：4 条修订要求 + 验收标准均有设计与验证归属（icon→片 1、button→片 2、editButton→片 3、权衡/文档→终验）；原验证手段两处不可执行（node 跑 self-checks、cls 视觉无夹具）已改为可执行式。
2. **事实一致**：设计引用的路径/符号逐条 grep 核对，全部存在且行号准确；发现并改正 1 处事实错误（「tabler 全量」）与 4 处行号偏差（buttonsOverflowOf 1440、resolveTooltipItems 1513、painter flush 1383-1391、table-ex.md:289）。
3. **约定一致**：已按现有约定修正——单值列 color 用 `column.color`（`text.js:40`）、`*Option` 只承载多条目默认色与尺寸、DOM 染色走 `text-{color}` 原子类（`typography.scss:36-56`）、未注册警告走 `utils/warn`（devOnly + message 去重）。
4. **影响面**：补齐 `buttonsOverflowOf`/`resolveTooltipButtons`、`column-types/style.scss`、base table demo、`self-checks/painter.js`（editorButton 夹具）、self-checks recordingCtx `drawImage`、`requestImage` 多监听对 img 路径的兼容、docs 第四处（`table.md` 类型表）。
5. **可实施**：步骤有序且无环（`column-types/icon.js` → 无依赖；`cell-painters` → `column-types/icon`；`painter` → `cell-painters`/`column-types/icon`）；`drawIconGlyph` 单一实现避免锚公式复制；三片改同文件，明确串行。
6. **风险与回滚**：破坏性变更单列（未解问题 1，附仓库内唯一用户侧使用点 demo 夹具的证据）；性能风险（200 条缓存 clear-all、多格重绘）均给对策；回归面点明 img 多监听、editorButton 绘制、button tooltip。
7. **范围**：无超出验收标准的改动；本轮为收缩（删 iconOption.class/style、删 tooltipItemWidthOf icon 分支、删 resolveEditorButtonIcon 封装）。
8. **切片**：原「片 2 独立」不成立（片 1/2 同改 `cell-painters.js`，三片同改 `main-view.vue`），已改为片 1→2→3 串行；每条验收标准有归属片或标终验。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
| --- | --- | --- | --- | --- |
| 1 | 现状依据 / 权衡 3 / 修订记录 | 「tabler 全量 svg 已注册，常用图标零接入成本」→「28 个 tabler + 3 复合 = 31 个内置名，未内置须 installIcons」 | `src/icons/tabler-icons.js` 仅 28 个 `default as` 导出（`grep -o "default as" \| wc -l` = 28）；`src/icons/index.js:85-98` 3 个复合项。直接推翻原 API 便利性结论 | 是 |
| 2 | 值与列协议 / 冲突点表 / compile 产物 | `iconOption: { size, color, class, style }` → `column.color`（ensureFn）+ `iconOption: { size }` | 单值列既有约定为列级 color（`text.js:40`）；`*Option` 内 color 用于多条目默认色（`tag.js:20-21`、`list.js:104`）；单条目无条目级 class/style 意义 | 是 |
| 3 | 值与列协议 | 「非法值 → 空渲染，不落 placeholder」→ 空产物落通用占位链；`value == null` 不 warn | `drawDisplayText`（`cell-painters.js:444`）对空内容取 `col.placeholder ?? placeholder`，无法「不落占位」；`list.js:123` 非数组同构 | 是 |
| 4 | compile 双通道产物 / measureItem | canvas 条目新增 `size` 字段 | `measureItem`（`:819`）/`drawItem`（`:848`）只收 item，无列引用；原协议无处取 `iconOption.size` | 是 |
| 5 | canvas drawItem | cls 分支「textAlign 按列 _align」→ `textAlign='left'`，x 用布局结果 | `drawItems` 已经 `layoutItemPositions`/`itemsStartX`（`:759`、`:781`）按 align 定位，再设 textAlign 会双重对齐 | 是 |
| 6 | canvas 绘制 | 新增并导出 `drawIconGlyph(ctx, icon, { x, centerY, size, color, onLoad })`，icon 列/button/paintEditorButton 三处共用 | `centeredTextAnchor`（`:514`）、resolveIconGlyph 均私有；painter 无法复用锚公式，原设计未给落点 | 是 |
| 7 | 码点解析 | 「none/空 → 失败」+「pending 样式表未就绪 → fonts.ready 重解析」矛盾表述 → 显式状态机（content 有效即 ready；`document.fonts.status` 驱动重绘；content 空 → pending 一次重试 → failed + warn） | `content` 由 CSS 规则决定、与字体加载无关；原两条规则对同一现象给相反结论，实现必然分歧；单次 fonts.ready 订阅避免 per-glyph 订阅 | 是 |
| 8 | 新增「异步图标加载管线」 | `requestImage` 单回调 → `listeners` 累积、onload 一次 flush | `cell-painters.js:76-100` 仅缓存未命中时挂 onLoad；icon 列 N 行共用图标时仅首格 `invalidateCell`（`painter.js:1427`），其余格加载后仍空白；flush 合并 rAF 为整幅重绘（`painter.js:1383-1391`） | 是 |
| 9 | 权衡 7 | 新增 `imageCache` 上限 200/clear-all 的容量说明与对策（不拆缓存） | `cell-painters.js:79`；拆分缓存会破坏 `getImageEntry` 既有断言（`self-checks/cell-painters.js:1827`）与 img 同源路径 | 否 |
| 10 | button 列图标按钮 | 补 icon-only 几何（宽 20、左右各 4px）、icon+caption 的 x 偏移与 rightBound 终止条件 | 原「icon-only 宽 = TAG_HEIGHT」与「icon+caption 用 TAG_PADDING_X(8)」并存，实现无法确定图标 x/内距 | 是 |
| 11 | button 列图标按钮 / 配套 / 实施清单 | 补 `buttonsOverflowOf` 哨兵与计宽适配（caption 空且无有效图标才终止） | `cell-painters.js:1440` 以 `caption === ''` 判哨兵，icon-only 组会误判溢出、tooltip 结论错误（`resolveTooltipButtons` 消费） | 是 |
| 12 | 配套 tooltip / measureItem | 删 `tooltipItemWidthOf` icon 分支；`title: true` 明确为「仅 DOM 通道生效」 | canvas tooltip 以溢出为前提，icon 宽恒 ≤ 内容宽；`resolveTooltipItems`（`:1513`）以 `item.text` 拼全文，icon 条目 text 为 null 直接返回 null → 该分支为死代码 | 是 |
| 13 | button 列图标按钮 | 显式声明仅 canvas 通道（base table 无 button 类型） | `column-types/index.js:17-32` 无 button；`CANVAS_ONLY_TYPES`（`cell-painters.js:65`） | 否 |
| 14 | editButton 改造 / 实施清单 | 「resolveEditorButtonIcon 落 table-ex.vue 内或 interactions.js/组件壳」→ `column-types/icon.js` 导出 `resolveIconEntry`，四处共用；删除二次封装 | `painter.js` 不能 import 组件壳；`interactions.js` 现仅依赖 layout/tree/constants（无 icons 链）；单点查表无需 wrapper | 是 |
| 15 | 配套 demo / 实施清单 | `pencilIcon` 直传 → 内置注册名（pencil 未注册）；新增 base table 夹具与两个 cls 注入 class | `tabler-icons.js` 无 pencil 导出；demo/src 无字体/`@font-face`（find 0 命中），cls 验证无夹具则不可执行 | 是 |
| 16 | 配套文档 | 「三处」笼统 → 四处精确路径/行号（含 `table.md:80/107-119`） | icon 为普通列类型，base table 文档类型表同样必须更新（`docs-site/components/table.md:107-119`） | 否 |
| 17 | 实施清单 / 片依赖 | 「片 2 独立（svg 路径不依赖片 1）」→ 三片串行 | 片 1/2 同改 `cell-painters.js`，三片同改 `main-view.vue` 与 `self-checks/cell-painters.js`；片 2/3 复用片 1 的 `drawIconGlyph` | 是 |
| 18 | 验证 | 「self-checks node 可跑」→ demo 面板运行 + `node --check`；断言改为 drawCell/recordingCtx 可执行式（`measureItem`/`resolveItemKind` 未导出）+ recordingCtx 增记 drawImage + 不可验证项声明 | 实测 `node -e "import('./src/components/table/ex/cell-painters.js')"` → `ERR_MODULE_NOT_FOUND: Cannot find package '@/utils'`；`grep "^export"` 无 measureItem/resolveItemKind；仓库无 iconfont 资产 | 是 |
| 19 | 未解问题 | 3 条 → 1 条（#2 事件名、#3 点击交互定案并入正文） | 事件名与 `defineEmits`（`table-ex.vue:154-167`）同族命名、payload 语义不同；用户要求原文穷举无点击（00-task.md:9） | 否 |
| 20 | 实施清单片 3 | 补 `demo/src/data/table-ex/self-checks/painter.js`（editorButton 夹具改注册名） | 该文件 `:1118-1121` 直传 svg 串构造 editorButton；改造后 `resolveIconEntry` 判失败 → `paintEditorButton` 不绘，「加载中按钮区不半绘制」断言空转通过（`assertRegionSame` 两侧一致），失去回归价值 | 是 |

实质改动：16 项（#1–#8、#10–#12、#14、#15、#17、#18、#20）；非实质 4 项（#9、#13、#16、#19）。

## 未解问题处置（派发要求 4）

| 原未解问题 | 处置 | 依据 |
| --- | --- | --- |
| 1 editButton 破坏性变更 | **保留**（设计「未解问题 1」，收缩为「外部影响 + 发布说明」待人工确认） | 仓库内消费面：src 4 文件（painter/table-ex/editor/constants）、demo `main-view.vue:459-462`（svg 串直传）与两个 self-checks、三处文档（`table-ex.md:281`、`data.md:293`、`quick-reference_components.md:1808`，均示范 svg 串）。外部使用方无法由仓库证伪；docs 示范 svg 串意味着外部用 svg 直传的概率不低，故不能定案「零影响」 |
| 2 新事件名 `editor-button-click` | **定案保留** | `defineEmits`（`table-ex.vue:154-167`）现有一律 kebab 事件名（`cell-item-click`/`tree-expand`/`column-resize`）；复用 `cell-item-click` 需按 payload 键（`item`/`button`）或 kind 区分，而 `emitDomItemClick`（`table-ex.vue:1206`）已按 kind 分派一层，再叠一层判定易错；编辑按钮非格条目、无条目索引，语义独立 |
| 3 icon 列是否需要点击 | **定案：纯展示无点击** | 00-task.md:9 原文穷举「只支持一个图标…只支持 icons 中已经注册的图标显示，不支持 img，支持 color」，未含点击；单图标纯展示是 API 最简形态（要求 4 便利性方向）；后续如需点击，条目协议已预留 `onItemClick` 挂载点（`list.js:70` 同构），不构成单向门 |

## 未解决异议（累计）

（无）
