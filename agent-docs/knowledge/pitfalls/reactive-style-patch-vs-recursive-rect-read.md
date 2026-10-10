# 响应式 style patch 异步：递归重定位读到旧 rect

## 结论

组件 A 更新定位样式后需立即递归重定位子组件（子组件锚点是 A 面板内的元素）时，不能只写响应式 style ref 等待 patch——patch 是异步的，子组件同步读锚点 `getBoundingClientRect()` 拿到的是 A 的**旧位置**。须在递归前同步写入 DOM：清旧键后 `Object.assign(el.style, style)`，响应式值照常赋值（稍后 flush 结果幂等）。

## 原因

Vue 响应式 style 绑定在 nextTick flush 时才 patch 到 DOM；`getBoundingClientRect` 读的是当前 DOM。父面板样式未落地时，其内部锚点元素 rect 仍是旧坐标，子层按旧坐标重算等于没动（实测：side-menu 级联弹层 window resize 后 L1 跟随、L2 原地不动）。

## 注意

- 换 left/right 定位键时，同步写前须先清空旧键（`el.style.left = el.style.right = el.style.top = ''`），否则两键并存。
- 入场编舞类「await nextTick 后再定位」的流程不受影响；仅「同步递归链」需要同步写。
