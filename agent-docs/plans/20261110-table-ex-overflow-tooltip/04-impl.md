# 实施记录

基线 git clean @ 634e947（dev），本轮按 02-design.md 终稿（含裁决记录 1/2）完整实施。

## 改动文件

| 路径 | 设计步骤 |
|---|---|
| `src/components/table/ex/interaction/hit-test.js` | 1.1-1：`resolveTooltipTarget` 门控 `!title` → `title === false`（L185）；JSDoc :170-181 同步 |
| `src/components/table/ex/cell-paint/cell-tooltip.js` | 1.1-2：`resolveCellTooltip` 真值矩阵重写（`raw === false || raw === '' || raw === 0` → null；`raw !== true && raw != null` → 自定义路径，L220-227）；文件头 :1、JSDoc @returns :214 同步 |
| `src/components/table/ex/table-ex.vue` | 1.1-3：`tooltipEnabled` computed `some(col => col?.title !== false)`（L461）；区块注释 :460、devWarn 文案 :466 按设计逐字替换 |
| `src/components/table/ex/composables/use-cell-tooltip.js` | 1.1-4：注释措辞 :49-51（无 title 目标 → 无 tooltip 目标（…/title:false 列））、:150（显式关闭 / 无文本源 / …），无行为改动 |
| `src/components/table/ex/cell-paint/cell-content.js` | 1.1-5：注释措辞 :77-78（「仅按 title === false 显式关闭门控」），无行为改动 |
| `demo/src/data/table-ex/self-checks/interactions.js` | 1.2：模块头 :17-18；块名/fixture（5 列含 `title: ''`）/:807 替换（未设置放行 [3,0]）/title:false 保留改 label/新增空串放行 [3,4]/返回串，均按设计逐字 |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 1.2：模块头 :32-35；块名/内联注释/`plain` 三断言（短文本 content、overflow:false、长文本 overflow:true）/false·''·0·空串返回 保留/返回串，均按设计逐字 |
| `demo/src/data/table-ex/main-view.vue` | 2.1：`createRecords` 增 `longText`（偶短/奇长 31 字）；`createDefaultColumns` 状态列后插 2 列（长文本溢出提示 / title:false，宽 150）。2.2：`itemRecords` row1 增 `tagsOverflow:['短标','甲']`+`buttonsOverflow:[{caption:'短'}]`（未溢出对照）、row2 增 8 标签+双按钮（溢出）；`itemColumns` 名称列后插 2 列（tag/button 溢出，宽 150，button 用 `buttons: record => record.buttonsOverflow`） |

无新增文件、无 scss 改动，与设计一致。

## 偏离

1. **设计 1.1 完成判据与自身指令计数重叠（非行为偏离）**：判据要求 `grep "title === false" hit-test.js` 命中 1 处，但设计同一步骤要求 JSDoc 写入「title === false」措辞 → 实际命中 2 处（L172 JSDoc 描述 + L185 门控行）。门控行翻转判据实质满足，未删 JSDoc 措辞（删则违背 1.1-1 指令）。
2. **eslint 新增 1 条 warning（非 error）**：`cell-tooltip.js:216 resolveCellTooltip complexity 12 > 10`。旧实现 `if (!raw)`（+1）换为设计逐字给定的真值矩阵（`||`×2 + `&&`×1，+3）所致。判据为退出码 0，已满足；按「不做设计外改动」未做拆函数重构，留 verifier/用户裁决。
3. **浏览器验证手段**：本实例无 playwright mcp 工具。按设计兜底口径（Edge headless + DOM 断言）执行：A4 用 `--headless=new --virtual-time-budget --dump-dom`；A1/A2/A3 hover 交互 dump-dom 无法驱动，改用零依赖临时 Node CDP 脚本驱动 Edge headless（`Input.dispatchMouseEvent` + `Runtime.evaluate` DOM 断言），脚本在系统临时目录（不入库），环境与断言口径（computed display / getClientRects / textContent / 300ms 显示延迟等 600ms、hide 等 700~800ms）与设计测试计划一致。
4. **demo 服务**：本任务起的 `npm run demo:build` 因 3000 端口 EADDRINUSE 退出；:3000 为既有常驻 watch 实例，复用之（touch 后实测 bundle 已重建并包含全部新改动）。

## 自检

命令与结果（全部实测）：

- `grep -n "title === false" src/.../hit-test.js` → 2 处（L172 JSDoc / L185 门控，见偏离 1）
- `grep -n "title !== false" src/.../table-ex.vue` → 1 处（L461）
- `grep -n "raw !== true && raw != null" src/.../cell-tooltip.js` → 1 处（L225）
- `grep -n "if (!raw) return null" src/.../cell-tooltip.js` → 0 命中（旧分支已删）
- `grep -rn "无 title" demo/src/data/table-ex/self-checks/` → 0 命中（EXIT=1，旧口径清零）
- `npx eslint --ext .js,.vue src` → EXIT 0（1 warning complexity，见偏离 2）
- `npx eslint --ext .js,.vue src demo/src` → EXIT 0（终验）
- `npx stylelint "src/**/*.scss" "demo/src/**/*.scss"` → EXIT 0（glob 加引号）
- A4（default 场景，Edge headless dump-dom + virtual-time-budget）：`.ct-check-item--fail` = 0，面板头 `自检结果（243/243 通过）`
- A4（items 场景，同法）：`.ct-check-item--fail` = 0，`自检结果（243/243 通过）`
- A1/A2/A3（CDP 驱动 Edge headless，9/9 PASS）：
  - A1 溢出格(1,4)显示全文 tooltip：PASS（text = 极长文本夹具：…完整内容提示，display block）
  - A1 未溢出格(0,4)无 tooltip：PASS（display none）
  - A3 前置 (1,4) 再次出面板：PASS
  - A3 title:false 列(1,5)无 tooltip：PASS（等 800ms 后 display none）
  - A2 items 场景生效（colWidths len=13、first3=[120,150,150]）：PASS
  - A2 tag 溢出(1,1)显示 8 项 '；' join 全文：PASS
  - A2 button 溢出(1,2)显示 `短；这是一条超长按钮文字标题溢出提示夹具`：PASS
  - A2 tag 未溢出(0,1)无 tooltip：PASS；A2 button 未溢出(0,2)无 tooltip：PASS

验收标准 A1-A5 全部满足；URL 均带 cache-bust；自检只取 onMounted 首次自动运行结果（未点重跑）。

## 遗留

- **非本任务的工作区改动**：`demo/src/form/form/main-view.vue`（mu-form-field 加 `error=""`，2 行）出现在本任务收尾阶段（mtime 07:30:58，晚于本任务最后编辑 07:26:48），非本实例所为，未触碰、未回退（回退属危险操作，需用户决定）。eslint/stylelint 已覆盖该文件且通过，不影响 A5。
- canvas 默认开启 / DOM 版 base/table 原生 title 仍只对 truthy 生效的语义分叉为设计已确认的范围外项；统一口径需另立任务。
- 文档三处同步（skills/references、docs/quick-reference、docs-site）按 00-task 约束延后至用户确认后处理。
- 本轮 CDP 驱动脚本在系统临时目录（`%TEMP%/table-ex-impl-verify/cdp.mjs`），verifier 如需复跑可直接取用或改用 playwright mcp 重验。
