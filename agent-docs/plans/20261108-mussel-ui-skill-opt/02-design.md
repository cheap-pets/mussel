# 设计 — skills 三目录优化（mussel-ui / mussel1to4 / mussel3to4）

前置：04-impl-split 已完成升级内容机械拆分（mussel1to4 / mussel3to4 已建、mussel-ui 升级主线已收为指引行）。本设计覆盖剩余优化：覆盖补齐、一致性修正、SKILL.md 主线精简、语言精简。

## 方案概述

仅改 `skills/` 三目录文档，不改 src/、docs/、docs-site/。三片并发实施，文件白名单互斥。

1. **mussel-ui 覆盖补齐**：references/components/ 补 MuTag（data.md）、MuCollapse/MuCollapseGroup（containers.md）API 文档；SKILL.md 速查表补 4 行（mu-tag / mu-collapse / mu-collapse-group / mu-input-group）；styles.md 补彩色背景原子类与基本色文本类（**仅补有效类**，基本色实色 bg 类经运行时验证无效，不收录，见接口节）；补基本色文本类时同步 styles.md §1.1 用途句与 principles.md 规范 1-A 口径（基本色仅限非语义场景，见接口节）。
2. **mussel-ui 一致性修正**：navigation.md side-menu `header` 插槽补收起态说明；图标 32 名清单单源化到 data.md（mussel1to4 rules.md 侧改指引）；v3/v1 rules 中的事实性矛盾修正。
3. **mussel-ui 主线精简**：SKILL.md 删「安装与初始化」独立章节、步骤 3 去双计数口径；principles.md 内部去重；form.md value-mode 场景压缩；containers.md MuDialog 封装示例父组件段压缩。references 8 类划分与 upgrade 三件套结构**不重组**（探索报告 §4.2 已论证）。
4. **mussel1to4 / mussel3to4**：SKILL.md 结构已达标（升级流程主线 + references 细节），仅更新核对日期与「当前 4.3.x」版本号（按 `package.json`）；rules.md 修正 v1「v4 无彩色背景原子类」矛盾（mussel1to4/references/rules.md:188）及其紧邻 hover 行（:189）、图标清单指引化、v3「新增原子类」概览补彩色类同步。
5. **跨片共享决策**（并发实例无需协商，全部定死于本设计）：引用形态 = 相对路径；组件文档格式模板；语言精简原则；基本色实色 bg 类不收录；核对日期统一 2026-11-08、版本号按 `package.json` 刷新（当前 4.3.1）。

关键运行时验证（demo :3000，playwright evaluate）：`.bg-red` / `.bg-gray` / `.mu-bg-red` 背景 `rgba(0,0,0,0)`（无效）；`.bg-red-translucent` / `.bg-primary` / `.bg-primary-translucent` / `.text-red` / `.text-gray` / `.mu-text-red` 均有效。

## 遵循约定与复用

- 组件文档格式（复用现状，探索报告「现有约定」）：`### 组件名` + 一句话定位 + 属性表（`| 属性 | 类型 | 默认 | 说明 |`）+ 插槽表 + 事件表 + html 示例；BEM/kebab-case 属性名（`expand-trigger`）。
- 原子类表格式（对齐现状）：背景 / 阴影用 `| 类名 | 说明 |`（styles.md §2.3），文本颜色用 `| 类名 | 变量名 | 说明 |`（§2.4，列头与现有中性/功能色两表一致）。
- 跨 skill 引用（沿用 04-impl-split 惯例，已 node 验证可达）：references 子目录内 `../../mussel-ui/references/...`，SKILL.md 层 `../mussel-ui/references/...`，行内带 "mussel-ui skill" 限定语。
- 项目 AGENTS.md：agent 向文档，不写人类向铺垫/内部实现细节。

## 改动清单

### 片 1：skills/mussel-ui/**（7 文件改，5 文件不动）

| 文件 | 改动 | 原因 |
|------|------|------|
| `SKILL.md` | ① 删「安装与初始化」章节（锚点：步骤 3「生成后自检」与「组件速查表」之间的 `## 安装与初始化` 整段，含其前 `---`；参考 L56-63，切勿删 L64 分隔线）；② 步骤 3 改为「逐条核对 `references/principles.md` 核心规范与文末快速自检清单，硬性禁止项任一违反即不合规」（去掉"共 4 条"“7 项 + 1 项"双计数）；③ 速查表补 4 行：「2 容器与面板」加 `mu-collapse` / `mu-collapse-group`、「4 表单」加 `mu-input-group`、「6 数据展示」加 `mu-tag`；④ 版本检查行（`> **版本检查**` 段）：核对日期 2026-11-06 → 2026-11-08，「当前 `4.3.0`」→ `4.3.1`（`package.json:3`）；frontmatter `date:`（L4）同步 2026-11-08。净删约 4 行（160 → ~156） | 01-explore §4.1 重复点；§3.1 速查表缺口；版本/日期口径（`package.json:3`、L4/L16） |
| `references/principles.md` | ① 快速自检清单导语（`## 快速自检清单` 后首段，L323）去掉与「核心规范」节重复的计数声明「核心规范共 5 条…违反即不合规」，保留 `(核心规范 N)` 为规则来源 + `[G]` 可机判说明；② 「可机器执行的合规检查」表下「间距检查提示」（L361）压缩为一行「合法值仅 0/4/8/16/24/32px；行内间距用 `--mu-inline-spacing`」，删「仅作示意，建议按项目实际维护白名单」；③ 规范 1-A 口径同步（见「接口 / 数据结构」节） | §4.3 冗余点；消除与新增 `.text-{基本色}` 的互斥指引（`principles.md:22`） |
| `references/styles.md` | ① §1.1 用途句改口径（基本色可用于非语义文本与透明底，实色背景类不可用；见「接口 / 数据结构」节）；② §2.3 / §2.4 补录：功能色背景类 + 基本色 translucent 背景类 + `mu-bg-*` 别名说明 + `.shadow-none` + `mu-shadow-*` 别名说明 + 基本色文本类 + `mu-text-*` 别名说明。**不收录基本色实色 bg 类** | §3.2 缺口 1/2/3；运行时验证实色类无效；消除 §1.1:11 与新增文本类的互斥指引 |
| `references/components/containers.md` | ① 在 `## 模态与抽屉`（L82）之前新增 `## 折叠面板` 小节（顶级章节，不嵌进「模态与抽屉」，章节间沿用 `---` 分隔），内含 `### MuCollapse` + `### MuCollapseGroup`（骨架见下）；② MuDialog 封装示例的「父组件调用」代码块（锚点：`父组件调用：` 后的 `vue` 围栏，参考 L215-232）删除，压缩为一行「父组件以 `ref` 调用子组件暴露的 `show(data)`」；my-dialog 示例正文（`### MuDialog` 内首个 `vue` 围栏段）保留 | §3.1 缺 MuCollapse 文档；§4.3 示例冗长 |
| `references/components/navigation.md` | L25 `header` 插槽说明「头部区域」→「头部区域；仅非收起态渲染（rail / collapsed 下不渲染，同 footer）」 | §3.3 遗漏 2（side-menu.vue:11） |
| `references/components/data.md` | 在 `### MuTags`（L71）之前新增 `### MuTag` 段（骨架见下） | §3.1 缺 MuTag 文档（注册于 src/components/index.js:18） |
| `references/components/form.md` | value-mode 场景段（锚点：`**value-mode 使用场景：**` 起的引导段与两条场景 bullet，参考 L247-251）压缩为一行「`composite` 适用：① options 动态变化 / 异步加载（`normal` 回显退化为原始 value）；② 提交数据需同时携带 `label`。」；保留其后的 `normal` / `composite` ref 示例代码块与 `>` 注意事项 | §4.3 冗长段落 |
| 不动 | `install.md`、`layout.md`、`buttons.md`、`feedback.md`、`basic.md` | 探索报告核对一致、无冗余点 |

### 片 2：skills/mussel1to4/**（2 文件改，2 文件不动）

| 文件 | 改动 | 原因 |
|------|------|------|
| `SKILL.md` | 版本检查行（`v4 侧基于 MUSSEL` 段）：核对日期 2026-11-06 → 2026-11-08，「当前 `4.3.0`」→ `4.3.1`（`package.json:3`）；frontmatter `date:` 已为 2026-11-08，无需改。结构不动（35 行已达标：进入条件 → overview → process → rules 路由 → v4 API 指引） | 主线结构已符合验收标准 3；日期/版本口径 |
| `references/rules.md` | ① 背景类映射重写（L188-189）：`.mu-background-primary` / `-success` / `-danger` / `-warning` → `.bg-primary` / `.bg-success` / `.bg-danger` / `.bg-warning`（保留 v1 `-danger` 误引用 success-color 的 bug 备注）；`.mu-background-hover` → `.bg-gray-translucent`（与 mussel3to4/references/rules.md:188 `--mu-background-hover` → `--mu-gray-translucent` 口径一致；v1 为实色时视觉有差异需确认；若 v1 类为 `background` 简写需改 `background-color` 覆盖）；`.mu-background-info` 保留「无对应 \| 人工处理」。② 图标清单单源化（L284）：前置句的 v4 全集罗列改为「v4 内置图标名全集（32 个，大小写敏感）见 mussel-ui skill 的 `../../mussel-ui/references/components/data.md`『MuTable → 列类型（type）』内 `icon` 列 blockquote 的「内置注册名 32 个」」，下方 v1→v4 映射表保留。③ §8「新增能力」表 `mu-collapse` 行（L613）说明追加「（API 见 mussel-ui skill 的 `../../mussel-ui/references/components/containers.md`）」 | L188 与 background.scss:11-19 矛盾；L189 与 v3 口径相反；图标清单双份维护且指针落点不明；v1 迁移者需新组件 API 入口 |
| 不动 | `references/overview.md`、`references/process.md` | 结构正交（版本档次判定是 1to4 独有步骤），引用 04-impl-split 已修好 |

### 片 3：skills/mussel3to4/**（2 文件改，1 文件不动）

| 文件 | 改动 | 原因 |
|------|------|------|
| `SKILL.md` | 版本检查行（`v4 侧本文档及` 段）：核对日期 2026-11-06 → 2026-11-08，「当前 `4.3.0`」→ `4.3.1`（`package.json:3`）；frontmatter `date:` 已为 2026-11-08，无需改。结构不动（31 行已达标） | 同片 2 |
| `references/rules.md` | 「新增原子类（Mussel 4）」节（L279-295）与 styles.md 新口径同步：文本行（L291）追加基本色文本类（`.text-{基本色}`，13 色）；背景行（L293）追加功能色背景类（`.bg-primary` 等 5 色，含 `-translucent` 变体）与基本色透明背景类（`.bg-{基本色}-translucent`），措辞一行带过 | styles.md 补录后概览不同步会误导（agent 只看概览以为无彩色类） |
| 不动 | `references/process.md` | 流程与规则职责正交，无冗余点 |

### 跨片共享决策（并发实例必须遵守，不得协商变更）

1. **引用形态**：相对路径（裁决理由见「被拒绝的备选」1/2）。路径深度按出发文件层级：references 内 `../../mussel-ui/...`，skill 根 `../mussel-ui/...`。
2. **组件文档格式模板**：`### 组件名` + 一句话定位 + 属性表（`| 属性 | 类型 | 默认 | 说明 |`，无默认值的表可省「默认」列）+ 插槽表 + 事件表 + 最小 html 示例。双向绑定写在属性表「说明」列（「双向绑定…」，如 `navigation.md` 的 `collapsed`、`containers.md` 的 `visible`）；**不新增 `| v-model | 说明 |` 单列表**。
3. **语言精简原则**（三片统一）：只保留接口事实（props / 取值枚举 / 默认值 / 事件 / 插槽 / 类名 / 变量名）；场景说明 ≤1 行且必须影响选型或正确性；删重复声明、计数换算、人类向建议与铺垫。
4. **基本色实色背景类不收录**（`.bg-red` 等 13 个 + mu- 别名）：引用未定义变量，运行时无效（证据见接口节）；待 src 修复后再补录（记入未解问题 5）。
5. **核对日期与版本口径统一**：三个 SKILL.md 正文核对日期 → 2026-11-08，frontmatter `date:` 同（mussel-ui 需改，另两个已是 2026-11-08）；正文「当前 `x.y.z`」按 `package.json` 刷新（现为 `4.3.1`，`package.json:3`）。

## 接口 / 数据结构

### 新增文档 1：containers.md「折叠面板」小节骨架

置于 `## 模态与抽屉` 之前，标题为 `## 折叠面板`（顶级章节），内容：

```
### MuCollapse
可折叠面板。置于 MuCollapseGroup 中由组管理展开；独立使用时用 v-model:expanded 或 default-expanded 控制。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `expanded` | Boolean | — | 双向绑定展开状态（独立使用时；组内由 MuCollapseGroup 的 `expanded` 数组管理） |
| `id` | String\|Number | 自动生成 | 组内唯一标识；外部绑定组 `expanded` 数组时需显式设置（`default-expand` 用自动生成 id 即可） |
| `title` | String | — | 标题文字；未提供 `header` 插槽时渲染 |
| `disabled` | Boolean | — | 禁用（组或自身任一禁用即生效，禁用时强制收起） |
| `default-expanded` | Boolean | — | 非受控默认展开（仅独立使用且未绑定 `expanded` 时生效） |
| `arrow` | Boolean | `true` | 标题右侧展开箭头 |
| `expand-trigger` | String | `header` | `header`（点标题栏切换）\| `custom`（自行调用作用域 `toggle`） |

| 插槽 | 作用域 / 说明 |
|------|------|
| `default` | 面板内容 |
| `header` | 覆盖整个标题栏（含标题与箭头）：`{ expanded, disabled, toggle }`；提供后 `title` 与 `header-prepend` / `header-append` 不再渲染 |
| `header-prepend` / `header-append` | 标题前后附加：`{ expanded, disabled, toggle }` |

| 事件 | 参数 | 说明 |
|------|------|------|
| `header-click` | — | 标题栏点击（`expand-trigger="custom"` 时需自行调用作用域 `toggle`） |

### MuCollapseGroup
折叠面板组容器；相邻子面板间自动渲染分隔线。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `expanded` | Array | `[]` | 双向绑定展开中的面板 id 数组；未绑定时 `default-expand` 才生效 |
| `accordion` | Boolean | — | 手风琴，同时仅展开一个 |
| `disabled` | Boolean | — | 禁用全部子面板 |
| `default-expand` | String | — | `first` \| `all`；accordion 下 `all` 回退 `first` 并 dev 警告 |

+ 最小示例（accordion + v-model:expanded）
```

源码依据：collapse.vue:35-49（props/model/emit）、:8-18（header 为 fallback 根，覆盖时 title/prepend/append/arrow 均不渲染）、:53-54（自动 id）、:59-69（组禁用/展开判定、独立 default-expanded）、collapse-group.vue:16-25（props/model）、:54-79（defaultExpand 与受控判定、accordion 回退）、collapse.scss:4-8（分隔线）。

### 新增文档 2：data.md `### MuTag` 段骨架

```
### MuTag
单个标签（静态展示、不可删除）；标签组（removable / max 截断）用 MuTags。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `color` | String | — | 12 基本色（red/pink/grape/violet/indigo/blue/cyan/teal/green/lime/yellow/orange）+ 5 功能色（primary/secondary/success/warning/danger，**不含 gray**）；设置后文字与底色同色系（`text-{color}` + `bg-{color}-translucent`） |
| `flat` | Boolean | — | 去除内描边 |
| `pill` | Boolean | — | 全圆角形态 |

| 插槽 | 说明 |
|------|------|
| `default` | 标签内容 |

默认形态：灰底 + 同色系内描边，高 20px、字号 12px（tag.scss:1-25）
```

源码依据：tag.vue:15-25（props/colorProp/类生成）、common/props.js:9-12 与 colors.js:4-27（color 合法值 = 12 基本色 + 5 功能色，不含 gray）、tag.scss:1-25。

### styles.md 补录内容（§1.1 / §2.3 / §2.4）

**§1.1 用途句改口径**（原句「用于图标着色、装饰性元素，**不直接用于文本或背景**，应优先使用语义扩展色」）：

> 用于图标着色、装饰性元素、分类标识与数据可视化等**非语义**场景；状态语义用语义扩展色（§1.2）。文本可用 `.text-{基本色}`（§2.4），透明底用 `-translucent` 变体（§2.3）；基本色实色背景类（`.bg-{基本色}`）当前不可用。

**§2.3 背景颜色表追加**（现有 7 行保留）：

| 类名 | 说明 |
|------|------|
| `.bg-primary` / `.bg-secondary` / `.bg-success` / `.bg-warning` / `.bg-danger` | 功能色实底背景 |
| `.bg-{color}-translucent`（color = 上述 5 功能色 + gray + 12 基本色，共 18） | 透明背景变体，适合 hover、标签底色 |
| 别名说明行：`.bg-*` 与 `.mu-bg-*` 两套类名均存在且等价（`.bg-none` 除外，background.scss:1-3） | |

**§2.3 阴影表追加**：`.shadow-none`（清除阴影；**无 `mu-` 前缀别名**，box-shadow.scss:1-3）行 + 别名说明（`.shadow-float/popup/layer/modal/focus/focus-within` 与 `mu-shadow-*` 等价，box-shadow.scss:5-17）。

**§2.4 文本颜色追加**：

| 类名 | 变量名 | 说明 |
|------|------|------|
| `.text-{基本色}`（gray + 12 基本色，共 13） | `--mu-{基本色}` | 非语义场景着色（分类标签、数据可视化、MuTag 着色）；规范 1-A 明文例外；状态语义仍用功能色（规范 1-C） |

+ 别名说明行：`.text-*` 与 `.mu-text-*` 等价（覆盖中性 5 / 功能色 5 / 基本色 13，typography.scss:37-58）。

### principles.md 规范 1-A 口径同步（配套 §1.1 / §2.4）

标题 `### 规范 1-A：文字颜色必须使用语义文本变量` → `### 规范 1-A：文字颜色使用语义文本色，基本色仅限非语义场景`，并在示例代码块前加一行：

> 基本色文本类 `.text-{基本色}`（13 个）仅用于分类标签、数据可视化等**非语义**着色；状态语义一律用功能色 `.text-{primary|success|warning|danger}`（见 1-C）。

### 基本色实色背景类无效的证据链（不收录依据）

- 定义侧：root.scss 仅在 `$SEMANTIC_COLORS` 循环生成 `--mu-{name}-color`（:20-26）；基本色变量为 `--mu-{name}` 无 `-color` 后缀（:12-14）；colors.js setupColors 正则同样只给语义色加 `-color`（colors.js:82-83）。
- 消费侧：background.scss:27 基本色 bg 实色类引用 `var(--mu-#{$v}-color)` → 变量不存在。
- 运行时（demo :3000，getComputedStyle）：`.bg-red` / `.bg-gray` / `.mu-bg-red` → `rgba(0, 0, 0, 0)`；`.bg-red-translucent` / `.text-red` / `.text-gray` / `.bg-primary` 均返回实际色值。同构论证：13 色由相同 @each 循环生成，抽验 red/gray 代表全类。

## 被拒绝的备选

1. **新 skill 自包含（复制 mussel-ui references 到 1to4/3to4）**——拒绝：v4 API 双源/三源维护，组件库每次变更需同步多份；升级 skill 使用频率低于主 skill，复制收益低。
2. **指引加载 mussel-ui skill（不写文件路径）**——拒绝：无法从 skill A 内部可靠触发加载 skill B（无此机制保证）；agent 需要可直接 Read 的路径。相对路径引用（现状）已由 04-impl-split 验证全部可达。
3. **补列 `tab-tool-size` 死 prop**——拒绝：tabs.vue:37 声明后未传给内部 MuTabBar、无任何消费（tab-bar.vue 的 toolSize 由 tabStyle 派生，tab-bar.vue:76）；文档只录有效 API，列出反而引导误用。src 清理超出任务范围。
4. **重组 references/components 8 类划分（拆 data.md / form.md）**——拒绝：1:1 路由表与既有交叉引用依赖 8 类结构（探索报告 §4.2）；重组断链风险大于收益。
5. **收录基本色实色背景类（.bg-red 等）**——拒绝：运行时验证无效，收录等于向 agent 推荐坏类（见接口节证据链）。

## 风险与回滚

- 回滚：全部为文档改动。已跟踪文件（`skills/mussel-ui/**`）用 `git checkout -- skills/mussel-ui/` 恢复；`skills/mussel1to4/`、`skills/mussel3to4/` 为 untracked 新目录，`git checkout --` 不覆盖、`git stash`（不带 `-u`）不处理。约定：片 2 / 片 3 实施前，将两目录整份复制到仓库外临时目录（如 `$TMPDIR/mussel-skills-snapshot-20261108/`）作快照；回滚 = 删除两目录 + 从快照复制回「拆分后状态」。禁止 `git add -N` / `git stash -u`（改变索引，或连带暂存 00-task 基线中 src/demo 的未提交改动）。回到拆分前状态则以两目录整体删除 + `git checkout -- skills/mussel-ui/` 实现（04-impl-split.md 的迁移映射可复现两目录内容）。
- 双向门：纯文档，无单向门、无合并冲突面（三片白名单互斥）。
- 风险 1：`.bg-{基本色}` 实色类判定基于当前 src 静态证据（background.scss:26-27 引用未定义变量）+ 运行时抽验；若后续 src 修复 background.scss:27（改引 `--mu-{color}`），styles.md 需补录 13 类并删除 §1.1 的「不可用」提示——补录模板见「接口 / 数据结构」节（未解问题 5）。
- 风险 2：全局 `~/.zcode/skills/mussel-ui` 旧副本仍含升级主线，触发词"升级到 Mussel 4"可能命中旧版（00-task 约束不动全局，知会项，未解问题 4）。
- 风险 3：data.md 的 MuTableEx 段对应 src 未提交改动（00-task 基线），本次对 data.md 仅增 MuTag 段、不动表格段，无纠缠。
- 风险 4：根 AGENTS.md 的三处文档同步义务——本次范围限 skills/（00-task L17 明确），docs/quick-reference 与 docs-site 暂不同步，属既定范围决定。本设计改 styles.md §1.1 与 principles 1-A 后，`docs/quick-reference_styles.md:22` 同类表述会分叉，待范围放开时同步。
- 风险 5：规范 1-A 改为「基本色仅限非语义场景」后，agent 可能放宽到状态语义。对策：1-A 例外句、styles.md §2.4 行、§1.1 用途句三处均显式限定「非语义」并指回 1-C；1-C 正文不改。

## 测试计划

| 验收标准 | 归属 | 手段 | 检查方式 |
|----------|------|------|----------|
| 1. 两新 skill 存在且自包含；mussel-ui 无升级主线 | 终验（拆分步已达成，本设计不回退） | `命令` | `grep -rn "upgrade-v" skills/mussel-ui/` = 0 命中；两 SKILL.md 存在且含进入条件/加载指引 |
| 2. 组件清单与 src 注册一致；API 与实现一致 | 片 1 | `命令` + 抽查 | ① 注册名覆盖：`src/components/index.js:18-61` 注册的全部 `Mu*` 名（含各 `*/index.js` 的**未注释**导出：`svg/` 目录在 `index.js:37` 被注释、`tree/index.js:3` 的 `MuTreeNodes` 被注释，均不纳入；`layout/index.js` 的 `MuFlexDivider` / `MuFlexSpace` / `MuFlexBreak` 为 `export const`，需一并纳入；直接导入的 MuTag/MuTags/MuBadge/MuTable/MuScrollBox 纳入）逐个在 `references/components/*.md` 的 `### ` 标题行做**子串匹配**（允许 `A / B` 组合标题，如 `layout.md:23`、`feedback.md:3`）；`MuTreeNode` 为内部组件例外（`data.md:57` 已注明，不要求独立段）。判定脚本：`grep -h '^### ' references/components/*.md` 输出对每个注册名 `grep -q`；② 抽查：MuTag props = tag.vue:15-19；MuCollapse/MuCollapseGroup props/model/插槽 = collapse.vue:35-49 / collapse-group.vue:16-25；速查表含 mu-tag/mu-collapse/mu-collapse-group/mu-input-group |
| 3. SKILL.md 主线精简、划分清晰无重复 | 片 1/2/3 | `命令` | mussel-ui SKILL.md 无「安装与初始化」章节、无双计数句（`grep -n "7 项" SKILL.md` = 0、`grep -n "共 4 条" SKILL.md` = 0）；步骤 1-3 + 速查表结构完整；1to4/3to4 SKILL.md 保持 ≤40 行 |
| 4. 无与源码矛盾的描述 | 片 1/2/3 + 终验 | `命令` + 抽查 | ① `grep -rn "无彩色背景原子类" skills/` = 0；② 图标清单单源：`grep -rn "arrowDownLeft" skills/` 仅命中 `mussel-ui/references/components/data.md`；③ `navigation.md` header 插槽含「仅非收起态渲染」；④ 逐行对照 `background.scss:11-33`：功能色实色 5 类与 18 个 `-translucent` 类（:16-18、:30-32）在表，13 个基本色实色类（:26-27 生成）不在表；⑤ 跨 skill 相对链接 node `existsSync` 全可达（复用 04-impl-split 自检脚本口径）；⑥ v3 rules「新增原子类」背景行含 `.bg-primary`；⑦ `mussel1to4/references/rules.md` 含 `.bg-gray-translucent` 映射且无「`.mu-background-hover` 无对应」行，`.mu-background-info` 仍为无对应；⑧ 口径一致：`grep -n "不直接用于文本" skills/mussel-ui/references/styles.md` = 0，`principles.md` 规范 1-A 含「基本色仅限非语义场景」，三 SKILL.md 正文含 `4.3.1`、核对日期与 frontmatter `date:` 均 2026-11-08 |

## 实施步骤

三片无共享文件、无依赖，可完全并发。**开工前**：按「风险与回滚」约定，把 `skills/mussel1to4/`、`skills/mussel3to4/` 复制到仓库外临时目录作快照（片 2 / 片 3 的回滚依据）。

- **片 1（skills/mussel-ui/**，白名单上表 7 文件）**
  1. containers.md 新增 `## 折叠面板`（顶级章节，置于 `## 模态与抽屉` 之前）、精简 Dialog 父组件示例 — 判据：`## 折叠面板` 与 `## 模态与抽屉` 同级，含 `### MuCollapse`/`### MuCollapseGroup`，props 与 collapse*.vue 一致；「父组件调用」代码块已删
  2. data.md 加 MuTag 段 — 判据：`### MuTag` 在 `### MuTags` 之前
  3. styles.md §1.1 口径 + §2.3/§2.4 补录 — 判据：背景表含 `.bg-primary` 与 `-translucent` 行、不含 `.bg-red` 实色行；文本表含 13 基本色行；§1.1 无「不直接用于文本或背景」
  4. navigation.md header 插槽补注 — 判据：L25 含「仅非收起态渲染」
  5. form.md value-mode 压缩 — 判据：无「免去二次查表」等叙述，`normal` / `composite` 示例与注意事项保留
  6. principles.md 去重两处 + 规范 1-A 口径 — 判据：导语无「核心规范共 5 条」重复声明；1-A 标题含「基本色仅限非语义场景」，1-C 未改
  7. SKILL.md 精简 + 速查表 4 行 + 版本/日期 — 判据：测试计划条 3、条 4⑧
- **片 2（skills/mussel1to4/**，白名单 SKILL.md + references/rules.md）**
  1. rules.md 背景映射修正（L188-189）— 判据：含 `.bg-primary` 与 `.bg-gray-translucent`，无「v4 无彩色背景原子类」，且不存在「`.mu-background-hover` … 无对应」行
  2. rules.md 图标指引化（L284）— 判据：无 32 名罗列，指针含「MuTable」「列类型（type）」「icon」且路径 existsSync；v1→v4 映射表保留
  3. rules.md §8 mu-collapse 行加指引；SKILL.md 版本/日期 — 判据：新指引路径 existsSync；正文含 `4.3.1` 与 2026-11-08
- **片 3（skills/mussel3to4/**，白名单 SKILL.md + references/rules.md）**
  1. rules.md「新增原子类」文本/背景行补彩色类 — 判据：背景行含 `.bg-primary`、`.bg-{基本色}-translucent`；文本行含 `.text-{基本色}`
  2. SKILL.md 版本/日期 — 判据：正文含 `4.3.1` 与 2026-11-08

## 未解问题

1. **（裁决：不补列）** `tab-tool-size`（01-explore 未解 1）：文档不列不加注。理由：tabs.vue:37 死 prop 无行为，列出引导误用；「覆盖实现」口径按有效 API 计。若未来 src 消费该 prop 再补列。
2. **（裁决：补录有效类 + 三处口径同步）** styles.md 彩色背景/基本色文本（01-explore 未解 2）：补录，但**仅限运行时有效类**；基本色实色 bg 类（.bg-red 等 13）引用未定义变量 `--mu-{color}-color`（root.scss:12-14 基本色仅 `--mu-{name}`，:20-26 仅语义色有 `-color` 形态；colors.js:81-83 同）且运行时验证无效果，不收录。基本色文本类收录时同步改 styles.md §1.1 用途句与 principles 规范 1-A 标题/例外句（基本色仅限分类标签、数据可视化等非语义场景；状态语义仍用语义扩展色，1-C 不动），三处口径一致，避免同一 skill 内互斥指引。
3. **（裁决：相对路径引用）** 新 skill 引用形态（01-explore 未解 4）：维持 04-impl-split 落地的相对路径 + "mussel-ui skill" 限定语。自包含与指引加载的拒绝理由见「被拒绝的备选」1/2。
4. **（需用户知会，非本设计可决）** 全局 `~/.zcode/skills/mussel-ui` 旧副本仍含升级主线，触发词重叠（01-explore 未解 3）：00-task 明确不动全局。建议用户侧后续手动同步或删除全局旧副本。
5. **（src 侧缺陷知会，超出任务范围）** `background.scss:26-27` 基本色实色背景类引用未定义变量 `--mu-{color}-color`（应为 `--mu-{color}`，对照 typography.scss:56），13 类 + mu- 别名共 26 个类无效果。本次不改 src、文档不收录，§1.1 明示「不可用」；src 修复后按本设计「接口 / 数据结构」节模板补录 13 类并删除 §1.1 的不可用提示。
6. **（裁决：不收录）** `animation.scss` 的 `-mu-ani-*` keyframes（01-explore 未解 5）：纯内部动画（无原子类/文档消费场景），styles.md 不收，维持现状。

---

> **定稿 2026-11-08**：peer 修订（06-amend-1，12 条全采纳）后复核通过，可进入实施。复核范围：6 项实质改动逐项回源码验证落实且自洽、关键事实断言抽查（styles/background.scss、typography.scss、box-shadow.scss、root.scss、tag/collapse 组件、components/index.js 注册表、三个 SKILL.md 现状）、三片白名单互斥与并发零协商、AC2 判据模拟执行可满足（65/65 命中）、改动清单逐项可执行；本轮仅修 1 处表头列名（详见 02-response-1.md）。
