# Playwright 验证 watch 驱动路径：经组件实例替换 props

## 结论

demo 数据多为 `const` 绑定、无运行时替换入口，`watch(() => props.x)`（身份触发）类路径从 UI 不可达时，改用组件实例直接替换 props 验证：

```js
const inst = document.querySelector('.overflow-box .mu-menu').__vueParentComponent
inst.props.items = newItems                  // 身份变化 → 子组件 watch 触发
await new Promise(r => setTimeout(r, 300))   // 等 watch → fullMeasure → nextTick → 测量
```

组件根元素上 `__vueParentComponent` 直达该组件实例；`props` 为 shallowReactive，赋值可写、可触发 watch 与重渲（实测 Vue 无警告、零 console 错误）。

## 原因

- 数据就地变更（`push` / `splice` / 改字段）不触发浅 watch——数组/对象身份未变。
- demo 页 `:items="xxx"` 的 `xxx` 是 const，页面无替换引用入口，watch 的身份路径在 UI 上不可达。

## 注意

- 替换后等 200–300ms 再断言：链路含 watch → 异步测量（nextTick 往返）；`sizechange` 路径另有 50ms throttle trailing。
- 替换后**不要**再触发父组件重渲——父传入的原 const 会覆盖替换值。
- 整场景放在单次 `browser_evaluate` 内完成，结束后 reload 恢复页面。
- 实测用例：`demo/menu` 面板 2（溢出折叠 items 替换，行数/触发器随新数组重算）。
