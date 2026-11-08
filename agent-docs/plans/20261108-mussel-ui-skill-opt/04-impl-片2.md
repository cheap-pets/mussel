# 实施记录 — 片 2（skills/mussel1to4）

## 改动文件

- `skills/mussel1to4/references/rules.md` — 设计片 2 步骤 1：背景类映射修正（原 L188-189 → 现 L188-190）：`.mu-background-primary`/`-success`/`-danger`/`-warning` → `.bg-primary`/`.bg-success`/`.bg-danger`/`.bg-warning`（保留 v1 `-danger` 误引用 success-color 的 bug 备注）；`.mu-background-hover` 拆出独立行 → `.bg-gray-translucent`（附视觉差异与 `background` 简写覆盖提示）；`.mu-background-info` 保留「无对应 | 人工处理」
- `skills/mussel1to4/references/rules.md` — 设计片 2 步骤 2：图标清单单源化（L285）：32 名全集罗列替换为 mussel-ui skill `../../mussel-ui/references/components/data.md`『MuTable → 列类型（type）』内 `icon` 列 blockquote 指针（保留大小写敏感提示）；下方 v1→v4 映射表未动
- `skills/mussel1to4/references/rules.md` — 设计片 2 步骤 3：§8「新增能力」`mu-collapse` 行（L614）说明追加「API 见 mussel-ui skill 的 `../../mussel-ui/references/components/containers.md`」
- `skills/mussel1to4/SKILL.md` — 设计片 2 步骤 3：L15 版本「当前 `4.3.0`」→ `4.3.1`、核对日期 2026-11-06 → 2026-11-08；frontmatter `date:` 已为 2026-11-08，未改；结构未动（35 行）

## 偏离

无。一处措辞落地说明：设计中 hover 行备注以「mussel3to4/references/rules.md:188」行号引用 v3 口径，落地为「与 v3 变量映射（`--mu-background-hover` → `--mu-gray-translucent`）口径一致」，事实等价（已对 mussel3to4/references/rules.md 原文核验），仅去掉易漂移的行号。

## 自检

前置事实核验（改动依据）：

- `package.json:3` = `"version": "4.3.1"` ✓
- `src/styles/background.scss:11-19`：`primary/secondary/success/warning/danger` 生成 `.bg-#{$v}` 实底类 + `-translucent` 变体；`:20-33` gray + 12 基本色生成 `-translucent` 类 → `.bg-primary`、`.bg-gray-translucent` 均有效，原文「v4 无彩色背景原子类」为事实错误 ✓
- `skills/mussel3to4/references/rules.md`（背景颜色节）：`--mu-background-hover` → `--mu-gray-translucent` 口径确认 ✓
- `skills/mussel-ui/references/components/data.md:201`：blockquote「内置注册名 32 个」存在，位于 `### MuTable`（L110）列类型（type）`icon` 列注释区 ✓

判据与测试计划核对：

1. `grep -rn "无彩色背景原子类" skills/` → 0 命中（测试计划 4①）✓
2. rules.md L188 含 `.bg-primary` 等 4 类；L189 `.mu-background-hover` → `.bg-gray-translucent`，无「无对应」；L190 `.mu-background-info` 仍「无对应」（步骤 1 判据、测试计划 4⑦）✓
3. `grep -rln "arrowDownLeft" skills/` → 仅 `skills/mussel-ui/references/components/data.md`（步骤 2 判据、测试计划 4②）✓
4. 图标指针行（rules.md:285）含「MuTable」「列类型（type）」「icon」；node `existsSync`（自 rules.md 所在目录解析）：`../../mussel-ui/references/components/data.md`、`../../mussel-ui/references/components/containers.md` 均 `true`（步骤 2/3 判据、测试计划 4⑤ 片 2 部分）✓
5. SKILL.md:15 含 `4.3.1` 与 `2026-11-08`；frontmatter `date:`（L4）= 2026-11-08（步骤 3 判据、测试计划 4⑧ 片 2 部分）；行数 35 ≤ 40（测试计划 3）✓
6. `diff -u` 快照 vs 改后：SKILL.md 1 处 hunk、rules.md 3 处 hunk，无其他改动 ✓
7. `git status --short -- skills/`：本片写入仅落在 `?? skills/mussel1to4/`（白名单内）；`M/D skills/mussel-ui/**` 为片 1 并发改动与本片无关 ✓
8. lint：不适用（纯 Markdown 文档，项目无对应 lint 配置），以设计判据 grep + diff 代替

开工快照（设计「风险与回滚」约定）：`skills/mussel1to4/`、`skills/mussel3to4/` 已复制至仓库外 `/tmp/mussel-skills-snapshot-20261108/`（复制于本片改动前，为拆分后状态）。

## 遗留

- 无本片遗留。`.mu-background-hover` 映射行附带的「实色→半透明视觉差异」「`background` 简写需改 `background-color`」两条为面向迁移者的核对提示，实际形态取决于各项目 v1 副本，非静态可终判。
