# 验证报告（第 1 轮 · 独立验证）

VERDICT: PASS

被检对象：工作区未提交改动（table-ex 单元格选中/复制）。独立执行，未读取 04-impl.md，一切结论以本报告自跑证据为准。附录 A 全量脚本 node 退出码 0，29 项断言全 true，无 console 错误。

## 上轮问题核对（第 2 轮起）

不适用（第 1 轮）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `wc -l` 5 个触及文件 + 全 ex/ 目录 | PASS(0) | cell-selection.js 140 / use-cell-select.js 219 / paint-overlay.js 253 / use-cell-click.js 393 / table-ex.vue 463；ex/ 全目录最大 row-geometry-controller.js 478，全部 ≤500 |
| `npx eslint src/components/table/ex demo/src/data/table-ex/self-checks/painter.js` | PASS(0) | `✖ 6 problems (0 errors, 6 warnings)`；6 个 warning 全部位于本次未触碰文件（canvas-kind-painters.js:141/233/270、cell-tooltip.js:75、item-painters.js:182/217）＝基线警告（这些文件与 HEAD 内容一致，git status 确认未改），改动文件贡献 0 warning |
| `npm run build` | PASS(0) | dev + prod 两次 vite build 均成功（330 modules，`✓ built`，退出码 0） |
| `node verify-cell-select.mjs`（附录 A 全量，SLICE_KEYS=null） | PASS(0) | `"failed": [], "errors": []`，out 29 键全 true（evidence/browser-assert.json） |
| `git log --oneline -1` | PASS | HEAD 仍为 9d61316，无 commit（decisions.md 约束） |

## 验收标准核对

手段取自 02-design.md 测试计划（附录 A 页内段逐字采用，驱动方式偏离见「环境阻塞/偏离记录」）。整体实施（片 1-3 一次交付），按终验口径全量验证。

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1a. 不可编辑格 hover 浅灰内边框 | 浏览器(CDP) | `hoverGray`/`hoverGone` true：pointermove (0,2) 后四缘采样 = borderColorSoft（±12/通道），pointerleave 后回行带 | PASS |
| 1b. 点击选中蓝色内边框 | 浏览器(CDP) | `selBlue`/`selected` true：click (0,2) 四缘 = primaryColor；`getLayoutInfo().selectedCell` === {row:0,col:2} | PASS |
| 2. 选中格 Ctrl+C 复制 | 浏览器(CDP) | `copied` true：`__copyCalls` 末项 === `'记录 000001'`（writeText 包装捕获） | PASS |
| 3. 图形列不复制 | 浏览器(CDP) | `checkSelected`（check 列可选中 + 蓝缘）、`checkNotCopied`（调用数不增）、`enumSelected`（键盘选中 col9）、`enumCopied`（末项 === `'低'`）全 true | PASS |
| 4a. 方向键移动相邻格 | 浏览器(CDP) | `movedDown`（{1,2} 蓝缘 + 旧格消失）、`movedRight`（{1,3}）、`editableColCopied`（可编辑列经键盘选中后复制 `'待处理'`）全 true | PASS |
| 4b. 边界 clamp | 浏览器(CDP) | `topClamp`/`leftClamp`（full 规模首行↑/首列←原地 + 零滚动）、`bottomClamp`/`rightClamp`（few 规模末行↓/末列→原地）全 true | PASS |
| 4c. 无选中不处理 | 浏览器(CDP) | `a0Selected`/`a0Noop` true：页面加载态方向键不产生选中、不滚动 | PASS |
| 4d. 冻结列跨界 + 自动滚动 | 浏览器(CDP) | `fixedCol`（fixedLeft=2 时 ← 到 col0 出蓝缘、scrollLeft 恒 0）、`vScroll`（↓×20 后 selectedCell.row===20、scrollTop>0、目标行完整可见）、`hScroll`（末列连按后 scrollLeft>0 且列在画布内）全 true | PASS |
| 5. 可编辑列行为不变（追加约束） | 浏览器(CDP) | `editableHoverBlue`（hover 可编辑格蓝缘非灰）、`editorOpens`（点击开 `.mu-table-ex__editor` + 事件日志增量）、`editorClearsSelection`（进编辑清选中）全 true | PASS |
| 6. 清除时机（裁定 4） | 浏览器(CDP) | `headerClears`（表头 click 清选中 + 旧格蓝缘消失）、`clearedOnRowsChange`（切 few 后 null，`scaleSwitched` true 证切换生效）、`keptOnInPlaceEdit`（few 下点击 check 格翻转后就地更新保留选中）全 true | PASS |
| 7. 回归：自检全绿 / 无 console 错误 | 浏览器(CDP) | `selfChecks` true（fail=0 且 pass>10，含同步后「hover 编辑感知」用例）；`errors: []`（Runtime.exceptionThrown / console.error 均 0，覆盖页面加载期） | PASS |
| 8. 行数 ≤500（追加约束） | 命令 | 见「命令结果」wc -l 行 | PASS |
| 9. 库构建 | 命令 | `npm run build` 退出码 0 | PASS |
| 10. lint 基线 | 命令 | 0 error；6 warning 均在未触碰文件＝基线水平，改动文件 0 warning（knowledge eslint-demo-dist-false-positives 口径：未对 demo/** 全量跑） | PASS |
| 11. 目录边界 / 不提交 | 命令 | `git status --short` 仅 `src/components/table/ex/` 7 文件 + `demo/.../painter.js` + 2 个任务目录（agent-docs/plans/）；HEAD 9d61316 无新 commit | PASS |

## 范围核对

基线（00-task：9d61316，仅 agent-docs/plans/ 任务目录未跟踪，源码 clean）对照 `git status --short` + `git diff --stat`（6 files changed, 124 insertions(+), 18 deletions(-)）：

- **改动清单逐一对齐**（02-design「改动清单」8 行全命中，无遗漏无多余）：修改 paint-overlay.js / use-paint-state.js / use-cell-click.js / table-ex.vue / use-table-api.js + demo painter.js；新增 cell-selection.js / use-cell-select.js。
- **设计确认零改动项核对**：index.js、table-ex.scss、interactions.js、editor.js、cell-content.js、cell-tooltip.js、skills/、docs*/ 均不在 git status 中，符合。
- **验证产物**：agent-docs/plans/20261105-table-ex-cell-select/ 下 verify-cell-select.mjs（已按设计要求删除）与 evidence/（.gitkeep、browser-assert.json、browser-assert.stderr.log）；任务目录整体未跟踪，不计入源码范围。
- **无法区分 / 设计外改动**：无。
- **并发实施**：不适用（整体一次实施，无多片并发白名单需核对）。
- painter.js diff hunk 数：3 处（用例名 :857、两处断言改写 :896-905、返回摘要 :912），与设计「集成步骤 4」一致。

## 测试质量问题

无。附录 A 断言均为真值断言，非「不抛错」：像素四缘采样（描边矩形口径含 ti/ri 内缩）、selectedCell 字段级相等、剪贴板入参逐串相等（含 enum 映射 `'低'`、status 映射 `'待处理'`）、scrollEl 滚动增量、编辑器 DOM + 事件日志增量、自检 fail 计数。painter.js 自检同步改写为对 THEME 常量的精确期望（tolerance 2），不是恒真断言。

## 需人工检查

无强制项。可选（不影响判定）：灰描边观感是否符合「浅灰」预期、hover 跟手手感、暗色模式（`.mu-dark`）下选中蓝/灰描边的视觉表现——像素断言已按主题快照取色覆盖亮色默认主题，暗色主题为变量覆盖自动生效（推测：paint-state theme 快照链路，未单独断言）。

## 验收入口（PASS 时必填）

demo watch 已在运行（3000 端口，非本验证启动，未关闭）。浏览器打开：

```
http://localhost:3000/data/table-ex/
```

- 标准 1a/1b — hover「名称」列（不可编辑）→ 单元格出现浅灰内边框；点击 → 变蓝色内边框；移开鼠标灰框消失
- 标准 2 — 点击选中一格，按 Ctrl+C → 粘贴到任意文本框，应得该格显示文本（如「记录 000001」）
- 标准 3 — 点击首列 check 格 → 出蓝框但 Ctrl+C 不复制任何内容；点击「等级」列（可编辑）→ 打开编辑器而非选中
- 标准 4 — 选中后按 ↑↓←→ 移动；首行按 ↑、首列按 ← 原地不动；连按到屏幕外方向自动滚动
- 标准 5 — hover/点击「状态」列（可编辑）→ 仍是蓝色 hover 描边、单击打开编辑器（原行为不变）
- 标准 7 — 页面下方自检面板全部绿色（0 红）

## 环境阻塞

无阻塞。1 项环境事实导致验证手段偏离（已按等价替代执行，不影响判定，记录供下轮复用）：

- **production demo 构建 `<script setup>` 绑定不落 setupState**（探针实测：main-view 等 3 层组件 `Object.keys(setupState)` 均为空对象，`dataScale` 不可达）。设计附录 A 的 `setupState.dataScale/fixedLeftInput` 直替不可用 → 改为 demo 页真实 UI 控件驱动：`.ct-control` 按 span 文本锚定（「数据规模」radio `value=few` click；「fixedLeftColumns」input 赋值 + input 事件），走真实 v-model 链。断言语义零改动；`scaleSwitched=true` 证明切换生效。另在传输层增 `Page.reload`（重跑幂等，保证 A0「页面刚加载无选中」前置态）。

启停记录：headless Edge 由本验证启动（PowerShell Start-Process，Windows PID 16572，端口 9333），验证结束已 `taskkill //F //T //PID 16572` 终止（含 9 个子进程），端口仅剩 TIME_WAIT 无 LISTENING。demo watch（3000 端口）非本验证启动，未动。临时脚本 verify-cell-select.mjs 与临时用户目录已删除。

## 失败项

无。

## 证据文件

- evidence/browser-assert.json — 附录 A 全量断言输出（failed: [], errors: [], 29 键全 true）
- evidence/browser-assert.stderr.log — 空文件（node 无 stderr 输出）
