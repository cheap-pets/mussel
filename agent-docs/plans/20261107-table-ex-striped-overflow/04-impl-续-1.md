# 实施记录（续 1：head 区滚动阴影越界修复）

续做模式（同任务追加缺陷修复）。缺陷（用户澄清后口径）：窄列（列总宽 < 表格宽）
+ 纵向滚动时，head 滚动阴影越过列内容区右边界画入超宽空白区；非窄列态行为须不变。

## 根因

阴影条非 canvas 绘制，是 DOM 投影条 `.mu-table-ex__header-shadow`
（`src/components/table/ex/table-ex.vue` overlay 内，box-shadow 方案），CSS `width: 100%`
（`src/components/table/ex/table-ex.scss` 共享规则块）= stickyWidth = 表格视口宽，
窄列时横贯内容区 + 空白区。canvas 侧 head 背景与底边框早已 cap 至
`Math.min(W, contentRightXOf)`（paint-header.js L285/294），越界的只有 DOM 阴影条。

复现确认：遗留探针 `narrow-yscrolled-shadow.png` 中列内容止于 ≈x800、阴影带延伸至
≈x1130（视口宽），越过内容区右界进入空白区。

## 修复

宽度收口，与首轮 striped 修复同口径（`contentRightXOf` 共享式）：壳新增
`headerShadowStyle` computed，内联下发 `width = min(stickyWidth, contentRightXOf(layout))`。
窄列态 = 列内容区右缘；列总宽 ≥ 表格宽（横向滚动态）`contentRightX ≥ stickyWidth`
（scrollLeft ≤ contentWidth − stickyWidth 恒成立），min 恒取 stickyWidth，行为不变。
layout 未就绪返回 null，CSS `width: 100%` 兜底（首帧无 `--y-scrolled` 类，阴影不显示）。

n=0（无列）时宽度 0：空表无内容无滚动，`--y-scrolled` 不可达，无行为差异。
阴影右缘余量：`--mu-shadow-float` 无 x 偏移、blur ≤4px（root.scss L65-68），元素收口后
右缘外仅 ≤4px 投影渐尾（投影自然形态），无色块。

## 改动文件

- `src/components/table/ex/table-ex.vue` — import `contentRightXOf`；新增
  `headerShadowStyle` computed；模板 header-shadow div 绑 `:style`（修复 head 阴影越界）
- `src/components/table/ex/table-ex.scss` — 仅注释：`.mu-table-ex__header-shadow` 处
  说明宽度由壳内联下发、`width: 100%` 仅为 bottom-shadow 与首帧兜底（无行为变更）

## 偏离

无。

## 自检

1. 脏区联动约束核查：阴影为 DOM box-shadow，不经 canvas 绘制/脏区路径；宽度随
   `layout.value` 响应式更新（relayout / recomputeViewWindows 替换时重算），横向滚动
   态宽度值恒稳定（见修复段推导），无残影/重复混色路径。约束不适用（DOM 层）。
2. 断言漂移核查：grep `header-shadow` / `shadow` 全扫 `demo/src/data/table-ex/`
   均 0 命中，self-checks 无 DOM 阴影断言；本次 canvas 绘制零变更，无漂移，
   未改 self-checks。
3. demo 页自检（playwright，rollup watch 产物）：
   - `?scene=narrow` 加载态自检 **241/241 通过**
   - default 场景加载态自检 **241/241 通过**
4. 组件级验证（playwright，DOM 断言 + 截图合成像素）：
   - 窄列场景（Σ=576 < 视口 956，striped 恒开）+ scrollTop=60：`--y-scrolled` 生效、
     box-shadow 激活，阴影条 computed width = **576px**（= 列总宽 56+280+240），
     stickyWidth = 956 → 阴影止于列内容区右缘；元素截图合成像素确认：阴影条与
     "数量"列右边界对齐，右侧空白区（576→956）纯白、无阴影/渐变色块，阴影仍正常
     显示在表头下方 → 验收 4 前半通过
   - default 场景（Σ=1944 > 956）双态：仅纵向滚动（scrollTop=80）与双滚动
     （scrollTop=80 + scrollLeft=400，box-shadow 激活），阴影条 width 均为
     **956px = stickyWidth**，横贯全宽 → 验收 4 后半（非窄列态行为不变）通过
5. lint：`npx eslint src/components/table/ex/table-ex.vue`、
   `npx stylelint src/components/table/ex/table-ex.scss` 均 0 报错
6. `npm run build:ex` 通过（ex-development + ex-production，332 modules）
7. 验证产物：新探针截图 `.playwright-mcp/narrow-yscrolled-shadow-after-fix.png`
   （该目录 .gitignore 为 `*`，git 不可见，未新增仓库未跟踪文件）；仓库根目录
   2 张遗留探针 PNG 未触碰（decisions.md 约定任务结束统一清理）

## 遗留

- 首轮遗留不变：`[cell-painters] icon dev warn` 重跑恒败（warn-once 预热，既有问题）；
  demo 页 1 条既有 console error（`data:image/png;base64,AAAA` 非法 URL）
- 仓库根目录遗留探针 `default-yscrolled-xscrolled.png` / `narrow-yscrolled-shadow.png`
  待任务结束统一清理（decisions.md）
