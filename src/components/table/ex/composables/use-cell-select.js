/**
 * 单元格选中壳编排 composable：selectCell / clearCellSelection（span 归一 +
 * prev/next 格 invalidate）+ document 级 keydown 挂摘（选中存在时挂、清除即摘，
 * 不触碰焦点链）+ Ctrl+C 复制（navigator.clipboard.writeText，失败 devWarn 降级）
 * + 方向键移动（clamp + 自动滚动）+ 行集/列集引用变化清除 watch + onUnmounted 摘除。
 *
 * 创建时序：须在 usePointer 之后、useRelayout 之前——清除 watch 的 pre flush
 * 先于 relayout 合并 watch（Vue pre watcher 按创建 id 排序），同 tick 先清旧
 * 选中格再整幅重绘，避免 relayout 帧残留选中描边；成员一律运行时经 host.<key>
 * 读取（setup 期不解构）。
 */
/**
 * host 消费面声明（供依赖审计 grep；「壳」= table-ex.vue host 字面量成员）
 * @host-reads props, scrollEl, layout, wiredColumns, displayRows, spans,
 *   selectedCell, editor（消费 state.editing）
 * @host-writes selectCell, clearCellSelection
 * @host-calls invalidate（提供方 use-paint-state）
 */
import { onUnmounted, watch } from 'vue'

import { warn } from '@/utils/warn'
import { resolveSpanCell } from '../spans/spans'
import { resolveCellCopyText, resolveSelectionMove, resolveSelectionScroll } from '../interaction/cell-selection'

/** 剪贴板写入失败提示（warn once 去重，文案固定串；非安全上下文/无焦点环境降级） */
const CLIPBOARD_WARN =
  '单元格复制未写入剪贴板：navigator.clipboard 不可用或写入被拒绝（不影响选中与方向键移动）'

function devWarnClipboard () {
  warn({ component: 'table-ex', message: CLIPBOARD_WARN })
}

/**
 * @param {Object} host host 袋（消费面见文件头 @host-* 声明）
 * @returns {{ selectCell, clearCellSelection }}
 */
export function useCellSelect (host) {
  /** 锚格坐标归一（合并区域命中 → 主格；无效命中 → null）。选中/移动一律存锚格 */
  function anchorOf (row, col) {
    const anchor = resolveSpanCell(host.spans.value, { rowIndex: row, colIndex: col })

    return anchor && anchor.rowIndex >= 0 && anchor.colIndex >= 0
      ? { row: anchor.rowIndex, col: anchor.colIndex }
      : null
  }

  /** 置选中（点击唯一入口）：合并区域命中归一到锚格坐标；与当前相同幂等返回；
      先置值再对 prev/next 各失效（syncPaintState 原地同步，合并区域由 painter
      脏区扩展到区域包围盒） */
  function selectCell (row, col) {
    const next = anchorOf(row, col)

    if (!next) return

    const prev = host.selectedCell.value

    if (prev && prev.row === next.row && prev.col === next.col) return

    host.selectedCell.value = next

    if (prev) host.invalidate({ cell: prev })
    host.invalidate({ cell: next })
  }

  /** 清除选中（有值才清）：先置空再失效旧格（重绘即去掉描边） */
  function clearCellSelection () {
    const prev = host.selectedCell.value

    if (!prev) return

    host.selectedCell.value = null
    host.invalidate({ cell: prev })
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

  /** 箭头组合键放行（组合键语义归浏览器/系统） */
  function arrowActionOf (event) {
    return event.ctrlKey || event.metaKey || event.altKey ? null : 'move'
  }

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
    if (!host.selectedCell.value) return

    // 编辑器 owns 键盘（选中与编辑互斥的兜底）
    if (host.editor.state.editing) return
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

  watch(host.selectedCell, value => (value ? attach() : detach()))
  onUnmounted(detach)

  /** Ctrl+C 复制选中格：resolveCellCopyText 为 null（图形列/空内容）不动剪贴板；
      clipboard 缺失或 writeText reject → devWarn once 降级 */
  function copySelection () {
    const cur = host.selectedCell.value

    if (!cur) return

    const text = resolveCellCopyText({
      columns: host.wiredColumns.value,
      rows: host.displayRows.value,
      row: cur.row,
      col: cur.col,
      recordsOffset: host.props.recordsOffset
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
    const cur = host.selectedCell.value
    const base = host.layout.value

    if (!cur || !base) return

    const el = host.scrollEl.value
    const live = el ? { ...base, scrollTop: el.scrollTop, scrollLeft: el.scrollLeft } : base

    const moved = resolveSelectionMove({
      row: cur.row,
      col: cur.col,
      key,
      rowCount: host.displayRows.value?.length ?? 0,
      colCount: host.wiredColumns.value?.length ?? 0
    })

    if (!moved) return

    const next = anchorOf(moved.row, moved.col)

    if (!next) return
    if (next.row === cur.row && next.col === cur.col) return

    selectCell(next.row, next.col)
    applySelectionScroll(el, resolveSelectionScroll(live, next.row, next.col))
  }

  // 行集/列集引用变化清除：records 替换/排序/树展开收起/懒加载回填、列集变化；
  // 就地改值走 recordsVersion 通道不改引用，不清除。非 immediate——setup 期
  // 不触达 invalidate（painter 为 null 时 invalidate 返回 false 亦安全）
  watch([host.displayRows, host.wiredColumns], () => clearCellSelection())

  return {
    selectCell,
    clearCellSelection
  }
}
