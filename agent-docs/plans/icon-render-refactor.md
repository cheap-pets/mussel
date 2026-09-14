# 图标渲染层改造方案（v-html → SVG sprite + `<use>`）

| 项目 | 内容 |
|---|---|
| 状态 | 草案，待评审 |
| 范围 | `mu-icon`、`mu-icon-button` 两个组件的 SVG 渲染路径 |
| 不在范围 | `message.vue` / `message-box.vue` 的 `v-html`（用户内容，需独立 sanitize 评估）|
| 目标 | 消除图标链路上的 `v-html`；收敛两条渲染路径；减小运行时数据体积 |

---

## 1. 现状

### 1.1 数据流

```
@tabler/icons .svg 文件
  → vite svg() 插件 svgo 优化为字符串            (vite.config.js:33-46)
  → src/icons/tabler-icons.js  导出 svg 字符串
  → src/icons/index.js install() 清洗 + 注册
        ├─ icon.svg = sanitizeHTML(icon.svg)     (src/icons/index.js:72)
        └─ icons[name] = { svg, cls?, animation? }
  → useIcon(props).data                          (src/components/icon/icon.js:27)
  → 消费端 v-html="data.svg"
```

### 1.2 两条分叉的渲染路径

| 组件 | 模板 | 备注 |
|---|---|---|
| `src/components/icon/icon.vue:9` | `<component :is="componentTag" v-html="data.svg" />` | 顶部带 `eslint-disable vue/no-v-text-v-html-on-component` |
| `src/components/button/tool-button.vue:8` | `<a ... v-html="iconData.svg" />` | 同样依赖 `useIcon`，但没加 eslint-disable |

两个组件都调用 `useIcon`，却各自 `v-html`，存在维护风险（如 animation 处理逻辑散落）。

### 1.3 cls 模式（icon font）

`parseIconValue` 对 `.fa.fa-home` 这类返回 `{ cls: '...' }`，**不进入 v-html 路径**，靠 `:class="data.cls"` + CSS 伪元素（`icon.scss:6 &::before/::after`）显示。本次改造**不能破坏 cls 模式**。

### 1.4 SVG 源的填充语义

抽样 `@tabler/icons`：

- outline：`fill="none" stroke="currentColor"`（如 `x.svg`、`chevron-up.svg`）
- filled：`fill="currentColor"`（如 `circle-check.svg`）

**全部依赖 `currentColor`，无硬编码色值**。sprite 模式下宿主设 `color` 即可继承，无需批量清理。

### 1.5 animation 机制

`icon.scss:17-60` 用属性选择器作用在 `> svg` 上：

```scss
.mu-icon[animation="spin"] > svg { animation: ... }
.mu-icon[animation="hover-rotate-180"] > svg { transition: ... }
```

sprite 模式下宿主是 `<svg>`、内容是 `<use>`，`> svg` 选择器**会失效**——必须改选择器。

### 1.6 当前 sanitize 在 icon 链路上的有效性

`sanitizeHTML` 只剥离 `onXxx=` 和 `<script>`（`src/utils/dom.js:31-35`）。而 icon 的 svg 字符串来自构建期 svgo 输出，**没有用户输入路径**，这里的 sanitize 属防御性冗余。改造后整条链路不再接触 `innerHTML`，可彻底移除 icon 链路上的 sanitize 调用。

---

## 2. 目标与非目标

### 目标
1. 移除 `icon.vue`、`tool-button.vue` 中的 `v-html`，连带移除对应的 `eslint-disable`。
2. 收敛为单一渲染路径（两个组件共用 sprite 注入 + `<use>` 渲染）。
3. 减小运行时体积：sprite 中每个图标只存一份 `<symbol>`，消费端只渲染一个 `<use>` 引用。
4. 保持 cls 模式、animation、size/danger/toggle 等现有行为完全不变。

### 非目标
- 不改 `install()` 的对外 API 形状（`icons` map 仍可被业务方查询）。
- 不改 `message*` 的 `v-html`。
- 不引入新的图标格式（仍只支持 svg / cls）。

---

## 3. 方案：SVG sprite + `<use>`

### 3.1 sprite 容器

模块级 lazy 单例，首次 `install()` 时注入到 `document.body`：

```js
// src/icons/sprite.js（新增）
let host = null
const symbols = new Map()  // id -> { hash, el }

function ensureHost () {
  if (host) return host
  host = document.createElement('svg')
  host.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
  document.body.appendChild(host)
  return host
}

export function addSymbol (id, svgString, hash) {
  const prev = symbols.get(id)

  if (prev) {
    // 内容相同 → 真幂等，跳过
    if (prev.hash === hash) return
    // 内容变了 → 覆盖：移除旧 symbol，重新注入
    prev.el.remove()
  }

  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml')
  const el = doc.documentElement
  const symbol = document.createElementNS(
    'http://www.w3.org/2000/svg', 'symbol'
  )
  symbol.setAttribute('id', id)
  // 透传 viewBox 等关键属性
  for (const attr of ['viewBox', 'fill', 'stroke', ...el.attributes]) {
    // 仅保留 viewBox，颜色交给宿主 color 继承
  }
  symbol.innerHTML = '' // 内部 path 直插
  ensureHost().appendChild(symbol)
  symbols.set(id, { hash, el: symbol })
}
```

> 注 1：实现时建议用 `<symbol>` 而非 `<g id>`——`<symbol>` 自带 viewBox，`<use>` 时不用重复声明。
>
> 注 2：`addSymbol` 用 `hash` 区分"真幂等"和"覆盖"——**不能**简单按 id 跳过，否则业务方 `install({ windowClose: 新svg })` 覆盖默认图标时，`icons[key]` 已更新但 sprite 里仍是旧 symbol，`<use>` 引用到旧内容，既不生效也不报错。原"按 id 幂等"的实现是这条覆盖路径的隐性 bug，本方案必须按内容判断。

### 3.2 install 改造

`src/icons/index.js` 内，对 svg 项追加 `symbolId`，并调用 `addSymbol`：

```js
// 改造前
if (icon.svg) icon.svg = sanitizeHTML(icon.svg)

// 改造后
if (icon.svg) {
  icon.hash = generateHash(icon.svg)      // 见下方约束：必须在所有环境计算
  icon.symbolId = `mu-i-${key}`           // 稳定 id，hash 不变即可
  addSymbol(icon.symbolId, icon.svg, icon.hash)
  delete icon.svg                          // 字符串不再需要保留
}
```

cls 项**不动**，保持 `{ cls: '...' }`。

> **⚠️ hash 必须在所有环境计算。** 当前 `solveIconHash` 被 `if (isDev) solveIconHash(...)` 包裹（`index.js:73`），生产环境不计算 hash，`icon.hash` 为 `undefined`。改造后 `addSymbol` 依赖 hash 区分"真幂等"和"覆盖"，如果生产环境 hash 缺失，第二次 install 同名图标会被当成"内容相同"跳过，覆盖静默失效。必须把 hash 计算从 `solveIconHash` 中拆出来，**无条件执行**；`solveIconHash` 的剩余逻辑（hashMap 维护 + dev 警告）仍可保留在 `isDev` 下。

### 3.3 useIcon / 消费组件改造

`icon.vue`：

```vue
<component
  :is="componentTag"
  :class="['mu-icon', data.cls]"
  :icon="icon"
  :animation="animation || data.animation">
  <svg v-if="data.symbolId" class="mu-icon__svg" aria-hidden="true">
    <use :href="`#${data.symbolId}`" />
  </svg>
</component>
```

`tool-button.vue`：

```vue
<a
  :class="['mu-tool-button', ...]"
  :icon="icon"
  :active="active || null"
  :animation="animation || iconData.animation"
  @click="onClick">
  <svg v-if="iconData.symbolId" class="mu-tool-button__svg" aria-hidden="true">
    <use :href="`#${iconData.symbolId}`" />
  </svg>
</a>
```

两个组件的图标渲染分支**结构完全一致**，为后续抽 `IconSvg.vue` 留出余地。

### 3.4 animation 选择器调整

`icon.scss` 把所有 `> svg` 改为作用于 svg 容器自身：

```scss
// 改造前
&[animation="spin"] > svg { animation: ... }
// 改造后
&[animation="spin"] .mu-icon__svg,
&[animation="spin"] .mu-tool-button__svg { animation: ... }
```

或更省事——直接作用在宿主 `[animation]` 上，反正动画属性不影响内部 `<use>` 引用。

### 3.5 sanitize 清理

- `src/icons/index.js`：删除 `import { sanitizeHTML }` 和调用。
- `src/utils/dom.js` 的 `sanitizeHTML` 保留（`message*` 还在用）。

---

## 4. SSR 考量

当前项目 `vite.config.js` 是 `lib` 模式输出 UMD，**未提供 SSR 入口**。改造后：
- `addSymbol` 内部 `document` 访问加 `typeof document !== 'undefined'` 守卫，避免业务方 SSR 时 install 报错。
- 真正的 SSR 需要把 sprite 输出到 HTML 字符串，作为后续独立任务。

---

## 5. 兼容性

| 关注点 | 处理 |
|---|---|
| 业务方通过 `install({ foo: '<svg>...' })` 自定义 icon | 仍支持，会自动注入对应 `<symbol>` |
| 业务方通过 `install({ foo: 'fa-home' })` cls 模式 | 不受影响 |
| `icons` map 仍可查询 | 保留导出，每项变成 `{ symbolId?, cls?, animation? }`（少了 `svg` 字段） |
| 业务方读取 `icons.foo.svg` | **破坏性变更**——需在 changelog 标注；如担心，可保留 `svg` 字段不删 |

> 建议：保留 `svg` 字段（不 delete），避免外部依赖。改造净增 `symbolId` 字段。

---

## 6. 风险

| 风险 | 概率 | 缓解 |
|---|---|---|
| `<use href>` 跨浏览器兼容 | 低 | Chrome/Edge/Firefox/Safari 全线支持相对 URL `<use href="#id">`（项目目标浏览器 ≥ chrome120，无问题） |
| sprite 容器在路由切换/HMR 时丢失 | 低 | 单例挂 `document.body`，HMR 时模块状态保留；如担心，可监听 reload |
| 多个 mussel 实例同页（微前端）sprite id 冲突 | 中 | `symbolId` 加版本/实例前缀（`mu-i-${version}-${key}`），或检测重复时跳过 |
| 动态 `install()` 时机晚于首次渲染 | 中 | `<use href="#不存在的-id">` 不报错，图标只是不显示；可加 console.warn |
| 覆盖默认图标后 `<use>` 未刷新 | 中 | 标准行为：替换 `<symbol>` 后，引用它的 `<use>` 在 Chrome/Firefox 自动重新引用；Safari 历史版本需验证。覆盖路径必须实机回归（见 §7 验证清单） |
| 覆盖场景下 hash 缺失导致静默失败 | 中 | hash 必须无条件计算（见 §3.2 约束）；改造时把 `generateHash` 调用从 `solveIconHash` 内拆出，不依赖 `isDev` |

---

## 7. 落地步骤

| # | 步骤 | 文件 | 验证 |
|---|---|---|---|
| 1 | 新增 `src/icons/sprite.js`，提供 `addSymbol` | 新文件 | 单测：addSymbol 幂等 |
| 2 | 改 `src/icons/index.js`：svg 项追加 `symbolId` + `addSymbol`，移除 sanitize 调用 | `src/icons/index.js` | 注册表项含 `symbolId`，DOM 出现对应 `<symbol>` |
| 3 | 改 `icon.vue`：`v-html` → `<svg><use/></svg>` | `src/components/icon/icon.vue` | demo 所有图标渲染正常 |
| 4 | 改 `tool-button.vue`：同上 | `src/components/button/tool-button.vue` | demo tool-button 渲染正常 |
| 5 | 改 `icon.scss` animation 选择器 | `src/components/icon/icon.scss` | loading / chevron 动画正常 |
| 6 | 移除 `icon.vue` 顶部 `eslint-disable`，验证 `.eslintrc:33 vue/no-v-html: 0` 是否仍需（message 还在用，保留） | `.eslintrc` | lint 通过 |
| 7 | 跑 demo 全量回归 | demo | 视觉对照截图 |

### 验证清单
- [ ] outline / filled 两种 icon 显示正常
- [ ] cls 模式 icon font 显示正常
- [ ] `loading`（spin）、`windowClose`（hover-rotate）、`treeNodeExpand`（expand-rotate）动画正常
- [ ] date-input / calendar / dropdown / message 等内部用到 tool-button 的组件视觉无回归
- [ ] 切换主题色（primary/danger）后图标颜色跟随
- [ ] 禁用态（`[disabled]`）样式正常
- [ ] 生产构建产物中能看到 sprite `<svg>` 注入
- [ ] **覆盖默认图标**：`install({ windowClose: 新svg })` 后，所有引用 `windowClose` 的位置都显示新图标（生产构建也要验证，不只是 dev）
- [ ] **重复 install 相同内容**：同名同内容图标重复 install 不重复注入 symbol（真幂等）

---

## 8. 回滚策略

改造集中在 4 个文件（新增 sprite.js + 修改 index/icon.vue/tool-button.vue/icon.scss）。如发现重大回归，单 commit 回滚即可；`icons` 注册表数据形态若保留了 `svg` 字段，回滚后下游零感知。

---

## 9. 未决问题（需评审决策）

1. **`svg` 字段是否保留？** 保留则零破坏，删除则更干净。倾向保留。
2. **`symbolId` 前缀策略？** 纯 `mu-i-${key}` 还是带版本前缀防微前端冲突？倾向后者。
3. **是否抽出 `IconSvg.vue` 公用组件？** 两个消费端结构一致，但当前只有 2 处，抽组件 ROI 不高，建议先观察。
4. **覆盖默认图标的语义如何对齐？** 业务方覆盖时是"替换 symbol 内容"还是"换 symbolId"？当前方案选前者（同 id 替换 symbol），保持 `icons[key].symbolId` 不变，`<use>` 无需感知；但需确认业务方期望——若期望"原默认图标保留 + 新图标并存"，则应分配新 symbolId。倾向前者（默认即替换）。
5. **hash 计算移出 `isDev` 后的体积影响？** `generateHash` 对每个 svg 调用一次，生产环境 icon 表通常几十到几百项，开销可忽略；但需确认不是一次性全量哈希（当前是逐项，OK）。
