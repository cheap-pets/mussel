# 设计回应（交叉第 1 轮）

输入：06-amend-1.md（VERDICT: AMENDED，唯一一轮审改，无既往回应）。本轮为最终修订轮，回应后直接进入实施。

## 交叉回应（第 1 轮）

| 台账条目 / 位置 | 结论 | 修改说明或理由证据 |
|---|---|---|
| #3（02-design.md:29 改动清单-自检：补断言 F + `buildSpans` import + spans 夹具 + A/B 与 D/E/F 各自独立检查项） | 接受 | 变更已入设计文档，保留。复核证据：验收 3 含「合并 cell hover 高亮」而原计划无 spans 绘制断言；cell 模式现状 paint-overlay.js:87-91；runChecks 单检查项内首错短路（self-checks/index.js:44-63）；`buildSpans` 导出于 spans.js:64；夹具列几何 colLefts [0,60,200,300,420,470]（painter.js:88-91）；F 采样点 (250,50)/(250,90)/(250,150) 与区域底色 = 锚行背景口径（paint-body.js:190-193）核算一致 |
| 未解决异议（累计）：无 | — | 无需回应 |

非实质改动 #1/2/4/5/6/7/8/9/10/11 按契约不逐一回应；本轮逐项复核其行号与事实均在位（spans-method.js:215-232、use-pointer.js:91/123、colorBoundsOf 签名 painter.js:311、fixed 场景列宽和 1040 与舞台 960、spans 场景 7 行分段 + summary cols 5-7、ct-resize-handle main-view.vue:55、relayout 不钳制 scrollLeft 故断言 A 的 scrollLeft=250 前提成立 layout.js:300-339）。接受后核对「改动清单/测试计划/实施步骤/风险与回滚」四节与最终方案一致，02-design.md 无需再修订。

不接受数量：0；标「不可行」人工意见：0。
