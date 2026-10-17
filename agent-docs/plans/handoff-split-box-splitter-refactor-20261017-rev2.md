# Handoff

> rev2 · 2026-10-17 · 取代 rev1 `handoff-split-box-splitter-refactor-20261017.md`。本文件为定稿方案，代码零改动。

## Goal

重构 split-box（split-h-box / split-v-box）与 splitter：

1. splitter 三维正交：占位 `size` / 形态 `shape` / 显形时机 `visibility`。
2. split-box 三能力独立：显示 `left/rightSplitter`、可拖 `left/rightResizable`、可收拢 `left/rightCollapsible`。
3. 显形时机按侧独立：`left/rightSplitterVisibility`（v-box 为 `top/bottomSplitterVisibility`）。

## Current State

- rev2 定稿：采纳评审修订（splitter 增加 `resizable`、zero CSS 明确化、reveal 机制、按侧迁移映射、handle 条件澄清、cursor/inert、toggle 单次触发、collapsed 复位、dblclick 语义）；box 层 visibility 按用户要求拆为左右/上下独立控制。
- 代码零改动；本会话只写本文件。
- 工作区基线：前一会话未提交的 layout 中间态（旧设计 `size: none|slim|normal` + `shape: hidden|line|pill` + `resizable/collapsible` 回退与 `warnDeprecated`）仍存在。本任务在其上继续，中间态回退逻辑整批删除。工作区另有 message/tooltip/utils 的未提交改动，与本任务无关，不要触碰。
- 版本前提：`package.json` 为 4.1.5；`resizable` / `collapsible` / `size` 当前值在 HEAD 且已有公开文档（docs-site `resizable="left|bottom"` 用法已核对）。`shape="hidden"` 未在 HEAD（本批工作区未提交新增），不构成对外 breaking。实现前确认 4.1.5 是否已发布；若已发布，删除旧 prop、修改 `size` 默认值、默认出条属于 breaking，迁移说明必须随版本发布。

## Key Context

### 1. splitter 组件 API（定稿）

| prop | 取值 | 默认 | 语义 |
|---|---|---|---|
| `size` | `zero` \| `slim` \| `normal` | `normal` | 占位基准（flex-basis）；line 静止宽度随 size，zero 例外固定 4px 悬浮；pill 视觉不随 size |
| `shape` | `line` \| `pill` | `line` | 纯形态；`hidden` 废除 |
| `visibility` | `always` \| `hover` | `always` | `hover` 时仅 `:hover` / `[active]` 显示 `::after`；`::before` 热区始终保留 |
| `resizable` | Boolean | `true` | **新增**。true：拖拽实时改尺寸并 emit `resizing`；false：仅收拢/展开判定 |
| `collapsible` | Boolean | `false` | 收拢能力；handle 显示也依赖它 |
| `collapseHandle` | Boolean | `false` | 渲染折叠把手 |
| `collapsed` | Boolean | `false` | 当前收拢态；用于把手朝向与展开判定 |

尺寸与外观映射（以此为准，替代 rev1"纯占位、非外观尺寸"的表述）：

| size | flex-basis | line 静止 | line hover/active | pill |
|---|---|---|---|---|
| `zero` | `0` | 4px 悬浮 | 4px | 4px × 48px 悬浮，opacity .5 |
| `slim` | 2px | 2px | 4px | 4px × 48px（不随 size） |
| `normal` | 4px | 4px | 4px | 4px × 48px（不随 size） |

- `zero + always` = 零占位常显悬浮线；`zero + hover` = 零占位 hover 显形。
- `inert + visibility: hover` = 永久隐形占位条（pointer-events 关闭使 hover 永不触发）——无害冗余，文档消化，不写代码特判。
- `zero` 下 `::after` 仍是 4px，**不得**再保留旧 `--none` 的 0 宽规则。

类名增量：

- `--zero`（替代 `--none`）
- `--reveal`（`visibility: hover`）
- `--collapse-only`（`!resizable && collapsible`，cursor: grab，拖拽中 `[active]` 为 grabbing）
- `--inert`（`!resizable && !collapsible`，cursor: default + `pointer-events: none`）
- 删除 `--hidden`

### 2. split-box API（h/v 同构）

h-box（v-box 把 left/right 换成 top/bottom，属性同名）：

| prop | 默认 | 语义 |
|---|---|---|
| `leftSplitter` / `rightSplitter` | `true` | 是否渲染该侧分隔条 |
| `leftResizable` / `rightResizable` | `true` | 是否可实时拖拽调整尺寸 |
| `leftCollapsible` / `rightCollapsible` | `false` | 是否可收拢/展开（与旧有效默认一致） |
| `leftSplitterVisibility` / `rightSplitterVisibility` | 未设置 → `always` | 按侧独立传递 splitter.visibility；validator `always \| hover` |
| `splitterSize` / `splitterShape` | 未设置 → splitter 默认 | 两侧共享外观 |
| `splitterCollapseHandle` | `false` | 两侧共享把手开关（仅 line 形态） |
| `splitterDblclickReset` | `true` | 双击行为总开关 |

- 最终默认组合 = 两侧 4px 常显可拖线。
- 级联失效：
  - `leftSplitter=false`：该侧 `resizable` / `collapsible` / handle / dblclick 均无实际作用；同时复位该侧 `collapsed`。
  - `leftCollapsible=false`：handle 不显示；若该侧当前处于 collapsed，复位展开，避免"隐藏且无恢复入口"。
  - `resizable=false && collapsible=false`：inert，只显示占位/线，不响应指针。
- 显形按侧独立；尺寸/形态仍两侧共享。
- handle 显示条件保持 `collapseHandle && collapsible && shape === 'line'`。rev1 的"放宽为 shape !== 'pill'"在 shape 收窄后与现状等价，属于空操作，不实施；pill 形态有意不显示把手。

### 3. 交互规则

实时拖拽（`resizable=true`）：

- 保留现有 `calculateSizeRange`、`collapseSize`（`min/2` 或 200）、`clamp`、`emit('resizing')` 逻辑，不改行为。

阈值收拢（`resizable=false && collapsible=true`）：

- 不 emit `resizing`，全程不改尺寸。
- 常量：`PREVIEW_THRESHOLD = 20`、`COLLAPSE_TOGGLE_THRESHOLD = 40`（30–50 均可；不沿用 200）。
- `progress` 沿用现有 sign 修正；定义 `progress = collapsed ? delta : -delta`：
  - `progress >= 20`：emit `preview(true)`，用于面板预览；
  - `progress >= 40` 且本次拖拽未触发过：emit `preview(false)` 清预览后 emit `toggle`，并置 `toggled = true`；
  - 一次拖拽只触发一次 toggle；触发后本拖拽内剩余 move 全部 no-op（collapsed 已翻转、progress 公式换边，继续响应会产生 preview 噪音与展开后 preview 残留），反向拖不立即展开，必须松开重新拖。
- 展开：`collapsed=true` 时向远离面板方向拖过 40px → emit `toggle` → box `reset()` 恢复 `initialSize`。
- 预览：splitter 在 `preview` 状态变化时 emit `preview(true/false)`——`progress` 从 ≥20 回落到 <20 须 emit `preview(false)`（latch，勿每 move 重复 emit）；`stopDrag` 必须 emit `preview(false)`。box 给目标面板加 `mu-split-box__start--preview` / `__end--preview`（opacity .5，transition .15s）。这是定稿形式，不再留到实现时选。
- cursor：`grab`（拖拽手势语义，区别于 resizable 的尺寸箭头与 handle 的 pointer；`[active]` 时 `grabbing`）。

纯展示（`resizable=false && collapsible=false`）：

- `onPointerDown` 直接 return，不挂监听。
- 类 `--inert`：`cursor: default; pointer-events: none`。
- 不响应 hover 显形（pointer-events 已关闭）；占位仍保留。

cursor 汇总：

| resizable | collapsible | cursor |
|---|---|---|
| true | 任意 | `col-resize` / `row-resize` |
| false | true | `grab`（`[active]` 时 `grabbing`） |
| false | false | `default`（inert） |

双击：

- `splitterDblclickReset=false`：任何情况都不响应。
- `resizable=true`：`reset(target)`（现有行为）。
- `resizable=false && collapsible=true`：`toggle(target)`。
- 两者皆 false：no-op。
- handle 的 `@dblclick.stop` 保持不变；双击 handle 触发两次 click/toggle 是既有行为，本次不处理。

collapsed 复位：

- box 侧 watch `[splitter, collapsible]`，`!splitter || !collapsible` 时 `reset(target)`。
- 放在 `useSplitBox` 解构之后；`initialSize` 未初始化时 `reset` 自然 no-op。

### 4. CSS 规则

删除：

- `splitter.scss:44-46` 的 `&.mu-flex-splitter--hidden::after { background: unset; }`
- `splitter.scss:130-134`（row）与 `:220-224`（col）的 `&--none::after { width/height: 0 }`
- `splitter.scss:99-103` 的 pill `&--none { &::after { opacity: 0 } }`

改名：

- `--none` → `--zero`，只保留 `flex-basis: 0`。

保留：

- `::before` 恒 4px 热区（row `:117-122`、col `:207-212`），不要隐藏。
- row/col 的 `:hover, [active]` 下 `::after` 涨到 `--full-size` 规则（`:136-141`、`:226-231`）；`slim + line` 依赖它从 2px 涨到 4px，zero/normal 下冗余但无害。
- pill 的视觉块、handle 定位、collapsed 下 handle 换边规则。

新增 reveal：

```scss
.mu-flex-splitter {
  &.mu-flex-splitter--reveal:not(:hover):not([active])::after {
    opacity: 0;
  }
}
```

- 特异性 `(0,4,1)`，高于 pill 基础 `(0,2,1)` 与 pill hover `(0,3,1)`，不依赖源码顺序。
- 现有 `transition: transform .3s, opacity .2s` 提供淡入淡出。
- 同时覆盖 line 与 pill；pill 的 `box-shadow` 随 opacity 一起消失，不能用 `background: unset` 代替。
- 只作用于 `::after`，不影响 `::before` 热区。

新增 cursor / inert：

```scss
.mu-flex-splitter--row {
  &.mu-flex-splitter--collapse-only {
    cursor: grab;

    &[active] {
      cursor: grabbing;
    }
  }

  &.mu-flex-splitter--inert { cursor: default; pointer-events: none; }
}

.mu-flex-splitter--col {
  &.mu-flex-splitter--collapse-only {
    cursor: grab;

    &[active] {
      cursor: grabbing;
    }
  }

  &.mu-flex-splitter--inert { cursor: default; pointer-events: none; }
}
```

- `--inert` 的 `pointer-events: none` 同时关闭 `::before` 热区，避免不可见/不可用的 4px 条阻挡面板点击。

预览样式加入 `split-box.scss`：

```scss
.mu-split-box__start--preview,
.mu-split-box__end--preview {
  opacity: .5;
  transition: opacity .15s;
}
```

- zero 模式下 handle 从 0 宽 splitter 的 `100%` 偏移仍成立；实现后用 Playwright 验证。

### 5. 迁移映射

| 旧写法 | 新写法 |
|---|---|
| `splitter-shape="hidden"`（共享） | 两侧 `left/right-splitter-visibility="hover"`（只需一侧则只设一侧） |
| `splitter-size="none"` + 旧 hover 行为 | `splitter-size="zero"` + `left/right-splitter-visibility="hover"` |
| `splitter-size="none"` + 常显悬浮线（新意图） | `splitter-size="zero"` |
| `splitter-size="slim"` / `"normal"` | 不变 |
| `resizable`（Boolean true） | 删除；两侧 `left/right-resizable` 默认 true |
| `resizable="left"` | `right-splitter="false"`（保真：右侧无条）；要右侧显示不可拖 inert 条才用 `right-resizable="false"` |
| `resizable="right"` | `left-splitter="false"`（保真）；inert 条备选同上 |
| `:resizable="false"` | 两侧 `left/right-splitter="false"`（保真：无条）；两侧 inert 条备选 `left/right-resizable="false"` |
| `collapsible`（Boolean true） | `left-collapsible` + `right-collapsible`（新默认 false） |
| `collapsible="left"` | `left-collapsible`（right 保持 false） |
| `collapsible="right"` | `right-collapsible`（left 保持 false） |
| 未传 `resizable` | 行为变更：默认两侧出现 4px 常显可拖条；还原旧"无条"用 `left/right-splitter="false"` |
| 未传 `splitter-size` | 默认由 `none` 变 `normal`（4px） |

- v-box 对应 `top` / `bottom`。
- 旧 `resizable` / `collapsible` 删除后，旧写法会作为 fallthrough attribute 静默渲染，无弃用警告；迁移文档必须逐条列出。
- 旧 `splitter-size="none"` 在 validator 改为 `zero` 后不会回退，而是落到 base 4px 样式；文档与 demo 必须同批更新。
- 迁移按意图处理，不保证机械等价（例如旧 `resizable=false` + `collapsible` 本来就没有分隔条）。

### 6. 已否决方案（不要回头）

- `shape` 单枚举合并（`none/slim/line/pill/ghost`）：基于"zero 不可交互"的错误判断。
- `shape` 三值含 `ghost`：ghost 混合形态与可见性，非纯形状。
- `hoverReveal: Boolean`：被 `visibility` 枚举取代（未来可扩展 `focus-visible`）。
- `size: 'none'` 保留原名：`none` 是存在性词汇，`zero` 是纯尺寸量词。
- reveal 用 `background: unset`：无法隐藏 pill 的 box-shadow/opacity。
- 阈值收拢沿用 `COLLAPSE_THRESHOLD=200`：拖拽距离过大。
- handle 放宽到 pill：形态不匹配，保持仅 line。
- 单一共享 `splitterVisibility`：已被按侧独立控制取代。

### 7. 关键发现（代码读不出来的）

- `::before` 未被 `--none` 覆盖（`splitter.scss:117-122` 只压 `::after` 宽度），恒 4px absolute 透明层 = zero 模式的悬浮命中区。**不要删 hover 涨宽规则**。
- 旧 `--hidden` 的 `background: unset`（`:44`）与 `:hover` 主色规则（`:79`）特异性同为 `(0,2,0)`，旧实现靠源码顺序取胜；rev2 用 `:not(:hover):not([active])` 从机制上消除顺序依赖。
- 旧设计 9 组合中 3 个退化、2 个近似重复——"正交"是假的，这是本方案拆维度的主要论据。
- 当前 `onPointerMove`（`splitter.vue:120-130`）没有阈值收拢分支；该交互是新增，不是改造。

## Changed Files

本会话：

- 新增 `agent-docs/plans/handoff-split-box-splitter-refactor-20261017-rev2.md`
- 代码零改动

待实现：

- `src/components/layout/splitter.vue`
- `src/components/layout/splitter.scss`
- `src/components/layout/split-box.scss`
- `src/components/layout/split-h-box.vue`
- `src/components/layout/split-v-box.vue`
- `demo/src/flex-layout/main-view.vue`
- 预计不改 `src/components/layout/split-box.js`；`toggle` / `reset` 直接复用
- 文档（用户确认后）：`skills/mussel-ui/references/components/layout.md`、`docs/quick-reference_components.md`、`docs-site/components/split-box.md`

## Next Steps

1. **splitter.vue**
   - props：`size` 默认 `normal`、validator `zero|slim|normal`；`shape` validator `line|pill`；新增 `visibility`（默认 `always`，validator `always|hover`）与 `resizable`（Boolean，默认 true）；保留 `collapsible` / `collapseHandle` / `collapsed`。
   - `cls` 增量：`--zero` / `--slim`、`--pill`、`--reveal`、`--collapse-only`、`--inert`。
   - `showCollapseHandle` 保持 `collapseHandle && collapsible && shape === 'line'`。
   - `onPointerDown`：`!resizable && !collapsible` 直接 return。
   - `onPointerMove`：
     - `resizable=true`：现有实时 resize 分支；
     - `resizable=false && collapsible=true`：`progress`、20px preview、40px toggle、单次 latch；
     - 不 emit `resizing`。
   - `emit` 增加 `preview`；`stopDrag` 清 preview。
   - 常量 `PREVIEW_THRESHOLD = 20`、`COLLAPSE_TOGGLE_THRESHOLD = 40`。

2. **splitter.scss**
   - 按"CSS 规则"删除 `--hidden`、两处 `--none` 0 宽、pill `--none`；
   - `--none` 改名 `--zero`，只留 `flex-basis: 0`；
   - 加 reveal、cursor、inert；
   - 保留 `::before`、hover 涨宽、pill、handle 定位。

3. **split-box.scss**
   - 加 `--preview` 面板样式（opacity .5 + transition）。

4. **split-h-box.vue / split-v-box.vue**
   - props：新增 `left/rightSplitter`、`left/rightResizable`、`left/rightCollapsible`、`left/rightSplitterVisibility`；v-box 用 `top/bottom`。默认值见 API 表。
   - 删除 `resizable` / `collapsible` props、`warnDeprecated` import 与调用、回退 computeds。
   - `useSplitBox` 的 collapsible 入参用 computed（`unref` 不调用函数，不能直接传 getter）。
   - splitter `v-if` 改 `$slots.x && xSplitter`；传 `:resizable`、`:collapsible`、`:visibility`；保留 `:collapse-handle`、`:collapsed`、`@toggle`、`@resizing`。
   - 新增 `onSplitterDblclick(target)`：`splitterDblclickReset` 总开关 + resizable/reset、collapsible/toggle、两者 false/no-op。
   - 新增 preview 状态（`reactive({ start, end })`）与目标面板 `--preview` 类。
   - 新增 watch：`!splitter || !collapsible` 时 `reset(target)`。

5. **demo/src/flex-layout/main-view.vue**
   - `size` 选项改 `zero|slim|normal`，默认 `normal`；`shape` 选项删 `hidden`；
   - 增加左右（v-box 上下）独立的 visibility 开关，验证按侧控制；
   - 增加 splitter / resizable / collapsible 开关，覆盖 collapse-only、inert、动态复位；
   - 现有 `resizable` / `collapsible` 写法按迁移表改为按侧属性。

6. **Playwright 验证**（`http://localhost:3000/flex-layout/`，watch 常驻，直接访问）
   - 默认：两侧 4px 线、可拖、cursor `col-resize`。
   - `zero + always`：flex-basis 0、`::after` 4px、面板贴合；`zero + hover`：静止 opacity 0、hover/active 显形、`::before` 热区可命中。
   - `slim + line`：静止 2px、hover 4px。
   - `pill + hover`：静止不可见（含 box-shadow），hover 显示；zero/slim/normal 的 pill 视觉一致。
   - `left-splitter=false`：左侧无条，右侧不受影响；`left-splitter-visibility="hover"` 只影响左侧。
   - `resizable=false + collapsible=true`：cursor pointer；拖 20px 面板预览 opacity .5；拖 40px 收拢；同手势不反复 toggle；反向拖 40px 恢复 initialSize；全程尺寸不变。
   - `resizable=false + collapsible=false`：cursor default；`pointer-events: none`；行列命中测试落到面板。
   - 动态把已收拢侧的 `splitter` 或 `collapsible` 关掉：面板复位，不残留 `display:none`。
   - dblclick：resizable → reset；collapse-only → toggle；二者皆 false 或 `splitterDblclickReset=false` → no-op。
   - handle：line + collapsible + handle=true 显示；pill 或 collapsible=false 不显示；zero 模式定位正确。
   - v-box 上/下同构；deep 嵌套（demo 中的 h 内含 v）不互相干扰。
   - 断言优先用 DOM/计算样式/可访问性快照，不用截图。

7. **文档同步**（完成实现后先征得用户确认）
   - 三处同步：`skills/mussel-ui/references/components/layout.md`、`docs/quick-reference_components.md`、`docs-site/components/split-box.md`。
   - 更新 props 表：`splitter-size` 默认 `normal`；`hidden` 移除；新增按侧 `left/right-splitter`、`left/right-resizable`、`left/right-collapsible`、`left/right-splitter-visibility`（v-box 为 `top/bottom-*`）；删除旧 `resizable` / `collapsible`。
   - 逐个更新示例：`docs-site/components/split-box.md:71,84,90,105`、`docs/quick-reference_components.md:178-196,225-237`、`skills/mussel-ui/references/components/layout.md:139-165` 中的 `resizable="left|right|bottom"` 等写法按迁移表改。
   - 标注 breaking：默认出现 4px 条、`size` 默认变更、旧按侧 prop 删除。

8. **发布检查**
   - 确认 4.1.5 是否已发布；若已发布，迁移说明随版本发布，按 breaking 处理。
   - 对外 breaking 仅：旧 `resizable` / `collapsible` 删除、`size` 默认 `none`→`normal`、`size="none"` 改名 `zero`、未传时默认两侧出条；`shape="hidden"` 未发布过，仅需内部迁移，不保留 shim。

## References

- rev1（被本文件取代）：`agent-docs/plans/handoff-split-box-splitter-refactor-20261017.md`
- 源码：`src/components/layout/splitter.vue`、`splitter.scss`、`split-box.js`、`split-box.scss`、`split-h-box.vue`、`split-v-box.vue`
- 验证页：`demo/src/flex-layout/main-view.vue`
- 文档：`skills/mussel-ui/references/components/layout.md`、`docs/quick-reference_components.md`、`docs-site/components/split-box.md`
- 项目知识索引：`agent-docs/knowledge/INDEX.md`

## Suggested Skills

- `mussel-ui`：仅第 7 步更新组件参考文档时按需查阅现有文档结构；实现代码时项目规则禁止使用。
