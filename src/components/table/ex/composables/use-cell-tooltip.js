/**
 * 单元格 tooltip 壳级编排 composable（title 列协议）。
 *
 * 决策纯函数在 interaction/hit-test.resolveTooltipTarget / cell-paint/cell-tooltip.resolveCellTooltip，
 * 本 composable 持有显示定时器、去重键与合成锚点：pointermove 格身份去重 +
 * TOOLTIP_SHOW_DELAY 延迟调度（move 内不求值内容）；滚动/拖拽/编辑/relayout/
 * 重绘 watch/卸载经 hideCellTooltip 收起并同步清去重键（不清则回到同格被去重
 * 跳过，该格再无 tooltip）。
 *
 * 创建时序：须先于 useTreeRows(host)——其 immediate tree watch 在 setup 期同步
 * 经 host.relayout 触达（前向槽为空实现，运行时链路仍依赖本模块先注册）。
 */
/**
 * host 消费面声明（供依赖审计 grep；「壳」= table-ex.vue host 字面量成员）
 * @host-reads rootEl, props, wiredColumns, flatRows, displayRows, layout, spans,
 *   resizeGuideX, paintState
 * @host-writes tooltipAnchorEl, tooltipController, scheduleCellTooltip,
 *   hideCellTooltip, delayHideCellTooltip
 * @host-calls getThemeWatcher（壳）, getMeasure（壳）, getWrapCache（壳）,
 *   getEditingCellRef（壳）
 */
import { inject, shallowRef } from 'vue'
import { TOOLTIP_SHOW_DELAY } from '@/components/tooltip/tooltip-core'
import { CELL_PADDING_FALLBACK, ROW_TOP_INSET, TREE_INDENT } from '../shared/constants'
import { resolveTooltipTarget } from '../interaction/hit-test'
import { resolveCellTooltip, isAutoTitle } from '../cell-paint/cell-tooltip'
import { regionAt, spanRectOf } from '../spans/spans'
import { isSamePoint, recordNumberOf } from '../shared/cell-identity'

/** plus 感知格身份比较（isSamePoint 单一事实源之上叠加 plus 维度） */
function isSameTooltipCell (a, b) {
  return isSamePoint(a, b) && Boolean(a?.plus) === Boolean(b?.plus)
}

/** +n pill 条目查找（绘制帧携带，每格至多一条） */
function findPlusEntry (itemHits, cell) {
  return itemHits?.get(cell.row)?.get(cell.col)?.find(entry => entry?.kind === 'tag-overflow') ?? null
}

/**
 * @param {Object} host host 袋（消费面见文件头 @host-* 声明）
 * @returns {{ tooltipAnchorEl, tooltipController, scheduleCellTooltip,
 *   hideCellTooltip, delayHideCellTooltip }}
 */
export function useCellTooltip (host) {
  const $mussel = inject('$mussel', null)
  // 控制器缺失（宿主未走完整 install / SSR）→ 优雅降级为无 tooltip（调度短路）
  const tooltipController = $mussel?.tooltip
  const tooltipAnchorEl = shallowRef()
  // 当前去重键 { row, col } | null（格身份比较，isSamePoint 与 hover 同源）
  let tooltipCell = null
  let tooltipShowTimer = 0

  function clearTooltipTimer () {
    clearTimeout(tooltipShowTimer)
    tooltipShowTimer = 0
  }

  /** pointermove 尾部调度：格身份（{row, col}）去重，同格内移动零开销；换格才
      重排定时器。无 tooltip 目标（表头/越界/编辑中/none/title:false 列）→ 延迟收起
      （300ms 宽限，同 v-mu-tooltip mouseleave 语义）；有目标格 → 清面板挂起的 hide 计时器
      （先排定的 hide 会先于 show 触发 = 退出动画 + 再入场闪一次），不主动 hide，
      面板保持可见由下一次 showCellTooltip 写锚点 + updatePosition 重定向 */
  function scheduleCellTooltip (hit) {
    if (!tooltipController) return

    const next = resolveTooltipTarget({
      hit,
      columns: host.wiredColumns.value,
      hoverMode: host.props.hoverMode,
      editingCell: host.getEditingCellRef(),
      resizing: host.resizeGuideX.value != null,
      itemHits: host.paintState.itemHits
    })

    if (isSameTooltipCell(next, tooltipCell)) return

    clearTooltipTimer()
    tooltipCell = next

    if (next == null) {
      if (tooltipController.isAnchorIn(host.rootEl.value)) tooltipController.delayHide()

      return
    }

    tooltipController.clearHideTimer()
    tooltipShowTimer = setTimeout(() => showCellTooltip(next), TOOLTIP_SHOW_DELAY)
  }

  /** 树形列内容区缩进（drawTreeAffordance 同式）：level×16 + 16px 箭头槽；非树列/树关 0 */
  function tooltipTreeInsetOf (col, row) {
    if (!col._isTreeColumn || !host.flatRows.value) return 0

    return (host.flatRows.value.levels?.[row] ?? 0) * TREE_INDENT + TREE_INDENT
  }

  /** tooltip 求值上下文：layout/主题/测量/折行缓存/列/行记录任一缺失 → null（失效）；
      params 按 drawCell box 同式预算内容区宽高（格宽 − padding×2 − 树缩进 /
      格高 − ROW_TOP_INSET），rect = 命中格（合并区域）视口矩形 */
  function tooltipContextOf (cell) {
    const cur = host.layout.value
    const col = host.wiredColumns.value[cell.col]
    const record = host.displayRows.value?.[cell.row]
    const themeWatcher = host.getThemeWatcher()
    const measureFn = host.getMeasure()
    const wrapCacheObj = host.getWrapCache()

    if (!cur || !themeWatcher || !measureFn || !wrapCacheObj || !col || record == null) return null

    const snapshot = themeWatcher.snapshot
    const padding = snapshot?.cellPadding || CELL_PADDING_FALLBACK
    const rect = spanRectOf(cur, cell.row, cell.col, host.spans.value)

    return {
      col,
      rect,
      params: {
        record,
        recordNumber: recordNumberOf(host.props.recordsOffset, cell.row),
        contentWidth: rect.width - padding * 2 - tooltipTreeInsetOf(col, cell.row),
        contentHeight: rect.height - ROW_TOP_INSET,
        regionHeight: regionAt(host.spans.value, cell.row, cell.col) ? rect.height : null,
        theme: snapshot,
        measure: measureFn,
        wrapCache: wrapCacheObj
      }
    }
  }

  /** 命令式写锚点矩形（不经 Vue patch，规避 show 时序耦合） */
  function placeTooltipAnchor (rect) {
    const style = tooltipAnchorEl.value.style

    style.left = `${rect.x}px`
    style.top = `${rect.y}px`
    style.width = `${rect.width}px`
    style.height = `${rect.height}px`
  }

  /** TOOLTIP_SHOW_DELAY 到期：resolveCellTooltip 解析内容与溢出态（复用绘制同源测量
      缓存），命令式定位锚点到命中格视口矩形，show + 显式 updatePosition——
      锚点元素单例复用，state.anchor 引用不变，面板字段 watch 不触发，不显式
      重定位则面板停在上一格；首次 show 面板未 ready 时空转，由面板内部
      runPopupSequence 的 updatePosition 完成定位 */
  function showCellTooltip (cell) {
    if (!tooltipController || !tooltipAnchorEl.value) return
    // 过期守卫：定时器触发时去重键已变化（换格/收起）则放弃本次显示
    if (!isSameTooltipCell(tooltipCell, cell)) return

    const context = tooltipContextOf(cell)

    if (!context) {
      hideTooltip()

      return
    }

    // +n 汇聚 pill（title 协议自动形态专属）：内容 = 绘制帧携带的剩余项全文，
    // 锚点 = pill 视口矩形（canvas 视口坐标，与 spanRectOf 同坐标系）；非自动
    // 形态（false/''/0/自定义）与 pill 条目缺失（数据/几何已变）均落回格级路径
    if (cell.plus && isAutoTitle(context.col.title)) {
      const entry = findPlusEntry(host.paintState.itemHits, cell)

      if (entry?.title) {
        placeTooltipAnchor(entry.rect)
        tooltipController.show(tooltipAnchorEl.value, { content: entry.title, placement: 'top', trigger: 'hover' })
        tooltipController.updatePosition()

        return
      }
    }

    const tip = resolveCellTooltip(context.col, context.params)

    // 无可显示内容（显式关闭 / 无文本源 / 未溢出 / 空串）：收起上一格残留。
    // 只用 hideTooltip 不清 tooltipCell——保留去重键，否则同格内每次 pointermove
    // 都会重排 300ms 定时器并重复求值（本格确无提示）
    if (!tip || tip.content === '' || (tip.overflowOnly && !tip.overflow)) {
      hideTooltip()

      return
    }

    placeTooltipAnchor(context.rect)
    tooltipController.show(tooltipAnchorEl.value, {
      content: tip.content,
      placement: 'top',
      trigger: 'hover'
    })
    tooltipController.updatePosition()
  }

  /** 仅收面板，不动去重键；isAnchorIn 守卫不误杀他组件的 tooltip */
  function hideTooltip () {
    if (tooltipController?.isAnchorIn(host.rootEl.value)) tooltipController.hide()
  }

  /** 状态失效类收起点：收面板 + 清去重键 + 清显示定时器 */
  function hideCellTooltip () {
    clearTooltipTimer()
    tooltipCell = null
    hideTooltip()
  }

  /** pointerleave 通道收起：清调度与去重键；面板仍归属本组件锚点时延迟收起
      （isAnchorIn 守卫，不误杀他组件 tooltip；与 hideCellTooltip 语义差：
      面板走 delayHide 延迟收起而非立即 hide） */
  function delayHideCellTooltip () {
    clearTooltipTimer()
    tooltipCell = null
    if (tooltipController?.isAnchorIn(host.rootEl.value)) tooltipController.delayHide()
  }

  return {
    tooltipAnchorEl,
    tooltipController,
    scheduleCellTooltip,
    hideCellTooltip,
    delayHideCellTooltip
  }
}
