# Pagination 页码按钮数自适应优化（常量估算 → 实测收敛）

| 项目 | 内容 |
|---|---|
| 状态 | **已实施（2026-10-07），Playwright 验证通过（§4）** |
| 范围 | `src/components/bar/pagination.vue` 的 `calcMaxPageButtonsCount` 计算逻辑及其触发时机；不改动模板结构、`pages` 生成算法（`pagination.vue:79-101`）与对外 props/events |
| 不在范围 | 档位上限 11 与降级文本模式（middleText）等现有产品决策；偶数档位（须改 `pages` 算法，见 §2.2）；`mu-button` / toolbar 样式 |

> 本版已对照代码逐条核对（行号、常量、bug），并修正测量公式、触发时机与验证章节。

---

## 1. 现状

容器 `@sizechange` 时按硬编码常量估算可容纳的页码按钮数（`pagination.vue:120-131`）：

```
可用宽 = clientWidth - 16 - (size下拉 ? 105 : 有pageSize ? 55 : 0) - (quickJumper ? 115 : 0)
t = 可用宽 / (btnWidth + 5) - 4        // btnWidth = size==='small' ? 28 : 32
档位 = t≥11 ? 11 : t≥9 ? 9 : t≥7 ? 7 : 0
```

## 1.1 问题

1. **常量已失真**：`small` 档按 28 算，但按钮 `min-width` 是 `--mu-control-height-small: 24px`（`root.scss:138`）；gap 按 5 算，实际 `.mu-pagination { gap: var(--mu-half-spacing) }` 为 4px；`-16`、`-4` 来源不明。主题改 control-height 变量即失效。
2. **i18n 失效**：105（"20 条/页"下拉）、55（"第 X 页"）、115（"跳至 __ 页"）是中文下的估算宽，英文/多语言及页码位数变化（共 100000 页）后误差大，溢出或浪费。（locale 仅安装期确定、不可运行时切换，故问题只在"常量按错误语言估算"，不涉及切换后重算。）
3. **size 判定不一致**：按钮实际尺寸取 `props.size || injectedToolSize`（`pagination.vue:66` provide 给子组件），计算只用 `props.size`（L124）——toolbar 注入 small 而组件未传 size 时按 32 算。
4. **watch 传参 bug**：`watch(() => props.size, calcMaxPageButtonsCount)`（L148）把新值字符串当 `event` 传入。throttle-debounce v5 的 `throttle(50, cb, { noLeading: true })`（`noTrailing` 默认 false）在 trailing 执行，50ms 后读 `event.target` 抛 TypeError，重算失败。
5. **依赖变化不重算**：`sizeOptions` 异步加载、`quickJumper` 切换、`total` 增长、`pageIndex` 翻页（页码窗口位数变化）、`toolSize` 注入，均不触发重算；仅容器 resize 与 `props.size` 变化触发（后者还因问题 4 失效）。
6. **档位选择依赖估算**：可容纳量算错即给错档；另 `sizeOptions.value ? 105 : …`（L125）对空数组判真（`[]` truthy），而模板按 `sizeOptions?.length` 判假 → `page-size-options: []` 时按"有下拉"多减 105。

## 2. 方案（推荐：实测法）

核心思路：放弃"用常量减出可用宽"，改为**渲染后测真实 DOM 宽度，再收敛档位**。i18n、主题变量、位数变化全部自动正确，不再维护常量表。

### 2.1 计算改为收敛循环

只比较"整行内容宽"与"容器内宽"，**不需要单独界定页码区**（模板无包裹元素，也不新增）：

```
recalc():
  if (destroyed) return
  const gen = ++generation
  for (const t of [11, 9, 7]) {
    maxPageButtonsCount.value = t
    await nextTick()
    if (gen !== generation) return              // 已有新一轮调用，本循环作废
    if (contentWidth() <= innerWidth()) return
  }
  maxPageButtonsCount.value = 0

contentWidth() = max(child.rect.right) − min(child.rect.left)   // 直接子元素
innerWidth()   = rootEl.clientWidth − paddingLeft − paddingRight
```

- **方向单一**：11 起向下收敛。上限即起点，"富余 ≥ 2 按钮宽则 +2"分支删除（它唯一作用是推回 11），9↔11 抖动不可能发生；每次 recalc ≤3 轮（≤3 次强制布局），套现有 50ms throttle 成本可忽略。
- **用 rect 跨度而非 ΣoffsetWidth**：`offsetWidth` 不含 margin，而 `> label`、`> .flex-divider` 各有 `margin: 0 var(--mu-half-spacing)`，漏算会高估可用宽 → 档位偏多仍溢出。rect 跨度天然含 gap 与 margin。
- **不用 `scrollWidth` 判溢出**：`justify-content: center` 下起点侧溢出不计入滚动区，`scrollWidth` 可能等于 `clientWidth`。
- 循环在单个 task 的微任务链内跑完，中间档位不会绘制，无闪烁。

### 2.2 档位取值

`t` 取 `{11, 9, 7}` 中实际可容纳的最大者，都不能容纳则 0（降级 middleText）。

`t` 必须为奇数——不是美观问题：`pages` 里 `n = (t - 3) / 2`，偶数 `t` 得到半整数 `min`，会渲染出 "47.5" 这类页码（例：c=100、t=10、pageIndex=50 → min=46.5）。因此不存在中间档位，取值集合恒为 `{0, 7, 9, 11}`；更细的档位需改 `pages` 算法，不在本方案范围。

### 2.3 触发时机合并

统一入口 `recalc()`（内部用模板 ref 取根元素，不再依赖 `event.target`），以下都调它：

- `@sizechange`（容器/自身尺寸变化；ResizeObserver 首次 observe 自带一次初始触发，见 `knowledge/patterns/sizechange-event.md`）。
- `watch([effectiveSize, sizeOptions, quickJumper, count, pageIndex, pageSize], () => recalc())` —— 顺带修掉 L148 的传参 bug（不再把新值当 event 透传）。
  - `pageIndex` 必列：页码窗口数字位数随翻页变化（字号恒 12px、按钮 `min-width` 仅 24px(small)/32px，small 档 3 位页码即超宽、宽度转为文本驱动）。
  - `pageSize` 影响下拉/标签文案宽度，`count` 覆盖 `total` 变化。
  - 不 watch `pages`：它是 `t` 的产物，watch 会自触发。
- `onMounted` 内 `document.fonts?.ready.then(recalc)` —— webfont 迟到改变字宽、而容器尺寸不变时 `sizechange` 不触发。
- 不 watch locale：locale 仅安装期确定，无可 watch 的响应式来源（见 `knowledge/constraints/langs-locale-not-reactive.md`）。

`effectiveSize = props.size || injectedToolSize.value`，修问题 3。

### 2.4 边界

`innerWidth()` 为 0（隐藏 tab）→ 档位 0 → middleText，与现状一致。

## 3. 备选：常量修补（不推荐）

修正常量（从 computed style 读 `--mu-control-height-*` 与 gap、size 用 effectiveSize、补 prop watch、修 `sizeOptions` 空数组判真）。改动小，但 i18n 与页码位数问题依旧，等于继续维护一张必然漂移的常量表。仅当不想引入测量循环时作为过渡。

## 4. 验证

页面：`demo/src/pagination/` 不存在；pagination 现只在 `demo/src/table/main-view.vue`（`http://localhost:3000/table/`）与 docs-site `components/pagination.md`（`npm run docs:dev`，5173，演示已包 `<ClientOnly>`）。用后者更便于 evaluate 改容器宽。

1. Playwright evaluate 设父元素宽度，扫描若干宽度：断言（a）任何宽度下内容宽 ≤ 容器内宽（无溢出）；（b）宽度递增时档位单调不减，取值只出现 0/7/9/11。
2. small 注入（`size="small"`，或外层 toolbar 注入 toolSize 而组件不传 size），断言档位收敛正常。注意 small 按钮宽并非恒定 24px（`min-width: 24px` + `padding: 0 3px`，3 位以上页码超宽），故断言用"无溢出"，不用"按 24px 计算"。
3. 异步设置 `page-size-options`、切换 `quick-jumper`、翻到 3 位以上页码，断言自动重算且无溢出。
4. 英文文案：临时在 `demo/src/common/app.js:25` 传 `install(app, { locale: 'en' })`（或 docs-site theme 的 install 选项），重跑第 1 项断言无溢出——locale 无响应式、不能运行时切换（见知识条目）。

### 实施与验证记录（2026-10-07）

- 实现：`pagination.vue` 移除常量估算，新增 `contentWidth()`（子元素 rect 跨度）/`innerWidth()`、`recalc()` 收敛循环（11→9→7→0，generation 防并发，隐藏容器直接 0 档）、watch `[effectiveSize, sizeOptions, quickJumper, count, pageIndex, pageSize]`、`document.fonts?.ready` 兜底。
- 验证（table demo，Playwright）：
  - normal 扫描 200–1200px：档位 0→7(550)→9(650)→11(700)，单调、零溢出；small 扫描 200–1000px：0→7(500)→9(550)→11(600)，同样通过。档位 0 且宽度 < ~300px（small）/ ~300px（normal，含 size 下拉 + jumper）时残余溢出为既有下限边界，与旧版一致。
  - 翻页/quick jump（20 页尾页窗口）、size 下拉切 pageSize（50→20）、4 位页码窗口（2000 页跳 1500，498px 下 7 档→0 档）均自动重收敛且无溢出——watch(pageIndex/pageSize/count) 实证生效。
  - 英文 locale（"Go to __ page"/"__ / page"）扫描零溢出、单调。
  - console 无错误/警告。
- 环境备注：Playwright MCP 窗口处于后台时页面 `visibilityState: hidden`，rAF/ResizeObserver 停发，`sizechange` 不再派发；验证时以手动 `el.dispatchEvent(new CustomEvent('sizechange'))` 等价模拟（recalc 读真实 DOM 尺寸，链路等价）。见 `knowledge/pitfalls/`。

### 后续修订（2026-10-07，label 截断样式引入后的测量修正）

- 背景：本方案实施后，`> label` 新增 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`（0 档窄容器下文案优雅降级），`recalc` 更名 `calculateButtons`。
- 新偏差：`overflow: hidden` 使 label 的 flex 自动最小宽度从 min-content 归零，行溢出时 label 吸收全部压缩量 → rect 跨度随截断缩小 → 收敛循环在 11 档即判定"放得下"，jumper label 被压出省略号（复现：520px/600px/680px 等各档下边界处"跳至/页"截断）。
- 修复（`contentWidth()` 两处）：
  1. 补回 label 被裁剪宽度：用 `Range.selectNodeContents` 测文本自然宽（亚像素精确；不用 `scrollWidth − clientWidth`——ellipsis 字形计入 scrollWidth 会高估，且整型取整）。
  2. 计入首尾子元素 margin：flex 行外尺寸含首尾 margin（负自由空间按含 margin 计算），rect 跨度不含 → 临界宽度下 span ≤ inner 但自由空间实为负，label 仍被压出省略号（复现：613px，自然 span 612.67 ≤ 613 判过，"页"右 margin 4px 使实际自由空间 −3.67）。
- 验证（table demo，20 页 + sizeOptions + quickJumper，280–1000px 升/降序扫描）：档位恒 {0,7,9,11}、单调、按钮模式全宽度段 label 零截断；边界精确（9 档外尺寸 616.7 → 617px 起 9 档、616px 仍 7 档）；0 档 ≤380px 文本省略号为既定降级；console 无错误。
