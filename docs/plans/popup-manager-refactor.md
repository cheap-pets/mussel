# 弹层/模态管理器重构（模块级全局单例 → per-app coordinator）

| 项目 | 内容 |
|---|---|
| 状态 | **已实施（2026-09-13），Playwright 回归通过** |
| 范围 | `src/components/common/popup.js` 的 `usePopupManager` / `useModalManager` 底层实现；`src/index.js` install；附带 dialog / drawer / dom / demo 修复（§5） |
| 不在范围 | `runPopupSequence` 入场编舞（见 `dropdown-panel-sequence-refactor.md`）、`usePopupManager` / `useModalManager` 对外签名（不变）、组件回调协议（不变） |
| 消费方 | `dropdown-panel.vue`、`context-menu.vue`（popup）；`modal.js` → `dialog.vue` / `drawer.vue` / `message-box.vue`（modal） |

---

## 1. 现状（重构前）

`popup.js` 以**模块级全局变量**管理状态，import 时永久挂载 7 个 window 监听：

```js
let activePopup            // 单例，claim 时 hide 旧实例
let activeModal            // 单例 + previousModals WeakMap 链
window.addEventListener('mousedown' / 'mouseup' / 'scroll', …, true)
window.addEventListener('keydown', …)          // 冒泡注册
window.addEventListener('resize' / 'blur' / 'fullscreenchange', …)
```

### 1.1 问题

1. **全局单例跨 app 互抢**：同页多 Vue app 共享 `activePopup` / `activeModal`，一个 app 的弹层激活会顶掉另一个 app 的。
2. **模态链不支持乱序关闭**：`popModal` 仅在 `activeModal === instance` 时回链，非栈序关闭（先关底层）导致链断裂、`activeModal` 指向已关实例。
3. **模态关闭后弹层孤儿悬挂**：dialog 内打开的 dropdown 在 dialog 关闭后仍持有 `activePopup`，事件继续派发给它，视觉残留。
4. **空闲期常驻 7 个 window 监听**：import 即挂载，无弹层时零收益。
5. **keydown 冒泡注册**：与其余 capture 监听不一致；ESC 判定用已废弃的 `keyCode === 27`。

## 2. 方案

`createPopupCoordinator()` 返回 per-app 协调器，`install` 时挂到 `$mussel.popupCoordinator`（`src/index.js`）；`usePopupManager` / `useModalManager` 改为 `inject('$mussel').popupCoordinator` 的薄封装（组件本就依赖 install 提供的 `$mussel.rootElement`，无新增前置）。

```js
createPopupCoordinator():
  activePopup + popupOwner     // claimPopup 记录 claim 时的栈顶 modal
  modalStack = []              // pushModal（includes 去重）/ removeModal（splice，任意序）
  syncListeners()              // idle = 无 popup 且栈空 ⇔ 全部 window 监听挂/卸
  target() = activePopup ?? modalStack[栈顶]   // 事件统一派发目标
  removeModal(instance):
    popupOwner === instance → activePopup?.hide?.()   // 模态关闭级联收其上弹层
    splice 出栈 → syncListeners
```

- **事件派发**：7 个 window 监听（mousedown / mouseup / keydown / scroll 为 capture）统一走 `target()?.onCaptureXxx?.()`——弹层浮于模态之上先收事件；modal 未声明的回调（resize / scroll / blur / fullscreenchange）不响应。
- **`blur` / `fullscreenchange` 由内建直调改为可选回调**：实例需声明 `onCaptureWindowBlur` / `onCaptureFullscreenChange`；`dropdown-panel` 与 `context-menu` 均已声明（行为与旧版等价），modal 不声明（旧版也不响应）。
- **ESC 判定**：`event.key === 'Escape'` && `!isEditableElement(event.target)`（配合 `dom.js` 的 null 防御）。
- **`useModalManager` watch 加 `immediate: true`**：初始 `modalVisible` 为 falsy 时 `removeModal` 为 no-op，纯防御，无行为影响。
- **tooltip 互斥分组预留**：后续 tooltip 与 dropdown 共存时从 `claimPopup` 扩展互斥分组。

## 3. 行为差异与等价性

| 维度 | 旧 | 新 | 性质 |
|---|---|---|---|
| popup 互斥作用域 | 模块级全局 | per-app | 改进：多 app 隔离 |
| 模态乱序关闭 | WeakMap 链断裂 | 数组栈 splice | 缺陷修复 |
| 模态关闭级联收弹层 | 无（孤儿悬挂） | `popupOwner` 级联 | 缺陷修复 |
| blur / fullscreenchange | 直接调 `hide()` | 可选回调派发 | 等价（两个 popup 实例均已声明） |
| ESC / mousedown 派发 | `if (activePopup) … else if (activeModal)` | `target() = activePopup ?? 栈顶 modal` | 等价 |
| keydown 注册阶段 | 冒泡 | capture | **有意变更**：window 层 ESC 先于组件 handler，无法再被 `stopPropagation` 拦截；库内无依赖方（`stopPropagation` 均在 click / mousedown 上） |
| `keyCode === 27` | 是 | `event.key === 'Escape'` | 等价（废弃 API 替换） |
| 空闲期监听 | 常驻 7 个 | 惰性挂卸 | 改进 |
| SSR | import 即访问 window | `syncListeners` 内 `typeof window` 守卫 | 改进 |

## 4. 验证（Playwright，localhost:3000，DOM 断言，2026-09-13）

- [x] dropdown 页：双 dropdown 互斥、ESC / 外点 mousedown / window blur 关闭、context-menu 右键定位与 ESC
- [x] modal 页：dialog 内 dropdown 叠于模态之上，ESC 分层（先 popup 后 dialog）
- [x] messageBox 叠层 2 深：ESC 仅关顶层，底层 dialog 保留
- [x] 级联：dialog 点 X 关闭时其内 dropdown 一并关闭，无孤儿弹层
- [x] drawer：开启 / ESC 关闭正常
- [x] combo-box 页：展开 / blur 关闭正常，无 `transition: none` 残留
- [x] eslint 通过；控制台 0 error（4 条 warning 为 demo 已有弃用提示）
- [ ] 空闲期监听卸载：逻辑审查通过（`idle === !attached` 幂等守卫），未做运行时断言

## 5. 附带修复（同批提交）

| 文件 | 修复 |
|---|---|
| `src/components/modal/dialog.vue` | `fullscreenchange` 监听补 `onUnmounted` 清理（原泄漏） |
| `src/components/modal/drawer.vue` | mask 补 `isAbsolutePosition && 'absolute'` class（对齐 dialog；custom container 场景 mask 定位） |
| `src/utils/dom.js` | `isEditableElement` 增加 falsy 入参防御 |
| `demo/src/dropdown/main-view.vue` | `trigger-action` → `dropdown-trigger`（对齐 v1→v4 升级规则） |
| `.eslintrc` | `no-void` `allowAsStatement`（配合 `void el.offsetWidth` 强制回流写法） |

## 6. 未决问题

1. ~~**`show()` 同步窗口内的 `hide()` 请求**~~ → 已修复（2026-09-13）：`hide()` 置 `visible = false` 后由编舞守卫自然中止，详见 `dropdown-panel-sequence-refactor.md` §5 第 5 条。
2. **tooltip 互斥分组**：tooltip 落地时从 `claimPopup` 扩展（`tooltip-component.md` §6 / §9 已按新派发模型同步）。
