# SideMenu 组件设计方案

| 项目 | 内容 |
|---|---|
| 状态 | **已实施**（2026-09-30），组件 + demo + Playwright 验证完成；文档三处同步待确认 |
| 范围 | 新增垂直侧边导航组件 `MuSideMenu`：数据驱动、多级子菜单、激活态、手风琴、折叠为图标条 + 右侧弹出子菜单面板 |
| 不在范围 | 水平菜单、搜索/收藏（WebFrame 业务能力）、badge/extra、multiple 多选、键盘导航、响应式断点自动折叠、hover 整栏浮出（floating），见 §9 |
| 参考实现 | WebFrame V4（js-web-frame-v3 `src/page/menu/`）侧边菜单；Element Plus / Ant Design Vue / Naive UI / Arco Design Vue / Vuetify / Quasar 对比调研 |

---

## 1. 背景与需求来源

- 库内现状：V4 无任何导航菜单组件（`src/components/` 下无 menu 类组件），tabs/tree 均非导航场景。
- 直接需求方：WebFrame V4 的侧边菜单（`McPage` 布局的左侧导航）目前为应用层私有实现（`src/page/menu/side-menu.vue` 约 500 行 + `menu.scss` 约 700 行），无暗色模式、样式写死 `#fff`/`#fafafa`/`#333`，无法被其他业务复用。将其通用部分下沉为 Mussel 组件是本组件的主要驱动。
- 命名即范围：组件只做**垂直侧边菜单**（side-menu），水平菜单（顶栏导航）是另一种形态，未来需要时另行设计，本方案不预留 `mode` prop。

## 2. 调研结论

### 2.1 WebFrame V4 侧边菜单（业务真实场景）

实现文件：`side-menu.vue`（容器/数据加载/折叠）、`menu-group.vue`（可展开组）、`menu-item.vue`（叶子项）、`menu-icon-group.vue`（折叠态图标条 + 弹出定位）、`sub-menu.vue`（折叠态浮层）。

功能清单：

- **数据**：后端平铺列表（`id`/`parentId`/`aliasName`/`sortNum`/`url`/`moduleId`/`icon`/`active`），前端按 `parentId` 组装树、按 `sortNum` 排序。
- **展开**：点击组头切换，**非手风琴**（可同时展开多个组）；展开组集合持久化 localStorage（TTL 30 分钟）。
- **激活**：`moduleId === context.moduleId` 或后端 `active` 标记；组激活 = 任一后代激活；激活项父链自动展开，挂载 100ms 后 `scrollIntoViewIfNeeded` 滚入视区。
- **折叠**：展开 240px ↔ 图标条 52px 两种形态；折叠开关（pin 按钮）在侧栏自身头部；折叠态持久化 localStorage。
- **折叠态交互**：hover 图标条目弹出 fixed 定位子菜单，按视口剩余高度自动向上/向下展开、限高滚动，hover 离开 300ms 延迟关闭，同时只保留一个弹出面板。
- **跳转**：MPA 架构，`window.location.href` / `window.open`（Ctrl/Cmd+点击新标签），不走 vue-router。
- **业务附加**：搜索过滤（匹配叶子、显示父级路径）、收藏星标（本地即时 + debounce 700ms 同步远端）。
- **动画**：宽度 `0.1s`、组展开 `grid-template-rows 0fr→1fr 0.1s`、箭头弹性旋转、弹层 opacity 淡入。

### 2.2 主流组件库对比要点

| 维度 | 共识（Element Plus / antd / Naive / Arco） | 本方案采纳 |
|---|---|---|
| 声明方式 | 子组件嵌套（EP/Arco/antd）与数据驱动（Naive `options`、antd 4 `items`）并存，新库趋势数据驱动为主 | 数据驱动（与库内 MuTree 的 `data` + `props` 字段映射风格一致） |
| 展开状态 | `default-expanded-keys` + `v-model:expanded-keys` + `accordion`（Naive/Arco 标准形态；EP 仅 default + 方法属旧设计） | 采纳三件套 |
| 选中状态 | `v-model` 单值（Naive）或 keys 数组（Arco/antd，配 `multiple`） | 单值 `v-model:active-item`，不做多选 |
| 折叠 | `collapsed`（建议 v-model）+ 折叠后子菜单自动切 popup + 折叠态标题 tooltip；折叠宽度各家均为配置项 | 采纳；展开宽度走 `width` prop（对齐 MuDrawer 与 WebFrame 原实现），折叠宽度走 CSS 变量，见 §4.2 / §6 |
| 路由集成 | EP `router` 开关（隐式）或 Vuetify/Quasar item 级 `to`（显式）；Naive/Arco/antd 均不内置 | **不集成**：库零 vue-router 依赖，`select` 事件交业务跳转 |
| disabled | item 级 + 菜单根级 | 采纳两级 |
| 弹层微调 | EP `popper-offset`/`show-timeout`、Arco `trigger-props`、Naive `dropdown-props` | V1 用 CSS 变量控制偏移；延时固定 300ms（对齐 WebFrame） |
| 字段定制 | Naive `key-field`/`label-field`/`children-field` | 采纳等价物：沿用 MuTree 的 `props` 字段映射对象（库内一致性优先） |
| 值得借鉴的亮点 | Arco `auto-open-selected`（激活项父链自动展开）、Arco `auto-scroll-into-view`、Arco `show-collapse-button`、Naive `showOption(key)` 方法 | 采纳前三个（`auto-expand-active` 默认开、`scroll-into-view` 默认开、`collapse-button` 把手——Arco 原名即 `show-collapse-button`，不沿用 splitter 已占用的 `collapse-handle`，见 §4.2） |

Vuetify/Quasar 的 drawer（`rail`/`mini`/`expandOnHover`/遮罩/触滑）是**布局容器**职责，与菜单解耦——Mussel 已有 `mu-drawer`/`mu-split-box` 承载布局侧栏，SideMenu 定位为放入其中的内容组件，不管理布局占位。

## 3. 与 MuTree 的关系（不复用，理由）

MuTree 是最接近的库内组件，但状态模型差异大，**不基于其扩展，独立实现**（渲染结构参考 `tree-node.vue` 的递归 + provide/inject 模式）：

| | MuTree | MuSideMenu |
|---|---|---|
| 展开状态 | 有 `key` 时按 key 值建普通对象 map、无 keyProp 时才退化为节点引用 WeakMap，另有 expandLevel 批量展开；**非受控、无手风琴** | **keys 集合**，受控（`v-model:expanded-keys`）+ 非受控 + 手风琴 + 可持久化 |
| 选中 | `activeNode` prop，单选高亮 | `v-model:active-item` 双向 + `select` 事件 + keyPath |
| 特有能力 | checkbox / 级联勾选 / 节点按钮 / 懒加载（nodeExpand） | 折叠形态 / 弹出子菜单 / 激活父链自动展开 + 滚入视区 |
| 语义 | 文件树（folder/leaf 图标体系） | 导航（激活态、路由配合、组头可整体点击） |

强行复用会把两种状态模型糅在一起互相污染；展开逻辑本方案自写（约 40 行，见 §7），成本远低于改造 MuTree 且保持其 API 稳定。

## 4. API 设计

### 4.1 基本用法

```html
<!-- 最简：数据驱动 + 路由变化时更新 v-model:active-item -->
<mu-side-menu
  v-model:active-item="activeItem"
  :data="menus"
  @select="onSelect"
/>

<!-- 常见：受控展开 + 手风琴 + 折叠把手 -->
<mu-side-menu
  v-model:active-item="activeItem"
  v-model:expanded-keys="expandedKeys"
  v-model:collapsed="collapsed"
  accordion
  collapse-button
  :data="menus"
  @select="onSelect"
>
  <template #header="{ collapsed }">
    <img v-if="!collapsed" src="logo.png">
    <img v-else src="logo-mini.png">
  </template>
</mu-side-menu>
```

```js
const menus = [
  {
    id: 'dashboard',
    icon: 'grid',
    label: '首页',
    childNodes: [
      { id: 'workbench', icon: 'file', label: '工作台' },
      { id: 'report', icon: 'folder', label: '报表', disabled: true }
    ]
  },
  { id: 'settings', icon: 'list', label: '设置' }
]
```

`icon` 取内置图标集合的 camelCase 名（`grid`/`file`/`folder`/`list`/`search` 等，`Object.keys(icons)` 可列出全部），业务图标须先经 `installIcons`（或 `install` 的 `icons` 选项）注册，未注册的名字会触发 `[MUSSEL:ICON]` 警告。

跳转由业务处理：

```js
function onSelect (item, keyPath) {
  router.push(item.to)          // SPA
  // 或 window.location.href = item.url   // MPA（WebFrame 场景）
}
```

### 4.2 Props

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `data` | Array | — | 菜单数据，树形结构 |
| `props` | Object | — | 字段映射，默认 `{ key: 'id', icon: 'icon', label: 'label', title: 'title', disabled: 'disabled', childNodes: 'childNodes' }`（结构同 MuTree `DEFAULT_DATA_PROPS`，按需取子集） |
| `v-model:active-item` | String \| Number | — | 激活叶子项 key（对齐 MuTabs 的 `v-model:active-tab` 命名）。**只接受叶子节点 key，其余静默忽略**——组 key、不存在的 key 均无高亮、无警告。未绑定时内部持有激活状态（`defineModel` 本地回退，与 MuTabs/表单组件一致），点击正常高亮并触发 `select` |
| `v-model:expanded-keys` | Array | — | 展开组 key 集合（受控） |
| `default-expanded-keys` | Array | — | 初始展开组（非受控，受控时忽略） |
| `accordion` | Boolean | `false` | 手风琴：同层同时只展开一个组 |
| `auto-expand-active` | Boolean | `true` | 激活项（activeItem）不在可视树内时自动展开其父链；激活 key 变化与 `data` 到达/刷新均触发（异步菜单数据下同样生效，见 §5.2）。对齐 WebFrame 刷新后定位当前页的行为 |
| `scroll-into-view` | Boolean | `true` | 激活项变化或 `data` 到达时自动滚入可视区；`scrollIntoViewIfNeeded` 不可用时回退 `scrollIntoView({ block: 'nearest' })`（Firefox 无前者） |
| `v-model:collapsed` | Boolean | `false` | 折叠为图标条 |
| `width` | String \| Number | `'240px'` | 展开态宽度（对齐 MuDrawer 的 `width` 与 WebFrame 原实现，数字经 resolveSize 转 px），实现上写入 `--mu-side-menu_width`，使用方仍可用 CSS 变量覆盖 |
| `collapse-button` | Boolean | `false` | 底部显示折叠/展开把手按钮（图标随状态切换），点击触发 `update:collapsed`。不沿用 splitter 已占用的 `collapse-handle`（分隔条上的 line 把手），避免同名不同形 |
| `disabled` | Boolean | `false` | 整体禁用（叠加 item 级 disabled） |
| `expand-icons` | Boolean \| Object | `true` | 组头展开箭头图标定制，默认 `{ expanded: 'chevronDown', collapsed: 'chevronRight' }`（内置图标集为 camelCase 名）。可全局经 `$mussel.options.sideMenu.expandIcons` 定制（对齐 MuTree 的 nodeIcons/expandIcons 机制） |
| `v-model:favorites` | Array | — | 收藏项 key 集合（受控）。**绑定且值为数组即启用**（含空数组）：叶子行星标交互 + 组件在顶部内置「我的收藏」特殊一级组（见 §5.5）。`favorites` 不为数组、或未绑定 `v-model:favorites`，均不出现收藏组与收藏按钮——不加独立布尔开关，状态与 UI 本为一体 |

数据字段 `title` 用作悬浮提示文本（缺省回落 `label`），与 MuTree 语义一致。

级数：**推荐三级以内**（一级 → 二级组/叶 → 三级叶，对齐 WebFrame 实际层级）。超过三级仅在 dev 环境 `console.warn` 提示、渲染不截断——软提示而非硬上限（§10 同此口径）。

### 4.3 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| `select` | `item, keyPath` | 点击**叶子项**。`keyPath` 为根到当前项的 key 数组（antd keyPath 模式）；同时触发 `update:activeItem`。组头点击只切换展开，不触发 |
| `itemClick` | `item, keyPath` | 点击任意项（含组头），用于埋点等旁路监听；不影响选中/展开语义 |
| `groupExpand` / `groupCollapse` | `key` | 组展开/收拢（旁路通知；受控更新走 `update:expanded-keys`）。带 `group` 前缀与 `collapsed`（整栏折叠）、expose 方法 `expand()`/`collapse()`（§4.5）区分 |
| `favoriteToggle` | `item, favorited` | 点击星标（`update:favorites` 随之触发）。业务在此做远端同步；失败不回写 `favorites` 即视为取消 |

### 4.4 插槽

| 插槽 | 作用域 | 说明 |
|---|---|---|
| `header` | `{ collapsed }` | 头部区（logo/标题/搜索框）。折叠态由内容方按 `collapsed` 自行适配（WebFrame 的搜索框即放此处） |
| `footer` | `{ collapsed }` | 底部区（用户入口等），`collapse-button` 把手固定渲染在 footer 之下 |
| `item` | `{ item, level, active, expanded, favorited, collapsed }` | 自定义项内容（组头与叶子通用），缺省渲染 `图标 + label`。`level` 恒为该项在完整菜单树中的层级（一级 0，弹层内不重置），自绘缩进按 `indent × level`；`collapsed` 为整栏折叠态 |

### 4.5 expose（ref 方法）

| 方法 | 说明 |
|---|---|
| `expand(...keys)` / `collapse(...keys)` | 展开/收拢指定组 |
| `expandTo(key)` | 展开到指定项的父链（不滚动） |
| `scrollIntoView(key?)` | 滚动定位（缺省用当前激活项），并确保其可见。对齐 Naive `showOption` |

## 5. 交互规格

### 5.1 展开态（默认）

- 组头：图标 + label + 右侧箭头（默认 collapsed→`chevronRight`、expanded→`chevronDown` 两图标切换；也可配同一图标 + 旋转过渡，对齐 MuTree 的单图标做法）；点击整行或箭头均可切换；`disabled` 组不响应。
- 手风琴：`accordion` 开启时，展开一个组自动收拢**同级**已展开组（主流语义：仅同级互斥）。
- 子级缩进：`--mu-side-menu_indent` × level（沿用 `tree-node` 的 `calc(var(...) * level)` 写法）；`level` 恒为树层级，弹层内同公式、不重置（§10）。
- 组展开动画：`grid-template-rows 0fr → 1fr` 过渡（WebFrame 验证过的配方，无需 JS 测高）。
- 高度溢出：中间滚动区 `v-mu-scrollbar` 指令（对齐 WebFrame）。

### 5.2 激活态

- `activeItem` 精确匹配叶子 key → `[active]` 属性高亮；组头在任一后代激活时呈 `[active]`（半强度态）。
- 路由场景由业务在 route 钩子里回写 `v-model:active-item`；组件不做路由匹配（库无 vue-router 依赖，WebFrame 亦为外部驱动激活）。
- `auto-expand-active`：激活 key 变化、或 `data` 到达/刷新时（异步菜单数据的常见时序：路由先就绪、数据后到），父链未展开则展开（受控模式下发起 `update:expanded-keys`，由业务回填）；`data` 刷新时一并清理已不存在节点的展开 key。
- `scroll-into-view`：激活变化或 `data` 到达后 `nextTick` + `scrollIntoViewIfNeeded`，不可用时回退 `scrollIntoView({ block: 'nearest' })`（Firefox 无前者）；首挂载延迟 100ms（对齐 WebFrame，避开初始渲染抖动）。

### 5.3 折叠态（collapsed）

- **布局语义：占位收缩，非浮出**。折叠后组件仍占 `--mu-side-menu_collapsed-width` 的布局位（右邻内容区随之让位），区别于 hover 整栏浮出覆盖内容区的 floating 形态（§9，V2 增量）。
- 宽度过渡至 `--mu-side-menu_collapsed-width`（`width` 过渡 0.2s）；一级项仅显示图标并居中；header/footer slot 内容按 `collapsed` 作用域自行适配；`item` 插槽折叠态仍可用（作用域直接带 `collapsed`，见 §4.4）。弹层面板（宽 `--mu-side-menu_popup-width`）必然横向溢出 48px 容器、**覆盖**右邻内容区——覆盖而非推挤，是折叠弹层的预期语义，也是其必须脱离文档流的直接原因。
- **一级叶子项**：hover 显示右侧 tooltip（label/title，经 per-app `$mussel.tooltip` controller，`placement: 'right'`，复用 tooltip 组件基础设施，不新增浮层）。
- **一级组**：hover 右侧弹出子菜单面板（见 §5.4）；300ms 延迟关闭；锚点切换（hover 移到相邻组）时保留显示直接换内容重定位，不播动画（tooltip 已验证的同款语义）。
- 弹出面板内点击叶子项 → `select` + 关闭面板；面板内不再嵌套弹出（子树全部内嵌展开渲染，WebFrame `sub-menu` 同款 `?? true` 默认全展开策略）。

### 5.4 弹出面板（自研，复用弹层基础设施）

- 定位：fixed，锚点为图标条目，弹出在其**右侧**垂直对齐；两轴均带翻转——右侧余量不足且左侧更充裕时翻到左侧（同 tooltip-panel 的 `resolveMainAxis` 思路，覆盖侧栏靠右、视口过窄两种情形），下方空间不足且上方更充裕时向上翻转；`max-height` 限高（`calc(100vh - 上下留白)`）内部滚动。
- 复用 `src/components/common/popup` 的 `usePopupManager`（互斥：与 dropdown/tooltip 弹层互斥、ESC、外点、resize、window blur）与 `usePopupRunner`（显隐时序/过渡，tooltip 重构后同款路径）。
- **不复用 `mu-dropdown-panel`**：其 `updatePosition` 只支持上下（`position="top|bottom"`）弹出（dropdown-panel.vue:107-113），无右侧能力，扩展它会波及全部现有 dropdown 调用方；菜单面板还需渲染递归子树，面板本体自写（约 100 行）。
- **不采用组件内 absolute 浮层**（容器收窄宽度、子菜单以 `position: absolute` 挂组件内右侧浮出，免 Teleport）：① 裁剪风险——菜单 body 自带 `v-mu-scrollbar`（overflow），面板必须挂滚动区外；而组件无法约束使用方祖先链（split-box/drawer/flex 布局常见 overflow），absolute 面板随时可能被祖先裁剪。② 层叠上下文风险——祖先带 transform/opacity/定位+z-index 时，面板被锁在该上下文内，z-index 再高也压不过相邻区域。fixed + Teleport 无此两患；且 Teleport 目标 rootElement 仍在 `.mu-root` 变量级联内，暗色/主题继承与 absolute 方案等效，无收益损失比。
- Teleport 到 `inject('$mussel').rootElement`，暗色变量沿 DOM 级联自动继承（tooltip 同款）。

### 5.5 收藏（V1.1 增量，`v-model:favorites` 绑定即启用）

按"组件管交互与呈现、业务管 IO"分两层：

- **启用条件（组件）**：`favorites` 为数组（含 `[]`）且绑定 `v-model:favorites` 即启用；`favorites` 不为数组、或未绑定（含只传 `:favorites` 不绑 `v-model`），均不出现收藏按钮与收藏组——不做独立布尔开关，星标 UI 与收藏数据本为一体（MuTree `buttons` 是按钮数据列表、`[]` 等于没有按钮，语义不同，不援引该惯例）。"是否绑定"经 vnode props 是否含 `onUpdate:favorites` 判定。
- **星标交互（组件）**：启用后，**叶子行**右缘显示星标按钮——hover 显现（不占布局位）、已收藏常显实心（`star` outline/filled，实施时在 `tabler-icons.js` 增补，图标包已含）；点击 `stopPropagation`，不触发 `select` 也不触发组展开；`disabled` 项仍可收藏（收藏 ≠ 功能入口）；折叠态弹层面板内为同一 node 组件，行为天然一致。状态走 `v-model:favorites`（受控、零 IO）。
- **「我的收藏」置顶组（组件内置）**：启用后组件在 `data` 之前渲染特殊一级组——图标 `star`、文案默认「我的收藏」、组 key 为保留字 `__favorites__`，子项为从 `data` 全树提取的 key ∈ `favorites` 的叶子（平铺一级、保留原 key）。同 key 双入口天然双高亮（原树 + 收藏组同时 `[active]`）；`auto-expand-active`/`expandTo` 的 `walkTo` 只在原树上查找（收藏组为派生视图，不参与父链展开）；空 `favorites` 时组头仍渲染、展开区为空；收藏组按普通一级组参与手风琴、缩进与折叠态弹层。
- **持久化/远端同步（业务）**：`favoriteToggle` 回调内本地乐观回写 `favorites` + debounce 同步远端（WebFrame 模式：700ms `PUT user-data`，失败回滚不回写）。

### 5.6 语义与键盘

- 结构与角色：容器 `nav`，组/叶子行渲染为 `ul`/`li` + `button`（组件不持有路由信息，业务要真实链接时经 `item` 插槽自绘 `a`）。行元素可 Tab 聚焦、Enter/Space 触发（button 原生行为），**不使用 `role="menu"`/`menuitem`**——ARIA 菜单模式与方向键漫游、焦点管理绑定，V1 不做漫游，声明菜单角色属错误承诺。
- 可访问名称：`nav` 的 `aria-label` 经 attrs 透传——根元素即 nav，Vue 默认 fallthrough 即生效（`<mu-side-menu aria-label="主菜单">`）；不加 prop，避免与 `props` 字段映射中的 `label` 键混淆。
- 状态属性：组头 `aria-expanded`；激活叶子 `aria-current="page"`；`disabled` 项 `aria-disabled` 且不响应点击。
- 方向键漫游、roving tabindex、`aria-activedescendant` 等菜单模式能力列入后续增量（§9）。

## 6. 样式设计

新增 `side-menu.scss`，BEM + 属性状态选择器（沿用 `tree-node` 的 `[active]`/`[disabled]`/`[expanded]` 属性惯例）：

```
.mu-side-menu                    # 容器（flex column：header / body / footer / collapse-button）
  --mu-side-menu_width: 240px    # 默认值；width prop 传入时写入同一变量
  --mu-side-menu_collapsed-width: 48px
  --mu-side-menu_item-height: 40px
  --mu-side-menu_indent: 20px
  --mu-side-menu_popup-width: 200px
.mu-side-menu--collapsed         # 折叠修饰符（宽度、隐藏 label、图标居中）
.mu-side-menu__header / __body / __footer / __collapse-button
.mu-side-menu__item              # 组头与叶子统一行（padding-left = indent × level，弹层同公式）
  [active] [disabled] [expanded] # 状态属性
.mu-side-menu__item-icon / __item-label / __item-expand-icon
.mu-side-menu__item-favorite-btn  # 叶子行右缘星标（hover 显现不占位，已收藏常显实心）
.mu-side-menu-popup              # 折叠态弹层面板（独立块，Teleport 挂 root 下）；自身 padding 提供留白，不并入缩进
.mu-side-menu-popup__item        # 弹层内行复用 __item 样式（缩进沿用树层级 level）
```

- 颜色零硬编码：激活/hover 用 `--mu-primary-color` + `--mu-primary-translucent`（WebFrame 同款映射），文本用 `--mu-text-color-*` 系列，背景 `--mu-bg-normal`/`--mu-bg-fill`，弹层阴影 `--mu-shadow-popup`。暗色模式经 `.mu-root.mu-dark` 变量覆盖自动生效——**补齐 WebFrame 无暗色模式的缺口**。
- 动画：容器 `width .2s ease`；组展开 `grid-template-rows 0fr→1fr .15s`；箭头 `rotate` 过渡；弹层 opacity/位移淡入（`[pop-up]` 属性动画，与 dropdown-panel 同语言）。

## 7. 实现结构

```
src/components/side-menu/
├── side-menu.vue         # MusselSideMenu：props/emits、展开状态、激活、折叠、provide('sideMenu')、expose
├── side-menu-node.vue    # MusselSideMenuNode：递归渲染（组头/叶子/子树），参考 tree-node.vue 结构
├── side-menu-popup.vue   # 折叠态弹层：右侧定位 + 翻转 + 限高，usePopupManager/usePopupRunner
├── side-menu.js          # useSideMenuExpand()：keys 集合（Set）受控/非受控二选一 + accordion 互斥 + walkTo 父链
├── default-options.js    # DEFAULT_DATA_PROPS（参考 tree 按需定义 key/icon/label/title/disabled/childNodes，不 import tree 的定义）+ DEFAULT_EXPAND_ICONS
├── side-menu.scss
└── index.js              # 仅导出组件（对齐 tree/index.js；无 install——无全局副作用）
```

- 注册：`src/components/index.js` 增加 `import * as SideMenuComponents from './side-menu'` 与 `_install(SideMenuComponents)`。
- 全局选项：`$mussel.options.sideMenu = { expandIcons: {...} }`（对齐 tree 的合并层级：default < 全局 < prop）。
- `side-menu.js` 的展开状态核心：`Set` 持有展开 keys；传了 `expanded-keys` 时以 props 为准（只读 + 发起 `update:expanded-keys`），未传时用内部 Set，两者共用同一读写接口（受控/非受控二选一，不做叠加合并）；手风琴在写时过滤同级；`walkTo` 参照 `tree.js` 的路径查找（约 40 行）。

### 实施步骤

1. `default-options.js` + `side-menu.js`（展开状态）+ `side-menu.scss` 骨架
2. `side-menu.vue` + `side-menu-node.vue`：展开态完整功能（渲染/激活/手风琴/缩进/动画/slots）
3. `side-menu-popup.vue`：折叠态弹层 + tooltip 集成 + `collapse-button`
4. 注册 + demo 页 `demo/src/side-menu/`（`vite.demo.config.js` 自动扫描 `demo/src/*/main.js`，无需改构建配置；但需在 `demo/src/index.html` 的 tile 列表补 `./side-menu/` 入口）
5. Playwright DOM 断言验证（§8）+ 暗色/亮色视觉抽查
6. 文档三处同步（§8）

## 8. 验证与文档

demo 页覆盖点（`demo/src/side-menu/`，访问 `http://localhost:3000/side-menu/`）：

1. 多级渲染、图标、缩进层级
2. 叶子点击 → `select`/`v-model:active-item`/`[active]`；组头后代激活的半强度态；传组 key/不存在 key 静默忽略
3. 展开切换、`accordion` 同级互斥、`v-model:expanded-keys` 受控往返
4. `auto-expand-active` 父链展开 + `scroll-into-view` 滚动定位（初始、key 变化、`data` 异步后到三种；Chromium 与 Firefox 各跑一次滚动回退路径）
5. `collapsed`：宽度过渡、图标条、叶子 tooltip、组弹层（含长菜单限高滚动、近视口底部的向上翻转、侧栏靠右/窄视口时的向左翻转、锚点切换不闪）
6. `disabled`（item 级 + 根级）、`item`/`header`/`footer` 插槽、`collapse-button`、`width` prop 与 CSS 变量覆盖
7. 弹层与 dropdown 互斥（同页放一个 dropdown 验证 popup manager）
8. `.mu-dark` 下全量状态视觉正确
9. `favorites` 收藏：绑定（含 `[]`）即启用、非数组或未绑定即无星标无收藏组（含只传 `:favorites` 不绑 `v-model` 的情形）、hover 显现/已收藏常显、点击不触发 select 与组展开、disabled 项可收藏、`v-model:favorites` 往返与 `favoriteToggle` 回调、「我的收藏」置顶组渲染与位置、子项按 keys 从原树提取平铺、激活双高亮、空收藏组头仍渲染、收藏组参与手风琴与折叠弹层、折叠态弹层内星标行为一致
10. 语义检查：`nav`/`ul`/`li` 结构与 `button` 行元素、组头 `aria-expanded`、激活叶子 `aria-current="page"`、`disabled` 项 `aria-disabled`、`aria-label` attrs 透传、Tab 可聚焦（不含方向键漫游）

文档同步（三处，含 sidebar 登记）：

- `skills/mussel-ui/references/components/containers.md`（导航类，与 MuTabs 同文件）
- `docs/quick-reference_components.md`
- `docs-site/components/side-menu.md` + `.vitepress/config.mts`「导航与容器」分组追加 `{ text: '侧边菜单 MuSideMenu', link: '/components/side-menu' }`

## 9. 不在范围（V1 砍掉，附理由）

| 功能 | 来源 | 理由 |
|---|---|---|
| 搜索过滤 | WebFrame | 业务能力（远端同步、用户数据），放应用层；`header` slot 可承载搜索框。收藏交互与「我的收藏」置顶组均为组件能力（§5.5），仅远端同步留业务层 |
| 折叠/展开状态 localStorage 持久化 | WebFrame | 受控 API（`v-model:collapsed`/`expanded-keys`）下业务一行可做，组件不做 IO |
| `badge`/`extra` 右侧附加内容 | Naive `extra` | 需求未出现；`item` slot 可自定义整行内容 |
| `type: 'group'`/`divider` 分组分隔 | antd/Naive/Vuetify | WebFrame 场景无分组标题需求，保持数据结构简单 |
| 水平模式 `mode` | 各家 | 命名即范围；水平菜单交互模型不同（ellipsis 溢出等），需要时另立组件 |
| `multiple` 多选、`danger` 危险项 | antd | 导航场景低频 |
| 键盘导航（方向键漫游） | Vuetify 较完善 | V1 只做 Tab 可达 + `nav`/`ul`/`li` 语义（§5.6），不做 `role="menu"` 与方向键漫游——两者本是配套的，只声明角色不实现漫游反而误导；漫游列后续增量 |
| 响应式断点自动折叠 | Arco `breakpoint` | 布局职责（由外层 split-box/drawer/业务处理），且引入 resize 监听成本 |
| hover 整栏浮出（floating/miniToOverlay） | WebFrame/Vuetify/Quasar | 属布局层形态；折叠态 hover 弹子菜单已覆盖信息可达性，浮出整栏可作 V2 增量（届时仅需容器级 hover 处理） |
| 菜单数据加载/权限过滤 | WebFrame | 组件收纯数据；请求、排序、权限裁剪在数据源头完成 |

## 10. 风险与边界

- **折叠过渡期间弹层定位**：宽度动画进行中锚点矩形持续变化，hover 弹层需在 `collapse` 切换时先关闭已开弹层（WebFrame 同款处理），避免面板跟随错位。
- **弹层内复用 `side-menu-node`**：递归组件在 Teleport 弹层上下文中 provide 链仍然有效（同 app context）。缩进不设第二套基准——`level` 恒为该项在完整菜单树中的层级，主体树与弹层同用 `calc(var(--mu-side-menu_indent) * level)`；弹层渲染被 hover 组的子树时按 `:level="groupLevel + 1"` 起递归（一级组弹出，故首行恒为 1），无需 `baseLevel` 注入或额外分支。弹层首行的 indent 缩进与面板留白是两件事，后者由 `.mu-side-menu-popup` 自身 padding 控制，不并入缩进计算。
- **受控模式下 `auto-expand-active`**：组件只发起 `update:expanded-keys`，业务未回填时不生效（`data` 到达后的自动展开同理）——文档需明示该行为，避免"时灵时不灵"的困惑。
- **`props.key` 缺失的节点**：无法进展开集合与激活匹配，渲染时 dev 环境 `console.warn` 并跳过（比静默错乱好）。
- **key 唯一性**：组件不假设 key 在全树唯一，`walkTo`/`expandTo` 在原树上取首个匹配（收藏组子项复用原 key、同 key 双入口高亮属预期用法，见 §5.5）——业务须保证同一 key 指向同一目标；`__favorites__` 为收藏组保留 key。
- **级数超限**：数据超过三级（推荐上限）时 dev 环境 `console.warn`，渲染不截断——软提示，与 §4.2 同口径；折叠弹层为单面板全展开，级数增加只撑高面板，有限高滚动兜底。
- **空 `data`/加载态**：组件不内置 loading/空态呈现——空数据渲染空容器，加载状态由组件外处理（`header` slot 或业务布局）。
