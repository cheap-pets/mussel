# 交叉回应（第 1 轮）

针对 `06-amend-1.md`（VERDICT: AMENDED，改动台账 11 条，未解决异议：无）。逐条独立复核（非转抄台账证据）：4 条实质改动的机制与源码事实全部成立、`02-design.md` 落点自洽，7 条非实质改动事实核对无误。全部接受，无回退项，设计文档无需进一步修改。

## 台账回应

| # | 位置 | 结论 | 复核说明 |
| --- | --- | --- | --- |
| 1 | 清单/概述/风险 · table-row.vue:21 | 接受 | 机制独立复核属实：`ensureValidVNode`（runtime-core.cjs.js:3419-3426）`some` 对文本 vnode 恒 `return true`（仅 Comment 与全注释 Fragment 判无效）→ 空串文本 vnode 为有效插槽内容、顶掉 fallback；`renderSlot` `validSlotContent \|\| fallback`（:3393、3403）在注释独占时得 null 落 fallback——`<template v-if>` 修法成立。三处落点（清单行、概述、风险爆炸半径+回归面）齐备且相互一致 |
| 2 | 接口 · 插槽约定变更 + `is` 扩展 bullet | 接受 | 两 bullet 在位，与 button.vue:9-12（`<slot>` fallback icon/caption）及 table-row.vue:13-14 `<component :is>` 消费端对应一致；无此契约则验收 4 caption/icon 断言必失败 |
| 3 | 实施步骤 · 片2 重编号 | 接受 | 现步骤 4（table-row）/5（style.scss）/6（demo）+ 终验 7，与改动清单文件一一对应；片2 文件集合含 table-row.vue，判据含「caption 文本可见（非空 button）」 |
| 4 | 测试计划 · 回归行 + 终验含回归行 | 接受 | 回归行在位（片2）、终验步骤 7 引用「回归」行；item 级 `text` 取值已核对：icon.js:96、image.js:5 为 null，list/tag/check 非空（bool.js:16 的 null 属 cell 级、不走 items 路径），回归面描述准确 |
| 5 | 接口 · dom 产物健壮性 | 接受（非实质） | `button ?? {}` 对齐 EMPTY_BUTTON（cell-painters.js:1297）、门控对齐 drawButton（:1323）、disabled 口径对齐 isTruthyAttr（:1014-1016），均核对一致 |
| 6 | 接口 · icon 跳过语义注释 | 接受（非实质） | layoutButtonEntries :1301 遇 null 哨兵 `break` 属实；「DOM 跳过单条 vs canvas 终止后续，差异仅见残缺配置」注记准确 |
| 7 | 接口 · disabled prop 出处 | 接受（非实质） | button.js:7 `disabled: Boolean` 属实（button.vue:6 为 `:class` 绑定） |
| 8 | 测试计划 · 验收 4 手段 | 接受（非实质） | button.scss:127-128 `&[disabled] { pointer-events: none; ... }` 属实，裸 `.click()` 在禁用条目上确不可行 |
| 9 | 测试计划 · 验收 6 手段 | 接受（非实质） | 知识条目存在（agent-docs/knowledge/INDEX.md:44）；「事后无法补采改动前基线」成立，冻结基线口径可执行 |
| 10 | 测试计划 · 验收 7 注记 | 接受（非实质） | 与 decisions.md 启动确认记录（基线 M 文件保留原样）一致 |
| 11 | 遵循约定/清单注记 | 接受（非实质） | self-checks/cell-painters.js:975 返回文案「canvasKind 分发在 resolveColumnType 之前」属实，断言不看文案，注记可防验证期误判 |

## 未解决异议（累计）

`06-amend-1.md` 记录为「无」，无异议需回应。
