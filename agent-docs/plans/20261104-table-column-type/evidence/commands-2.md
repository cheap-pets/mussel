# evidence：命令输出（verify-2，2026-11-04）

## npm run build（项目根）

exit 0。4 次 vite build 全部 ✓ built：
- base dev：283 modules，dist/mussel.css 118.21 kB、dist/mussel.js 415.04 kB
- base prod：283 modules，dist/mussel.min.js 224.77 kB
- ex dev：301 modules，dist/mussel.ex.js 677.82 kB
- ex prod：301 modules，dist/mussel.ex.min.js 315.93 kB

## demo 服务预检

- http://localhost:3000/data/table/ → 200
- http://localhost:3000/data/table-ex/ → 200
（服务已运行，直接访问，未自行启动打包）

## eslint（14 个改动文件）

0 error / 3 warning（max-len，均既有行：demo/src/data/table-ex/main-view.vue:217、self-checks/spans.js:336、demo/src/data/table/main-view.vue:16）。spans.js 本轮 git diff 改动区 :406-435，:336 未触及。

## stylelint（src/components/table/column-types/style.scss）

exit 0，clean。

## git status --short（范围核对）

```
 M demo/src/data/table-ex/main-view.vue
 M demo/src/data/table-ex/self-checks/cell-painters.js
 M demo/src/data/table-ex/self-checks/row-geometry.js
 M demo/src/data/table-ex/self-checks/spans.js
 M demo/src/data/table/main-view.vue
 M src/components/table/column-types/index.js
 M src/components/table/column-types/link.js
 M src/components/table/column-types/style.scss
 M src/components/table/column-types/text.js
 M src/components/table/ex/cell-painters.js
 M src/components/table/ex/editor.js
 M src/components/table/ex/interactions.js
 M src/components/table/ex/row-geometry.js
 M src/components/table/ex/table-ex.vue
 M src/styles/link.scss
?? agent-docs/plans/20261104-table-column-type/
?? agent-docs/plans/20261104-table-ex-measure-perf/
?? src/components/table/column-types/list.js
```

## 代码审查锚点

- src/components/table/ex/cell-painters.js:679-712：linkPaletteOf / linkTextColorOf / linkHoverColorOf——无 color/danger 条目回退 `theme?.colors?.primary` 谱系，hover 为 `palette?.hover ?? palette?.color ?? theme?.primaryColor`（R1-3，恢复 HEAD 口径）
- src/components/table/column-types/list.js:113：`const isLink = column.link === true`（列级单点，R1-1）；:12-14 缺省仅接受数组（A4）；:70/:95 payload `{ record, column: columnRef, item }`
- src/components/table/column-types/link.js:44-58：委托 ListColumn.compile，顶层 `link: true`、`_raw: column`，无自有渲染逻辑（A7）
- src/components/table/column-types/text.js:50：`if (!value || Array.isArray(value)) return null`（A2）；:44 注释 danger 不支持；:38/:11-27/:55 multiline/lineClamp 原样保留（A3）
- src/components/table/ex/cell-painters.js:219-226 isArrayValueRejected（A9：type null/''/字符串且非 link/list/tag/button 拒绝，非字符串 type 豁免）、:239 门控置于 _plainText 短路前
- src/components/table/ex/row-geometry.js:27-31 isLinkColumn 扩 list；:116 `if (Array.isArray(value)) return 1`；:340-341 `indicatesVariableMode = isLinkColumn(col) && count > 1`
- src/components/table/ex/editor.js:38 NON_EDITABLE_TYPES 含 'list'
- src/components/table/ex/table-ex.vue:1226 capped dots payload 键 `item`（link 时，tag/button 不变）；:994 applyItemCursor `item.link !== false` 门控（R1-4）
- src/components/table/ex/cell-painters.js:814 reportHitRect 附 `link: item.link !== false`；interactions.js:353 findHitItem 透传同谓词
- grep `drawArrayLines|GRAPHIC_ITEM_TYPES|isTextPresentingColumn` src demo/src → 0 命中（全删）
