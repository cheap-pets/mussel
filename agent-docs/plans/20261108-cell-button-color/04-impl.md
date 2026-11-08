# 实施记录

基线：branch dev @ e6354ee + 上轮 cell-button 改名未提交改动（00-task 基线脏文件口径）。模式：直修（定位输入 = 上轮 01-explore.md / 04-impl.md 链路锚点 + 本轮读码复核）。验收对应 00-task A1–A4。

## 实现方式

两态色 = 指针悬停状态入 paintState（hoverItem 同款模式），绘制侧按态取色：

- 状态链：壳 `cellButtonHover` shallowRef（`{ row, col } | null` 锚格坐标）→ `usePointer.updateCellButtonHover(hit)` 经 `isCellButtonHit` 求值（与 applyItemCursor 光标 pointer 判定、click 派发同口径同依赖：layout/spans/snapshot/editingCell），变化时对 prev/next 格 `invalidate({ cell })`（同格内进出按钮区不触发 hover 变化，必须由此驱动重绘）；`onPointerLeave` 清空。`syncPaintState` 归一同步（hoverMode none 恒 null，同 hoverItem 口径）。
- 取色：`paintCellButton` 中 `isSamePoint(state.cellButtonHover, hover) ? theme.primaryColor : theme.textColorSoft`。`isSamePoint(undefined/null, hover)` = false → 旧 state/离线夹具走默认态。
- 颜色通道：`textColorSoft` 为快照只读新增键（`--mu-text-color-soft`，root.scss L45 亮/L100 暗），`primaryColor` 为既有键；svg 形态经 requestIconImage 着色串缓存键自然分色，cls 形态 fillStyle 直传，icon-image.js 无改动。

## 改动文件

（条目 = 派发实施要求 1–6）

src：
- `src/components/table/ex/shared/theme.js` — 快照新增 `textColorSoft` 键（只读，--mu-text-color-soft）；文件头/snapshotsEqual 注释 21→22 固定字段（条目 3）
- `src/components/table/ex/table-paint/paint-overlay.js` — `paintCellButton` 两态色 + 注释（条目 1）
- `src/components/table/ex/table-ex.vue` — 壳声明 `cellButtonHover` shallowRef + host 并入（条目 2）
- `src/components/table/ex/composables/use-pointer.js` — `updateCellButtonHover`（isCellButtonHit 同口径求值 + prev/next 格失效）；onPointerMove/onPointerLeave 接线；@host-reads 注解（条目 2）
- `src/components/table/ex/composables/use-paint-state.js` — paintState 初始化 + syncPaintState 归一同步（hoverMode none 恒 null）；@host-reads 注解（条目 2）

demo（self-checks 同批同步，条目 4）：
- `demo/src/data/table-ex/self-checks/theme.js` — 快照键表 + textColorSoft、21→22 固定字段/15 色计数、文件头注释（grep 旧值全扫含文件头）
- `demo/src/data/table-ex/self-checks/painter.js` — THEME 夹具补 `textColorSoft`；格按钮自检 L1164 `requestIconImage(..., THEME.textColorSoft)`（保持「与 paintCellButton 同源」前提，避免断言自建缓存键假绿）

条目 4 核查结论：`editor.js`/`cell-painters.js` 自检为几何/门控/条目绘制断言，不涉格按钮颜色，不动；icon 列、条目按钮、其他 overlay 元素的 `theme.textColor` 消费点（item-painters/cell-text/canvas-kind-painters/paint-header，grep 全量确认）均未改动。

## 偏离

无设计文档（直修模式）。快照新增键说明（派发条目 3 授权范围内）：`textColorSoft` 为只读新增，不动既有键语义；snapshotsEqual 按 Object.keys 泛型比较，新键自动纳入相等判定，无行为缺口。

## 自检

- `node scripts/table-ex-structure-check.mjs` → OK（46 文件零纯转发 re-export）。
- `node scripts/table-ex-host-audit.mjs` → OK（use-pointer used=24/declared=28、use-paint-state used=23/declared=26，cellButtonHover 声明零缺失）。
- eslint（全局 8.57.0）7 个改动文件 → 2 errors：painter.js:1261,1271（`spaced-comment`，上轮记录存量 1259/1269 因本轮 +2 行 THEME 夹具移位，`git diff @@` hunk 为 12/24/52/1133/1174/1183，报错行不在 hunk 内）→ 0 新增。
- `npm run build` → exit 0（ex-development + ex-production 两次 vite build 成功）。
- grep 旧值全扫：`21 固定|= 22 键|14 色` → 仅剩新值字符串；`textColorSoft`/`cellButtonHover` 全量落点核对一致。
- `isSamePoint(undefined, hover)` = false（cell-identity.js:7 单侧 null 不等）→ 离线夹具与旧 state 默认态路径验证（读码论证，非运行时）。

## 遗留

- 浏览器运行时验证（A1 像素断言、A3 self-checks 面板全绿、demo 无运行时报错）归 fast 验证槽位；demo watch 对编辑器写入不触发重建（00-task 知识），届时 touch demo/src 改动文件。
- cls 形态图标（demoGlyphA）与 svg 形态（dots）两态色均经同一 color 参数通道，无形态分支遗漏；运行时行为由验证槽位覆盖。
