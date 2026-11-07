# 05-verify-1 终验报告（verifier，整体实施全量核对）

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

本轮为第 1 轮验证，无上轮问题可核。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npx eslint src demo/src`（00-task 口径） | exit 1（4 error，全部 HEAD 存量） | `demo/src/data/table-ex/main-view.vue 344:3/346:3 import/first`、`self-checks/painter.js 1257:7/1267:7 spaced-comment`；任务 5 文件 0 error。存量实证：`git show HEAD:<file> \| npx eslint --stdin --stdin-filename` 对两文件复跑，4 error 逐条复现（行号/rule 相同）；另 cell-text.js:183 complexity 15、item-painters.js:182/217 complexity 警告经 HEAD stdin 复跑确认为存量（仅行号位移）。派发判定口径「区分存量与新引入」：新引入 lint 问题 = 0 |
| `grep -rn "textBaseline = 'middle'" src/components/table/ex/` | PASS（= 设计步骤 4 判据） | 仅 `src/components/table/ex/cell-paint/cell-painters.js:67`（drawCell 默认态，非 fillText 站点） |
| `grep -rn fontBoundingBox demo/src/data/table-ex/self-checks/` | PASS（0 命中） | 残留口径清零（设计风险节要求）；src 侧仅 cell-text.js:24 注释提及旧口径（非代码） |
| 浏览器 `/data/table-ex/` 自检面板 | PASS | 首轮「自检结果（234/234 通过）」；新断言：「文本锚缓存…」✓ A=2 / B=1，y 恒 25（font 13.4747px sans-serif）、「字形锚缓存…」✓ 首绘 1 / 同 font 二绘 0 / 变 size 恰 1。重跑自检 233/234：唯一失败「icon 列：非法值…非 string dev warn 一次」为 04-impl 遗留 #1 存量（utils/warn.js once 去重，该检查与 warn.js 均不在本轮 diff）；两条新计数断言重跑仍 ✓（随机冷键 13.041px / 19.8893px·21.0626px，幂等成立） |
| 浏览器 性能劫持计数（验收 5） | PASS | 详证据 `evidence/perf-counts.json`：稳态全 0（回滚已见区 0、hover×3 = 0/0/0、列宽拖动整幅重绘 160→188 增量 0、拖后一帧 0）；5 次首见滚动增量 34/29/35/34/29 且 161 文本各恰 1 次（width 链，与基线同构）；全程 '永'/'●'/'✓' 计数 0 ⇒ 锚/字形缓存稳态全命中 |
| 浏览器 `/data/table-ex-basic/`、`/data/table-ex-scene/` | PASS | canvas 就位，表头/表体墨迹占比 4.1%/4.4% 与 10.4%/6.7%（文本图标可见），两页控制台 0 error |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1 文本垂直定位基于运行时实测度量；同字体+字号有缓存不重测 | 浏览器（demo 自检）+ 代码 | cell-text.js:44 `CJK_PROBE_CHAR='永'`、:96 `centeredTextAnchor` 经 `inkHalfDiffOffsetOf`（:57-74）运行时测 `actualBoundingBox*` 墨迹半差，无硬编码常数；缓存键 = 能力位 + ctx.font 串（含字号/字重）；自检面板「文本锚缓存」A=2/B=1、y 恒（跨实例不重测），槽位锚断言组（y=19+OFF 现算）全绿 | PASS |
| 2 图标定位基于实测渲染高度；字号未变不重测 | 浏览器（demo 自检）+ 代码 | icon-image.js:92 `centeredGlyphAnchor(ctx, icon.glyph, centerY)`（实测该字形墨迹）；「字形锚缓存」断言：19px 基底首绘 1 / 同 glyph 同 font 二绘 0 / 19→21 恰 1，y = 19 + 字形墨迹半差 | PASS |
| 3 全局保存结论 + 落实 | 设计结论 + 浏览器 + 代码 | 02-design.md「约束 3 结论：适合全局（模块级）保存」+ 三条理由；落实 = `textAnchorCache`/`glyphAnchorCache` 均模块级 Map（cell-text.js:43,119），跨实例 A=2/B=1 断言实证共享 | PASS |
| 4 对齐算法已复核并调整（设计记录结论） | 设计复核表 + diff + 浏览器视觉 | 02-design.md「对齐站点复核表」11 行逐站点结论在案；4 调整站点实测落地：paint-header.js:82-86（表头 ✓ 字形锚）、:142-149（表头文本 `centeredTextAnchor`）、item-painters.js:335-337（单元格 ✓ 字形锚）、icon-image.js:92；grep 判据与设计逐字一致。视觉：表头 caption 墨迹 [12,23] 中心 17.5 vs 槽位中心 18（±0.5px），表体首行 [49,60] 中心 54.5 vs 锚 55（±0.5px），caption 与表体同口径 | PASS |
| 5 相对基线 measureText 无显著增量；无逐帧/逐行重复测量 | 浏览器（劫持计数） | 稳态（已见区滚动/hover/整幅重绘/拖后帧）增量全 0，'永'/'●'/'✓' 稳态 0 次 ⇒ 无每次绘制重复测量（实测）；首见文本测量每文本恰 1 次（width 链 diff 未触碰，与基线同构）。首帧一次性净增：基线侧不可实测（禁 checkout），按实测新增侧计数 + HEAD 源码语义推导 ≈ 3~9（表头 font 串 +1、表头 ✓ +1、图标按 (glyph,font) 拆分增量），落在设计上界「首绘 font 串数 + 图标字形数」内——推导结论，与 04-impl 偏离口径一致，基线构建实测对比列入「需人工」 | PASS（基线侧为推导，见需人工 2） |
| 6 既有 demo 页面绘制/交互无回归 | 浏览器 | 自检面板首轮 234/234（重跑唯一失败为存量，见命令结果）；交互实测：单元格点击 → cell-click + update:selected-record ✓；表头点击 → header-click{name} + update:order-by "name:asc" ✓；可编辑格单击开编辑 → 真实键盘输入 42 + Enter → update:cell-value{field:count,value:42} + 编辑器关闭 ✓；link 条目 hover cursor=pointer + 点击 cell-item-click{item:{label:'Mussel 文档'}} ✓；tag 点击 cell-item-click{tag:{caption:'置顶',color:'blue'}}（hover 无 pointer 属既定行为）✓；button hover pointer + 点击 cell-item-click{button:{caption:'编辑',icon:'clock'}} ✓；text.link 格 hover pointer + 点击仅 cell-click 为设计行为（cell-painters.js:210-211 注释）✓；树开→点箭头 tree-collapse{key:1,level:0}+update:tree-expanded-keys(2000)→再点 tree-expand+keys(2001) 双向 ✓；tooltip 函数 title 面板「状态码：active」✓；列宽拖动 160→188 生效 ✓；basic/scene 首屏文本图标可见、0 控制台错误（截图 evidence/） | PASS |

## 范围核对

- 改动文件（git status --short + git diff --stat）：恰为设计改动清单 5/5 —— demo self-checks/cell-painters.js、cell-text.js、icon-image.js、item-painters.js、paint-header.js；+253/−40。无设计外源码改动、无「未记录」/「未覆盖」项。
- 基线排除项：`备份/`（未跟踪，内容 20261106-table-ex-structure-design，目录时间 08:42 早于任务开始 09:12，属基线「旧 plans 删除/备份」范畴，decisions.md 已按无关处理）。
- 验证产物：demo/dist 重建（gitignored，验证服务自建产物）；任务目录 05-verify-1.md + evidence/（demo-watch.log、perf-counts.json、3 张截图）。
- 无法区分：无（基线源码无脏文件，HEAD=095cfdf 干净对照）。
- 服务说明：3000 端口为既有 demo watch 实例（PID 21996，非本轮启动，未关闭）；本轮启动的 `npm run demo:build` 因 EADDRINUSE 完成一次 dist 全量重建后退出（日志 evidence/demo-watch.log），未破坏既有实例。

## 测试质量问题

无。两条新增缓存断言断言行为与精确计数（A=2/B=1、1/0/1、y 相同），非「不抛错」式；锚偏移断言值为按 CJK_PROBE_CHAR 现算公式（非硬编码期望值）；计数断言键随机化防「重跑自检」被模块级缓存预热（偏离 1 已记录于 04-impl，协议语义保留，两轮实测幂等）。存量的「icon 非法值 warn」重跑恒败为基线同病，不属本轮测试质量范围。

## 需人工检查

1. 像素级主观视觉确认（可选）：改动后全部 table-ex 文本/图标垂直位置随系统度量浮动 ≤2px 量级（设计预期行为）。步骤：打开 http://localhost:3000/data/table-ex/ 对照 DOM 参照表观察表头/表体/图标观感。
2. 首帧 vs 基线实测对比（验收 5 的基线侧）：需 checkout dev@095cfdf 建基线后按 evidence/perf-counts.json 同口径劫持计数——验证规则禁止 checkout，本轮以实测新增侧计数 + HEAD 源码推导替代（推导 ≈ +3~9，一次性，远低于「显著增量」）。如需实测请人工授权后执行。

## 验收入口（PASS 时必填）

1. 验收 1/2/3/6 — 终端运行 `npm run demo:build`（3000 端口空闲时；已占用则跳过），浏览器打开 `http://localhost:3000/data/table-ex/`，调试面板应显示「自检结果（234/234 通过）」，列表中「文本锚缓存：…」「字形锚缓存：…」两行带 ✓ 及计数输出（A=2/B=1；首绘 1 / 二绘 0 / 变 size 恰 1）。
2. 验收 4 — 同页面观察：表头 caption 与表体首行文本垂直观感同口径（墨迹中心均贴槽位中心）；条目/新列型场景图标列字形无偏上。
3. 验收 6 — 访问 `http://localhost:3000/data/table-ex-basic/`、`http://localhost:3000/data/table-ex-scene/`：首屏表头/表体文本与图标可见，控制台无错误。
4. 验收 5 — 同页面控制台执行（fonts loaded 前置已满足）：
   ```js
   const o = CanvasRenderingContext2D.prototype.measureText, c = { n: 0 };
   CanvasRenderingContext2D.prototype.measureText = function (t) { c.n++; return o.call(this, t); };
   // 回滚已见区滚动 / hover / 拖列宽后读取
   console.log(c.n); // 预期稳态增量 0
   ```

## 环境阻塞

无。

## 失败项（FAIL 时）

无。
