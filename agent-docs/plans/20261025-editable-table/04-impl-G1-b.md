# 实施记录 — G1-b 主题快照扩展（theme.js）

步骤：G1-b（02-design.md 实施步骤表 G1-b 行）。模式：并发（白名单内 2 文件）。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/table-ex/theme.js` | G1-b | `readSnapshot(probe)` 固定字段 17 → 21：增 `bgStrong`（`--mu-bg-strong`）、`textColorMuted`（`--mu-text-color-muted`）、`bgDisabled`（`--mu-bg-disabled`）三个 readVar 色 + `controlHeight: readPx('--mu-control-height-normal')`；增 `colors` 固定 17 色 map（私有常量 `BASE_COLOR_NAMES` 12 彩色读 `--mu-{name}` + `SEMANTIC_COLOR_NAMES` 5 语义读 `--mu-{name}-color`，每色再读 `--mu-{name}-translucent`，gray 不入 map，`readSnapshot` 签名不变）；新增导出 `createTextMeasurer()`（离屏 canvas 2d ctx + 既有 `createMeasureCache` 包装 → `measure(text, font)`，主线程同步）。模块头注补职责边界（评审 6 P9：仅快照与变更信号，几何归壳）。`createThemeWatcher` 零改动（onChange/refresh 通道现状已有） |
| `demo/src/data/table-ex/self-checks/theme.js` | G1-b | 快照计数断言改 21 固定字段口径（14 色 + 字号/字体 + 5 尺寸 = 21，+ colors = 22 键，detail 同步）；`controlHeight` 断正 px 数形态（来自 root.scss 非夹具内联，不断具体值）；新增「bgStrong/bgDisabled 半透明形态」断言（`parseColor(...).a < 1`，textColorMuted 断合法色形态）；新增「readSnapshot.colors 固定 17 色」断言（色名集合独立口径 = 12 彩 + 5 语义、gray 不入、每色 color+translucent 双合法形态、translucent alpha < 1）；新增 `createTextMeasurer` 断言（见偏离 1）；头注 G1-a → G1-b 与覆盖范围同步 |

## 偏离

1. **设计 self-checks/theme.js 行字面只列「计数公式与 colors 断言」，本步新增导出 `createTextMeasurer()` 无断言覆盖** → 补一条模块级断言（测量宽度正有限数、同 text+font 缓存命中、换 font 重测、长文本更宽）。仅加测试，不改源码；如评审认为超范围可单独删除该断言组。
2. self-checks/theme.js 头注原句「该文件 S1 才创建」（指 table-ex.scss）为事实错误——该文件已存在且设计改动清单归 G2 修改，头注改为「该文件 G2 才改动」。仅注释修正，断言行为不变。

## 自检

- `node --check src/components/table-ex/theme.js` 与 `node --check demo/src/data/table-ex/self-checks/theme.js`：均通过。项目无 eslint 配置，无 scss 改动（stylelint 不适用）。
- playwright（demo watch :3000 热编译后 `http://localhost:3000/data/table-ex/`，点「重跑自检」新断言名出现确认新 bundle 生效）：
  - **theme 组 14/14 全绿**：21 固定字段计数（22 键 = 21 + colors）、colors 17 色形态（12 彩 + 5 语义、gray 不入、双形态、translucent 半透明）、bgStrong 半透明形态（alpha=0.08）、bgDisabled（alpha=0.12）、createTextMeasurer 测量与缓存 —— G1-b 判据逐项通过。
  - 运行时 `getThemeSnapshot()`（经 `window.__tableEx`）：22 键、`controlHeight: 32`、`colors` 17 色无 gray、`bgStrong = color(srgb 0.027 0.031 0.031 / 0.08)`、`colors.primary = { color: 'rgb(28, 126, 214)', translucent: color(srgb .../ 0.1) }`。
  - 首次整页加载自检 110/110 通过。

## 遗留

- 整页自检在**页内重跑**时 109/110：唯一失败 `[cell-painters] img：未完成前状态应为 loading，实际 loaded`——`self-checks/cell-painters.js:297-323` 在 drawCell 后同步断言 data URI 图状态为 loading，4×4 PNG data URI 二次加载（缓存/解码加速）时 load 早于断言，时序竞争，属先 instability（非本步引入）。该文件在 G2 白名单（本步未触碰），留待 G2 处理；与 theme 组无关（theme 组重跑仍全绿）。
- 契约⑤变高行重估不在本步（theme.js 仅快照与信号，重估归 G3 壳 onChange 处理器，评审 6 P9）——未实施，符合设计。
- `npm run build`、文档三处同步、git 提交：均按派发不执行（归 S1 / 用户决策）。
