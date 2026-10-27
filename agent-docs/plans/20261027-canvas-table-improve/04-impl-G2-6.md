# 实施记录：G2-6（self-checks/theme.js）

模式：并发（波 2b / 步骤 G2-6）。白名单：`demo/src/data/canvas-table/self-checks/theme.js`（仅此文件）。依赖：G1-c（theme.js hover 落地形态）已合入，按 04-impl-G1-c.md 实际实现写断言。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| demo/src/data/canvas-table/self-checks/theme.js | G2-6（测试计划 A7 行 + 改动清单 self-checks/theme.js 行） | 见下 |

改动摘要（仅新增/改写断言与注释，不改既有断言逻辑）：

- **文件头 docblock**：标注「G1-b，G2-6 扩 hover」；colors 形态表述「每色 color+translucent 双形态」→「三形态」，补 hover 专项覆盖说明（语义 -4 原始串 / 彩色同色 / 未定义回退，02-design.md A7）。
- **既有「readSnapshot.colors：固定 17 色」块**（设计改动清单所指 :303 块）：块名与 detail 文案「双形态」→「三形态」；对象形态断言消息改为 `{ color, translucent, hover }`；逐色循环内追加 hover 字段断言——非空字符串 + assertValidCssColor（仅形态校验，分支细节归新增专项块，避免同一断言写两遍）。
- **新增 hover 专项块**（插在 17 色块之后）：
  - 语义 5 色：`colors[name].hover === getPropertyValue('--mu-{name}-color-4').trim()` 原始串（与 G1-c 实现同探针同读取方式，逐字对齐「以 04-impl-G1-c.md 实际实现为准」）；非空且 `≠ color`（root.scss 0–9 谱系下 -4 为浅色，悬停变浅的前提）；assertValidCssColor（-4 为具体色值，src/colors.js 产物，非 token，G1-c 已核实）。
  - 彩色 12 色：`hover === color`（G1-c 实现 `hover: color` 逐字；link.scss 先例无 -4 谱系）。
  - 未定义回退：夹具 `--mu-primary-color-4: initial`（guaranteed-invalid，getPropertyValue 得 `''`）→ 断言 `colors.primary.hover === colors.primary.color`（实现 `raw || color` 回退；自定义主题裁剪该变量时悬停色不落成探针继承色黑）。
- **既有「snapshotsEqual」块**（设计所指 :419 块）：colors 维度注释「单色 color 变化判不等」扩为三维度；新增 `hoverChanged` 用例（单色 danger.hover 改值 → `!snapshotsEqual`，注释记「换肤触发重绘的前提」——mutation 门控下 hover 不敏感则换肤不通知 onChange）；summary 文案同步。

## 断言清单（本步新增/改写）

1. 17 色逐色：`hover` 非空字符串（既有块内追加）。
2. 17 色逐色：`hover` 为合法 CSS 颜色形态、非 `var(` token（既有块内追加）。
3. 语义 5 色：`hover === --mu-{name}-color-4` 原始串（夹具内同探针双读比对）。
4. 语义 5 色：`hover` 非空且 `hover !== color`。
5. 彩色 12 色：`hover === color`。
6. 未定义回退：`--mu-primary-color-4: initial` → `colors.primary.hover === colors.primary.color`（含夹具前提自证断言：initial 后原始串为 `''`）。
7. snapshotsEqual：单色 hover 变化判不等（colorsEqual 对 hover 敏感 → 换肤触发重绘前提）。

## 自检（完成判据逐条）

| 判据 | 命令 / 方式 | 结果 |
|---|---|---|
| eslint 单文件通过 | `NODE_PATH=/usr/local/lib/node_modules npx eslint demo/src/data/canvas-table/self-checks/theme.js` → exit 0，无输出 | PASS（0 error / 0 warning） |
| snapshotsEqual hover 维度（纯函数部分可直调） | `node --input-type=module` 直调 `src/components/canvas-table/theme.js` 的 `snapshotsEqual`：同值浅拷贝 true；单色 hover 改值 false；缺 hover 字段 false（undefined ≠ 值）；单色 color 改值 false | PASS（4 断言） |
| DOM 绑定断言直调走查（文件依赖 document/CSS.supports，无法 node 直跑；页面级验证按派发不做） | 逐条对照 G1-c 后 theme.js 实现：① 彩色 `hover: color`（theme.js:89）→ 断言 5 逐字成立；② 语义 `hover: getPropertyValue(...).trim() || color`（:95-100）→ 断言 3 与实现同读取方式恒等、断言 4 依赖 -4 谱系浅色 ≠ 基础色（root.scss :23-25 全量定义、src/colors.js palette 产物）；③ `raw || color` 在 raw `''` 时回退 → 断言 6 成立；④ 断言 2 对彩色 hover（readVar 计算值）与语义 hover（具体色值）均通过 assertValidCssColor 两条件 | PASS（走查逐条核对着落点） |
| 回退夹具平台前提 | playwright（about:blank，未触碰 demo 页面）evaluate：`--x: initial` → `getPropertyValue` 为 `''`；`--x: #419de2` → `'#419de2'` | PASS（guaranteed-invalid 行为实测确认） |
| 白名单 | 本轮仅改 self-checks/theme.js；self-checks/index.js 已有 `./theme.js` 导入注册（既有机制，无需新注册行） | PASS |

## 偏离

无。

（边界内说明，非偏离：① 新文件注册问题不适用——self-checks/theme.js 为既有文件，index.js:16 已导入注册；② 「既有 :303 块字段集合断言放开」落地为追加 hover 字段校验而非枚举键名（原块本就未做严格键枚举，无误红风险，与设计括注意图一致）；③ 回退用例的平台前提（custom property `initial` → 空串）经 about:blank 实测确认，属平台行为核查，非页面级验证。）

## 遗留

- 本组不做页面级验证（派发判据）。A9 运行时面板全表（含本步 +1 条断言后的新基线总数）由 V 集成验证执行；总数以运行时实际值为准。
- 断言 4（语义 `hover !== color`）依赖默认主题 -4 谱系与基础色不同值；若未来自定义主题把 color4 配成与基础色同值，该断言会红——属设计明示的断言语义（「语义色非空且不等于 color」），非缺陷。
- eslint 环境沿用前序各组备注：需 `NODE_PATH=/usr/local/lib/node_modules` 前缀（本地 node_modules 缺 eslint-config-standard）。
