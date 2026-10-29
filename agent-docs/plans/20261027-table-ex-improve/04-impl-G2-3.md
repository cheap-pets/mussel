# 实施记录：G2-3（self-checks/cell-painters.js）

模式：并发波 2a / 步骤 G2-3。白名单：`demo/src/data/canvas-table/self-checks/cell-painters.js`（仅此文件，未动源码与其他 self-checks）。
设计依据：02-design.md「测试计划」A1/A5/A7 行、「改动清单」self-checks/cell-painters.js 行；断言口径对齐 04-impl-G1-b.md 实测（首行恒 18 = ROW_TOP_INSET 1 + padding 8 + lineHeight/2 9，不随行高变；h=36 单行 y=18、h=60 两行 [18,36]、h=80 三行 [18,36,54]、h=88 四行 [18,36,54,72]）。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| demo/src/data/canvas-table/self-checks/cell-painters.js | G2-3（A1/A5/A7） | 净 +235/−16：夹具扩 hover/bgNormal、recordingCtx 增记 fillRect/stroke、锚点断言组按槽位锚改写、新增 5 个检查块、既有 itemHits 断言补 disabled 字段。摘要如下 |

### 改动摘要

1. **夹具（改动清单第 1 项）**
   - `THEME_COLORS` 每色补 `hover` 字段：语义 5 色取可区分配色 `rgba(R, 130, 245, 0.85)`（≠ color，保证「语义色取 hover」断言有效）；彩色 12 色 hover = color（同色，DOM 版 hover 基准）。
   - `THEME` 补 `bgNormal: 'rgba(255, 255, 255, 1)'`（反转三色断言需读 `theme.bgNormal`，夹具缺该字段时反转文字色为 undefined、断言不可写——边界内扩展，见「偏离」节说明）。
   - `recordingCtx` 增记 `fillRect`（x/y/width/height + fillStyle，link 下划线断言）与 `stroke`（strokeStyle，button 反转边框色断言）；既有 `fillText`/`fill` 记录形状不变。
   - 新增 `iconSeed` 序号：requestIconImage 夹具 SVG 串逐次唯一（imageCache 模块级跨检查持存，固定串页内重跑会命中已加载条目使「loading」断言假红——与 tinyPngDataUri 同款规避，A5 行要求）。
2. **锚点断言组改写（槽位锚口径，原 :661/:684/:720/:851 四处）**
   - 多行 wrap（h=60）：`[21,39]` → `[18,36]`；数组值多行（h=80）：`[22,40,58]` → `[18,36,54]`；line-clamp 改道（h=60）：`[21,39]` → `[18,36]`；link 竖排（h=88）：`[17,35,53,71]` → `[18,36,54,72]`。label 均改记「首行槽位锚（y0 = 1+8+9 = 18，不随行高变；顺次 +18）」，原「块整体居中（R4b）」口径作废。
   - 单行锚断言（原 :667）期望值 18 不变（设计明示零回归），仅 label 改记「与改前 rect.y + h/2 逐值相等」。
3. **既有 itemHits 断言扩展 disabled 字段（问题 7）**
   - button 绘制检查：+2（常规按钮 disabled=false、disabled 按钮 disabled=true，isTruthyAttr 口径）。
   - link 列竖排检查：+1（四条目 disabled 数组 `[false, true, false, false]`——B disabled、dots false）。
   - tag 颜色检查：+1（横排 reportHitRect 路径 disabled 缺省 false）。
4. **新增检查块 5 个（51 条断言）**
   - **槽位锚（A1）**：center rightInset=0 → x=80 / y=18；rightInset=1 → x=79.5（列线占用扣除 −0.5px）/ y 仍 18；left x=8、right x=152（不受 rightInset 影响，防误改分支）；超高行（h=88）单行 y=18（跨列首行同高判据，decisions 检查点-A1判据）。**垂直残差判据按 decisions 检查点-A1判据写入注释**：直调锚恒 18；r≥1 且 gridlines 含 row → 内容区中心 18.5 → 残差 0.5px（授权 ≤0.5px）；r=0 或不含 row → 残差 0；超高行只验跨列首行同高，不设与内容区中心之差。
   - **link 悬停（A7，两路径各断言一次）**：竖排 drawLinkItems——hover 第 0 条（success）fillStyle = colors.success.hover、fillRect 恰 1 条（y=25 = anchorY 18 + round(14×0.35) 5 + 2、x=8、h=1、宽>0、fillStyle = hover 色）；竖排 disabled 条目（B）被 hover → 仍常态 muted、无下划线；横排 drawItemText（自定义类型产 is:'a' 条目构造，col.type 非 link 走横排）——hover 第 0 条（danger）fillStyle = colors.danger.hover、下划线 y=25 同式、未 hover 的 disabled 条目仍 muted；横排 disabled 条目被 hover → 不悬停（第 0 条回落常态 danger.color、无 fillRect）；横排 reportHitRect 条目 disabled=[false,true]。
   - **button 悬停反转（A7）**：命中非 disabled → 底/边框 = colors.danger.color、文字 = bgNormal（三色，stroke 色经 recordingCtx 新增 stroke 记录取证）；disabled 条目被 hover → 底 bgDisabled / 边框 borderColor / 文字 textColorMuted 不反转，且不影响另一按钮常态。
   - **linkHoverColorOf 分支（A7）**：语义色 → hover；彩色 → hover === color；hover 字段缺失 → 回退 color（自定义主题裁剪场景）；disabled → textColorMuted；未知名/无 class → primaryColor（五分支 + 夹具前置断言 hover ≠ color）。
   - **requestIconImage（A5）**：返回缓存条目且 status='loading'、crossOrigin='anonymous'；data URL 前缀 `data:image/svg+xml;charset=utf-8,`；decodeURIComponent 后无 currentColor 残留、stroke/fill 两处均着色、SVG 标记保留；同参二次调用返回同一缓存条目（===）；异色分键；非 SVG 串按 src 直通且 getImageEntry 可查到。
5. 文件头注释同步（G2-3 覆盖范围、SVG 串逐次唯一说明）；link 竖排检查返回值 y 序列文案 17/35/53/71 → 18/36/54/72。

### 断言清单（计数）

| 类别 | 数量 | 明细 |
|---|---|---|
| 改写（口径反转） | 4 | 原锚点断言组 y 期望值 + label（夹具/工具改动不属断言） |
| 改写（仅 label/文案，期望值不变） | 1 | 单行锚 18（:667） |
| 扩展（既有检查块追加） | 4 | button disabled ×2、link 竖排 disabled 数组 ×1、tag disabled 缺省 ×1 |
| 新增（新检查块 5 个） | 51 | 槽位锚 7、link 悬停 18、button 反转 8、linkHoverColorOf 7、requestIconImage 11 |
| 删除 | 0 | — |
| 合计 | 断言调用点 171 → 226（净 +55） | `grep -o "assert[A-Za-z]*("` 口径 |

## 偏离

无。（边界内说明：THEME 夹具补 `bgNormal` 字段未在改动清单文字中逐字列出——A7 行「drawButtonPill 反转三色断言」以反转文字 = `theme.bgNormal` 为判据，夹具缺该字段时取值为 undefined、断言不可写，属夹具必须具备被测代码所读字段的同款问题（改动清单对 THEME_COLORS hover 字段已明示同一逻辑）；仅增夹具字段，无源码/方案变化。）

## 自检

| 判据 | 方式 | 结果 |
|---|---|---|
| eslint 单文件通过 | `NODE_PATH=/usr/local/lib/node_modules npx eslint demo/src/data/canvas-table/self-checks/cell-painters.js` | **0 error / 0 warning**，exit 0 |
| 模块图解析（具名导入存在性） | 项目内 esbuild `--bundle --loader:.scss=empty` 打包本文件 | 成功（98.3kb，`requestIconImage`/`linkHoverColorOf` 具名导入解析通过；scss 空加载与 vite 构建同责） |
| 直调走查（断言实跑） | /tmp harness：stub document/canvas(2d)/Image → esbuild 产物动态加载 → 实跑本组改写/新增的 12 个检查块（多行文本/数组值多行/函数 lineClamp/槽位锚/button 绘制/link 列竖排/link 悬停/button 悬停反转/linkHoverColorOf/requestIconImage/tag 颜色/check disabled 底衬） | **12/12 passed, 0 failed**——槽位锚 y 恒 18（h=36/88）、x=80/79.5/8/152、下划线 y=25、反转三色、disabled 两态、requestIconImage 着色/缓存/直通全部按期望落地（临时文件已清理，未触碰仓库） |
| 断言对齐 G1-b 实测 | 改写期望值逐项对照 04-impl-G1-b.md 自检节（[18,36]/[18,36,54]/[18,36,54,72]/单行 18/rightInset 79.5/8/152/下划线 25） | 一致 |
| 白名单 | `git status`：本轮仅 cell-painters.js 自检文件改动（main-view.vue / self-checks/editor.js 为 G2-1/G2-2 在途改动，未触碰） | PASS |

未执行（按派发约束）：页面级验证（等 G2 全组落地后由 V 集成验证跑自检面板与 A1–A11）、git commit/push、服务启停。

## 遗留

- 本组不做页面级验证：自检面板需 demo 整包 boot（依赖 G2 各组 self-checks 全部可导入），页面判据归 V 集成验证。
- 像素栅格类断言（countPaintedPixels/assertPixel/pixelBuffersDiffer）依赖真实 canvas 栅格化，直调 harness 以 alpha=1 假数据仅覆盖「非空像素」类（button 绘制检查），像素差异/精确取色类断言（既有、未改动）留页面验证；本组新增断言全部为记录取证型（fillText/fill/fillRect/stroke），不受此限。
- eslint 需 `NODE_PATH=/usr/local/lib/node_modules` 前缀（沿用 G1/S4/S5 环境备注；本地 node_modules 缺 eslint-config-standard）。
