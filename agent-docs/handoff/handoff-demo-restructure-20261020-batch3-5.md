# Handoff

> **✅ 已完成（2026-10-20 会话接手后）**：批次 6（91e893a）、批次 7（e886b5d）、批次 8（e0ae8c8）均已实施、验证并提交。40 页 + home 全部建成，旧页兜底已移除，README 已重写，全量 URL/资源校验通过。本文档其余内容为批次 6-8 实施前的状态快照，仅供追溯。

## Goal

按 `agent-docs/plans/demo-restructure/plan.md`（v3 定稿）实施 demo 目录重构：40 页 + home、两级目录、统一版式、vite.demo.config.js 改造，批次 0-8 每批独立提交。本会话完成批次 3-5，剩余批次 6-8。

## Current State

- 批次 0-5 已完成并提交：
  - `3be2c07` 批次 0（基础设施 + home + buttons/button）
  - `841a7e3` 批次 1（basics/badge + buttons/group，删旧 button 页）
  - `d36962c` 批次 2（form/input、selection、select、combo-box、color-input，删旧 input/selection/combo-box 页）
  - `dd3fe8e` 批次 3（form/date-input、date-range-input、time-input、form + data/calendar，删旧 form/calendar 页）
  - `736d3fe` 批次 4（data/table、table-advanced、tree、tree-advanced、list、collapse + navigation/pagination，删旧 table/tree/collapse 页）
  - `96ed25f` 批次 5（navigation/tabs、menu、side-menu + feedback/message、status-box、tooltip，删旧 menu/side-menu/message 页）
- 批次 6-8 未开始。catalog 已登记 22 页（basics 2 + buttons 2 + form 9 + data 7 + navigation 4 + feedback 3），剩 overlay 4 + layout 5 + advanced 4 共 13 页未建。
- 旧页残留：`tabs/`、`dropdown/`、`modal/`、`flex-layout/`、`grid-layout/`、`scrollbar/`、`color/`、`gesture/`、`complex-1/`、`grid-designer/`。
- demo watch 进程在后台跑着（`npm run demo:build`，:3000 托管）；新会话先 `curl http://localhost:3000/` 探活，失效则重启。
- 工作区：`src/components/form/form-field.scss` 有会话前遗留未提交改动，**不得**纳入提交；`agent-docs/` 方案与交接目录未提交，保持不动。

## Key Context

- **验证工作流**（已跑通）：catalog/目录变更后必须重启 `npm run demo:build`（watch 不跟踪）；构建约 15s 后 curl 断言 200/404；playwright 用 DOM evaluate 断言（渲染数量、点击交互、`document.body` 加 `mu-dark` 类看深色背景变化），不用截图。每批流程：建页 → catalog → 重启 → curl+DOM 验证 → 删旧页 → 重启复验 → 提交。
- **serve-handler 目录列表坑**：删除一层旧页目录入口后，访问该路径（如 `/form/`）返回 200 的 serve-handler 目录列表页（标题 "Files within dist\form\"），不是旧页残留。断言旧 URL 时 404 才是干净态；若 200 需看内容是否目录列表。
- **API 确认结论**（本会话核实）：
  - `form.validate()` 返回 `{ ok: true }` 或 `{ errors }`，永不为 falsy；`resetValidation()` 清空 errors。
  - `mu-tree` 的 `active-node` 是普通 prop（无 update 事件），**不支持** `v-model:active-node`，用 `:active-node` + `@node-click` 回写。
  - `mu-pagination` 无 `small1` prop（旧 table 页遗留无效 attr），尺寸用 `size="small"`；`page-index` 从 0 开始。
  - table 表头 checkbox 渲染为 `div.mu-table__cell-check[data-checked]`（非真 input），点击触发表头全选。
  - table 的 `virtual-scroll` 属性在组件中无效（无此 prop，仅透传），新页未使用；`table-width`/`table-min-width` 同为透传 attr，旧页用法保留有效（控制 `<table>` 宽度）。
  - `$mussel.messageBox` 合并挂载 `notify`/`dismiss`（notifier）与 `showMessage`/`alert`/`confirm`/`error`/`warn`；`notify` 不返回 id 且内部 id 覆盖用户传参，**dismiss 无法构造有效交互示例**，message 页只在 note 中说明。
  - `mu-tooltip` 是无渲染组件（克隆锚点子节点），DOM 中无 `.mu-tooltip` 类，验证时按提示文本查 body 下渲染节点。
  - `mu-collapse` 展开态是根元素 `[expanded]` attribute（CSS 按 `[expanded]` 选择器），不是 class。
- **新页面 API 用法约定**：`primary/secondary/danger` 布尔 props 已废弃（运行时警告），新页一律 `color="primary"` 等（含 `mu-icon-button`、tree 的 `buttons` 数组配置项也用 `color`）；tree `buttons` 配置的 `success` 不在合法色值内（normal/primary/secondary/danger），已改 `color: 'secondary'`。
- **图标注册表**：内置图标以 `src/icons/tabler-icons.js` 29 个导出为准（check/star/search/folder/folderOpen/clock/calendar/file/list/sun/moon/x/info/alert/question/chevron*/dots/grid 等）。`alien`、`lock`、`lockOpen`、`link` 未注册会警告（本会话已从新页移除）；demo 自注册仅 bolt/album/bug/dotsVert/flag（`demo/src/common/app.js`）。
- **已知库缺陷（不修，方案禁改 src/）**：
  1. ImageColumn（table `type: 'img'`）返回的 items 缺 `events` 字段，`v-on="undefined"` 触发 Vue 警告，每行一条（data/table 列类型 section，共 5 条）。
  2. MuBadge/MuBadge 类 `:empty` 圆点被 `min-width: 16px` 撑住（badge.scss L16，dot 显示 16px 而非 8px）。
- **catalog.js 坑**：`findCatalogPage(path)` 返回 `{ page, category, index }` 包装对象，取标题用 `findCatalogPage(key)?.page.title`。
- **迁移替换记录**：旧 form 页 `@click="console.log(...)"` 模板内联不可用 → 改 methods；旧 form 页 error 文案 "shit" 改为中性文案；旧 tree 页随机数据（`generateRandomTree`）改为确定性生成（固定 childrenCount = id % 4），保证可重复 DOM 断言；旧 tree 页 localStorage 记忆 demo 序号的 combo-box 交互在拆页后不再需要，未迁移。
- **Git 纪律**：提交信息格式 `🔨: demo 重构批次 N：…`；rtk hook 会拦截 Bash 压缩输出，需原始输出用 `<cmd> | cat` 绕过。
- 迁移期 input 兜底（vite.demo.config.js `buildInputs`）：一层旧页目录自动成为入口；`common/`、`home/` 已排除；批次 8 才移除兜底扫描。

## Changed Files

- 本会话全部改动已随批次 3/4/5 提交（dd3fe8e / 736d3fe / 96ed25f），工作区仅剩遗留的 `src/components/form/form-field.scss`（不动）。
- 新增页面清单见 catalog.js（22 页登记完毕）。

## Next Steps

1. **批次 6（overlay）**（plan 3.7 规范，组件页 ≤8 section）：
   - `overlay/dropdown`：迁移旧 dropdown 页（剥离 tooltip → 已在 feedback/tooltip、list-divider → 已在 data/list；toolbar/flex-divider 内容留给批次 7 的 layout/bar）。素材：`demo/src/dropdown/main-view.vue`（artists 数据、check/radio item、search+scroll 自定义下拉、header/footer 插槽、短文本宽度测试）。
   - `overlay/context-menu`：旧页 `mu-context-menu` + `@contextmenu` 右键触发（固定触发说明：页面空白区右键）。
   - `overlay/dialog`、`overlay/drawer`：拆旧 modal 页（`demo/src/modal/main-view.vue`，尚未读取，实施时先读）。
   - 完成后仅删旧 `modal/`（dropdown 旧页批次 7 才删）；catalog 加 overlay 分类 4 页 → 重启 → 验证 → 提交。
2. **批次 7（layout）**：`layout/box`（flex-layout 拆出 h-box/v-box/flex-divider/space/break + flex 原子类）、`layout/split-box`（splitter 内部组件）、`layout/grid-box`（迁移 grid-layout）、`layout/bar`（**从旧 tabs/dropdown 页剥离 toolbar 内容 + MuScrollArea 新建**）、`layout/scrollbar`（迁移 scrollbar 页）。完成后删旧 `tabs/`、`dropdown/`、`flex-layout/`、`grid-layout/`、`scrollbar/`。旧 tabs 页的 `.tab-bar/.tab-btn` 自定义样式块属于已弃用手写形态，迁移等价性允许舍弃（plan 未要求保留）。
3. **批次 8（收尾）**：`advanced/gesture`（迁移 gesture 页）、`advanced/colors`（迁移 color 页，只讲 CSS 变量与 `colors` 导出，不写 setupColors）、`advanced/case-form`（complex-1 改名，`fluid` 模式）、`advanced/case-grid-designer`（grid-designer 改名，`fluid`）；移除 vite.demo.config.js 一层旧页兜底扫描；删旧 `gesture/color/complex-1/grid-designer`；README 全量重写；catalog 校验 + 全量 URL fetch 断言（plan 第 6 节）。
4. 每批同本会话流程；全程对照 plan 5.1 旧页删除时机表。

## References

- 方案（唯一依据）：`agent-docs/plans/demo-restructure/plan.md`
- 项目 AGENTS.md（含 demo 验证、playwright、rtk、提交规范）
- 上一份交接：`agent-docs/handoff/handoff-demo-restructure-20261020.md`（批次 0-2）

## Suggested Skills

- 无强制；playwright 用 mcp（不用 npx）。
