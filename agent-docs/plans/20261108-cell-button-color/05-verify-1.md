# 验证报告（第 1 轮）

VERDICT: PASS

基线：branch dev @ e6354ee + 上轮 cell-button 未提交改动（上轮已终验 PASS，agent-docs/plans/20261108-cell-button/，终验报告 05-verify-2.md）。验证对象 = 本轮新增改动（04-impl.md「改动文件」7 项）。

## 上轮问题核对（第 2 轮起）

不适用：本轮为第 1 轮验证。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | exit 0 | ex-development + ex-production 两次 vite build 均成功（后台任务 exec_8ba03693 完成通知 exit 0） |
| `eslint src demo/src`（全局 8.57.0，实测 v8.57.0） | 9 errors / 28 warnings，全为存量，0 新增 | 9 errors：table-ex-benchmark/main-view.vue:506-510（5，文件未脏）、table-ex/main-view.vue:347,349（import/first，上轮文件本轮未动）、self-checks/painter.js:1261,1271（spaced-comment）。判据：painter.js 本轮 `git diff -U0` hunk 新行号最大触及 1186，报错行不在任何 hunk 内；上轮报 1259,1269（上轮 05-verify-2.md:21）→ 本轮 THEME 夹具 +2 行移位为 1261,1271，行内容未变 |
| `node scripts/table-ex-structure-check.mjs` | exit 0 | OK — 扫描 46 个文件，零纯转发 re-export |
| `node scripts/table-ex-host-audit.mjs` | exit 0 | OK — 审计 10 个 composables，host 键声明零缺失（use-pointer used=24/declared=28、use-paint-state used=23/declared=26） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 默认态 = --mu-text-color-soft；按钮区内 = primary；移出恢复默认；移出格消失 | 浏览器像素扫描（playwright run_code + page.mouse 真实输入） | 期望色页面现算：探针 getComputedStyle 经 color 求值（同 theme.js readVar 手段）→ soft=rgb(150,156,162)、primary=rgb(28,126,214)，与 `getThemeSnapshot()` 一致，未硬编码。备注列（svg dots，getCellRect(1,7)，按钮区按 cellButtonRectOf 公式 24×24，DPR1.5 物理 36×36=1296px）：T1 格内非按钮区 soft minDist=0/exactPx=24；T2 按钮区中心 primary minDist=0/exactPx=24 且 soft 残留 0（minDist=69.1）；T3 移回格内 soft minDist=0/exactPx=24 且 primary 残留 0；T4 移出格 darkPx=0、双色 0 命中（按钮消失）。cls 形态（启用列 demoGlyphA）同过：soft minDist=0/338px → primary minDist=0/334px。全量数据 evidence/pixel-scan.txt | PASS |
| A2 颜色走主题快照既有通道，无硬编码 hex/rgba；新增快照键仅只读 | 静态（git diff hunk + grep + 读码） | paint-overlay.js:213 `color: isSamePoint(state.cellButtonHover, hover) ? theme.primaryColor : theme.textColorSoft`；该文件全量 diff（85 行）grep `#[0-9a-f]{3,8}|rgba?\(|hsl` 零命中。`textColorSoft` 为快照只读新增（src/components/table/ex/shared/theme.js:104，--mu-text-color-soft），`primaryColor` 为既有键（theme.js:116）；snapshotsEqual 按 Object.keys 泛型比较（theme.js:245-247）新键自动纳入。其余 6 个改动文件 diff 唯一颜色串命中 = demo self-checks/painter.js:56 THEME 离线夹具 'rgba(96,102,112,1)'（stub 自检夹具值，非绘制取色路径；离线自检 THEME 各色均为夹具自治值，与真实主题无关） | PASS |
| A3 非 button 绘制路径不受影响；self-checks 全绿含 icon 用例 | 静态范围核对 + 浏览器面板 | 本轮 7 改动文件不含 icon 列（column-types/icon.js、cell-paint/icon-image.js）与条目按钮（cell-painters.js）文件；paint-overlay.js 全量 diff 仅 paintCellButton 两态色/门控/注释。页面「自检结果」243/243 通过、DOM 断言 ✗ 项 0；icon 既有用例全 ✓（resolveIconEntry 注册/未注册、icon 列双通道、drawIconGlyph cls/svg、requestIconImage、icons install）；格按钮用例 ✓（painter 绘制调用路径、cellButtonRectOf 几何、门控）。console 全会话唯一 ERROR = `data:image/png;base64,AAAA` 坏图夹具（cell-painters.js 存量，上轮 05-verify-1.md:24/05-verify-2.md:34 已记录为预期）；本轮会话新增仅 1 条 Canvas2D willReadFrequently 提示 = 本验证 getImageData 扫描手段自身触发（console.log 末条），非页面代码报错 | PASS |
| A4 build exit 0；eslint 改动文件 0 新增 | 命令 | 见「命令结果」表：build exit 0；9 errors 逐条对照 hunk 全为存量位置 | PASS |

## 范围核对

`git status --short`：21 脏（18 M 代码 + 2 M 知识库 + 1 D）+ 4 未跟踪。`git diff --stat`：21 files, +213/−162。

- 基线排除项（上轮改动，已终验 PASS，不计设计外）：16 M 代码文件（main-view.vue、self-checks/{cell-painters,editor,interactions,painter,theme}.js 中非本轮清单者、column-types/icon.js、icon-image.js、use-cell-click.js、editor-geometry.js、editor.js、hit-test.js、constants.js）、D edit-button.js、?? cell-button.js、知识库 2 M（INDEX-table.md、table-ex-structure-map.md）、?? table-ex-editing-cell-gate.md、?? plans/20261108-cell-button/。
- 本轮改动（04-impl.md 清单，全部落实）：src/shared/theme.js、self-checks/theme.js 为基线外新脏文件（本轮新增，diff hunk 全为 textColorSoft 相关：theme.js:103-104 快照键 + 注释 21→22）；paint-overlay.js、table-ex.vue、use-pointer.js、use-paint-state.js、self-checks/painter.js 与基线脏列表重叠 → **无法区分**（两轮 diff 合并，无法按 hunk 归属轮次），均在本轮清单内，不计设计外。
- 验证产物：plans/20261108-cell-button-color/（本任务目录）；.playwright-mcp/（已 .gitignore）。
- 设计外改动：无（当前全部脏文件均归属上轮基线或本轮清单）。

## 测试质量问题

无。本轮同步用例为具体断言非"不抛错"：self-checks/theme.js:251 键表含 'textColorSoft'、fixedCount===22 断言与总键 23 断言（sync 自实施）；self-checks/painter.js:1164 `requestIconImage(icons[cellIconName].svg, THEME.textColorSoft)` 保持与 paintCellButton 同源色串（缓存键一致，避免断言自建键假绿）。两态色的运行时像素行为离线 stub 无法断言（用例名注明"像素归浏览器"），已由 A1 像素扫描覆盖。

## 需人工检查

无。A1 视觉切换已由像素断言覆盖（minDist=0 级一致），无需人工复核。

## 验收入口（PASS 时必填）

- A1/A3 — demo 服务运行中（:3000 预存在）时，浏览器访问 `http://localhost:3000/data/table-ex/?v=any`（任意参数 cache-bust）：①「调试面板 → 自检结果」显示 **243/243 通过**；② 鼠标悬停「备注」列任一格 → 行内右侧出现 dots 图标（柔和灰），指针移到图标上 → 变主题蓝，移回格内其他位置 → 恢复灰，移出格 → 图标消失；「启用」列 demoGlyphA 同行为。
- A2/A4 — 终端执行：`npm run build`（预期 exit 0）；`eslint src demo/src`（9 errors 均为存量位置：table-ex-benchmark/main-view.vue:506-510、table-ex/main-view.vue:347,349、table-ex/self-checks/painter.js:1261,1271，报错行不在本轮 diff hunk 内）；核对取色行 `src/components/table/ex/table-paint/paint-overlay.js:213` 仅为 `theme.primaryColor : theme.textColorSoft`。

## 环境阻塞

无。demo 服务为预存在（非本验证启动，无 PID 责任）；playwright 页面验证结束即关闭；未执行 touch（页面「22 固定字段」用例文本证明本轮改动已被 demo watch 重建生效）。

## 失败项（FAIL 时）

无。
