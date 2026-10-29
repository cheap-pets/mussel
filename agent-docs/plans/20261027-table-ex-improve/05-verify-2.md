# 验证报告：table-ex 改进（第 2 轮，聚焦第 1 轮 FAIL 项复验 + 回归确认）

VERDICT: PASS

第 1 轮 3 处测试代码缺陷（05-verify-1.md 失败项 1/2/3）全部修复生效：A9 面板 **163/163**（上轮 161/163）、A8 成本夹具 4/4 次点击产出 relayoutMs/paintMs（上轮恒 stale）。回归面：面板全绿覆盖全部自检断言，A2/A6 纯浏览器项页面复测一致，A8 行为面树场景实测未红变。lint/build 复跑通过。组件源码零改动（mtime 证据）。

## 上轮问题核对（第 2 轮起）

| 上轮失败项 | 结论 | 本轮证据 |
|---|---|---|
| 1. `painter.js:776/778` 采样区断言（clip 单格重绘一致性）恒败 | **已解决** | 源码：采样区改 `(60, 80, 140, 30)`（:778），标签「单格重绘可见（区域覆盖行 1 槽位锚墨迹带）」，注释 :762-764 写明锚位推算（lineY=90、墨迹 [83,97)）。运行时：面板 [painter]「变高行：fake rowGeometry 下 cellRectAt 高度、行界网格线、单格脏区裁剪高 heightAt 化」块 **pass**（该块内含 :778 assertRegionDiffer 与 :779 行 2 不受影响断言）；整面板 failCount=0 |
| 2. `painter.js:1129/1135` hoverMode=none 对照帧断言恒败 | **已解决** | 源码：:1138-1142 新增 `plainCanvas = makeState({})` 真·无 hover 对照帧，:1145 断言改用之；:1127/:1132 hover 对照帧保留供 :1134「加载中按钮区不半绘制」（实施偏离节所述，逐字与 04-impl-修复-1.md 一致）。运行时：面板 [painter]「编辑按钮绘制调用路径：hover 态加载中不半绘制、hoverMode=none 整体抑制」块 **pass**——:1134 与 ：1145 两条断言同块，均绿，偏离未引入回归 |
| 3. `main-view.vue:1045` 成本夹具第 ④ 步判据方向反、恒 stale | **已解决** | 源码：:1045 `localeCompare(...) >= 0`（非递减，与注释「已按 name 升序」及 applyOrder 口径一致）。运行时：树场景（n=10003、树开）点击「树排序成本测量」4 次，事件日志 #1–#4 **全部产出、零 stale**（见下表） |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `NODE_PATH=$(npm root -g) npx eslint src/components/table-ex/ demo/src/data/table-ex/` | PASS（exit 0） | 0 error / 0 warning，无任何输出 |
| `npm run build` | PASS（exit 0） | dev: 296 modules，`dist/mussel.js 660.02 kB`，built in 500ms；prod: 296 modules，`mussel.min.css 100.96 kB`、`mussel.min.js 292.91 kB`，built in 323ms |

## A8 成本夹具实测（失败项 3 修复后，夹具自身产出）

树场景（`场景：tree（树开）`、records=10003、首三项「根节点 1/2/3」原序），点击按钮 4 次：

| 次 | sortMs | relayoutMs | paintMs | stale |
|---|---|---|---|---|
| #1 | 2.8 | 9.5 | 0.2 | 否 |
| #2 | 1.5 | 4.8 | 0.1 | 否 |
| #3 | 1.9 | 6.2 | 0.2 | 否 |
| #4 | 1.8 | 6.1 | 0.2 | 否 |

- **量级交叉核对**（vs 第 1 轮 verifier 直读 `getLayoutInfo()` 回填）：sortMs 1.5–2.8（上轮 1.4–2.0）、relayoutMs 4.8–9.5（上轮 4.2–6.3）、paintMs 0.1–0.2（上轮 ≈0.2）——全部同数量级吻合。#4 产出与同步回读 `getLayoutInfo()`（lastRelayout=6.1 / lastPaint=0.2）逐值一致，证实夹具读的是本次管线产物。
- **成本结论维持**：单次排序总成本 ≈ 6.4–12.5ms，远低于设计预期 <30ms 与 100ms「过高」阈值；A 案成立，无降级需要。decisions.md [I2-1] 已记录的结论不变。

## 验收标准核对（本轮 = 失败项复验 + 回归抽样，PASS 项不逐条重跑）

| 标准 | 手段 | 本轮证据 | 结果 |
|---|---|---|---|
| 失败项 1 复验 | 浏览器（面板） | 见「上轮问题核对」行 1：目标断言所在块 pass，采样区修复在位 | PASS |
| 失败项 2 复验 | 浏览器（面板） | 见「上轮问题核对」行 2：:1134/:1145 同块双断言 pass | PASS |
| 失败项 3 复验 | 浏览器（页面交互） | 4/4 次点击产出 relayoutMs/paintMs、零 stale，量级与上轮直读交叉吻合（见上表） | PASS |
| A9 自检全量回归 | 浏览器（面板） | 面板头「自检结果（163/163 通过）」；`.ct-check-item--pass` 163 条、非 pass 0 条；10 模块齐全（text-wrap 8 + row-geometry 14 + tree 12 + theme 16 + layout 19 + cell-painters 33 + painter 24 + interactions 17 + editor 16 + data 4 = 163），总数与上轮基线 163 一致（修复仅改断言内部，无新增检查） | PASS |
| A1 回归 | 面板抽样 | [painter]「树箭头 hover 主色 accent：与常态箭头同槽位 centerY（问题 1）」detail「row 0 = 54/54（槽位 54）、row 1 = 90/90（槽位 90）」pass；[cell-painters]「多行文本：maxLines 常量折行 + 钳制末行 + 顶部对齐」pass | PASS |
| A2 回归 | 浏览器（DOM） | default 场景 `.mu-table-ex__header-shadow` offsetTop=**37**（headHeight 36+1），offsetParent=`mu-table-ex__overlay`——与上轮证据逐值一致 | PASS |
| A3 回归 | 面板抽样 + 页面 | 面板 [editor]「整格矩形 computeEditorStyle：…变高行」pass、[painter]「hover 编辑感知：可编辑格 1px 主色整格内描边（与格线重叠）」pass；本轮 A6 实测顺带：编辑器 rect vs `getCellRect(0,8)` deltas **全 0** | PASS |
| A4 回归 | 面板抽样 | [editor]「只读判定 isCellEditable：表格级/列级/editor 缺失/排除类型；link/button/progress 不可编辑」pass | PASS |
| A5 回归 | 面板抽样 | [painter]「编辑按钮绘制调用路径：hover 态加载中不半绘制、hoverMode=none 整体抑制」pass（即失败项 2 修复块，含 ：1134 原断言未红变） | PASS |
| A6 回归 | 浏览器（页面） | default 场景点「启用」列（col 8）开编辑：`.mu-table-ex__editor` computed backgroundColor **rgba(0,0,0,0)**、rect deltas 全 0；编辑中画布格内点样 [237,249,255]（纯行选中底色，邻格同色可证非 veil 涂层）→ **veil 跳绘成立**；Esc 关闭后同点 [124,132,137]（bool 开关图形轨道恢复重绘）、editor 移除 | PASS |
| A7 回归 | 面板抽样 | [cell-painters]「link 悬停（问题 7/A7）：竖排与横排两路径色变 + 1px 下划线、disabled 不悬停、条目 disabled 字段」pass | PASS |
| A8 回归 | 面板抽样 + 页面 | 面板 [tree] 平铺排序 5 条全 pass（含「每级兄弟有序 + 父子结构不变 + 不跨层级穿插」「降序两态」「稳定性 + 不同父同名子键不穿插」）；页面树场景 `window.__ctStage` 契约 {records, treeProps} 可用、成本夹具实测见上节；排序行为本征未触碰（修复仅动夹具判据与 painter 自检） | PASS |
| A10 lint/build | 命令 | 见「命令结果」，双双 exit 0 | PASS |
| A11 回归 | 面板抽样 | [painter]「blankTail 末列线：Σ < 视口宽时表体段与表头段末列右缘 1px，row 模式与无空白不画（问题 9）」pass；[painter]「rightInset 注入与 painter 路径槽位锚：非末列/blankTail 列线门控」pass | PASS |

## 范围核对

- 基线：`mussel-table` @ `3d41296`（第 1 轮已核，本轮未变——git status 脏文件集合与第 1 轮报告完全一致，无新增）。
- **修复轮改动范围**（追加约束核对项）：
  - mtime 证据：`src/components/table-ex/` 全部 17 文件 mtime ≤ 17:52（实施各组时段），**修复轮（20:02）零触碰组件源码**；仅 `demo/src/data/table-ex/self-checks/painter.js`（20:02:46）与 `demo/src/data/table-ex/main-view.vue`（20:02:56）被触碰——与 04-impl-修复-1.md 白名单（仅此两文件）逐字一致。
  - 修复内容 3 处逐字在位：painter.js 采样区+注释（:762-764/:778）、plainCanvas 对照帧（:1136-1145）、main-view.vue 判据 `>= 0`（:1045）。两文件的 git diff 为含前序实施组的累计值（无法按轮拆分），以「修复点在位 + mtime + 运行时行为变化（恒败→转绿）」三重证据确认修复范围无越界。
  - 其他 self-checks 文件（cell-painters/editor/interactions/theme/tree.js）mtime 均 ≤ 18:48，修复轮未触碰。
- **验证产物**：`npm run build` 产物被 .gitignore 忽略；`.pipeline/` 任务目录未跟踪（00-task 基线约定）。
- **基线噪声排除**（decisions.md [I2-1] 裁决）：`src/components/badge/badge.scss`、`badge.vue`、`src/components/common/props.js`、`src/styles/atomic.js`、`box-shadow.scss`、`tones.scss`（未跟踪）为任务外在途产物，不计入范围判定。
- **无法区分**：无。**设计外改动（未记录/未覆盖）**：无。
- 允许目录内 20 个文件全部在 02-design.md 改动清单内；并行组白名单第 1 轮已核，本轮无新增改动。

## 测试质量问题

- 三处修复均为**恢复断言对准验收标准**，非降低强度：① `assertRegionDiffer` 采样区从与墨迹不相交的死区改为覆盖真实槽位锚墨迹带（重绘可见性判据更严格锚定实现）；② 对照帧从语义错误的「整行高亮带帧」换为真·无 hover 帧，`assertRegionSame` 整幅 W×H 全等不变；③ 夹具判据方向修正后恢复「排序产物有效性」门控（stale 中止逻辑保留且本轮未被触发）。
- 实施者 harness（op 流/几何级）与浏览器像素级证据本轮互证成立（修复 1：面板转绿 + 锚位推算注释与第 1 轮 harness 实证锚值一致；修复 2：:1134/:1145 双断言同块转绿，印证偏离节「:1131 需保留 hover 对照帧」的判断）。

## 需人工检查（维持第 1 轮 UNVERIFIED，不计 FAIL）

- A7「hoverMode 切 none 后条目 hover 色立刻消失」页面入口：demo 仍无 hoverMode 夹具控件（页面级不可操作）。面板 [painter] hover 编辑感知断言（含 hoverMode=none 描边抑制）与失败项 2 的 :1145 整幅一致断言均已覆盖绘制层；代码层归一在第 1 轮已确认（`table-ex.vue` syncPaintState）。如需页面级验收，建议后续补夹具开关。
- A6 borderless input 形态（`editor.border:false` 的 input）：全仓仍无 `border: false` 列夹具，按设计「问题 6 同类核查结论」作代码层结论，不新增夹具。

## 环境阻塞

无。eslint 沿用 `NODE_PATH=$(npm root -g)` 前缀（本地 node_modules 缺 eslint-config-standard，非阻塞）；demo watch 外部运行，未启停任何服务；git 全程只读。

## 失败项

无。
