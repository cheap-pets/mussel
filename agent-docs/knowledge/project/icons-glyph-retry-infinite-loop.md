# icons cls 图标重试链死循环

## 触发特征

install 的 cls 图标其 class 在样式表中不存在（或 icon CSS 晚注入且两跳内未生效）
时：页面整体冻结（微任务队列永不清空）、`glyph resolve failed` 的 dev warn 永远
不出现（failed 终态分支不可达）、DOM 解析元素线性增长。

## 根因

`runGlyphRetry` 开头即清 `retryScheduled`，而循环体内 `parseGlyphOf` 解析失败会
同步重入 `scheduleGlyphRetry`——守卫已解除使重入绕过去重，`retryHopsLeft` 被重置
回 2，终止条件永不满足。放大器：`document.fonts.ready` 已 fulfilled 时
`.then(runGlyphRetry)` 以微任务立即执行，每轮又挂新微任务，事件循环无法 yield。

## 做法

- 错误：在调度回调执行开头清去重守卫。
- 正确：`retryScheduled` 保持 true 到链终态（全部成功 / failed 清空）后才复位；
  复位先于 warn（warn 抛错不阻断后续 install 的重试调度）。配套：`flushReady`
  回调 try/catch 隔离（异常异步暴露），`decodeGlyphContent` 码点 > 0x10FFFF
  返回 ''（`String.fromCodePoint` 抛 RangeError 会中断整链；lone surrogate
  不抛，勿多判）。

## 来源

src/icons/index.js（scheduleGlyphRetry / runGlyphRetry / flushReady /
decodeGlyphContent / resolveGlyphOf）；回归用例
demo/src/data/table-ex/self-checks/cell-painters.js「样式表不存在的 cls 两跳重试后
failed 终止」（首跑断言 pending、重跑断言 failed，runChecks 不支持异步）。
