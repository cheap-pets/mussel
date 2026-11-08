# 实施记录

模式：缺陷修复（自检重跑判错）。任务派发：fast 槽位 implementer，2026-11-08。

## 根因

自检项「icon 列：非法值/未注册名空产物 + dev warn、null 静默不 warn、占位文本落地」（demo/src/data/table-ex/self-checks/cell-painters.js:2283）重跑判错：

- dev warn 为 warn-once 去重：src/utils/warn.js:11-16（`warned` Set，键 = `prefix_message`，once 默认 true）。
- 「非 string」warn 消息为固定串 `icon 列 value 须为注册名字符串，实际类型 ${typeof value}`（src/components/table/column-types/icon.js:53）→ 固定键。首跑发出并入集，重跑被去重不再发出。
- 断言仍按首跑口径要求 warn 发出：cell-painters.js:2298 `assert(warnings.some(w => w.includes('实际类型 number')), '非 string dev warn 一次')` → 重跑恒败。

其余 warn 断言不受影响：未注册名消息含 `Date.now()` 唯一名（cell-painters.js:2300、2481），warn 键每次运行唯一，重跑仍发出（table-ex-counter-assert-warm-cache 同理：键唯一化规避去重/预热）。playwright 实测重跑唯一判错项即此断言（错误消息「非 string dev warn 一次」，页面 240/241）。

## 重跑标志机制

runner 内聚重跑计数，向每个自检项 fn 传 `isRerun`：

- demo/src/data/table-ex/self-checks/index.js:48-51：模块级 `checkRunCount` 计数，第 2 次及以后 `runChecks` 调用 `isRerun = true`，`check.fn(isRerun)` 传入。main-view.vue 无需改动（`runSelfChecks` 签名不变）。
- 自检项 `fn: (isRerun) => {...}` 按需接收；其余自检项 fn 无参，不受影响。

## 改动文件

- demo/src/data/table-ex/self-checks/index.js — runChecks 重跑计数 + `check.fn(isRerun)` 传参 + 注释（根因「重跑标志机制」）
- demo/src/data/table-ex/self-checks/cell-painters.js — icon 项 `fn: (isRerun)`（L2284）；「非 string dev warn」断言按 isRerun 分支（L2299-2305）：首跑口径原样保留（`warnings.some(...)`），重跑断言「未重复触发」（`!warnings.some(...)`，warn-once 去重语义）

首跑期望值：全部自检项零改动，仅 icon 项原断言文本与位置不变（移入 else 分支）。

## 偏离

无。

## 自检

已运行命令与结果（playwright mcp，DOM 断言）：

1. 修复前复现：全新加载 `http://localhost:3000/data/table-ex/` → 「自检结果（241/241 通过）」；点「重跑自检」→ 「自检结果（240/241 通过）」，唯一判错项 `[cell-painters] icon 列：非法值/…`，错误消息「非 string dev warn 一次」。与派发根因吻合。
2. 修复后（cache-bust 强制加载新 bundle，绕过 demo 服务器无 Cache-Control 头的启发式缓存）：
   - 全新加载 → 「自检结果（241/241 通过）」，icon 项 ✓（首跑口径不变）
   - 点「重跑自检」→ 「自检结果（241/241 通过）」，icon 项 ✓，`✗` 计 0
   - 再次「重跑自检」（第 3 次，isRerun 恒 true）→ 「自检结果（241/241 通过）」（幂等）
3. console：error 仅 `data:image/png;base64,AAAA` 资源加载失败 ×N——自检夹具故意的非法图片 URL（img onerror 降级测试），每次运行 +1，既有预期；无新增错误类型。
4. `/d/npm/global/eslint` 两改动文件 → 0 errors；1 条既有 max-len warning（cell-painters.js:2629，本次插入 5 行导致行号偏移的原 L2624 既有行），不属本次改动，未处理。

环境备注：demo watch（vite build --watch，PID 4896）对 Edit 写入未触发重建，touch 源文件后重建正常（产物 demo/dist/data/table-ex/main.js 09:10:26 更新含新代码）；浏览器侧需绕缓存验证（server 响应无 Cache-Control）。

## 遗留

- demo watch 对 Edit 工具写入不触发重建的机制未深究（touch 可触发）；与本次修复无关。
- HMR/组件重挂载场景下 `checkRunCount` 不重置，重挂载后首跑会被视为重跑（warn 断言走「未重复触发」分支）。demo 页正常使用（onMounted 首跑 + 按钮重跑）不受影响；如需精确可在 runChecks 加重置入口，当前无此需求。
