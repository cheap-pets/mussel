# table-ex 编辑格按钮门控：editingCell + committedEditCell 双快照

## 结论

- 编辑格自身的 cell-button（hover 按钮区）在编辑会话期间不绘制、不可触发；门控须双层快照，仅判 `editingCell` 会漏 commit 时序。
- 绘制门控：`paintCellButton` 首行 `isSamePoint(state.editingCell, hover)`；`paintState.editingCell` 每次绘制前经 syncPaintState 同步（use-paint-state.js）。
- 命中门控：`isCellButtonHit` 前置两道 `isEditingCell` 谓词：
  - `editingCell`（壳 editingCellRef 快照）——覆盖 watcher 未 flush 的路径；
  - `committedEditCell`——本手势 pointerdown 在 commit 前求值的被编辑格快照，覆盖 watcher 已在 pointerdown 与 click 之间清空 editingCellRef 的路径。
- committedEditCell 链：`resolvePointerdown({ editingCell })` 返回 `committedEditCell`（hit-test.js）→ `usePointer.onPointerDown` 存闭包 → host 键 `getCommittedEditCell` → `tryCellButtonClick` 消费；每次 pointerdown 重置，无跨手势残留。
- 合并格：hover/click 命中均经 resolveSpanCell 归一为锚格坐标，与 editingCell（锚格）同口径比较。

## 来源

- src/components/table/ex/interaction/hit-test.js、composables/use-pointer.js、composables/use-cell-click.js、table-paint/paint-overlay.js（2026-11-08 cell-button 任务实施记录 agent-docs/plans/20261108-cell-button/04-impl.md）

## 注意

- 根因时序：编辑格 pointerdown 先 `editor.commit()`（editingCellRef 随之清空）再走 click 决策链；watcher flush 时机不定，单一 editingCell 判定会在微任务间隙放行按钮点击。
- 改动 hit-test 交互门控或 resolvePointerdown 返回形状时，须同批同步 demo self-checks/interactions.js 的断言（按返回键形状逐键断言）。
