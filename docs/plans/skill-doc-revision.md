# mussel-ui Skill 文档修订任务

| 项目 | 内容 |
|---|---|
| 状态 | 待执行 |
| 范围 | `skills/mussel-ui/` 全部文件 |
| 依据 | 2026-08-28 对照 `4.0` 分支源码的全面评审；源码版本 `4.1.0`（含当日未提交修复，见 §2） |
| 不在范围 | `docs/quick-reference_*.md` 等其他文档；源码改动（本轮已另行完成） |

---

## 1. 源码决策记录（决定文档处理方式）

| # | 源码事项 | 处理 | 文档影响 |
|---|---|---|---|
| S1 | `colors.js:70` `.count` → `.length` | ✅ 已修复 | `install.md`/`SKILL.md` 换肤描述恢复有效，**无需改**（评审致命 #4 关闭） |
| S2 | `drawer.vue` validator 键名 | ✅ 已修复 | 无 |
| S3 | `table.vue` 删除 `virtual-scroll` 死 prop；`table-width`/`table-min-width` 所在的 `table.virtual-scroll.vue` 整文件删除 | ✅ 已修复 | `data.md` 对应三行成为虚构 API，**P0 删除** |
| S4 | `tree.vue` `cascaded-check` | 保留不动（不实现） | 文档需删除或标注未生效 → 决策点 D1 |
| S5 | dropdown `position` / `dropdown-position` | 保留注释不动 | 文档需删除或标注不可用 → 决策点 D2 |
| S6 | `segmented.vue` 组件级 `disabled` | ✅ 已实现 | `form.md:480` 恢复正确，**无需改**（评审致命 #3 关闭） |
| S7 | `grid-cell.vue` 重写：6 props（colStart/colSpan/colEnd/rowStart/rowSpan/rowEnd）计算输出 `grid-column` / `grid-row` 两个样式属性；`endOffset` prop 删除，`+1` 换算内建 | ✅ 已修复 | `layout.md` grid-cell 一节整体过时，**P0 重写** |

S7 语义要点（写文档时以此为准）：

- `colEnd`/`rowEnd` 为**末轨道号（含端点）**，内部 `+1` 转为网格线；
- `span` 与 `end` 同设时 `span` 优先；
- 仅 `start` → `grid-column: 2`；仅 `span` → `grid-column: span 3`；仅 `end` → `grid-column: auto / 5`；两者 → `2 / span 3` / `1 / 3`；
- 全空不输出该属性。

## 2. 修订完成后需同步

- `SKILL.md:13-14` 版本声明：`4.0.*` → `4.1.*`，核对日期改为实际完成日。

---

## 3. 任务清单

优先级：P0 = 事实错误（照文档写代码无效/报错）；P1 = 语义偏差或重要遗漏；P2 = 小遗漏/表述。

### 3.1 `SKILL.md`

- [ ] P1 `:61` —「硬性禁止清单（5 条）」与 `principles.md` 实际结构不符（自述硬性禁止 4 条、自检小节 7 项，三处计数不一致）。统一口径后改此处数字。
- [ ] P1 速查表补遗漏的已注册组件（`src/components/index.js` 对照）：`mu-pagination`、`mu-bar`、`mu-search-input`、`mu-input-group`、`mu-option`、`mu-dropdown-item`/`-check-item`/`-radio-item`、`mu-flex-divider`/`mu-flex-space`/`mu-flex-break`（后三个也可只在 layout.md 展开，速查表至少留一行）。
- [ ] P0 `:75` colors 说明「自动派生 `--mu-*` 变量」补充合法 key 全集：7 个语义 key + 12 个基本色名（red/pink/grape/violet/indigo/blue/cyan/teal/green/lime/yellow/orange）；注明 `neutral`/`gray` 仅作灰阶基准，不派生自身调色板。
- [ ] P2 §2 结束后更新「最后核对日期」。

### 3.2 `references/install.md`

- [ ] P0 `:36` — 全局配置示例 `gridCell.endOffset` 已随 S7 失效，换为现存示例（如 `splitter.*`、`tree.nodeIcons`）。
- [ ] P1 `:32`、`:103` — colors key 全集同 SKILL.md（12 基本色名）；`neutral`/`gray` 不派生自身调色板、仅作灰阶基准（优先级 neutral → gray → primary）。
- [ ] P1 `:40` — install 执行顺序更正为：`setupLocale` → `setupRootClass` → `setupColors`（语言最先；src/index.js:42-44）。
- [ ] P2 `:35` — `localeResources` 为**整包替换**而非合并，只传部分字段会丢失该语言内置键（langs/index.js:37-39）。

### 3.3 `references/principles.md`

- [ ] P1 「硬性禁止」结构统一：`:10`（2–5 条 = 4 条）、`:320-330`（7 项）与 SKILL.md 的「5 条」三处对齐。建议明确分节：硬性禁止 N 条 + 自检清单 M 项。
- [ ] P2 抽查 Good/Bad 示例中出现的 API 名，随本次各组件文档修订联动更正（目前未发现独立错误）。

### 3.4 `references/components/layout.md`

- [ ] P0 `:71-76` — grid-cell props 表重写（S7）：删 `end-offset` 行；`col-span`/`row-span` 的"对应样式"由 `grid-column-span` 改为 `grid-column: span N`；`col-end`/`row-end` 说明改为「末轨道号（含端点），内部 +1 转网格线」。
- [ ] P0 `:87` — 等价示例 `style="grid-column-span: 2; grid-row-span: 3"` 改为 `style="grid-column: span 2; grid-row: span 3"`。
- [ ] P1 `:267` — 删除「MuPagination 不是 MuToolbar 的注入消费者」论断；实际 `inject('toolSize')` 并透传（pagination.vue:65-66），与 data.md:198 口径统一。
- [ ] P1 `:142`、`:181` — collapsible 可选值 `true | 'left' | 'right' | false` 修正：prop 为 Boolean，字符串侧别值会被 Vue 转 true、两侧分隔条均生效；侧别仅影响收拢（display:none）判定。如源码后续修复侧别行为，此处再回改。
- [ ] P1 `:262-266` — toolbar 注入优先级补关键例外：按钮位于 `mu-button-group` 内时完全不消费 toolSize 注入（button.js:29-30）。
- [ ] P2 补 `mu-flex-divider`/`mu-flex-space`/`mu-flex-break` 组件条目（layout/index.js:9-16；原子类形式 styles.md:343-348 已有）。
- [ ] P2 `mu-bar` 补正式条目（无 props、默认插槽、固定高 40px 条形容器）。
- [ ] P2 `:229` — `v-mu-scrollbar` 指令补充 `'none'` 等价 `false`（历史兼容值，directive.js:4）。

### 3.5 `references/components/buttons.md`

- [ ] P1 `:34` — `mu-button-group` 属性表补 `color`（String，normal/primary/secondary/danger，button-group.vue:22-25），废弃 Boolean 保留标注。
- [ ] P1 `:50`、`:54` — icon-button 说明更正：根元素渲染 `<a class="mu-button mu-icon mu-icon-button">` 而非 `<button>`（无 href 时不可 Tab 聚焦）；`icon` 非必填。
- [ ] P2 `:15` — `pill` 与 `button-style="link"` 互斥，补充说明。
- [ ] P2 `:9-11` — `size`/`button-style`/`color` 源码均无默认值（normal 为视觉等效），表述由「默认 normal」改为「未设置时等效 normal」。

### 3.6 `references/components/form.md`

- [ ] P1 `:318` — `value-format` 生效条件更正：由 `value-type` 控制，默认 `value-type: 'date'` 输出 Date 对象，仅 `value-type="string"` 时按 `value-format` 输出字符串；props 表补 `value-type`、`week-starts-on`、`min`、`max`（calendar/constants.js:11-27）。
- [ ] P1 `:316-317` — date-input `type` 补 `week`（validator 五值，date-input.vue:85）；默认 format 表补 `week: 'yyyy-Www'`；行为说明补 week 分支（「今天」按钮在 week 视图为「本周」，date-input.vue:153-163）。
- [ ] P1 `:89` — 删除「quarter 需用对象形式」限制：字符串 `input: 'quarter'` 可用（input-types.js:7）。
- [ ] P1 `:83-96` — `input` 字符串形式清单补 `week`、`time`（input-types.js:5,9）。
- [ ] P1 `:164` — input `size` 补 `large`（input.js:16-19）。
- [ ] P2 `:34-39` — mu-form ref 方法补 `errors`（defineExpose，form.vue:112-116）。
- [ ] P2 `:180-181` — `enter`/`esc` 事件参数为原始键盘事件对象（input.js:69-70）。
- [ ] P2 `:78` — form-field `error` 类型 `[Boolean, String]`，Boolean 时仅显示错误样式不显示文案。
- [ ] P2 `:483-495` — segmented 补默认作用域插槽 `{ option }`（含 value/label/icon/disabled）。

### 3.7 `references/components/containers.md`

- [ ] P1 `:91` — dialog header `'auto'` 判定条件删去 `icon`：`title || close-button || maximize-button || header slot`（dialog.vue:123-127）。
- [ ] P1 `:141` — buttons 对象形式补 `is`（自定义渲染组件，如分隔 `is: '-'`/空格）、`danger`（`#OK!`/`#YES!` 预设实际使用 danger，button-presets.js:13-33）、`key`。
- [ ] P1 `:234-248` — drawer 补 `z-index` prop（drawer.vue:34）。
- [ ] P2 `:47` — tab-panel `name` 非必填；补 mu-tabs 未设 `active-tab` 时自动选中第一个页签（tabs.vue:83-87）。
- [ ] P2 `:84-107` — dialog 补 `header-class`/`footer-class`；`title` 类型 `[String, Object]`；补标题栏拖拽移动、越界校正行为（dialog.vue:170-221）。
- [ ] P2 `:23`、`:76` — tab-bar 位移按钮位置描述更正：位移按钮（×2）与列表下拉按钮同在滚动容器一端的 `.mu-scroll-area__buttons` 容器，非两端分布。

### 3.8 `references/components/navigation.md`

- [ ] P0 `:11` — `mu-dropdown-panel` 删除 `position` 行（或标注「当前版本未生效，恒 auto」；dropdown-panel.vue:55-59,89-91）→ 决策点 D2。
- [ ] P0 `:63` — `mu-dropdown` 删除 `dropdown-position` 行（同上，dropdown-wrapper.js:30-34,67）→ 决策点 D2。
- [ ] P1 `:64` — `dropdown-icon` 默认值更正：mu-dropdown 默认**不显示**箭头（无默认值）；默认显示下箭头的是 mu-dropdown-button。
- [ ] P1 `:29` — `dropdown-trigger` 默认值区分：mu-dropdown 为 `hover`（dropdown.vue:35），mu-dropdown-button 为 `click`（dropdown-wrapper.js:25-29）。
- [ ] P1 `:66` — 删除 `dropdown-attrs` 行（死 prop，声明未使用，dropdown-wrapper.js:15）。
- [ ] P1 `:23` — `show()` 补必要参数 `{ anchor, width, height, trigger }`，无参调用会抛错（dropdown-panel.vue:99,136-183）。
- [ ] P2 `:58-67` — 补 props：`dropdown-class`、`dropdown-style`、`dropdown-scrollbar`、`dropdown-panel`（Object，复用外部面板实例）。
- [ ] P2 `:67` — `dropdown-anchor` 补特殊值 `'$parent'`。
- [ ] P2 `:21-23` — dropdown-panel 补 `delayHide()`/`updatePosition()` 方法与 `visible` 状态。
- [ ] P2 `:56` — 「下拉菜单 Mixin」称谓改为「包裹组件」。

### 3.9 `references/components/data.md`

- [ ] P0 `:93` — 删除 `virtual-scroll` 行（prop 已从源码移除，S3）。
- [ ] P0 `:95-96` — 删除 `table-width`、`table-min-width` 行（源已删除；未注册的 big-table.vue 不在文档范围）。
- [ ] P0 `:132` — `headerCheckbox` 行更正：需同时传 `header-checked` prop（Object）才显示；props 表补 `header-checked`、事件表补 `update:header-checked`（载荷 `(column, value)`）（table.vue:22-27,71,92）。
- [ ] P1 `:25` — `cascaded-check` 行处理 → 决策点 D1（删除或标注未生效）。
- [ ] P1 `:72` — calendar `value-format` 同 form.md 修正（受 `value-type` 控制）；补 `value-type`、`week-starts-on` props。
- [ ] P1 `:9` — list-item `tag` 默认渲染 `span` 非 `div`（list-item.vue:28）。
- [ ] P1 `:13` — list-divider 补 `icon`/`label` props 与 default 插槽（list-divider.vue:3-8,17-20）。
- [ ] P1 `:17-43` — tree 补 ref 方法：`expand(...nodes)`/`collapse(...nodes)`/`expandTo(target)`/`expandAll({level})`/`collapseAll()`（tree.vue:130-136）。
- [ ] P2 `:3-9` — list-item 补 default 插槽。
- [ ] P2 `:22` — tree `props` 补默认字段映射（key 默认 `'id'`，及 icon/label/title/disabled/childNodes/isLeaf/checked，default-options.js:1-10）。
- [ ] P2 `:29-30` — `node-icons`/`expand-icons` 补默认值 `true` 与默认图标集（leaf:file/folder:folder/folderOpen:folderOpen）、全局 `tree.*` 定制。
- [ ] P2 `:86-91` — 补默认值：`hover-mode: row`、`gridlines: all`、`records-offset: 0`。
- [ ] P2 `:107-132` — column 补 `key`、enum `default` 兜底键、date/datetime `formatter`、number/currency `locale`/`locales`。
- [ ] P2 `:127,129` — `links`/`tags` 函数签名 `(record, value)`；补不传时按字段值转换的默认行为。
- [ ] P2 `:46-57` — tags 补 `dropdown-*` attrs 透传说明（tags.vue:59-65）。

### 3.10 `references/components/feedback.md`

- [ ] P0 `:54`、`:59` — 示例图标 `icon="empty"`/`icon="error"` 在默认图标集中不存在（运行时 warn 且不渲染），改为已注册图标名。
- [ ] P1 `:45` — status-box 删除 `width`/`height` 行（无此 props，status-box.vue:21-25）。
- [ ] P1 `:27-31` — notify 补 `duration` 选项（默认 3000ms）与纯字符串调用形式。
- [ ] P2 `:3-16` — messageBox 补 `showMessage(options)`；各方法补第二参数 `callback`。
- [ ] P2 `:11-13` — confirm resolve 值补 `'$ESC'`/`'$MASK'`/`'$X'`（ESC/遮罩/右上角 X 关闭）。

### 3.11 `references/components/basic.md`

- [ ] P1 `:13-21` — SVG 注册方式补前提：普通 Vite 应用 `import x from '*.svg'` 得到 URL 字符串、不被识别；需 `?raw` 导入或等价插件（库内靠自定义 vite 插件编译为源码字符串）。
- [ ] P2 `:3-8` — mu-icon 补 `animation` prop 与 `icon="name:animation"` 语法（icon.vue:20、icon.js:7-11）。

### 3.12 `references/styles.md`

- [ ] P0 `:314` — `justify-*` 删去不存在的 `left`/`right`，补 `normal`（layout.scss:156-172）。
- [ ] P0 `:457`、`:462`、`:464-474` — 边框宽度 n 范围 1~4 改为 2~4（border.scss:25-29），1px 用无后缀 `.border`。
- [ ] P1 `:53` — translucent 暗色行为更正：仅语义色与 gray 升至 0.2，12 基本色仍 0.1（root.scss:85-92）。
- [ ] P1 `:68-76` — `-faint` 暗色下改用最深色阶 `-9`（root.scss:90）。
- [ ] P1 `:297-333` — 补对齐工具类：`content-*`、`justify-items-*`、`justify-self-*` 及 `-safe` 变体（layout.scss:144-196）。
- [ ] P1 — 补 `.mu-dark` 暗色主题一节：class 由 install 的 `dark` 选项加到根元素；暗色下 token 重映射（灰阶反转 gray-1/4/7/10/12、边框 gray-6/9/12、bg-normal=gray-19、bg-overlay=gray-17，root.scss:85-116）。
- [ ] P2 `:306` — `self-*` 补 `auto`（layout.scss:140-142）。
- [ ] P2 `:167`、`:395`、`:399-407` — padding 后缀补 `-auto`（spacing.scss:26-28）。
- [ ] P2 `:449` — 圆角前缀标注自相矛盾：源码两套都生成（`.radius-*` 与 `.mu-radius-*`，border.scss:44-49），统一说明。
- [ ] P2 — 补 `.mu-*` 前缀别名类：`.mu-text-*`/`.mu-bg-*`/`.mu-shadow-*`/`.mu-radius-*`。
- [ ] P2 — 补 pointer.scss 工具类：`.cursor-*`、`.select-*`、`.pointer-event-*`。
- [ ] P2 `:80-92` — 补 `--mu-text-color-weak`（root.scss:99，暗色兼容）。
- [ ] P2 — 补 `.mu-link`/`.mu-link--danger`（link.scss，无对应组件）。
- [ ] P2 `:27` — gray 自定义优先级补交叉引用（neutral → gray → primary，详见 install.md；colors.js:47-54）。

### 3.13 `references/upgrade/rules.md`

- [ ] P1 `:1124`、`:1146` — `dropdown-align → dropdown-position` 迁移行随 D2 同步（目标属性当前不生效，需标注或改迁移目标为「暂无对应」）。
- [ ] P1 `:1328`、`:1350` — `cascaded-check` 属性行与 `:cascaded-check="true"` 示例随 D1 同步（标注未生效或删除）。

### 3.14 结构性任务

- [ ] P1 删除 `references/components/data-display.md`（内容过期：toolbar `button-style` 旧说法，源码实际 `tool-size`/`default-button-style`）与 `basic-elements.md`（与 `basic.md` 逐字节相同）。
- [ ] P1 同步 `CLAUDE.md:288,290` 对上述两文件的引用改为 `data.md`/`basic.md`。
- [ ] P2 `upgrade/process.md` 本次未逐条核对（1533 行 rules.md 仅核对了受源码改动影响的条目），修订完成后建议补一轮专项核对。

---

## 4. 决策点（执行前需确认）

| # | 问题 | 默认建议 |
|---|---|---|
| D1 | `cascaded-check`（源码保留声明但不实现）：文档删除该行，还是保留并标注「当前版本未生效」？ | 保留 + 标注（属性存在，避免迁移文档断链） |
| D2 | dropdown `position`/`dropdown-position`（源码保留注释）：删除还是标注「暂不可用，恒 auto」？ | 删除属性表行，在 upgrade/rules.md 迁移行标注「暂无对应」 |
| D3 | 速查表补 11 个组件：全部入表，还是仅补有独立使用价值的（pagination/search-input/dropdown-item 系列/flex 系列），`mu-input-group`/`mu-option` 这类配套组件只在参考文件正文出现？ | 按后者：配套组件不入速查表 |

## 5. 完成后验证

1. 全文 grep 校验无残留旧名：`end-offset`、`endOffset`、`grid-column-span`、`grid-row-span`、`virtual-scroll`、`table-width`、`table-min-width`、`dropdown-position`、`justify-left`、`justify-right`、`data-display.md`、`basic-elements.md`。
2. `SKILL.md` 组件速查表与 `src/components/index.js` 注册清单逐项对照，无遗漏、无多余。
3. 抽查本轮 P0 修正条目对应的源码行号仍成立（防止文档修订期间源码再变动）。
4. 更新 `SKILL.md:13-14` 版本声明与核对日期。
