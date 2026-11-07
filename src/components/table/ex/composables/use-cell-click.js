/**
 * click 单一入口派发 composable：表头/树槽/编辑按钮/条目/选中/check 事件链
 * + 编辑开启（openEditorAt/focusEditor）+ editing veil watch。
 */
/**
 * host 消费面声明（供依赖审计 grep；「壳」= table-ex.vue host 字面量成员）
 * @host-reads emit, props, layout, spans, flatRows, wiredColumns, displayRows,
 *   paintState, selectedKey, editorEl, editor, clickGuard
 * @host-writes onClick
 * @host-calls getThemeWatcher（壳）, resolveRecordKey（壳）, cellEditableOf（壳）,
 *   getEditingCellRef / setEditingCellRef（壳）, getPainter（壳）, editor.open /
 *   editor.state（壳 editor 控制器）, hitAt（提供方 use-pointer）,
 *   applyTreeToggle（提供方 use-tree-rows）, invalidate / invalidateRow
 *   （提供方 use-paint-state）, clearCellSelection / selectCell
 *   （提供方 use-cell-select）, hideCellTooltip（提供方 use-cell-tooltip）
 */
import { nextTick, watch } from 'vue'

import { resolveCellClick, resolveCellClickOpen, resolveHeaderClick, resolveItemClick, resolveTreeToggle } from '../interaction/interactions'
import { regionAt, spanRectOf } from '../spans/spans'
import { computeEditorStyle } from '../editing/editor-geometry'
import { resolveEditorType } from '../editing/editor-resolve'
import { resolveCellContent } from '../cell-paint/cell-content'
import { isEditButtonHit } from '../interaction/edit-button'
import { recordNumberOf } from '../shared/cell-identity'

/**
 * @param {Object} host host 袋（消费面见文件头 @host-* 声明）
 * @returns {{ onClick }}
 */
export function useCellClick (host) {
  const { emit, props } = host

  function runEvents (events) {
    for (const ev of events) emit(ev.name, ...ev.args)
  }

  /** 表头单击：发 header-click / update:header-checked / update:order-by 事件链 */
  function emitHeaderClick (col) {
    if (!col) return

    runEvents(
      resolveHeaderClick({
        column: col,
        headerChecked: props.headerChecked,
        orderBy: props.orderBy
      }).events
    )
  }

  /** 编辑按钮派发（局部交互——对齐树槽先例：不选中行、不发 cell-click、
      不开编辑；走组件 emit 'edit-button-click' 而非属性回调，column 传原始
      列引用）；命中并派发返回 true */
  function tryEditButtonClick (hit, record, col) {
    if (
      !isEditButtonHit(hit, col, {
        layout: host.layout.value,
        spans: host.spans.value,
        snapshot: host.getThemeWatcher()?.snapshot
      })
    ) {
      return false
    }

    emit('edit-button-click', {
      record,
      recordIndex: hit.rowIndex,
      column: col._raw ?? col
    })

    return true
  }

  /** 树箭头槽 toggle（局部交互）：命中则应用展开态并返回 true；
      meta 携带命中行 record/level，作 tree-expand/tree-collapse 载荷 */
  function tryToggleTreeRow (hit, record) {
    if (!props.tree || !host.flatRows.value) return false

    const toggle = resolveTreeToggle({
      hit,
      columns: host.wiredColumns.value,
      flatInfo: host.flatRows.value,
      recordKey: host.resolveRecordKey(record)
    })

    if (toggle) {
      host.applyTreeToggle(toggle.key, {
        record,
        level: host.flatRows.value.levels?.[hit.rowIndex] ?? 0
      })
    }

    return !!toggle
  }

  /** check 列选中态输入（与 drawCheck 同款判定）：disabled/value 从单元格
      items attrs 读取，非 check 列为缺省值 */
  function checkColumnState (col, record, rowIndex) {
    if (col._raw?.type !== 'check') return { disabled: false, value: undefined }

    const content = resolveCellContent(col, {
      record,
      recordNumber: recordNumberOf(props.recordsOffset, rowIndex),
      emit
    })
    const attrs = Array.isArray(content.items) ? content.items[0]?.attrs : null

    return {
      disabled: attrs?.disabled != null && attrs?.disabled !== false,
      value: attrs?.['data-checked'] ?? false
    }
  }

  /** 条目 cell-item-click → 选中/cell-click 事件链 → 单击进编辑 */
  function finishCellClick (hit, record, col) {
    const item = resolveItemClick({ hit, itemHits: host.paintState.itemHits })

    if (item) emitCellItemClick(item, record, col, hit.rowIndex)

    const { disabled, value } = checkColumnState(col, record, hit.rowIndex)
    const { events, toggled } = resolveCellClick({
      record,
      recordIndex: hit.rowIndex,
      column: col,
      recordKey: host.resolveRecordKey(record),
      selectedRecordKey: host.selectedKey.value,
      selectedRecord: props.selectedRecord,
      disabled,
      value
    })

    runEvents(events)

    // check 翻转后 nextTick 重绘该行
    if (toggled) nextTick(() => host.invalidateRow(hit.rowIndex))

    // 先发完整选中/cell-click 链再开编辑，父级一次收到全部事件，选中态与编辑态一致；
    // 可编辑格点击让位编辑态（清除选中），不可编辑格点击置选中（点击是选中唯一入口）
    const { openEditor } = resolveCellClickOpen({ hit, cellEditable: host.cellEditableOf(col) })

    if (openEditor) {
      host.clearCellSelection?.()
      openEditorAt(hit, record, col)
    } else {
      host.selectCell?.(hit.rowIndex, hit.colIndex)
    }
  }

  /** 空白延伸区点击（行有效、x 越出列区右缘）仅选中行——同 resolveCellClick
      的选中事件序（key → record），不发 cell-click（无对应列），check/树槽/
      编辑不适用；点击空白延伸区清除单元格选中 */
  function selectRowOnly (record) {
    host.clearCellSelection?.()

    const recordKey = host.resolveRecordKey(record)

    if (recordKey !== host.selectedKey.value) emit('update:selected-record-key', recordKey)
    if (record !== props.selectedRecord) emit('update:selected-record', record)
  }

  function onClick (event) {
    // 拖拽误触抑制：拖拽后紧随的 click 丢弃
    if (host.clickGuard.consume()) return

    const result = host.hitAt(event)

    if (!result) return

    const { hit, rawHit } = result
    const col = hit.colIndex >= 0 ? host.wiredColumns.value[hit.colIndex] : null

    if (hit.isHeader) {
      // 表头点击清除单元格选中（表头非选中通道）
      host.clearCellSelection?.()
      emitHeaderClick(col)

      return
    }

    const record = host.displayRows.value?.[hit.rowIndex]

    if (record == null) return

    // 空白延伸区命中（beyondCols）无对应列，仅选中行
    if (!col) {
      if (hit.beyondCols) selectRowOnly(record)

      return
    }

    // 编辑按钮命中判定在树槽之前
    if (tryEditButtonClick(hit, record, col)) return

    // 树槽判定消费原始 hit（树列不参与合并归一改写）
    if (tryToggleTreeRow(rawHit, record)) return

    finishCellClick(hit, record, col)
  }

  // cell-item-click 派发（payload 对齐 DOM 版 + recordIndex）：link/tag 经
  // render 产物 events.click 取同源 payload；button（canvas 专属产物，无 DOM
  // events 通道）payload = buttons[index]；disabled 条目只续链不发
  function emitCellItemClick (item, record, col, row) {
    const raw = col._raw ?? col
    const recordNumber = recordNumberOf(props.recordsOffset, row)

    if (item.kind === 'button') {
      emitButtonItemClick(item, record, col, raw, recordNumber, row)

      return
    }

    emitDomItemClick(item, record, col, raw, recordNumber, row)
  }

  function emitButtonItemClick (item, record, col, raw, recordNumber, row) {
    const value = col._value?.(record) ?? (col.field != null ? record?.[col.field] : undefined)
    const produced = col._render?.({ record, recordNumber, value, emit })
    const button = produced?.buttons?.[item.index]

    if (button != null && !isDisabledAttr(button.disabled)) {
      emit('cell-item-click', { record, column: raw, button, recordIndex: row })
    }
  }

  /** link/tag 条目派发：render 产物自持 onItemClick（payload 与 DOM 版
      events.click 同构——常规条目 = 条目对象原引用，linkOption.max dots 的
      payload 值 '...'），外包 recordIndex */
  function emitDomItemClick (item, record, col, raw, recordNumber, row) {
    const wrappedEmit = (name, payload) => {
      if (name === 'cell-item-click') {
        emit('cell-item-click', { ...payload, recordIndex: row })
      } else {
        emit(name, payload)
      }
    }

    const content = resolveCellContent(col, { record, recordNumber, emit: wrappedEmit })
    const items = Array.isArray(content.items) ? content.items : null
    const canvasItem = items?.[item.index]

    if (!canvasItem || isDisabledAttr(canvasItem.disabled)) return

    // canvas 侧 _maxItems 截断省略条目（绘制层 dots，render 产物内无对应条目）：
    // payload 值 '...'；link/list 条目 payload 键统一 item，tag/button 键不变
    if (isCappedDotsItem(item, items, col)) {
      emit('cell-item-click', {
        record,
        column: raw,
        [item.kind === 'link' ? 'item' : item.kind]: '...',
        recordIndex: row
      })
      return
    }

    canvasItem.onItemClick?.()
  }

  /** _maxItems 截断省略条目判定（绘制层 dots；render 内 linkOption.max dots 经
      onItemClick 自持 '...' payload，不在此判） */
  function isCappedDotsItem (item, items, col) {
    const maxItems = col._maxItems ?? 10

    return items.length > maxItems && item.index === maxItems - 1
  }

  /** disabled 存在性判定（与绘制侧 linkTextColorOf 同一谓词） */
  function isDisabledAttr (disabled) {
    return disabled != null && disabled !== false
  }

  /** 单击进编辑：style 按 computeEditorStyle 浮层盒（贴格线内侧，border/编辑器
      类型分支），editorType 判定用开值形态与 _resolveMaxLines(record) 行级求值；
      合并区域：cellRect 经 spanRectOf 取区域矩形（浮层覆盖整个合并区域），
      rowFrom/colTo 供格线内缩按区域外缘判定 */
  function openEditorAt (hit, record, col) {
    // 编辑浮层打开即收起 tooltip（互不干扰：veil 遮蔽编辑格内容，提示无意义）
    host.hideCellTooltip()

    const cur = host.layout.value

    if (!cur) return

    const rawValue =
      col._value?.(record) ??
      (col.field != null ? record?.[col.field] : undefined)

    const editorType = resolveEditorType(col, { rawValue, record })
    const border = isObjectEditor(col.editor) ? col.editor.border !== false : true
    const region = regionAt(host.spans.value, hit.rowIndex, hit.colIndex)

    const editorStyle = computeEditorStyle({
      colIndex: hit.colIndex,
      rowIndex: hit.rowIndex,
      colLefts: cur.colLefts,
      colWidths: cur.colWidths,
      headHeight: cur.headHeight,
      scrollTop: cur.scrollTop,
      scrollLeft: cur.scrollLeft,
      fixedCount: cur.fixedCount,
      rowGeometry: cur.rowGeometry,
      editorType,
      border,
      gridlines: props.gridlines,
      stickyWidth: cur.stickyWidth,
      contentWidth: cur.contentWidth,
      cellRect: spanRectOf(cur, hit.rowIndex, hit.colIndex, host.spans.value),
      rowFrom: region?.rowFrom,
      colTo: region?.colTo
    })

    const opened = host.editor.open({
      column: col,
      record,
      recordIndex: hit.rowIndex,
      editable: props.editable,
      style: toPxStyle(editorStyle),
      bordered: editorStyle.bordered,
      getEditorEl: () => host.editorEl.value
    })

    if (!opened) return

    focusEditor()

    // veil 接线：先更新行列引用再失效——旧格 invalidate 时已不在 veil（恢复
    // 内容），新格 invalidate 置 veil；同一 tick 内「提交旧格 + 打开新格」时
    // 旧格恢复由本处失效直接完成
    const prevCell = host.getEditingCellRef()

    host.setEditingCellRef({ row: hit.rowIndex, col: hit.colIndex })

    if (prevCell) host.invalidate({ cell: prevCell })
    host.invalidate({ cell: host.getEditingCellRef() })
  }

  /** column.editor 为对象形态时读取 border（true 形态按缺省 true） */
  function isObjectEditor (editorConfig) {
    return editorConfig != null && typeof editorConfig === 'object'
  }

  /** 编辑器聚焦：渲染完成后 input/select/date 聚焦内部真实 input，textarea
      聚焦 textarea 元素，switch 聚焦容器。focus() 会把最近的可滚动祖先滚出
      溢出量（浮层相对画布漂移），聚焦后复位浮层容器滚动 */
  function focusEditor () {
    nextTick(() => {
      const el = host.editorEl.value
      const editing = host.editor.state.editing

      if (!el || !editing) return

      if (editing.editorType === 'switch') el.focus()
      else el.querySelector('input, textarea')?.focus()

      const overlay = el.parentElement

      if (overlay) {
        overlay.scrollLeft = 0
        overlay.scrollTop = 0
      }
    })
  }

  /** computeEditorStyle 产出数值；Vue :style 不自动补 px（el.style.left = '624'
      非法被浏览器忽略），此处转 px 串后再入编辑态 */
  function toPxStyle ({ left, top, width, height }) {
    return { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }
  }

  // 编辑关闭 veil 清理：仅 editing 变为 null（关闭）时恢复编辑格内容。commit
  // 与 open 落在同一 tick 时 watcher 只 flush 一次，无条件清除会把新格 veil
  // 抹掉；行列由 editingCellRef 承载，覆盖全部关闭路径
  watch(() => host.editor.state.editing, newValue => {
    if (newValue != null) return

    const cell = host.getEditingCellRef()

    if (cell == null) return

    host.setEditingCellRef(null)

    // 卸载路径空值防护：painter 未创建 / 已 dispose 时无重绘意义
    if (!host.getPainter()) {
      host.paintState.editingCell = null

      return
    }

    host.invalidate({ cell })
  })

  return {
    onClick
  }
}
