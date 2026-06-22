# JavaScript → TypeScript 全量迁移方案

| 项目 | 内容 |
|---|---|
| 状态 | 草案，待评审 |
| 范围 | `src/` 全部 `.js` 与 `.vue` 文件（91 个 JS + 70 个 Vue）|
| 不在范围 | `demo/`、`vite.config.js`（保留 JS，可选后续单独迁）、`dist/` |
| 目标 | `strict: true` + `vue-tsc --noEmit` 进构建流水线；所有源码 `.ts` / `<script setup lang="ts">` |
| 预估工作量 | 单人 **5–6 个工作日**（含调试，不含补自动化测试）|
| 技术基线决策 | ✅ 全量 strict TS · ✅ Table 模块临时 `any/unknown` 放过 · ✅ 仅 demo 手工基线 |

---

## 1. 现状

### 1.1 代码盘点

| 维度 | 数据 |
|---|---|
| 规模 | JS ~4,572 行（91 文件） + Vue ~6,044 行（70 文件）≈ 1.06 万行 |
| Vue 版本 | 3.5.13 |
| API 风格 | **94% 已是 `<script setup>`**（66 setup / 7 普通 `<script>`）|
| 既有 TS 基础 | **零**（无 typescript / vue-tsc / @vue-tsc，无 .d.ts，仅 7 处 JSDoc）|
| 构建工具 | Vite 8 + rolldown（UMD 输出），esbuild 天然支持 TS |
| Lint | ESLint `standard` + `plugin:vue/vue3-recommended` |
| 测试 | 无自动化测试，靠 demo 页面手工验证 |
| 依赖 | 全部原生支持 TS（vue / vite / valibot / throttle-debounce / change-case / svgo / @tabler/icons）|

### 1.2 7 个非 `<script setup>` 组件的特殊性

其中 3 个是 Options API、4 个用 `<script>` 但内部仍是 setup 风格：

| 文件 | 形态 | 迁移处理 |
|---|---|---|
| `layout/flex-box.vue` | `export default { props, computed }` | 改 `defineComponent` + `lang="ts"`，或顺手转 `<script setup>` |
| `layout/h-box.vue` / `layout/v-box.vue` | `export default { extends: FlexBox, props }` | 同上，`extends` 在 `<script setup>` 下用 `defineComponent().extend()` 或保留 Options |
| `table/table.vue` / `table/table.virtual-scroll.vue` / `table2/big-table.vue` / `scrollbar/scroll-box.vue` | `<script>`（非 setup）| 逐个确认是否有不能用 setup 的原因；无则一并转 setup |

> 决策：**这 7 个统一在阶段 4 处理**，单独列任务，不混入批量推进。

### 1.3 难点清单（按风险排序）

| # | 难点 | 位置 | 影响 | 处理 |
|---|---|---|---|---|
| 1 | DOM 扩展属性 `el[SYMBOL] = {...}` | `scrollbar/scrollbar.js`、`scrollbar/attach.js`、`events/touch/touch.js` | strict 下 HTMLElement 索引签名报错 | **重构为 `WeakMap<HTMLElement, Ctx>`**（见 §3.1）|
| 2 | 17 处 `provide` / 22 处 `inject` 字符串 key | 全局 | 推断成 `unknown`，无类型保护 | 抽 `src/injection-keys.ts`，用 `InjectionKey<T>` 包装（见 §3.2）|
| 3 | Table 列类型动态渲染联合 | `table/column-types/*.js`、`table2/` | 建模费时（约半天）| **本次用 `any/unknown` 放过**，列入后续独立任务（见 §3.3）|
| 4 | `__version__` / `__env__` 编译期常量 | `src/env.js`、`vite.config.js:48` | strict 报错 | 在 `src/env.d.ts` 补 `declare const`（见 §3.4）|
| 5 | 无测试兜底 | 全局 | 类型签名改动可能引入回归 | **demo 手工基线**：每迁一个目录跑对应 demo（见 §6）|

---

## 2. 目标与非目标

### 目标
1. `tsconfig.json` 启用 `strict: true`，全量通过 `vue-tsc --noEmit`。
2. 所有 `.js` → `.ts`，所有 `.vue` 的 `<script>` 加 `lang="ts"`。
3. `vue-tsc --noEmit` 接入 `package.json` scripts，作为构建前置检查。
4. `dist/` 产物附带 `.d.ts` 类型声明（供消费方获得类型提示）。

### 非目标
- **Table / Table2 的列类型不建模**，临时 `any` 放过，留作独立后续任务。
- 不补自动化测试（已确认走 demo 手工基线）。
- 不重构既有组件行为，纯类型化改造（必要的 `WeakMap` 重构除外，因其是 strict 阻塞项）。
- `vite.config.js` 暂不迁 TS（可选后续）。
- 不处理 `message*` 的 `v-html`（属另一改造方案 `icon-render-refactor.md` 范畴）。

---

## 3. 关键技术决策

### 3.1 DOM 扩展属性 → `WeakMap`（难点 1）

**现状**（`scrollbar.js`）：
```js
const SYMBOL = Symbol('mussel.scrollbar')
export function attach (el) {
  if (el[SYMBOL]) return          // ❌ strict: HTMLElement 无索引签名
  const ctx = el[SYMBOL] = {}
  ctx.elements.tracks.style...    // ❌ ctx 推断为 any，无保护
}
```

**改造后**：
```ts
// scrollbar/context.ts（新增）
export interface ScrollbarContext {
  ready?: boolean
  elements: { tracks: HTMLElement; trackX: HTMLElement; /* ... */ }
  hideTracksTimer?: number
  mutationObserver: MutationObserver
  remove?: () => void
  // ...
}
const ctxMap = new WeakMap<HTMLElement, ScrollbarContext>()

export function attach (el: HTMLElement) {
  const prev = ctxMap.get(el)
  if (prev) return
  const ctx: ScrollbarContext = { /* ... */ }
  ctxMap.set(el, ctx)
  // ...
}
export function detach (el: HTMLElement) {
  ctxMap.get(el)?.remove?.()
  ctxMap.delete(el)
}
```

涉及 3 个模块：`scrollbar/scrollbar.js` + `scrollbar/attach.js` + `events/touch/touch.js`（`gs.currentTouches` 同理用 `Map<number, TouchState>`）。

> 为什么不用 `declare global { interface HTMLElement { [SYMBOL]: ... } }`：symbol 作 key 在 lib.d.ts 上声明繁琐，且全局污染。`WeakMap` 自动随 DOM 卸载回收，更干净。

### 3.2 provide/inject 类型化（难点 2）

**新增 `src/injection-keys.ts`**，集中声明所有 key：
```ts
import type { InjectionKey, Ref, ComponentPublicInstance } from 'vue'

export interface MusselContext {
  rootElement: HTMLElement
  options: Record<string, unknown>
}
export const MUsselKey: InjectionKey<MusselContext> = Symbol('$mussel')

export interface ButtonGroupProps { disabled?: boolean; size?: string; /* ... */ }
export const ButtonGroupKey: InjectionKey<ButtonGroupProps> = Symbol('buttonGroup')

export interface SelectContext {
  mountOption: (o: OptionItem) => void
  unmountOption: (o: OptionItem) => void
  toggleOption: (o: { value: unknown; label?: string }) => void
}
export const SelectKey: InjectionKey<SelectContext> = Symbol('select')
// ... 共约 11 个 key
```

**消费端**：
```ts
// 改造前
const group = inject('buttonGroup', null)
// 改造后
const group = inject(ButtonGroupKey, null)
```

涉及 17 个 provide 点 + 22 个 inject 点，逐个替换。改动机械、范围明确。

> `'$mussel'` 这个 key 同时被 `app.provide` 和 `app.config.globalProperties` 使用（`src/index.js:19-21`），key 对象需兼顾两套 API。

### 3.3 Table 列类型：临时放过（难点 3）

`column-types/*.js` 的 `compile` 返回**判别联合**：
```ts
type CellRenderResult =
  | { text: unknown }
  | { class?: string; text: unknown }
  | { items: Array<{ is?: string; text?: unknown; attrs?: Record<string, unknown>; events?: Record<string, Function> }> }
```

本次方案**不建模**，统一标 `// @ts-expect-error TODO: column-types 类型建模，见后续任务` 或返回 `any`。表头/记录/列定义（`columns` prop）也走 `any[]`。

**单列后续任务**（写入项目 todo）：
- `docs/plans/` 新建 `table-column-types.md`
- 范围：`table/column-types/*` + `table2/` 的列渲染
- 预估：0.5–1 天

### 3.4 编译期常量声明（难点 4）

**新增 `src/env.d.ts`**：
```ts
declare const __version__: string
declare const __env__: 'development' | 'production'
```
`src/env.ts` 即可正常引用。

### 3.5 Props/Emits 类型化策略

项目大量抽离了 props 对象（`dropdown-wrapper.js`、`select.js`、`input.js`、`modal.js` 等）。迁移路径：

```ts
// 改造前（dropdown-wrapper.js）
export const dropdownProps = {
  dropdownPanel: Object,
  dropdownWidth: String,
  dropdownDisabled: Boolean,
  // ...
}

// 改造后（dropdown-wrapper.ts）
export interface DropdownProps {
  dropdownPanel?: object
  dropdownWidth?: string
  dropdownDisabled?: boolean
  // ...
}
```

消费端 `<script setup lang="ts">`：
```ts
// 改造前
const props = defineProps({ ...modalProps, width: [String, Number] })
// 改造后（泛型式，类型最准）
const props = defineProps<ModalProps & { width?: string | number }>()
```

> 注意：泛型式 `defineProps<T>()` 失去 `validator` 能力。**保留 validator 的组件继续用运行时声明 + `as PropType<...>`**；无 validator 的用泛型式。两种风格混用是 Vue 官方认可的做法。

---

## 4. 工具链改造

### 4.1 新增依赖

```bash
npm i -D typescript vue-tsc @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

版本约束：`typescript@^5.6`、`vue-tsc@^2.1`（与 vue 3.5 对齐）。

### 4.2 tsconfig.json（替换 jsconfig.json）

```jsonc
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitAny": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "useDefineForClassFields": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    // 渐进迁移期专用（阶段 0-4 开启，阶段 5 关闭）
    "allowJs": true,
    // 声明文件输出（供 dist/ 发布）
    "declaration": true,
    "declarationDir": "dist/types",
    "paths": {
      "@/*": ["./src/*"],
      "~icons/*": ["./node_modules/@tabler/icons/icons/*"]
    }
  },
  "include": ["src/**/*", "src/**/*.vue"],
  "exclude": ["dist", "node_modules"]
}
```

> `jsconfig.json` 删除（被 tsconfig 取代）。阶段 5 收尾时把 `allowJs` 改为 `false`。

### 4.3 .eslintrc 切换

```jsonc
{
  "root": true,
  "parser": "vue-eslint-parser",
  "parserOptions": {
    "parser": "@typescript-eslint/parser",
    "ecmaVersion": 2022,
    "sourceType": "module",
    "extraFileExtensions": [".vue"]
  },
  "extends": [
    "standard",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended"
  ],
  "plugins": ["vue", "@typescript-eslint"],
  "rules": {
    // 迁移期临时宽松（阶段 5 收紧）
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "off"
    // ...其余继承现有 .eslintrc 规则
  }
}
```

### 4.4 package.json scripts 增量

```jsonc
{
  "scripts": {
    "typecheck": "vue-tsc --noEmit",
    "build": "npm run typecheck && vite build --mode development && vite build --mode production"
    // build 前置 typecheck，CI 挡住类型回归
  }
}
```

### 4.5 Vite 配置

`vite.config.js` **基本不动**：
- esbuild 已支持 TS，无需加 `@vitejs/plugin-vue` 之外的插件
- `lib.entry` 改指向 `src/index.ts`
- 若需要 `.d.ts` 输出，加 `vite-plugin-dts`（**可选**，见 §7 未决问题 1）

---

## 5. 落地步骤（分阶段）

> 渐进迁移：`allowJs: true` 期间 JS/TS 共存，**每阶段结束跑一次 `npm run build` + 对应 demo**，确认无回归再进入下一阶段。

### 阶段 0：基建（~0.5 天）
| # | 动作 | 文件 |
|---|---|---|
| 0.1 | 装依赖：`typescript vue-tsc @typescript-eslint/*` | `package.json` |
| 0.2 | 新建 `tsconfig.json`（allowJs: true），删 `jsconfig.json` | 根目录 |
| 0.3 | 新建 `src/env.d.ts`（`__version__` / `__env__` 声明） | `src/env.d.ts` |
| 0.4 | 新建 `src/injection-keys.ts`（占位，逐个填充） | `src/injection-keys.ts` |
| 0.5 | `.eslintrc` 切 TS parser，规则临时宽松 | `.eslintrc` |
| 0.6 | `package.json` 加 `typecheck` script | `package.json` |
| 验证 | `npm run build` 通过；JS 文件零改动仍能编译 | — |

### 阶段 1：底层 utils（~1 天）
| 顺序 | 文件 | 难度 | 说明 |
|---|---|---|---|
| 1.1 | `utils/type.js` | 易 | 先迁，其他文件依赖它；`typeOf` 返回值用字面量联合 |
| 1.2 | `utils/dom.js` `utils/object.js` `utils/array.js` `utils/string.js` `utils/math.js` `utils/case.js` | 易 | 纯函数 |
| 1.3 | `utils/color.js`（320 行）| 中 | RGB/HSV 结构明确，建 `interface RGB { r,g,b }` |
| 1.4 | `utils/date.js`（175 行）| 中 | 日期格式化参数枚举 |
| 1.5 | `utils/h.js` `utils/style.js` `utils/size.js` `utils/key-builder.js` `utils/crypto.js` `utils/compatible.js` `utils/timer.js` `utils/prop.js` `utils/vue.js` | 易-中 | 逐个 |
| 验证 | utils 全部 `.ts`；`vue-tsc` 对该目录零报错；color/date demo 正常 | | |

### 阶段 2：events / icons / langs / colors（~1 天）
| 顺序 | 文件 | 说明 |
|---|---|---|
| 2.1 | `events/interceptor.js` `events/custom-event.js` `events/resize.js` | 纯逻辑 |
| 2.2 | `events/touch/touch.js`（196 行）+ recognizers | **用 `Map<number, TouchState>` 替换 `gs.currentTouches`** |
| 2.3 | `icons/index.js` + `icons/*.js` | icon 注册表 `Record<string, IconDef>` |
| 2.4 | `langs/index.js` `langs/en.js` `langs/zh.js` | 语言包 `Record<string, unknown>` 嵌套 |
| 2.5 | `colors.js` | 调色板生成，`BASE_COLORS` 等用 `Record<string, string>` |
| 2.6 | `env.js` `index.js` | 入口，最后改 |
| 验证 | 全量 `npm run build` + 跑 icons/colors/lang 相关 demo | |

### 阶段 3：composable 抽离层（~1 天）
| 文件 | 关键改造 |
|---|---|
| `dropdown/dropdown-wrapper.js` | 抽 `DropdownProps` 接口，`useDropdown(props, emit, options)` 加泛型 |
| `form/select.js` `form/multi-select.js` | `SelectContext` 接口（与 §3.2 的 `SelectKey` 对齐）|
| `form/input.js` `form/validation.js` | `InputProps`、表单校验返回类型 |
| `modal/modal.js` | `ModalProps` / `ModalEmits` |
| `scrollbar/scrollbar.js` `scrollbar/attach.js` | **重点：`WeakMap` 重构（§3.1）** |
| `table/table.js`（若有抽离）| 临时 any |
| 验证 | `vue-tsc` 对 composable 层零报错；dropdown/modal/scrollbar demo 正常 |

### 阶段 4：Vue 组件（~2 天）

**批量推进顺序**（按依赖深度从浅到深）：

```
layout/（含 3 个 extends 组件，先做）
  → button/  badge/  tag/  bar/
  → list/  tree/  tabs/
  → calendar/  form/
  → dropdown/  modal/  message/
  → pagination/  scrollbar/  common/
  → icon/  svg/
  → table/  table2/（最后，用 any）
```

每个组件的标准改造：
1. `<script setup>` → `<script setup lang="ts">`
2. `defineProps({...})` → `defineProps<T>()` 或保留运行时声明加 `PropType`
3. `defineEmits([...])` → `defineEmits<{ (e: 'xxx', v: T): void }>()`
4. `ref(x)` → `ref<T>(x)`（必要时）
5. `inject('key')` → `inject(Key, default)`
6. `shallowRef()` 无初值的补类型参数：`shallowRef<HTMLElement>()`

**7 个非 setup 组件**单独任务处理（见 §1.2），逐个判断能否转 setup。

| 验证 | 每迁完一个目录，跑该目录对应 demo；阶段末全量 build + 全量 demo 回归 |

### 阶段 5：收尾（~0.5 天）
| # | 动作 |
|---|---|
| 5.1 | `tsconfig.json` 关 `allowJs`（改 false），确认全量 `.ts`/`.vue` |
| 5.2 | `.eslintrc` 收紧：`@typescript-eslint/no-explicit-any` 改 `error`（**Table 模块单独加 `// eslint-disable` 或 overrides 放过**）|
| 5.3 | `npm run typecheck` 全量通过，接入 build 前置 |
| 5.4 | 若要发布 `.d.ts`：加 `vite-plugin-dts`，配置 `dist/types` 输出 |
| 5.5 | 更新 `CLAUDE.md` Tech Stack 表：「语言 JavaScript（无 TypeScript）」→「TypeScript（strict）」|
| 5.6 | 更新 `docs/vue-style-guide.md`：补 `<script setup lang="ts">` 范例 |
| 5.7 | 把「Table 列类型建模」写入 `todo.md` 或新建 plan 文档 |
| 验证 | 全量 typecheck + build + demo 三通过 |

---

## 6. 回归验证（demo 手工基线）

由于无自动化测试，**每阶段结束必须跑对应 demo**。建议维护一份回归清单：

### Demo 回归清单（按组件族）
- [ ] **layout**：h-box/v-box 排列、split-h-box 拖拽收拢、flex 各属性
- [ ] **button**：primary/secondary/danger、pill、disabled、button-group 联动
- [ ] **scrollbar**：自动出现/隐藏、拖拽 thumb、track 点击（**WeakMap 重构重点验证**）
- [ ] **dropdown**：click/hover 触发、position、context-menu
- [ ] **modal**：dialog 打开/关闭/拖拽/最大化、message/message-box
- [ ] **form**：input/select/multi-select/check/radio/date-input、校验提示
- [ ] **calendar**：月份选择、日期范围
- [ ] **table**：排序、勾选、虚拟滚动、列类型渲染（text/check/bool/date/number/link/tag/img）
- [ ] **tree**：展开/收拢、节点勾选
- [ ] **tabs**：切换、tab-bar 滑动
- [ ] **pagination**：翻页、页大小切换
- [ ] **icon**：所有内置图标、cls 模式、animation
- [ ] **颜色系统**：切换 primary/danger、dark mode

### 构建验证
- [ ] `npm run build` 产出 `dist/mussel.js` + `mussel.min.js`，体积与迁移前偏差 < 5%（TS 类型不进产物）
- [ ] `npm run typecheck` 零报错

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| `WeakMap` 重构引入 scrollbar/touch 行为回归 | 中 | 高 | 该模块迁移后**单独深度验证**（拖拽、滚动、手势），列为阶段 3 重点 |
| provide/inject key 替换遗漏导致运行时 undefined | 中 | 中 | 替换时全量 grep `inject('` / `provide('`，确认无字符串 key 残留；`typecheck` 能挡住类型不匹配 |
| Table 临时 any 掩盖真实 bug | 低 | 低 | `// @ts-expect-error` 标注 + 后续任务追踪；阶段 5 eslint overrides 圈定范围 |
| `defineProps<T>()` 丢失 validator | 中 | 中 | 保留 validator 的组件用运行时声明 + `PropType`，不强制全用泛型式 |
| Vue SFC 模板表达式类型报错（`vue-tsc` 对模板检查严格）| 中 | 低 | 模板里复杂表达式抽成 computed；必要时 `// @vue-ignore` 局部放过 |
| 渐进迁移期间 JS/TS 混合，type-import 语义混乱 | 低 | 低 | `verbatimModuleSyntax: true` 强制 `import type`，阶段 0 一次配好 |
| 体积增长（误把类型工具带入产物）| 低 | 低 | `isolatedModules` + esbuild 自动剥离类型；build 后核对产物体积 |

---

## 8. 回滚策略

- 全程在**独立分支**（如 `ts-migration`）进行，每阶段一个 commit / PR，便于二分定位回归。
- 阶段 0–2（utils + events + icons）改动纯增量、无行为变更，任何阶段可停。
- 阶段 3 的 `WeakMap` 重构是**唯一有行为风险**的改动——单独 commit，出问题可单独 revert 不影响其他迁移成果。
- 阶段 5 收尾前 `allowJs` 一直开着，任何时候发现某个组件迁移卡住，可暂时退回该文件为 `.js` 不阻塞整体。

---

## 9. 未决问题（需评审决策）

1. **是否发布 `.d.ts` 到 dist？** 若要，加 `vite-plugin-dts`（约 0.5 天配置）；若该库当前消费方都不依赖类型，可推迟。**倾向：本次一并加上**，提升消费方 DX。
2. **3 个 `extends` 组件是否借机转 `<script setup>`？** `flex-box` / `h-box` / `v-box` 用 Options API 仅因 `extends`。转 setup 需把 `extends` 改为组合 props，改动小但需验证。**倾向：保留 Options + `defineComponent`**，降低风险，不混入行为变更。
3. **`vite.config.js` 是否一并迁 TS？** 当前 JS 工作正常，迁 TS 收益有限。**倾向：本次不动**，留作独立任务。
4. **`table2/` 是否废弃？** 与 `table/` 功能重叠，若废弃则阶段 4 的 table2 部分可跳过，省 0.5 天。**需作者确认 table2 的去留**。
5. **strict 的 `noUncheckedIndexedAccess` 是否开启？** 该选项会把 `arr[i]` 推断为 `T | undefined`，类型更严但改造量大。**倾向：本次不开**，作为后续收紧项。

---

## 10. 后续任务（本方案不涵盖）

| 任务 | 来源 | 预估 |
|---|---|---|
| Table 列类型建模（`column-types` 判别联合）| §3.3 | 0.5–1 天 |
| `noUncheckedIndexedAccess` 收紧 | §9.5 | 0.5 天 |
| `vite.config.js` 迁 TS | §9.3 | 0.5 天 |
| 补 vitest 单测（utils 起步）| §6 风险 | 1–2 天 |
| Table/Table2 合并（若 table2 废弃）| §9.4 | 视情况 |
