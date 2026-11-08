# 实施记录 — 升级内容机械拆分（mussel1to4 / mussel3to4）

模式：implementer（机械迁移）。依据：01-explore.md §2 拆分边界与 §2.3 最小切割清单。只搬移内容与修引用路径，不优化措辞、不增删知识点。

## 改动文件

### 新建（迁移 + 新写入口）

| 文件 | 来源 / 说明 |
|------|------------|
| `skills/mussel3to4/SKILL.md` | 新写。frontmatter 参照 mussel-ui 格式（name/author/date/description）；description 覆盖 "Mussel 3 / `mussel` 3.x / `@mctech/mussel3`（Vue 3）升级到 Mussel 4" 触发场景，注明不含 Mussel 1 升级。主线取原 mussel-ui SKILL.md:15-18（版本检查，v4 侧）+ :29-33（进入条件）+ :42-45（加载指引），v4 API/styles 查阅改指 `../mussel-ui/references/*` |
| `skills/mussel3to4/references/process.md` | 迁自 `skills/mussel-ui/references/upgrade-v3/process.md`（227 行），修引用（见迁移映射） |
| `skills/mussel3to4/references/rules.md` | 迁自 `upgrade-v3/rules.md`（1327 行），修引用（见迁移映射） |
| `skills/mussel1to4/SKILL.md` | 新写。description 覆盖 "Mussel 1 / `@mctech/mussel` / libs/mussel UMD / Vue 2 站点升级到 Mussel 4"，注明不含全站升级方案规划（属 mussel1-site-upgrade-planner）与 Mussel 3 升级（走 mussel3to4）。主线取原 SKILL.md:15-18（版本检查，含 v1 侧 `1.9` 基准）+ :34-37（路线 B 进入条件）+ :46-51（路线 B 加载指引），含"不走 mussel3to4 流程、不得套用其规则"声明 |
| `skills/mussel1to4/references/overview.md` | 迁自 `upgrade-v1/overview.md`（89 行），修引用（见迁移映射） |
| `skills/mussel1to4/references/process.md` | 迁自 `upgrade-v1/process.md`（208 行），修引用（见迁移映射） |
| `skills/mussel1to4/references/rules.md` | 迁自 `upgrade-v1/rules.md`（650 行），修引用（见迁移映射） |

### 修改（mussel-ui 侧收口）

| 文件 | 说明 |
|------|------|
| `skills/mussel-ui/SKILL.md` | description 去升级触发句、改为指引式（保留"升级"字样指路，指向 mussel3to4 / mussel1to4）；L13 范围声明去"M3→4 与 M1→4 迁移"括注；默认路径行去"不要加载 upgrade-v3/v1"；原 L27-51 路线 A/B 整段（25 行）替换为 1 行升级指引（新 skill 名 + 触发场景）。184 行 → 160 行 |
| `skills/mussel-ui/references/principles.md` | :365 尾注改指 mussel3to4 skill 的 `../../mussel3to4/references/rules.md`「迁移规则 5 组件迁移」 |

### 删除

| 目录 | 内容 |
|------|------|
| `skills/mussel-ui/references/upgrade-v1/` | 3 文件（已迁至 mussel1to4） |
| `skills/mussel-ui/references/upgrade-v3/` | 2 文件（已迁至 mussel3to4） |

## 迁移映射（升级内容 → 主线引用改写，01-explore §2.2 全量）

相对路径深度说明：`references/` 子目录内文件指 mussel-ui 用 `../../mussel-ui/references/...`；SKILL.md（skill 根）用 `../mussel-ui/references/...`。每处均带 mussel-ui skill 限定语（行内"mussel-ui skill 的"或行尾"（参见 mussel-ui skill）"）。

### mussel3to4/references/process.md（原 upgrade-v3/process.md）

| 行 | 原文 → 新文 |
|----|------------|
| 29 | "回到 `SKILL.md` 步骤 2" → "回到 mussel-ui skill 默认 UI 路径"（*清单外补修*，见偏离） |
| 119 | "**生成工具**：Mussel UI Skill" → "mussel3to4 Skill"（*清单外补修*） |
| 225 | "`SKILL.md` 的组件速查表与步骤 2 路由表、`references/styles.md`、`references/install.md`" → "mussel-ui skill 的组件速查表与步骤 2 路由表，及 `../../mussel-ui/references/styles.md` 与 `../../mussel-ui/references/install.md`（参见 mussel-ui skill）" |

### mussel3to4/references/rules.md（原 upgrade-v3/rules.md）

| 行 | 改写 |
|----|------|
| 9 | 单源声明 → mussel-ui skill 的 `../../mussel-ui/references/components/*` 与 `../../mussel-ui/references/styles.md` |
| 45 | install 完整 API → `../../mussel-ui/references/install.md`（参见 mussel-ui skill） |
| 152 | 「运行时换肤」→ `../../mussel-ui/references/install.md`「运行时换肤」（参见 mussel-ui skill） |
| 281 | 原子类完整列表 → mussel-ui skill 的 `../../mussel-ui/references/styles.md` |
| 637 | MuDialog API → `../../mussel-ui/references/components/containers.md`（参见 mussel-ui skill） |
| 654 | dismissible 语义 → mussel-ui skill 的 `../../mussel-ui/references/components/containers.md` |
| 1119 | input 类型清单 → mussel-ui skill 的 `../../mussel-ui/references/components/form.md` |
| 1177 | mu-badge API → mussel-ui skill 的 `../../mussel-ui/references/components/basic.md` |
| 1300 | "`SKILL.md` 组件速查表路由" → "mussel-ui skill 组件速查表路由（`../../mussel-ui/references/components/*`）" |

### mussel1to4/references/overview.md（原 upgrade-v1/overview.md）

| 行 | 改写 |
|----|------|
| 5 | "`references/upgrade-v3/`（V3→V4）" → "mussel3to4 skill（V3→V4）" |
| 7 | "以本 skill `SKILL.md` 的版本声明为准" 保留不改——现指 mussel1to4 自身 SKILL.md（已含版本声明块），引用有效 |
| 12 | "本 skill 的 `references/components/*` 与 `references/styles.md`" → "mussel-ui skill 的 `../../mussel-ui/references/components/*` 与 `../../mussel-ui/references/styles.md`" |

### mussel1to4/references/process.md（原 upgrade-v1/process.md）

| 行 | 改写 |
|----|------|
| 38 | "改用本 skill 的 `references/upgrade-v3/`" → "改用 mussel3to4 skill" |
| 103 | "**生成工具**：mussel-ui Skill（V1→V4 升级路径）" → "mussel1to4 Skill"（*清单外补修*） |

### mussel1to4/references/rules.md（原 upgrade-v1/rules.md）

| 行 | 改写 |
|----|------|
| 11 | 单源声明 → mussel-ui skill 的 `../../mussel-ui/references/components/*` 与 `../../mussel-ui/references/styles.md` |
| 104 | CSS 变量完整清单 → mussel-ui skill 的 `../../mussel-ui/references/styles.md` |
| 316 | "以 `references/components/*` 为准" → mussel-ui skill 的 `../../mussel-ui/references/components/*` |
| 408 | form.md → mussel-ui skill `../../mussel-ui/references/components/form.md` |
| 498 | data.md → mussel-ui skill `../../mussel-ui/references/components/data.md` |
| 527 | data.md → mussel-ui skill `../../mussel-ui/references/components/data.md` |
| 536 | navigation.md → mussel-ui skill 的 `../../mussel-ui/references/components/navigation.md` |

### mussel-ui 主线 → 升级引用（2 处，01-explore §2.2）

| 位置 | 处理 |
|------|------|
| `SKILL.md:27-51`（路线 A/B 全段） | 替换为 1 行指引："**升级任务**：Mussel 3 → 4、Mussel 1（`@mctech/mussel`，Vue 2）→ 4 的升级迁移不属本 skill，分别使用 `mussel3to4` / `mussel1to4` skill。" |
| `principles.md:365` | 改指 mussel3to4 skill（见上） |

## 偏离

无 BLOCKED 级偏离。以下 3 点为派发/清单的机械性补正，均在"修引用路径"范围内：

1. **相对路径深度**：派发写 `../mussel-ui/references/...`；从 `references/` 子目录内的文件出发需 `../../mussel-ui/references/...` 才能解析（`../` 只到 skill 根）。SKILL.md 层保持 `../mussel-ui/...`。已用 node `path.resolve` 逐条验证全部可达。
2. **清单外补修 3 处**（原引用拆分后断义/署名错）：
   - mussel3to4 process.md:29 "回到 `SKILL.md` 步骤 2"——原指 mussel-ui SKILL.md 步骤 2，拆分后新 skill 无此节，改为"回到 mussel-ui skill 默认 UI 路径"。
   - 两处升级计划模板"生成工具"署名（v3 process.md:119、v1 process.md:103）改为各自新 skill 名。
   - v1 overview.md:5 对 upgrade-v3 目录的引用随 process.md:38 一并改指 mussel3to4 skill。
3. **v1 overview.md:7 "本 skill SKILL.md" 保留**：01-explore §2.3.6 建议"改指自身 SKILL.md"——迁移后"本 skill"语义已自然指向 mussel1to4 自身，且新 SKILL.md 含版本声明块，故零改动即满足；不重复改写。

## 自检

| 检查项 | 命令 / 方式 | 结果 |
|--------|------------|------|
| mussel-ui 内 upgrade-v1/v3 残留引用 | `grep -rn "upgrade-v1\|upgrade-v3" skills/mussel-ui/` | 0 命中 |
| 新 SKILL.md 内部引用（overview/process/rules.md） | ls 逐一核对 | 5 文件全部存在 |
| 跨 skill 相对链接可达性 | node 脚本：对所有 `(../)+mussel-ui/references/...` 匹配做 `path.resolve` + `existsSync` | 全部可达，0 断链 |
| mussel-ui 主线升级措辞残留 | `grep -n "升级\|路线\|opt-in" SKILL.md` | 仅剩 2 处指引式（L7 description、L27 指引行），无路线 A/B 残留 |
| git 改动范围 | `git status --short` | skills/ 内仅：M mussel-ui/SKILL.md、M mussel-ui/references/principles.md、D upgrade-v1/*（3）、D upgrade-v3/*（2）、?? mussel1to4/、?? mussel3to4/；其余改动（src/demo/agent-docs 等）均为 00-task 基线已记录的前任务遗留 |

## 遗留

- 全局 `~/.zcode/skills/mussel-ui` 旧副本仍含升级主线，触发词"升级到 Mussel 4"可能命中全局旧版——01-explore 约束与风险已记录，属用户侧既有事实，本任务范围外。
- 拆分后 v4 单源声明与内置图标清单分属两个新 skill，后续维护需各自与 mussel-ui references 同步（拆分固有代价，01-explore §4.2 已记录）。
- 后续设计步骤可再优化新 SKILL.md 结构与措辞；本步为机械迁移，未做内容增删（除引用路径改写所必需的衔接词）。
