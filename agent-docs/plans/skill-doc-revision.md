# mussel-ui Skill 文档修订任务

| 项目 | 内容 |
|---|---|
| 状态 | ✅ 已完成（第一轮 2026-08-29，第二轮 2026-09-30，第三批补同步 2026-09-30，见 §6.1） |
| 范围 | 第一轮：`skills/mussel-ui/` 全部文件；第二轮：skill + `docs-site/` + `docs/quick-reference_*.md` 三处同步 |
| 依据 | 2026-08-28 对照源码的全面评审（源码 `4.1.0`）；2026-09-30 复审（源码 `4.1.5`） |
| 不在范围 | 源码改动（另行完成）；`upgrade/process.md` + `rules.md` 专项核对（见 §7 遗留） |

> 本文档条目中的行号为评审时（2026-08-28）状态，执行后已整体漂移，仅作定位线索。

---

## 1. 源码决策记录（决定文档处理方式）

| # | 源码事项 | 处理 | 结论 |
|---|---|---|---|
| S1 | `src/colors.js:70` `.count` → `.length`（评审时误写为 `src/utils/colors.js`） | ✅ 已修复（`bccdf9c`） | `install.md`/`SKILL.md` 换肤描述恢复有效，无需改 |
| S2 | `drawer.vue` validator 键名 | ✅ 已修复（`bccdf9c`） | 无文档影响 |
| S3 | `table.vue` 删除 `virtual-scroll` 死 prop；`table.virtual-scroll.vue` 整文件删除 | ✅ 已修复 | `data.md` 三行已同步删除 |
| S4 | `tree.vue` `cascaded-check` 保留但未实现 | 保留不动 | 文档按 D1 保留 + 标注「未生效」 |
| S5 | dropdown `position` / `dropdown-position` | **计划描述过时**：源码中现已连注释都不存在，prop 完全移除 | 文档已删属性行；`upgrade/rules.md` 迁移行标「暂无对应」 |
| S6 | `segmented.vue` 组件级 `disabled` | ✅ 已实现 | `form.md` 无需改 |
| S7 | `grid-cell.vue` 重写：6 props 计算输出 `grid-column` / `grid-row`；`endOffset` 删除 | ✅ 已修复 | `layout.md` grid-cell 一节已重写，与源码逐条吻合 |

## 2. 版本声明（已完成）

- `SKILL.md:13-14`：版本声明 `4.1.*`（当前 `4.1.5`），核对日期 **2026-09-30**；已删除失效的「对照仓库 `4.0` 分支源码」表述（该分支已不存在，现 main/dev）。

---

## 3. 任务清单

> 状态：以下条目除标注外均已完成（第一轮主体落在 `bccdf9c` 2026-08-29、`52ecc91` 2026-08-31、`1c86cd5` 2026-09-14；标注「第二轮」者为 2026-09-30 复审后追加修正）。

### 3.1 `SKILL.md`

- [x] P1 `:61` 硬性禁止计数 → 统一为「第 2–5 条为硬性禁止，共 4 条」+「自检清单：硬性禁止 7 项 + 优先级要求 1 项」，与 `principles.md` 对齐
- [x] P1 速查表补遗漏组件：`mu-pagination`、`mu-bar`、`mu-search-input`、`mu-dropdown-item` 三件、`mu-flex-divider`/`-space`/`-break`（另随新组件补 `mu-tooltip`、`mu-date-range-input`；`mu-input-group`/`mu-option` 按 D3 不入表）
- [x] P0 `:75` colors 合法 key 全集（7 语义 + 12 基本色名；`neutral`/`gray` 仅作灰阶基准）
- [x] P2 最后核对日期 → 第二轮更新为 2026-09-30

### 3.2 `references/install.md`

- [x] P0 `:36` 全局配置示例 `gridCell.endOffset` 换为现存示例（`splitter.*` / `tree.nodeIcons` / `calendar.weekStartsOn`）
- [x] P1 `:32`、`:103` colors key 全集 + `neutral`/`gray` 说明（优先级 neutral → gray → primary）
- [x] P1 `:40` 执行顺序更正为 `setupLocale` → `setupRootClass` → `setupColors`
- [x] P2 `:35` `localeResources` 为整包替换

### 3.3 `references/principles.md`

- [x] P1 「硬性禁止」结构统一（核心规范 5 条 + 自检清单 7 + 1 项）
- [x] P2 Good/Bad 示例 API 名抽查：逐项核对通过，无独立错误（无改动）

### 3.4 `references/components/layout.md`

- [x] P0 `:71-76` grid-cell props 表重写（S7）
- [x] P0 `:87` 等价示例改为 `grid-column: span 2; grid-row: span 3`
- [x] P1 `:267` MuPagination 注入论断删除，改为「`inject('toolSize')` 后透传」
- [x] P1 `:142`、`:181` collapsible 侧别 → **第二轮**：源码已实现按侧生效（`isLeft/Right/Top/BottomCollapsible`），文档改写为枚举式 `true | 'left' | 'right' | false`（原「被 Vue 转 true」论断作废）
- [x] P1 `:262-266` toolbar 注入例外（button-group 内不消费 toolSize）
- [x] P2 `mu-flex-divider`/`-space`/`-break` 条目
- [x] P2 `mu-bar` 条目（**第二轮**删「`MuDateInput` 面板工具栏即基于它」——与源码不符，面板用 `mu-toolbar`）
- [x] P2 `:229` `v-mu-scrollbar` 补 `'none'`

### 3.5 `references/components/buttons.md`

- [x] P1 `:34` button-group 补 `color`
- [x] P1 `:50`、`:54` icon-button 根元素为 `<a>`、`icon` 非必填
- [x] P2 `:15` `pill` 与 `button-style="link"` 互斥
- [x] P2 `:9-11` 默认值表述改为「未设置时等效 normal」

### 3.6 `references/components/form.md`

- [x] P1–P2 全部 9 条（`value-format`/`value-type`、date-input `week`、`quarter` 字符串形式、input 清单补 `week`/`time`、`size: large`、form ref `errors`、`enter`/`esc` 原始事件、form-field `error` 类型、segmented 作用域插槽）

### 3.7 `references/components/containers.md`

- [x] P1 `:91` dialog header `'auto'` 判定删 `icon`
- [x] P1 `:141` buttons 对象形式（**第二轮**修正：`is` 为自定义渲染组件/标签名，`is: '-'` 渲染未知标签；`danger` 废弃，用 `color: 'danger'`）
- [x] P1 `:234-248` drawer `z-index` prop
- [x] P2 `:47` tab-panel `name` 非必填 + 自动选中首个页签
- [x] P2 `:84-107` `header-class`/`footer-class`、`title` 类型（**第二轮**补「拖拽结束/尺寸变化后自动越界校正」）
- [x] P2 `:23`、`:76` tab-bar 位移按钮与下拉按钮同容器

### 3.8 `references/components/navigation.md`

- [x] P0/P1/P2 全部 10 条（dropdown-panel/dropdown 删 `position`、`dropdown-icon` 默认值区分、`dropdown-trigger` 默认值区分、删 `dropdown-attrs`、`show()` 必要参数、补四个 `dropdown-*` props、`'$parent'`、`delayHide`/`updatePosition`/`visible`、「包裹组件」称谓）

### 3.9 `references/components/data.md`

- [x] P0 `:93`、`:95-96` 删 `virtual-scroll`、`table-width`、`table-min-width`
- [x] P0 `:132` `headerCheckbox` 需配 `header-checked`，补 prop 与 `update:header-checked` 事件
- [x] P1 `:25` `cascaded-check` 保留 + 标注未生效（D1）
- [x] P1 `:72` calendar `value-format`/`value-type`/`week-starts-on`
- [x] P1 `:9`、`:13`、`:17-43` list-item `tag`、list-divider props、tree ref 方法（**第二轮**修正 `expandAll` 缺省语义：缺省仅展开第一层，非全展）
- [x] P1 `:46-57` tags `dropdown-*` 透传（**第二轮**修正：仅 class/style/width/anchor 四个 prop，trigger 固定 `click`；props 表补齐三行）
- [x] P2 其余 6 条（list-item 插槽、tree props 默认映射、node-icons 默认值、默认值补录、column 细节、links/tags 签名）

### 3.10 `references/components/feedback.md`

- [x] P0 `:54`、`:59` 示例图标改为已注册图标（`info`/`alert`）
- [x] P1 `:45` status-box 删 `width`/`height`
- [x] P1 `:27-31` notify `duration` 与纯字符串调用
- [x] P2 `:3-16` messageBox `showMessage`/`callback`（**第二轮**补 `type` 缺的 `success`）
- [x] P2 `:11-13` confirm resolve 值 `'$ESC'`/`'$MASK'`/`'$X'`

### 3.11 `references/components/basic.md`

- [x] P1 `:13-21` SVG 注册前提（URL 字符串 vs `?raw`）
- [x] P2 `:3-8` `animation` prop 与 `icon="name:animation"`

### 3.12 `references/styles.md`

- [x] P0 `:314` `justify-*` 删 `left`/`right`、补 `normal`
- [x] P0 `:457` 等边框宽度 n 范围改 2~4
- [x] P1 `:53` translucent 暗色行为（仅语义色与 gray 升 0.2）
- [x] P1 `:68-76` `-faint` 暗色取 `-9`
- [x] P1 `:297-333` 对齐工具类补 `content-*`/`justify-items-*`/`justify-self-*` 及 `-safe`
- [x] P1 补 `.mu-dark` 暗色主题一节
- [x] P2 `:306` `self-auto`
- [x] P2 `:167` 等 padding `-auto` → **第二轮修正**：源码已删除该生成规则（仅 margin 保留 `-auto`），文档三处改为「仅 margin 支持」
- [x] P2 `:449` 圆角前缀两套类名说明统一
- [x] P2 补 `.mu-*` 前缀别名类 → **第二轮修正**表述：「多数提供」，例外 `.text-left/center/right`、`.bg-none` 无别名
- [x] P2 补 pointer.scss 工具类
- [x] P2 `:80-92` 补 `--mu-text-color-weak`
- [x] P2 补 `.mu-link`/`.mu-link--danger`
- [x] P2 `:27` gray 优先级交叉引用
- [x] **第二轮追加**：`.z-above` 补入类表（源码 `layout.scss:18` 已生成，原文档缺失）
- [x] **第二轮追加**：`:3` 小节名「硬性禁止清单」→「快速自检清单」

### 3.13 `references/upgrade/rules.md`

- [x] P1 `:1124`、`:1146` `dropdown-align → dropdown-position` 迁移行改「暂无对应」+ 标注未生效
- [x] P1 `:1328`、`:1350` `cascaded-check` 标注未生效、删示例

### 3.14 结构性任务

- [x] P1 删除 `data-display.md`、`basic-elements.md`（`bccdf9c`）
- [x] P1 同步引用 → **过时**：`CLAUDE.md` 已被 `AGENTS.md` 取代（同一提交删除），无引用可改
- [ ] P2 `upgrade/process.md` + `rules.md` 专项核对 → 见 §7 遗留

---

## 4. 决策点（实际执行结果）

| # | 问题 | 实际执行 |
|---|---|---|
| D1 | `cascaded-check` 处理 | 按建议：保留属性行 + 标注「当前版本未生效」 |
| D2 | dropdown `position`/`dropdown-position` | 按建议：删除属性表行；`upgrade/rules.md` 迁移行标「暂无对应」 |
| D3 | 速查表补组件范围 | 按建议：配套组件（`mu-input-group`/`mu-option`）不入速查表，仅参考文件正文出现 |

## 5. 完成后验证（已执行）

1. ✅ 全文 grep 校验无残留旧名（`end-offset`、`grid-column-span`、`virtual-scroll`、`table-width`、`dropdown-position`、`justify-left`、`data-display.md` 等）——当时 grep 范围仅 `skills/`，`docs/quick-reference_*.md` 的第一轮残留后经评审发现，已于 §6.1 补同步
2. ✅ `SKILL.md` 速查表与 `src/components/index.js` 注册清单对照（`mu-flex-splitter` 已移除未注册）
3. ✅ 各 P0 条目对应源码复核（第二轮复审确认，含 S3–S7）
4. ✅ `SKILL.md` 版本声明更新为 `4.1.*`（当前 `4.1.5`），核对日期 2026-09-30

---

## 6. 第二轮追加修订（2026-09-30）

背景：复审（源码 `4.1.5`）确认第一轮条目基本落地后，发现计划未覆盖的文档事实错误；按项目同步要求（skill / `docs-site/` / `docs/quick-reference_*.md` 三处副本）一并修订。

| 主题 | 修订内容 | 涉及文件 |
|---|---|---|
| padding `-auto` | 源码删除该生成规则（`spacing.scss`，仅 margin 保留）；文档改为「仅 margin 支持」 | `skills/.../styles.md:168,410,415`、`docs-site/guide/styles-spacing.md:38` |
| `.z-above` | 补入 z-index 类表（原三处均缺失） | `skills/.../styles.md:348`、`docs-site/guide/styles-layout.md:99`、`docs/quick-reference_styles.md:412` |
| 别名表述 | 「四组原子类均有等价别名」→「多数提供」+ 例外说明 | `skills/.../styles.md:605`、`docs-site/guide/styles.md:23` |
| 小节名 | 「硬性禁止清单」→「快速自检清单」 | `skills/.../styles.md:3` |
| MuBar | 删「`MuDateInput` 下拉面板的工具栏即基于它」（与源码不符） | `skills/.../layout.md:299`、`docs-site/components/bar.md` |
| tree `expandAll` | 缺省语义更正：缺省用 `auto-expand-level`，均未指定时仅展开第一层 | `skills/.../data.md:66`、`docs-site/components/tree.md:255` |
| tags `dropdown-*` | 更正为仅 class/style/width/anchor 四个 prop，trigger 固定 `click`；props 表补齐 | `skills/.../data.md`、`docs-site/components/tags.md`、`docs/quick-reference_components.md` |
| dialog buttons | 对象形式去掉废弃 `primary`/`danger`，说明 `is` 语义；补「拖拽/尺寸变更后自动越界校正」 | `skills/.../containers.md`、`docs-site/components/dialog.md`、`docs/quick-reference_components.md` |
| messageBox | `type` 补 `success` | `skills/.../feedback.md:49`、`docs-site/components/message-box.md:63` |
| 版本声明 | 版本 `4.1.5`、核对日期 2026-09-30、删除失效的 `4.0` 分支表述 | `skills/mussel-ui/SKILL.md:13-14` |

验证：`npm run docs:build` 通过（4.13s）；全文 grep 无旧表述残留；修订段落通读连贯。

**未随本轮修订（决策记录）**：
- `dropdown-items` 的 `{ is: '-' }` 是合法简写（shortcut 映射 `mu-list-divider`，`list-items.js:8`），与 dialog buttons 的 `is` 语境不同，quick-reference 对应处无需改。
- quick-reference 的 padding 表不含 `-auto`、无「等价别名」表述、无 tree ref 方法列表，故三处无需同步。

### 6.1 补同步与更正（2026-09-30，第三批）

评审发现 §5.1 的 grep 仅覆盖 `skills/`，第一轮条目从未同步到 `docs/quick-reference_*.md`；另有个别事实偏差，一并修正。措辞原则：不写对外部使用无用的内部实现细节。

| 主题 | 修订内容 | 涉及文件 |
|---|---|---|
| grid-cell | 删 `end-offset` 行（源码已无该 prop 与 `gridCell` 全局配置）；`col-end` / `row-end` 改为「末轨道号（含端点），转为网格线时 +1」；补 span 优先说明 | `docs/quick-reference_components.md` |
| dropdown | 删 `dropdown-position` 行（源码已移除该 prop）；「下拉菜单 Mixin」→「下拉能力包裹组件」 | 同上 |
| table | 删 `virtual-scroll` 行（源码已删） | 同上 |
| collapsible | 改为枚举式新语义（源码已按侧生效，第二轮 §6 同步表漏列）；简介删「内部分隔条（Splitter，内部组件）」措辞；VBox 对应行补 `collapsible` 取值 | `docs-site/components/split-box.md` |
| 收拢阈值 | 更正为「该侧 `min-width` / `min-height` 一半与 200px 的较小值，未设置时 200px」（源码 `Math.min(tMin/2, 200)`）；顺带删 quick-ref NOTE 中重复的双击重置句与 `display:none` 内部细节 | `skills/.../layout.md`、`docs/quick-reference_components.md`、`docs-site/components/split-box.md` |
| 全局配置示例 | 「其余字段」示例删已失效的 `gridCell.endOffset`，对齐 install.md 现行示例（`splitter.*`、`tree.nodeIcons`、`calendar.weekStartsOn`，源码 `calendar/constants.js:23` 确认读取） | `docs/quick-reference_components.md` |
| dialog 反例 | `{ caption: '确定', primary: true }` → `{ caption: '确定', color: 'primary' }`。核实：`primary`/`secondary`/`danger` 布尔 prop 在 `button.js` 中仍存在（映射到 `color` + dev 废弃警告），是 deprecated 仍可用而非失效；文档对象形式已不列这些字段，示例统一为 `color` 写法 | `skills/.../containers.md`、`docs-site/components/dialog.md` |
| rules.md V4 侧 primary | 「升级后」示例（:903）、Mussel 4 示例（:1281）、升级检查清单（:1312）三处 `primary: true` 统一为 `color: 'primary'`，与自身 :1201「优先使用 color」口径一致（V3 侧历史示例 :898/:1267 不动） | `skills/.../upgrade/rules.md` |

> 源码侧 `splitter.scss:82` 的注释死代码（`--handle-radius`）评审时一并指出，意图不明未随本轮处理。

## 7. 遗留事项

| # | 事项 | 说明 |
|---|---|---|
| 1 | `upgrade/process.md` + `rules.md`（1358 行）专项核对 | 仅核对了受源码改动影响的条目；需一轮逐条对照源码的专项核对，建议单开任务 |
| 2 | 用户级 skill 副本同步 | `~/.agents/skills/mussel-ui` 为实体副本（`~/.zcode/skills/mussel-ui` 软链到它），当前落后第二轮 6 个 skill 文件；待确认同步方式后执行 |
