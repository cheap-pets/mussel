# 验证报告（终验，第 1 轮）

VERDICT: FAIL

输入：00-task.md、decisions.md、01-explore.md、04-impl.md（整体实施，按终验语义核对 A1–A4 全部标准）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | exit 0 | ex-development + ex-production 两次 vite build 均成功（mussel.ex.js 731.30 kB / mussel.ex.min.js 334.13 kB） |
| `eslint src demo/src`（全局 8.57.0） | exit 1（全为存量） | 37 problems（9 errors, 28 warnings）。9 errors：table-ex-benchmark/main-view.vue:506-510（5, 本次未改文件）、table-ex/main-view.vue:347,349（import/first）、self-checks/painter.js:1259,1269（spaced-comment）。对照 `git diff -U0` hunk：main-view.vue hunk=49/468-476/1193-1197、painter.js hunk=15/27/1134-1188 → 报错行均不在 hunk 内，0 新增 |
| `node scripts/table-ex-structure-check.mjs` | exit 0 | OK — 扫描 46 个文件，零纯转发 re-export |
| `node scripts/table-ex-host-audit.mjs` | exit 0 | OK — 审计 10 个 composables 文件，host 键声明零缺失（含本轮改动的 use-pointer.js used=22/declared=27、use-cell-click.js） |
| `grep -rniE "edit[-_]?button" src demo/src` | exit 1（无匹配） | 零命中，覆盖 edit-button/editButton/EditButton/edit_button 变体 |

服务：demo 服务已运行（预检 `curl http://localhost:3000/data/table-ex/` → 200），非本验证启动，未重启、未新起进程。

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 命名与事件（src + demo/src 全更名，无旧名残留） | 命令 + 浏览器 | grep 零命中（exit 1）；demo 列配置键已是 `cellButton`（demo/src/data/table-ex/main-view.vue:471,476 区域，`cellButton: { icon: 'dots' }` / `{ icon: 'demoGlyphA' }`）；点击后事件日志出现 `cell-button-click {"record":"#2","recordIndex":1,"column":"memo"}`（evidence/behavior-assertions.txt:7-9）；页面快照 evidence/page-snapshot.yml | PASS |
| A2 图标白名单无回归（resolveIconEntry 注册/未注册 + demo 无未注册图标渲染报错） | 浏览器 | self-checks 用例「[editor]cellButton 门控 resolveIconEntry：注册名命中（绘制/命中生效）、未注册名判失败（不绘制不命中）」= 通过（页面快照 + behavior-assertions.txt:20-24）；console 唯一 error 为 `data:image/png;base64,AAAA` 加载失败 = self-checks/cell-painters.js:814 故意坏图夹具（该行不在本次 hunk 155/2468 内，存量）；warnings 中 `noRegCell*/noRegEntry* unregistered icon` 为 self-checks 用例故意触发的 dev warn（预期行为，非渲染报错）；console 全文 evidence/console.log | PASS |
| A3 编辑态隐藏（仅被编辑格；时序 pointerdown 先 commit 仍须拦截） | 浏览器 | 行为四件套全过：① 编辑 memo(row1) 中点击其自身按钮区 → 日志首条保持 `#5 cell-click`，无 cell-button-click（时序场景：pointerdown 先 commit、veil watcher 微任务清 editingCellRef 后 click 靠 committedEditCell 抑制）；② 编辑态中点击 active(row2) 按钮 → `#7 cell-button-click {"record":"#3","recordIndex":2,"column":"active"}`（其他格照常派发）；③ Esc 退出后原格点击 → `#8 cell-button-click {"record":"#2","recordIndex":1,"column":"memo"}`（恢复派发）；④ 绘制门控像素断言：编辑中 hover 编辑格自身按钮区 24×24 = 纯 hover 底色单色（hash 6482944），Esc 后同区域 hover = 11 色（dots 图标像素，hash 3198597）→ 不绘制。光标门控：两列按钮区 hover = pointer（编辑格内无异常）。证据 evidence/behavior-assertions.txt | FAIL（见失败项：验证手段第 3 条「页面自检结果面板全部用例通过」未达成，242/243） |
| A4 build + eslint 无新增错误 | 命令 | build exit 0；eslint 9 errors 全存量（0 新增），28 warnings 与 04-impl 自检记录一致 | PASS |

## 范围核对

基线：dev @ e6354ee，status clean（00-task 记录）；当前 HEAD = e6354ee（dev），基线一致。

- `git status --short` 实测 15 个改动文件 + 2 个未跟踪项，与 04-impl.md「改动文件」逐一对应：
  - src 12 项：interaction/cell-button.js（新增，未跟踪）、interaction/edit-button.js（删除）、interaction/hit-test.js、composables/use-pointer.js、composables/use-cell-click.js、table-ex.vue、table-paint/paint-overlay.js、editing/editor-geometry.js、editing/editor.js、shared/constants.js、column-types/icon.js、cell-paint/icon-image.js
  - demo 4 项：data/table-ex/main-view.vue、self-checks/painter.js、self-checks/editor.js、self-checks/cell-painters.js
- 未跟踪 `agent-docs/plans/20261108-cell-button/` = 任务目录本身（验证产物，排除）。
- 设计外改动：无。无法区分项：无（基线 clean）。构建产物 dist/ 未出现在 status（被 .gitignore 忽略）。
- 附注：04-impl.md「改动文件」未含 `demo/src/data/table-ex/self-checks/interactions.js`——该文件本次无需改代码，但 `resolvePointerdown` 返回形态变更波及其断言，实施时波及面核查遗漏（见失败项）。

## 测试质量问题

- interactions.js:377-403 用例断言的是 `resolvePointerdown` 旧返回契约（`Object.values` 2 键形态）；实施改契约（hit-test.js:147 新增 `committedEditCell` 键）后未同步该用例。测试本身有效（成功暴露遗漏），问题在实施侧同步遗漏，非测试设计缺陷。
- 其余改名后用例（editor.js `cellButtonRectOf` 几何 4 例 + `cellButton` 门控用例、painter.js 绘制用例、cell-painters.js resolveIconEntry 用例）断言具体几何/门控/查表行为，非仅"不抛错"，质量合格（均通过）。

## 需人工检查

无（A3 视觉/交互已由 DOM 快照 + 事件日志 + canvas 像素断言覆盖）。

## 验收入口（PASS 时必填）

判定 FAIL，修复后复验。自查入口（复验用）：访问 `http://localhost:3000/data/table-ex/`（带 cache-bust 参数）→ "自检结果"面板应显示全部通过（含 [interactions] resolvePointerdown 用例）→ 其余动作见 evidence/behavior-assertions.txt。

## 环境阻塞

无（demo 服务在运行、playwright mcp 可用、全部验证命令可执行）。

## 失败项

1. 标准 A3（验证手段 3）——页面"自检结果"面板未全部通过：242/243。唯一失败用例：
   `✗[interactions]resolvePointerdown：editing 先提交再续命中；手柄开拖拽 — editing 中 commit 期望 [true,false]，实际 [true,null,false]`
   - 关键错误：`Object.values(resolvePointerdown({ editing: {}, hit: { resizeCol: -1 } }))` 返回 3 元素（新增 `committedEditCell: null` 键），断言期望 2 元素。
   - 疑似位置：断言侧 `demo/src/data/table-ex/self-checks/interactions.js:377-403`；根因侧 `src/components/table/ex/interaction/hit-test.js:147-152`（`resolvePointerdown` 返回新增 `committedEditCell` 键，签名扩展 `{ editing, editingCell, hit }`）。
   - 说明：这是实施遗漏（改名/改契约波及面核查不完整），非浏览器环境问题；A3 运行时行为本身（不绘制/不可触发/其他格不变/退出恢复）全部验证通过。
