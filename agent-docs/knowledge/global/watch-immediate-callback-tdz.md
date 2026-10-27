# watch immediate 回调的 TDZ 陷阱

## 结论

`watch(source, cb, { immediate: true })` 的回调在 `watch()` **返回之前同步执行**。回调内不得引用：

- `const unwatch = watch(...)` 的 unwatch 句柄自身（同步调用必触发 TDZ ReferenceError）；
- 声明在 `watch(...)` 之后的 `let`/`const` 变量（如一次性标志）。

正确做法：

```js
// 状态声明放在 watch 之前
let done = false

const unwatch = watch(source, () => {
  if (done || !ready()) return
  done = true
  // 停表延迟到微任务，此时 unwatch 已完成赋值
  nextTick(() => unwatch())
  doWork()
}, { immediate: true })
```

## 原因

`immediate: true` 时 Vue 在 `doWatch` 内同步调用一次回调，此时外层 `const unwatchItems = ...` 赋值尚未完成，闭包内同步读取处于暂时性死区；回调内 `nextTick` 延迟调用则安全（微任务时赋值已完成）。同步调用 `.call` 链上的报错栈形如 `Cannot access 'xxx' before initialization`。

## 注意

- "首次满足条件时处理一次然后停表"是常见模式（如首次数据到达自动展开菜单），该场景必然踩到此坑。
- 一次性标志（`done`）放在 watch 前声明可防微任务窗口内重复触发；两者结合最稳。
- 非 immediate 的回调虽在 flush 队列异步执行（句柄已赋值），但把声明放 watch 前、停表走 nextTick 的写法对两种模式都正确，无需区分。
