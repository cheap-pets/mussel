# 实施记录

## 改动文件

- `skills/mussel-ui/references/components/containers.md` — 设计片 1 步骤 1：`## 模态与抽屉` 前新增顶级章节 `## 折叠面板`（`### MuCollapse` + `### MuCollapseGroup` + accordion/v-model:expanded 最小示例）；MuDialog 封装示例「父组件调用」vue 代码块删除，压缩为一行「父组件以 `ref` 调用子组件暴露的 `show(data)`」；my-dialog 示例正文保留
- `skills/mussel-ui/references/components/data.md` — 步骤 2：`### MuTags` 之前新增 `### MuTag` 段（props color/flat/pill + default 插槽 + 默认形态，按设计骨架）
- `skills/mussel-ui/references/styles.md` — 步骤 3：§1.1 用途句改口径（非语义场景 + `.text-{基本色}` / `-translucent` 可用 + 实色 bg 不可用）；§2.3 背景表追加功能色实底 5 类行 + `-translucent` 18 类行 + `mu-bg-*` 别名说明，阴影表追加 `.shadow-none` 行（无 mu- 别名）+ `mu-shadow-*` 别名说明；§2.4 追加「基本色文本颜色」表（13 色）+ `.mu-text-*` 别名说明。不收录基本色实色 bg 类
- `skills/mussel-ui/references/components/navigation.md` — 步骤 4：MuSideMenu `header` 插槽说明补「仅非收起态渲染（rail / collapsed 下不渲染，同 footer）」
- `skills/mussel-ui/references/components/form.md` — 步骤 5：value-mode 使用场景段压缩为一行（① options 动态/异步；② 提交需带 label），`normal`/`composite` ref 示例与 `>` 注意事项保留
- `skills/mussel-ui/references/principles.md` — 步骤 6：快速自检清单导语删「核心规范共 5 条…违反即不合规」重复计数声明；间距检查提示压缩为一行；规范 1-A 标题改「文字颜色使用语义文本色，基本色仅限非语义场景」并在示例前加非语义例外句（1-C 未改）
- `skills/mussel-ui/SKILL.md` — 步骤 7：删「安装与初始化」整段（保留其后 `---`）；步骤 3 去双计数；速查表补 4 行（`mu-collapse` / `mu-collapse-group` 入「2 容器与面板」，`mu-input-group` 入「4 表单」，`mu-tag` 入「6 数据展示」）；frontmatter `date:` 与版本检查行 → 2026-11-08 / `4.3.1`（160 → 156 行）

## 偏离

无。

说明（非偏离，呈现形态）：styles.md 别名说明（bg / shadow / text 三处）按设计内容落地为表后独立段落，与 §2.3 圆角「两套类名等价」既有段落形态一致；设计草图中为表格行形式，内容无差异。

## 自检

- 开工前快照（设计「实施步骤」开工前要求）：`skills/mussel1to4/`、`skills/mussel3to4/` 已复制到 `C:\Users\scrol\AppData\Local\Temp\mussel-skills-snapshot-20261108\`（7 文件）。注：三片并发，快照取自本片开工时点，若片 2/3 已先行改动其文件，快照含该时点状态
- 写前源码核实（新增文档全部按源码落笔，非照抄设计）：
  - collapse.vue:35-49（props / `defineModel('expanded')` / headerClick emit）、:8-18（header 插槽为 fallback 根，覆盖时 title/prepend/append/arrow 均不渲染）、:53-54（useId 自动 id）、:57-69（组禁用 || 自身禁用、禁用强制收起、独立 `expandedModel ?? defaultExpanded`）
  - collapse-group.vue:16-25（props / `defineModel('expanded')` Array 默认 `[]`）、:54-79（`'expanded' in rawProps` 受控判定、accordion + all 回退 first + warn）
  - collapse.scss:4-8（相邻面板分隔线）
  - tag.vue:15-25（color/flat/pill；`text-{color}` + `bg-{color}-translucent`）；src/colors.js:4-28（12 基本色 + 5 功能色，不含 gray）；tag.scss:1-25（高 20px、字号 12px、灰底 + currentColor 内描边）
  - side-menu.vue:11（`<slot v-if="!isCollapsed" name="header" />`，header 仅非收起态渲染）
  - background.scss:1-33、box-shadow.scss:1-17、typography.scss:37-58（补录类逐行对照：功能色实底 5 类 :11-19、translucent :16-18/:30-32、`.shadow-none` 无别名 :1-3、基本色文本 13 类 :50-58 引用 `--mu-{color}` 有效）
  - package.json:3 = `4.3.1`；form.md:211 MuInputGroup 文档与 input-group.vue 核对后写速查表行
- AC1：`grep -rn "upgrade-v" skills/mussel-ui/` = 0 命中
- AC2：注册名覆盖判定脚本（src/components/index.js 注册名 + 各子目录 index.js 未注释命名导出 + layout 三 const + 直接导入 5 个）对 `grep -h '^### '` 标题子串匹配：收集 67 名，MuSvgStripe（svg/ 于 index.js:1、:37 被注释，未注册，设计明示不纳入）与 MuTreeNode（内部组件，设计明示例外，data.md 注明）除外，其余 65/65 全命中；抽查 MuTag / MuCollapse / MuCollapseGroup props、model、插槽、事件与 collapse*.vue / tag.vue 一致
- AC3：SKILL.md 无「安装与初始化」章节；`grep -n "7 项"` / `grep -n "共 4 条"` 均 0 命中；步骤 1-3 + 速查表结构完整；156 行
- AC4：`grep -n "不直接用于文本" styles.md` = 0；principles.md:22 含「基本色仅限非语义场景」；navigation.md:25 含「仅非收起态渲染」；styles.md 背景表含 `.bg-primary` 行与 `-translucent` 行、无 `.bg-red` 实色行；SKILL.md L4/L16 均为 2026-11-08 且含 `4.3.1`
- 断链：7 个改动文件内全部相对 `.md` 链接 node `existsSync` 检查全可达（本轮片 1 未新增跨文件链接）
- `git status --short`：`skills/mussel-ui/` 下改动仅本片白名单 7 文件；`references/upgrade-v1/`、`upgrade-v3/` 的 D 为前置拆分步（04-impl-split）产物，src/demo/table-ex 等为 00-task 基线遗留，均非本轮改动
- 无测试框架 / lint 范畴要求（纯文档改动，设计测试计划检查方式均为命令 + 抽查，见上）

## 遗留

- 设计风险 4 / 未解问题 4：`docs/quick-reference_styles.md:22` 同类「不直接用于文本」表述与本轮新口径分叉，任务范围限 skills/（00-task L17），待范围放开时同步
- 设计风险 5：规范 1-A 放宽后已按设计在 1-A 例外句、styles.md §1.1 / §2.4 三处显式限定「非语义」并指回 1-C
- 基本色实色背景类（26 个，含 mu- 别名）按设计共享决策 4 未收录，待 src 修复 background.scss:27 后按设计模板补录（未解问题 5）
