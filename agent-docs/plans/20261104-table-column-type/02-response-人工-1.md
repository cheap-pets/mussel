# 人工意见回应（人工-1）

## 评审回应（第 2 轮 · 人工-1）

| 问题编号/位置 | 结论 | 修改说明或理由证据 |
|---|---|---|
| 03-human-1.md [1-1] | 接受 | list `link: Boolean` 移至 column 级（`column.link === true` 整列生效，全 text 或全 link），条目级 link 键移除。02-design.md 已同步：方案概述（列级声明 + 兼容壳列级 `link:true` + canvas 色维度/hover 门控按列级口径）；遵循约定「同名键注记」（`column.link` 三处同名不同义：button 列 / text 列 / list 列，附 cell-painters.js:1493、main-view.vue:728 证据）；改动清单（list.js 列级判定、link.js、cell-painters.js ④⑤、demo 两页、self-checks）；接口节（列定义 `link?: Boolean` 列级键、item 结构 `{ label?, color?, disabled?, ...任意属性 }`、dom/canvas 产物 `isLink = column.link === true`、解析规则、兼容壳委托对象顶层 `link: true`）；被拒备选 2 引用更新 + 新增备选 5（拒绝保留条目级 link 叠加）；风险节 ④ 语义迁移 + R1 回归面；测试计划 A4 改列级 link 验证（含遗留条目 link 键渲染为 span 的负向断言）、A6 改「link 列条目 / 全 text 列条目」；实施步骤片 1/2 夹具描述。遗留条目 `link` 键作为任意属性原样保留传出（payload 不变） |
| 03-human-1.md [1-2] | 接受 | 流程安排（本轮 impl 由 primary 执行、随后恢复 fast verify + fast impl）不写入设计正文，decisions.md 实施轮间第 2/3 条已记录。设计文档已按新语义同步实施步骤，并新增「R1 修复轮」小节（R1-1 语义迁移 + R1-2/R1-3 self-checks 1a/1b 修复 + R1-4 canvas 条目命中失效定位修复 + R1-5 全量复验），与 05-verify-1.md 三项 FAIL 对齐：link 兼容壳列级 `link: true`、canvas list 列整列链色（`item.link === false` 分流 textColor、其余 primary 谱系）、条目命中（R1-4 按验证报告定位方向 + 时序复测） |

补充说明：decisions.md 新增 3 条实施轮间裁决后原编号整体 +3，设计文档中 decisions 条目引用编号已同步更新（第 2→5、3→6、4→7、5→8、6→9、7→10、8→11 条）；06-amend-1.md / 02-amend-1.md 中与 item.link 相关的既有结论按派发以本修正为准（decisions.md 实施轮间第 1 条已记录取代关系）。

不可行标注：0 条。
