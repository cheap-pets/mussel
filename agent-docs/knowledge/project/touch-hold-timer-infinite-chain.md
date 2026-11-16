# touch 手势心跳链无法自终止

## 触发特征

触摸序列被中断（系统打断发 touchcancel 而非 touchend、长按中组件卸载 unbind）
后：100ms hold 心跳定时器永续空转并持续改写残留 `gs.touches` 状态，直到页面
卸载或被下一次成功手势的 `gs.activeElement` 意外终止。

## 根因

`updateHoldState` 尾部无条件重挂自身，唯一终止入口是下一个触摸事件调
`clearHoldTimer`（链条自身无终止条件）；bind 未监听 `touchcancel`，unbind
不清 timer。

## 做法

- 错误：定时器链只依赖外部事件清理；touchcancel 走 touchend 同链（会把取消
  当 end 误判 tap/press）。
- 正确：心跳无活动触点（state !== 'end' 不存在）时不重挂；bind 补
  touchcancel 监听；unbind 调 clearHoldTimer；touchcancel 分支清账不识别
  （clearGestureState，与 touches.length === 0 共用）。press 的 totalTime
  现算（+new Date() − startTime），不依赖心跳数据，清链不影响长按判定。

## 来源

src/events/touch/touch.js（updateHoldState / updateGestureState / bind /
unbind）；验证方法见 [touch-gesture-runtime-verification](./touch-gesture-runtime-verification.md)
（合成事件 + page.clock.runFor 驱动）。
