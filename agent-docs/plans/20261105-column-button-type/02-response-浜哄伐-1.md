# 人工意见回应（第 1 轮）

针对 `03-human-1.md`（VERDICT: REVISE），修订已直接写入 `02-design.md`。

## 评审回应（第 1 轮·人工）

| 问题编号 | 结论 | 修改说明 / 理由证据 |
| --- | --- | --- |
| [1-1] dom 侧直接使用 mu-button，强制 small 尺寸 | 接受 | 设计 DOM 通道整体重写：items[].is = MuButton 组件对象（table-row.vue:13-14 `<component :is>` 原生支持，现有列条目仍传字符串零回改）、恒传 `size: 'small'`（button.scss:37-48）、`column.link` 映射 `buttonStyle: 'link'`（:62-65）、caption/icon/color/disabled 映射 props（button.vue:23-27、button.js:6-25）。已移除 pill 镜像与 17 色修饰类：方案概述、遵循约定（删三态视觉规格引用）、改动清单（style.scss 缩为两条布局规则）、接口/数据结构（dom 产物 + CSS 契约重写）、被拒备选（原 pill 镜像方案改列为被否决备选 1）、风险（删视觉确认项，增 fallthrough 与色域差异）、测试计划验收 4/5、实施步骤片2。附带约束：MuButton color validator 仅 4 色（button.js:17-20），DOM 侧超出色回退缺省形态以避免 dev warn，canvas 维持 17 色（差异入风险与未解问题）。 |
| [1-2] 文档三处不同步 | 接受 | 维持现状：改动清单与未解问题均不含文档同步项（原未解问题 4 删除）；裁决已记录 decisions.md「人工意见1-2」。 |
