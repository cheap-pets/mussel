# 实施记录（追加轮：测试质量遗留项修补）

## 改动文件

| 文件 | 对应项 |
|---|---|
| `demo/src/data/table-ex/self-checks/text-wrap.js` | 测试质量 1：新增末条断言「createWrapCache：LRU 淘汰重算结果与原结果逐字比对（冷键加随机小数防预热）」——limit=1 缓存冷键（含 `Math.random()` 防预热，02-design.md:116 要求）首算 → 异键挤占淘汰 → 同键重算，`assertArray` 逐字比对 `lines` + `assertEqual` 比对 `lineCount`/`clamped`，并以两个独立计数 measure 各自 `calls > 0` 证明首算与重算均真实执行（未被缓存服务）；另文件头覆盖清单补「LRU 逐条淘汰 / 淘汰重算结果逐字比对」（原头注释漏 LRU，顺带补齐） |
| `agent-docs/knowledge/project/table-ex-performance-profiling.md` | 测试质量 2：结论节两处最小修订——①「耗时归因」行 scanCount 0 口径补第二成因「或全确定单行表短路（7733a6f）」；②「精算跳过验证」行尾追加 scan 期新口径：估高扫描短路（7733a6f）后全确定单行表整个扫描短路、flat 度量下含变高候选列表估高扫描对非条目列免取值，`__valueCalls` 仅精算期/绘制期有增量，"估高扫描逐格取值"旧口径失效。原句扩写，未重写页面 |

INDEX-table.md：第 21 行摘要（"劫持 measureText/setTransform 计数 + props 直替注入 + `lastRelayout` 归因；精算跳过用视口外计数列"）不含 scan 期取值表述，未被本次口径变化证伪——派发条件「若失准则微调」未触发，未改动。

## 偏离

无。两点落地方式说明（非偏离）：

1. 断言以新增独立 check 条目落地（text-wrap 14 → 15 条），非并入既有 LRU 条目——派发要求「计入自检总数」，总数须较 43 增加。
2. 知识页 scanCount 0 口径一行同步微调：scanCount 与 `__valueCalls` 同属该页劫持/布局计数口径，且「全确定单行场景 scan 期取值调用为 0」的成因即短路跳过整扫（派发问题 2 原文），并入最小修订范围。

## 自检

| 命令 / 手段 | 结果 |
|---|---|
| 基线（改前）：`node agent-docs/plans/20261107-table-ex-estimate-opt/evidence/verify-1/run-self-checks.mjs` | `TOTAL: 43 pass, 0 fail` |
| 改后同命令 | `TOTAL: 44 pass, 0 fail`；新增行 `PASS [text-wrap] createWrapCache：LRU 淘汰重算结果与原结果逐字比对… :: 淘汰重算 lines/lineCount/clamped 与原结果逐字一致（首算/重算 measure 42/42 次）`（连跑稳定，随机冷键不影响） |
| rollup watch 自动重编译 | `demo/dist/data/table-ex/main.js` 重建于 14:32:54（晚于编辑时刻）；`grep -c "LRU 淘汰重算结果与原结果逐字比对" main.js` = 1，新断言串已入 bundle，未手动打包 |
| playwright MCP：`http://localhost:3000/data/table-ex/`（DOM 断言，无截图） | 调试面板「自检结果（**241/241 通过**）」（240+1，与 Node 44+其余模块合计一致）、`.ct-check-item--fail` 计数 **0**、新断言条目在场且绿（✓，结果消息与 Node 运行一致：`首算/重算 measure 42/42 次`） |
| console error 核对 | 唯一 error = `data:image/png;base64,AAAA` ERR_INVALID_URL（cell-painters.js:814 负向夹具，预期，同 05-verify-终-2 记录） |
| `.playwright-mcp/.gitignore` | 在场，内容 `*` + `!.gitignore`（本轮未新产生该目录，沿用既有） |
| `git status --short` | 仅本轮 2 个文件（`M text-wrap.js 自检`、`M profiling 知识页`）+ 基线 `todo/misc.md`；无范围外改动，未提交 |

## 遗留

- 05-verify-终-2「测试质量 3」（无头环境 programmatic scroll 不触发 scroll 事件 + rAF 合帧不执行）：验证环境特性，非代码项，不在本轮两项内，未涉及。
- 05-verify-终-2 列出的 2 项测试质量遗留至此全部闭合。
