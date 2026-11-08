# 实施记录（注释精简 · 批6）

## 改动文件
- src/components/table/ex/composables/use-cell-tooltip.js 198→198（±0）：1 处过时引用更新为现状——文件头「interactions.resolveTooltipTarget / cell-tooltip.resolveCellTooltip」→「interaction/hit-test.resolveTooltipTarget / cell-paint/cell-tooltip.resolveCellTooltip」（B4 拆分 + B1 后模块路径）
- src/components/table/ex/composables/use-cell-select.js 223→222（−1）：2 处删复述——arrowActionOf JSDoc「带 ctrl/meta/alt 不处理」复述代码，压缩为「箭头组合键放行（组合键语义归浏览器/系统）」；copyActionOf JSDoc「KeyC 组合判定：ctrl/meta 且不带 shift/alt → 复制」整行删除（条件逐字复述 3 行代码，动作语义由 keyActionOf 的「'move' | 'copy' | null 放行」覆盖）
- use-column-resize.js 131 / use-paint-state.js 125 / use-table-api.js 155：未动——通读无过时引用、无复述可删、无同义多行可并（注释均为口径/契约或精确接线描述）
- 合计 832→831（−1 行）；精简注释 3 处（1 处旧引用更新 + 1 处压缩 + 1 处删除）

## 偏离
无

## 保留的契约注释（逐字未动）
- @host-reads/@host-writes/@host-calls：5 文件 3 处含此类块（use-cell-select / use-cell-tooltip / use-column-resize），全部逐字未动；use-paint-state / use-table-api 同样逐字未动
- use-cell-select：创建时序（pre flush 先于 relayout 合并 watch）、isArrowKeyOf「MOVE_DELTAS 同键集」同源警告、「编辑器 owns 键盘（选中与编辑互斥兜底）」、挂摘幂等与「Vue 卸载不会移除手动 addEventListener」、行集/列集清除 watch 口径（recordsVersion 通道不清除）、CLIPBOARD_WARN 降级说明
- use-cell-tooltip：创建时序（先于 useTreeRows）、延时收起 300ms 宽限口径、showCellTooltip 锚点单例与面板 ready 口径、hideTooltip/delayHideCellTooltip 的 isAnchorIn 守卫语义差
- use-column-resize：widthOverrides 不写回 props、move 不重跑求解、minWidth 链口径（col.minWidth > 类型最小宽 > 40）、up emit→relayout 瓜分说明
- use-paint-state：paintState 生命周期、hoverMode none 总开关归一、invalidate immediate 不变式
- use-table-api：rowGeometry.topAt 口径、选中横带脏区与覆盖行 dev 警告、getCellRect playwright 换算用途
- JSDoc @param/@returns 结构 3 处全保留

## 死代码存疑清单
无：通读确认 5 文件无注释掉的死代码块

## 自检
- eslint（/d/npm/global/eslint use-cell-select.js use-cell-tooltip.js）退出码 0，零新错；未触碰文件未跑（未改动）
- 3 处 Edit 的 old/new 均为纯注释行，代码 token / 字符串 / 结构零变更；@host-* 块不在任何 Edit 范围内
- 未跑 build（派发指定终验统一做）；未改自检、scripts/，未 commit

## 遗留
- git diff 含此前批次未提交改动，非本批产生；本批仅动上述 3 处注释行
