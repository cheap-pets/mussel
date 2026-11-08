# 实施记录（注释精简 · 批1）

## 改动文件
- src/components/table/ex/geometry/row-geometry-controller.js 452→446（−6）：3 处多行 JSDoc 块合并为 /** 内联续行式（rescanRowHeights / remeasureVisibleRows / remeasureRow），描述文字逐字保留
- src/components/table/ex/geometry/row-geometry.js 453→452（−1）：文件头消费方旧名 painter / interactions / editor 更新为现状 table-paint / interaction / editing（B4 拆分后目录名）；graphicItem 分支注释 2→1 行（完整公式与同源警告保留在 flat 判定处）
- src/components/table/ex/geometry/layout.js 341→339（−2）：RESIZE_HANDLE 删数值复述「距列缘 <= 4px」；TYPE_DEFAULT_WIDTHS 注释 5→4 行（删首句复述变量名、合并回退表述）；solveWidths 注释 5→4 行（删与 TYPE_DEFAULT_WIDTHS 重复的定宽链字面复述）；resolveTypeMinWidth 注释旧目录名 interactions.resolveResizeWidth → interaction/resolveResizeWidth（B4）
- 合计 1246→1237（−9 行）；精简注释 8 处，其中 2 处为旧引用更新为现状

## 偏离
无

## 保留的契约注释（逐字未动）
- controller：模块头 mode/scanSignature/measureSignature 三维度口径、recordsVersion 唯一通知通道与缓存条目 { height, indent, recordsVersion }、表级估高短路整段注释（resolveForRelayout 内）、锚定补偿不变量、@param deps getter 清单、@returns scanCount/rebuild
- row-geometry：computeRowHeights/ensureRowMeasured JSDoc（spans 分层口径）、flat 免取值 fast path 与「判定与 rowHeightOf/rowMetricsOf 同源」警告、valueOf 与 resolveCellContent 同源、linkItemCountOf 三路径共用、isEntryColumn 导出别名收敛来源、computeAnchorShift 锚定口径、visibleRange 浮点差口径
- layout：solveWidths remain 摊派口径、findResizeColumn 命中口径、relayout 纯函数边界、computeViewCols 窗口口径、enum 废弃兼容条目
- @host-* 注解：本批 3 文件 grep 确认无此类注解，无保留对象
- 2 处 eslint-disable-next-line complexity 及其说明行逐字保留

## 死代码存疑清单
无：grep 确认 3 文件无注释掉的死代码块

## 自检
- 改前基线 eslint（/d/npm/global/eslint 三文件）退出码 0；改后同令退出码 0，零新错
- 9 处 Edit 的 old/new 中代码行逐字相同，仅注释行增删改；三文件文件头一句话职责行均保留
- 未跑 build（派发指定终验统一做）

## 遗留
- git diff 含此前批次未提交改动（B2 ctx→deps 等），非本批产生；本批仅动注释行
- cell-paint 不消费 rowGeometry（grep 验证），row-geometry 文件头消费方清单按现状未列 cell-paint
