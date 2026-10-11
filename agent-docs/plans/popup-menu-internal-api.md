# popup-menu 内部 API 自注册改造方案（defineExpose 收敛为 0）

| 项目 | 内容 |
|---|---|
| 状态 | 方案（未实施） |
| 范围 | `src/components/side-menu/popup-menu.vue`（defineExpose → 链表自注册）、`side-menu.vue` / `menu.vue`（删模板 ref 注册） |
| 不在范围 | popup-chain.js（零改动）、弹层行为与样式、对外 API（`MuSideMenu` / `MuMenu`）、文档三处同步（纯内部重构，无对外语义变化） |
| 前置文档 | `agent-docs/plans/side-menu-popup-cascade.md` §8.5（弹层统一挂载 + 链表现状）、`agent-docs/plans/horizontal-menu.md`（menu.vue 现状） |
| 依据 | 源码静态分析 + 全库 grep 消费面盘点（2026-10-11 dev 分支工作区未提交状态，行号已按当日复核时源码刷新）；未做运行时验证 |

## 1. 目标

弹层链的实例表（`popupLayers`）从「存组件实例（expose 代理）」改为「存 setup 内组装的内部 API 普通对象」：popup-menu 自注册（`chain.setLayer(props.layer, api)`），宿主模板 ref 注册删除，`defineExpose` 整个移除。

收益：expose 面从「9 个内部成员」收敛为 0——层间互访协议不再泄漏为组件公共 API；popup-menu 虽未公开导出（`side-menu/index.js` 仅导出 `MuSideMenu` / `MuMenu`），但 expose 面即未来任何模板 ref / `$refs` 消费者的可达面，宜最小。

行为完全等价：消费面盘点确认 9 个 expose 成员全部有外部消费者，本方案逐成员平移进 api 对象，不改任何调用点语义。

## 2. 现状：expose 面为何是 9 个

注册与消费链路（行号为现状源码）：

```
:ref="el => setLayer(i-1, el)"        ← side-menu.vue:52 / menu.vue:32（宿主模板）
      │
popupLayers[i]  （存 expose 代理）
      ├─ chain.showLayer      → .show()        popup-chain.js:25
      ├─ 宿主                 → .visible / .hide() / .delayHide()
      │     menu.vue:248,258 / side-menu.vue:173,296 / menu.vue:281,292 / side-menu.vue:192 / menu.vue:254,264
      └─ 层间 parent/subPopup → 其余 6 个成员（popup-menu.vue 内部）
            .position(L116) .clearHideTimer(L222) .delayHide(L90,230)
            .hide(L247,267) .updatePosition(L212) .isInsideChain(L287) .handleAnchorMove(L299)
```

三类消费者读同一张表（宿主 destructure 的 `popupLayers` 与 chain 内部是同一数组），且 `setLayer` 存入的是模板 ref——对 `<script setup>` 组件即 expose 代理，ref 成员自动解包。因此层间互访（父子层递归调用）全部被迫走 expose，9 个成员缺一不可。

## 3. 技术方案

### 3.1 api 对象形态（getter 保 ref 解包）

popup-menu.vue 末尾 `defineExpose` 块（L317-327）原位替换为：

```js
  // 内部 API 对象：层间互访 / 链协调 / 宿主共用，setup 期自注册进链表；
  // 不经 defineExpose 暴露（链表存普通对象，组件实例无消费者）
  chain.setLayer(props.layer, {
    get visible () { return visible.value },   // 宿主判链头已开（menu.vue），getter 保布尔解包
    get position () { return position.value }, // 子层 resolveBase 继承方向
    show,
    hide,
    delayHide,
    clearHideTimer,
    updatePosition,
    isInsideChain,
    handleAnchorMove
  })
```

- 7 个方法直接引用（函数声明已提升、ref/computed 均已声明，注册语句位于原 defineExpose 位置，无 TDZ）；
- getter 语义对齐原 expose 代理的 ref 解包：`popupLayers[0]?.visible` 仍得布尔（裸 ref 会得恒真值对象，`!popupLayers[0]?.visible` 判定静默失效——menu.vue click 触发模式将退化，见 §6 验证锚点）、`parentPopup?.position` 仍得字符串；
- 除 `visible` / `position` 外无其他 ref 成员，跨实例读取点（L116 / L222 / L230 / L90 / L247 / L267 / L212 / L287 / L299）零改动。

### 3.2 注册时点：mount → setup

自注册发生在 setup 期，比原 ref 回调（mount）更早。时序复核：

- **层序保证**：v-for 按层序渲染，同批次内父层 setup 先于子层 setup 执行，子层 setup 读 `chain.getLayer(props.layer - 1)`（L64）时父层 api 已注册——现注释「实例先生成父层后生成子层，子层 setup 期父层引用已就位」的前提不变且更紧；
- **showLayer 不改**：`await nextTick()`（popup-chain.js:22）保留——api 对象虽在 setup 即就位，但 `show` 触 DOM（panelEl、锚点 `popup-open` 属性），仍须等挂载完成，nextTick 语义不变；
- `props.layer` 为实例静态 prop（`:layer="i - 1"`、`:key="i"`），注册键恒定。

### 3.3 defineExpose 删除的影响面

- 全库 grep 复核：popup-menu 的 expose 成员消费者仅 side-menu.vue / menu.vue / popup-menu.vue 自身层间互访，均走 `popupLayers` 表；demo、文档站无实例访问。表改存 api 对象后，组件实例零消费者，defineExpose 可整删；
- `usePopupManager`（L303-315）只收普通回调，不受影响；事件（`rowClick` / `favoriteToggle`）与 props（`layer` / `isFavoriteGroup`）通道不变。

### 3.4 popup-chain.js 零改动

`setLayer` / `getLayer` / `showLayer` 签名与语义不变，仅调用方从「宿主 ref 回调」变为「弹层 setup 自注册」；`showLayer` 内 `popupLayers[index]?.show(anchor, node)` 命中 api 对象的 `show`，可选链兜底语义不变。

## 4. 改动明细

| 文件 | 改动 | 量级 |
|---|---|---|
| `src/components/side-menu/popup-menu.vue` | defineExpose 块（L317-327）替换为 `chain.setLayer(props.layer, api)` 自注册（§3.1），注释同步 | ~±12 行 |
| `src/components/side-menu/side-menu.vue` | 模板删 `:ref="el => setLayer(i - 1, el)"`（L52）；script destructure 删 `setLayer`（L90-95，否则 eslint no-unused-vars） | -2 行 |
| `src/components/side-menu/menu.vue` | 同上（L32；L67-72） | -2 行 |
| `src/components/side-menu/popup-chain.js` | 无 | 0 |

宿主其余调用点零改动：`popupLayers[0]?.visible` / `.hide()` / `.delayHide()`（经 getter/同签名方法语义不变）。

## 5. 决策记录

1. **ref 解包用 getter，不用裸 ref + 调用点 `.value`，不用 `reactive()`**：getter 使宿主与层间共 11 处调用点零改动，语义逐点对齐原 expose 代理；reactive() 也能自动解包，但引入代理开销且掩盖「方法即闭包」的直白性。
2. **defineExpose 整删而非缩到宿主直接用的 4 个**：宿主与层间读同一张表，表存 api 后 expose 零消费者；保留 4 个会制造「公共 API 有消费者」的假象（修正前期讨论「缩到 4 个」的说法——那只在保留模板 ref 注册时成立）。
3. **不做卸载清位**（不写 `onUnmounted` 清表位）：`popupLayerCount` 只增不减、层实例与宿主同生命周期，宿主存活期内无层卸载路径；`popupLayers` 数组随宿主 setup 闭包销毁，无泄漏窗口。与现状的差异仅是「ref 回调收 null 清位」这一无害行为消失；dev HMR 重挂载时新实例 setup 重注册覆盖旧位，亦无残留。
4. **备选未采纳**：
   - `defineExpose({ api })` 单成员暴露 + 宿主 ref 回调存 `el.api`：expose 面只省名义（成员全在 api 内），层间访问多一层 `.api` 间接，且维持模板 ref 通道无收益；
   - 双表（实例表供宿主 + api 表供层间）：双注册通道，宿主 expose 仍须保留 4 个成员，复杂度更高。

## 6. 验证计划

纯架构等价重构，以既有两份断言全集为等价性判据（demo `/side-menu/`、`/menu/`，playwright DOM 断言）：

1. **side-menu 回归**：`side-menu-popup-cascade.md` §7 全 15 条（覆盖层间级联、链式收起、互斥、ESC/外点、换锚复用；断言 12/13 覆盖 `position` 继承——`position` getter 正确性锚点）；
2. **menu 回归**：`horizontal-menu.md` §9 全 11 条（断言 2 的 click 触发模式「首次点击浮出、已开 hover 切换」覆盖 `visible` getter 解包正确性——若 getter 遗漏，该模式静默退化为 hover 恒开）；
3. **lint / 构建**：eslint（宿主 destructure 删 `setLayer` 后无 unused）、demo watch 构建无新告警。

实施完成后无需文档三处同步（popup-menu 无对外 API 语义变化）。
