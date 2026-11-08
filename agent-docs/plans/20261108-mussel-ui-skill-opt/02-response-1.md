# 设计复核定稿（第 1 轮）

VERDICT: APPROVED（定稿，可进入实施）

复核对象：`02-design.md`（06-amend-1 修订后版本）。输入：`00-task.md`、`decisions.md`、`03-review-1.md`、`06-amend-1.md`。全部关键断言独立回源码核对，未采用审改员自评。

## 复核结论

### 1. 六项实质改动落实抽查（全部通过，无新引入矛盾）

| # | 实质改动 | 结论 | 证据 |
|---|---------|------|------|
| 1 | 基本色文本类口径三处同步 | 通过 | 三处（§1.1 改写句、§2.4 行标注 1-A 例外、1-A 新标题+例外句）均限定「非语义」并指回 1-C/§1.2，措辞互恰；原句属实（`styles.md:11`、`principles.md:22`），13 类真实存在（`typography.scss:50-57` 引用 `--mu-{v}`），1-C（`principles.md:52`）未改；风险 5 / 测试 4⑧ / 步骤 #3/#6 联动齐备 |
| 2 | AC2 判据可执行化 | 通过 | 模拟执行：按 `src/components/index.js` 15 个 `_install` 目录 + 5 个直接导出枚举，排除注释导出（`index.js:37` svg、`tree/index.js:3` MuTreeNodes）得 66 名，除 `MuTreeNode` 例外（`data.md:57` 已注明）余 65 名，加入计划新增 `### MuTag/MuCollapse/MuCollapseGroup` 后对 `### ` 标题子串匹配 **MISSING = []**；组合标题实测存在（`layout.md:23,53,131,311`、`feedback.md:3`） |
| 3 | v1 hover 映射修正纳入片 2 | 通过 | `mussel3to4/references/rules.md:188` `--mu-background-hover` → `--mu-gray-translucent` 属实，片 2①（L188-189）/ 步骤片 2#1 / 测试 4⑦ 三处一致 |
| 4 | 版本号刷新纳入三片 | 通过 | `package.json:3` = `4.3.1`；`mussel-ui/SKILL.md:4` date 2026-11-06（需改属实）、另两个 frontmatter 已 2026-11-08；三片 SKILL 行 + 共享决策 5 + 测试 4⑧ + 步骤联动齐备 |
| 5 | 实施前快照前置步骤 | 通过 | 开工前快照 + 回滚口径重写（明确 untracked 两目录 `git checkout --`/`git stash` 无效、禁 `git add -N`/`git stash -u`）齐备；`git status --short -- skills/` 实测两目录 untracked |
| 6 | 格式模板与 MuCollapse/MuTag 骨架校正 | 通过 | 共享决策 2 双范例行属实（`navigation.md:11` collapsed、`containers.md:88` visible 均「双向绑定」）；骨架逐项对照 `collapse.vue:35-49`（props）、`:48`（model）、`:8-18`（header fallback：覆盖时 title/prepend/append/arrow 均不渲染）、`:53-54`（useId 自动 id）、`:59-69`、`collapse-group.vue:16-25`（expanded Array 默认 `[]`）、`:54-79`（defaultExpand 用注册 id、accordion all 回退 first + warn）全部一致；MuTag 骨架与 `tag.vue:15-25`、`common/props.js:9-12` + `colors.js:4-27`（12 基本色 + 5 功能色、不含 gray）、`tag.scss`（灰底 + inset currentColor 描边、20px/12px）一致 |

### 2. 关键事实断言回源码抽查（全部一致）

- `background.scss:11-19`（5 功能色实底 + translucent）、`:21-33`（gray + 12 基本色；实底 `:26-27` 引用 `--mu-#{$v}-color`、translucent `:30-32` 合计 18）— 与设计 §2.3 补录及测试 4④ 逐行口径一致。
- `typography.scss:37-58`：中性 5 + 功能色 5 + 基本色 13 别名（`.text-*`/`.mu-text-*`）属实。
- `box-shadow.scss:1-3` `.shadow-none` 无 mu- 别名、`:5-17` 其余 6 组别名属实。
- `root.scss`：基本色仅 `--mu-{name}`、语义色才有 `-color` 形态；`colors.js` setupColors 正则同构 — 实色 bg 类无效证据链成立。
- `src/components/index.js:18-61` 注册结构、`:18-22` 直接导入（MuTag/MuTags/MuBadge/MuTable/MuScrollBox）、`form/index.js:3` MuInputGroup 存在（速查表「4 表单」加行成立）。
- skills 现状锚点抽验：`styles.md:11/§1.2/§2.3/§2.4`、`principles.md:22/52/323/361`、`containers.md:3,82,84,213-232`、`navigation.md:25`、`data.md:57,71,110,177,201`、v1 `rules.md:188-189,284,613`、v3 `rules.md:279-296`（文本 L291/背景 L293）、三 SKILL.md 版本检查段 — 全部命中。
- 风险 4 引用属实：`docs/quick-reference_styles.md:22` 同句「不直接用于文本或背景」。

### 3. 三片白名单互斥 / 共享决策自洽 / 并发无协商

- 白名单对账：片 1 = 7 文件（SKILL/principles/styles/containers/navigation/data/form），片 2 = 2（mussel1to4 SKILL + rules），片 3 = 2（mussel3to4 SKILL + rules）；目录构成 12/4/3 文件实测（7+5=12、2+2=4、2+1=3），两两无交集，无共享写文件。
- 跨片依赖均已定死：片 2 图标指针目标「内置注册名 32 个」现存于 `data.md:201` 且片 1 不动该块（仅 L71 前插段，指针用内容锚点不受行号位移影响）；片 2③ mu-collapse 行指针为静态路径；片 3 措辞已在设计内写死，不需读片 1 产物。零协商成立。
- 共享决策 1-5（引用形态/格式模板/精简原则/收录口径/日期版本口径）自洽，与本轮修正后无冲突。

### 4. 改动清单可执行性

逐项有内容锚点 + 完成判据 + 源码依据；「不动」文件显式列举；步骤判据均可用 grep/existsSync 独立验证。无歧义项残留。

## 修正项记录（本轮直接修入 02-design.md，共 1 项）

| # | 位置 | 修正 | 原因 |
|---|------|------|------|
| 1 | 「遵循约定与复用」原子类表格式行 +「接口 / 数据结构」§2.4 追加表头 | `| 类名 \| 变量 \| 说明 |` → `| 类名 \| 变量名 \| 说明 |` | 现有 §2.4 中性/功能色两表列头均为「变量名」（styles.md:524、:537），照原稿抄写会产生第三种列头 |

## 未解问题

维持设计文档 6 条不变（其中 4、5 为用户/src 侧知会项，非本任务阻塞）；本轮无新增。
