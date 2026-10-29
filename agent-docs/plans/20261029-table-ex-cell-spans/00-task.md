# 任务简报：mu-table-ex 合并单元格实施

## 目标

按 `02-design.md`（终版设计，经三轮评审收敛、用户确认）实施 mu-table-ex 合并单元格功能，P0（rowspan 全链路）+ P1（colspan）全量完成。

## 验收标准（可验证）

1. 新增 `demo/src/data/table-ex/self-checks/spans.js`，覆盖设计 §9 自检 1–13，全部断言通过。
2. 既有 self-checks（cell-painters / editor / interactions / layout / painter / row-geometry / text-wrap / theme / tree）全量回归通过——无合并表格走 null 分支原实现，零回归。
3. `self-checks/tree.js` 补 parentKeys 断言。
4. demo 页（`main-view.vue`）新增合并示例组，覆盖设计 §9 demo 14–20 场景：级联分组渲染、hover 移出无残影（cell 模式）、事件载荷为主行、锚行选中覆盖行底色随动、树跨父不合并、排序 dev 警告、锚行滚出窗口后区域内条目可点。
5. `npm run build` 构建通过（产出 mussel 与 mussel.ex 双版本）。
6. 改动范围限于设计 §11 文件清单；无合并路径 `paintCellRange` 原实现逐字保留（null 分支）。
7. 不修改 skills/、docs/、docs-site/ 下任何文档（文档同步须用户另行确认，见项目 AGENTS.md）。

## 验证命令

- 构建：`npm run build`
- 自检/交互：浏览器访问 `http://localhost:3000/data/table-ex/`（demo rollup watch 运行中，先直接访问不重新打包；自检结果看 console）
- 浏览器断言手段：优先 playwright mcp；不可用时按知识库 `headless-edge-dom-verification` 用 headless Edge（`--dump-dom` / JS 注入断言 console 输出），脚本走 dist/mussel.js dev 构建
- style lint 报错先用 `npx stylelint --fix`（项目 AGENTS.md）

## 基线

- 分支 `mussel-table`，HEAD `eeec1fd`
- 工作区 57 个未提交文件（前期 canvas-table→table-ex 更名与优化工作）：按「与本任务叠加」处理，不提交、不暂存、不还原

## 开关状态

- 修复循环预算：**2 轮**（用户指定，覆盖 impl-verify 默认 3 轮；轮 1 = 初始实施+验证，轮 2 = 修复+再验证，耗尽即停）
- 并发：无（设计无并行组，串行单实施者）
- 评审：不适用（设计已经三轮评审收敛）

## 角色映射

- implementer → `pipeline-implementer`（副本校验通过，仅 frontmatter 差异）
- verifier → `pipeline-verifier`（同上）

## 验证环境

- demo 站点：`http://localhost:3000/data/table-ex/`（rollup watch 常驻；若未运行，`npm run demo:build` 后台启动——注意 watch 重建会清空 demo/dist 的临时资产，见知识库）
- 无凭据要求

## 流水线

impl-verify（用户自定义轮数：FAIL 修复循环最多 2 轮）。设计输入 `02-design.md` 由 `design.md` 复制（原路径：本目录 `design.md`）。
