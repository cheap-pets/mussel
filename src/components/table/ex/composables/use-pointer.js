/**
 * 指针交互 composable（C1 壳拆分自 table-ex.vue；02-design.md A5；
 * 决策函数来自 interactions.js，本 composable 执行状态更新与光标切换；
 * clickGuard/startResize 来自 use-column-resize 经 host 转发）。
 */
/**
 * host 消费面声明（O2，供依赖审计 grep；「壳」= table-ex.vue host 字面量成员）
 * @host-reads props, canvasEl, layout, wiredColumns, spans, paintState, hover,
 *   hoverItem, cursor
 * @host-writes hitAt, onPointerMove, onPointerLeave, onPointerDown
 * @host-calls getThemeWatcher（壳）, cellEditableOf（壳）, isTooltipEnabled（壳）,
 *   editor.state / editor.commit（壳 editor 控制器）, syncPaintState / invalidate
 *   （提供方 use-paint-state）, scheduleCellTooltip / delayHideCellTooltip /
 *   hideCellTooltip（提供方 use-cell-tooltip）, startResize
 *   （提供方 use-column-resize）
 */
import { resolveCursor, hitTest, resolveItemClick, resolvePointerdown } from '../interaction/interactions'
import { resolveSpanCell, regionAt } from '../spans/spans'
import { isEditButtonHit } from '../interaction/edit-button'
import { isSamePoint } from '../shared/cell-identity'

/**
 * @param {Object} host host 袋（读取 canvasEl, props, layout, wiredColumns,
 *   flatRows, spans, getThemeWatcher, cellEditableOf, paintState, syncPaintState,
 *   hover, hoverItem, cursor, invalidate, editor, hideCellTooltip,
 *   delayHideCellTooltip, scheduleCellTooltip, isTooltipEnabled, startResize）
 * @returns {{ hitAt, onPointerMove, onPointerLeave, onPointerDown }}
 */
export function usePointer (host) {
  const { props } = host

  function pointOf (event) {
    const rect = host.canvasEl.value.getBoundingClientRect()

    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function hitAt (event) {
    const cur = host.layout.value

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
      columns: host.wiredColumns.value,
      fixedLeftColumns: cur.fixedCount,
      resizable: props.resizable,
      cellPadding: host.getThemeWatcher()?.snapshot?.cellPadding
    })

    // 合并命中归一（§5.4 单一接入点）：covered 格 → 主格坐标（浅拷贝仅改
    // rowIndex/colIndex，cellX/x/y 原样）。归一后 hit 供 resolveCursor /
    // updateHover / updateHoverItem / applyItemCursor / isEditButtonHit /
    // tryEditButtonClick / finishCellClick / openEditorAt / resolveItemClick；
    // rawHit 供 resolveTreeToggle（树槽判定用原始 hit，树列不参与归一改写）
    return {
      point: { x, y },
      hit: resolveSpanCell(host.spans.value, raw),
      rawHit: raw
    }
  }

  /** hover 命中 → 高亮格坐标（表头 / 越界 / 无命中均不高亮；R5：列宽总和小于
      表格宽时，行有效但 x 越出列区右缘的空白延伸区放行为行级 hover，
      colIndex 保持 -1 —— 行带高亮至末列右缘（追加轮 2 需求 B 绘制 cap 后口径）、
      列高亮/编辑描边/树箭头按 col 无效跳过） */
  function hoverCellOf (hit) {
    if (!hit || hit.isHeader || hit.rowIndex < 0) return null
    if (hit.colIndex >= 0 || hit.beyondCols) return { row: hit.rowIndex, col: hit.colIndex }

    return null
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

  /** 列带脏区（合并扩展，20261106-ex-fixed-select-hover-span 缺陷 2）：column/cross
      模式 hover 格落在 colspan 区域时失效区间扩为区域 [colFrom, colTo)——列带绘制
      x/宽随区域扩展后，prev/next 变更须覆盖区域全部列，否则跨列区域高亮残影；
      无区域回退单列 [col, col+1)（col < 0 跳过，R5 空白延伸区放行语义不变），按
      区间去重（prev/next 同区域至多一次失效） */
  function colBandRegionsOf (active, cells, spans) {
    const regions = []

    if (!active) return regions

    const seen = new Set()

    for (const cell of cells) {
      if (cell == null || cell.col == null || cell.col < 0) continue

      const region = regionAt(spans, cell.row, cell.col)
      const band = region ? [region.colFrom, region.colTo] : [cell.col, cell.col + 1]
      const key = band.join(',')

      if (seen.has(key)) continue

      seen.add(key)
      regions.push({ cols: band })
    }

    return regions
  }

  /** hover 变化脏区（A3）：row/column/cross 为带、cell 为格、none 为空。
      列带合并扩展见 colBandRegionsOf；row/cross 行带与 cell 模式不变（行带脏区
      经 painter prepareSpansRegion 对 {rows} 的既有区域并集扩展覆盖，cell 经
      {cell} 归一扩展） */
  function hoverRegions (prev, next, mode, spans) {
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
      ...colBandRegionsOf(mode === 'column' || cross, [prev, next], spans)
    ]
  }

  function updateHover (hit) {
    const next = hoverCellOf(hit)
    const prev = host.hover.value

    if (isSamePoint(prev, next)) return

    host.hover.value = next
    host.syncPaintState()

    // hover 变化仅脏带重绘（A3）：行带/列带/单格。prev/next 同行（同行内横移、
    // row/cross 模式）或同列时脏带完全重合，按行列号去重后各区域至多一次同步
    // 应用（N1，复核 2026-10-26：同行横移 2 次 → 1 次）
    for (const region of hoverRegions(prev, next, props.hoverMode || 'row', host.spans.value)) host.invalidate(region)
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
    const prev = host.hoverItem.value
    const next = props.hoverMode === 'none'
      ? null
      : resolveItemClick({ hit, itemHits: host.paintState.itemHits })

    if (isSameHoverItem(prev, next)) return

    host.hoverItem.value = next
    host.paintState.hoverItem = next

    for (const cell of hoverItemCells(prev, next)) host.invalidate({ cell })
  }

  /** 光标覆盖（问题 5/7）：resolveCursor 结果之后追加判定，仅覆盖表体
      text/default——条目（link/button 且非禁用）与编辑按钮区为 pointer；
      link 条目以 item.link !== false 门控（list 非 link 列条目无指针反馈，
      R1 列级语义，与 isLinkEntryHovered 同谓词）；col-resize 手柄与表头
      pointer 不覆盖 */
  function applyItemCursor (hit) {
    if (hit.resizeCol >= 0 || hit.isHeader) return

    const item = host.hoverItem.value

    if (item && !item.disabled && item.link !== false &&
      (item.kind === 'link' || item.kind === 'button')) {
      host.cursor.value = 'pointer'

      return
    }

    const col = hit.colIndex >= 0 ? host.wiredColumns.value[hit.colIndex] : null

    if (
      isEditButtonHit(hit, col, {
        layout: host.layout.value,
        spans: host.spans.value,
        snapshot: host.getThemeWatcher()?.snapshot
      })
    ) {
      host.cursor.value = 'pointer'
    }
  }

  function onPointerMove (event) {
    const result = hitAt(event)

    if (!result) return

    // hover 感知（A5.3 / 评审 6 P3）：context 提供树槽 pointer 与可编辑格 text 判定
    host.cursor.value = resolveCursor(result.hit, host.wiredColumns.value, {
      flatInfo: host.flatRows.value,
      editable: props.editable,
      isCellEditableFn: host.cellEditableOf
    })

    updateHoverItem(result.hit)
    updateHover(result.hit)

    // 光标覆盖（问题 5/7）：resolveCursor 结果先落位，条目 / 编辑按钮区再覆盖
    applyItemCursor(result.hit)

    // tooltip 调度（title 列协议）：格身份去重 + TOOLTIP_SHOW_DELAY 延迟，move 内不求值内容
    if (host.isTooltipEnabled()) host.scheduleCellTooltip(result.hit)
  }

  function onPointerLeave () {
    host.cursor.value = 'default'
    updateHoverItem(null)
    updateHover(null)

    // tooltip：清调度与去重键；面板仍归属本组件锚点时延迟收起（isAnchorIn
    // 守卫，不误杀他组件 tooltip——面板经 tooltipController.delayHide 延迟收起）
    host.delayHideCellTooltip()
  }

  function onPointerDown (event) {
    const result = hitAt(event)

    if (!result) return

    const decision = resolvePointerdown({ editing: host.editor.state.editing, hit: result.hit })

    // editing 中画布 pointerdown 先同步提交再续行命中（A6 画布侧隔离：
    // 点击其他单元格一步完成「提交 + 选中新行」）
    if (decision.commitEditing) host.editor.commit()

    // 拖拽收起 tooltip（状态失效类：手柄拖宽即列几何失效，去重键同步清空）
    if (decision.startResize) {
      host.hideCellTooltip()
      host.startResize(event, result.hit)
    }
  }

  return {
    hitAt,
    onPointerMove,
    onPointerLeave,
    onPointerDown
  }
}
