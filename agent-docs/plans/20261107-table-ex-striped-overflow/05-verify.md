# 05-verify — table-ex striped 行背景越界绘制修复（终验）

VERDICT: PASS

独立验证声明：本报告仅依据 00-task.md 验收标准自行设计探针并判定，未读取 04-impl*.md 及任何实施方自检结论（检索 console error 来源时命中的两行实施记录文字未采信，该现象已由本人独立观察复核）。源码独立阅读；decisions.md 作为已确认约束遵守。

## 命令结果

无 lint / typecheck / test / build 验证命令（00-task.md 未登记，lite 口径）。验证手段为浏览器实测（demo watch + :3000 serve 已运行，直接访问，未重新打包）。

| 探针 | 状态 | 关键输出 |
|------|------|----------|
| GET http://localhost:3000/data/table-ex/ | 200 | 页面正常渲染 |
| 自检结果块 DOM 文本 | 通过 | 「自检结果（241/241 通过）」 |
| 窄列场景 canvas getImageData 采样 + 边界扫描 | 通过 | 见验收标准 1 |
| 默认场景横向滚动态 canvas getImageData 采样 | 通过 | 见验收标准 2 |
| 窄列/默认场景 head 阴影 DOM 度量 | 通过 | 见验收标准 4 |

console error：1~2 条 `ERR_INVALID_URL @ data:image/png;base64,AAAA<N>`，来源 `demo/src/data/table-ex/self-checks/cell-painters.js:814` 负向夹具（故意构造非法 URL），预期产物，与本修复无关。

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|------|------|------|------|
| 1. 窄列（列总宽 < 表格宽）：striped 止于列内容区右边界，超宽区无色块 | 浏览器（canvas getImageData） | `?scene=narrow`：colWidths=[56,280,240]，colSum=576 < stickyWidth=956；斑马行（row 1）列区内 x=196 像素 = bgStripe [246,246,246]，空白区 x=596、x=946 = bgNormal [255,255,255]；边界逐像素扫描 x=570..582：x≤574 为 246（bgStripe）、x=575 为列分隔线 [201,205,209]、x≥576 全白。斑马色恰止于列内容区右边界 x=576 | PASS |
| 2. 列总宽 ≥ 表格宽（横向滚动态）：striped 行为不变 | 浏览器（canvas getImageData） | default 场景 colSum=1944 > W=956，scrollLeft=240：斑马行（variable 行高 70，中心 y=141）x=40/144/600/900/930/946/950/954 全为 bgStripe 246，铺满整个视口宽；row 0 / row 2 = 255（bgNormal），奇偶交替正确。capEnd=min(bandEnd, contentRight) 在宽列态 = bandEnd = 视口宽，bgNormal 补底分支不触发，与修复前语义一致 | PASS |
| 3. demo 页自检全绿 | 浏览器（DOM） | 调试面板「自检结果（241/241 通过）」（ref f9e668）；自检含新增 painter 断言「行背景带宽度：ΣcolWidths < 视口宽时…斑马/选中色止于末列右缘（延伸区 bgNormal）…20261107 斑马越界修复」（demo/src/data/table-ex/self-checks/painter.js:1230） | PASS |
| 4. 窄列+滚动态：head 阴影止于列内容区右边界，空白区无阴影色块；非窄列态不变 | 浏览器（DOM 度量，按知识条目 dom-shadow-canvas-imagedata-invisible：overlay box-shadow 不在 canvas 位图内，不使用 getImageData） | 窄列+纵滚（scrollTop=300）：根元素 `mu-table-ex--y-scrolled` 激活、`.mu-table-ex__header-shadow` style.width=576px、getBoundingClientRect().width=576（= colSum，止于列内容区右缘；canvas 宽 956）、top=37（headHeight+1，锚 header 下沿）、computed box-shadow 非 none。空白区无阴影条本体（宽度已收口至 576）。非窄列（default，colSum=1944）：纵滚后 style.width=956px=stickyWidth、阴影激活（行为不变）；未滚动态两场景均无 y-scrolled 类、box-shadow=none。视觉复核：evidence/narrow-scrolled-shadow-stage.png 空白区干净 | PASS |

## 范围核对

`git status --short` + `git diff --stat` 与 00-task.md 基线对照：

- 基线脏文件 9 项：全部仍在（未回退），其中 8 项与本缺陷无关的既有改动不判定。
- 实施改动（基线外新增修改 5 项）：`src/components/table/ex/table-paint/paint-body.js`、`paint-utils.js`（striped cap）、`table-ex.vue`（headerShadowStyle）、`table-ex.scss`（注释/兜底说明）、`demo/src/data/table-ex/self-checks/painter.js`（自检断言同步，任务约束明确允许 self-checks 同步修正）。均在「src/ 内 table-ex 相关 + self-checks 同步」允许面内，diff --stat 合计与修复面相符，无越界改动。
- 未跟踪新增：本任务目录 `agent-docs/plans/20261107-table-ex-striped-overflow/`（产物）；仓库根 2 张 PNG（default-yscrolled-xscrolled.png / narrow-yscrolled-shadow.png）为被取消续做实例遗留，decisions.md 已记录、任务结束统一清理（不判失败）；`agent-docs/plans/20261107-refactor-summary-refine/`、`agent-docs/plans/table-ex-structure-refactor-summary.md` 为其他任务产物，非本流水线写入。
- 验证产物：本目录 evidence/（3 个文件）与 .playwright-mcp/（已 ignore）。
- 无法区分 / 已记录-未覆盖 / 未记录：无。

## 测试质量问题

- 新增自检 painter.js「行背景带宽度」断言真实断言验收特征（Σ=350<W=600 夹具、延伸区逐像素 bgNormal、斑马止于末列右缘），非"不抛错"式断言。
- 合并单元格路径复核：`spanRegionRect`（src/components/table/ex/spans/spans.js:184）宽度基于末列右缘几何，天然止于列内容区右边界，无越界风险。

## 需人工检查

无强制项。可选视觉确认：阴影 box-shadow 柔和渐变边缘在列区右缘外 1~数 px 的淡出观感（--mu-shadow-float 固有 blur，修复前后一致）。

## 验收入口

1. 标准 3 — 打开 http://localhost:3000/data/table-ex/ ，调试面板确认「自检结果（241/241 通过）」。
2. 标准 1 / 4 — 打开 http://localhost:3000/data/table-ex/?scene=narrow ，数据规模保持「100000 行」，拖动纵向滚动条：表头下沿阴影与斑马背景均止于「数量」列右缘（x=576），右侧空白区无任何色块；再切「默认」场景纵滚：阴影铺满全表宽。
3. 标准 2 — 「默认」场景横向拖动底部滚动条：斑马纹照常铺满视口宽，奇偶交替正常。

## 环境阻塞

无。

## 失败项

无。
