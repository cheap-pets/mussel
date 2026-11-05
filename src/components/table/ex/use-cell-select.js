/**
 * 单元格选中壳编排 composable（20261105-table-ex-cell-select；C1 组合式约定）：
 * selectCell / clearCellSelection（span 归一 + prev/next 格 invalidate）+
 * document 级 keydown 挂摘（选中存在时挂、清除即摘，不触碰焦点链）+
 * Ctrl+C 复制（navigator.clipboard.writeText，失败 devWarn 降级）+
 * 方向键移动（clamp + 自动滚动）+ 行集/列集引用变化清除 watch + onUnmounted 摘除。
 *
 * 创建时序（组装步骤 9.5，usePointer 之后、useRelayout 之前）：清除 watch 的 pre
 * flush 先于 relayout 合并 watch（Vue pre watcher 按创建 id 排序），同 tick 先清
 * 旧选中格再整幅重绘，避免 relayout 帧残留选中描边；成员一律运行时经 ctx.<key>
 * 读取（setup 期不解构）。
 */
import { onUnmounted, watch } from 'vue'

import { warn } from '@/utils/warn'
import { resolveSpanCell } from './spans'
import { resolveCellCopyText, resolveSelectionMove, resolveSelectionScroll } from './cell-selection'

/** 剪贴板写入失败提示（warn once 去重，文案固定串；非安全上下文/无焦点环境降级） */
const CLIPBOARD_WARN =
  '单元格复制未写入剪贴板：navigator.clipboard 不可用或写入被拒绝（不影响选中与方向键移动）'

function devWarnClipboard () {
  warn({ component: 'table-ex', message: CLIPBOARD_WARN })
}

/**
 * @param {Object} ctx host 袋（读取 props, scrollEl, layout, wiredColumns,
 *   displayRows, spans, selectedCell, invalidate, editor）
 * @returns {{ selectCell, clearCellSelection }}
 */
export function useCellSelect (ctx) {
  /** 锚格坐标归一（合并区域命中 → 主格；无效命中 → null）。选中/移动一律存锚格 */
  function anchorOf (row, col) {
    const anchor = resolveSpanCell(ctx.spans.value, { rowIndex: row, colIndex: col })

    return anchor && anchor.rowIndex >= 0 && anchor.colIndex >= 0
      ? { row: anchor.rowIndex, col: anchor.colIndex }
      : null
  }

  /** 置选中（点击唯一入口）：合并区域命中归一到锚格坐标（选中一律存锚格）；
      与当前相同幂等返回；先置值再对 prev/next 各失效（syncPaintState 原地同步，
      合并区域由 painter 脏区扩展到区域包围盒） */
  function selectCell (row, col) {
    const next = anchorOf(row, col)

    if (!next) return

    const prev = ctx.selectedCell.value

    if (prev && prev.row === next.row && prev.col === next.col) return

    ctx.selectedCell.value = next

    if (prev) ctx.invalidate({ cell: prev })
    ctx.invalidate({ cell: next })
  }

  /** 清除选中（有值才清）：先置空再失效旧格（重绘即去掉描边） */
  function clearCellSelection () {
    const prev = ctx.selectedCell.value

    if (!prev) return

    ctx.selectedCell.value = null
    ctx.invalidate({ cell: prev })
  }

  // —— document 级 keydown（编辑态/表单控件/已拦截/组合键四重守卫放行） ——

  function isFormTarget (event) {
    const target = event.target

    if (!target) return false

    const tag = String(target.tagName || '').toLowerCase()

    return tag === 'input' || tag === 'textarea' || tag === 'select' ||
      target.isContentEditable === true
  }

  /** 键面箭头判定（resolveSelectionMove MOVE_DELTAS 同键集） */
  function isArrowKeyOf (key) {
    return key === 'ArrowUp' || key === 'ArrowDown' ||
      key === 'ArrowLeft' || key === 'ArrowRight'
  }

  /** 箭头组合键放行判定：带 ctrl/meta/alt 不处理（组合键语义归浏览器/系统） */
  function arrowActionOf (event) {
    return event.ctrlKey || event.metaKey || event.altKey ? null : 'move'
  }

  /** KeyC 组合判定：ctrl/meta 且不带 shift/alt → 复制；其余放行 */
  function copyActionOf (event) {
    const primary = event.ctrlKey || event.metaKey

    return primary && !(event.shiftKey || event.altKey) ? 'copy' : null
  }

  /** 键面 → 动作（'move' | 'copy' | null 放行） */
  function keyActionOf (event, key) {
    if (isArrowKeyOf(key)) return arrowActionOf(event)
    if (event.code === 'KeyC') return copyActionOf(event)

    return null
  }

  function onKeydown (event) {
    if (!ctx.selectedCell.value) return

    // 编辑器 owns 键盘（选中与编辑互斥的兜底）
    if (ctx.editor.state.editing) return
    if (event.defaultPrevented) return
    if (isFormTarget(event)) return

    const action = keyActionOf(event, String(event.key || ''))

    if (!action) return

    event.preventDefault()

    if (action === 'move') moveSelection(String(event.key || ''))
    else copySelection()
  }

  // 挂摘幂等（防同引用重复登记/漏摘）：selectedCell 非空挂、置空摘；卸载兜底
  // 摘除（Vue 卸载不会移除手动 addEventListener）
  const attach = () => {
    document.removeEventListener('keydown', onKeydown)
    document.addEventListener('keydown', onKeydown)
  }
  const detach = () => {
    document.removeEventListener('keydown', onKeydown)
  }

  watch(ctx.selectedCell, value => (value ? attach() : detach()))
  onUnmounted(detach)

  /** Ctrl+C 复制选中格：resolveCellCopyText 为 null（图形列/空内容）不动剪贴板；
      clipboard 缺失或 writeText reject → devWarn once 降级 */
  function copySelection () {
    const cur = ctx.selectedCell.value

    if (!cur) return

    const text = resolveCellCopyText({
      columns: ctx.wiredColumns.value,
      rows: ctx.displayRows.value,
      row: cur.row,
      col: cur.col,
      recordsOffset: ctx.props.recordsOffset
    })

    if (text == null) return

    const clipboard = navigator.clipboard

    if (!clipboard || typeof clipboard.writeText !== 'function') {
      devWarnClipboard()

      return
    }

    Promise.resolve(clipboard.writeText(text)).catch(devWarnClipboard)
  }

  /** 滚动量应用（resolveSelectionScroll 产物逐键赋 scrollEl；缺省键省略不赋） */
  function applySelectionScroll (el, scroll) {
    if (!el || !scroll) return

    if (scroll.scrollTop != null) el.scrollTop = scroll.scrollTop
    if (scroll.scrollLeft != null) el.scrollLeft = scroll.scrollLeft
  }

  /** 方向键移动：clamp 归一（原地即无操作）→ 目标格合并区域归一到锚格（归一后
      与当前相同 = 原地无操作，不失效不滚动）→ selectCell → 可见性滚动量 → 赋
      scrollEl。live 快照取 el 实时 scroll 值（scrollEl 赋值同步可读）——连按
      方向键时 layout 快照的滚动值滞后（recomputeViewWindows 在 scroll rAF），
      会误判「已可见」而不回滚 */
  function moveSelection (key) {
    const cur = ctx.selectedCell.value
    const base = ctx.layout.value

    if (!cur || !base) return

    const el = ctx.scrollEl.value
    const live = el ? { ...base, scrollTop: el.scrollTop, scrollLeft: el.scrollLeft } : base

    const moved = resolveSelectionMove({
      row: cur.row,
      col: cur.col,
      key,
      rowCount: ctx.displayRows.value?.length ?? 0,
      colCount: ctx.wiredColumns.value?.length ?? 0
    })

    if (!moved) return

    // 合并归一（裁定 5）：目标格落在合并区域 → 锚格坐标；与当前相同即原地
    const next = anchorOf(moved.row, moved.col)

    if (!next) return
    if (next.row === cur.row && next.col === cur.col) return

    selectCell(next.row, next.col)
    applySelectionScroll(el, resolveSelectionScroll(live, next.row, next.col))
  }

  // 行集/列集引用变化清除（裁定 4：records 替换/排序/树展开收起/懒加载回填、
  // 列集变化；就地改值走 recordsVersion 通道不改引用，不清除）。非 immediate——
  // setup 期不触达 invalidate（painter 为 null 时 invalidate 返回 false 亦安全）
  watch([ctx.displayRows, ctx.wiredColumns], () => clearCellSelection())

  return {
    selectCell,
    clearCellSelection
  }
}
