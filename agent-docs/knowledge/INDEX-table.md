# Table / table-ex 主题索引

收录 table 组件与 table-ex 画布表格相关条目；使用规则同 [INDEX.md](./INDEX.md) 头部。条目不在主索引重复列出。

## 列类型与结构

- [table 列类型体系 v2：类型协议、enum/color、compile 双通道](./project/table-column-types-v2.md) `convention` `code@worktree(2026-11-06)`：list 条目协议/link 壳委托/enum 映射独占/color 双端/text.link 双端 hover；compile 双通道产物与 `v-on="item.events ?? {}"` 兜底。
- [table-ex 调用层级关系结构图数据](./project/table-ex-structure-map.md) `fact` `code@ee16eb4`：table-ex 结构分析/重构任务先读本文件（分层模型/依赖图/调用链/host 袋）；代码重构后同步更新。
- [table-ex 溢出 tooltip title 协议](./project/table-ex-overflow-tooltip-title-protocol.md) `convention` `code@worktree(2026-11-10)`：title 未设置/null 视同 true，溢出才自动提示，仅显式 false 抑制；DOM 版 mu-table 仍仅 truthy，属有意分叉。
- [table-ex tag 列 +n 溢出汇聚 tag](./project/table-ex-tag-overflow-plusn.md) `convention` `code@worktree(2026-11-10)`：放不下时末尾渲染灰 +n pill（n=隐藏数，无解回退），pill 命中弹剩余项 tooltip，受 title:false 抑制（渲染与提示分离）。

## 绘制与几何

- [table-ex 绘制收口：行带与 DOM 阴影统一 cap 至列内容区右缘](./project/table-ex-paint-cap-content-right.md) `convention` `code@worktree(2026-11-07)`：canvas 行带与 DOM head 阴影条宽度一律 cap 至 contentRightXOf，延伸区补 bgNormal；勿以视口宽/100% 为宽度事实源。
- [table-ex 覆盖层绘制须裁剪到表体区](./project/table-ex-overlay-clip-body-area.md) `convention` `code@worktree(2026-11-06)`：分区 5 withClip 表体区；hover 带刻意横穿固定列，选中描边须另裁固定列区（否则滚入压固定列上）。
- [table-ex itemHits 修剪豁免集与帧内容解耦](./project/table-ex-itemhits-trim-exemptions.md) `convention` `code@worktree(2026-11-08)`：trimItemHits 豁免只看本帧 spanKeepRows 锚行集，与帧类型及绘制行范围无关；锚行越窗仍保留条目。
- [table-ex hover 高亮与脏区随合并区域联动](./project/table-ex-hover-span-region.md) `convention` `code@worktree(2026-11-06)`：hover 带/列带脏区须同批按 spanRectOf/regionAt 取合并区域，只改绘制会残影，补画会两次混色。
- [table-ex 条目列对齐协议](./project/table-ex-item-column-align.md) `convention` `code@worktree(2026-11-04)`：button 组两遍式平移、link 竖排每条各自对齐、tag 横排 itemsStartX；命中矩形 x 随对齐同步。
- [canvas 文本光学居中锚 centeredTextAnchor](./project/canvas-text-optical-centering.md) `convention` `code@worktree(2026-11-07)`：文本/字形垂直居中统一 alphabetic + 墨迹半差锚（CJK 探针/逐字形实测，全局缓存带 fonts-loaded 写守卫）；勿手写 'middle'。
- [table-ex recordsVersion 行高粘性契约](./project/table-ex-recordsversion-height-contract.md) `convention` `code@worktree(2026-11-05)`：精算缓存按行快照跳过；就地改 records 须 bump recordsVersion，否则行高不更新。
- [table-ex 树 isLeaf 懒加载协议](./project/table-ex-tree-lazy-load.md) `convention` `code@worktree(2026-10-29)`：treeProps.isLeaf 未映射即关闭；仅 ===false 且无子级显三角；toggle 必发 tree-expand/collapse；回填就地 push + recordsVersion++ 防闪顶。
- [table-ex 编辑格按钮门控双快照](./project/table-ex-editing-cell-gate.md) `convention` `code@worktree(2026-11-08)`：编辑格按钮门控须 editingCell + committedEditCell 双快照；pointerdown 先 commit 后决策，单判 editingCell 在 watcher 间隙放行。

## 验证与重构方法

- [table-ex 前台性能验证：原型劫持计数 + props 直替 + lastRelayout](./project/table-ex-performance-profiling.md) `convention`：劫持 measureText/setTransform 计数 + props 直替注入 + `lastRelayout` 归因；精算跳过用视口外计数列。
- [table-ex demo 页交互验证](./project/table-ex-demo-interaction-verify.md) `convention` `code@worktree(2026-10-28)`：单元格点击向 sticky 派发带 clientX 的 pointer/click，坐标经 getLayoutInfo 前缀和；浮层断言等 80ms+；事件日志 unshift 最新在前；条目命中区=pill 绘制区非整格，多 pill 探针勿取联合包围盒中点（8px 间隙）。
- [table-ex 自检断言随绘制/结构变更漂移](./project/canvas-pixel-assert-anchor-drift.md) `pitfall` `code@worktree(2026-10-28)`：自检恒败伪装组件缺陷——锚点/绘制特征/断言同批改写、grep 旧值全扫 self-checks；ex/ 文件移动须同步 self-checks import。
- [overlay DOM 阴影 canvas getImageData 不可见](./project/dom-shadow-canvas-imagedata-invisible.md) `pitfall`：getImageData 读不到滚动阴影——overlay 阴影是 DOM box-shadow；断言 DOM 或截图合成像素。
- [table-ex 重构行为冻结：探针基线逐字比对](./project/table-ex-refactor-frozen-probe.md) `convention` `code@worktree(2026-10-30)`：重构前采集行为快照（警告原文序列/构建序）为冻结基线，重构后逐字比对 + 自检双安全网；探针交付前删除。
- [table-ex 计数断言冷键被预热致重跑恒败](./project/table-ex-counter-assert-warm-cache.md) `pitfall` `code@worktree(2026-11-07)`：自检重跑计数断言恒败——固定冷键被前序用例预热；冷键加随机小数、按探针/字形维度计数、fonts loaded 前置。
