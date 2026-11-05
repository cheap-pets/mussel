# 交叉回应（r=1，designer 最终修订）

## 交叉回应（第 1 轮）

| # / 位置 | 结论 | 修改说明或理由证据 |
|---|---|---|
| 1（demo 自检文件同步） | 接受 | 夹具复核成立：painter.js:89 colLefts [0,60,200,300,...]，:901 采样 (300,50) = 被 hover 金额列左缘、:905 (60,50) = 被 hover 名称列左缘；期望 row0Band=blend(hoverBg 0.04, bgNormal)≈(245,245,245) vs 实际 THEME.borderColorSoft=(232,236,241)（painter.js:51），容差 2 恒败。改动清单末行保留。台账中「src/colors.js gray4=#c9cdd1」字面值有误（gray4 为 generateNeutralPalette 运行时生成，src/colors.js:50-53，非字面量），但不影响结论——断言均用 THEME.borderColorSoft 符号量 |
| 2（自检同步约定 + 谓词钉死） | 接受 | 谓词与 paintHoverEditorStroke 条件（paint-overlay.js:87-91 + editor-resolve.js:29-37）严格互补核对成立；editable=false 全格灰（blue=false）与 :905 夹具互证。终版仅补全「其余不受影响」枚举（见收敛 ①） |
| 3（strokeRectOf 口径） | 接受 | editorRectOf 只内缩 top/right（editor.js:61-71）、editorGridlineFlagsOf :78-90，四缘采样式左 x/上 y+ti/右 x+w−1−ri/下 y+h−1 复核成立；strokeRect 半像素覆盖像素行核对（先例 painter.js:877-885） |
| 4（enum 列走键盘） | 接受 | 等级列 col 9 `editable: true, editor: true`（main-view.vue:476-484）、demo `editable = ref(true)`（:1012）；且 'check' ∈ NON_EDITABLE_TYPES（editor-resolve.js:8）→ click (0,0) 走 else 分支选中，脚本路径自洽 |
| 5（4a 旧格消失断言） | 接受 | 脚本 A5 `!hasBorder(0,2,BLUE)` 已含；prev 格 invalidate 链（契约 selectCell）支撑 |
| 6（A0 首段 + 表头清除 col 5） | 接受 | col 2/3/4 sortable、col 5 金额无 sortable（main-view.vue:425/:431/:443/:449）核对成立；`location.reload()` 在 `Runtime.evaluate` async 上下文不可用，判断正确 |
| 7（4d A6b/A6c） | 接受 | fixedLeftInput 为 ref（main-view.vue:1018），setupState 直替成立；few=3 行（:1041）、默认 17 列末列 16（createDefaultColumns 全列数，perfColumn 默认关 :1076）。终版修正行号引用（收敛 ②） |
| 8（writeText 包装捕获） | 接受 | headless 无 document focus 时 writeText reject 为平台事实；包装法同证「图形列零写入」，且生产侧 reject→devWarn 降级路径（风险 8）闭环 |
| 9（附录 A 可执行脚本） | 接受 | 就绪门（__canvasTable→defineExpose getLayoutInfo/getThemeSnapshot/getCellRect，table-ex.vue:441-446、main-view.vue:352）、自检面板默认渲染（main-view.vue:262-276）、事件日志选择器（:315）核对成立。终版补 node 侧片键集过滤钩子（收敛 ③），否则片 1/2 运行全脚本必因未实现键退出 1，与步骤文字矛盾 |
| 10（类型清单前置） | 接受 | CheckColumn compile 产 items[0].text='✓'（src/components/table/column-types/check.js:10-21），只靠 items 分支必复制 '✓'；伪代码顺序保留 |
| 11（绝对式公式 + fixedWidth/viewH） | 接受 | layout 产物含 fixedWidth（layout.js:318/:328）、viewH（:319/:338）、stickyWidth=containerWidth（:334），公式字段全部实存；rowGeometry.topAt/heightAt（spans.js:187/:215 同源）可用 |
| 12（幂等挂摘 + live scroll） | 接受 | scroll 经 rAF 合帧（use-relayout.js:133-137/:154-155），连按 keydown 间 layout 滚动值确实滞后；live 快照取 `el.scrollTop/scrollLeft` 实时值正确。9.5 可读键逐项核对（步骤 0/2/6/7 + spans :325）与 table-ex.vue 实序一致 |
| 13（行锚 + 分片键集 + 集成复核） | 接受 | 全部行锚复核通过：table-ex.vue :184/:220-277/:86-92/:385/:84-85、use-paint-state.js :50/:87、use-cell-click.js :130/:137/:155-159、use-table-api.js :80-90/JSDoc :10-13、painter.js 脏区扩展 :324-333；interactions.js 438 行、paint-overlay.js 181 行（wc -l 实测） |
| 14（非实质） | — | 无需回应；前置门可执行、decisions.md 标注、行号修正均确认 |

未解决异议（累计）：无，无需回应。

## 终版收敛（designer 补充，均不改变 peer 结论）

1. 「遵循约定」自检同步条：其余不受影响的 hover 态绘制位枚举补全（原仅列 4 处，全量 grep 共 10 处不受影响：:517/:528/:533/:875/:895/:908/:961/:967/:1238/:1242，含 peer 未点名的 :961/:967 树箭头用例——其采样区距格缘 ≥3px，已核对不受灰描边影响）。
2. `fixedLeftInput` 行号修正：:1014 → main-view.vue:1018（附录 A6b 注释 + 附录尾注两处）。
3. 附录 A node 脚本补 `SLICE_KEYS` 片键集过滤与 `out.ready === false` 快速失败；片 1/片 2 步骤文字改为显式引用 `SLICE_KEYS`（消除「步骤要求过滤、脚本无钩子」矛盾）。
4. 脚本 A6 补滚动零增量断言（对齐测试计划 4b「无滚动增量」文字）。
