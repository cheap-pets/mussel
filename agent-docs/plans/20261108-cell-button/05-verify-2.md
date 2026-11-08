# 验证报告（终验，第 2 轮）

VERDICT: PASS

输入：00-task.md、decisions.md、01-explore.md、04-impl.md、04-impl-修复-1.md、05-verify-1.md（同键最新一份上轮报告）。

## 上轮问题核对（第 2 轮起）

上轮唯一失败项：A3 验证手段 3 —— 页面自检面板 242/243，`[interactions]resolvePointerdown` 用例断言旧 2 键返回形状。核对结论：**已解决**。

- 静态一致性：`src/components/table/ex/interaction/hit-test.js:149-155` `resolvePointerdown` 返回 `{ commitEditing, committedEditCell, startResize }` 3 键（对象字面量声明序即 `Object.values` 序）；`demo/src/data/table-ex/self-checks/interactions.js:382-401` 四组期望 `[true,null,false]` / `[false,null,false]` / `[true,null,true]` / `[false,null,true]` 与之逐键一致（`editingCell` 未传经 `?? null` 归一，hit-test.js:152）。
- 修复范围：`git diff -U0` 该文件仅 1 个 hunk（`@@ -377,27 +377,29 @@`，即 377-403 用例），与 04-impl-修复-1.md「改动文件」一致，未动 hit-test.js 实现。
- 运行时：页内「自检结果」面板 **243/243 通过**（修复前 242/243）；DOM 断言 243 个用例项、含 ✗ 项 0；该用例显示 ✓「commit 先行；快照键随返回；手柄开拖」（evidence/behavior-assertions-r2.txt [5]）。
- 上轮「测试质量问题」所涉断言同步已完成，无新增测试质量问题。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | exit 0 | ex-development + ex-production 两次 vite build 均成功（mussel.ex.js 731.30 kB / mussel.ex.min.js 334.13 kB） |
| `eslint src demo/src`（全局 8.57.0） | exit 1（全为存量） | 37 problems（9 errors, 28 warnings）。9 errors：table-ex-benchmark/main-view.vue:506-510（5，本次未改文件）、table-ex/main-view.vue:347,349（import/first）、self-checks/painter.js:1259,1269（spaced-comment）。对照 `git diff -U0` hunk（main-view.vue: 49/468-476/1193-1197；painter.js: 15-1184）报错行均不在 hunk 内 → 0 新增，总数与上轮一致 |
| `node scripts/table-ex-structure-check.mjs` | exit 0 | OK — 扫描 46 个文件，零纯转发 re-export |
| `node scripts/table-ex-host-audit.mjs` | exit 0 | OK — 审计 10 个 composables 文件，host 键声明零缺失（use-pointer.js used=22/declared=27、use-cell-click.js used=27/declared=29） |
| `grep -rniE "edit[-_]?button" src demo/src` | exit 1 | 零命中（覆盖 edit-button/editButton/EditButton/edit_button 变体；对照 grep `cell[-_]?button` 正常命中 src 5+ 处，grep 工具本身有效） |
| playwright 访问 `http://localhost:3000/data/table-ex/?v=verify2-r2-20261108`（cache-bust） | 页面 200 | 预检 `curl` 200；自检面板 243/243；运行时行为见验收标准核对 |

服务与进程：demo 服务为预存在（非本验证启动），未重启、未新起进程，无本验证侧 PID 需关闭。派发预备的 `touch interactions.js` 触发重建**未执行**——页面加载即见 243/243，修复已被 demo watch 重建生效。

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 命名与事件（src + demo/src 全更名 cell-button，无旧名残留） | 命令 + 浏览器 | grep 零命中（exit 1）；运行时事件日志出现 `cell-button-click {"record":"#2","recordIndex":1,"column":"memo"}`（evidence/behavior-assertions-r2.txt [1]）；demo 列配置键已为 `cellButton`（demo/src/data/table-ex/main-view.vue:471,476） | PASS |
| A2 图标白名单无回归（resolveIconEntry 注册/未注册 + 无渲染报错） | 浏览器 | self-checks 用例「[editor]cellButton 门控 resolveIconEntry：注册名命中（绘制/命中生效）、未注册名判失败（不绘制不命中）」= ✓（页面快照 + 面板）；console 全会话唯一 ERROR 为 `data:image/png;base64,AAAA` 坏图夹具（cell-painters.js 存量行，非本次改动）；`unregistered icon` warn ×2 为 self-checks 夹具故意触发（预期 dev warn）→ console-r2-full.log | PASS |
| A3 编辑态隐藏（仅被编辑格；pointerdown 先 commit 时序下仍拦截） | 浏览器 | 四件套全过（evidence/behavior-assertions-r2.txt）：① 普通格按钮派发 `#13 cell-button-click memo`；② 编辑格自身：hover 按钮区像素扫描 darkCount=0、单色 hover 底（225,236,243）= 不绘制，点击自身按钮区仅 `#10 cell-click`、无 cell-button-click = 不可触发；③ 编辑中点击其他格按钮 → `#25 cell-button-click {"record":"#4","recordIndex":3,"column":"active"}`（同手势 pointerdown commit #24 在先，他格照常）；④ Esc 退出后字形像素恢复（36 px 同位 (1031,268)）且 `#20 cell-button-click memo` 恢复派发 | PASS |
| A4 `npm run build` + eslint 无新增错误 | 命令 | build exit 0；eslint 9 errors 全存量（逐行对照 hunk 0 新增），28 warnings 与上轮记录一致 | PASS |

## 范围核对

基线：dev @ e6354ee，status clean（00-task 记录）；实测 `git rev-parse HEAD` = e6354ee（dev），基线一致。

- `git status --short`：16 个修改 + 1 删除（`src/components/table/ex/interaction/edit-button.js`）+ 1 新增未跟踪（`src/components/table/ex/interaction/cell-button.js`），共 17 个代码文件改动，与 04-impl.md「改动文件」（16 项）∪ 04-impl-修复-1.md「改动文件」（+interactions.js）**逐一对应，无缺无多**。
- 未跟踪 `agent-docs/plans/20261108-cell-button/` = 任务目录本身（验证产物，排除）。
- 修复文件范围核对：`git diff -U0` interactions.js 仅 1 hunk（377-403 用例），未越白名单。
- 设计外改动：无。无法区分项：无（基线 clean）。构建产物 dist/ 被 .gitignore 忽略，未出现在 status。

## 测试质量问题

- 无。修复轮断言为具体返回形状数组相等（非仅"不抛错"），有效且与实现契约一致；其余改名后用例（editor.js `cellButtonRectOf` 几何 4 例 + `cellButton` 门控用例、painter.js 绘制用例、cell-painters.js resolveIconEntry 用例）断言具体几何/门控/查表行为，上轮已判合格且本轮面板全绿。
- 附注（非缺陷）：页内 self-checks 为浏览器运行时断言，无独立 CLI 入口，回归依赖访问 demo 页（00-task 既定验证手段）。

## 需人工检查

无（A3 绘制/命中/恢复已由画布像素断言 + 事件日志 + 编辑器 DOM 探测覆盖）。

## 验收入口（PASS 时必填）

- A4 — 终端执行：`npm run build`（预期 exit 0）；`eslint src demo/src`（9 errors 均为存量位置：table-ex-benchmark/main-view.vue:506-510、table-ex/main-view.vue:347,349、table-ex/self-checks/painter.js:1259,1269）。
- A1 — 终端执行：`grep -rniE "edit[-_]?button" src demo/src`（预期无输出、exit 1）。
- A2 + A3 — 浏览器：访问 `http://localhost:3000/data/table-ex/`（任意 cache-bust 参数）→ ①「自检结果」面板显示 **243/243 通过**（A2 用例含其中）；② hover「备注」列格右侧 → 出现 dots 按钮 → 点击 →「事件日志」出现 `cell-button-click`；③ 点击该格格体进入编辑 → 再 hover/点击其自身按钮区 → 按钮消失、点击后日志无新增 cell-button-click；④ 编辑中点击其他格（如「启用」列）格右侧按钮 → 照常派发 cell-button-click；⑤ Esc 退出编辑 → 原格按钮恢复、点击照常派发。

## 环境阻塞

无（demo 服务运行中、playwright mcp 可用、全部验证命令可执行）。

## 失败项

无。
