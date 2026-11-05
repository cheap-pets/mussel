/**
 * painter 持久 state 组装与重绘入口 composable（C1 壳拆分自 table-ex.vue）。
 *
 * paintState 持久状态（G2-a 契约：原地变更后 invalidate/draw 即以新状态重绘；
 * 组装扩展 A2.1/A2.2：displayRows/flatInfo/expandedKeys/editable/
 * isCellEditableFn/measure/wrapCache/itemHits）+ syncPaintState / redraw /
 * invalidate / invalidateRow 四个壳级重绘入口。
 */
/**
 * @param {Object} ctx host 袋（读取 props, emit, displayRows, flatRows, spans,
 *   treeExpanded, wiredColumns, getMeasure, getWrapCache, selectedKey, hover,
 *   hoverItem, getEditingCellRef, resizeGuideX, getThemeWatcher, cellEditableOf,
 *   resolveRecordKey, getPainter）
 * @returns {{ paintState, syncPaintState, redraw, invalidate, invalidateRow }}
 */
export function usePaintState (ctx) {
  const { props, emit } = ctx

  const itemHits = new Map()

  const paintState = {
    dpr: 1,
    layout: null,
    theme: null,
    records: props.records,
    displayRows: null,
    flatInfo: null,
    expandedKeys: null,
    spans: null,
    editable: props.editable,
    isCellEditableFn: null,
    measure: null,
    wrapCache: null,
    itemHits,
    columns: [],
    recordsOffset: props.recordsOffset,
    emit,
    keyField: props.keyField,
    getRecordKey: (record, row) => ctx.resolveRecordKey(record),
    selectedKey: null,
    headerChecked: props.headerChecked,
    gridlines: props.gridlines,
    hoverMode: props.hoverMode,
    striped: props.striped,
    orderBy: props.orderBy,
    placeholder: props.placeholder,
    hover: null,
    hoverItem: null,
    editingCell: null,
    resizeGuideX: null
  }

  function syncPaintState () {
    paintState.layout = ctx.layout.value
    paintState.records = props.records
    paintState.displayRows = ctx.displayRows.value
    paintState.flatInfo = ctx.flatRows.value
      ? {
          levels: ctx.flatRows.value.levels,
          hasChildren: ctx.flatRows.value.hasChildren,
          parentKeys: ctx.flatRows.value.parentKeys,
          expandable: ctx.flatRows.value.expandable
        }
      : null
    paintState.spans = ctx.spans.value
    paintState.expandedKeys = props.tree ? ctx.treeExpanded.value : null
    paintState.editable = props.editable
    paintState.isCellEditableFn = ctx.cellEditableOf
    paintState.measure = ctx.getMeasure()
    paintState.wrapCache = ctx.getWrapCache()
    paintState.columns = ctx.wiredColumns.value
    paintState.recordsOffset = props.recordsOffset
    paintState.keyField = props.keyField
    paintState.selectedKey = ctx.selectedKey.value
    paintState.headerChecked = props.headerChecked
    paintState.gridlines = props.gridlines
    paintState.hoverMode = props.hoverMode
    paintState.striped = props.striped
    paintState.orderBy = props.orderBy
    paintState.placeholder = props.placeholder
    paintState.hover = ctx.hover.value
    // 条目悬停（问题 7）+ veil 编辑格（问题 6）。hoverMode none 总开关归一：
    // 条目 hover 色在表体 pass（drawCell）绘制，不经 paintOverlay 的 hoverMode
    // 门控，切到 none 后（指针不动）须由本处立即置 null
    paintState.hoverItem = props.hoverMode === 'none' ? null : ctx.hoverItem.value
    paintState.editingCell = ctx.getEditingCellRef()
    paintState.resizeGuideX = ctx.resizeGuideX.value
    paintState.theme = ctx.getThemeWatcher()?.snapshot ?? paintState.theme
  }

  function redraw () {
    syncPaintState()
    ctx.getPainter()?.draw(paintState)
  }

  // 脏区重绘一律 immediate：painter 的 rAF 队列 apply 的是上次绘制时的 state 浅拷贝，
  // 本壳以持久 state 原地变更后必须同步应用才能以新状态重绘（G2-a invalidate 契约）；
  // 同帧多次调用各自独立应用，范围即脏带本身
  function invalidate (region) {
    syncPaintState()

    return ctx.getPainter()?.invalidate(region, { state: paintState, immediate: true }) ?? false
  }

  function invalidateRow (row) {
    syncPaintState()

    return ctx.getPainter()?.invalidateRow(row, { state: paintState, immediate: true }) ?? false
  }

  return {
    paintState,
    syncPaintState,
    redraw,
    invalidate,
    invalidateRow
  }
}
