# 验证报告（终验 第 2 轮 · 整体实施 · 补验浏览器断言）

VERDICT: PASS

终验-1 全部可自动化项（Node 自检 43/43、探针 8/8、stylelint 零差异、编译产物、行为冻结审计、范围核对）结论沿用；本轮接入 playwright MCP，按 02-design.md「测试计划」补验全部 `浏览器` 手段项，全部通过。终验-1 的 FAIL 唯一成因（环境阻塞）已解除，本轮无新增失败项、无 UNVERIFIED。

验证者与 implementer 独立：浏览器断言全部为本人亲自执行（合成/物理鼠标事件 + DOM 断言 + `getLayoutInfo`/`getCellRect`/`__ctStage` 通道读数），未采信任何一方自检结果。

## 上轮问题核对（第 2 轮起）

| 上轮项 | 核对结论 |
|---|---|
| 环境阻塞 1：缺 playwright MCP，5 条标准浏览器手段 UNVERIFIED | **已解决**——本轮 playwright MCP 可用，AC1/2/3/5/6 浏览器项全部补验 PASS（见「验收标准核对」） |
| 环境阻塞 2：8 个浏览器-only 自检模块无法 Node 直跑，「自检面板全绿」待浏览器 | **已解决**——default 场景自检面板 **240/240 全绿**（11 个自检模块 + data 数据生成器断言），fail=0；4 个改动文件的新断言条目逐条确认在场且绿（LRU 逐条淘汰、count 计数通道 ×2、免取值 fast path、表级短路、升级路径完整、cell-painters `.count` 产物） |
| 测试质量问题 1：text-wrap 自检缺「淘汰重算结果逐字比对」断言（终验-1 由 verifier 探针补验 PASS） | **未解决（维持原定性，非阻塞）**——本轮浏览器 LRU 断言绿 + 终验-1 探针 PASS 双证 AC4；断言缺失仍建议后续补一行结果比对（见「测试质量问题」） |
| 测试质量问题 2：`__valueCalls` scan 期变 0（设计既述语义变化） | 维持——repo 无断言消费，留任务收尾按用户确认更新 profiling 知识页口径 |

## 命令结果

终验-1 命令类结论沿用（不重跑，派发约定）：Node 自检 43/43、探针 8/8、stylelint 零差异、bundle 核对、语法检查——见 05-verify-终-1.md「命令结果」。本轮新执行：

| 命令 / 手段 | 状态 | 关键输出 |
|---|---|---|
| `GET http://localhost:3000/data/table-ex/` 及 `?scene=single` / `?scene=items` / `?scene=multiline`（dev 服务直访，未重新打包） | 通过 | 均 200，页面与场景载入正常；每场景 console error 仅 1 条 = `data:image/png;base64,AAAA...` ERR_INVALID_URL，来源 `demo/src/data/table-ex/self-checks/cell-painters.js:814` 负向夹具（故意无效 src 测 img 加载失败路径），预期 |
| playwright 浏览器断言（DOM/可访问性 + 实例通道读数，无截图） | 通过 | 见「验收标准核对」逐条证据；console/快照文件由 MCP 落 `.playwright-mcp/`（已被该目录 .gitignore 忽略，内容 `*` / `!.gitignore` 核对在场） |
| `git status --short` + `git diff --stat` | 通过 | 与终验-1 完全一致：9 任务文件 + 基线 `todo/misc.md` + 未跟踪任务目录；合计 530 insertions / 14 deletions。本轮验证零源码改动 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1 确定单行表 scanCount=0、行为一致 | 自检（终验-1 PASS 沿用）+ `浏览器`（本轮） | `?scene=single`（100000 行新实例）首绘：`lastRelayout = { elapsed: 1.1, scanCount: 0, rebuild: false }`、`rowGeometryMode === 'uniform'`、`rowHeight 36`、`contentHeight 3600036`（=100000×36+36 表头）、colWidths `[48,56,220,140,240]` 与 createAlternateColumns 一致。行高基线：rows 0/1/2/5/7 × 5 列 `getCellRect().height` **逐值全 36**（与优化前推导基线一致）。数据规模轮换（records 引用替换 → 脏判定路径）：few(3 行) scanCount=0/contentHeight 144、empty(0 行) 0/36、full(100000) 0/3600036，stageRows 3/0/100000 有效性判据成立、mode 保持 uniform。滚动不跳：scrollTop=3000000 深滚两次采样一致（viewRows start=83333=3000000/36 对齐）、回顶 scrollTop=0、首 3 行行高仍 36、scrollH 恒 3600036 无滚动条跳动 | **PASS** |
| 2 计数通道、交互不变 | 自检 + 探针（终验-1 PASS 沿用）+ `浏览器`（本轮） | items 场景（mode=variable，行高 [70,52,36,196,36]，196=16+10×18 与 maxItems 10 截断语义吻合）。cell-item-click 四类条目 payload 实测正确：link 条目 `{column:'links', item:{label:'Mussel 文档'}, recordIndex:0}`、list 条目 `{column:'list', item:{label:'纯文本项'}}`、tag 条目 `{column:'tags', tag:{caption:'新品', color:'green'}}`、button pill `{column:'buttons', button:{caption:'A'}}` / `{caption:'B'}`。dots 截断条目（第 4 行 12 条 > maxItems 10）点击 payload **`item: "..."`**。hover 命中区 = 条目绘制区非整格：pill 上 cursor=pointer、同格条目区下方 cursor=default；多 pill 不取联合中点：button 组相邻 pill 间 8px gap 点击**不发** cell-item-click（仅整格 cell-click），pill 本体命中。link 类型列点击走 cell-click（`text.js:44` 既有口径「不发 cell-item-click」，行为不变） | **PASS** |
| 3 数据单行行为不变 | 自检（终验-1 PASS 沿用）+ `浏览器`（本轮） | multiline 场景首屏行高快照 `[196, 70, 142]` 全部 > 36（maxLines=10/3 列与 list 列驱动，多行行高随内容）。recordsVersion 联动：`__ctStage().records[1].long10` 就地改长文本 → 点「recordsVersion++（仅通知）」→ 行 1 高度 **70 → 142**（7 行精算值，与行 2 同文本同列宽同行高一致），行 0/行 2 不变（196/142），contentHeight 516=36+196+142+142 精算缓存快照链正常。深滚锚定：multiline 仅 3 行无滚动空间，由 single 场景（100000 行）执行（见标准 1 深滚证据：无跳变/无振荡/回顶正常）——与测试计划「深滚后 scrollTop 无跳变」等价载体 | **PASS** |
| 4 wrapCache LRU 逐字节一致、命中 | 自检 + verifier 探针（终验-1 PASS，沿用） | ——（手段为自检，无浏览器项；浏览器侧 LRU 断言随自检面板 240/240 绿，佐证） | **PASS** |
| 5 自检全过 + playwright DOM/a11y | 自检 + `浏览器`（本轮） | default 场景自检面板「自检结果（**240/240 通过**）」，`.ct-check-item--fail` 计数 0；11 个自检模块（text-wrap/row-geometry/row-geometry-controller/tree/spans/theme/layout/cell-painters/painter/interactions/editor）+ data 模块全绿。新断言抽验在场：`[text-wrap] createWrapCache：LRU 逐条淘汰…limit=0 不挂死`、`[row-geometry] count 计数通道…render 主体零调用（spy）`、`[row-geometry] 免取值 fast path…`、`[row-geometry-controller] 表级短路…scanCount=0`、`[row-geometry-controller] 升级路径完整…`、`[cell-painters] .count 计数通道（canvas 挂载、dom 不挂…）`。DOM/可访问性断言：5 个 demo-section 区块（组件舞台/夹具控制/DOM 参照/调试面板/事件日志）`offsetParent` 可见、canvas width>0 挂载、夹具场景 radio 11 选项渲染（含 single） | **PASS** |
| 6 10 万行可交互 + 分场景 scanCount | `浏览器`（本轮） | default（100000 行）首绘 `scanCount = 100000`（elapsed 125ms，含 list 列免取值全量扫）、mode=variable（首绘前 5 行含条目升级）。可交互：点击第 1 行名称列 → 事件日志 `cell-click record #1 column name` + 选中事件；深滚 scrollTop=2000000 → viewRows 55548..55564（16 行窗口，无卡死）；回顶 viewRows 0..8、行高 70 无跳变。点「替换 columns（引用变化）」→ `scanCount = 100000`（列签名脏、mode 已 variable 不短路）、colWidths 变 `[48,56,220,140,240]`；再还原 → 仍 100000。`?scene=single` 首绘/换数据规模/轮换后均 = 0（见标准 1）。分场景对照成立：**default 100000 / 替换列 100000 / single 0** | **PASS** |

## 范围核对

`git status --short` + `git diff --stat`，与终验-1 及设计改动清单对照：

- 9 个改动文件全部在场、无缺漏（`main-view.vue`、`text-wrap.js`、`list.js`、`row-geometry.js`、`row-geometry-controller.js`、4 个 self-checks 文件），合计 530 insertions / 14 deletions，与终验-1 完全一致——**本轮无源码改动**。
- 基线排除项：`todo/misc.md`（基线脏文件，decisions.md 已确认与本任务无关）。
- 验证产物：任务目录 `agent-docs/plans/20261107-table-ex-estimate-opt/`（未跟踪，本轮新增 `05-verify-终-2.md`）；`.playwright-mcp/` 目录内快照/console 文件被其 .gitignore（`*` + `!.gitignore`，已核对在场）忽略；`demo/dist/**`、`dist/**` 被 .gitignore 忽略。
- 无法区分：无。设计外改动：**无**。

## 测试质量问题

1. [小问题·维持] `demo/src/data/table-ex/self-checks/text-wrap.js`：LRU 检查仍缺「淘汰重算结果与原结果逐字比对」断言（测试计划 AC4 列有）。现实现为纯函数无漂移（终验-1 探针 200 组冷键 mismatches=0 + 本轮浏览器自检绿），非阻塞；建议后续补一行结果比对断言。
2. [小问题·已知] `window.__valueCalls` scan 期变 0——设计「遵循约定」既述语义变化，repo 无断言消费；profiling 知识页口径更新留任务收尾按用户确认处理。
3. [备注·环境] 本验证环境（无头）下 programmatic `scrollLeft/scrollTop` 赋值不触发 `scroll` 事件，且 `onScroll` 的 rAF 合帧（`use-relayout.js:166`）在该环境不执行 → 滚动布局更新经「recordsVersion++（仅通知）」按钮强制 relayout 读取实际滚动位置后断言；single 场景深滚在页面活跃期 relayout 正常执行（viewRows 83333 更新）。此为验证环境特性（无渲染帧），**非被测系统缺陷**，生产浏览器 scroll 事件链不受影响。

## 需人工检查

无。设计测试计划无「人工」手段标准；终验-1 列的浏览器执行项已全部由本轮亲自执行覆盖（AC1 深滚锚定在 single 场景执行，multiline 无滚动空间，已在标准 3 说明）。

## 验收入口

1. 标准自检总入口（AC4/AC5 部分）：`node agent-docs/plans/20261107-table-ex-estimate-opt/evidence/verify-1/run-self-checks.mjs` → `TOTAL: 43 pass, 0 fail`（约 10 秒）。
2. AC1：浏览器访问 `http://localhost:3000/data/table-ex/?scene=single` → 控制台执行 `window.__canvasTable.getLayoutInfo()` → 断言 `lastRelayout.scanCount === 0` 且 `rowGeometryMode === 'uniform'`；`window.__canvasTable.getCellRect(0, 2).height === 36`。
3. AC6：浏览器访问 `http://localhost:3000/data/table-ex/` → 控制台 `window.__canvasTable.getLayoutInfo().lastRelayout.scanCount === 100000`；点「替换 columns（引用变化）」按钮后再读仍 `100000`；滚动/点击正常响应（事件日志区出现记录）。
4. AC2：浏览器访问 `http://localhost:3000/data/table-ex/?scene=items` → 点击第 1 行「链接（三态）」列条目文字 → 页面事件日志出现 `cell-item-click`（payload item 为条目对象）；第 4 行「链接（三态）」列第 11 个槽位（dots）点击 → payload 值 `"..."`。
5. AC3：浏览器访问 `http://localhost:3000/data/table-ex/?scene=multiline` → 控制台 `window.__ctStage().records[1].long10 = '长文本示例'.repeat(20)` → 点「recordsVersion++（仅通知）」→ `window.__canvasTable.getCellRect(1, 0).height` 由 70 变 142。
6. AC5：浏览器访问 `http://localhost:3000/data/table-ex/` → 调试面板「自检结果（240/240 通过）」。

（均假设 dev 服务运行中：rollup watch + `http://localhost:3000/`；每条 ≤2 分钟。）

## 环境阻塞

无。终验-1 的 playwright 缺失阻塞已解除。

## 失败项（FAIL 时）

无。全部验收标准 PASS，无设计外改动。
