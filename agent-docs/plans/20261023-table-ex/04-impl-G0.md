# 实施记录 — G0（demo 骨架 + 夹具 + 自检骨架 + catalog 登记）

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|------|------------|------|
| `demo/src/data/table-ex/main.js` | G0 | 页面入口（`createVueApp` 惯例同其他 demo 页） |
| `demo/src/data/table-ex/main-view.vue` | G0 | 页面骨架：组件舞台（占位 + 右下角尺寸手柄，宽/高双向）、10 万行确定性数据生成器、13 列定义（覆盖 A4 全部列型用例）、事件日志区、调试面板（自检结果区 / 重绘计数与 lastPaint 统计 / 主题快照）、全部夹具控件与调试入口、DOM 版 mu-table 参照区、数据生成器自检断言 |
| `demo/src/data/table-ex/self-checks/index.js` | G0 | 自检聚合入口：`moduleChecks` 引用 6 个模块文件，`runChecks(extra)` 汇总模块断言与页面 data 断言 |
| `demo/src/data/table-ex/self-checks/theme.js` | G0 占位 | 空断言数组，注释写明 G1-a 待填充内容 |
| `demo/src/data/table-ex/self-checks/layout.js` | G0 占位 | 同上（G1-b） |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | G0 占位 | 同上（G1-c） |
| `demo/src/data/table-ex/self-checks/painter.js` | G0 占位 | 同上（G2-a） |
| `demo/src/data/table-ex/self-checks/interactions.js` | G0 占位 | 同上（G2-b） |
| `demo/src/data/table-ex/self-checks/editor.js` | G0 占位 | 同上（G2-c） |
| `demo/src/catalog.js` | G0 | `data` 分类 table-advanced 之后登记 `data/table-ex`（title「TableEx 画布表格」） |

### 夹具与 decisions.md「[I1 前]②」逐项落实

| decisions ② / 改动清单条目 | 落点 |
|--------------------------|------|
| columns 替换控件 | 「替换 columns（引用变化）」按钮，`columns` ref 整体引用替换（默认列组 ↔ 替换后列组） |
| headerChecked 受控绑定 | `headerChecked = ref({ checked: false })` + `onHeaderChecked` 处理器（表头 ✓ 后批量就地改 records 并递增 recordsVersion，走 A3 数据契约②通道）；prop 接线在 S1 接入点注释内（G0 无组件标签可绑） |
| orderBy 受控绑定 | `orderBy = ref('')`（`field:asc` 格式）+ `onOrderByChange` 处理器 + 父级 `sortedRecords` computed 实际排序（展示型排序的父级职责）；接线在 S1 注释内 |
| update:cell-value 就地改 record 处理器 | `onCellValueChange`：`record[column.field] = value`（就地修改，组件 nextTick 重绘该行）；check 取消时同步 headerChecked |
| 表格 resizable 开关 | `resizable` switch（默认 true），接线在 S1 注释内 |
| DOM 版 mu-table 参照区 | 同页 `<mu-table>`：同 `columns` 引用、同数据源 `referenceRecords`（见偏离 2）；headerChecked / cell-value 与主表共用处理器 |
| getCellRect 坐标辅助 | `window.__tableEx = { getCellRect: () => null }` 占位（实例就位前返回 null；S1 替换为组件实例） |

### 设计改动清单 demo 行夹具逐项对照

10 万行生成器 ✓；事件日志区 ✓（全部 emit 处理器 + 200 条上限 + 清空按钮）；自检结果区 ✓（挂载即跑 + 重跑按钮）；重绘计数与 lastPaint ✓（200ms 轮询 `getLayoutInfo().lastPaint` 变化）；主题快照 ✓（打印按钮 + 轮询刷新）；空态三变体 ✓（数据规模 radio 含「空（records=[]）」× 空态定制 radio：无 / #empty 插槽 / emptyText）；容器尺寸手柄 ✓（pointer 拖拽改 width/height，含高度方向）；fixedLeftColumns 输入 ✓；editable 开关（含 false 变体）✓；validate 列 ✓（备注列 `editor.validate` 含「错误」返回文案）；recordsVersion 异步按钮 ✓（300ms 延迟就地改 `records[0].memo` 后递增）；--row-height 覆盖开关（容器内联 `--row-height: 48px`）与根字号覆盖（18px）✓（均注明 refreshTheme 后生效）；mu-dark 挂组件根变体 ✓（class 绑定在组件标签所在容器，S1 注释中类落在组件标签上）；scrollToRecord 输入+按钮 ✓（数字转 Number）；refreshTheme 按钮 ✓（调用后立即刷新快照打印）；`window.__tableEx` ✓。

测试计划 A1/A4 需要而改动清单 demo 行未逐项列出的入口（预防 review-3 Major 1 同类缺口）：placeholder 占位文本开关（A1 像素采样）、recordsOffset 输入（A4 rec_no 断言），已一并补齐。

## 偏离

1. **watch 启动顺序**（非设计偏离，流程说明）：派发预期「启动 watch → catalog 登记后重启」。实际执行：端口 3000 确认未监听后，先完成 catalog 登记、再启动 `npm run demo:build`（watch，后台），首次构建即包含新页面路由，无需重启（无已运行进程可重启）。结束时进程保持运行（后台任务 `exec_e6adb8b0-d6c3-4bc3-8af6-630e6e786f5f`）。
2. **DOM 版参照取「同数据源前 20 行」**：设计写「同列定义同数据」；10 万行 DOM `<table>` 全量渲染不可行（浏览器冻结），取 `displayRecords.slice(0, 20)`——列定义为同一 `columns` 引用，数据同源且与主表顶部视口对齐，满足 A4/A7 并排比对意图。断言如需特定行可先滚动主表后比对对应行内容。
3. **`window.__tableEx` G0 值为 `{ getCellRect: () => null }` 占位对象而非裸 null**：设计 G0 判据允许「占位 null 亦可」，派发要求「getCellRect 经 window.__tableEx，实例就位前返回 null」——裸 null 会使 `window.__tableEx.getCellRect(...)` 抛 TypeError 而非返回 null，故用带 getCellRect 的占位对象，S1 整体替换为组件实例。
4. **主题快照读取契约**：设计未定义 demo 侧读取主题快照的通道（getLayoutInfo 不含 theme）。调试面板按 `window.__tableEx.getThemeSnapshot()` 轮询读取（判空安全）。**S1 需经 defineExpose 暴露 `getThemeSnapshot()`**（返回 theme.js 快照对象），否则面板保持占位文案、A1「refreshTheme 后快照打印更新」断言无可执行通道。
5. **重绘计数为 demo 侧近似统计**：组件无全局绘制计数通道，demo 每 200ms 轮询 `lastPaint` 序列化值、变化即计数。G2-a painter 提供 lastPaint 后生效；如后续步骤暴露精确 paintCount，可替换该轮询逻辑。

## 自检

| 检查 | 命令/方式 | 结果 |
|------|----------|------|
| watch 构建 | `npm run demo:build`（后台，首次全量构建） | 通过：424 modules transformed，built in 6847ms，`demo/dist/data/table-ex/main.js`（28.43 kB）与 `style.css` 产出，无构建报错 |
| 页面路由 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/data/table-ex/` | 200；`main.js` 资源 200；`<title>` 为「TableEx 画布表格 - Mussel Demo」 |
| 首页/服务 | `curl http://localhost:3000/` | 200（watch 静态服务正常） |
| stylelint | — | 不适用：本步骤无 `src/` 与 scss 文件改动，样式为 demo 页内 `<style>`（项目 stylelint 命令面向 `src/components/*.scss`） |
| 全量 build / lint | — | 本步骤无 `src/` 改动，`npm run build`（库构建）留待 S2 集成步骤执行（白名单外不跑全局命令） |

## 遗留（UNVERIFIED，待验证阶段浏览器执行）

- 页面 DOM 渲染效果：面板/日志区/全部夹具控件的实际渲染与交互（构建产物已含页面代码，未做浏览器内断言）。
- 自检区断言执行结果：数据生成器 4 条断言代码已写全并挂载即跑，运行结果（应 4/4 通过）未在浏览器内确认。
- `window.__tableEx` 运行时可访问性：代码在组件 setup 顶层赋值，未在浏览器内读取确认。
- S1 对接契约（本步骤定义，S1 实施者需知）：
  1. `main-view.vue` 中 `.ct-placeholder` 即接入点，注释内含完整预期绑定（props/事件/`#empty` 插槽），替换为 `<mu-table-ex>` 并本地 import 即可；
  2. `window.__tableEx` 占位对象整体替换为组件实例；
  3. 组件需暴露 `getThemeSnapshot()`（见偏离 4）；
  4. 调试面板经 `getLayoutInfo()` 轮询 lastPaint，G2-a 落地 painter 统计后自动生效。
