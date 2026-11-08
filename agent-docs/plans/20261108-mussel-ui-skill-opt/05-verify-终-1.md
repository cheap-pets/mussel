VERDICT: PASS

# 终验报告 — 第 1 轮（verifier / 终验）

验证者独立于各实施者，全部结论基于本轮亲自运行的命令与源码比对，未采信实施记录自检。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|------|------|------|
| 00-task 验证命令：`ls src/components/` vs `skills/mussel-ui/references/components/` + node 全量双向比对（解析 `src/components/index.js` 命名空间导入 / `_install({})` 直接导入 / 各子目录 index.js 未注释导出，对照 8 个组件文档的 `### ` 标题 token） | 通过 | 注册 66 名；registered-but-not-documented: `MuTreeNode`；documented-but-not-registered: `MuTableEx`, `MuFlexBox`。三项甄别均合理（见验收标准核对 AC2） |
| `grep -rn "upgrade-v" skills/mussel-ui/` | 通过（exit=1） | 0 命中 |
| 设计测试计划 4① `grep -rn "无彩色背景原子类" skills/` | 通过（exit=1） | 0 命中 |
| 设计测试计划 4② `grep -rln "arrowDownLeft" skills/` | 通过 | 仅 `skills/mussel-ui/references/components/data.md` |
| 设计测试计划 AC3 `grep -n "7 项\|共 4 条\|安装与初始化" skills/mussel-ui/SKILL.md` | 通过（exit=1） | 0 命中；SKILL.md 156 行，1to4 35 行、3to4 31 行（≤40） |
| 构建类命令 | 不适用 | 00-task「无构建要求」；纯 Markdown 文档改动，项目无 Markdown lint 配置 |

证据：`evidence/final-1-grep-and-coverage.txt`、`evidence/final-1-link-scan.txt`、`evidence/final-1-migration-diff.txt`

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|------|------|------|------|
| 1. 两个新 SKILL.md 存在且自包含升级内容 | 命令 + diff | `skills/mussel1to4/SKILL.md`（35 行）、`skills/mussel3to4/SKILL.md`（31 行）均含版本检查 / 进入条件 / 工作流程；references 5 文件（1to4：overview/process/rules 89/208/651 行，3to4：process/rules 227/1327 行）与 HEAD 原 `upgrade-v1/`、`upgrade-v3/` 文件 diff（--strip-trailing-cr）仅 4+4+23+6+22 行改动，全部为引用改写与片 2/3 设计内改动，无内容丢失 | PASS |
| 1. mussel-ui 无升级迁移主线 | 命令 | `grep -rn "upgrade-v" skills/mussel-ui/` = 0 命中（严于"仅允许指引行"）；`SKILL.md:27` 为指引行（"分别使用 mussel3to4 / mussel1to4 skill"）；description（:7-8）为指引式；`principles.md:365` 尾注改指 mussel3to4 | PASS |
| 1. 新 skill frontmatter 有效 | 人工核对（自动化无 YAML 校验器，frontmatter 结构简单直接读源） | 1to4 `name: mussel1to4`，description 含 "从 Mussel 1 / @mctech/mussel 升级到 Mussel 4"、"Vue 2 站点迁移到新版 Mussel"；3to4 `name: mussel3to4`，description 含 "升级到 Mussel 4"、"迁移到新版 Mussel"、"把 V3 改成 V4" | PASS |
| 2. references 组件清单与 src 注册一致（双向差集） | 命令（node 比对） | 注册 66 名。差集 1（注册未文档）：`MuTreeNode` — 内部组件，`data.md:57` 明示"强依赖 MuTree 上下文…请勿单独使用"（设计明示例外）。差集 2（文档未注册）：`MuTableEx` — 注册于 `src/components/index.ex.js:6`（ex 版本入口），速查表 L133 注明"仅 mussel.ex 版本含"；`MuFlexBox` — 内部基类（`src/components/layout/flex-box.js`），`layout.md:7` 明示"内部组件，无法直接使用"。无真差集 | PASS |
| 2. MuTag 文档 vs tag 源码 | 抽查 | `data.md:71-85` vs `tag.vue:15-25`：color（`common/props.js:9-12` validator = `colors.js:4-16` 12 基本色 + `:18-24` 5 功能色，不含 gray ✓）、flat、pill、default 插槽、`text-{color}` + `bg-{color}-translucent` 类生成（tag.vue:22）逐项一致 | PASS |
| 2. MuCollapse / MuCollapseGroup 文档 vs 源码 | 抽查 | `containers.md:84-128` vs `collapse.vue:35-49`（7 props + `defineModel('expanded')` + `headerClick` emit + `useId` 自动 id）、`:8-18`（header 插槽为 fallback 根，覆盖时 title/prepend/append/arrow 不渲染）、`:57-69`（组禁用 ∥ 自身禁用、禁用强制收起、独立 `expandedModel ?? defaultExpanded`）、`collapse-group.vue:16-25`（accordion/disabled/defaultExpand + expanded Array 默认 `[]`）、`:54-79`（`'expanded' in rawProps` 受控判定、accordion+all 回退 first + warn）逐项一致；分隔线 `collapse.scss` 支撑 | PASS |
| 2. 速查表 4 行 | 命令 | SKILL.md L83 `mu-collapse`、L84 `mu-collapse-group`、L103 `mu-input-group`、L136 `mu-tag` | PASS |
| 3. SKILL.md 主线精简、无双计数 | 命令 | 无「安装与初始化」章节、"7 项" / "共 4 条" 0 命中；步骤 1-3 + 速查表结构完整；1to4 35 / 3to4 31 行 ≤40 | PASS |
| 3. 非主线在 references、无重复 | 命令 + 抽查 | principles.md 自检清单导语已删「核心规范共 5 条…」重复声明（git diff 确认）、间距提示压缩为一行（:363，删「仅作示意…白名单」）；form.md value-mode 压缩为一行（:247，无"免去二次查表"）；containers.md Dialog「父组件调用」代码块已删（:263 压缩为一行）。references 划分：mussel-ui = install / principles / styles + components 8 类；1to4 = overview（版本档次）/ process / rules 正交；3to4 = process / rules 正交，无主题混杂 | PASS |
| 4-①②③⑦⑧ 口径与残留 | 命令 | ①0 命中；②仅 data.md；③`navigation.md:25` 含「仅非收起态渲染（rail / collapsed 下不渲染，同 footer）」；⑦`mussel1to4/references/rules.md:188-190`：4 类功能色映射 `.bg-primary/...`、`:189` `.mu-background-hover` → `.bg-gray-translucent`（无「无对应」）、`:190` `.mu-background-info` 仍无对应；⑧三 SKILL.md 正文均 `4.3.1` + 2026-11-08、frontmatter `date:` 均 2026-11-08、`package.json:3` = 4.3.1；styles.md 无「不直接用于文本」（exit=1）；`principles.md:22` 1-A 标题含「基本色仅限非语义场景」 | PASS |
| 4-④ styles.md 补录 vs background.scss / typography.scss / box-shadow.scss | 逐行对照 | §2.3 背景表：功能色实底 5 类（background.scss:11-14，引用 `--mu-{v}-color` 有效）+ `-translucent` 18 类（:16-18 功能色 5 + :30-32 gray+12 基本色，引用 `--mu-{v}-translucent` 有效）在表；13 个基本色实色类（:26-27 引用 `--mu-{v}-color`，root.scss:12-14 基本色无 `-color` 变量 → 无效）**不在表** ✓；`.bg-none` 无 mu- 别名（:1-3）✓；`.shadow-none` 无 mu- 别名（box-shadow.scss:1-3）✓；shadow 别名等价（:5-17）✓；§2.4 基本色文本 13 类（typography.scss:50-58 引用 `--mu-{v}` 有效）✓；`.mu-text-*` 别名覆盖中性 5/功能色 5/基本色 13（typography.scss:37-58 三段成对生成）✓；§1.1 口径句与有效性标注全部与源码一致 | PASS |
| 4-⑤ 链接完整性 | 命令（node existsSync） | 三 skill 19 个 md 文件，路径形态相对引用 78 个全部可达，0 断链。裸文件名指代 3 处（`layout.md` → `styles.md` ×2：语义目标 `references/styles.md` 存在，layout.md 为基线前"不动"文件；`overview.md:7` → `SKILL.md`：语义目标 skill 根存在，04-impl-split 偏离 3 已记录）非断链；`/mussel-upgrade-plan.md` 等 6 处为产物路径模板（`{项目根目录}/...`），非文件引用 | PASS |
| 4-⑥ 片 3 rules 口径与片 1 styles.md 一致 | 抽查 | `mussel3to4/references/rules.md:291` 文本行含 `.text-{基本色}`（gray+12 共 13）、`:293` 背景行含 `.bg-primary` 等 5 功能色实底 + 18 个 `-translucent` + 「基本色实底当前无效」标注 + 斑马纹备注保留，与 styles.md §2.3/§2.4 补录口径一致；片 2 图标指引（`mussel1to4/references/rules.md:284`）落点 `data.md`「内置注册名 32 个」blockquote 存在（data.md MuTable 列类型 icon 列） | PASS |
| 4. 随机抽 3 个既有组件 API vs 源码 | 抽查（固定种子 20261108 伪随机） | `MuSegmented`（form.md:530 vs segmented.vue:29-34：options/disabled/icon-position 默认 left validator ['left','top']/modelValue/default 插槽作用域 option）✓；`MuHBox`（layout.md:23 vs h-box.vue：extends FlexBox + direction:'row'，props 表 = flex-box.js:3-21 逐项一致）✓；`MuDateInput`（form.md:342 vs date-input.vue:74-87 + calendar/constants.js:11-28：type 默认 date validator 5 值/format 默认 null/value-type/value-format/week-starts-on/min/max）✓ | PASS |
| 6. 链接完整性（派发追加项） | 命令 | 同 4-⑤：0 断链 | PASS |

## 范围核对

`git status --short` 全量 vs `00-task.md` 基线：

- **基线排除项**（基线已记录的前任务遗留，非本任务改动）：M `agent-docs/knowledge/**` 4、M `demo/src/data/table-ex/self-checks/**` 5、M `src/components/table/ex/**` 37、D `src/components/table/ex/interaction/interactions.js`、M `todo/misc.md`、?? `agent-docs/plans/20261107-*`、?? `scripts/`、?? `src/components/table/ex/interaction/{click-resolve,hit-test,resize-resolve}.js`
- **本任务改动**（全部在允许范围）：
  - M `skills/mussel-ui/` 7 文件（= 片 1 白名单：SKILL.md、principles.md、styles.md、containers.md、navigation.md、data.md、form.md）
  - D `skills/mussel-ui/references/upgrade-v1/` 3 文件 + `upgrade-v3/` 2 文件（04-impl-split 拆分步，内容已证全量迁入新 skill）
  - ?? `skills/mussel1to4/`（6 文件）、?? `skills/mussel3to4/`（4 文件）
  - ?? `agent-docs/plans/20261108-mussel-ui-skill-opt/`（流水线任务目录自身，含本轮 evidence/）
- **无法区分**：?? `agent-docs/knowledge/project/demo-watch-agent-edit-cache-bust.md` — 基线摘要未列出。经核：内容为 demo watch 缓存问题知识（table-ex 前任务主题，与本任务无关），时间戳 2026-11-08 09:50 早于本任务 skills 改动（11:16+）。判定为基线摘要遗漏的既有 untracked 文件，非本任务产物。
- 设计外改动（已记录-已覆盖 / 已记录-未覆盖 / 未记录）：无。
- `skills/ui-spec/`、`docs/`、`docs-site/` 无改动 ✓（与 00-task 约束一致）。

## 测试质量问题

不适用（纯文档任务，无新增测试；设计测试计划的命令 + 抽查手段已全部按原手段执行）。

## 需人工检查

1. **全局 `~/.zcode/skills/mussel-ui` 旧副本处置**（设计风险 2 / 未解问题 4，00-task 明确不动全局，范围外）：旧副本仍含升级主线，触发词"升级到 Mussel 4"可能命中全局旧版而非项目内新 skill。建议：确认 `C:\Users\scrol\.zcode\skills\mussel-ui\` 是否仍有 `references/upgrade-v1|v3/` 目录，若有，删除全局旧副本或同步为项目内版本。影响：AC1 的实际触发效果（不影响项目内文件判定）。

## 验收入口（PASS 时必填）

每条可直接复制执行（Git Bash，项目根 `D:\workshop\cheap-pets\mussel`）：

1. AC1 — `ls skills/mussel1to4/SKILL.md skills/mussel3to4/SKILL.md && grep -rn "upgrade-v" skills/mussel-ui/ ; echo done`（预期：两文件列出；grep 无输出；输出 done）
2. AC2 — 打开 `skills/mussel-ui/references/components/data.md` 定位 `### MuTag`（:71），对照 `src/components/tag/tag.vue:15-19`（color/flat/pill）与 `src/colors.js:4-24`（12 基本色 + 5 功能色）
3. AC3 — `grep -n "安装与初始化\|7 项\|共 4 条" skills/mussel-ui/SKILL.md ; wc -l skills/mussel1to4/SKILL.md skills/mussel3to4/SKILL.md`（预期：grep 无输出；35 / 31）
4. AC4 — `grep -rn "无彩色背景原子类" skills/ ; grep -n "4\.3\.1" skills/mussel-ui/SKILL.md skills/mussel1to4/SKILL.md skills/mussel3to4/SKILL.md`（预期：前者无输出；后者各 1 行命中）
5. AC4 抽查 — 打开 `skills/mussel-ui/references/styles.md` §2.3（:440-452）对照 `src/styles/background.scss:11-33`：表内含 `.bg-primary` 等 5 实底与 `-translucent`（18），不含 `.bg-red` 等基本色实色

## 环境阻塞

无。

## 失败项

无。

---

附注（非失败，供知会）：
- `skills/mussel3to4/references/rules.md` 为 CRLF 行尾（仓库原文件 LF），内容经 --strip-trailing-cr 比对等价（仅 22 行设计内改动）；untracked 新文件，无 git 语义影响。
- `principles.md:361` 机判表行说明列与 `:363` 压缩后提示行信息轻微重叠，属设计保留的表行（设计仅要求压缩提示行并删「仅作示意」句，均已满足）。
- src 侧缺陷（`background.scss:26-27` 基本色实色类引用未定义变量，26 个类无效）：设计未解问题 5 已记录，本次文档正确地未收录；src 修复后需按设计模板补录。
