# table-ex 列类型补齐：text 列 link 悬停下划线 + button 列字段值渲染

日期：2026-11-06
状态：待实现
范围：`src/components/table/`（canvas 通道 table-ex 与 column-types）

## 需求 1：text 列 `link: true` 悬停显示下划线

### 背景

text 列 `link: true`（20261104-table-column-type 引入）在 DOM 通道产出
`mu-table__cell-link` class，具备 cursor: pointer 与 hover 下划线；canvas
通道（mu-table-ex）按设计仅渲染链色常驻文本（`column-types/text.js:41-44`
注释明示），无 hover 下划线、无 pointer 光标、无条目命中。两通道行为不对齐。

### 现状与根因

- `TextColumn.compile` dom=false 分支只产 `{ text, color }`（`column-types/text.js:57-63`），为纯文本格而非条目格。
- 纯文本格走 `drawDisplayText → drawTextValue`（`table/ex/cell-paint/cell-painters.js:205`、`table/ex/cell-paint/cell-text.js:99`）：
  - `drawTextValue` 不接收 `hoverItem`，无 hovered 分支，不画下划线；
  - 不回报 `onItemRect` 命中矩形 → `paintState.itemHits` 无记录 → `hoverItem` 恒 null（`table/ex/composables/use-pointer.js:160`），pointer 光标判定（`use-pointer.js:175` applyItemCursor）不生效。
- 下划线绘制现仅存在于条目路径：`drawLinkEntry`（`cell-paint/link-items.js:34`）与 `drawItemText`（`cell-paint/item-painters.js:293`），均复用 `linkUnderlineY`（`cell-text.js:153`）。

### 期望行为

- text 列 `link: true` 时，canvas 通道悬停单元格文本：文本下显示 1px 下划线（规格与条目链路一致：`linkUnderlineY`，宽 = 实绘省略后文本宽），光标变 pointer。
- 非悬停态保持链色常驻文本（现状不变）。
- 点击行为维持走 cell-click（现状不变，不新增事件）。
- `link: true` 与自定义 `color` 共存时，链色与悬停色沿用 `colors` 色板谱系（对齐条目链路 `linkTextColorOf` / `linkHoverColorOf` 口径）。
- `link: false`/未配置的 text 列行为完全不变。

### 实现要点（供方案参考）

- `drawTextValue` 增加 hover 下划线能力与命中矩形回报，或 text+link 格改道条目绘制链路（方案阶段定）。
- compile 产物需携带 link 门控信息供绘制/交互层消费。
- 悬停状态依赖 `itemHits` 回报，需与既有 `isLinkEntryHovered` / `updateHoverItem` 谓词口径一致（`item.link !== false` 门控）。

### 验收标准

1. demo（table-ex-basic）text 列配 `link: true`：hover 单元格文字出现下划线，光标 pointer；移出后下划线消失。
2. 同格点击仍触发 cell-click，事件 payload 不变。
3. text 列未配 `link` 或 `link: false`：hover 无下划线、光标不变（回归）。
4. DOM 通道行为不受影响。

## 需求 2：button 列支持字段值直接渲染

### 背景

tag/link/list 列均支持仅配 `field`、由字段值自动包装为条目渲染（缺省包装函数回退）；button 列只认 `column.buttons` 配置，字段值不被消费。行为不对齐，用法门槛高于同类条目列。

### 现状与根因

- `ButtonColumn.compile`：`ensureFn(column.buttons)`，无回退（`column-types/button.js:72`）；render 闭包只调 `getButtons(record)`（`button.js:79`），字段值 `value` 未消费。
- 列仅配 `field` 时 `getButtons` 恒 undefined → `?? []` → canvas 侧 `drawButton` 门控不绘制，dom 侧 `!buttons.length` 落占位链。
- 对照 tag：`ensureFn(column.tags || valueToTags)`（`column-types/tag.js:23`），`valueToTags` 将字段值包装为条目（数组元素对象原样保留、标量包 `{ caption: el }`、单值包单元素数组），且调用透传 `(record, value)`（`tag.js:30`）。
- link/list 同有回退：`column.links || valueToLinks`（`column-types/link.js:25`）等。
- button 迁移自 table-ex canvas 现状（`button.js:5-6` 注释），未补包装层。

### 期望行为

- `type: 'button'` 列仅配 `field` 时，字段值按 tag 同口径包装为按钮条目：
  - 数组值：对象元素原样保留（`{ caption?, icon?, color?, disabled? }`），字符串/数字元素包装为 `{ caption: el }`；
  - 非数组值：包装为单元素数组 `[{ caption: value }]`；
  - `value == null` 不产条目，落占位链。
- `column.buttons` 显式配置时优先生效（含函数形态），行为不变。
- 自定义 `buttons` 函数签名扩展为 `(record, value)`，可读字段值（对齐 tag）。
- 无效条目（空 caption 且未注册 icon）沿用既有过滤：canvas `drawButton`/`ellipsizeButton` 门控，dom `domItemOf` 返回 null 过滤。
- 双通道（mu-table DOM / mu-table-ex canvas）行为一致。

### 验收标准

1. demo 中 `type: 'button'` 列仅配 `field`，字段值为字符串数组：每项渲染为按钮（caption 为字段值）。
2. 字段值为单字符串：渲染单个按钮。
3. 字段值为对象数组：`caption`/`icon`/`color`/`disabled` 各自生效。
4. 已配置 `column.buttons` 的列渲染结果与改动前一致（回归）。
5. `buttons` 为函数时可收到 `(record, value)` 两个参数。
6. 空值/null 字段：不渲染按钮，落占位。

## 涉及文件（预估）

- `src/components/table/ex/cell-paint/cell-text.js` / `cell-painters.js`（需求 1）
- `src/components/table/ex/cell-paint/cell-content.js`（需求 1，isPlainTextColumn 产物链）
- `src/components/table/column-types/text.js`（需求 1，compile 产物）
- `src/components/table/column-types/button.js`（需求 2）
- demo：`demo/src/data/table-ex-basic/`（两需求验证）
- 文档三处同步（实现确认后）：`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/`
