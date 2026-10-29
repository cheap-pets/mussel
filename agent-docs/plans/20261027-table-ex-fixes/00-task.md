# 任务：table-ex 缺陷修复（impl-verify）

## 流水线

impl-verify；单实施者串行，无并行组。

## 目标

修复 MuTableEx 六项缺陷并将 table-ex 相关目录 eslint 清零。问题清单见 02-design.md。

## 验收标准

编号对应 02-design.md 问题编号：

- R0 回归：demo 自检面板既有断言全数通过（当前基线 144 条；实施补充断言后为新基线，须全通过）。
- R1 固定列表头：`fixedLeftColumns > 0` 且横向滚动后，固定列区域表头无滚动列表头残影（滚动列表头文字不越界绘入固定区）。
- R2 check 列表头 checkbox 在表头单元格内水平 + 垂直居中。
- R3 可编辑单元格 hover 内边框与格边框四周等距（上/右/下/左差 0px）。
- R4a 居中对齐单元格的文字几何中心不受格线 1px 影响（与 R3 同源则一并修复）。
- R4b 多行文本单元格首行文字与其他单行格文字对齐。
- R5 表格宽度大于列宽总和时，剩余空白区域支持行 hover 高亮与点击选中。
- R6 `npx eslint src/components/table-ex/ demo/src/data/table-ex/` 0 error 0 warning。

## 验证命令

- lint：`npx eslint src/components/table-ex/ demo/src/data/table-ex/`（基线 39 error / 19 warning）
- 构建：`npm run build`
- 浏览器：demo watch 已在 3000 端口运行，实施改动后须等待 watch 重编译完成再验证
  - 页面与自检面板：http://localhost:3000/data/table-ex/（自检断言在页面调试面板内）

## 基线

- 分支 `mussel-table` @ `b5c43ea`
- 基线脏文件（属本任务第一步产物，不计为实施阶段设计外改动）：
  - `demo/src/catalog.js`（M，移除 table-ex-editable 登记项）
  - `demo/src/data/table-ex-editable/`（D，用户指令删除该 demo 模块）
- 杂散未跟踪文件 `agent-docs/handoff/.!42003!handoff-create-dynamic-component-20261017.md`：与本任务无关，勿动。
- eslint 基线：两目录 39 error / 19 warning。

## 验证环境

- demo watch（`vite build --watch` + 3000 端口静态服务）已由外部启动，HTTP 200 已确认；无需也不得再启停服务。
- 浏览器验证用 playwright MCP；canvas 像素断言可在页面 JS 上下文执行（getImageData）。
- 无凭据。

## 角色映射

- implementer → `pipeline-implementer`（注册副本已校验：仅 frontmatter 差异）
- verifier → `pipeline-verifier`（注册副本已校验：仅 frontmatter 差异）

## 开关

- 并发数：3（本次单实施者，串行）
- 实施循环上限：3 轮（流水线默认）
