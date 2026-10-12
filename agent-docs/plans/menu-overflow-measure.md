# Menu 溢出折叠宽度测量简化方案（砍漂移检测直算路径）

| 项目 | 内容 |
|---|---|
| 状态 | **已实施并验证**（2026-10-12，§6 全部断言经 playwright 通过——含修订版新增的 MO 无闪烁、items props 直写替换、隐藏恢复两条；全程零 console 错误） |
| 范围 | `src/components/side-menu/menu.vue`（主体）；可选顺带项涉及 `menu.scss` / `menu-item.scss` |
| 不在范围 | `computeCount` 拟合数学（维持现状）、`popup-menu` / `side-menu`、文档三处同步（实施确认后另行处理） |
| 行号基准 | 2026-10-12 工作区源码（`22dd475` 之后的未提交改动之上） |
| 关联 | `menu-item-identity.md` §4.4 刚落地的 `rowMap`/`onRowRef` 行绑定将被本方案整体删除——漂移检测砍掉后无消费方 |
| 修订 | 2026-10-12 评估反馈并入：补零宽守卫（§2、§3.2）、注释清理项（§3.3）、§5 补 `display:none` 与就地文案两行、§6 断言 2 改法与断言 4 手法、新增隐藏恢复断言（§6） |

## 1. 目标

简化一级溢出折叠的宽度计算：删除 resize 路径的**漂移检测**及其全部支撑结构（`rowMap`、`measureRendered` 的漂移契约、`applyCount` 转发），保留「全量帧测量一次 + 容器变化按缓存直算」主机制不变。

## 2. 现状与问题

`recompute`（menu.vue:211-222）走双路径：先 `measureRendered` 重测可见行，漂移（宽度与缓存差 > 0.5）才 `fullMeasure`，否则按 `widthCache` 直算 `computeCount`。

- **`measureRendered` 在 resize 路径的唯一作用是漂移检测**：栏行 `flex:none`、padding/gap 定值（menu.scss:23-39），容器 resize 不改变行内在宽，重测恒得缓存同值；只有中途改主题/字号类 `--mu-*` 变量才会漂。
- **漂移检测实际收益很小**：
  - 最主要的现实漂移源（webfont 迟到）已由 `onMounted` 的 `fonts.ready` 单独覆盖（menu.vue:278）；
  - 纯主题/字号切换不触发 `sizechange`，现实现也要等**下一次 resize 顺带**才纠正——检测只把纠正提前到那一次 resize，不是真正自愈。
- 支撑结构成本：`rowMap` WeakMap + `onRowRef` + 模板 `:ref` 绑定（渲染期函数 ref 闭包配对）、`measureRendered` 的 drifted 返回契约、`applyCount` 三行转发。
- 漂移路径还顺带承担一处兜底：容器（或祖先）`display:none` 期间测量得 0 宽会写入缓存，恢复显示后按 0 直算、全部行展开被裁剪，现状靠下一次 resize 的漂移比对自愈（实测见 `agent-docs/knowledge/pitfalls/overflow-measure-hidden-container-cache.md`）。砍漂移路径须补零宽守卫（§3.2），否则该状态不再自愈。

## 3. 技术方案（路径 A）

### 3.1 `recompute` 收敛为直算 + 缓存缺失兜底

```js
function recompute () {
  if (destroyed || !barEl.value) return
  generation++

  const count = computeCount()
  if (count >= 0) visibleCount.value = count
  else fullMeasure()
}
```

`applyCount`（190-193 行）内联删除。`computeCount` 返回 `-1`（缓存缺失走全量帧）与 `0`（innerWidth ≤ 0 全折叠，隐藏挂载）的语义不变；首挂路径不变——`sizechange` 的 RO 初始回调 → `recompute` → 缓存空 `-1` → `fullMeasure`。

### 3.2 `fullMeasure` 按下标测量，删 `measureRendered`

全量帧内 `visibleCount === items.length` → `hasOverflow` 为 false → more 触发器（`v-if`）不渲染，`barEl.children` 恰为 N 行，`children[i] ↔ items[i]` 按下标一一对应：

```js
async function fullMeasure () {
  if (destroyed || !barEl.value) return

  const gen = ++generation

  visibleCount.value = props.items.length
  await nextTick()

  if (destroyed || gen !== generation || !barEl.value) return

  // 全量帧内 more 触发器不在 DOM，children 与 items 等长同序，按下标配对；
  // 0 宽 = 无布局盒（祖先 display:none）时的假值，视同未测量不写入，保住
  // computeCount 的 -1 兜底
  props.items.forEach((item, i) => {
    const el = barEl.value.children[i]

    if (!el) return

    const width = el.getBoundingClientRect().width

    if (width > 0) widthCache.set(item, width)
  })

  const count = computeCount()
  if (count >= 0) visibleCount.value = count
}
```

**零宽守卫**：`display:none` 子树无布局盒，rect 宽恒 0；写入即污染缓存——恢复显示后按 0 直算全部展开被裁剪，且缓存视为已完整、`-1` 兜底失效。`width > 0` 才写入，0 视同未测量：隐藏期间的全量帧（items 变更 / 隐藏挂载 / `fonts.ready`）不落脏值，恢复显示后由 `sizechange → recompute → -1 → fullMeasure` 重测。0 是安全哨兵——栏行内在宽恒 > 0（图标槽 16 + 行内 gap 8 + 左右 padding 32）。

与 `menu-item-identity.md` §5.3 「位置配对不采纳」的边界：那条否决的是**部分渲染态**（过滤后子集）下按 index 对齐 `children[i]` 的隐性约定；此处仅在**全量渲染帧**内按下标配对——该帧内 more 触发器（`hasOverflow` 为 false）不在 DOM，children 与 items 严格等长同序。残余约定「`__bar` 内除行外无非行元素」是纯组件内部、模板静态约束（`mu-menu__bar` 仅 menu.vue / menu.scss 出现，bar 无 slot，外部无法注入），以上方注释固定，供将来内部加元素时对照。

### 3.3 删除项清单

| 项 | 位置 | 理由 |
|---|---|---|
| `rowMap` / `onRowRef` | 111-116 行、模板第 10 行 `:ref` | 唯一消费方 `measureRendered` 的 el→item 反查消失 |
| `measureRendered` | 143-159 行 | resize 路径不再测量；全量帧测量内联进 `fullMeasure` |
| `applyCount` | 190-193 行 | 两处调用点均内联 |
| 注释块改写 | 105-110 行、141-142 行 | 含「可见行宽度漂移…升级为全量重测」「行绑定：渲染期函数 ref 闭包配对…」及 `measureRendered` 说明，随删码同步改写（保留 `widthCache` 对象键控语义段） |

保留项：`widthCache`（对象键控，折叠行 el 卸载后宽度存续——`computeCount` 恰要查折叠行）、`generation`/`destroyed`（`fullMeasure` 仍 async，items watch 与 sizechange 可交错）、`innerWidth`/`barGap`/`triggerWidth`/`computeCount`、`throttle(50, { noLeading: true })`、`watch(() => props.items, fullMeasure)`、`fonts.ready` 回调。

### 3.4 可选顺带项：`triggerWidth` 读值（默认不做）

现状（134-139 行）`querySelector('.mu-menu-item')` 取行读 `--mu-menu-item_height`，`|| 40` 与 menu-item.scss:3 默认值双份耦合。

- **不能**把变量默认值整体上提到 `.mu-menu`：弹层行 Teleport 到 `$mussel.rootElement`，不在 `.mu-menu` 内，靠 `.mu-menu-item` 自身声明兜底（menu-item-identity.md §2 同款约束）。
- 若做：`.mu-menu` 追加同值声明（menu.scss），`triggerWidth` 改读 `getComputedStyle(barEl.value)`，删 querySelector；代价是 40px 默认值在两处 scss 并存。收益小，默认不动。

## 4. 备选方案与不采纳理由

### 4.1 镜像测量（路径 B）

隐藏测量容器（`position:absolute; visibility:hidden; pointer-events:none`，同 font/gap/padding 上下文）始终渲染全量行，`recompute` 同步读活宽度。可删 `widthCache`/`rowMap`/`fullMeasure`/`generation`/`destroyed` 全部——recompute 变纯同步、天然自愈。**不采纳**：

1. N 个重复 DOM 节点 + 测量容器复用 `menu-item` 须靠 `inert` 摘除交互（hover 弹层、点击分派都注入同一 menu 上下文）；
2. 测量容器样式须与 `.mu-menu__bar` 同 font/gap/padding 上下文，多一处须同步的样式镜像；
3. 与本组件既有取向（零额外 DOM、显式权衡，见原注释 105-110 行）不符。

### 4.2 `computeCount` 循环重构

公式 `Σw + gap·(n-1) + (n<N ? trigger+gap : 0) ≤ inner` 已是最直形式，前缀和/二分/`fits(n)` 谓词重写均不减少复杂度。**不动**。

## 5. 行为变化（对外）

| 场景 | 现状 | 改后 |
|---|---|---|
| 容器 resize 折叠 | 可见行重测 + 直算 | 纯直算（无渲染往返，无闪烁，行为不变） |
| 中途改 `--mu-*` 字号/间距变量 | 下次 resize 顺带纠正 | 下次 items 变更 / `fonts.ready` 才纠正（首测后 `fonts.ready` 已过则等 items 变更） |
| 容器 `display:none` 后恢复 | 隐藏期间重测写 0 宽 → 恢复后全部行展开被裁剪，靠下一次 resize 漂移自愈 | 隐藏期间不落脏值（零宽守卫）；缓存完整则直算恢复，隐藏期间发生全量帧（items 变更 / 隐藏挂载）则恢复后经 `-1` 兜底重测——均正确，优于现状 |
| 就地改条目文案（数组身份不变，如消费方改 `item.label`） | 下次 resize 漂移纠正 | 不再纠正（locale 运行时不可切换已由项目约束排除，剩就地改文案一类，接受） |

其余（折叠数、more 面板、`overflowActive`、激活链、items 变更全量重测、webfont 迟到重测）行为不变。

## 6. 验证断言

demo（`http://localhost:3000/menu/`，playwright，DOM 断言为主）：

1. **首挂折叠**：视口窄时出现 `.mu-menu__more`，栏内行数 = `items.length - 折叠数`。
2. **resize 直算**：容器宽度按钮逐档拖窄/拖宽，折叠数单调增减，more 存在性与 `hasOverflow` 一致；MutationObserver 记录 resize 期间栏内行数峰值 < `items.length`（无瞬时全量帧）。
3. **more 面板**：折叠项在面板内可见可点，点击叶子 `activeItem` 生效、触发器 `[active]`（`overflowActive`）。
4. **items 变更**：运行时替换 items 数组 → 全量帧重测，折叠数随新数据正确。面板 2 `:items` 为 const 无替换入口，经 `document.querySelector('.overflow-box .mu-menu').__vueParentComponent.props.items = newArr` 替换（props shallowReactive 可写，替换后等 ≥200ms 断言；手法见 `agent-docs/knowledge/patterns/playwright-props-swap-verification.md`）。
5. **回归**：id / 对象激活、`activePath` 高亮不受影响（identity 方案 §7 已覆盖项不重复验）。
6. **隐藏恢复**：容器 `display:none` → 恢复，折叠数回到隐藏前值；隐藏期间替换 items → 恢复后重测正确（零宽守卫路径，§3.2）。
7. 全程零 console 错误。

## 7. 实施顺序

1. `menu.vue`：`recompute` 收敛（3.1）、`fullMeasure` 内联按下标测量 + 零宽守卫（3.2）、删 `rowMap`/`onRowRef`/`measureRendered`/`applyCount`/模板 `:ref`，同步改写 105-110 / 141-142 注释（3.3）
2. playwright 按 §6 断言验证
3. 文档三处同步评估（本方案不涉及对外 API，预期无需同步）
