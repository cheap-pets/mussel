# 验证报告（终验，第 1 轮，整体实施）

VERDICT: FAIL

## 上轮问题核对（第 2 轮起）

首轮验证，无上轮报告。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build` | PASS（exit 0） | dev + ex-development + ex-production 三段构建全过：`dist/mussel.min.js 223.55 kB`、`dist/mussel.ex.js 673.02 kB`、`dist/mussel.ex.min.js 314.61 kB`，`✓ built in 500-572ms` |
| `npx eslint src demo/src` | PASS（exit 0） | `✖ 12 problems (0 errors, 12 warnings)`。其中 `demo/src/data/table-ex/main-view.vue:217` max-len 经 `git show HEAD` 比对为既有超长行（内容未变、仅行号偏移），其余 11 条均在无关文件——与派发口径一致 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 enum 注册可渲染 | 自检 + 浏览器 | 源码 `src/components/table/column-types/index.js:18` 注册 `enum: EnumColumn`；自检面板 `[cell-painters] enum 注册与 mappings 显示映射……注册命中 + align center` ✓；DOM 参照表（同列定义同数据源）状态列文本 `["启用","待处理","已归档",…]`；canvas 截图 `evidence/canvas-status-column.png` 状态列映射文本可见 | PASS |
| A2 enum+mappings 经 createDisplayMapper | 自检 + 浏览器 | 源码 `enum.js:8` `createDisplayMapper(column)`、`cell-painters.js:204-207` `_mapText` 门控 `type === EnumColumn`；自检「enum 注册与 mappings 显示映射：文本、对象形式与 default 兜底」✓、「映射文本参与精算行高：_mapText 显示文本进 ensureRowMeasured」✓；浏览器：状态列显示映射文本（DOM + canvas）、编辑开值显示「启用」 | PASS |
| A3 enum+options 兼容（优先级） | 自检 + 浏览器 | 自检「mappings/options 优先级：mappings 优先、仅 options 转换、未命中原值回退……number 不再映射」✓、「仅 options 的 select：column.options 原样下拉、开值不字符串化、数值提交类型保持」✓；浏览器：等级列显示「低/中/高」（DOM `level: ["低","中","高",…]` + canvas 截图）；锁定宽列（同 field 无 type）显示原值 1/2/3，佐证 options 仅 enum 生效 | PASS |
| A4 text 不走 mappings、color 保持 | 自检 + 浏览器 | 自检「prepareColumn：_mapText/_plainText 判定（enum 独有挂载 / text 忽略映射源短路 / 带色不短路）」✓、「text color：canvas 平铺色名、dom text-{c} class（字符串与函数色名两形态）」✓；浏览器：备注列非空格 `td class="mu-table__td text-primary"`、空值无染色 class；canvas 截图备注内容 2-9 呈 primary 蓝、首行空值无色。text+mappings 原值显示由自检 `_plainText === true` 短路断言覆盖 | PASS |
| A5 enum 编辑 select、写原始值 | 自检 + 浏览器 | 浏览器（状态格全链路）：点击状态格出现编辑器 `mu-select`（`hasSelect:true`），开值显示「启用」；下拉恰 3 项「启用/待处理/已归档」（排除 default）；点选「待处理」后编辑器保持打开且值「待处理」，DOM 参照表第一行状态列「启用」→「待处理」（= record 写入映射 key 原始字符串 `'pending'`，经映射严格相等匹配显示）；自检：「仅 options 的 select」块（数值提交类型保持）✓、提交矩阵/blur 的 selectColumn（enum）断言 ✓。等级格 select 交互未亲验（滚动受阻，见环境阻塞；等级列与状态列同为 enum 经 `COLUMN_TYPE_EDITORS`（editor.js:103）同一管线，options 原样通道由上述自检覆盖） | PASS |
| A6 其余类型 options 无效、无 select | 自检 | 浏览器补充：数量列（number + 显式 input editor）编辑器 `input`、值 `"0"`；金额列（currency）`input`；启用列（bool）编辑器无 input/select（switch 形态）；名称列（无 editor）不出现编辑器。自检（199 通过内含）：编辑器解析块 text+mappings→input、resolveEditorType 块 props.options 不再升级 select、_mapText/_plainText 判定块「number、currency 不挂全正确」、number+mappings 仍 Intl 文本 | PASS |
| 构建/静态检查（终验） | 命令 | 见「命令结果」：build exit 0、eslint 0 errors | PASS |
| demo 自检全绿（终验） | 浏览器 | `http://localhost:3000/data/table-ex/` 自检面板 **199/200 通过**，失败 1 条（见失败项 1） | **FAIL** |

## 范围核对

`git status --short`：9 个修改文件 + 未跟踪任务目录；`git diff --stat`：169 insertions / 134 deletions。

- 基线排除项：无（基线 clean @ 72149a7）
- 9 个修改文件与设计改动清单一一对应：`src/components/table/column-types/{enum.js,index.js,text.js}`、`src/components/table/ex/{cell-painters.js,editor.js}`、`demo/src/data/table-ex/main-view.vue`、`demo/src/data/table-ex/self-checks/{cell-painters.js,editor.js,painter.js}`。无设计外改动
- 不改动清单（mappings.js、row-geometry.js、base/*、layout.js、spans.js、interactions.js、form 组件）均未出现在工作区 ✓
- 验证产物：`dist/`（build 输出，已被 .gitignore 忽略）；`.playwright-mcp/`（已被 .gitignore 忽略，目录内 .gitignore 已含 `*` / `!.gitignore`）
- 未跟踪：`agent-docs/plans/20261104-enum-column-mappings/`（任务目录，派发指定排除）
- 实施记录「偏离」3 条所涉文件（self-checks/editor.js、self-checks/cell-painters.js、text.js）均在改动清单内 → 已记录-已覆盖

## 测试质量问题

- 新增/重写自检断言均断言具体值（映射文本、class 名、组件类名、提交值类型、数组内容、像素采样），非仅「不抛错」；painter 夹具显式 `align: 'left'` 防像素采样漂移，离屏像素块全过
- 疏漏 1 处（即失败项 1）：`resolveEditorProps` 块夹具未随「text 不再升级 select」的 A6 行为同步，仍在用 `type: 'text' + mappings` 构造 select 来源断言 options 注入。设计改动清单的 7 处 editor.js 自检同步点与实施「偏离」补的 2 处夹具（提交矩阵、blur 块）均未含此块

## 需人工检查

- 测试计划无「人工」手段项。可选复核：目视比对 `evidence/canvas-status-column.png`（状态列映射文本、等级列「低/中/高」、备注列 primary 染色与空值无色、锁定宽列原值 1/2/3 对照）

## 验收入口（PASS 时必填）

FAIL，不适用。失败项修复并复验通过后，可按设计测试计划执行：打开 `http://localhost:3000/data/table-ex/`，查看状态列映射文本、等级列「低/中/高」、备注列染色，单击状态格验证 select 下拉与写入，并在调试面板确认自检 N/N 通过。

## 环境阻塞

1. **等级列横向滚动交互受阻**：组件对程序化 `scrollLeft` 设置不感知（设 200 后点击命中与编辑器定位仍按 scrollLeft=0 布局，实验证据）；`page.mouse.wheel` 两次 60s 超时（滚动未生效，页面保持响应）；自定义滚动条 thumb 不可拖（track 0 尺寸）。影响：A5 等级格 select 交互子项未亲验（状态格已完整验证，判定不受影响）；widths 场景 text+mappings 列 canvas 文本未目验（自检 `_plainText` 断言覆盖）
2. console error `net::ERR_INVALID_URL data:image/png;base64,AAAA…`：既有自检夹具（`self-checks/cell-painters.js:742` badSrc，HEAD :694 已存在）测「损坏 data URI 直通」的预期副产物，非本任务引入，不影响判定

## 失败项（FAIL 时，不含环境阻塞）

1. 终验标准「demo 自检全绿」：自检 199/200。失败断言：`[editor] resolveEditorProps：number/currency 注入 type=number、props 透传、select options 注入` → `select 注入 options 期望 [{"value":"a","label":"A"}]，实际 undefined`。
   - 疑似位置：`demo/src/data/table-ex/self-checks/editor.js:519-525` —— 夹具 `{ type: 'text', editor: true, mappings: { a: 'A', default: '兜底' } }` 仍期望派生 select 并注入 options；改动后 text+mappings 解析为 input（`src/components/table/ex/editor.js` `resolveEditorType` → `resolveTextLikeEditorType`），`resolveEditorProps` 仅 `editorType === 'select'` 注入 options（editor.js:250），`options` 为 undefined。
   - 定性：自检夹具未同步（设计枚举缺口，与实施记录「偏离」1 同类），非源码行为缺陷——该失败恰是 A6「text 不再因 mappings 升级 select」的预期表现。定位方向：该块夹具改用 enum 类型或显式 `editor.type: 'select'` 来源（同「仅 options 的 select」块式样），断言意图「select 缺省注入 resolveSelectOptions 产物」保持不变。
