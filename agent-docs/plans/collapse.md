# mu-collapse / mu-collapse-group 折叠面板组件方案

| 项目 | 内容 |
|---|---|
| 状态 | 方案设计（2026-10-14），待实施 |
| 范围 | 新增 `src/components/collapse/`（`collapse.vue` + `collapse.scss` + `collapse-group.vue` + `index.js`）；`src/components/index.js` 注册；`demo/src/collapse/` 验证页 |
| 不在范围 | 三处文档同步（`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/components/collapse.md`）——实施完成经用户确认后进行 |

---

## 1. 组件关系（单体 + 组合双模式）

- `mu-collapse`：折叠面板单体，可独立使用，也可作为 `mu-collapse-group` 子组件。
- `mu-collapse-group`：编排容器，`provide('collapseGroup', ctx)` 下发公共配置与状态管理；子组件经 `inject` 判定所处模式。
- 两种模式下 `isExpanded` 的判定与点击行为不同（§3）。

## 2. API

### 2.1 mu-collapse-group

**Model**

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `expanded` | `Array<string \| number>` | `[]` | 展开面板 id 列表；accordion 模式下**只有首个元素生效**（渲染层互斥），挂载时若长度 > 1 一律写回 `[首个元素]`（§3.4） |

> 默认值用 `default: () => []` 工厂（实测：`propsDefaults` 是**实例级**缓存，每个 group 实例各调一次工厂，不会跨实例共享数组）。仍须做非破坏性赋值（`[...list, id]` / `[id]` / `list.filter(...)`），因为受控场景下数组来自父组件数据，`push` / `splice` 会就地改父状态。读取统一走 `expandedModel.value ?? []` 兜底，避免渲染期取到 `undefined`。

**Props**

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `accordion` | `Boolean` | `false` | 手风琴互斥模式，每次最多展开一个 |
| `disabled` | `Boolean` | `false` | 整组禁用；为 `true` 时子面板不可解除（§2.3） |
| `defaultExpand` | `'first' \| 'all'` | — | 默认展开策略；**仅非受控时生效**（未绑定 `expanded` 时），初始化后写入 expanded 并 emit `update:expanded`。accordion 下传 `'all'`：dev 环境 `console.warn`，实际取 `first` |

> group **不提供** `arrow` prop：箭头显隐是面板级外观，由各 `mu-collapse` 自己的 `arrow` 决定（默认 `true`）。group 只负责状态编排（`expanded` / `accordion` / `disabled`）+ 布局合并。

**Slots**：`default` — 放置 `mu-collapse` 子组件。

### 2.2 mu-collapse

**Model**

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `expanded` | `Boolean` | `undefined` | 展开状态双向绑定；**仅 standalone 模式生效**，处于 group 内时忽略（group 全权管理） |

**Props**

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `id` | `String \| Number` | — | group 模式下的唯一标识（见下方说明）；未传时用 setup 顶层生成的兜底 id 填充 |
| `title` | `String` | — | 标题文本，超长省略号截断 |
| `arrow` | `Boolean` | `undefined` | 是否显示展开箭头；未传时视为 `true`（group 不下发该配置） |
| `disabled` | `Boolean` | `false` | 禁用当前面板。为真时：点击无效、渲染为收拢态（`isExpanded` 恒 `false`）；不修改 group 的 expanded 列表，解除禁用后恢复原展开态 |
| `defaultExpanded` | `Boolean` | `false` | standalone 非受控时的初始展开状态（`expanded` 绑定值优先） |

`showArrow` 即 `props.arrow ?? true`。**`arrow` 必须显式声明 `default: undefined`（实施修正，推翻初稿论断）**：Vue 对未声明 default 的 `Boolean` prop 在未传时做布尔转换为 `false`（并非 `undefined`），`?? true` / `?? defaultExpanded` 的兜底会被切断——实测未声明时箭头恒不渲染、`defaultExpanded` 恒失效。`expanded` model 同理，`defineModel('expanded', { type: Boolean, default: undefined })` 才能让 `?? props.defaultExpanded` 生效。

> 兜底 id 必须在 **setup 顶层**取一次（`const fallbackId = useId()`），再由 `computed(() => props.id ?? fallbackId)` 组合。**禁止在 computed / getter 内调用 `useId()`**：它内部按实例计数器自增（`i.ids[1]++`），在 computed 里每次重算都会产出新值 —— 未传 `id` 的面板 id 会漂移，且在 group 内可能彼此相同（多面板被当成同一项联动展开）。

**`id` 的用途与"显式传"的含义**：`id` 只是面板在 group 里的**记账键**，用于两件事 —— ① `expanded` 列表里标识"哪些面板展开"；② 子面板注册/注销时的身份。它不从 DOM 读、也不影响无障碍属性。

- 不传 `id` 完全可用：点击开合、`accordion`、`defaultExpand` 都不需要外部知道 id（这些都是"用户手点"或"组件自算"驱动的）。
- 只有一种情况必须显式传：**父组件要自己构造 `expanded` 列表来读写**（`v-model:expanded="['a']"`、按钮触发展开第 3 个面板、按业务字段定位面板）。此时父组件必须能写出面板的 id 字面量，而兜底 id 是 `useId()` 生成的随机串、从未暴露给父组件，父组件无从引用 —— 所以这类用法必须自己传 `id="a"`。
- 一句话：**"我不知道该往 `expanded` 里写什么"时，就是需要显式传 `id` 的信号**；不需要程序化定位面板时不必传。

**Slots**

| 名称 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 主体内容区（`.mu-collapse__content`） |
| `header` | `{ expanded, disabled, toggle }` | 整体替换 Header 内容（§4） |
| `header-prepend` | `{ expanded, disabled }` | 标题前置区域 |
| `header-append` | `{ expanded, disabled }` | 标题后置区域 |

**作用域 `expanded` 的语义**：传的是**实际渲染态** `isExpanded`（即 §3.2 的计算结果，会响应式更新、`disabled` 时为 `false`），不是 group/model 的原始值。

- 理由：自定义 Header 要渲染的是"面板看起来是开还是合"，必须与 `.mu-collapse[expanded]` 属性、箭头旋转、内容区显隐**同源**，否则会出现"Header 显示已展开但内容区收着"这类不一致。`disabled` 面板渲染为收拢态，Header 也应显示收拢态 —— 故取实际态。
- 三个槽位（`header` / `header-prepend` / `header-append`）的 `expanded` 同源，均为 `isExpanded`。
- 原始 model 值（group 的 `expanded` 列表、standalone 的 `v-model:expanded`）属组件内部状态，槽位不下发；父组件本就持有自己的绑定值，无需经插槽回传。

### 2.3 公共属性合并规则

只有 `disabled` 是组级下发、子级只能加严（`group` 为 inject 出的 context，字段为 ref，见 §6）：

- `isDisabled = group?.disabled.value || props.disabled`（组禁用 → 全组必禁用，子组件无法解除；子组件 `disabled=true` 可单独加严）

`arrow` 不再继承，直接用自身 `props.arrow ?? true`（group 无该 prop）。

### 2.4 不新增的事件

仅 model 自带的 `update:expanded`，不额外增加 `change` / `expand` / `collapse` 事件（需要时后续再议）。

## 3. 状态联动与交互逻辑

### 3.1 模式判定

`inject('collapseGroup', null)` 非空即 group 模式。

### 3.2 isExpanded 计算

```
isExpanded = !isDisabled && baseExpanded

baseExpanded:
  group + accordion:  group.expanded.value?.[0] === itemId.value
  group:              (group.expanded.value ?? []).includes(itemId.value)
  standalone:         expandedModel.value ?? props.defaultExpanded
```

- accordion 模式以**列表首元素**为唯一展开项（`expanded[0] === itemId`）。这是渲染层的硬保证：即使父组件传入/回写多个 id，同时展开的也只可能有一个，不依赖模型值被写回。
- `disabled` 为真时 `isExpanded` 恒 `false`（渲染收拢态），但 group 的 expanded 列表**不**因此移除该 id。
- `itemId = computed(() => props.id ?? fallbackId)`，`fallbackId` 来自 setup 顶层（见 §2.2 注）。
- group 模式一律读 `group.expanded.value`；standalone 的 `expandedModel` 与 group 的 `expanded` 是两个不同的 ref，勿混用（`mu-collapse` 自身也声明了同名 model，group 内须忽略它）。

### 3.3 点击行为（toggle）

```js
function toggle () {
  if (isDisabled.value) return
  group 模式:  group.toggleItem(itemId.value)
  standalone:  expandedModel.value = !isExpanded.value  // defineModel 赋值，自动 emit update:expanded
}
```

`toggleItem(id)`（group 内）：

- 已在列表 → 移除（`list.filter(el => el !== id)`）
- 不在列表 → `accordion ? [id] : [...(expanded.value ?? []), id]`

### 3.4 子面板注册与 defaultExpand

- 子面板 `onMounted` 时 `group.register(itemId.value, rootEl)`，卸载时 `unregister`；group 维护 `items`（shallowRef 数组，存 `{ id, el }`）。
- `defaultExpand` 初始化在 group `onMounted` 时执行（子组件先于父挂载，故此时直接子面板已注册齐；`getCurrentInstance()` 在生命周期回调内仍返回本实例 —— `injectHook` 内部 `setCurrentInstance`，已核实 runtime-core 实现）：
  - 受控判定读**原始 vnode props**：`const rawProps = getCurrentInstance().vnode.props ?? {}`，`'expanded' in rawProps` → 受控，跳过 `defaultExpand`。**不可用 `props.expanded` 判断** —— model 声明了 `default: () => []`，未绑定时 `props.expanded` 也是 `[]`，判定永远命中。
  - 只以 `expanded` 是否传入为准（父组件持有值即受控），**不看 `onUpdate:expanded`**：仅传 `@update:expanded` 而没绑 `expanded` 时，本地赋值仍生效，属非受控，`defaultExpand` 应照常执行。
  - `'first'` → `items.value` 为空时跳过（**空数组守卫**：`items.value[0].id` 对空组是 TypeError）；否则 `expanded.value = [items.value[0].id]`（按**注册顺序**取首个面板）；`'all'` → accordion ? warn + 取 first : `items.value.map(i => i.id)`（空数组下安全产出 `[]`，无需守卫）。
  - 写入经 defineModel 赋值，非受控场景自动 emit `update:expanded`。
  - 判定只在挂载时做一次；挂载后父组件再增删绑定不回溯（不视为受控/受控切换）。
- **accordion 收敛**：同一步（group `onMounted`，`defaultExpand` 之后）检查 `accordion === true && expanded.value?.length > 1` → `expanded.value = [expanded.value[0]]`，即**按列表顺序**取首元素（与 `defaultExpand="first"` 的"注册顺序"是两回事：前者是父组件传入数组的顺序，后者是 DOM 挂载顺序）。
  - 实际生效路径主要是**受控**场景（父组件初始传了多个 id）。非受控下 `expanded` 只能来自 `defaultExpand`，而 accordion 已把 `'all'` 降级为 `'first'`，长度不会 > 1 —— 该分支属防御性代码（也覆盖内部后续新增写入路径）。
  - 非受控：赋值直接生效，同时 emit `update:expanded`。
  - 受控：defineModel 赋值**只 emit、不改本地值**（`hasVModel` 分支），所以"更新 model 值"在这一路径上是尽力而为 —— 父组件不接受 emit 时，`props.expanded` 仍是多个元素。这不影响显示：渲染互斥由 §3.2 的 `expanded[0] === itemId` 规则硬保证，永远只开一个。这是 v-model 契约本身的限制，不是可绕过的实现细节。
  - 挂载后父组件再写回多元素数组同理：模型值照原样保留，渲染只认首元素。
  - 若首元素不是任何已注册面板的 id（如指向不存在的面板），结果是无面板展开 —— 不做"跳过无效项再选下一个"的兜底，避免隐式改写父组件数据。
- 顺序以注册顺序为准（等价 DOM 顺序）；**限制**：异步渲染/动态追加的面板不参与初始 `defaultExpand`，文档需注明。
- 中间包裹非 `mu-collapse` 的布局层会破坏"直接子面板"语义（register 仍生效，`first` 顺序仍按挂载序），可接受。

## 4. Header 渐进式插槽结构

组件整体骨架（`collapse.vue` 模板）：

```html
<div
  class="mu-collapse"
  :expanded="isExpanded || null"
  :disabled="isDisabled || null">
  <div class="mu-collapse__head" @click="toggle">
    <!-- 见下：header 插槽 -->
  </div>
  <div class="mu-collapse__body">
    <div class="mu-collapse__content">
      <slot />
    </div>
  </div>
</div>
```

Header 部分：

```html
<div class="mu-collapse__head" @click="toggle">
  <slot name="header" :expanded="isExpanded" :disabled="isDisabled" :toggle="toggle">
    <slot name="header-prepend" :expanded="isExpanded" :disabled="isDisabled" />
    <div v-if="title" class="mu-collapse__title">{{ title }}</div>
    <div v-else class="flex-space" />
    <slot name="header-append" :expanded="isExpanded" :disabled="isDisabled" />
    <mu-icon
      v-if="showArrow"
      class="mu-collapse__arrow"
      icon="treeNodeExpand"
      :expanded="isExpanded || null" />
  </slot>
</div>
```

- `#header` 整体替换内部内容；`.mu-collapse__head` 容器与点击绑定保留。
- **自定义 Header 时，插槽作用域是获取状态与操作开合的唯一通道**：箭头（`.mu-collapse__arrow`）位于 fallback 内，父组件提供 `#header` 后不再渲染，自定义内容必须自行用作用域 `expanded` 渲染开合指示（图标、文案、`aria-expanded` 等）。

  **必须用 `@click.stop` 配合作用域 `toggle`，否则静默失效**：`.mu-collapse__head` 容器上已绑定 `@click="toggle"`，自定义内容若再绑一个不带 `.stop` 的 `@click="toggle"`，同一次点击会 **toggle 两次**（先子后父冒泡），净效果是开合状态不变、面板点不动。正确写法二选一：

  ```html
  <!-- 写法 1：自定义内容不绑 click，交给容器（用 expanded 只做展示） -->
  <template #header="{ expanded, disabled }">
    <mu-icon :icon="expanded ? 'chevronDown' : 'chevronRight'" />
    <span>{{ expanded ? '已展开' : '已收起' }}</span>
    <span v-if="disabled">（禁用）</span>
  </template>

  <!-- 写法 2：自定义内容自行控制（必须 .stop，否则与容器叠加成双 toggle） -->
  <template #header="{ expanded, toggle }">
    <button type="button" @click.stop="toggle">{{ expanded ? '收起' : '展开' }}</button>
  </template>
  ```

  作用域 `expanded` 是**实际渲染态** `isExpanded`，响应式；`disabled` 时为 `false`（面板渲染收拢态），语义见 §2.2。
- **`#header` 与 `header-prepend` / `header-append` 互斥**：prepend/append 的 `<slot>` 出口位于 `#header` 的 fallback 内，父组件一旦提供 `#header`，fallback 整体不渲染，prepend/append 随之为空。需要自定义布局时统一走 `#header`。
- 默认四段式：prepend / `title`（`flex: 1 1 0` + ellipsis 撑开中间）或 `.flex-space` 垫片 / append / 箭头——title 存在与否前后内容均两端对齐。
- 垫片用现有原子类 `.flex-space`（`src/styles/layout.scss`，项目原子类无 `mu-` 前缀）。注意它与 `.mu-collapse__title` 的 `flex: 1 1 0` 语义重复但**不会同时出现**（`v-if` / `v-else`），二者取其一即可。
- 箭头图标 `treeNodeExpand`（chevronRight + `expand-rotate-90` 动画，`src/icons/index.js` 已有）；`:expanded="isExpanded || null"` 经 attrs 透传为 attribute，命中 `icon.scss` 的 `[animation="expand-rotate-90"][expanded]` 选择器实现 90° 平滑旋转，无需组件内写旋转样式。
- **`:expanded="isExpanded || null"` 依赖 icon 组件当前无 `expanded` prop 声明**（`icon.vue` 只声明 `tag` / `icon` / `animation`），值走 `attrs` → `patchAttr` 落到 DOM。若后续给 `mu-icon` 加 `expanded` prop，此处会退化为 prop 传值、attribute 不再渲染，箭头旋转直接失效。实施时保留一行注释说明该耦合。

## 5. 样式方案

### 5.1 类名与状态表达

状态一律用 HTML attribute（项目惯例，无 `is-*` 状态类）：根容器绑定 `:expanded="isExpanded || null"`、`:disabled="isDisabled || null"`（先例：`.mu-menu-group[expanded]`、`.mu-list-item[disabled]`）。

```scss
.mu-collapse-group {
  display: block;                     // 纯容器，无 gap
  border-top: 1px solid var(--mu-border-color-normal);   // 组顶部分割线
}

.mu-collapse {
  // 开放式分割线模型：无四周外框/圆角/背景，仅底部水平分割线
  // standalone 与 group 通用；相邻项由上一项 border-bottom 自然分割，无需合并规则
  border-bottom: 1px solid var(--mu-border-color-normal);

  &[disabled] {
    .mu-collapse__head {
      cursor: not-allowed;
      color: var(--mu-text-color-muted);
    }
  }
}

.mu-collapse__head {
  display: flex;
  align-items: center;
  gap: var(--mu-base-spacing);        // 8px，禁硬编码
  padding: var(--mu-base-spacing) 0;  // 高度由内容决定：上下 padding 提供呼吸感，左右为 0 与外部容器齐平
  cursor: pointer;
  user-select: none;
}

.mu-collapse__title {
  flex: 1 1 0;                        // 撑开中间区域，实现两端对齐 + 截断
  min-width: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### 5.2 展开动画（grid minmax(0,0fr) → minmax(0,1fr)）

结构：`.mu-collapse__body`（动画层）> `.mu-collapse__content`（**唯一 grid item** + 内边距容器 + 默认插槽）。模板见 §4 骨架。

**为什么 `__content` 这层不能省**（实测结论，Chromium 120）：

- **决定性理由 —— 必须保证只有一个 grid item。** `grid-template-rows` 只定义**一条**显式轨道；grid 容器里若有多个直接子元素，第 2 个起会落进**隐式 `auto` 轨道**，不受 `minmax(0,·fr)` 约束、无法收缩。实测：把默认插槽的 3 个根元素直接作为 grid item（单层结构），收起态轨道为 `0px 20px 20px`、面板残留 **40px** 高，第 2/3 项纹丝不动。用户往默认插槽写多个根元素（`<p>+<p>+<ul>`）是常态，单层结构下组件默认就是坏的。`.mu-collapse__content` 把任意形态的插槽内容**收敛成恰好一个 grid item**，与内容形态解耦。
- **次要理由 —— padding 需要有地方放。** 间距不能放在 grid 容器 `.mu-collapse__body` 上（容器 padding 在轨道之外，不随轨道收缩：实测收起态残留 16px）；也不能放在 item 的 `margin` 上（计入 outer contribution，泄漏）。放在 `__content` 的 `padding` 上，由 `minmax(0, ·)` 下限归零，是唯一干净的位置。

**所以不需要 `grid-auto-rows` 兜底**：只要确保单 item，单条 `grid-template-rows` 就够；`grid-auto-rows: minmax(0,·fr)` 方案虽也能收起（实测轨道 `0px 0px 0px`），但要额外做 `grid-auto-rows` 的过渡、且 padding 无处安放，不如两层结构。

```scss
.mu-collapse__body {
  display: grid;
  grid-template-rows: minmax(0, 0fr);   // 见下方说明：不能写裸 0fr
  visibility: hidden;                   // 收起后内容不可聚焦

  // transition 必须与 visibility 声明同元素，且两者都写在这一层
  transition: grid-template-rows .2s ease, visibility .2s;

  .mu-collapse[expanded] & {
    grid-template-rows: minmax(0, 1fr);
    visibility: visible;
  }
}

.mu-collapse__content {
  overflow: hidden;                   // 裁剪超出轨道的内容，配合轨道高度做动画
}                                     // 无 padding，间距由内容自带（第六轮调整）
```

- `min-height: 0` **不需要写**：它只对裸 `0fr` 有意义（解除 `auto` 最小高）；轨道已写 `minmax(0, ·)` 时，下限被显式钉为 0，实测带不带该声明收起态都是 `0px`。保留会误导后来者以为它是必要条件。
- 该层仍是必要的 DOM：即使 `.mu-collapse__content` 上不加任何样式，它的"单 item 收敛"职责依然成立。

**为什么不是裸 `0fr`**（实测结论，Chromium 120）：`grid-template-rows: 0fr` 的轨道尺寸取 grid item 的 outer contribution（含自身 `padding`/`border`/`margin`），`min-height: 0 + overflow: hidden` 只能把 **content** 压到 0，压不掉 item 自身的盒边距。`.mu-collapse__content` 带 `padding: 8px` 时，收起态实测轨道 = `16px`、面板高度残留 16px（`overflow: hidden` 写在 item 自身也无效，实测同值）。加 `minmax(0, …)` 下限后收起态实测轨道 = `0px`、高度 0，展开插值正常。

**为什么 transition 不写在 `.mu-collapse__content`**：`visibility` 的声明在 `.mu-collapse__body`，transition 只对**同一元素**上属性的声明值变化生效；写在子元素上时子元素自身没有 `visibility` 声明，实际是继承值变化，行为不可控（实测：收起瞬间父层立即 `hidden`，内容靠"子元素继承值 + 自主 transition"侥幸维持在 200ms 后隐藏，展开方向还要晚一帧才可见）。同元素声明后实测：展开**立即**可见，收起保持可见到过渡结束才 `hidden` —— 正是设计意图（`visibility` 可插值，规则为过渡两端有一端是 `visible` 时中间态取 `visible`）。

**回退方案**（若 demo 阶段验证 Safari/Firefox 对 `minmax` 内 `fr` 插值表现异常）：改回裸 `0fr` / `1fr`，同时把 `padding` 从 `.mu-collapse__content` 下移到其内部首个子元素（`.mu-collapse__content` 只保留 `min-height: 0` + `overflow: hidden`）。此写法与知识库 pitfall 的原文规避方式一致，代价是多一层 DOM。

**知识库 pitfall 规避**（`agent-docs/knowledge/pitfalls/`）：

- `grid-0fr-track-margin-leak`：间距绝不放在 grid item 的 `margin` 上；用 `padding` 放 item 自身时必须配 `minmax(0, …)` 下限（或下移到 item 内部子元素）。原文"用 padding 即可"的表述不完整 —— padding 与 margin 同样计入轨道贡献，区别只在于 `minmax` 能兜住 padding。
- `grid-auto-track-fr-transition-bump`：body 动画层仅含单条 `0fr/1fr` 轨道，不与 `auto` 轨道混排。
- `grid-single-explicit-track-ignores-extra-items`（本次新增）：单条 `minmax(0,·fr)` 只约束首个 grid item，插槽多根元素时其余落隐式 `auto` 轨道、收起态不收缩 —— 故必须有 `.mu-collapse__content` 收敛层。
- `scroll-during-grid-rows-animation`：demo/文档不演示"展开后立即 scrollIntoView"类场景；组件内如需滚动须等 200ms 过渡结束。

## 6. 文件结构与注册

```
src/components/collapse/
├── collapse.vue         # MusselCollapse → <mu-collapse>
├── collapse.scss
├── collapse-group.vue   # MusselCollapseGroup → <mu-collapse-group>
└── index.js             # export { default as MuCollapse } / { default as MuCollapseGroup }
```

- `collapse-group.vue` 的样式并入 `collapse.scss`（体量小，不单拆）。
- `src/components/index.js`：`import * as CollapseComponents from './collapse'` + `_install(CollapseComponents)`（导出名以 `Mu` 开头自动注册）。
- group 与 collapse 相互 import 仅单向：collapse-group 不 import collapse（插槽内容解耦），collapse 经 inject 获取 context；`collapse-group.vue` 模板仅渲染 `<div class="mu-collapse-group"><slot /></div>`。

**provide 契约**（`collapse.vue` 以此为唯一依赖面；字段一律为 ref/computed 原值，子组件读取须 `.value` —— 与 `button-group.vue` `provide('buttonGroup', props)` 不同，后者靠 proxy 解包）：

```js
provide('collapseGroup', {
  expanded,                  // ref<Array<string|number>>：group 的 defineModel
  disabled: computed(() => props.disabled),
  accordion: computed(() => props.accordion),
  register, unregister,      // (id, el) => void
  toggleItem                 // (id) => void
})
```

- 不要直接 provide `props`：扁平字段更利于子组件做 `??` 合并，也避免把 `defaultExpand` 等与子面板无关的字段暴露给子组件。
- group 字段与 collapse 自身同名 model 不冲突：`mu-collapse` 内部只在 standalone 分支引用自身 model。

## 7. demo 与验证

`demo/src/collapse/{main-view.vue, main.js}`（新增目录后须重启 `npm run demo:build`，watch 不跟踪新入口）。

demo 场景覆盖：

1. standalone：基础开关、`v-model:expanded` 受控、`defaultExpanded`、`disabled`（验证收拢显示 + 点击无效）、`arrow=false`。
2. group：默认多开、`accordion` 互斥、`accordion` 初始多 id 收敛（受控 + 非受控各一例）、`defaultExpand="first"/"all"`、`v-model:expanded` 程序化控制、group `disabled`（全部子面板点击无效）。
3. slots：`#header` 整体替换（作用域 `expanded` / `disabled` / `toggle` 全部用到）、`header-prepend/append`、超长 title 截断。

Playwright DOM 断言（`http://localhost:3000/collapse/`）：

- 点击后根容器 `[expanded]` attribute 切换。
- `.mu-collapse__body` 的 `getComputedStyle().gridTemplateRows`：收起态为 `0px`（**不是**字面 `0fr`，computed 已被解析为 px），展开态为内容高的 px 值。**必须在过渡结束后读**（点完 `waitForTimeout(250)`），否则读到插值中间态。
- 收起态面板高度 = head 高 + 1px 底边框（对比 §5.2 的 padding 泄漏回归：若残留 `--mu-base-spacing` 倍数说明 minmax 未生效，`__content` 上下 padding 在 `minmax(0, 0fr)` 下应严格归零）。
- 开放式分割线断言（§5.1 模型）：
  1. `.mu-collapse-group` 的 `border-top-width === '1px'`。
  2. 每个 `.mu-collapse` 的 `border-bottom-width === '1px'`，且 `border-left-width === '0px'`、`border-right-width === '0px'`、`border-radius === '0px'`。
  3. `.mu-collapse__head` 的 `padding-left` / `padding-right` 为 `'0px'`（上下 `var(--mu-base-spacing)`）；`.mu-collapse__content` 四向 `padding` 均为 `'0px'`。
  4. （即上条总校验）收起态 `.mu-collapse` 整体高度严格等于 head 高 + 1px。
- header 高度自适应回归：`#header` 放两行自定义内容时 `.mu-collapse__head` 的 `offsetHeight` 明显大于单行 title 面板（回归固定高度 / min-height 钳制残留）。
- 单 item 收敛回归：默认插槽里放 **3 个根元素**，收起态断言 `.mu-collapse__body` 的 `gridTemplateRows` 为单值（`0px` 而非 `0px 20px 20px`）+ 面板高度 = header 高（单层结构下此项会残留约 40px）。
- accordion：展开第二个后第一个 `[expanded]` 消失。
- accordion 初始多 id 收敛：传 `:expanded="['b', 'c']"` + `accordion`，断言 ① 仅 `b` 面板带 `[expanded]`（渲染互斥）② 父组件收到 `update:expanded` 载荷为 `['b']`（受控下收敛靠 emit）③ 父组件接受该 emit 后 `props.expanded` 变为 `['b']`。
- disabled 面板：点击后 `[expanded]` 无变化（收拢态）。
- 箭头：面板自身 `arrow` 为 `true` 时 `.mu-collapse__arrow` 的 `[expanded]` attribute 随状态切换；`arrow=false` 的面板不渲染该元素。
- `#header` 插槽作用域 `expanded` **响应式**：自定义 Header 里放一个随状态切换的元素（如 `<span class="probe">{{ expanded ? 'on' : 'off' }}</span>`），点击容器后断言其文本由 `off` 变 `on`（只验证"传进去了"不够，须验证"会更新" —— 槽位作用域若是非响应式快照，点击后面板内容展开而 Header 文案不动）。
- `#header` 作用域 `expanded` 与渲染态同源：`disabled` 面板提供自定义 Header 时，作用域 `expanded` 为 `false`（尽管 group 的 `expanded` 列表可能含该 id）。
- `#header` 点击路径**恰好生效一次**：写法 2（`@click.stop` + `toggle`）单击后 `[expanded]` 翻转一次（回归双重 toggle：不带 `.stop` 时子父各 toggle 一次、净效果为状态不变，面板"点不动"）；写法 1（自定义内容不绑 click）单击容器任意位置也应恰好翻转一次。
- 未传 `id` 的两个面板在 group 内独立开合（兜底 id 稳定性回归，见 §2.2 注）。

## 8. 设计决策记录

原始描述审查修正项：

1. `.mu-flex-space` 不存在 → 改用现有原子类 `.flex-space`（项目原子类无 `mu-` 前缀）。
2. `.is-expanded` / `.is-disabled` 状态类不符项目惯例 → 改为 `[expanded]` / `[disabled]` attribute（menu-group、dropdown-item 先例）。
3. 逻辑引用 `props.defaultExpanded` 但 Props 清单缺失 → 补 `defaultExpanded?: boolean`。
4. `gap: 8px` 硬编码 → `var(--mu-base-spacing)`（root.scss 中恰为 8px）。
5. `.mu-collapse__title` 补 `flex: 1 1 0`：flex item 默认不伸展，仅 ellipsis 无法实现两端对齐 + 截断。
6. `<mu-icon ...>...</span>` 尾部笔误 → 自闭合；`expanded` 非 prop，按惯例 `:expanded="isExpanded || null"` 透传。
7. 子元素类名采用 BEM element 风格 `mu-collapse__xxx`（`mu-form-field__label`、`mu-menu-item__icon` 同款惯例）；内部变量统一 `--mu-collapse_header_height` 下划线连接（`.mu-menu-item_height` 同款）。`mu-collapse-group` 为独立组件根类名，保持不变。

第二轮审查修正项（2026-10-14，附浏览器实测）：

8. **`grid-template-rows: 0fr` 收起不干净** → 改 `minmax(0, 0fr)` / `minmax(0, 1fr)`。裸 `0fr` 下 grid item 自身 `padding: 8px` 计入轨道贡献，实测收起态轨道 `16px`（`overflow: hidden` 写在 item 上亦无效）；`minmax(0,·)` 后实测 `0px`。
9. **`transition: visibility` 写错元素** → 移到 `.mu-collapse__body`（与 `visibility` 声明同元素）。原写法 transition 在 `.mu-collapse__content`，该元素自身无 `visibility` 声明，是继承值变化，行为不可控（实测展开晚一帧可见）。
10. **`useId()` 不可在 computed 内调用** → 改为 setup 顶层取一次兜底 id。`useId` 内部 `i.ids[1]++` 自增，computed 每次重算产出新值，id 漂移且多面板可能撞同值。
11. **受控判定不可用 `props.expanded`** → 改读 `getCurrentInstance().vnode.props`。model 声明了默认 `[]` 后 `props.expanded` 恒有值，判定永远命中"受控"。
12. **`arrow` 须声明 `default: undefined` 的理由写错**（原文称"未声明时默认 `false`"）→ 实测 Boolean prop 未传且无 default 时为 `undefined`，declared 与不 declared 行为一致；写成 `default: undefined` 仅作自解释。
13. **删掉 group 级 `arrow` prop**（用户确认）→ 箭头显隐由各面板自身 `arrow` 决定；§2.3 的"只可加严"规则收窄为仅 `disabled`。
14. **伪代码 `group.expanded` 缺 `.value`** → 统一补齐；并明确 `mu-collapse` 自身的 `expanded` model 与 group 的同名 ref 是两回事，只在 standalone 分支引用。
15. **`provide` 契约补齐**（字段清单、ref 语义、为何不直接 provide `props`）。
16. **验证断言修正**：`getComputedStyle().gridTemplateRows` 收起态是 `0px` 而非字面 `0fr`，且须在 200ms 过渡结束后读；补边框合并的三段式断言与兜底 id 稳定性回归。
17. **默认值缓存措辞修正**：方案初稿曾写"多实例共享默认数组引用"，实测 `propsDefaults` 为实例级，各实例各调一次工厂 → 该理由不成立，改以"受控数组来自父状态、禁止就地改"作为非破坏性赋值依据。
18. **补组件整体骨架**：原文只有 header 片段与 style 选择器，未给出 `.mu-collapse` 根元素结构（header / body / content 三层套法），实施时易各自发挥 → 补完整模板骨架。
19. **补 `#header` 与 prepend/append 互斥说明**：prepend/append 是 `#header` fallback 内的出口，提供 `#header` 即整体不渲染，需写明避免误用。
20. **受控判定收窄为只看 `expanded`**：原文 `'onUpdate:expanded' in rawProps || 'expanded' in rawProps` 会把"只监听不绑定"误判为受控，导致 `defaultExpand` 被跳过；改为 `'expanded' in rawProps`。
21. **accordion 由"约定"改为"收敛 + 渲染硬保证"**（用户确认）：挂载时 `expanded.length > 1` → 写回 `[首元素]`；渲染层同时以 `expanded[0] === itemId` 判定展开，不依赖模型值被成功收敛（受控下父组件可能不接受 emit）。
22. **`id` 说明改为讲清"何时才必须传"**：原文只说"需程序化控制时必须显式传"，未解释何为程序化控制、为何兜底值不可引用 → 补 `id` 的两处用途与判断信号。
23. **补 `.mu-collapse__content` 这层的存在理由并去掉 `min-height: 0`**：该层不可省的决定性理由不是"放 padding"，而是**保证只有一个 grid item** —— 单条 `grid-template-rows` 只约束首个直接子元素，插槽多根元素时第 2 个起落进隐式 `auto` 轨道，实测收起态残留 40px；`__content` 把任意插槽内容收敛成单 item。同时实测 `minmax(0,·fr)` 下 `min-height: 0` 冗余（带不带都是 `0px`），已删除以免误导。
24. **`#header` 作用域 `expanded` 补语义、用法与验证**：明确传的是**实际渲染态** `isExpanded`（响应式、`disabled` 时为 `false`），与 `.mu-collapse[expanded]` 同源；补"自定义 Header 时插槽是唯一状态通道"（箭头在 fallback 内、会被替换掉）；补两种正确写法示例。
25. **点名 `#header` 双重 toggle 陷阱**：容器已绑 `@click="toggle"`，自定义内容若再绑不带 `.stop` 的 `@click="toggle"`，一次点击 toggle 两次、净效果不变（面板"点不动"，静默无报错）。方案原文只含糊提过"不需要时 `stopPropagation`"，未点出这是**默认踩坑**，已改为显式警告 + 可回归的断言。

第三轮审查修正项（2026-10-14）：

26. **header 高度改为内容驱动**（用户要求）：删 `--mu-collapse_header_height` 变量与 `min-height: 40px` 钳制，高度由 header 内容决定（多行 / 自定义 `#header` 内容随高增长）；`padding` 由 `0 8px` 改四向 `var(--mu-base-spacing)`，单行 title 下 ≈ 37px，接近原 40px 视觉重量。§8-7 所述 `--mu-collapse_header_height` 下划线命名先例随变量删除失效，仅作历史记录；title 仍为单行 ellipsis 截断（§2.2 已确认的 API，不随高度策略改变）。
27. **`defaultExpand="first"` 空组崩溃**：group 无子面板时 `items.value[0].id` 为 TypeError，补空数组守卫（§3.4）；`'all'` 的 `map` 空数组下安全，无需改。

实施修正项（2026-10-14，浏览器实测发现，已修复并回归验证）：

28. **`Boolean` prop 未传经布尔转换为 `false`，推翻 §8-12 / §2.2 原论断**：初稿称"未声明 default 时未传即 `undefined`"是错的——Vue 对 `Boolean` 类型 prop 未传且无 default 时值为 `false`。后果：`arrow` 恒 `false`（箭头不渲染）、standalone `expanded` model 恒 `false`（`?? defaultExpanded` 被切断、受控 `false` 无法区分）。修复：`arrow` prop 与 `expanded` model 均显式 `default: undefined`。
29. **group 的 `defineModel` 漏 prop 名**：`defineModel({ type: Array })` 默认绑 `modelValue`，demo 的 `v-model:expanded` 落到未声明的 `expanded` attr 上，group 全部联动失效（accordion 收敛不触发、面板全收拢）。修复：`defineModel('expanded', { type: Array, default: () => [] })`。教训：具名 model 必须带第一个字符串参数，逐字核对。

第四轮修改项（2026-10-14，实施后用户调整）：

30. **去掉面板边框**：`.mu-collapse` 移除 `border` / `border-radius`（及 `--mu-border-color-normal`、`--mu-radius-panel` 引用），边框合并规则（`.mu-collapse-group > & + &` 等）随边框删除一并移除；§8-16 的边框合并三段式断言作废。外观边框交由使用方自定义。
31. **`__header` 类名改 `__head`**（模板 + 样式 + 文档同步），与 `mu-collapse__head` 命名对齐。
32. **`__title` 加粗**：`font-weight: 600`（项目先例：`.mu-form-field` 标签、popup-menu 组标题同值）。

第五轮修改项（2026-10-14，实施后用户调整）：

33. **外观改为开放式分割线模型**（推翻 §8-30 的"无边框裸面板"中间态）：
    - `.mu-collapse-group` 加 `border-top: 1px solid var(--mu-border-color-normal)`（组顶分割线）。
    - `.mu-collapse` 移除 `background`，仅保留 `border-bottom: 1px solid var(--mu-border-color-normal)`；无四周边框、无圆角、无相邻合并规则——standalone 与 group 通用，相邻项由上一项 `border-bottom` 自然分割。
    - `.mu-collapse__head` 左右 `padding` 归零（`padding: var(--mu-base-spacing) 0`），与外部父容器左右边缘齐平；`.mu-collapse__content` 同样左右归零（`padding: var(--mu-base-spacing) 0`），上下内边距仍由 `minmax(0, 0fr)` 下限在收起态归零。
    - §7 断言同步：分割线/零左右内边距/收起态高度 = head 高 + 1px 底边框。
    - demo 每组示例加外部容器边框（`padding: 32px`），用于直观验证与外部容器文档流的左右对齐。

第六轮修改项（2026-10-14，实施后用户调整）：

34. **`__content` 去掉全部 padding**：内容区与 head 一样完全交给外部文档流，上下间距不再由组件提供（`overflow: hidden` 收敛层职责不变，`minmax` 下限仍在但已无 padding 可归零，收起态高度回归纯粹 = head 高 + 1px 底边框）。§5.2 代码块、§7 断言 3 已同步；"padding 放 item 自身"的历史实测结论保留作决策记录。

人工确认结论（2026-10-14）：

1. `defaultExpand` 仅非受控时生效；受控（绑定 `expanded`）时忽略。
2. group 模式下子组件 `v-model:expanded` 忽略，group 全权管理。
3. `disabled` 采用 `||` 合并（组级禁用不可由子组件解除；子组件只可加严），且 disabled 为真时渲染收拢态、`isExpanded` 恒 `false`。
4. accordion 下 `defaultExpand="all"`：dev 警告并取第一个面板展开。
5. group 不提供 `arrow` prop；箭头显隐由面板自身 `arrow` 决定。
6. accordion 初始传入多个 id → 收敛为 `[首个元素]` 并 `emit update:expanded`；同时渲染层以 `expanded[0]` 为准做互斥硬保证（受控下父组件不接受 emit 时模型值不收敛，但显示仍只开一个）。
7. `id` 不强制显式传；只有父组件需自行构造 `expanded` 定位面板时才必须传（§2.2）。
