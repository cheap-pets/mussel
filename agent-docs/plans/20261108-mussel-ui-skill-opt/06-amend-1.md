# 设计审改（第 1 次修订）

VERDICT: AMENDED

审改对象：`02-design.md`。输入：`03-review-1.md`（blocker 0 / major 3 / minor 9）、`00-task.md`、`decisions.md`、`01-explore.md`、`04-impl-split.md`。
处置：12 条全部采纳，直接改入设计；异议 0。本轮为第 1 次修订，无「上次回应核对」。

## 03-review-1 逐条处理

| ID | 严重度 | 评审位置 / 问题 | 裁决 | 落实位置（02-design.md） | 复核证据 |
|----|--------|----------------|------|--------------------------|----------|
| 1 | major | `:118-124`、`:181` — 新增 `.text-{基本色}` 与 styles.md:11「不直接用于文本或背景」、principles.md:22 规范 1-A 互斥 | 采纳 | 改动清单片 1（styles/principles 行）、接口「§1.1 用途句改口径」「§2.4 文本颜色」「principles.md 规范 1-A 口径同步」、未解问题 2、风险 5、测试计划 4⑧、实施步骤片 1#3/#6 | `skills/mussel-ui/references/styles.md:11`；`principles.md:22`；对照 `styles.md:53`（基本色 translucent 可用于背景）、`tag.vue:21-25`（组件自身输出 `text-{color}`）；`typography.scss:50-57`（13 个 `.text-{基本色}` 真实存在） |
| 2 | major | `:154` 测试计划 2① — 「所有注册名均有 `### Mu` 段」不可满足 | 采纳 | 测试计划 2① 重写为子串匹配 + 组合标题 + `MuTreeNode` 例外 + 未注释导出口径；实施步骤片 1 判据不变 | `src/components/tree/index.js:2`（MuTreeNode 已注册）、`:3`（MuTreeNodes 注释）；`src/components/index.js:37`（svg 目录 `_install` 注释）、`:18-22,54-60`（直接导入）；组合标题 `layout.md:23,53,131,311`、`feedback.md:3`；`data.md:57`（MuTreeNode 内部说明） |
| 3 | major | `:44` 片 2① — 只修 v1 `rules.md:188`，漏 `:189` | 采纳 | 改动清单片 2①（L188-189）、实施步骤片 2#1、测试计划 4⑦ | `skills/mussel1to4/references/rules.md:188-189`；`skills/mussel3to4/references/rules.md:188`（`--mu-background-hover` → `--mu-gray-translucent`）；`src/styles/background.scss:11-19` |
| 4 | minor | `:26` — 「4 文件不动」计数错误 | 采纳 | 改动清单片 1 表头改「5 文件不动」 | `skills/mussel-ui/` 共 12 文件（SKILL.md + references 3 + components 8），改 7 余 install/layout/buttons/feedback/basic = 5 |
| 5 | minor | `:33` — 折叠面板小节落点未定层级，会嵌进「模态与抽屉」 | 采纳 | 改动清单片 1 containers 行、接口「新增文档 1」引言、实施步骤片 1#1 | `containers.md:3`（`## 页签`）、`:82`（`## 模态与抽屉`）、`:84`（`### MuDialog`） |
| 6 | minor | `:30,31,33,52` — 4 处行号偏移 | 采纳 | 全部改为锚点定位，行号仅作参考：SKILL 安装章节、principles 导语/间距提示、containers 父组件示例、v3 新增原子类文本/背景行 | 实测：SKILL.md 安装章节 L58-63（L56 为 `---`、L64 为尾分隔）；principles 导语 L323、间距提示 L361；containers「父组件调用」围栏 L215-232；v3 rules 文本 L291、背景 L293（节 L279-295） |
| 7 | minor | `:30,43,51,61` — 日期与版本口径未闭合（4.3.0 vs package.json 4.3.1） | 采纳 | 三个 SKILL.md 改动行、共享决策 5、测试计划 4⑧、实施步骤片 1#7 / 片 2#3 / 片 3#2 | `package.json:3` = `4.3.1`；`mussel-ui/SKILL.md:4` date 2026-11-06、`:16` 当前 4.3.0；`mussel1to4/SKILL.md:4` 已 2026-11-08、`:15` 当前 4.3.0；`mussel3to4/SKILL.md:4` 已 2026-11-08、`:14` 当前 4.3.0 |
| 8 | minor | `:142` — 回滚对 untracked 目录无效 | 采纳 | 风险与回滚（重写回滚口径）、实施步骤「开工前」前置动作 | `git status --short -- skills/`：`?? skills/mussel1to4/`、`?? skills/mussel3to4/`；`git stash` 不带 `-u` 不处理未跟踪文件 |
| 9 | minor | `:116` — 阴影别名说明未排除 `.shadow-none` | 采纳 | 接口「§2.3 阴影表追加」 | `src/styles/box-shadow.scss:1-3`（`.shadow-none` 无 mu- 别名）；`:5-17`（其余 5 组生成别名） |
| 10 | minor | `:156` 测试计划 4④ — 计数口径重复 | 采纳 | 测试计划 4④ 改为逐行对照 `background.scss:11-33` | `background.scss:11-19`（5 功能色实色 + 5 translucent）、`:21-33`（13 基本色实色 + 13 translucent）；translucent 合计 18 = 5 + 13，不重复计数 |
| 11 | minor | `:58`、`:77-83` — MuCollapse 骨架 3 处格式/表述偏差 | 采纳 | 共享决策 2（去 v-model 单列表）、接口「新增文档 1」骨架（expanded 属性行、id 说明、header 覆盖说明） | `collapse.vue:8-18`（header 为 fallback 根，覆盖时 title/prepend/append/arrow 不渲染）、`:35-49`、`:53-54`（自动 id）、`:59-69`；`collapse-group.vue:16-25`（expanded Array 默认 `[]`）、`:54-68`（defaultExpand 用自动注册 id）；现状写法 `navigation.md:11`（collapsed「双向绑定」）、`containers.md:88`（visible「双向绑定」） |
| 12 | minor | `:44` 片 2② — 图标指针落点语义错位 | 采纳 | 改动清单片 2②、实施步骤片 2#2 | `data.md:110`（`### MuTable`）→ `:177`（`#### 列类型（type）`）→ `:201`（`icon` 列 blockquote 的「内置注册名 32 个」）；`basic.md:3` MuIcon 节无该清单 |

## 实质改动清单（6 项）

计数口径：按受影响的设计面归组，共 6 项；台账中标「是」的行分属这 6 项。

1. **基本色文本类口径三处同步**（评审 1）：片 1 新增 styles.md §1.1 用途句改写、§2.4 行标注 1-A 例外、principles.md 规范 1-A 标题/例外句；同步未解问题 2、风险 5、测试计划 4⑧、实施步骤。
2. **AC2 判据可执行化**（评审 2）：测试计划 2① 改为「注册名在 `### ` 标题行子串匹配」，允许组合标题，`MuTreeNode` 例外，明确只统计未注释导出（排除 `svg/`、`MuTreeNodes`）。
3. **v1 hover 映射修正纳入片 2**（评审 3）：片 2 改动条目由「L188」扩为「L188-189」，新增 `.mu-background-hover` → `.bg-gray-translucent`、`.mu-background-info` 保留无对应；新增测试判据 4⑦ 与步骤判据。
4. **版本号刷新纳入三片**（评审 7）：三个 SKILL.md 的「当前 `4.3.0`」→ `4.3.1`（`package.json:3`），mussel-ui frontmatter `date` 同步。
5. **实施前快照前置步骤**（评审 8）：实施步骤新增「开工前」把两新 skill 目录复制到仓库外临时目录；回滚口径重写（明确 `git checkout --` / `git stash` 对 untracked 无效，禁用 `git add -N` / `git stash -u`）。
6. **组件文档格式与 MuCollapse 骨架校正**（评审 11）：共享决策 2 去掉 `| v-model | 说明 |` 单列表；骨架补 `expanded` 属性行、修正 id 依赖表述、补 header 覆盖后 title/prepend/append 不渲染。

## 改动台账（直接改入 02-design.md）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质 |
|---|------|-------------|------------|------|
| 1 | §方案概述 1 | 仅「styles.md 补彩色背景/基本色文本类」 → 追加「同步 styles.md §1.1 与 principles 1-A 口径」 | 评审 1；`styles.md:11` 与新增 `.text-{基本色}` 互斥 | 是 |
| 2 | §方案概述 4 | 「仅更新核对日期」 → 「核对日期与当前版本号（按 package.json）」；矛盾行补 `:189` | 评审 3/7；`package.json:3`、v1 rules:189 | 是 |
| 3 | §方案概述 5 | 共享决策摘要补「版本号按 package.json（当前 4.3.1）」 | 评审 7 | 否 |
| 4 | §改动清单片 1 表头 | 「7 文件改，4 文件不动」 → 「7 文件改，5 文件不动」 | 评审 4；12 文件构成 | 否 |
| 5 | §改动清单片 1 SKILL 行 | 行号删除块 → 锚点；新增「当前 4.3.0 → 4.3.1」与 frontmatter date；行数 160→~156 | 评审 6/7；SKILL.md:4/16、L56-64 结构 | 是（版本项） |
| 6 | §改动清单片 1 principles 行 | 两处去重 → 两处去重 + ③ 规范 1-A 口径；行号保留为锚点参考 | 评审 1/6；`principles.md:22,323,361` | 是 |
| 7 | §改动清单片 1 styles 行 | 仅 §2.3/§2.4 补录 → 增加 §1.1 用途句改口径 | 评审 1；`styles.md:11` | 是 |
| 8 | §改动清单片 1 containers 行 | 「页签与 MuDialog 之间」 → 「`## 折叠面板` 置于 `## 模态与抽屉` 之前（顶级章节，沿用 `---` 分隔）」；父组件块改锚点 | 评审 5/6；`containers.md:3,82,84,215-232` | 否 |
| 9 | §改动清单片 1 form 行 | 行号区间 → 锚点；明确保留 ref 示例代码块与注意事项 | 评审 6；`form.md:247-257` 实际结构 | 否 |
| 10 | §改动清单片 2 SKILL 行 | 「仅核对日期」 → 日期 + 当前版本 4.3.1（frontmatter 已正确） | 评审 7；`mussel1to4/SKILL.md:4,15` | 是 |
| 11 | §改动清单片 2 rules 行 | ① 仅 L188 → L188-189（hover → `.bg-gray-translucent`）；② 指针落点写死「MuTable → 列类型（type）· icon 列」 | 评审 3/12；`rules.md:188-189`、`data.md:177,201` | 是 |
| 12 | §改动清单片 3 SKILL 行 | 日期 → 日期 + 版本 4.3.1（frontmatter 已正确） | 评审 7；`mussel3to4/SKILL.md:4,14` | 是 |
| 13 | §改动清单片 3 rules 行 | 行号区间 → 锚定「新增原子类」节 + 实测行 L291/L293 | 评审 6；`mussel3to4/references/rules.md:279-295` | 否 |
| 14 | §共享决策 2 | 删除「v-model 单列表」，改为双向绑定写属性表「说明」列 | 评审 11；`navigation.md:11`、`containers.md:88` | 是 |
| 15 | §共享决策 5 | 「核对日期统一」 → 日期 + frontmatter + 版本号按 package.json | 评审 7 | 是 |
| 16 | §接口 MuCollapse 骨架 | 改为规范属性/插槽/事件表；补 `expanded` 行；id 依赖收窄为「外部绑定 expanded 数组」；补 header 覆盖后 title/prepend/append 不渲染 | 评审 11；`collapse.vue:8-18,35-49,53-54`、`collapse-group.vue:25,54-68` | 是 |
| 17 | §接口 MuTag 骨架 | 破碎表格 → 规范表格；补「不含 gray」；`String\|Number` 转义 | 格式/精度修正；`common/props.js:9-12`、`colors.js:4-27` | 否 |
| 18 | §接口 styles 补录 | 新增 §1.1 用途句改写；阴影别名排除 `.shadow-none`；§2.4 行标注 1-A 例外；表格式说明校正 | 评审 1/9；`styles.md:11`、`box-shadow.scss:1-3` | 是 |
| 19 | §接口 新增 principles 1-A 小节 | 无 → 1-A 标题与例外句 | 评审 1；`principles.md:22` | 是 |
| 20 | §风险与回滚 | 回滚改为「已跟踪 checkout + 未跟踪临时快照/删除」；风险 1 补 §1.1 提示；风险 4 补 docs 分叉落点；新增风险 5（1-A 放宽被误用） | 评审 8；`git status` untracked、`git stash` 语义；`docs/quick-reference_styles.md:22` 同类表述 | 是 |
| 21 | §测试计划 2① | 「均有 `### Mu` 段」 → 子串匹配 + 组合标题 + MuTreeNode 例外 + 未注释出口径（含 `export const` 三件套） | 评审 2；`tree/index.js:2-3`、`index.js:37`、`layout/index.js:8,11,14`、`layout.md:23` 等 | 是 |
| 22 | §测试计划 3 | 双计数检查补 `grep "共 4 条"` | 与步骤 3 重写配套；`SKILL.md:54` | 否 |
| 23 | §测试计划 4 | ④ 计数口径改逐行对照；新增 ⑦（v1 hover 映射）、⑧（1-A/日期/版本口径一致） | 评审 10/3/1/7；`background.scss:11-33`、`rules.md:188-189`、`package.json:3` | 是 |
| 24 | §实施步骤 | 新增「开工前」快照；各片判据补版本/口径/指针/背景行判据 | 评审 8/1/3/7/12 | 是 |
| 25 | §未解问题 2 | 措辞改为「三处口径同步」，补 1-A；证据行号校正 `colors.js:81-83` | 评审 1；`colors.js:81-83` | 否 |
| 26 | §未解问题 5 | `background.scss:27` → `:26-27`；补 §1.1「不可用」提示的清理条件 | 事实精度；`background.scss:26-27` | 否 |
| 27 | §遵循约定 | 原子类表格式引用由虚指 §1.5 改为 §2.3/§2.4 实际列型 | 交叉引用修正 | 否 |

## 检查项结论

1. **覆盖**：AC1-AC4 均有设计归属与测试手段；AC2 判据经改后可执行（评审 2）；AC4 新增 7/8 两条抽查；无测试文件新增需求。
2. **事实一致**：本轮逐条回源码复核——`styles.md:11`、`principles.md:22`、`typography.scss:50-57`、`background.scss:11-33`、`box-shadow.scss:1-3`、`tag.vue:15-25`、`collapse.vue:8-18,35-49,53-54`、`collapse-group.vue:16-25,54-68`、`components/index.js:18-61`、`tree/index.js:2-3`、`package.json:3`、`colors.js:81-83`；设计内新增断言均与之一致。
3. **约定一致**：组件文档格式恢复「属性行 + 双向绑定」现状写法（`navigation.md:11`、`containers.md:88`）；未引入新约定；无词表/ADR 冲突。
4. **影响面**：三片白名单仍两两不相交（片 1 = 7 文件、片 2 = 2、片 3 = 2）；跨片引用与指针落点已定死；无绕过既有封装。
5. **可实施**：步骤有序；新增「开工前快照」为纯前置动作，无循环依赖；三片可并发。
6. **风险与回滚**：untracked 回滚缺口已补（快照 + 删除口径）；新增风险 5；无单向门判断维持。
7. **范围**：仍限 `skills/mussel-ui/**`、`skills/mussel1to4/**`、`skills/mussel3to4/**`；版本号/日期属同一批文件的准确性修正，未扩范围。
8. **切片**：片 1 / 片 2 / 片 3 文件集合互斥；每条 AC 归属明确；共享文件（无）已排除；可并发前提未被本轮修订破坏。

## 未解决异议（累计）

无（12 条全部采纳，无争议项）。

## 一致性自检

- 改动清单 ↔ 接口 ↔ 测试计划 ↔ 实施步骤：styles §1.1 / principles 1-A（片 1#3/#6、测试 4⑧）；v1 L189（片 2#1、测试 4⑦）；版本 4.3.1（三片 SKILL 行、共享决策 5、测试 4⑧）；MuCollapse 骨架（接口、片 1#1、共享决策 2）。
- 白名单：片 1 = `SKILL.md`、`principles.md`、`styles.md`、`containers.md`、`navigation.md`、`data.md`、`form.md`；片 2 = `mussel1to4/SKILL.md`、`mussel1to4/references/rules.md`；片 3 = `mussel3to4/SKILL.md`、`mussel3to4/references/rules.md`；两两无交集。
- `decisions.md` 三条未被动摇；未改源码；未写其他设计文件。
