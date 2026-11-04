# throttle-debounce trailing 参数覆盖丢批次

## 触发特征

滚动条贴底时内容连续变矮，thumb 位置停留在中间态且持续错误（无新事件刷新则不自愈）；
一般化：throttle 包裹的回调依赖入参做事件源过滤时，过滤判定间歇性错向、前序事件被静默丢弃。

## 根因

throttle-debounce 5.x 的 wrapper 闭包变量 `arguments_` 每次调用覆盖，trailing 定时器
exec 时只带**最后一次**调用的参数。若内容批次 A 先调用、同帧另一事件源（组件自身
DOM 写入）批次 B 再调用，trailing 执行时 A 的参数已被 B 覆盖。

## 做法

- 错误：把"批次过滤/事件源判定"放进 throttle 回调内、依赖回调入参（`mutations` 等）
- 正确：过滤逻辑放在原始事件回调里逐批次判定，判定通过后再调用无参节流函数；
  节流回调只做"重新读当前状态 → 决策"（如读 `el.scrollHeight` 与缓存比较），不依赖入参

## 来源

- node_modules/throttle-debounce/cjs/index.js（v5.0.2，wrapper/exec 实现）
- src/components/scrollbar/scrollbar.js（createMutationObserver，2026-11-04 修复）
