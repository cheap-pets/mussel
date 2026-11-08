VERDICT: PASS

# 终验报告 — 第 2 轮（verifier / 终验，追加段：片A skills 补录 + 片B docs/docs-site 同步）

验证者独立于各实施者，全部结论基于本轮亲自运行的命令与源码比对，未采信片A / 片B实施记录自检。证据：`evidence/final-2-appendix-verify.txt`。

## 上轮问题核对（第 2 轮起）

上轮（05-verify-终-1.md）PASS，失败项无。需人工 1 项（全局 `~/.zcode/skills/mussel-ui` 旧副本）本轮复核：`C:/Users/scrol/.zcode/skills/mussel-ui/references/` 仍含 `upgrade-v1/`、`upgrade-v3/`，SKILL.md 仍为升级主线旧版 — 未处理（00-task 约束不动全局，范围外），继续列入需人工。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|------|------|------|
| `grep -rn "不可用\|无效" skills/mussel-ui/references/styles.md skills/mussel1to4/references/rules.md skills/mussel3to4/references/rules.md` | 通过（exit=1） | 0 命中，无过时标注残留 |
| `npm run docs:build` | 通过（exit=0） | `build complete in 8.43s`；icon 重复注册与 SplitHBox `resizable/collapsible/splitter-size/splitter-shape` 弃用警告为既有页面遗留（与本轮 7 个改动文件无关，片B记录遗留 3 同述） |
| 产物核验 | 通过 | `docs-site/.vitepress/dist/components/{tag,collapse}.html` 存在；`dist/components/tags.html` 侧边栏含「折叠面板 MuCollapse」「标签 MuTag」；collapse.html 含 `expand-trigger`（3 处）；tag.html / styles-colors.html 含「基本色」 |
| node 全量标签扫描（docs/ + docs-site/，排除 dist/cache/mussel4-introduction.md；`<mu-*` 标签 vs src 注册清单 kebab 化） | 通过 | 67 文件、63 个标签、注册 token 68；UNKNOWN 仅 `table-ex` — 注册于 `src/components/index.ex.js:3`（ex 入口），已知例外 |
| 原子类抽查（`bg-/text-/shadow-` token 提取） | 通过 | docs/docs-site 中彩色类引用全部落在 skill §2.3/§2.4 收录范围（13 基本色实底 + translucent + 功能色）；其余异常 token（`text-color-*`、`shadow-hairline` 等）均来自 CSS 变量名（`--mu-text-*`、`--mu-shadow-hairline`）与文档站自带样式，非原子类误用 |
| `git status --short` / `git diff --stat` / `git diff` | 通过 | 见范围核对 |
| `git diff docs/mussel4-introduction.md` | 通过 | 0 行，`git status --short` 对该文件无输出 → 未动 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|------|------|------|------|
| 片A-1. styles.md §2.3 补录 13 基本色实底 vs `src/styles/background.scss:11-33` | 逐行对照 | 13 色枚举（gray, red, pink, grape, violet, indigo, blue, cyan, teal, green, lime, yellow, orange）= background.scss:22-24；用户修复 `:27` `var(--mu-#{$v})`（`git diff` 单行确认）；别名对 `:26` `.bg-#{$v}, .mu-bg-#{$v}` → 13 实底 + 13 别名。styles.md:450「gray + 12 基本色，共 13…变量 `--mu-{基本色}`」、:453「`.bg-*` 与 `.mu-bg-*` 等价（`.bg-none` 除外）」与 src:1-3 一致；变量存在性：root.scss:1-5 `$BASE_COLORS` 13 色 + :12-14 `--mu-#{$v}` 全生成 | PASS |
| 片A-2. styles.md §1.1 无「不可用」残留 | 命令 | styles.md:11 口径句「文本用 `.text-{基本色}`（§2.4），背景用 `.bg-{基本色}` 与 `-translucent` 变体（§2.3）」，「非语义」限定保留；grep「不可用\|无效」三文件 0 命中 | PASS |
| 片A-3. mussel3to4 rules 实底表述与 styles.md 一致；mussel1to4 rules:189 无过时标注 | 逐行对照 + 命令 | mussel3to4/rules.md:293：`.bg-{基本色}`（gray + 12 基本色，共 13 色，基本色实底）+ 透明变体「共 18 个」（5 功能色 + gray + 12 基本色，= background.scss:16-18 + :30-32 数目吻合）+ 斑马纹备注保留；:291 文本行 `.text-{基本色}` 13 色与 styles.md §2.4 一致。mussel1to4/rules.md:189 语义为「v1 hover 实色 → v4 translucent 视觉差异需确认」，非无效/不可用标注 | PASS |
| 片A-4. 三处口径一致（styles.md / mussel3to4 rules / src） | 逐行对照 | 三处均为「基本色实底有效（13 色，gray + 12 基本色）+ translucent 18 + 仅非语义场景」，与 background.scss:21-33、root.scss:1-14 一致；「非语义」限定三处保留（styles.md:11、:450、mussel3to4:293 走 styles.md §2.4 表述） | PASS |
| 片B-1. quick-reference_styles.md 彩色类 vs skill §2.3/§2.4（双向逐类） | 逐行双向比对 | §1.1 :22 口径句 = styles.md:11（交叉引用本地化为「见 2.4/见 2.3」）；§2.3 :517-526 背景表 10 行与 skill :442-451 逐字等价（.bg-none / 6 语义 / 功能色实底 5 / 基本色实底 13 / translucent 18），无多列无漏列；:528 别名说明（省略内部文件引用，用户文档规范合理）；:513 子标题「背景颜色」（旧「类名带 mu- 前缀」已删）；阴影 :541-543 = skill :465-467；§2.4 :613-619 基本色文本 13 色表 + 等价说明 = skill :547-553（「规范 1-A/1-C」agent 原则引用替换为「状态语义仍用功能色」，口径等价） | PASS |
| 片B-2. docs-site/guide/styles-colors.md、styles-surface.md 彩色类 vs skill §2.3/§2.4 | 逐行双向比对 | styles-colors.md:9 口径句、:106-108 基本色文本行 + 等价说明、:114-125 背景表 10 行 + 别名说明，均与 skill 等价（:105 功能色文本行合并表述「语义色变量」，类名集合一致）；styles-surface.md:76-78 shadow-none + 别名说明 = skill :465-467 | PASS |
| 片B-3. MuTag/MuCollapse/MuCollapseGroup docs 条目 vs skill 源 + src | 逐行对照 + src 抽证 | docs 条目（components.md:442-486、:1621-1642）与 skill 源（containers.md:84-128、data.md:71-85）逐项等价。src：tag.vue:14-17 color/flat/pill + :22-23 `text-{color}`+`bg-{color}-translucent`、common/props.js:11-15 colorProp = colors.js:4-24 12 基本色 + 5 功能色不含 gray、tag.scss:2-3 高 20px/字号 12px + :19-20 灰底内描边；collapse.vue:37-48 7 props + :50 defineModel('expanded') + :51 emits headerClick + :55-69 组/独立展开判定（禁用强制收起）；collapse-group.vue:16-24 accordion/disabled/defaultExpand(first\|all) + expanded Array 默认 [] | PASS |
| 片B-4. docs-site 新页 tag.md / collapse.md vs src；ClientOnly；侧边栏 | 逐行对照 + 命令 | tag.md API 表（:39-47）= src tag.vue props/插槽；演示为普通组件渲染，无作用域插槽，不需 ClientOnly ✓。collapse.md API 表（:148-175）= src collapse 7 props + 3 插槽 + 1 事件、group 4 props；`#header` 作用域插槽演示（:98-124）已包裹 `<ClientOnly>`（:97 注释说明），符合项目 AGENTS.md「作用域插槽演示需 ClientOnly」（同 calendar.md 既有模式）；`mu-button caption`（button.vue:26）、`mu-demo-col`（theme/mussel.css:35）均存在。config.mts:137 `/components/collapse`、:153 `/components/tag` 与新文件名一致；构建产物侧边栏已含两项 | PASS |
| 片B-5. docs/docs-site 全量 grep 抽查 API/类名 | 命令 | 见命令结果表：标签 63 个仅 table-ex（ex 入口）；原子类无越界引用 | PASS |
| 构建 | 命令 | `npm run docs:build` exit=0，8.43s，新页产物生成且内容完整 | PASS |

## 范围核对

`git status --short` 全量 vs 00-task 基线 + decisions.md：

- **基线漂移（非本任务）**：基线中 `src/components/table/ex/**` 37 M + D `interactions.js` 已不在工作区 — 用户已提交（git log：0ef008b、c542dd0、ee16eb4 等 8 个 table 相关 commit），非本任务改动。
- **已记录（decisions.md [追加]）**：M `src/styles/background.scss` — 用户修复基本色实色类变量引用（`git diff` 单行 :27 `--mu-#{$v}-color` → `--mu-#{$v}`）。
- **基线排除项**（前任务遗留，与基线一致）：M `agent-docs/knowledge/**` 4、M `demo/src/data/table-ex/self-checks/**` 5、M `todo/misc.md`、?? `agent-docs/plans/20261107-*`、?? `agent-docs/plans/20261108-table-bugfix-pipeline/`、?? `agent-docs/plans/table-ex-structure-refactor-summary.md`、?? `scripts/`、?? `src/components/table/ex/interaction/{click-resolve,hit-test,resize-resolve}.js`、?? `agent-docs/knowledge/project/demo-watch-agent-edit-cache-bust.md`（上轮已甄别为基线遗漏既有文件）。
- **追加段改动**（全部在白名单）：
  - skills/ 2 文件：M `skills/mussel-ui/references/styles.md`（mtime 13:06）、`skills/mussel3to4/references/rules.md`（13:06，untracked 目录内）。派发预期「skills/ 4 文件」与实际 2 文件不符 — 片A对 `mussel1to4/references/rules.md`（mtime 11:16）与 `principles.md`（11:18）判定「不动」，mtime 证实未改，无越界，仅派发计数偏差。
  - docs/ 2 文件：M `quick-reference_styles.md`（+20 行）、M `quick-reference_components.md`（+73 行，仅 2 个 hunk @:439/@:1570，即三组件条目）。
  - docs-site/ 5 文件：M `config.mts`（+2 行）、M `guide/styles-colors.md`（+10）、M `guide/styles-surface.md`（+3）、?? `components/tag.md`、?? `components/collapse.md`（新增 2 页）。
- **验证产物**：`docs-site/.vitepress/dist/`、`.vitepress/cache/`（.gitignore:25-26 忽略）；项目根 `dist/` 未被本次触碰。
- **设计外改动（未记录/未覆盖）**：无。
- **遗留确认**：`docs/mussel4-introduction.md` git status 空、diff 0 行 → 未动 ✓（mtime 10:25 为文件系统时间戳，git 内容无差异）。

## 测试质量问题

不适用（纯文档任务，无新增测试；派发手段全部按原手段执行）。

## 需人工检查

1. **全局旧副本（上轮遗留，未处理）**：`C:\Users\scrol\.zcode\skills\mussel-ui\` 仍含 `references/upgrade-v1|v3/` 与旧升级主线 SKILL.md，触发词「升级到 Mussel 4」可能命中全局旧版。建议删除全局旧副本或同步为项目内版本（00-task 约束范围外，需用户决策）。
2. **范围外发现：圆角口径分叉（前轮遗留，本轮 5 个 diff hunk 未触及）**：`docs/quick-reference_styles.md:545` 子标题「圆角（类名带 `mu-` 前缀）」与 `src/styles/border.scss:45-47`（`.radius-*` 与 `.mu-radius-*` 两套同时生成、等价）及 skill `styles.md:469-471` 矛盾；`docs-site/guide/styles-surface.md:59-64` 圆角段同样未含两套等价说明。不在本轮派发比对枚举（彩色类）内，非追加段引入；是否补同步由用户决策。
3. **新页视觉效果**：tag.md / collapse.md 构建通过且产物内容完整，但浏览器渲染效果（mu-demo 布局、collapse 展开交互）未做视觉验证。步骤：`npm run docs:dev` 后访问 `http://localhost:5173/components/tag/` 与 `/components/collapse/`，确认演示区渲染与交互正常。

## 验收入口（PASS 时必填）

Git Bash，项目根 `D:\workshop\cheap-pets\mussel`：

1. 片A — `grep -rn "不可用\|无效" skills/mussel-ui/references/styles.md skills/mussel1to4/references/rules.md skills/mussel3to4/references/rules.md ; sed -n '450p' skills/mussel-ui/references/styles.md`（预期：grep 无输出；450 行含「gray + 12 基本色，共 13」）
2. 片A 三处口径 — 对照 `skills/mussel-ui/references/styles.md:449-453`、`skills/mussel3to4/references/rules.md:293` 与 `src/styles/background.scss:21-33`（均为 13 实底 + 18 translucent）
3. 片B styles 同步 — 打开 `docs/quick-reference_styles.md:511-528` 与 `docs-site/guide/styles-colors.md:110-125`，对照 skill `styles.md:436-453`（背景表 10 行 + 别名说明一致）
4. 片B 组件条目 — 打开 `docs/quick-reference_components.md:442`（MuCollapse）/`:1621`（MuTag），对照 `docs-site/components/collapse.md` 与 `src/components/collapse/collapse.vue:37-51`
5. 片B 新页 — `npm run docs:build` 后检查 `docs-site/.vitepress/dist/components/tag.html`、`collapse.html` 存在，且 `dist/components/tags.html` 内可搜到「折叠面板 MuCollapse」

## 环境阻塞

无。

## 失败项

无。
