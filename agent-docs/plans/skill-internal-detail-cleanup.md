# mussel-ui Skill 内部实现描述清理方案

| 项目 | 内容 |
|---|---|
| 状态 | 待执行 |
| 范围 | `skills/mussel-ui/`（SKILL.md、references/ 下 8 个文件）+ `docs-site/components/tree.md` 一句同步 |
| 依据 | 2026-09-30 对 skill 全部 13 个文件的内部实现描述审查；`MuTreeNode` 定性经源码核实修正（公开导出 + 全局注册，依赖 `inject('tree')` 上下文，不能脱离 `MuTree` 使用） |
| 不在范围 | 第二类内容（见 §4，以实现机制承载外部行为，保留不动）；组件 API/用法本身不变 |

> 行号基于 2026-09-30 工作区状态（`layout.md` 等含未提交改动），执行时以引用的原文定位为准。

---

## 1. 修订原则

- **删**：纯内部实现细节（内部执行顺序、源码常量名、内部复用关系、实现机制且结论已另行给出），删除后不损失任何使用信息。
- **改写**：一句话里实现细节与用法信息混在一起时，保留用法信息、去掉实现措辞。
- **不动**：以机制措辞描述外部可观察行为或防误用约束的内容（§4 清单）。

## 2. 任务清单（P1，共 12 处）

### 2.1 install.md（2 处）

**#1 删除「内部执行顺序」NOTE 块**（install.md:37-39）

原文（整块删除）：

> \> [!NOTE]
> \>
> \> `install` 内部执行顺序：注入 `$mussel` 上下文 → 设置语言（`setupLocale`）→ 设置根元素 class（`mu-root` + `mu-dark`，由 `dark` 决定）→ 设置主题色（`setupColors`）→ 注册图标（`installIcons`）→ 注册全部组件 → 注册滚动指令（`v-mu-scrollbar`）。

**#2 删除内部常量名**（install.md:74，主题色一节首句）

| | 内容 |
|---|---|
| 改前 | `install` 时通过 `options.colors` 配置主题色，内部将自定义色合并到内置色板（`BASE_COLORS` + `SPEC_COLORS`），自动派生调色板与灰阶，并写入根元素的 `--mu-*` CSS 变量。 |
| 改后 | `install` 时通过 `options.colors` 配置主题色，自定义色会合并到内置色板，自动派生调色板与灰阶，并写入根元素的 `--mu-*` CSS 变量。 |

### 2.2 SKILL.md（1 处）

**#3 查阅点列表去「内部执行顺序」**（SKILL.md:80，#1 的连带）

| | 内容 |
|---|---|
| 改前 | 完整 API（`install` 签名、`options` 全字段、内部执行顺序、全局 `$mussel` 上下文、`installIcons`）查阅 `references/install.md`。 |
| 改后 | 完整 API（`install` 签名、`options` 全字段、全局 `$mussel` 上下文、`installIcons`）查阅 `references/install.md`。 |

> 速查表 `<mu-tree>` + `<mu-tree-node>` 行（SKILL.md:155）**保持不变**——`MuTreeNode` 是公开导出组件，速查表与 `<mu-tabs>` + `<mu-tab-panel>` 同为配套组件写法，原审查报告中的「矛盾」结论不成立。

### 2.3 buttons.md（1 处）

**#4 删「源码无默认值」**（buttons.md:9，MuButton `size` 行）

| | 内容 |
|---|---|
| 改前 | `small` \| `normal` \| `large`；未设置时等效 `normal`（源码无默认值），置于 `MuToolbar` 内时继承 `tool-size` |
| 改后 | `small` \| `normal` \| `large`；未设置时等效 `normal`，置于 `MuToolbar` 内时继承 `tool-size` |

### 2.4 layout.md（1 处）

**#5 删库内复用关系说明**（layout.md:299，MuBar 一节）

| | 内容 |
|---|---|
| 改前 | 固定高 40px 的条形容器，与 `MuToolbar` 共享基础条形样式（flex + 垂直居中 + gap），无 props，仅默认插槽。`MuDateInput` 下拉面板的工具栏即基于它。 |
| 改后 | 固定高 40px 的条形容器，与 `MuToolbar` 共享基础条形样式（flex + 垂直居中 + gap），无 props，仅默认插槽。 |

### 2.5 form.md（2 处）

**#6 删 MuOption 注册机制 bullet**（form.md:304）

删除整条：「组件在 `mounted` 时向父级 select 注册自身、`unmounted` 时注销，因此必须作为上述 select 组件的子节点使用。」

理由：使用约束（必须置于 select 插槽内）已在同节首段（form.md:290）明确给出，机制解释冗余。其余两条 bullet（多选显示 check 图标、`options` 模式自动生成选项）保留。

**#7 删「由底层 combo 组件透传」**（form.md:442，MuColorInput 事件表 `dropdown:show` / `dropdown:hide` 行）

| | 内容 |
|---|---|
| 改前 | 下拉面板展开 / 收起（由底层 combo 组件透传） |
| 改后 | 下拉面板展开 / 收起 |

### 2.6 navigation.md（1 处）

**#8 删「（非 Mixin）」**（navigation.md:74，MuDropdown 首句）

| | 内容 |
|---|---|
| 改前 | 下拉能力包裹组件（非 Mixin），为触发器元素附加下拉，属性均以 `dropdown-` 为前缀。 |
| 改后 | 下拉能力包裹组件，为触发器元素附加下拉，属性均以 `dropdown-` 为前缀。 |

### 2.7 basic.md（1 处）

**#9 删「无 `defineProps`」**（basic.md:40，MuBadge 首段）

| | 内容 |
|---|---|
| 改前 | 徽章，用于状态标签或角标。无 `defineProps`，颜色变体通过 HTML attribute（非 prop）控制，直接写在标签上即可。 |
| 改后 | 徽章，用于状态标签或角标。颜色变体通过 HTML attribute（非 prop）控制，直接写在标签上即可。 |

「attribute（非 prop）、直接写在标签上」是关键用法信息，保留。

### 2.8 data.md（1 处）

**#10 修正 `MuTreeNode` 定性**（data.md:57）

源码事实：`MuTreeNode` 经 `tree/index.js` 公开导出并全局注册（`<mu-tree-node>` 标签可用），但 `tree-node.vue` 依赖 `inject('tree')` 上下文，脱离 `MuTree` 使用会报错——是**公开组件 + 上下文约束**，不是内部组件。

| | 内容 |
|---|---|
| 改前 | 内部节点渲染组件 `MuTreeNode` 虽有导出，但强依赖 MuTree 上下文（脱离使用会报错），请勿单独使用；自定义节点一律通过 MuTree 的插槽实现。 |
| 改后 | `MuTreeNode` 为公开导出组件，但不能脱离 `MuTree` 单独使用（缺少 tree 上下文会报错）；自定义节点内容一律通过 `MuTree` 的插槽实现。 |

**同步**：`docs-site/components/tree.md:258` 存在同句，随本条一并改写（`docs/quick-reference_*.md` 已核实无此句，无需同步）。

### 2.9 upgrade/rules.md（2 处）

**#11 修正 `MuTreeNode` 措辞**（rules.md:1173，5.7 实际变更表）

| | 内容 |
|---|---|
| 改前 | \| 内部子组件 \| 同时注册 `<mu-tree-node>`、`<mu-tree-nodes>`（均为 `<mu-tree>` 的内部渲染组件） \| 仅 `<mu-tree-node>` 保留注册；`<mu-tree-nodes>` 不再导出/注册 \| 用户应通过 `<mu-tree :data="...">` 驱动，不应直接使用这两个内部组件。若 V3 代码中直接写了 `<mu-tree-nodes>`，需改为由 `data` 数据驱动 \| |
| 改后 | \| 子组件注册 \| 同时注册 `<mu-tree-node>`、`<mu-tree-nodes>` \| 仅 `<mu-tree-node>` 保留注册（公开组件，不能脱离 `<mu-tree>` 使用）；`<mu-tree-nodes>` 不再导出/注册 \| 节点由 `<mu-tree :data="...">` 驱动。若 V3 代码中直接写了 `<mu-tree-nodes>`，需改为由 `data` 数据驱动 \| |

**#12 简化 tree 全局选项行**（rules.md:1174，5.7 实际变更表）

| | 内容 |
|---|---|
| 改前 | \| 全局 tree 选项 \| `install(app, { tree: {...} })`，组件内读 `inject('$mussel').globalTreeOptions` \| `install(app, { tree: {...} })`，组件内读 `inject('$mussel').options.tree` \| **配置方式不变**，仅组件内部读取路径调整，使用方无感知 \| |
| 改后 | \| 全局 tree 选项 \| `install(app, { tree: {...} })` \| 不变 \| 配置方式不变，无需处理 \| |

「使用方无感知」的变化不该出现在迁移文档里，只保留「配置方式不变、无需处理」的结论，去掉内部读取路径。

## 3. 决策点（执行前需拍板）

| # | 位置 | 内容 | 建议 |
|---|---|---|---|
| D1 | styles.md:577-582 | `.text-ellipsis` 的「实现方式」CSS 块（`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`，常规认知） | 删除；同节的 `.line-clamp` 实现块（styles.md:592-599）**必须保留**——其中 `white-space: pre-line` 是影响换行行为的副作用 |
| D2 | layout.md:9 | MuFlexBox 首句「方向由子类通过组件选项 `direction` 静态指定（`'row'` / `'col'`），不再作为可传 prop」——「子类组件选项」是内部实现方式，但「`direction` 不可传」有防误用作用 | 改写为：「方向由组件自身固定（HBox=`row` / VBox=`col`），`direction` 不是可传 prop」 |

## 4. 不改清单（防止执行时误删）

以下内容看似内部实现，但承载外部可观察行为、可用功能或防误用约束，**保留原样**：

- layout.md:9 / :105 — 内部组件防误用标注（MuFlexBox、Splitter「不可直接使用」）；Splitter 一节实为 `splitter-size` / `splitter-shape` / `splitter-collapse-handle` 公开 props 的取值说明。
- layout.md:288-293 — MuToolbar `provide` 注入描述：toolbar 内按钮/input 自动继承尺寸与风格、button-group 例外，均为外部可观察行为。
- data.md:84 — MuTags 将 `dropdown-*` attrs 透传给内部 `MuDropdown`：这是用户定制溢出面板的唯一途径。
- navigation.md:40 — MuDropdownButton `$attrs` 透传：解释可直接传 MuButton 属性。
- form.md:170 — `input-style`「attribute（非 prop）、经属性选择器生效」：决定使用方式。
- containers.md:131-132 — `maskEl` / `dialogEl` 及 `.mu-modal-mask` / `.mu-dialog`：公开 ref API 与样式覆盖钩子。
- containers.md:269-282 — Dialog/Drawer 的 Teleport 挂载与遮罩定位行为（`container` 用法依据）。
- styles.md:592-599 — `.line-clamp` 实现块（`white-space: pre-line` 副作用）。
- upgrade/rules.md:699-798 / :1076 / :1111 / :1259 — Dialog DOM 结构变更、V3 `$attrs.onTabchange` 捕获机制、`defineModel` local 副本行为差异、V3 `raw` 字段自动注入：迁移识别与改写必需。

## 5. 执行注意事项

1. 副本同步（已核实）：`docs-site/components/tree.md:258` 与 data.md:57 同句，随 #10 一并改写；`docs/quick-reference_*.md` 无 tree-node 定性表述与「内部执行顺序」内容，无需同步。本方案不改组件 API/用法，不触发其他同步义务。
2. 全部为删句/改句操作，改完后通读各文件对应小节，确认上下文语句连贯。
3. 验证方式：`grep -rn "源码无默认值\|非 Mixin\|defineProps\|BASE_COLORS\|SPEC_COLORS\|globalTreeOptions\|底层 combo\|内部节点渲染组件" skills/mussel-ui/ docs-site/components/tree.md` 应无命中（`defineProps` 仅原 basic.md:40 一处）。
