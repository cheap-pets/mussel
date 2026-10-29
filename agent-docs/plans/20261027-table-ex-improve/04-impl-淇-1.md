# 实施记录：修复-1（实施循环第 1 轮，依据 05-verify-1.md 失败项）

模式：修复。白名单：`demo/src/data/table-ex/self-checks/painter.js`、`demo/src/data/table-ex/main-view.vue`（仅此两文件，组件源码零改动）。只修 05-verify-1.md「失败项」节 3 处测试代码缺陷。

## 改动文件

| 文件 | 对应失败项 | 说明 |
|---|---|---|
| demo/src/data/table-ex/self-checks/painter.js | 失败项 1、2 | :762-778 采样区跟随槽位锚墨迹（60,110,140,30 → 60,80,140,30）；:1138-1145 新增真·无 hover 对照帧供 :1135 断言。净 +7/−3 行 |
| demo/src/data/table-ex/main-view.vue | 失败项 3 | :1045 成本夹具第 ④ 步判据 `<= 0` → `>= 0`（单字符，与注释「已按 name 升序」及 applyOrder 口径对齐） |

## 逐项修复说明

1. **失败项 1（painter.js:776 采样区）**：问题 1 槽位锚后行 1（格顶 y=72）文字锚 lineY = 72+1+8+9 = 90，fontSize 14、`textBaseline: 'middle'`（cell-painters.js:322）→ 墨迹 [83,97)，与旧采样区 y 110..140 完全不相交。采样区改 `(60, 80, 140, 30)`（y 80..110，墨迹上下各余 3px/13px），标签同步改「单格重绘可见（区域覆盖行 1 槽位锚墨迹带）」，前置注释改写。断言语义不变：`assertRegionDiffer`（重绘可见）+ 行 2 `assertRegionSame` 不动。
2. **失败项 2（painter.js:1129 配合 :1135）**：:1135「hoverMode=none 与无 hover 帧整幅一致」的对照帧改用新增 `plainCanvas = makeState({})`（真·无 hover）；:1129 原对照帧 `makeState({ hover })` 保留——它同时供 :1131「加载中按钮区不半绘制」使用，该断言需要按钮区 hover 带底色对齐才能隔离「半绘制」单变量（帧 A 按钮区有 hoverBg 叠加，harness 实证 hover 帧 vs 纯帧 op 流不同，直接替换会使 ：1131 恒败，详见偏离节）。断言语义不变：对照基线从「含整行高亮带的帧」换为真·无 hover 帧，none 帧与之整幅一致。
3. **失败项 3（main-view.vue:1045）**：`<= 0`（非递增）→ `>= 0`（非递减），与第 ④ 步注释「已按 name 升序」及 applyOrder 字符串分支（`va.localeCompare(vb)` 升序）一致。`window.__ctStage().records` = sortedTreeRecords = applyOrder(treeRecords, 'name:asc') 全局 name 排序拷贝（非 DFS 行序），全量相邻非递减扫描对该产物成立 → 夹具可产出 relayoutMs/paintMs。比较参数未对调（取 `>= 0` 方案，改动最小）。

## 自检

方式：esbuild 打包真实 src 模块 + 真实自检模块（.vue/.scss stub、vue stub、canvas 录制桩、Image 桩；/tmp/ct-fix-harness，G2-4 直调走查同法），复刻三处夹具对真实模块执行。

| 判据 | 结果 |
|---|---|
| Part A 真实自检模块装载 | checks 总数 23 不变，两条目标检查在位（PASS） |
| Part B 修复 1（变高行单格重绘） | base/重绘锚均 (68,90)；增量 clip 矩形 `[60,72,141,73]` = colWidth+1 × **heightAt+1**（原「裁剪高」语义直接实证）；旧采样区不含锚（原恒败根因复现）、新采样区覆盖锚；增量绘制 op 无触及 y>144（行 2 不受影响前提）（PASS） |
| Part C 修复 2（hoverMode=none 对照） | none 帧 op 流与 `makeState({})` 纯帧**逐条一致**（独立帧 + 同 ctx 帧 A 叠加后末次 clearRect 起两路径）；hover 帧 vs 纯帧 op 流不同（旧对照语义缺陷复现，同时证明 ：1131 须保留 hover 对照帧）（PASS） |
| Part D 修复 3（成本夹具判据） | 复刻 createTreeRecords/applyOrder/第 ④ 步扫描：n=10003 升序产物 `>= 0` 判据成立、旧 `<= 0` 不成立；applyOrder 空序返回同引用契约不变（PASS） |
| eslint 单文件 | `NODE_PATH=$(npm root -g) npx eslint demo/src/data/table-ex/self-checks/painter.js demo/src/data/table-ex/main-view.vue` → **0 error / 0 warning**，exit 0 |
| 范围 | 仅白名单两文件改动（git diff 相对 HEAD 的累计含前序组未合入改动，本轮新增仅上表 3 处）；未启停服务、未 commit/push、未动 05-verify-1.md、src/ 组件源码零触碰 |

证明边界：像素级断言（assertRegionDiffer/Same 实际比较）需浏览器 canvas，归 verifier 页面级复验（面板预期 163/163）；本 harness 为锚位几何、裁剪矩形与绘制 op 流级实证，与验证报告既有浏览器 harness 证据（freshVsInvalidatedDiff=null、fixedAssert_firstDiff=null）互证。Part D 的 localeCompare 序在 Node 与浏览器默认 locale 下可不同，但「排序比较器 ⇒ 相邻非递减」性质与比较器同源同运行时，判据在任一运行时均成立。

## 偏离

无方案偏离。一处边界内展开（失败项 2）：

- 派发述「:1129 对照帧改 `makeState({})`」。:1129 定义的 `controlCanvas` 同时是 ：1131「加载中按钮区不半绘制」的对照帧，该断言语义（加载中不半绘制）要求按钮区 hover 带底色对齐——帧 A 按钮区有 hoverBg 叠加（[245,245,245] vs 纯帧 [255,255,255]），若 ：1129 直接替换，:1131 恒败（引入验证报告未列出的第 4 处缺陷，违背「只修 3 处」约束）。harness Part C 实证两帧 op 流不同。故实现为：:1131 保留 hover 对照帧，:1135 改用新增 `plainCanvas = makeState({})` 真·无 hover 帧——派发要求的目标断言（:1135 对照语义）完全达成，验证报告修复方向（「对照帧改 makeState({})」）在其定位的 ：1135 断言上逐字落实。

## 遗留

- 页面级复验（A9 面板 163/163、A8 成本按钮产出 relayoutMs/paintMs）归 verifier。
- eslint 需 `NODE_PATH=$(npm root -g)` 前缀（本地 node_modules 缺 eslint-config-standard，沿前序组环境备注）。
- 05-verify-1.md「设计外改动」节所列 styles 三件/badge 三件在途产物，属调度者 [I2-1] 已裁决范围，本轮未触碰。
