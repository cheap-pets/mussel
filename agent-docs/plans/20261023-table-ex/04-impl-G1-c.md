# 实施记录 — G1-c（cell-painters.js + 对应自检）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/table-ex/cell-painters.js` | G1-c | 单元格绘制适配器：`prepareColumn`（列准备，table.vue:164-178 同款：resolveColumnType + `_text/_value` 均 ensureFn + `compile ? compile : render||type` + placeholder 继承）、`resolveCellContent`（取值链 `_text(record)` → `_value(record) ?? record[field]` → `render({ record, recordNumber, value, emit })`，剔除 class/style/title DOM 通道字段）、`drawCell`（text 直绘含省略号截断与列 align；items 落地 check/link/tag/img；未识别 is 且 text != null 按文本绘制=decisions「[I1 前]⑤」；空值落 placeholder，对齐 `??` 语义）、`getImageEntry`（img 缓存读取）。img 经 `Image` + `crossOrigin='anonymous'`，加载中/失败按空格，onload 回调一次由 painter 触发重绘 |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | G1-c | G0 占位填充为 14 条断言，覆盖 G1-c 判据全部条目（见下"判据对照"） |

### G1-c 判据对照（02-design.md 实施步骤）

| 判据条目 | 断言 |
|---------|------|
| 离屏 canvas 各类型 painter 非空像素 | 「各类型离屏绘制非空像素」10 种类型逐一 getImageData 计 alpha>0 像素；link/tag/check/multiline 另有独立像素断言 |
| 取值链 text→value→field（含 value 传字符串） | 「取值链：text 覆盖 → value 函数 → record[field] → 空」+「value 传字符串不抛错且按字面取值」 |
| rec_no 的 recordNumber | 「rec_no：recordNumber 经 render 落地」（42 与 offset+1 两态） |
| check disabled | 「check：disabled 经 ensureFn 判定，置灰与非置灰像素不同」（attrs.disabled 判定 + 像素差异） |
| enum mapping 文本 | 「enum：mapping 文本、对象形式与 default 兜底」 |
| number/currency/date 格式化文本 | 「number/currency：千分位与货币格式化文本」+「date/datetime：格式化文本」 |
| 自定义类型对象 render 返回 text | 「自定义类型对象/函数：render 返回 text、DOM 通道字段剔除、emit 透传」（对象 + 函数两种自定义类型） |
| link/tag/items 落地 | 「link/tag：items 落地」+「multiline/lineClamp：div items 按文本落地不空白（decisions ⑤）」 |

### decisions.md「[I1 前]⑤」落实

multiline/lineClamp 列在 lineClamp>1 时经 TextColumn 返回 `[{ is: 'div', text }]` items；`resolveItemKind` 对未识别 `is` 且 `item.text != null` 的条目按普通文本绘制，避免单元格空白。自检断言含像素级反证（若 div 被忽略则为 0 像素）。

### 模块接口（供 G2-a painter / S1 调用）

- `prepareColumn(column, { placeholder })` → 内部列（`_raw/_align/_text/_value/_render/placeholder`）；A8 列准备（compile/render 构建）归属本模块，watch(columns) 后由 painter/S1 逐列调用。
- `resolveCellContent(col, { record, recordNumber, emit })` → `{ text }` 或 `{ items }` 或 `{}`（空内容 → drawCell 落 placeholder）。
- `drawCell(ctx, { col, record, recordNumber, emit, rect, theme, onImageLoad })` → 返回内容解析结果；只画内容，背景/网格线由 painter 负责；部分可见格的 clip 由 painter 负责（本模块仅对 img 绘制自身收进单元格内边距与右缘）。
- `getImageEntry(src)` → `{ image, status }` | null（painter/自检读取 img 加载状态）。
- 主题隔离（A8）：不 import theme.js/layout.js，颜色/字号/内边距全部经 `theme` 快照参数（字段同 theme.js `readSnapshot`：textColor/borderColor/borderColorStrong/hoverBg/primaryColor/gray/fontSize/fontFamily/cellPadding 等）。

## 偏离

无设计偏离。以下为实现级补充（设计未定项，供后续步骤知悉）：

1. **items 类别判别键**：check 与 multiline 的条目 `is` 均为 `'div'`（check.js:12、text.js:23），设计 A4 只写"按条目 is 落地"未定判别键。实现按列类型写入的 DOM class 标记判别：class 含 `mu-table__cell-check` → check、含 `mu-tag` → tag、`is === 'a'` → link、`is === 'img'` → img，与列类型内部实现解耦。
2. **check disabled 置灰底衬**：DOM 版为 `--mu-bg-strong`（style.scss:32），但 G1-a 已合入的 `readSnapshot` 快照无该字段且 theme.js 不在本组白名单；置灰以 `--mu-gray-translucent`（快照 hoverBg）底衬 + 灰色 ✓ 呈现，符合设计"置灰"要求。如需像素级对齐 DOM，需 S1 集成时给快照补 `bgStrong` 字段。
3. **视觉常量镜像现有 DOM 规格**（非新增设计值）：check 方框 16px/圆角 4px/✓ 12px（`table/column-types/style.scss` .mu-table__cell-check）；tag pill 高 20px/水平内边距 8px/字号 12px/圆角 4px（`src/styles/tag.scss` .mu-tag，`--mu-radius-control` = 4px 经 root.scss:144 核对）；items 条目间距复用 `--cell-padding`（theme.cellPadding）。设计 A4 只固定了 tag 的底/边框色（--mu-gray-translucent / --mu-border-color-normal），未定其余度量。
4. **自检的 img 失败路径**：断言止于"进入 loading、未绘制、不抛错"（同步断言边界，runChecks 不支持异步）；加载完成→onImageLoad→重绘联动属 painter 集成行为，留 G2-a/S3（断言 detail 已注明）。

## 自检

| 检查 | 命令/方式 | 结果 |
|------|----------|------|
| 编译 | `npx vite build --config vite.demo.config.js`（一次性，与 watch 进程并存） | 通过：✓ built in 575ms，无报错；`demo/dist/data/table-ex/main.js` 28.43 kB → 100.93 kB（含本模块与列类型管线） |
| demo 自检执行 | playwright 访问 `http://localhost:3000/data/table-ex/`，DOM 断言自检面板 | **cell-painters 模块 14/14 全部通过**；整页 43 条中 41 过 2 失败（失败 2 条均为 `[theme]` 模块，属 G1-a 白名单，见"遗留"）；页面 console 0 errors |
| stylelint | `npx stylelint src/components/table-ex/*.scss` | 不适用：本步骤无 scss 改动 |
| eslint | — | 项目未安装 eslint（package.json 无相关依赖，npx 解析失败），无法执行；以构建 + 浏览器执行代替 |
| `npm run build` | — | 未执行：全局库构建属 S2 集成步骤（并行组规则：不跑影响全局的命令） |

## 遗留

1. **theme 模块（G1-a）2 条自检失败**（非本组白名单，仅报告不处理）：本机浏览器将 `--mu-gray-translucent`（rgb(from ...) 相对色）求值为 `color(srgb 0.482 0.510 0.533 / 0.1)` 而非 `rgba()`，G1-a 自检断言写死 rgb()/rgba() 形态故失败。连带影响：theme.js `withAlpha` 的 rgba 解析正则同样匹配不到 color(srgb) 串（G2-a painter 覆盖层透明叠加会受影响）。本模块不受影响：drawCell 将颜色串直接透传 canvas fillStyle（canvas 接受 CSS color() 串），断言夹具亦用固定 rgba 串。**建议集成步骤统一裁决 color(srgb) 形态的解析/断言口径**（改 theme.js withAlpha + self-checks/theme.js，均在本组白名单外）。
2. img onload → 重绘联动、加载完成后像素绘制：留 G2-a（painter invalidateCell）+ S3 验证。
3. `window.__tableEx` 仍为 G0 占位、`getLayoutInfo/getThemeSnapshot` 未暴露：S1 契约（04-impl-G0.md 遗留节），与本模块无耦合。
