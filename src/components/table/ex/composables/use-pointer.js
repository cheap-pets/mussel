/**
 * 指针交互 composable（C1 壳拆分自 table-ex.vue；02-design.md A5；
 * 决策函数来自 interactions.js，本 composable 执行状态更新与光标切换；
 * clickGuard/startResize 来自 use-column-resize 经 host 转发）。
 */
import { resolveCursor, hitTest, resolveItemClick, resolvePointerdown } from '../interaction/interactions'
import { resolveSpanCell } from '../spans/spans'
import { isEditButtonHit } from '../interaction/edit-button'

/**
 * @param {Object} ctx host 袋（读取 canvasEl, props, layout, wiredColumns,
 *   flatRows, spans, getThemeWatcher, cellEditableOf, paintState, syncPaintState,
 *   hover, hoverItem, cursor, invalidate, editor, hideCellTooltip,
 *   delayHideCellTooltip, scheduleCellTooltip, isTooltipEnabled, startResize）
 * @returns {{ hitAt, onPointerMove, onPointerLeave, onPointerDown }}
 */
export function usePointer (ctx) {
  const { props } = ctx

  function pointOf (event) {
    const rect = ctx.canvasEl.value.getBoundingClientRect()

    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function hitAt (event) {
    const cur = ctx.layout.value

    if (!cur) return null

    const { x, y } = pointOf(event)
    const raw = hitTest({
      x,
      y,
      headHeight: cur.headHeight,
      scrollTop: cur.scrollTop,
      scrollLeft: cur.scrollLeft,
      colLefts: cur.colLefts,
      colWidths: cur.colWidths,
      rowGeometry: cur.rowGeometry,
      columns: ctx.wiredColumns.value,
      fixedLeftColumns: cur.fixedCount,
      resizable: props.resizable,
      cellPadding: ctx.getThemeWatcher()?.snapshot?.cellPadding
    })

    // 合并命中归一（§5.4 单一接入点）：covered 格 → 主格坐标（浅拷贝仅改
    // rowIndex/colIndex，cellX/x/y 原样）。归一后 hit 供 resolveCursor /
    // updateHover / updateHoverItem / applyItemCursor / isEditButtonHit /
    // tryEditButtonClick / finishCellClick / openEditorAt / resolveItemClick；
    // rawHit 供 resolveTreeToggle（树槽判定用原始 hit，树列不参与归一改写）
    return {
      point: { x, y },
      hit: resolveSpanCell(ctx.spans.value, raw),
      rawHit: raw
    }
  }

  /** hover 命中 → 高亮格坐标（表头 / 越界 / 无命中均不高亮；R5：列宽总和小于
      表格宽时，行有效但 x 越出列区右缘的空白延伸区放行为行级 hover，
      colIndex 保持 -1 —— 行带高亮整宽、列高亮/编辑描边/树箭头按 col 无效跳过） */
  function hoverCellOf (hit) {
    if (!hit || hit.isHeader || hit.rowIndex < 0) return null
    if (hit.colIndex >= 0 || hit.beyondCols) return { row: hit.rowIndex, col: hit.colIndex }

    return null
  }

  function isSameHover (prev, next) {
    if (prev == null || next == null) return (prev == null) === (next == null)

    return prev.row === next.row && prev.col === next.col
  }

  /** 行/列带脏区（按行列号去重，prev/next 同带时至多一次；R5：空白区命中
      col = -1 不产生列带） */
  function bandRegionsOf (active, values, key) {
    const regions = []

    if (!active) return regions

    for (const value of new Set(values)) {
      if (value != null && value >= 0) regions.push({ [key]: [value, value + 1] })
    }

    return regions
  }

  /** hover 变化脏区（A3）：row/column/cross 为带、cell 为格、none 为空 */
  function hoverRegions (prev, next, mode) {
    if (mode === 'none') return []

    if (mode === 'cell') {
      const regions = []

      if (prev) regions.push({ cell: prev })
      if (next) regions.push({ cell: next })

      return regions
    }

    const cross = mode === 'cross'

    return [
      ...bandRegionsOf(mode === 'row' || cross, [prev?.row, next?.row], 'rows'),
      ...bandRegionsOf(mode === 'column' || cross, [prev?.col, next?.col], 'cols')
    ]
  }

  function updateHover (hit) {
    const next = hoverCellOf(hit)
    const prev = ctx.hover.value

    if (isSameHover(prev, next)) return

    ctx.hover.value = next
    ctx.syncPaintState()

    // hover 变化仅脏带重绘（A3）：行带/列带/单格。prev/next 同行（同行内横移、
    // row/cross 模式）或同列时脏带完全重合，按行列号去重后各区域至多一次同步
    // 应用（N1，复核 2026-10-26：同行横移 2 次 → 1 次）
    for (const region of hoverRegions(prev, next, props.hoverMode || 'row')) ctx.invalidate(region)
  }

  /** 条目悬停相等判定（问题 7）：行列 + 条目身份（kind/index）+ disabled 全等 */
  function isSameHoverItem (prev, next) {
    if (prev == null || next == null) return (prev == null) === (next == null)

    return (
      prev.row === next.row &&
      prev.col === next.col &&
      prev.kind === next.kind &&
      prev.index === next.index &&
      prev.disabled === next.disabled
    )
  }

  /** hoverItem 变化脏区：prev/next 两格按行列号去重（同格至多一次失效） */
  function hoverItemCells (prev, next) {
    const cells = []

    for (const cell of [prev, next]) {
      if (cell == null) continue

      const { row, col } = cell

      if (!cells.some(el => el.row === row && el.col === col)) cells.push({ row, col })
    }

    return cells
  }

  /** 条目悬停接线（问题 7）：经既有 resolveItemClick 求值，变化时对 prev/next
      格去重逐格失效；独立于 updateHover（同格内条目间移动不触发 hover 变化）；
      hoverMode none 恒 null（与编辑按钮绘制同受总开关抑制） */
  function updateHoverItem (hit) {
    const prev = ctx.hoverItem.value
    const next = props.hoverMode === 'none'
      ? null
      : resolveItemClick({ hit, itemHits: ctx.paintState.itemHits })

    if (isSameHoverItem(prev, next)) return

    ctx.hoverItem.value = next
    ctx.paintState.hoverItem = next

    for (const cell of hoverItemCells(prev, next)) ctx.invalidate({ cell })
  }

  /** 光标覆盖（问题 5/7）：resolveCursor 结果之后追加判定，仅覆盖表体
      text/default——条目（link/button 且非禁用）与编辑按钮区为 pointer；
      link 条目以 item.link !== false 门控（list 非 link 列条目无指针反馈，
      R1 列级语义，与 isLinkEntryHovered 同谓词）；col-resize 手柄与表头
      pointer 不覆盖 */
  function applyItemCursor (hit) {
    if (hit.resizeCol >= 0 || hit.isHeader) return

    const item = ctx.hoverItem.value

    if (item && !item.disabled && item.link !== false &&
      (item.kind === 'link' || item.kind === 'button')) {
      ctx.cursor.value = 'pointer'

      return
    }

    const col = hit.colIndex >= 0 ? ctx.wiredColumns.value[hit.colIndex] : null

    if (
      isEditButtonHit(hit, col, {
        layout: ctx.layout.value,
        spans: ctx.spans.value,
        snapshot: ctx.getThemeWatcher()?.snapshot
      })
    ) {
      ctx.cursor.value = 'pointer'
    }
  }

  function onPointerMove (event) {
    const result = hitAt(event)

    if (!result) return

    // hover 感知（A5.3 / 评审 6 P3）：context 提供树槽 pointer 与可编辑格 text 判定
    ctx.cursor.value = resolveCursor(result.hit, ctx.wiredColumns.value, {
      flatInfo: ctx.flatRows.value,
      editable: props.editable,
      isCellEditableFn: ctx.cellEditableOf
    })

    updateHoverItem(result.hit)
    updateHover(result.hit)

    // 光标覆盖（问题 5/7）：resolveCursor 结果先落位，条目 / 编辑按钮区再覆盖
    applyItemCursor(result.hit)

    // tooltip 调度（title 列协议）：格身份去重 + TOOLTIP_SHOW_DELAY 延迟，move 内不求值内容
    if (ctx.isTooltipEnabled()) ctx.scheduleCellTooltip(result.hit)
  }

  function onPointerLeave () {
    ctx.cursor.value = 'default'
    updateHoverItem(null)
    updateHover(null)

    // tooltip：清调度与去重键；面板仍归属本组件锚点时延迟收起（isAnchorIn
    // 守卫，不误杀他组件 tooltip——面板经 tooltipController.delayHide 延迟收起）
    ctx.delayHideCellTooltip()
  }

  function onPointerDown (event) {
    const result = hitAt(event)

    if (!result) return

    const decision = resolvePointerdown({ editing: ctx.editor.state.editing, hit: result.hit })

    // editing 中画布 pointerdown 先同步提交再续行命中（A6 画布侧隔离：
    // 点击其他单元格一步完成「提交 + 选中新行」）
    if (decision.commitEditing) ctx.editor.commit()

    // 拖拽收起 tooltip（状态失效类：手柄拖宽即列几何失效，去重键同步清空）
    if (decision.startResize) {
      ctx.hideCellTooltip()
      ctx.startResize(event, result.hit)
    }
  }

  return {
    hitAt,
    onPointerMove,
    onPointerLeave,
    onPointerDown
  }
}
