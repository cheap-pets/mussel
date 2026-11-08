# 探索报告 — mussel-ui skill 整体检查与优化

调研范围：`skills/mussel-ui/` 全部文件 vs `src/`（components/styles/index.js/icons）现状。只读探索，全部结论附 `path:line` 证据。路径相对 `D:\workshop\cheap-pets\mussel\`。

---

## 1. 现状盘点

### 1.1 文件清单（17 个文件，共 6047 行；升级类 5 个文件 2501 行，占 41%）

| 文件 | 行数 | 职责（一句话） |
|------|-----:|----------------|
| `skills/mussel-ui/SKILL.md` | 184 | 入口：任务类型识别（默认 UI 路径 / V3→4 / V1→4 升级 opt-in）、API/styles 路由表、组件选型速查表 |
| `references/principles.md` | 366 | 代码规范与强制约束：5 条核心规范 + Good/Bad 示例 + 快速自检清单 + 可机器执行 grep 检查 |
| `references/install.md` | 121 | install(app, options) 全字段、$mussel 上下文、installIcons、运行时换肤 setupColors、ex 版构建说明 |
| `references/styles.md` | 674 | CSS 变量 Token 全表（1.1~1.14）+ 原子类全表（2.1~2.5）+ 常用布局模式示例（§3） |
| `references/components/layout.md` | 327 | MuFlexBox/HBox/VBox、GridBox/GridCell、Splitter/SplitHBox/VBox、ScrollBox、ScrollArea、Toolbar、Bar、Flex 辅助三件套 |
| `references/components/containers.md` | 299 | MuTabs/MuTabPanel/MuTabBar、MuDialog（含 buttons 预设与封装示例）、MuDrawer、嵌入容器 container |
| `references/components/buttons.md` | 70 | MuButton、MuButtonGroup、MuIconButton |
| `references/components/form.md` | 579 | MuForm/FormRow/FormField（数据驱动 items/rules）、MuInput 及全部输入组件（search/input-group/select/option/combo/multi-select/date/date-range/time/color/check/check-group/radio/radio-group/segmented/switch） |
| `references/components/navigation.md` | 298 | MuSideMenu、MuMenu、MuDropdownPanel/Dropdown/DropdownButton、三个 DropdownItem、MuContextMenu、menu items 与 dropdown-items 数据结构 |
| `references/components/data.md` | 447 | MuListItem/ListDivider、MuTree、MuTags、MuCalendar、MuTable（列配置/15 列类型）、MuTableEx（编辑/树形/合并/选中）、MuPagination |
| `references/components/feedback.md` | 112 | MuTooltip/指令、MessageBox、Notifier、MuStatusBox |
| `references/components/basic.md` | 69 | MuIcon（含注册示例）、MuBadge、MuSortIcon |
| `references/upgrade-v3/process.md` | 227 | M3→4 升级流程：退出检查 → 确认源目录 → 分析 → 计划 → 执行 + M4 速查表指引 |
| `references/upgrade-v3/rules.md` | 1327 | M3→4 迁移规则权威定义：1 全局配置 → 2 CSS → 3 布局 → 4 图标 → 5 组件迁移(5.1~5.12) → 6 新增组件 |
| `references/upgrade-v1/overview.md` | 89 | M1→4 总览：v1 版本档次判定（0.1.x/1.0.x 早中后期）、变化总览表、组件去向速查表 |
| `references/upgrade-v1/process.md` | 208 | M1→4 升级流程（结构同 v3，多一步"版本档次判定"） |
| `references/upgrade-v1/rules.md` | 650 | M1→4 迁移规则：1 框架(Vue2→3) → 2 全局配置 → 3 CSS → 4 布局 → 5 图标 → 6 组件(6.1~6.12) → 7 无对应项 → 8 新增能力 |

无其他文件（无 assets、无 scripts）。

### 1.2 SKILL.md 章节结构

- L1-9 frontmatter（name/author/date/description，description 含升级触发词）
- L11 标题；L13 范围声明（含"M3→4 与 M1→4 迁移"字样）
- L15-18 版本检查块（4.3.* / 核对日期 / 以源码为准）
- L20-78 工作流程：
  - 步骤 1 识别任务类型（L22-51）：默认路径（L24-25）+ 升级路径 opt-in 路线 A/B 进入条件（L27-37）+ 疑问先问（L39）+ 升级加载指引（L41-51）
  - 步骤 2 按需查阅（L53-74）：principles 5 条 → 组件 API 8 类路由表 → styles.md → install.md
  - 步骤 3 生成后自检（L76-78）
- L82-86 安装与初始化（指向 install.md）
- L90-185 组件速查表（8 小节，只列选型不列 API）

---

## 2. 升级内容拆分边界

### 2.1 升级内容在现有文件中的分布

**mussel1→4（Vue 2 / @mctech/mussel）**

| 位置 | 内容 |
|------|------|
| `references/upgrade-v1/`（3 文件 947 行） | 全部规则与流程，自包含 |
| `SKILL.md:7-8` | description 升级触发句（"升级到 Mussel 4"、"迁移到新版 Mussel"） |
| `SKILL.md:13` | 范围声明中的"M1→4 迁移" |
| `SKILL.md:34-37` | 路线 B 进入条件（3 条） |
| `SKILL.md:46-51` | 路线 B 文件加载指引（overview→process→rules 顺序 + v4 API 查阅指向） |

主线其余文件（principles/install/styles/components 8 件）经 grep 验证 **无任何 v1 内容**（`grep -rn "Mussel 1\|M1\|@mctech" references/principles.md references/install.md references/styles.md references/components/` 0 命中）。

**mussel3→4（mussel 3.x / Vue 3）**

| 位置 | 内容 |
|------|------|
| `references/upgrade-v3/`（2 文件 1554 行） | 全部规则与流程，自包含 |
| `SKILL.md:7-8`、`SKILL.md:13` | 同上（两条路线共用） |
| `SKILL.md:29-33` | 路线 A 进入条件（3 条 + V3 模式四类锚点） |
| `SKILL.md:42-45` | 路线 A 文件加载指引 |
| `references/principles.md:365` | 尾注"已废弃 API 集中在 upgrade-v3/rules.md"——**主线文件中唯一的升级交叉引用** |

### 2.2 升级内容 ↔ 主线内容交叉引用清单（拆分后需改写的全部位置）

**升级 → 主线（12 处）**

| 位置 | 指向 |
|------|------|
| `upgrade-v3/process.md:225` | `SKILL.md` 组件速查表与步骤 2 路由表、`references/styles.md`、`references/install.md` |
| `upgrade-v3/rules.md:9` | `references/components/*` 与 `references/styles.md` 为单源 |
| `upgrade-v3/rules.md:45`、`:152` | `references/install.md` |
| `upgrade-v3/rules.md:281` | `references/styles.md` |
| `upgrade-v3/rules.md:637`、`:654` | `references/components/containers.md` |
| `upgrade-v3/rules.md:1119` | `references/components/form.md` |
| `upgrade-v3/rules.md:1177` | `references/components/basic.md` |
| `upgrade-v3/rules.md:1300` | `SKILL.md` 速查表路由 |
| `upgrade-v1/overview.md:7` | "以本 skill SKILL.md 的版本声明为准"（版本检查同构段） |
| `upgrade-v1/overview.md:12` | `references/components/*` 与 `references/styles.md` |
| `upgrade-v1/rules.md:11`、`:104`、`:316`、`:408`、`:498`、`:527`、`:536` | components/styles 单源声明及 form/data/navigation 分文件指向 |
| `upgrade-v1/process.md:38` | "M3→4 不走本流程，改用本 skill 的 `references/upgrade-v3/`"（唯一跨 upgrade 目录引用） |

**主线 → 升级（仅 2 个文件）**

- `SKILL.md:25`（"不要加载 upgrade-v3/v1"）、`SKILL.md:27-51`（路线 A/B 全段）
- `principles.md:365`（指向 upgrade-v3/rules.md）

install.md、styles.md、components/*.md 内经 grep 验证 **无** 指向 upgrade 的引用。

### 2.3 可机械拆出的最小切割清单

1. **目录迁移**：`references/upgrade-v3/`（2 文件）→ `skills/mussel3to4/references/`；`references/upgrade-v1/`（3 文件）→ `skills/mussel1to4/references/`。两目录内部互引仅 1 处（`upgrade-v1/process.md:38`），无其他耦合。
2. **新建 `skills/mussel3to4/SKILL.md`**：frontmatter（name/description 含"升级到 Mussel 4/迁移/把 V3 改成 V4"触发词，00-task 约束 L22）+ 版本检查行（改写自 `SKILL.md:15-18`）+ 进入条件（`SKILL.md:29-33` 三条，可精简）+ 加载指引（`SKILL.md:42-45`）+ v4 API/styles 查阅指向 mussel-ui skill。
3. **新建 `skills/mussel1to4/SKILL.md`**：同上，触发词含"@mctech/mussel/Mussel 1/Vue 2 升级"；路线 B 加载指引（`SKILL.md:46-51`）；说明"不走 mussel3to4 流程"（原 `upgrade-v1/process.md:38` 改指新 skill）。
4. **改写 mussel-ui/SKILL.md**：L7-8 description 去升级句；L13 去"M3→4 与 M1→4 迁移"括注；L27-51 整段替换为指引行（验收标准 1 允许留指引）。
5. **改写 `principles.md:365`**：升级指引改指新 skill 或删除。
6. **改写升级文件内部主线指针**：2.2 表中 12 处，`references/components/*` 等路径语义改为"mussel-ui skill 的 references/…"；`upgrade-v1/overview.md:7` 版本声明改指自身 SKILL.md。

### 2.4 拆出后 mussel-ui 侧需要留指引/改写的位置汇总

- `SKILL.md` frontmatter description（去升级触发词，避免误触发）
- `SKILL.md:13` 范围括注
- `SKILL.md:27-51` → 一行指引（两个新 skill 名 + 触发场景）
- `principles.md:365` 尾注
- 项目根 `AGENTS.md` 不在任务范围（其中"修改组件 API 三处同步"提法不受影响，references/ 仍存在）

---

## 3. 一致性与覆盖

### 3.1 references/components 覆盖 vs src/components 实际注册组件

src 实际注册组件全集（来源 `src/components/index.js:26-61` + 各 `*/index.js`）：

- layout：MuHBox, MuVBox, MuSplitHBox, MuSplitVBox, MuFlexDivider, MuFlexSpace, MuFlexBreak, MuGridBox, MuGridCell（`src/components/layout/index.js:1-20`）
- menu：MuSideMenu, MuMenu；message：MuStatusBox + messageBox install；modal：MuDialog, MuDrawer
- dropdown：MuDropdownPanel, MuDropdownItem, MuDropdownCheckItem, MuDropdownRadioItem, MuDropdown, MuDropdownButton, MuContextMenu
- collapse：**MuCollapse, MuCollapseGroup**（`src/components/collapse/index.js`）
- bar：MuBar, MuToolbar, MuPagination, MuScrollArea；button：MuButton, MuIconButton, MuButtonGroup
- icon：MuIcon, MuSortIcon；tree：MuTree, MuTreeNode；tooltip：MuTooltip + v-mu-tooltip
- form：MuInput, MuSearchInput, MuInputGroup, MuSelect, MuMultiSelect, MuComboBox, MuOption, MuDateInput, MuDateRangeInput, MuTimeInput, MuColorInput, MuSwitch, MuCheck, MuCheckGroup, MuRadio, MuRadioGroup, MuSegmented, MuForm, MuFormRow, MuFormField（`src/components/form/index.js`）
- list：MuListItem, MuListDivider（无 MuList 组件，`src/components/list/index.js`）；calendar：MuCalendar；tabs：MuTabs, MuTabBar, MuTabPanel
- 直接注册：MuTag, MuTags, MuBadge, MuTable, MuScrollBox（`src/components/index.js:18-22,54-60`）

**差集**：

- **缺（已注册、references/components 无文档、SKILL.md 速查表也无）**：
  1. `MuTag`（单标签，`src/components/tag/tag.vue`，注册于 `src/components/index.js:18`）——data.md 只有 MuTags（`data.md:71`）
  2. `MuCollapse` / `MuCollapseGroup`（`src/components/collapse/`）——仅在升级文件出现（`upgrade-v1/rules.md:591,613`），无任何主线 API 文档
- **多（文档写了但 src 无）**：无。MuTreeNode 文档已标注内部依赖（`data.md:57`）；MuTableEx 仅 ex 版含、文档已注明（`data.md:256`）；"mu-list 未注册"文档口径与 src 一致（`upgrade-v1/rules.md:521` vs `src/components/list/index.js`）。
- SKILL.md 速查表 vs references：速查表另缺 `mu-collapse`/`mu-collapse-group`/`mu-tag`/`mu-input-group`（后者 form.md:213 有文档，仅速查表未列——速查表定位选型，缺 collapse 系是实质缺口）。

### 3.2 styles 文档 vs src/styles 现状

src/styles 共 11 文件（root/animation/atomic.js/background/border/box-shadow/layout/link/pointer/spacing/typography），atomic.js 依序引入全部（`src/styles/atomic.js:1-10`）。比对结果：

- **一致**：z-index 六级变量（`root.scss:127-132` = styles.md §1.12）；间距 0/half/1x-4x + 仅 margin 有 auto（`spacing.scss:16-43` = §1.10/§2.2）；边框 4 色 × 7 方向 + 3 样式 × 7 方向（`border.scss:14-17,37` = §2.3）；flex 0~8/对齐/gap/flex 辅助元素（`layout.scss:93-207` = §2.1）；pointer/link 类（`pointer.scss`、`link.scss` = §2.5）。
- **缺口 1（实质遗漏）**：**彩色背景原子类未收录**。`src/styles/background.scss:11-33` 生成 `.bg-primary/secondary/success/warning/danger`、`.bg-gray` 及 12 基本色 `.bg-red…bg-orange`，且各有 `-translucent` 变体（约 34 个类）；styles.md §2.3 背景颜色表（`styles.md:438-448`）只列 bg-none + 6 个中性类。
- **缺口 2**：**基本色文本类未收录**。`typography.scss:55-62` 生成 `.text-red/.text-blue/...` 13 个基本色文本类；styles.md §2.4 只列中性 5 + 功能色 5（`styles.md:519-537`）。
- **缺口 3（小）**：`.shadow-none`（`box-shadow.scss:1`）未收录（§2.3 阴影表 `styles.md:452-459` 无此行）。
- **矛盾（升级文件内）**：`upgrade-v1/rules.md:188` "v4 无彩色背景原子类"——与 `background.scss:11` 直接矛盾（该行建议 `style="background: var(--mu-primary-color)"` 的场景实为 `.bg-primary` 可用）。
- `animation.scss` 仅内部 keyframes（`-mu-ani-*`），无对外原子类，styles.md 未收不构成缺口。

### 3.3 组件 API 抽查（13 个组件，逐项比对 props/emits/model/expose）

**完全一致（10）**：

| 组件 | 文档 | 源码证据 | 结论 |
|------|------|----------|------|
| MuDialog | containers.md:86-134 | dialog.vue:84-99（props）、modal.js:10-18（modalProps/modalEvents）、dialog.vue:226-230（expose maskEl/dialogEl/hide） | props/事件/expose 逐项一致；dismissible 取值与 validator 一致（modal.js:13-16） |
| MuTabs/MuTabBar/MuTabPanel | containers.md:5-78 | tabs.vue:26-36、tab-bar.vue:26-39、tab-panel.vue:17-25 | tab-style 默认 button（tab-bar.vue:29-34）、tab-position 四值、tab-click payload name、panel 六 props 一致 |
| MuForm/MuFormField | form.md:9-79 | form.vue:27-33（props）、form.vue:186-190（expose validate/resetValidation/errors）、form-field.vue:33-43 | 一致；label-align 仅 left/right/top（form-field.vue:39）= 文档 |
| MuTable | data.md:114-139 | table.vue:69-99 | 14 props（含默认值 gridlines 'all'、hoverMode 'row'、recordsOffset 0）+ 7 emits 逐项一致 |
| MuInput | form.md:163-192 | input.js:6-26（inputProps/inputEmits）、input.vue:20-24 | 9 emits（enter/esc/prefixClick/suffixClick…）+ tabindex 默认 '-1' + clearable 默认 false 一致 |
| MuPagination | data.md:421-434 | pagination.vue:51-63 | pageIndex 默认 0、pageSize 默认 20、size 仅 small/normal、两 emits 一致 |
| MuTree | data.md:34-67 | tree.vue:23-48,130-136、default-options.js | props 默认映射/nodeIcons/expandIcons 默认值（treeNodeExpand）、expose 五方法全一致 |
| MuButton | buttons.md:5-28 | button.js:5-24、button.vue:21-27 | size/color/buttonStyle validator、pill/toggle/active defineModel 一致；primary 等布尔废弃警告存在（button.js:53-56） |
| MuSwitch | form.md:567-580 | switch.vue:15-27 | 9 props + 默认 true/false 一致 |
| MuSegmented | form.md:537-559 | segmented.vue:31-37 | iconPosition 默认 left、left/top 两值、简单值归一化一致 |

**不一致 / 遗漏（3）**：

1. `containers.md:9-14`（MuTabs 属性表）：未列 `tab-tool-size`（`tabs.vue:35` 声明 `tabToolSize: String`，但组件模板未消费）——属 src 侧声明未用的死 prop，文档未列行为合理；按验收标准 2"与实现一致"口径需设计阶段决定（补注或建议 src 清理，src 不在本次改动范围）。
2. `navigation.md:25`（MuSideMenu header 插槽）：未注明"收起态（rail/collapsed）不渲染"；源码 `side-menu.vue:18` `<slot v-if="!isCollapsed" name="header" />`；同表 L26 footer 已注明同类行为，属文档遗漏。
3. `data.md:201`（内置图标注册名 32 个）与 `upgrade-v1/rules.md:284`（同清单另一份）——两份与 src 逐名核对一致（`src/icons/tabler-icons.js:3-39` 28 个 + `src/icons/index.js:309-321` windowClose/treeNodeExpand/dropdownExpand + loading = 32），当前无错；拆分后两份分属不同 skill，需各自维护（同步点记入约束）。

### 3.4 SKILL.md / install.md 与 src 的其他核对

- install.md 全部核对点一致：install 内部执行顺序（`install.md:53` vs `src/index.js:35-62`）、dark 取值语义（`install.md:44` vs `src/index.js:13-19`）、colors 合法 key（`install.md:45` vs `src/colors.js:4-27` BASE_COLORS/SPEC_COLORS 与 neutral→gray→primary 灰阶优先级 `src/colors.js:47`）、返回 app（`src/index.js:62`）。色值本身未逐项核对（标：待确认，低风险）。
- v4 导出清单（`upgrade-v3/rules.md:146-148`）与 `src/index.js:64-68` 一致。
- SKILL.md 速查表抽查（mu-bar 40px `bar.scss:2`、mu-color-input 130 色 `form.md:435`、mu-dropdown-button split-button `navigation.md:129`、tooltip 12 方向 `feedback.md:13`）均与 src/references 一致。
- **SKILL.md 与 src 矛盾：未发现**。

---

## 4. 结构与冗余评估

### 4.1 SKILL.md 主线 vs 应下沉 references

- `SKILL.md:82-86`「安装与初始化」独立章节与 `SKILL.md:74` 步骤 2 末行重复，且全部细节在 install.md——可压为步骤 2 内一行。
- `SKILL.md:55` 与 `SKILL.md:76-78` 两处重复描述 principles 核心规范（计数口径两套："5 条核心规范其中 2–5 硬性禁止" vs "硬性禁止 7 项 + 优先级 1 项"）；`principles.md:10` 与 `principles.md:323` 也重复同一声明——同一段规则在两个文件共出现 4 次。
- `SKILL.md:90-185` 速查表与 references 组件文档"用途"行重复：有意识设计（L92 已声明"不要用本节替代查阅 API"），保留合理。
- `SKILL.md:15-18` 版本检查块与 `upgrade-v1/overview.md:7`、`upgrade-v1/overview.md` 版本段同构重复——拆分后各自保留一份即可。

### 4.2 references 划分问题

- **过大**：`upgrade-v3/rules.md` 1327 行（5.1 MuDialog 一节约 240 行，`:635-872`）；拆出后仍需按现有"章节跳转"机制使用，不建议本次再切。
- **偏大**：`form.md` 579 行（19 个组件）；`data.md` 447 行（6 个主题混编：列表/树/标签/日历/两个表格/分页）——路由粒度 8 类尚可用，但 data.md 主题混杂最明显。
- **过碎**：buttons.md（70 行）、basic.md（69 行）偏小，但 1:1 路由表依赖 8 类划分，合并反而破坏路由；不建议动。
- **重复内容**：内置图标 32 名清单两处（3.3 第 3 条）；install 要点在 install.md 与 `upgrade-v3/rules.md:43-97` 各一份（升级侧为一行速查 + 指回，设计如此）。

### 4.3 语言冗余点举例

- `SKILL.md:78` 一句话内嵌两套计数口径（"共 4 条"与"7 项"），agent 需自行换算。
- `principles.md:323` 与 `:10` 重复"第 1 条优先级、第 2–5 条硬性禁止"。
- `form.md:247-257` value-mode 三段式场景解释偏人类向长文（"适用场景：…免去二次查表"），可压缩为判定表。
- `principles.md:359-361` 间距 grep 模式行附长注释（"仅作示意，建议按项目实际维护…"），属人类向建议。
- `containers.md:153-232` MuDialog 封装示例 80 行（两文件 + 父组件），为 references 最长示例；有实用价值但可精简父组件段。

---

## 相关代码（关键证据路径）

分模块列出（>20 条按模块折叠）：

- skill 入口：`skills/mussel-ui/SKILL.md:22-51`（升级路径全段）、`:90-185`（速查表）
- 安装：`src/index.js:35-68`（install 实现 + 导出）、`src/components/index.js:18-61`（注册全集，MuTag 在此）
- 弹层：`src/components/modal/dialog.vue:84-99,226-230`、`src/components/modal/modal.js:10-18`
- 页签：`src/components/tabs/tabs.vue:26-36`、`tab-panel.vue:17-25`
- 菜单：`src/components/menu/side-menu.vue:51-59,18`
- 表单：`src/components/form/form.vue:27-33,186-190`、`form-field.vue:33-43`、`input.js:6-26`
- 表格：`src/components/table/base/table.vue:69-99`
- 分页/条栏：`src/components/bar/pagination.vue:51-63`、`bar.scss:2`
- 树/图标：`src/components/tree/tree.vue:23-48`、`default-options.js`、`src/icons/tabler-icons.js:3-39`、`src/icons/index.js:309-321`
- 样式：`src/styles/background.scss:11-33`（彩色 bg 类）、`typography.scss:44-62`（基本色文本类）、`box-shadow.scss:1`、`root.scss:127-132`
- 未文档化组件：`src/components/collapse/collapse.vue`、`src/components/tag/tag.vue`
- 未展开：`src/components/` 其余 20 个目录的 .vue 实现细节未逐文件核对（组件注册面已全量核对，API 抽查按派发要求覆盖 13 个大/中组件）。

## 现有约定

- 纯 JS + `<script setup>`；组件 `Mu` 前缀双驼峰注册、模板 kebab-case；CSS 变量 `--mu-*`（树节点类名用下划线变体 `--mu-tree_node-*`，`tree.scss:1-3`）；BEM 双下划线（`mu-dialog__body`，dialog.vue:24-45）。
- 项目内 skill 目录：`skills/<name>/SKILL.md`（+ references/）；三处文档同步义务见根 `AGENTS.md`（skills/references、docs/quick-reference、docs-site）。
- 全局另有同名 skill `~/.zcode/skills/mussel-ui`（见约束与风险）。

## 约束与风险

- `decisions.md` 三条决定已确认（范围限项目内 skills/、七步流水线、任务目录路径），无冲突。
- **全局同名 skill 分叉风险**：`C:\Users\scrol\.zcode\skills\mussel-ui` 与 `~/.agents/skills/mussel-ui` 存在旧副本；本次只改项目内（00-task 约束 L20），拆分后触发词"升级到 Mussel 4"可能命中全局旧版（旧版仍含升级路径）。属用户侧既有事实，任务内不可解决，需知会。
- **docs 同步缺口风险**：根 AGENTS.md 要求改组件 API/用法时同步 docs/quick-reference 与 docs-site；本次改动限 skills/（00-task L17、约束 L20），优化后的 mussel-ui 与手册措辞会出现差异——00-task 已限定范围，仅提示。
- 00-task 基线：`src/components/table/ex/**` 有 37 文件未提交改动 + 3 个新 js；data.md 的 MuTableEx 章节（`data.md:252-413`）描述对应这些实现，本次只读，不动 src。
- 拆分后两份内置图标清单（3.3）、v4 单源声明（rules.md:9/11）分属两个 skill，后续维护需各自同步，无单一权威——拆分固有代价，设计中可在两个新 SKILL.md 各写一行"v4 API 以 mussel-ui skill 为准"缓解。

## 验证方式

- 清单比对：`ls src/components/` vs `skills/mussel-ui/references/components/`（00-task L32）。
- 拆分完整性：`grep -rn "upgrade-v" skills/mussel-ui/` 拆分后应为 0 命中（当前命中 `SKILL.md:25,41-50`、`principles.md:365` 及 upgrade 目录自身）。
- 无构建要求；verifier 按本报告 3.3 抽查清单复核。

## 未解问题

1. （需设计定）`containers.md` 是否补列 `tab-tool-size`：src 声明未消费（tabs.vue:35），补列则与"死 prop"绑定，不补则与"覆盖实现"口径有出入。
2. （需设计定）styles.md 是否补录彩色背景/基本色文本原子类（3.2 缺口 1/2）：补录与"以 src 为准"一致，但与 principles 规范 1-C"优先语义色"取向需配套措辞。
3. （需用户/知会）全局 `~/.zcode/skills/mussel-ui` 旧副本在拆分后仍含升级主线，触发词重叠；00-task 明确不动全局，风险仅记录。
4. （需设计定）新 skill 引用 mussel-ui 参考文件的写法：相对路径（`../mussel-ui/references/...`）还是文字说明；agent 按路径读文件，建议相对路径。
5. （低优先，待确认）`src/styles/animation.scss` 的 `-mu-ani-*` keyframes 是否有对外消费场景（未见原子类引用，疑似纯内部）。
6. （提示，已有结论）docs/quick-reference 与 docs-site 不同步属 00-task 范围决定，非遗漏。
