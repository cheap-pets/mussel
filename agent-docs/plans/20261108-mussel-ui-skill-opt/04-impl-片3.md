# 实施记录 — 片 3（skills/mussel3to4/**）

## 改动文件

- `skills/mussel3to4/SKILL.md` — 设计片 3 步骤 2（版本检查行：`4.3.0` → `4.3.1`、核对日期 2026-11-06 → 2026-11-08；frontmatter `date:` 已为 2026-11-08 未动；结构不动，31 行）
- `skills/mussel3to4/references/rules.md` — 设计片 3 步骤 1（「新增原子类（Mussel 4）」节与 styles.md 新口径同步）：
  - L291 文本行追加 `.text-{基本色}`（gray + 12 基本色，共 13 色）
  - L293 背景行追加 `.bg-primary` / `.bg-secondary` / `.bg-success` / `.bg-warning` / `.bg-danger`（功能色实底）与 `.bg-{功能色}-translucent` / `.bg-gray-translucent` / `.bg-{基本色}-translucent`（共 18 个；基本色实底 `.bg-{基本色}` 当前无效），斑马纹备注保留

口径依据：02-design.md「接口 / 数据结构」styles.md 补录内容（共享决策 4：基本色实色背景类不收录；口径直接取自设计定稿，未依赖片 1 实际产出）。`../../mussel-ui/...` 与 `../mussel-ui/...` 引用形态全部保持原样，未改其他引用。

## 偏离

无。

## 自检

开工前快照（设计「风险与回滚」约定）：`skills/mussel1to4/`、`skills/mussel3to4/` 已复制到 `/tmp/mussel-skills-snapshot-20261108/`（Git Bash /tmp，仓库外）。

| 检查 | 命令 | 结果 |
|------|------|------|
| 判据 1：文本行含 `.text-{基本色}` | `grep -n 'text-{基本色}' references/rules.md` | L291 命中 |
| 判据 1：背景行含 `.bg-primary`、`.bg-{基本色}-translucent` | `grep -n 'bg-primary\|bg-{基本色}-translucent' references/rules.md` | L293 命中 |
| 判据 2：SKILL.md 正文含 `4.3.1` 与 2026-11-08 | `grep -n '4\.3\.1\|2026-11-08' SKILL.md` | L14（正文）+ L4（frontmatter date） |
| 测试计划 4①：`无彩色背景原子类` 0 命中 | `grep -rn '无彩色背景原子类' .`（mussel3to4 内） | 0 命中 |
| 测试计划 3：SKILL.md ≤ 40 行 | `wc -l SKILL.md` | 31 行 |
| 引用可达 | node `existsSync` 扫描两文件全部 mussel-ui 相对引用 | 8/8 OK（含 `*` 通配目录） |
| 白名单核对 | `diff -r /tmp/mussel-skills-snapshot-20261108/mussel3to4 skills/mussel3to4` | 仅 SKILL.md L14、rules.md L291/L293 三处差异 |
| git 状态 | `git status --short -- skills/` | `?? skills/mussel3to4/`（untracked，文件级 diff 由快照 diff 覆盖）；`skills/mussel-ui/` 的 M/D 为拆分步 + 并发片 1 改动，非本片 |

无 lint / typecheck 适用（纯 Markdown 文档，项目无 Markdown lint 配置）。

## 遗留

- `skills/mussel3to4/` 为 untracked 目录，git 无法展示文件级状态，本片以快照 diff 佐证改动范围。
- 若 src 后续修复 `background.scss:27`（基本色实色背景类），rules.md L293 的「基本色实底 `.bg-{基本色}` 当前无效」说明需随 styles.md 补录一并移除（设计风险 1 / 未解问题 5）。
- 快照中 `mussel1to4/` 部分可能混入并发片 2 的进行中状态；mussel3to4 部分为本片开工前完整快照，可作回滚依据。
