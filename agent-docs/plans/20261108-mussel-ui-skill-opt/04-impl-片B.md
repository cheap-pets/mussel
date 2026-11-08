# 实施记录 — 片B（docs / docs-site 同步，追加段）

源口径：`skills/mussel-ui/references/` 现状（片 1 / 片A 已核实与 src 一致）。改动前核实：两处用户文档均无 `tab-tool-size` 死 prop（grep 0 命中）、无 MuSideMenu 章节、无升级迁移段落、无当前版本号表述——同步项 3 / 4 / 5 对既有内容均为无落点，详见「自检」。

## 改动文件

### docs/quick-reference_components.md

- 新增 `### MuCollapse`（:442）+ `### MuCollapseGroup`（:466）速查条目，插入「2 容器与面板」MuTabPanel 与 MuDialog 之间
  - 映射：skill 源 `skills/mussel-ui/references/components/containers.md:82-129`（`## 折叠面板` 章）→ docs 落点 `docs/quick-reference_components.md:442-487`；props / 插槽 / 事件表与 accordion、`default-expand` 回退、`expand-trigger`、header 作用域说明逐项一致，含组用法 html 示例
- 新增 `### MuTag`（:1621）速查条目，插于 `### MuTags`（:1646）之前
  - 映射：skill 源 `skills/mussel-ui/references/components/data.md:71-85`（`### MuTag` 段）→ docs 落点 `docs/quick-reference_components.md:1621-1643`；color（12 基本色 + 5 功能色不含 gray、`text-{color}` + `bg-{color}-translucent`）/ flat / pill + default 插槽 + 默认形态（灰底内描边、高 20px、字号 12px）一致；html 示例取自真实 demo 用法 `demo/src/basics/badge/main-view.vue:48-64`；skill 源的 `（tag.scss:1-25）` 内部文件引用按用户文档规范省略

### docs/quick-reference_styles.md

- §1.1（:22）用途句换口径：删「**不直接用于文本或背景**，应优先使用语义扩展色」旧表述（片 1 遗留风险 4 点名的分叉），改为「非语义场景；文本用 `.text-{基本色}`（见 2.4），背景用 `.bg-{基本色}` 与 `-translucent` 变体（见 2.3）」
  - 映射：skill 源 `skills/mussel-ui/references/styles.md:11`（§1.1）→ docs 落点 `docs/quick-reference_styles.md:22`
- §2.3 背景颜色表（:511-528）：子标题「背景颜色（类名带 `mu-` 前缀）」改「背景颜色」，追加 3 行（功能色实底 5 / `.bg-{基本色}` 基本色实底 13 非语义 / `-translucent` 18）+ 表后别名说明（`.bg-*` 与 `.mu-bg-*` 等价，`.bg-none` 除外）
  - 映射：skill 源 `styles.md:449-453`（§2.3 背景表 + 别名段，含片A :450 补录行）→ docs 落点 `:524-528`
- §2.3 阴影表（:530-542）：追加 `.shadow-none` 行（无 mu- 别名）+ 表后别名说明（`mu-shadow-*` 等价）
  - 映射：skill 源 `styles.md:465-467`（片 1 步骤 3 新增，同类分叉一并消除）→ docs 落点 `:541-542`
- §2.4（:595-619）：功能色文本表后新增「基本色文本颜色」表（`.text-{基本色}` 13 色，非语义着色 + 状态语义仍用功能色）+ `.text-*` / `.mu-text-*` 等价说明（覆盖中性 5 / 功能色 5 / 基本色 13）
  - 映射：skill 源 `styles.md:547-553`（§2.4 基本色文本表 + 别名说明）→ docs 落点 `:613-619`；skill 源「规范 1-A 明文例外 / 规范 1-C」为 agent 向原则引用，按用户文档规范以「状态语义仍用功能色」表述替代；`typography.scss:37-58` 内部引用省略

### docs-site/components/tag.md（新增）

- 按 `docs-site/components/tags.md` 等既有页格式（无 frontmatter、`mu-demo` 演示 + html 代码块 + `## API` 表）新建
  - 映射：skill 源 `references/components/data.md:71-85` → 全页；API 表逐项同源；演示用例（Default/Primary/Success/Pink、pill/flat 组合）取自 `demo/src/basics/badge/main-view.vue:48-64` 实际用法；结尾互链 MuTags 页

### docs-site/components/collapse.md（新增）

- 同上格式；`#header` 作用域插槽演示按项目 AGENTS.md「作用域插槽演示需 ClientOnly」包裹 `<ClientOnly>`（同 calendar.md :13-19 既有模式）
  - 映射：skill 源 `references/components/containers.md:82-129` → 全页；章节：基础用法（`default-expand`）、手风琴、受控 `v-model:expanded`、独立使用与状态（disabled / arrow / default-expanded）、自定义头部（header / header-prepend / header-append 作用域 + `expand-trigger="custom"`）、MuCollapse 与 MuCollapseGroup 双 API 表；演示场景对照 `demo/src/data/collapse/main-view.vue`
- 组件注册名核实：`src/components/index.js:16`（`import * as CollapseComponents from './collapse'`）+ `collapse/index.js`（MuCollapse / MuCollapseGroup 导出）→ `mu-collapse` / `mu-collapse-group` 可用

### docs-site/.vitepress/config.mts

- 侧边栏注册两处：「导航与容器」组 tab-bar 之后插入 `{ text: '折叠面板 MuCollapse', link: '/components/collapse' }`（:137）；「反馈与数据」组 tags 之前插入 `{ text: '标签 MuTag', link: '/components/tag' }`（:153）。顺序对应 skill 章节序（折叠面板在模态与抽屉前；MuTag 与 MuTags 相邻）

### docs-site/guide/styles-colors.md

- 基本色口径句（:9）：同 quick-reference_styles.md §1.1，消除「不直接用于文本或背景」旧表述
  - 映射：skill 源 `styles.md:11` → docs 落点 `:9`
- 原子类·文本颜色表（:96-107）：追加 `.text-{基本色}` 13 色行 + `.text-*` / `.mu-text-*` 等价说明
  - 映射：skill 源 `styles.md:547-553` → docs 落点 `:106-108`
- 原子类·背景颜色表（:109-127）：追加功能色实底 / 基本色实底 / translucent 3 行 + `.bg-*` / `.mu-bg-*` 等价说明
  - 映射：skill 源 `styles.md:449-453` → docs 落点 `:119-127`

### docs-site/guide/styles-surface.md

- 阴影表追加 `.shadow-none` 行（无 mu- 别名）+ `mu-shadow-*` 等价说明
  - 映射：skill 源 `styles.md:465-467` → docs 落点 `:76-78`

## 偏离

无。两处超出同步项 2 字面枚举（仅彩色类）的小改动，均属派发总目标「消除本轮全部分叉」范围、文件均在白名单内：
1. `.shadow-none` 行 + shadow 别名说明（quick-reference_styles.md / styles-surface.md）——片 1 步骤 3 与彩色类同批加入 skill §2.3 的内容，不同步即留本轮分叉
2. quick-reference_styles.md §2.3 背景子标题「（类名带 `mu-` 前缀）」→「背景颜色」——新增别名说明句后该限定语不完整且易误读，与 skill §2.3 子标题形态对齐

## 自检

- `npm run docs:build` → 成功（build complete in 10.61s）；产物含 `dist/components/tag.html`、`dist/components/collapse.html`；`dist/components/tags.html` 内检索到侧边栏项「折叠面板 MuCollapse」「标签 MuTag」；`dist/guide/styles-colors.html` 含 bg-primary/translucent 内容。构建期 icon 重复注册与 SplitHBox 旧 prop 弃用警告为既有页面遗留，非本轮引入（见遗留 3）
- 演示组件名以 src 注册为准：`mu-tag`（index.js:55）、`mu-tags`（:56）、`mu-collapse` / `mu-collapse-group`（:16 + collapse/index.js）均已注册；tag.vue:15-25（color/flat/pill）、collapse.vue:35-49、collapse-group.vue:16-25 与新页 API 表逐项核对一致
- 同步项 3：`grep -rn "tab-tool-size" docs/ docs-site/`（排除 dist）= 0 命中——两处文档本就未列死 prop，无需删；MuSideMenu 在 quick-reference_components.md 与 docs-site 均无章节（grep 仅命中 dist 构建产物），无对齐落点
- 同步项 4：quick-reference_* / docs-site guide+components+index 无当前版本号表述（仅 table-ex.md :324-348 的 v4.2.0→v4.3.0 历史变更记录，为事实性历史，保留）；无对齐 4.3.1 的落点
- 同步项 5：quick-reference_components.md / quick-reference_styles.md / docs-site（排除 dist）grep「迁移|升级|Mussel 3|Mussel 1|V3」= 0 命中；`docs/mussel4-introduction.md` 为独立 Mussel 3→4 变化概览文件，**不在片B白名单**，未动（见遗留 1）
- 口径一致性：skill styles.md §1.1 / §2.3 / §2.4 与 quick-reference_styles.md :22 / :511-528 / :595-619、styles-colors.md :9 / :96-127 三方逐句核对——「基本色仅限非语义场景」「bg-none 除外」「shadow-none 无别名」「translucent 共 18」「基本色文本 13」口径一致
- `git status --short -- docs docs-site`：改动仅 `docs/quick-reference_components.md`、`docs/quick-reference_styles.md`、`docs-site/.vitepress/config.mts`、`docs-site/guide/styles-colors.md`、`docs-site/guide/styles-surface.md`（M）+ `docs-site/components/{tag,collapse}.md`（??），均在白名单；skills / src 的 M/D 为片 1-3、片A 与用户修复 background.scss 遗留，非本轮引入；dist 已被 .gitignore:25 忽略
- 纯文档改动，无测试框架 / lint 要求

## 遗留

1. `docs/mussel4-introduction.md` 为「相对 Mussel 3 的主要变化」概览（154 行，含 V3 对比表述），按同步项 5 的口径属升级内容、应由 skill 承载；但该文件不在片B白名单（白名单仅 quick-reference_* + docs-site），且整文件删除属破坏性操作需用户授权 → 未动，建议后续派发或用户决策处理
2. 版本号：两处用户文档均无版本表述，同步项 4 无落点（SKILL.md 侧 4.3.1 已由片 1 落地）；若需在 docs-site 展示当前版本，需先确定展示位置（如 install.md），属新增需求
3. 观察项（非本轮分叉）：docs:build 期间 src 输出 SplitHBox/SplitVBox `resizable` / `collapsible` / `splitter-size` / `splitter-shape` 弃用警告（建议改 `left-splitter / right-splitter` 等）；skill layout.md:162-167 与两处用户文档记录的同为旧 prop（三方一致，非本轮分叉），src 弃用后的文档更新属独立任务
