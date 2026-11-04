# 验证报告（终验，第 2 轮，整体实施）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

| 上轮条目 | 结论 | 本轮证据 |
|---|---|---|
| 失败项 1：demo 自检 199/200，`[editor] resolveEditorProps…select options 注入` 期望 `[{value:'a',label:'A'}]` 实际 undefined | **已解决** | 修复落点确认：`demo/src/data/table-ex/self-checks/editor.js:519-526` 夹具 `type: 'text'` → `'enum'` + 注释同步（`text+mappings 解析为 input，select 来源用 enum`），断言期望值不变；本轮亲验自检面板 **200/200 通过、失败项 0**，该条目 `✓ … select options 注入全部生效`（DOM 断言）；`npm run build` / `npx eslint src demo/src` 复跑均通过 |
| 环境阻塞 1：等级列横向滚动交互受阻（A5 等级格 select 交互未亲验） | **已解除** | 绕过方式与上轮不同：不改滚动，改可视域——demo 页自带舞台拖拽手柄（`demo/src/data/table-ex/main-view.vue` `onStageResizeStart`），playwright 拖拽加宽舞台 960→1700px，等级格（col 9）免滚动进入视口；等级格 select 全链路亲验通过（见 A5 行）。上轮 UNVERIFIED 子项消除 |
| 环境阻塞 2：console `ERR_INVALID_URL data:image/png;base64,AAAA` | 仍在（预期副产物） | 4 条 error 全部为该 URI；夹具 `demo/src/data/table-ex/self-checks/cell-painters.js:742` badSrc（HEAD 即存在），非本任务引入，不阻塞任何标准 |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | PASS（exit 0） | dev + ex-development + ex-production 三段构建全过：`dist/mussel.min.js 223.55 kB`、`dist/mussel.ex.js 673.02 kB`、`dist/mussel.ex.min.js 314.61 kB`，`✓ built in 501-586ms` |
| `npx eslint src demo/src` | PASS（exit 0） | `✖ 12 problems (0 errors, 12 warnings)`。11 条在未触碰文件（case-form/grid-designer/gesture/data/table/layout×3/spans.js/resize.js——spans.js 不在工作区改动列表）；1 条 `demo/src/data/table-ex/main-view.vue:217` max-len 经与 `git show HEAD:…:217` 逐字比对为既有超长行（内容一致），非本任务引入 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 enum 注册可渲染 | 自检 + 浏览器 | 源码 `src/components/table/column-types/index.js:18` `enum: EnumColumn`；自检面板「enum 注册与 mappings 显示映射……」✓；DOM 参照表状态列文本 `["启用","待处理","已归档","启用","待处理","已归档"]`；canvas 截图 `evidence/canvas-round2-widened.png` 状态列映射文本可见 | PASS |
| A2 enum+mappings 经 createDisplayMapper | 自检 + 浏览器 | 源码 `enum.js:8` `createDisplayMapper(column)`、`cell-painters.js:204-206` `_mapText` 门控 `type === EnumColumn`；自检「enum 注册与 mappings 显示映射」「映射文本参与精算行高」✓；浏览器：状态列映射文本（DOM + canvas 截图）；点击状态格编辑开值显示「启用」（映射 label） | PASS |
| A3 enum+options 兼容（优先级） | 自检 + 浏览器 | 自检「mappings/options 优先级」「仅 options 的 select」✓；浏览器：等级列显示「低/中/高」（DOM 数组 + canvas 截图）；同 field 无 type 的「锁定宽」列显示原值 1/2/3，佐证 options 仅 enum 生效；等级格编辑下拉恰 3 项「低/中/高」 | PASS |
| A4 text 不走 mappings、color 保持 | 自检 + 浏览器 | 自检「_mapText/_plainText 判定」「text color 双通道」✓；浏览器 DOM：备注列 row1（空值）td class `mu-table__td` 无染色 class，row2-9 `mu-table__td text-primary`；canvas 像素采样（getImageData）：备注 row0 空值 blue=0/dark=0、row1/2 非空 blue=362/356（primary）、名称列基线 dark=134/blue=0（默认色对照）；text+mappings 原值显示由自检 `_plainText === true` 短路断言覆盖 | PASS |
| A5 enum 编辑 select、写原始值 | 浏览器（双格全链路） | **状态格**：点击开 `mu-select`（开值「启用」），下拉恰 3 项「启用/待处理/已归档」（排除 default），点选「待处理」→ 事件 `update:cell-value {record:#1, field:'status', value:'pending'}`（原始 key 字符串写入），record 状态 `pending`，DOM 参照表/画布同步显示「待处理」。**等级格**（上轮阻塞已解除）：点击开 `mu-select`（开值「低」，不字符串化），下拉恰 3 项「低/中/高」，点选「高」→ 事件 `update:cell-value {field:'level', value:3}`（`typeof === 'number'` 原类型），record `level=3`，参照表等级「高」、锁定宽「3」；自检「仅 options 的 select」「提交矩阵/blur selectColumn」✓ | PASS |
| A6 其余类型 options 无效、无 select | 浏览器 + 自检 | 浏览器：数量格（number）编辑器 `input type=number` 值 `"0"`；金额格（currency）`input`；启用格（bool）编辑器 `mu-switch` 无 input/select；名称格（无 editor）不开编辑器——全程无 select 出现，Esc 均正常收起；「锁定宽」（无 type + 同 field options）显示原值 1/2/3 无映射。自检（200 内含）：text+mappings→input、props.options 不升级 select、_plainText 判定块 number/currency 不挂、number+mappings 仍 Intl 文本 | PASS |
| 构建/静态检查（终验） | 命令 | 见「命令结果」：build exit 0、eslint 0 errors | PASS |
| demo 自检全绿（终验） | 浏览器 | `http://localhost:3000/data/table-ex/` 自检面板 **200/200 通过**，失败项 0（上轮失败条目本轮 DOM 断言 ✓） | PASS |

## 范围核对

`git status --short`：9 个修改文件 + 未跟踪任务目录；`git diff --stat`：171 insertions / 135 deletions（较上轮 +2/-1，为修复轮 editor.js 单夹具改动，与 04-impl-修复-1.md 改动文件一致）。

- 基线排除项：无（基线 clean @ 72149a7）
- 9 个修改文件与设计改动清单一一对应：`src/components/table/column-types/{enum.js,index.js,text.js}`、`src/components/table/ex/{cell-painters.js,editor.js}`、`demo/src/data/table-ex/main-view.vue`、`demo/src/data/table-ex/self-checks/{cell-painters.js,editor.js,painter.js}`。无设计外改动
- 不改动清单（mappings.js、row-geometry.js、base/*、layout.js、spans.js、interactions.js、form 组件）均未出现在工作区 ✓（eslint 警告涉及 spans.js:336 未被修改，警告既有）
- 验证产物：`dist/`（build 输出，已被 .gitignore 忽略）；`.playwright-mcp/`（已被 .gitignore 忽略，目录内 .gitignore 含 `*` / `!.gitignore`）
- 未跟踪：`agent-docs/plans/20261104-enum-column-mappings/`（任务目录，派发指定排除）
- 实施记录两轮「偏离」5 条与修复轮改动所涉文件（self-checks/editor.js、self-checks/cell-painters.js、text.js）均在改动清单内 → 已记录-已覆盖

## 测试质量问题

- 上轮疏漏（`resolveEditorProps` 夹具未随 A6 行为同步）已修复；修复保持原断言意图「select 缺省注入 resolveSelectOptions 产物」与期望值不变，非削弱断言
- 自检断言均断言具体值（映射文本、class 名、组件类名、提交值类型、像素采样），非仅「不抛错」；本轮浏览器补充断言（编辑器形态、下拉选项数组、提交事件载荷值与类型）与自检互证，无新问题

## 需人工检查

- 测试计划无「人工」手段项，本轮全部标准已自动化验证。可选复核：目视比对 `evidence/canvas-round2-widened.png`（加宽后状态列「启用/待处理/已归档」、等级列「低/中/高」、锁定宽原值 1/2/3、备注列非空 primary 蓝 + 首行空值无色）与 `evidence/canvas-round2-after-edit.png`（row1 编辑后状态「待处理」、等级「高」、锁定宽「3」画布重绘）

## 验收入口（PASS 时必填）

1. （A1/A2/A3/A4）浏览器打开 `http://localhost:3000/data/table-ex/`：状态列显示「启用/待处理/已归档」、等级列「低/中/高」、同取值「锁定宽」列显示原值 1/2/3、备注列非空行蓝色（primary）且空值行（第 1 行）无色。
2. （A5）同页点击状态列任一格 → 出现 select 下拉（恰 3 项，无「未知」），选「待处理」后单元格显示「待处理」；拖拽舞台右下角手柄加宽至「等级」列可见，点击等级格 → 下拉「低/中/高」，选「高」后等级列显示「高」、锁定宽列变 3。
3. （A6）同页点击数量/金额格 → 出现 input（无下拉）；启用格 → switch；名称格 → 不出编辑器。
4. （A4 text 不映射）切「夹具场景」到「全类型默认宽」：状态列（text+mappings）显示原值 active/pending（不再映射）。
5. （构建/自检）终端跑 `npm run build` 通过；demo 页「调试面板」显示自检「200/200 通过」。

## 环境阻塞

无。（备注：console 4 条 `net::ERR_INVALID_URL data:image/png;base64,AAAA` 为既有自检夹具 `self-checks/cell-painters.js:742` badSrc「损坏 data URI 直通」的预期副产物，HEAD 即存在，非本任务引入，不影响任何标准判定。）

## 失败项（FAIL 时，不含环境阻塞）

无。
