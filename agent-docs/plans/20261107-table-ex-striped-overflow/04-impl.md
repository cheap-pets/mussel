# 实施记录

直修模式（无上游设计/探索报告）：根因定位 + 修复一体。

## 根因

`src/components/table/ex/table-paint/paint-body.js` `paintRowBandBackground`：
滚动区调用点传 `bandToX = layout.stickyWidth`，行背景带延伸至视口右缘（R1 既有裁定，保留）；
但非选中行分支用 `rowBackground(state, r)` 整带填充——striped 奇行即 `bgStripe` 直接铺满
延伸区（末列右界之外的空白区）。选中行分支虽有 `contentRightXOf` cap，延伸区补的是
`baseRowBackground`（斑马奇行仍为 bgStripe），同病。striped 底色成带绘制全库仅此一处
（`bgStripe` 消费点：paint-utils.js `baseRowBackground`，paint-body.js 成带；span region
矩形受列界约束无此问题）。

修复：统一 cap 口径——`rowBackground`（选中 selectBg / 斑马 bgStripe / 普通 bgNormal）
只画到 `capEnd = Math.min(bandEnd, contentRightXOf(layout))`（列内容区右缘视口 x），
延伸区 `[capEnd, bandEnd)` 统一补 `bgNormal` 表格底色。列总宽 ≥ 表格宽时
`contentRightXOf ≥ stickyWidth ≥ bandEnd`，cap 不生效，行为不变；固定列 pass
（bandEnd = fixedWidth ≤ contentWidth）同样不受影响。

## 改动文件

- `src/components/table/ex/table-paint/paint-body.js` — `paintRowBandBackground` 统一 cap +
  延伸区补 bgNormal；移除失去消费点的 `baseRowBackground` / `isSelectedRow` import（修复 striped 越界）
- `src/components/table/ex/table-paint/paint-utils.js` — 仅注释：`baseRowBackground` 头注去掉
  「选中带延伸区补底」旧口径（无行为变更）
- `demo/src/data/table-ex/self-checks/painter.js` — 自检断言同批漂移修正（绘制特征变更，
  按 canvas-pixel-assert-anchor-drift 处理，明细见下）

## 断言漂移明细（painter.js「行背景带宽度」用例，窄列夹具 Σ=350 / W=600）

- L1252 `行 1 斑马底色充满延伸区`：期望 `bgStripe` → `bgNormal`。漂移原因：本修复目标行为——
  斑马色 cap 至列内容区右缘（contentRightX=350），延伸区不再出斑马色块
- L1264 `hover 行带延伸区无混色`：期望 `bgStripe` → `bgNormal`。漂移原因：hover 行带本就止于
  末列右缘，露出的行带底在延伸区由斑马色变为 bgNormal
- L1280 `选中斑马行延伸区补 bgStripe`：期望 `bgStripe` → `bgNormal`。漂移原因：选中带延伸区
  补底从「非选中口径（斑马奇行 = bgStripe）」改为统一 bgNormal 表格底色
- L1254 期望值不变（行 2 偶行，新旧口径同为 bgNormal），仅标签与注释口径同步
- 检查名、(a)/(b-3)/(c) 注释、文件头注释同步新口径
- grep 旧值全扫 self-checks（12 文件）：`bgStripe` 其余断言采样 x ≤ 560 且均在默认夹具
  （Σ=630 > W=600，无 blankTail）内容区内，不受影响；`充满延伸区`/`非选中口径底色`/
  `延伸区补 bgStripe`/`isSelectedRow`/`baseRowBackground` 无残留旧口径引用

## 偏离

无。

## 自检

1. demo 页自检（http://localhost:3000/data/table-ex/，rollup watch 产物）：
   - 页面加载态自检 **241/241 通过**（两次独立加载均全绿，含改名后新断言用例 ✓）
   - 「重跑自检」出现 1 条失败 `[cell-painters] icon 列…dev warn 一次`：既有重跑敏感问题——
     `src/utils/warn.js` `once: true` 模块级 `warned` Set 按固定文案去重，首次运行已消耗，
     二次运行不再 warn。本次未触碰 icon/warn 链路（改动仅 paint-body/paint-utils/painter 自检），
     刷新页面即恢复全绿。非本次引入，不处理（避免为过自检改正确行为/扩改动面）
2. 组件级像素验证（playwright + canvas getImageData，demo 实例）：
   - 窄列场景（narrowColumns Σ=576 < 画布 956，striped 恒开）：行 1/3/5 内容区（x=300）= 246 striped、
     行 0/2/4 = 255 白；边界 x=573/574 斑马 246、x=575 末列右缘 1px 列线、x≥576 全白；
     延伸区竖扫（x=766，表头下至画布底）唯一颜色 255 白，无斑马色 → 验收 1 通过
   - 默认场景（Σ=1944 > 956，横向滚动）：未滚动与 scrollLeft=400 两态，W-1 处斑马行 = 246、
     普通行 = 255，整带充满画布 → 验收 2 通过（行为不变）
3. `npm run build:ex` 通过（ex-development + ex-production 两次构建，332 modules）

## 遗留

- `[cell-painters] icon dev warn` 用例重跑恒败为既有问题（warn-once 预热，同
  table-ex-counter-assert-warm-cache 模式），建议后续单独修（固定文案改唯一键或暴露 warned 重置），
  不在本次范围内
- demo 页存在 1 条既有 console error（`data:image/png;base64,AAAA...` 非法 URL 资源加载失败），
  与本修复无关
