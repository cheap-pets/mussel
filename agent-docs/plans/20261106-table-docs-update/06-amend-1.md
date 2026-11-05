VERDICT: AMENDED

## 检查项结论

1. 覆盖：验收标准 1–6 均有对应文档改动；6 由本轮 `npm run docs:build` 退出码 0 验证；无测试文件需求。
2. 事实一致：5 文件路径/符号均存在；对 `src/components/table/`（含 column-types/、ex/）逐项核对，发现并修正 11 处与源码不符（台账 1–11），无外部库接口引用。
3. 约定一致：沿用三处文档现有体例与 API 命名，未改动章节结构；SKILL.md 仅版本块与 frontmatter date 变更，符合 decisions（4.3.0 / 2026-11-06，package.json:3）。
4. 影响面：改动仅限 5 个指定文件；`docs/quick-reference_styles.md`、`skills/mussel-ui/references/styles.md`、`docs-site/guide/styles*.md` grep table 条目 0 命中，条件范围未触发。
5. 可实施：纯文档改动，构建通过。
6. 风险与回滚：无单向门；回滚 = 还原 5 文件。
7. 范围：未新增源码中不存在的特性，未改源码。
8. 切片：N/A（未切片）。

## 改动台账

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|------|------------|-----------|----------------|
| 1 | docs-site/components/table.md:333；skills/mussel-ui/references/components/data.md:153；docs/quick-reference_components.md:1655 | `true` 时「溢出 / 省略项显示文本提示」→「为单元格 / 省略项挂原生 title（`MuTableEx` 为溢出才显示的 tooltip）」 | DOM 版 title 恒挂在单元格与已渲染条目上，与是否溢出无关：`src/components/table/base/table-row.vue:71,76,91`；MuTableEx 仅溢出才弹：`src/components/table/ex/cell-paint/cell-tooltip.js:139,224` | 是 |
| 2 | docs-site/components/table-ex.md:318；data.md:318；quick-ref:1827 | 「`minWidth`（缺省 40）」→「`minWidth`（缺省取列类型最小宽，兜底 40）」 | 拖拽下限三级链 `col.minWidth ?? resolveTypeMinWidth ?? 40`：`src/components/table/ex/composables/use-column-resize.js:85`；类型最小宽 60/80/100：`src/components/table/ex/geometry/layout.js:17-32` | 是 |
| 3 | docs-site/components/table-ex.md:249；data.md:333；quick-ref:1842；data.md:320 | 「树形列 / `check` 列不参与合并」→「`spanMethod` 声明落在树形列 / `check` 列时丢弃（dev 警告）」；新增「`autoRowSpan: true` 取到对象 / 数组值时不产生合并（dev 警告）」；data.md `autoRowSpan` 行同步删除同一错误断言 | 丢弃仅实现在 spanMethod 路径：`src/components/table/ex/spans/spans-method.js:269-275`；autoRowSpan 无该守卫，只对非原始值警告：`src/components/table/ex/spans/spans-auto.js:87-101,178-183` | 是 |
| 4 | docs-site/components/table-ex.md:233；data.md:331；quick-ref:1840 | 「`'rest'` 占满至末列」→「占满至本列所在分区末列（固定列区 / 滚动区各自为界）」 | `partitionEnd = colIndex < fixed ? fixed : colCount`：`src/components/table/ex/spans/spans-method.js:215-232` | 是 |
| 5 | docs-site/components/table.md:146；data.md:167；quick-ref:1671 | `listOption.color` 由「条目缺省值」→ 注明「仅列级 `link: true` 时生效」 | `entryColorOf` 对非 link 列恒返回 null：`src/components/table/column-types/list.js:47-50` | 是 |
| 6 | docs-site/components/table.md:336；data.md:156；quick-ref:1659-1660 | `headerClass` / `headerStyle` 类型「String\|Function」→「String（静态值，不支持函数）」 | 表头直接绑定 `col.headerClass` / `col.headerStyle`，未 ensureFn（对照 `class` / `style` 有 ensureFn）：`src/components/table/base/table.vue:18-19,175-176` | 是 |
| 7 | docs-site/components/table.md:117 | 「`formatOption` / `locale`」→「`formatOption` / `locales`」 | number/currency 仅解构 `locales`：`src/components/table/column-types/number.js:6,32` | 是 |
| 8 | docs-site/components/table.md:146,148 | `listOption` / `linkOption` 参数表补 `class` / `style` | `src/components/table/column-types/list.js:104-107`；`src/components/table/column-types/link.js:23,52-55` | 是 |
| 9 | docs-site/components/table.md:130 | icon 列占位条件补「非 string」 | 非 string 值 warn 后落占位：`src/components/table/column-types/icon.js:52-59` | 是 |
| 10 | docs-site/components/table.md:149 | button 行补「`color` 超出回退缺省色」与「`caption` 为空且 `icon` 未注册的条目不渲染」 | DOM 4 色白名单：`src/components/table/column-types/button.js:19,41`；无效条目返回 null 被过滤：`button.js:52-54,96,102` | 是 |
| 11 | docs-site/components/table.md:296 | `cell-item-click` 载荷补「值为条目对象原引用」 | `src/components/table/column-types/list.js:70,95`；`tag.js:57`；`button.js:65` | 是 |
| 12 | docs-site/components/table.md:144 | 「竖排条目列（每项一行、超长省略）：」→ 区分 `list` / `link` 竖排、`button` 横排按钮组 | button 条目为 MuButton 横排组：`src/components/table/column-types/button.js:40-44,60-67` | 否 |

## 未解决异议（累计）

无。
