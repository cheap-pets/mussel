# 实施记录 — 修复模式第 1 轮（05-verify-1.md 失败项 2 处）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `src/components/table-ex/table-ex.vue` | 05-verify-1 失败项 1 | scrollToRecord（:721-725）：scrollTop 计算去掉多余的 `cur.headHeight +`，改为 `Math.max(row * cur.rowHeight, 0)`；注释同步更正为行视口 y 推导（`headHeight + row×rowH − top`，令 y = headHeight 即行顶对准表头下缘）。clamp 上界 `contentHeight − stickyHeight`（stickyHeight = 容器 clientHeight，layout.js:373）核实无误，未动 |
| `demo/src/data/table-ex/main-view.vue` | 05-verify-1 失败项 2 | :543/:548 `pollThemeSnapshot()` → `pollDebugPanel()`（:580 定义的同名笔误修正），两处调用点之外无改动 |

## 偏离

无。两处修复均按 05-verify-1.md「失败项」的疑似位置与建议原样落地，未改其他行为。

## 自检

环境：demo watch 进程已被上轮验证者关闭，本轮以 `npm run demo:build` 后台重启（exec_b36a39e8-732f-4a48-806a-6d85862a6315，含 :3000 静态服务，全量构建 433 modules 成功后保持运行）；页面 `http://localhost:3000/data/table-ex/` 经 playwright 首次导航实测。

| 检查 | 方式 | 结果 |
|------|------|------|
| 失败项 1：scrollToRecord 定位 | `scrollToRecord(5000)`（keyField id=5000 → 行 4999） | 通过：scrollTop=179964=4999×36（修复前 180000）；settle 后 `getLayoutInfo().viewRows.start=4999`（视口首行即目标行，修复前 5000）；目标行视口 y=36=表头下缘、行底 72，完整可见；y=54 采样像素 [236,237,237] ≠ 表头底色 [236,238,239]（行带非表头遮挡） |
| 失败项 1：边界 | scrollToRecord(0) / (99999) / 不存在 key | 通过：0→scrollTop=0；末行 clamp 至 3599620=contentHeight−clientHeight（=spacer 高）；坏 key 返回 false |
| 失败项 2：两个调试按钮 | 点击「refreshTheme()」「打印主题快照」 | 通过：0 console error / 0 pageerror（修复前 ReferenceError: pollThemeSnapshot is not defined）；两条 logEvent 均落日志（`refreshTheme（调试按钮）`、`打印主题快照（调试按钮）`，修复前处理器中断不执行）；快照打印渲染 17 字段 JSON |
| 失败项 2：快照打印更新（强断言） | 切 mu-dark 开关 → 走按钮路径 → 还原 | 通过：页面渲染快照 bgNormal rgb(255,255,255)→rgb(7,8,8)→还原 rgb(255,255,255)，与实例 `getThemeSnapshot()` 逐次一致，全程 0 error |
| demo 自检面板 | 首挂载读取 | 77/77 通过（theme 11 + layout 14 + cell-painters 14 + painter 11 + interactions 13 + editor 10 + data 4），0 error |
| 库构建 | `npm run build` | exit 0，288 modules，dist/mussel.min.js 256.60 kB |
| demo 构建 | `npm run demo:build`（watch，后台保持运行） | 433 modules，demo/dist/data/table-ex/main.js 134.83 kB，含两处修复 |

## 遗留

1. 05-verify-1.md「需人工检查」4 项（浏览器缩放 DPR、视觉并排比对、A9 逐条边界、滚动手感）不属代码 FAIL，本轮未处理。
2. 05-verify-1.md「测试质量问题」4 条为口径/夹具建议（如 disabled check demo 夹具），非本轮范围。
3. demo watch 进程（exec_b36a39e8-732f-4a48-806a-6d85862a6315）按任务要求保持后台运行，:3000 占用中。
4. 「瞬时异常」一节的一次性 TypeError 已由既有空值防护覆盖（table-ex.vue:44），本轮复现失败（编辑器 Esc 正常），未改动。
