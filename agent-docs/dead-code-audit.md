# 死代码扫描报告

> 扫描日期：2026-09-21 · 范围：`src/**` · 入口：`src/index.js`（demo 与文档站均经包名/alias 指向它，src 无其他外部引用点）

## 扫描方法

自建 import 图分析（非工具依赖），覆盖：相对路径 / `@/` alias / scss `@use`、vue `<script>` 块、`export *` 与具名 re-export 链传递、`import * as ns` 动态取用。**解析前剥离 js 注释**——首轮未剥离曾把注释掉的导出（如 `layout/index.js` 的 `MuFlexSplitter`）误判为活引用，漏判死文件。

- 文件级：从入口 BFS 可达性，不可达即死文件。
- 导出级：全库统计 named import，沿 re-export 链传播，无消费者的导出为死导出；再按"定义文件内是否有第二处引用"区分纯死与导出冗余。
- 私有函数级：文件内定义、仅出现 1 次的符号，人工复核模板使用后确认库内无私有死函数。

## 1. 死文件（6 个，一条死链 + 一对残留）

| 文件 | 死因 |
|---|---|
| `src/components/list/list.vue` | `list/index.js` 只导出 MuListItem / MuListDivider，MuList 已移除但文件残留 |
| `src/components/list/list.scss` | 仅被 list.vue 引用，连带死 |
| `src/components/layout/flex-splitter.vue` | 唯一引用是 `layout/index.js:7` 注释行 `// export { default as MuFlexSplitter }`；demo/docs/docs-site/skills 均无使用痕迹 |
| `src/components/layout/flex-splitter.scss` | 仅被 flex-splitter.vue 引用 |
| `src/components/svg/index.js` | 只被 flex-splitter.vue import；`components/index.js:1` 的 `// import * as SvgComponents` 亦为注释 |
| `src/components/svg/svg-stripe.vue` | 仅被 svg/index.js re-export |

四个文件（svg/ + flex-splitter）为一条完整死链，可整体删除。

⚠️ 现役 `splitter.vue` / `splitter.scss` 渲染同名 `mu-flex-splitter` 类，但样式由 `splitter.scss` 自带（`.mu-flex-splitter` 定义于其 L5），删除 flex-splitter 文件不受影响。

## 2. 纯死导出函数（19 个：无跨文件 import，定义文件内也无调用）

| 文件 | 死函数 |
|---|---|
| `utils/case.js` | `camelCase`（kebabCase / pascalCase 在用） |
| `utils/color.js` | `mix` L138、`setAlpha` L158、`isBright` L164、`generateAdjacentColors` L255（其余色板函数被 setupColors 链使用，是活的） |
| `utils/crypto.js` | `generateUUID`（`generateHash` 在用） |
| `utils/date.js` | `filterDatesByMonth` L95、`yearEquals` L127、`weekEquals` L215 |
| `utils/key-builder.js` | `UUIDKeyBuilder`（`autoIncrementKeyBuilder` 在用） |
| `utils/object.js` | `pickBy` L17、`defaults` L33 |
| `utils/size.js` | `measureTextWidths` L24（resolveSize / resolvePixel 在用） |
| `utils/type.js` | `isType` L10、`isArray` L14、`isBoolean` L18、`isClass` L22 |
| `utils/vue.js` | `resolveAttrs` L60 |
| `components/form/input.js` | `useDebouncedRef` L137 |

## 3. 注释掉的死代码（2 处）

- `utils/vue.js` L38 起：`renderComponent` 整个注释块（连同未使用的 `createVNode, render` import 注释）。
- `components/tree/index.js` L3：注释掉的 `MuTreeNodes` 导出，指向已不存在的 `tree-nodes.vue`。

## 4. 导出冗余（5 处：代码同文件自用是活的，仅 `export` 多余）

- `colors.js:93` `specColorNames`
- `components/common/popup.js:17` `runPopupSequence`（同文件 popup runner 编排调用）
- `components/table/column-types/index.js:16` `ColumnTypes`（同文件 resolveColumnType 调用）
- `utils/date.js:69` `isLeapYear`
- `utils/type.js:56` `isIterable`（isEmpty 调用）

## 5. 假阳性甄别记录（勿重复排查）

以下经复核**不是**死代码：

- `index.js` 的 `install` / `installIcons` —— 公共 API，demo 使用。
- `env.js` 的 `version` —— 经 `export * from './env'` 暴露为包公共导出，`__version__` 由 vite define 注入。
- `events/touch/recognizers/*` 的 `pan` / `panx` / `pany` / `press` / `tap` —— 经 `import * as Recognizers from './recognizers'` 后 `Recognizers[gesture]` 动态取用。
- `components/bar/pagination.vue` 的 `jump` / `onSizeItemClick` / `middleText` —— 模板中使用（`@keydown.enter="jump"` 等），函数级扫描的 template 提取误报。

## 清理建议

1. 删除第 1 节 6 个文件、第 2 节 19 个死函数、第 3 节注释块；第 4 节按需去掉 `export`。
2. 清理后执行 `npm run build` 验证构建通过，demo 页面（rollup watch + :3000）回归 splitter / list 相关组件。
