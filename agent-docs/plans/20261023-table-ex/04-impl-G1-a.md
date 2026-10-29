# 实施记录 — G1-a（theme.js + 对应自检）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/table-ex/theme.js` | G1-a | 主题模块：`createProbe`（隐藏探针）、`readVar`/`readPx`/`readFont`/`readInheritedFontSize`（--mu-* 颜色经真实属性求值、字体 token 原读、继承字号）、`readSnapshot`（设计 A7 快照 17 字段）、`resolveObserverRoots`（closest('.mu-root') 与组件根，Set 去重，无祖先兜底 documentElement）、`withAlpha`、`createMeasureCache`（`text+'\u0000'+font` 键，上限 2000 超限清空）、`createThemeWatcher`（探针 + 快照 + MutationObserver rAF 节流〔attributeFilter class/style〕+ window resize 重读 devicePixelRatio + `refresh()` 手动兜底 + `destroy()` 清理） |
| `demo/src/data/table-ex/self-checks/theme.js` | G1-a | 自检断言 10 条：探针挂载形态、readVar 颜色格式（11 个变量全量）、相对色变量求值（计算值 ≠ token 串 + alpha < 1）、readPx 内联尺寸变量与嵌套覆盖级联（36/48）、readFont token 原读（含 m1 回归守卫）、readInheritedFontSize（基线 + 18px 父链）、withAlpha 三类输入、readSnapshot 字段齐全与形态、resolveObserverRoots 三场景、createThemeWatcher 接线/refresh 同步通知/destroy 清理、createMeasureCache 命中/换 font/超限清空。尺寸变量全部来自自检容器内联 `style.cssText`（`--row-height: 36px` 等，值同 table.scss 镜像），不依赖 table-ex.scss |

与 G0 衔接：`self-checks/index.js` 既有 `import { checks } from './theme.js'` 聚合，本步仅填充该数组，聚合入口与页面面板零改动。

## 偏离

无设计偏离。两点实现形状选择（设计未规定模块导出形状，记录备查）：

1. **新增 `createThemeWatcher` 聚合工厂**：设计 A7 只给出 readVar 等函数片段与 MutationObserver 代码段；派发把「window resize 重读 devicePixelRatio」归入 theme.js，故以工厂收口（探针 + 快照 + MutationObserver + resize/DPR + refresh/destroy），S1 经 `createThemeWatcher({ probeHost, componentRoot, onChange })` 一次接线。`onChange(snapshot, reason)` 后由组件侧 relayout + 整幅重绘（A2 触发点清单的组件侧职责不变）。
2. **`readPx`/`readInheritedFontSize` 对 NaN 回退 0**（`parseFloat(...) || 0`）：设计未规定变量未定义时的返回值；回退 0 避免 NaN 扩散进布局计算。`readSnapshot` 不做业务缺省（如 rowHeight 缺省 36px，见「遗留」第 3 条）。

## 自检

| 检查 | 命令/方式 | 结果 |
|------|----------|------|
| eslint | `npx eslint src/components/table-ex/theme.js demo/src/data/table-ex/self-checks/theme.js` | 通过（exit 0，无告警） |
| 编译校验 | `npx vite build --config vite.demo.config.js`（一次性，与 watch 进程并存） | 通过：`demo/dist/data/table-ex/main.js` 45.61 kB 产出，built in 575ms，无报错。注：一次性构建 emptyOutDir 重建 demo/dist，构建后 `http://localhost:3000/data/table-ex/` 与 `main.js` 均 curl 200，watch 进程与 ：3000 静态服务保持正常 |
| stylelint | — | 不适用：本步骤无 `.scss` 改动 |
| demo 自检区 theme 断言 | 浏览器（页面执行） | **UNVERIFIED**：断言代码已写全并经自检区面板执行，但本步骤不做浏览器内运行确认，留验证阶段（见下） |

## 遗留（UNVERIFIED，待验证阶段浏览器执行）

- 自检区 theme 模块 10 条断言的运行结果（应全绿）；同面板数据生成器断言与整体面板渲染一并复核。
- MutationObserver 实际触发（mu-dark 切换 → rAF 节流 → onChange）与 window resize DPR 路径为异步行为，同步自检覆盖不到，按测试计划 A7/A2 在验证阶段执行。
- **给 G1-b 实施者**：`readSnapshot` 是纯读取，无缺省值兜底；设计 A3「--row-height 缺省 36px」的兜底落在消费方（layout.js 的 relayout 消费快照时 `|| 36` 等处理），theme.js 不重复实现。
- **给 S1 实施者**（衔接契约）：①组件壳经 `createThemeWatcher({ probeHost: __sticky 层元素, componentRoot: 组件根元素, onChange })` 创建，`onUnmounted` 调 `destroy()`；②`refreshTheme()` 实现 = `watcher.refresh()` + relayout + 整幅重绘；③G0 偏离 4 要求的 `getThemeSnapshot()` 经 defineExpose 暴露，直接返回 `watcher.snapshot`（getter，随 refresh 更新）；④demo 夹具「--row-height 覆盖 / 根字号覆盖」经 refreshTheme 生效的读取层机制已由自检覆盖（内联覆盖级联 + 继承字号）。
- 一次性 build 与 watch 并存按派发执行；如验证阶段发现 demo/dist 状态异常，重启 `npm run demo:build` 即可恢复（catalog 未变更，无需登记操作）。

## 补修记录（G1-c 浏览器实测反馈）

问题：本机 Chrome 将 `--mu-gray-translucent`（`rgb(from ...)` 相对色）求值序列化为 `color(srgb r g b / a)` 而非 `rgba()` 串，自检 2 条断言写死 `rgb()/rgba()` 形态而失败；连带 `withAlpha` 的 rgba 正则解析不到 `color(srgb)` 串（G2-a painter 覆盖层透明叠加依赖 withAlpha）。

改动（仍限白名单两文件）：

| 文件 | 说明 |
|------|------|
| `src/components/table-ex/theme.js` | 新增导出 `parseColor(color)`：兼容 `rgb()/rgba()` 与 `color(srgb r g b / a)` 两种形态（sRGB 分量 0-1 → 0-255 四舍五入、alpha 缺省 1，解析失败返回 null）；`withAlpha` 改经 `parseColor`，合法颜色 → `rgba(r, g, b, alpha)`，解析失败原样返回（行为不变） |
| `demo/src/data/table-ex/self-checks/theme.js` | 断言口径改为「任一合法 CSS 颜色形态即可」：`assertValidCssColor` = 非空 + 不含 `var(`（排除 token 串）+ `CSS.supports('color', value)`，替换原 `assertColorComputed` 的写死 `^rgba?\(`（readVar/readSnapshot/checkRelativeColorVar 三处调用点同步）；相对色变量 alpha 改经 `parseColor` 提取（顺带覆盖两种形态解析）；withAlpha 检查补 `color(srgb)` 字面用例 2 条（含缺省 alpha）与 parseColor 三态断言；文件头注释同步口径 |

自检（补修后）：

| 检查 | 命令/方式 | 结果 |
|------|----------|------|
| eslint | `npx eslint` 两文件 | 通过（exit 0） |
| 编译校验 | `npx vite build --config vite.demo.config.js`（一次性） | 通过：built in 576ms，页面 :3000 curl 200 |
| 浏览器实测 | playwright 访问 `http://localhost:3000/data/table-ex/`，读自检面板 DOM | **theme 模块 11/11 全绿**；面板整体 43/43 通过、失败条目 0。实测 `--mu-gray-translucent` 求值为 `color(srgb 0.482353 0.509804 0.533333 / 0.1)`，parseColor 提取 alpha=0.1，原 2 条失败断言转绿 |

说明：原记录中「自检断言 10 条」实为 11 条（checks 数组 11 项），随本节更正；自检项从上一版 UNVERIFIED 状态转为浏览器实测通过。

