# 交叉回应（R1）

回应 06-amend-1.md 改动台账实质改动 #1~#6；「未解决异议（累计）」为空。非实质改动 #7~#9 已核对在正文且正确（P2-2/P2-4 重叠说明 §3 :144/:170、P4 空白优先顺序 :179 对照 text-wrap.js:63-66 先 `/\s/` 再 CJK、文档头修订块），按协议不逐条回应。

## 评审回应（第 1 轮）

| # | 位置 | 结论 | 修改说明或理由证据 |
|---|---|---|---|
| 1 | §3 P1 缺口/改法/伪代码 | 接受 | 源码复核成立：childrenIndex 显式依赖 recordsVersion（use-tree-rows.js:61）→ 版本变化重建 flatRows；relayout 前清空使 mergeMeasuredHeights（controller:113-119）无旧真值、违反 controller:13-15 的 #15 单调不变量；树缩进读 flatRows.levels（use-tree-rows.js:109-116）、精算宽度含 inset（row-geometry.js:454-458）。跳过等价性自洽：updateHeight 在几何值 === cached.height 时 Δ=0（row-geometry.js:306-317）；条目列 columnLineCount 不区分 precise（row-geometry.js:113），首算入缓存值即 render 计数高度，跳过与"每帧重跑 render 但计数不变"等价。正文 :58-100 保留。 |
| 2 | §3 P1 正确性论证/粘性契约/风险 | 接受 | 失效链七维度复核完备：签名清空先于扫描/混入（controller:320）、spans 引用失效（controller:312-317；无 spanMethod/autoRowSpan 时 buildSpans 恒 null 身份不漂移，spans.js:563）、invalidateMeasureCache（controller:420-422）、record 引用键、版本快照、缩进快照、编辑提交（controller:403-416 → 258-281）。recordNumber 不进 render 签名成立（list.js:119 `({ record, value, emit })`，link 壳委托 link.js:44-58）；正文 :114 行号 117-118 → 119 已修正。 |
| 3 | §5 改动文件清单 | 接受 | 与 #1/#4 一致；正文 :221-237 已含 controller 快照行、ctx 注入行、controller 自检行与 main-view.vue 夹具行；"不触碰 column-types/cell-painters"边界复核通过（全部优化落在 ex/ 消费侧）。 |
| 4 | §6 控制器自检设计 | 接受 | 断言 1~8 数值自洽复核通过：8 字 ×10px=80，inset 0 → 内容宽 84 ≥ 80 单行 36、inset 16 → 68 < 80 两行 52；正文 :259 夹具补 `getTheme`（THEME 36/8/18/14 同 self-checks/row-geometry.js:66），其余照 amender 版保留。 |
| 5 | §6 基线采集/指标 | 接受 | B4 口径可操作性复核通过：绘制侧 resolveCellContent 对绘制格调 `_text`/`_value`（cell-painters.js:231/236，计数列无 text → 必走 _value），视口外计数列帧增量才能为 0；前序列宽和实测 1944 = 48+56+160（名称列 text 缺省宽 layout.js:18/64-68，remain<0 保持初始宽 layout.js:100-101）+100+100+120+120+180+80+90+90+150+110+160+110+150+120 > 舞台 960（main-view.vue:1115-1116）；memo 列无 multiline（main-view.vue:438-457）、onAsyncMutate 只改短 memo（:1220-1231）、multiline records[1].long10 初始单行可观察增高（main-view.vue:606/629）；getLayoutInfo 暴露 viewRows/lastPaint/lastRelayout（table-ex.vue:1447-1450），采样字段全部真实存在。 |
| 6 | §7 实施顺序 | 接受 | 步骤 0（夹具 + 基线先于 src 改动）与 B4 需改前基线、禁 git 切换约束一致；正文 :277 已含"基线未采到不得进入 src 改动"门禁。 |
