# 实施记录 — 片A（skills 侧补录，追加段）

触发条件：02-design「风险与回滚」风险 1 / 未解问题 5 的补录条件已满足 —— 用户已修复 `src/styles/background.scss:26-27`（基本色实色类改引 `var(--mu-#{$v})`，git status M，已核实）。

## 补录前核对（src 证据）

- `src/styles/background.scss:21-33`：`@each` 13 基本色（gray, red, pink, grape, violet, indigo, blue, cyan, teal, green, lime, yellow, orange），`.bg-#{$v}, .mu-bg-#{$v} { background-color: var(--mu-#{$v}); }`（:26-28）—— 13 实色类 + 13 别名共 26 个类名。
- `src/styles/root.scss:12-14`：`@each $v in $BASE_COLORS` 生成 `--mu-#{$v}`，13 色全部有定义 → 变量存在，类有效。

## 改动文件

- `skills/mussel-ui/references/styles.md` — 设计「接口 / 数据结构」节补录模板 + 风险 1
  - §2.3（:450）背景颜色表追加行：`| .bg-{基本色}（gray + 12 基本色，共 13） | 基本色实底背景，非语义场景（变量 --mu-{基本色}） |`，置于功能色实底行与 translucent 行之间（措辞与 §2.4 基本色文本行对齐；别名覆盖沿用既有说明行 ：453）
  - §1.1（:11）删除「基本色实色背景类（`.bg-{基本色}`）当前不可用」，口径句改为「文本用 `.text-{基本色}`（§2.4），背景用 `.bg-{基本色}` 与 `-translucent` 变体（§2.3）」，「非语义」限定保留
  - §2.4 检查：无"无实色"类表述，未改
- `skills/mussel3to4/references/rules.md` — 改动项 3
  - :293「新增原子类（Mussel 4）」背景行：删「基本色实底 `.bg-{基本色}` 当前无效」，改为有效并列入枚举 `.bg-{基本色}`（gray + 12 基本色，共 13 色，基本色实底），与 styles.md §2.3 收录一致；「共 18 个」改「透明变体共 18 个」消除指代歧义

## 未改动（按派发条件判定）

- `skills/mussel-ui/references/principles.md`：规范 1-A 例外句仅涉文本类（`.text-{基本色}`），全文件无"实色背景不可用"语义 → 按派发"仅当含该语义时修正"不动
- `skills/mussel1to4/references/rules.md`：:189 映射行命中「实色」字样，但语义为 v1 hover 实色 → v4 translucent 的迁移视觉差异说明，非"无效/不可用"标注；全文件无该标注 → 不动

## 偏离

无。

## 自检

- `grep -rn "不可用\|无效" skills/mussel-ui/references/styles.md skills/mussel1to4/references/rules.md skills/mussel3to4/references/rules.md` → 0 命中（exit 1），无残留过时标注
- 三处口径核对：styles.md §1.1 / §2.3 / mussel3to4:293 均为「基本色实底有效（13 色，gray + 12 基本色）」，与 src/styles/background.scss:26-28 及 root.scss:12-14 一致；「基本色仅限非语义场景」口径三处保留（§1.1 用途句、§2.3 补录行"非语义场景"、1-A 例外句未动）
- §2.3 translucent 行「color = 上述 5 功能色 + gray + 12 基本色，共 18」在插入新行后仍准确（"5 功能色"指代明确，gray + 12 基本色与新增行一致）
- `git status --short skills/`：本轮改动仅 `skills/mussel-ui/references/styles.md`（M）与 `skills/mussel3to4/references/rules.md`（untracked 目录内），均在白名单；其余 M/D（SKILL.md、components/*、principles.md、D upgrade-*）为片 1-3 遗留，非本轮引入
- 纯文档改动，lint / 测试不适用

## 遗留

- 片B（docs/quick-reference_* 与 docs-site 同步）未开始，属后续派发。
