# Handoff

## Goal

按 `agent-docs/plans/demo-restructure/plan.md`（v3 定稿）实施 demo 目录重构：40 页 + home、两级目录、统一版式、vite.demo.config.js 改造，批次 0-8 每批独立提交。

## Current State

- 批次 0、1、2 已完成并提交：`3be2c07`（基础设施 + home + buttons/button）、`841a7e3`（批次 1 + 删旧 button 页）、`d36962c`（批次 2 + 删旧 input/selection/combo-box 页）。
- 批次 3 进行中：刚完成素材调研（旧 calendar 页 54 行、旧 form 页 185 行已读；date-input/date-range-input/time-input props 已确认），**尚未写任何批次 3 页面文件，catalog.js 也未加批次 3 条目**。
- 批次 4-8 未开始。
- demo watch 进程在后台跑着（`npm run demo:build`，:3000 托管）；新会话先 `curl http://localhost:3000/` 探活，失效则重启。

## Key Context

- **验证工作流**（已跑通）：catalog/目录变更后必须重启 `npm run demo:build`（watch 不跟踪）；每次构建后 curl 断言 200/404；playwright 用 DOM evaluate 断言（渲染数量、点击交互、`document.body` 的 `mu-dark` 类切换），不用截图。删除旧页后重启确认旧 URL 404、新 URL 200。
- **新页面 API 用法约定**：`primary/secondary/danger` 布尔 props 已废弃（运行时警告），新页一律用 `color="primary"` 等（button/button-group 已验证）；badge/tags 按钮内嵌 `.mu-badge` 类用法保留在 buttons/button 页。
- **内置图标名**以 `src/icons/tabler-icons.js` 的 29 个导出为准（check/star/search/folder/clock/calendar/file/list/sun/moon/X/info/alert/question/chevron*/dots/grid/list 等）；bolt/album/bug/dotsVert/flag 是 `demo/src/common/app.js` 里 demo 自注册的。动画后缀 `:spin`，`animation` prop 支持 hover-shrink/hover-grow/hover-rotate-180。
- **已知库缺陷（不修，方案禁改 src/）**：MuBadge/MuBadge 类 `:empty` 圆点被 `min-width: 16px` 撑住（badge.scss L16 min-width 未在 :empty 分支重置），dot 显示 16px 而非 8px。
- **catalog.js 坑**：`findCatalogPage(path)` 返回 `{ page, category, index }` 包装对象，取标题用 `findCatalogPage(key)?.page.title`（vite.demo.config.js 里踩过一次）。
- **Git 纪律**：`src/components/form/form-field.scss` 有会话前遗留未提交改动，**不得**纳入提交；`agent-docs/plans/demo-restructure/` 方案目录未提交，保持不动。提交信息格式 `🔨: demo 重构批次 N：…`。
- rtk hook 会拦截 Bash 并压缩输出，需要原始输出时用 `<cmd> | cat` 绕过（如 grep -h 会被 rtk 当 help）。
- 迁移期 input 兜底（vite.demo.config.js `buildInputs`）：一层旧页目录自动成为入口；`common/`、`home/` 已排除；两级目录未登记 catalog 会 console.warn。批次 8 才移除兜底扫描。

## Changed Files

- 已提交部分见 git log 3be2c07 / 841a7e3 / d36962c。
- 工作区当前无批次 3 未提交改动（干净）。

## Next Steps

1. **批次 3**（按 plan 3.7 章节规范，每页 ≤8 section，regression 收尾）：
   - `form/date-input`：旧 calendar 页 5 种 type（date/week/month/quarter/year，week 用 `format="yyyy-MM-Ww"`）+ format/value-type/min-max；`form/date-range-input`：Date 对象值与 `value-type="string"` 字符串值两条用例 + clearable；`form/time-input`：second-step 15、`format="HH:mm"`（second-step 0、minute-step 0）三条旧用例；`data/calendar`：`mu-calendar` 仅日历部分（`:week-starts-on="1"`，旧样式 class calendar1 宽 800 高 600 可改为 wide section）。
   - `form/form`：迁移旧 form 页两组——手写 mu-form-field 布局（label-width/label-align、width 1/3、flex-break、mu-form-row、error 提示、原生 input/textarea 用 mu-input 类）+ items/rules 配置式表单（`formRef.validate()` / `resetValidation()`，注意旧页 `@click="console.log(...)"` 在模板里不可用，需改成 methods）。
   - 更新 catalog.js（form 分类追加 4 页、新增 data 分类放 calendar）→ 重启 watch → curl + playwright 验证 → 删旧 `demo/src/form/` 与 `demo/src/calendar/` → 重启复验 404/200 → 提交。
2. 批次 4-8 按 plan 第 5 节批次表执行；每批同上流程。批次 8 移除 `buildInputs` 中一层旧页兜底扫描 + README 全量重写。
3. 全程注意 5.1 旧页删除时机表（tabs/dropdown 的 toolbar 内容到批次 7 才用完）。

## References

- 方案（唯一依据）：`agent-docs/plans/demo-restructure/plan.md`
- 项目 AGENTS.md（含 demo 验证、playwright、rtk、提交规范）

## Suggested Skills

- 无强制；playwright 用 mcp（不用 npx）。
