# mussel-ui Skill 修订方案

> 用途：agent 执行 `skills/mussel-ui/` 文档修订的任务清单。每项含「原文/现状 → 修复 → 验证」。
> 对象：`skills/mussel-ui/`，17 个文件 5852 行。
> 版本基准：`mussel` 4.1.5（`package.json`）。本次核对日期 2026-10-13。
> 核对方式：`references/` 全部 9 个组件与样式文档 + `install.md` 对照 `src/`——注册源 `src/components/index.js`（63 个 `Mu*` 全局组件 + `v-mu-scrollbar` / `v-mu-tooltip` 2 个指令）、`src/index.js`（install 导出）、`$mussel.messageBox` API。
> 约束：只改 `skills/mussel-ui/` 下文件；不动 `src/`；不合并不新建文件（P3-1 重命名除外）。
> 执行前置：本方案获批后再改文件（AGENTS.md 文档规则）。改动完成需同步的三处副本见文末。

## 核对基线

已逐项对照 `src/`、当前无需再核：`components/*.md` 8 个文件的组件覆盖（63 个注册组件无遗漏、无虚构）、`install.md` 的 options/`$mussel`/`setupColors`、`principles.md` 的 5 条核心规范与自检清单、`data.md` 的 `cascaded-check` 未生效标注、`--mu-tree_node-*` 下划线命名标注。

仅以下文件有待改项，其余只需做 P2/P3 的结构与语言调整：

| 文件 | 待改 |
|------|------|
| `references/components/navigation.md` | P1-1 |
| `references/styles.md` | P1-2、P3-4 |
| `references/upgrade/rules.md` | P1-3、P1-4、P1-5、P2-3、P2-4 |
| `SKILL.md` | P1-6、P2-1、P2-2、P2-5、P3-4 |

---

## P1 正确性（立即，逐条可独立完成）

### P1-1 `references/components/navigation.md:25` header 插槽作用域参数失实

- 现状：`| header | 头部区域，作用域参数 collapsed |`
- 事实：`src/components/menu/side-menu.vue:10` 为 `<slot v-if="!isCollapsed" name="header" />`，不传任何作用域参数；仅 footer（:40）传 `:collapsed`
- 修复：删除 header 行的作用域参数，保留「头部区域」
- 验证：`grep -n 'name="header"' src/components/menu/side-menu.vue` 确认无 `:collapsed`

### P1-2 `references/styles.md:277` `.flex-0` 取值失实

- 现状：`| .flex-0 | flex: 0 |`
- 事实：`src/styles/layout.scss:93-97` 用 `@each $v in (0,1,...,8)` 生成 `flex: #{$v} #{$v} 0`，`.flex-0` 实为 `flex: 0 0 0`
- 修复：`.flex-0` 行改为 `flex: 0 0 0`，与 `.flex-N` 行的 `flex: N N 0` 表述统一
- 验证：对照 layout.scss 的 `@each` 循环体

### P1-3 `references/upgrade/rules.md:146` 导出清单漏 `icons`

- 现状：`export { install, installIcons, EventInterceptor, colors }`
- 事实：`src/index.js:61-66` 为 `export * from './env'` / `export { EventInterceptor }` / `export { colors }` / `export { icons }` / `export { install, installIcons }`，`env` 提供 `version` / `isDev`
- 修复：补 `icons`；`env` 一并列出，或改为一行指针「完整导出见 `references/install.md`」避免二次维护
- 验证：逐项对照 `src/index.js` 导出语句

### P1-4 `references/upgrade/rules.md:1033-1055` MuTabButton 迁移表缺「不再全局注册」

- 现状：`#### MuTabButton` 表仅列 `title` 已移除，读起来像组件仍可全局使用
- 事实：V4 `src/components/tabs/index.js` 只注册 `MuTabs` / `MuTabBar` / `MuTabPanel`；`tab-button.vue` 是 `MuTabBar` 的内部组件（`tab-bar.vue:40` 局部 import）。Mussel 3 曾全局注册（`mussel3/src/components/index.js:138` `app.component('mu-tab-button', TabButton)`）
- 修复：在 5.5 的 MuTabButton 小节补一行：`<mu-tab-button>` 在 V4 不再全局注册（内部组件），直接使用该标签的代码需改用 `tab-buttons` 数据或 `MuTabBar`
- 验证：`grep -n 'MuTabButton' src/components/tabs/index.js`（应无命中）

### P1-5 `references/upgrade/rules.md:308` 属性选择器清单与 `upgrade/process.md:70` 不同步

- 现状：rules.md:308 以「…、`reverse` 等属性选择器均已失效」结尾；相对 process.md:70 的 grep 线索清单缺 `align-self`、`collapsible`、`padding-x/y`、`margin-x/y`、`margin-*`、`padding-*`
- 修复：按本文件 SYNC-RULES，以 `process.md:70` 为基准补齐 rules.md:308 清单并去掉「等」；两处清单须逐项一致
- 验证：两处清单逐项 diff
- 注：原方案判定「清单实际已列全，删『等』即可」有误——清单确有缺项，须先补齐

### P1-6 `SKILL.md:37` 与 `references/upgrade/process.md:35` 判定规则矛盾

- 现状：SKILL.md:37「判不准时一律走默认路径，或先询问用户」；process.md:35「若不确定是否应进入，先询问用户」
- 修复：统一为「不确定是否属升级任务时，先询问用户」，两条路径判定一致；同时按 P3-4 把「判不准」改为「不确定」
- 验证：两处措辞一致，且都指向「询问用户」而非二选一

---

## P2 结构（减少每轮触发的上下文占用；消除先违反规范再返工）

### P2-1 SKILL.md 与 install.md 去重

- SKILL.md:79-94「安装与初始化」节与 `install.md` 重复。删除该节正文，保留 2-3 行摘要（`install(app, options)` 挂载内容 + 指向 `install.md`）
- colors 合法 key 长串（100+ 字符）在 `SKILL.md:89`、`install.md:31`、`install.md:102` 三处逐字重复。收敛到 `install.md:31` 一处；SKILL.md 与 `install.md:102` 的 setupColors 表改为「key 同 `options.colors`」
- 验证：`grep -rn 'grape' skills/mussel-ui/` 只应在 `install.md` 命中一次

### P2-2 principles.md 前移（消除返工路径）

- 现状：`SKILL.md:73-75` 把 `principles.md` 放在步骤 3 自检读，步骤 2（生成）不引用；按字面执行会先写出 `z-index: 999` 再返工
- 修复：步骤 2 开头加一句「生成任何代码前先读 `principles.md`『核心规范』5 条（第 2–5 条为硬性禁止）」；Good/Bad 示例与快速自检清单仍留在步骤 3
- 验证：步骤 2 文本含 `principles.md` 引用，步骤 3 表述不变

### P2-3 `references/upgrade/rules.md:823-856` 与 `857-893` 合并

- 现状：5.1 内「Body 内容迁移」与「默认 slot 内边距丢失」两节都以 `body-class` / `body-style` 为核心方案，示例重复；5.1 全节 634-908 共约 274 行
- 修复：合并为一节，方案 A/B/C/D 只保留一轮。合并须保留两个独立信息点，不得只留其一：
  1. 用 `body-*` 替代包裹 div 的迁移原则（DOM 层级）
  2. M3 `.mu-dialog_center > *` 自动 padding、M4 `.mu-dialog__body` 无 padding 的差异与检测方法
- 验证：合并后仍能回答「为什么丢 padding」与「如何避免多余包裹层」

### P2-4 v4 侧事实单源

- 现状：dialog body 无 padding、`dismissible` 语义、buttons 格式、`maskEl`/`dialogEl` 在 `components/containers.md`、`upgrade/rules.md` 5.1、`upgrade-v1/rules.md` 6.5 三处各写一遍；SYNC-RULES 只约束 process↔rules 对内同步，未覆盖跨目录 v4 事实
- 修复：两套 rules 中 v4 用法压为「一行事实 + 指向 `references/components/containers.md`」；`upgrade/` 补齐 `upgrade-v1/` 已采用的指针写法。SYNC-RULES 增补一条：v4 侧事实以 `references/components/*`、`references/styles.md` 为准，rules 只保留迁移所需的一行速查
- 验证：两套 rules 内不再出现成段的 v4 用法展开

### P2-5 版本基准单源

- 现状：`SKILL.md:14` 与 `references/upgrade-v1/overview.md:8` 各自声明版本/核对日期
- 修复：`SKILL.md` 为唯一基准，`overview.md:8` 改为引用；执行本方案时把两处日期统一为执行日（现为 2026-10-12，`package.json` 版本为 4.1.5）
- 验证：`grep -rn '核对日期' skills/mussel-ui/` 只在一处出现字面日期

---

## P3 低优先级（各项独立）

1. `references/upgrade/` 改名 `upgrade-v3/`（`git mv`）；同步 `SKILL.md` 全部引用、`upgrade/rules.md:15-38` 目录锚点、`upgrade/process.md` 内的相对路径
2. `references/components/form.md:355/382/407` 三个 picker（Date / DateRange / Time）各自重复一份「(其他) 透传 `MuInput` 属性/事件」表，提取为共享说明块。**注：本项只涉 3 个组件**——Color 无该表（`form.md:436` 行是 Color 的 `disabled/readonly` 说明，原方案记为 4 个有误）
3. 标题层级统一：组件一律 `###`，分组一律 `##`。待改：`containers.md:80`（`## 模态与抽屉` 分组与 `###` 组件混排）、`data.md:110`（`## MuTable` 应为 `###`）、**`form.md` 全文组件用 `##`**（其余组件文件用 `###`，原方案遗漏此项）。`styles.md` 的 `## 1 -` 编号体例保持现状
4. 语言细节：
   - 同义统一：`install.md` / `containers.md` 的「根元素 / 应用根元素 / 全局根容器」统一为「根元素（`$mussel.rootElement`）」；`styles.md` §1.6/§1.12 的「弹出层、浮出面板」「全局浮层」统一为「弹出层」（§1.12 保留「浮层」但首次出现处对齐）
   - `SKILL.md:30` 「`theme:` 等 V3 模式」→ 显式列全（`mu-editor` / `mu-box` / `theme:` / `mu-tree-view`）；`upgrade/process.md:30` 同法处理；`upgrade/rules.md:308` 归 P1-5
   - `SKILL.md:23` 「不要加载 `references/upgrade/` 与 `references/upgrade-v1/` 下任何文件」→「下的文件」
   - `upgrade-v1/rules.md:378/508/561`「顺手改写 / 顺手启用 / 顺手用上」→「一并改写 / 同时启用 / 一并使用」
   - `styles.md:523/527`「清晰」「淡雅」→「高对比」「低对比」；`styles.md:113`「整体柔和、避免喧宾夺主」→「低对比度，不与内容争夺注意力」
   - 拆长句：`SKILL.md:51-54` 拆为「按需查阅以下参考文件，不要凭记忆猜测属性名或样式值。组件 API 与样式 Token 常一起需要，无需区分先后」；`containers.md:245` 的 drawer `resizable` 说明按「约束」与「丢弃调整值」拆两句（表格内可用分号维持）
5. `dropdown-items` 数据结构位置：维持现状不改。它已被 `form.md:240` 以「见 `navigation.md`『dropdown-items 数据结构』」互链引用，单源在 `navigation.md:198` 即可
6. `references/components/basic.md` 起步于 `###`，无 `##` 分组节——与 P3-3 的「组件 `###`」一致，无需改

保留不改：`navigation.md:12` `active-item` 匹配规则长句（已用分号分层）、升级映射表内 `A → B` 箭头（映射语义明确）。

---

## 执行后需同步的副本

该项目组件/样式文档共三处互为副本，本方案只涉及第一处；若改动触及组件 API 或公共样式，须同步另两处：

- `skills/mussel-ui/references/`（本方案对象）
- `docs/quick-reference_*.md`
- `docs-site/`（`components/*.md`、`guide/styles*.md`）

本方案 P1-2（`.flex-0` 取值）与 P3-4（`text-*` 说明措辞）属公共样式描述，须同步后两处。

## 优先级与收益

- P1 六项：十分钟级，纯事实订正
- P2-1 / P2-2：收益最高——直接减少每次触发的上下文占用，并消除「先违反规范再返工」路径
- P2-3 / P2-4 / P2-5、P3：各自独立，可按需分批
