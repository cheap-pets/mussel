# 设计评审（第 1 轮）

VERDICT: REVISE

评审对象：`02-design.md`。输入：`00-task.md`、`decisions.md`、`01-explore.md`、`04-impl-split.md`。独立核对全部关键断言对源码，未采用设计者自评。
基线已确认：`skills/` 拆分已落地（`mussel-ui/SKILL.md` 160 行、`mussel1to4/SKILL.md` 35 行、`mussel3to4/SKILL.md` 31 行；`mussel-ui` 内 `upgrade-v` 0 命中）。

## 检查项结论

1. **覆盖** — `00-task.md` 含「目标」与「验收标准」，可验证；验收标准实为 4 条（派发称 5 条，文件编号 1-4），设计测试计划 4 行逐条映射：AC1→终验/AC2→片1/AC3→片1-3/AC4→片1-3+终验，无缺失条目；目标 1-5 均有对应设计项（目标 1 由 04-impl-split 达成并归终验，目标 5 由共享决策 3 承载）。缺陷：AC2 的验证手段不可满足（major 2）。无测试文件新增需求（纯文档任务，不适用）。
2. **事实一致** — 抽查通过：MuTag props/合法值/类生成 = `src/components/tag/tag.vue:15-25`、`src/components/common/props.js:9-12`、`src/colors.js:4-28`、`src/components/tag/tag.scss:2-3,19,23-24`；MuCollapse/CollapseGroup = `collapse.vue:35-49,8-18,57-69`、`collapse-group.vue:16-25,54-79`、`collapse.scss:4-8`；styles 缺口清单 = `background.scss:11-33`、`typography.scss:50-57`、`box-shadow.scss:1`；「基本色实色 bg 无效」成立（`root.scss:12-14` 仅 `--mu-{name}`、`:20-26` 仅语义色 `-color`；`background.scss:26-27` 引用 `--mu-{name}-color`；全仓无 `--mu-gray-color`/`--mu-red-color`）；`tab-tool-size` 确为死 prop（`tabs.vue:37`、`tab-bar.vue:76`）；`side-menu.vue:11` 收起态不渲染 header。发现 2 处文档内部矛盾（major 1、3）与版本号口径问题（minor 4）；4 处行号偏移（minor 3）。
3. **约定一致** — 引用形态（`../../mussel-ui/...`、`../mussel-ui/...`）与 04-impl-split 一致且可达；无词表/ADR 冲突。组件文档格式声明「复用现状」，但新引入 `| v-model | 说明 |` 单列表，与现有 12 处「属性行 + 双向绑定」写法不符（minor 8）。
4. **影响面** — 三片白名单文件集合两两不相交；跨片依赖（片 3 同步 styles.md 新口径、片 2 指针指向片 1 新增小节）已在设计与共享决策中定死，可零协商。遗漏：v1 同类映射行 `rules.md:189` 未纳入修复（major 3）。
5. **可实施** — 实施步骤有序，每步有可观察判据；片内无循环依赖，三片可并发。
6. **风险与回滚** — 风险 1-4 已识别，对策可用；无单向门判断正确（纯文档）。回滚方案对 untracked 新目录无效（minor 5）。
7. **范围** — 仅 `skills/mussel-ui/**`、`skills/mussel1to4/**`、`skills/mussel3to4/**`，符合 00-task L17/L20 与 `decisions.md`；不改 src/docs/docs-site；无越界。
8. **切片** — 每片有可观察判据；验收标准归属明确；片间无环；片 1 = 7 文件、片 2 = 2 文件、片 3 = 2 文件，互斥无共写（证据：`git ls-files` 无交集）。仅落点层级需补明（minor 2）。

## 问题清单

### blocker

（无）

### major

[major] `02-design.md:118-124`（§2.4 补录）、`:181`（未解问题 2） — 新增 `.text-{基本色}`（13 类）与同一 skill 内既有硬性表述直接冲突，设计只论证了与规范 1-C 不冲突，漏掉更强的 1-A 与 §1.1 禁令；落地后 mussel-ui 对「基本色能否用于文本」给出互斥指引 — 证据：`skills/mussel-ui/references/styles.md:11`「用于图标着色、装饰性元素，**不直接用于文本或背景**，应优先使用语义扩展色」；`skills/mussel-ui/references/principles.md:22`「规范 1-A：文字颜色必须使用语义文本变量」；对照 `styles.md:53`「所有基本色和语义色均有 `-translucent` 变体，适用于 hover 背景、标签底色」（已默认基本色可变体用于背景），`tag.vue:21-25` 组件自身即输出 `text-{color}` — 建议修法：片 1 增加一条 docs 改动：`styles.md` §1.1 与 `principles.md` 1-A 各改一句范围（基本色仅限非语义场景：分类标签/数据可视化/透明底；状态语义仍用语义扩展色），或 §2.4 新行显式标注为 1-A 例外并同步 1-A 措辞；并纳入测试计划 AC4 的抽查项。

[major] `02-design.md:154`（测试计划 行 2 ①） — AC2 判据「src 注册组件（index.js:18-61 全集）在 references 8 文件中均有 `### Mu` 段」不可满足，verifier 照此执行会把正确实现判为失败 — 证据：`MuTreeNode` 已注册（`src/components/tree/index.js:2`；`src/components/index.js:26-60` 注册所有 `Mu*` 导出），但 references 无 `### MuTreeNode`，仅 `references/components/data.md:57` 内部说明；另有 5 个注册组件只有组合标题：`layout.md:23`（MuHBox / MuVBox）、`:53`（MuGridBox / MuGridCell）、`:131`（MuSplitHBox / MuSplitVBox）、`:311`（MuFlexDivider / MuFlexSpace / MuFlexBreak）、`feedback.md:3`（MuTooltip / v-mu-tooltip 指令） — 建议修法：判据改为「每个注册名出现在任一 `### ` 标题内（允许 `A / B` 组合标题），`MuTreeNode` 单列为内部组件例外（data.md:57 已注明）」，并给出脚本口径（标题行子串匹配而非 `^### MuXxx` 精确匹配）。

[major] `02-design.md:44`（片 2 ①） — 只修 `rules.md:188`，遗漏同表紧邻行 `189` 的同类事实错误；修复后 v1 指引仍与 v3 指引及本设计新增的 styles.md 内容相反 — 证据：`skills/mussel1to4/references/rules.md:189`「`.mu-background-info` / `.mu-background-hover` | 无对应 | 人工处理」；但 `skills/mussel3to4/references/rules.md:188` 已给出 `--mu-background-hover` → `--mu-gray-translucent`，且本设计新增 `.bg-gray-translucent`（`02-design.md:113`，「适合 hover」） — 建议修法：`rules.md:189` 的 hover 行改为 `.bg-gray-translucent`（或 `--mu-gray-translucent`；若 v1 类为 `background` 简写需注明用 `background-color` 覆盖），`info` 保留无对应；把该行写入片 2 判据（如「L189 不再含 `mu-background-hover` + 无对应」）。

### minor

[minor] `02-design.md:26` — 片 1 表头「7 文件改，4 文件不动」计数错误，实为 5 个不动文件，白名单归类不闭合易漏核 — 证据：`skills/mussel-ui/` 共 12 个文件（SKILL.md + `references/*.md` 3 + `references/components/*.md` 8），改 7 后剩余 `install.md`/`layout.md`/`buttons.md`/`feedback.md`/`basic.md` = 5 — 建议修法：改为「7 文件改，5 文件不动」。

[minor] `02-design.md:33`（片 1 containers.md ①） — 未给出新小节标题层级与准确落点，字面执行会嵌进「模态与抽屉」内，与「划分清晰」目标冲突 — 证据：`containers.md:3` `## 页签`、`:82` `## 模态与抽屉`、`:84` `### MuDialog`；设计写「「页签」与 MuDialog 之间」跨越了 `## 模态与抽屉` 边界 — 建议修法：明确「新增 `## 折叠面板`，置于 `## 模态与抽屉` 之前，内含 `### MuCollapse` / `### MuCollapseGroup`」。

[minor] `02-design.md:30,31,33,52` — 4 处行号引用与实际不符（实施须按内容定位，勿按行号删块） — 证据：SKILL.md 安装章节实际 L58-63（L56 为 `---`、L64 为尾分隔）；`principles.md` 间距提示为单行 L361（设计写 L359-361）；`containers.md` 父组件代码块为 L213-233（含闭合围栏，设计写 L213-232）；`mussel3to4/references/rules.md` 的 `**文本**` 行实际 L291，设计给的范围 L292-296 未含该行（`**背景**` 在 L293） — 建议修法：改为锚点式定位（章节名/首句），仅保留一条行号作参考。

[minor] `02-design.md:30,43,51,61`（共享决策 5） — 核对日期与版本口径未闭合：未说明 frontmatter `date` 是否同步；三处「当前 `4.3.0`」与仓库版本不一致，而设计恰好改同一行 — 证据：`skills/mussel-ui/SKILL.md:4` 仍 `date: 2026-11-06`（body L16 将改 2026-11-08）；`mussel1to4/SKILL.md:4`、`mussel3to4/SKILL.md:4` 已是 2026-11-08；`package.json:3` 为 `4.3.1`，三处 SKILL.md body 写「当前 `4.3.0`」 — 建议修法：共享决策 5 明确「frontmatter `date` 与 body 核对日期同改；「当前 x.y.z」按 `package.json` 刷新」。

[minor] `02-design.md:142`（回滚） — 回滚对 untracked 目录无效：`git checkout -- skills/mussel-ui/` 与不带 `-u` 的 `git stash` 都不会触及两个新 skill 目录，片 2/片 3 的改动无版本回退路径；「恢复两新目录至拆分后状态」无快照可依 — 证据：`git status --short -- skills/` 显示 `?? skills/mussel1to4/`、`?? skills/mussel3to4/`（未跟踪） — 建议修法：实施前将两目录复制到任务目录作快照，或先 `git add -N skills/mussel1to4 skills/mussel3to4` 并用 `git stash -u` 约定回滚口径。

[minor] `02-design.md:116`（§2.3 阴影补录） — 阴影别名说明未排除 `.shadow-none`，与背景行明确排除 `.bg-none` 的做法不对称，易误导 agent 写不存在的 `.mu-shadow-none` — 证据：`src/styles/box-shadow.scss:1-3` 只有 `.shadow-none`，无 mu- 别名（别名仅 `:5-17` 生成） — 建议修法：别名句补「`.shadow-none` 无 mu- 别名」，与 `.bg-none` 口径一致。

[minor] `02-design.md:156`（测试计划 行 4 ④） — 计数口径自相矛盾，按字面核对会产生假阴性/重复计数 — 证据：设计 `:113` 已定义 `-translucent` 共 18（5 功能色 + gray + 12 基本色），测试行写成「功能色 5×2 + 基本色 translucent 18」，18 已含 5 功能色；源码 `background.scss:11-19,21-33` — 建议修法：改为「功能色实色 5 行 + 功能/灰/基本色 translucent 表覆盖 `background.scss:16-18,30-32` 的 18 个类 + 中性 6 行保留」或直接「逐行对照 `background.scss:11-33`」。

[minor] `02-design.md:58`（共享决策 2）、`:77-83`（MuCollapse 骨架） — 新增小节有 3 处格式/表述偏差：(a) 引入 `| v-model |：expanded（…）` 单列表，与本节声明的「复用现状」矛盾（现有 12 处均以属性行 + 「双向绑定」表达，如 `navigation.md:11`、`containers.md:88`）；(b) 未说明提供 `#header` 时 `header-prepend` / `header-append` 不再渲染（二者位于 header 插槽的 fallback 内容内）；(c) 「组模式建议显式设置（expanded 数组与 defaultExpand 依赖它）」不准确，`defaultExpand` 用自动注册 id 即可生效，只有外部绑定 `expanded` 数组才需要已知 id — 证据：`collapse.vue:8-18`（fallback 嵌套）、`collapse-group.vue:54-68`（defaultExpand 用 `items` 注册 id） — 建议修法：v-model 改为属性表行；补「header 覆盖时 prepend/append 不渲染」一句；把「依赖它」收窄为「外部绑定 expanded 数组时需已知 id」。

[minor] `02-design.md:44`（片 2 ②，图标单源） — 指针目标位置语义错位：32 名清单位于 data.md 的 MuTable `icon` 列注释，不在图标主题下，agent 从 v1 图标迁移段跳转需二次搜索 — 证据：`references/components/data.md:201`（MuTable 列类型块内的 blockquote；`basic.md` 的 MuIcon 节无该清单） — 建议修法：指针写明落点（如「data.md『MuTable 列类型 · icon 列』内的 `内置注册名 32 个`」），或后续把清单迁至 `basic.md` MuIcon 节再指（迁移超出本任务可只加锚点描述）。
