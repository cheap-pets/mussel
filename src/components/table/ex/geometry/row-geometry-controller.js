/**
 * table-ex 行几何控制器：持有 uniform/variable 双模式几何与行高缓存。
 * 三个失效/跳过判定维度——mode（uniform|variable，只升不降）、scanSignature
 * （估高扫描输入签名：行集合引用 / 列计数语义 / 高度度量 / spans 身份，均未变
 * 则跳过 O(n×cols) 全量扫描；估高行数与列宽、字号无关，但行高公式依赖
 * rowHeight/cellPadding/cellLineHeight，度量变化必须重扫）、measureSignature
 * （精算缓存失效签名：列宽 + 字号/字体/行高/padding，变化即整体清空 record
 * 引用级精算缓存；仅颜色变化的暗色切换不失效）。
 * 不变量：精算回填导致锚行上方总高变化 Δ 经 scrollTop 一次补偿写入；能力经
 * getter 注入（见 createRowGeometryController 的 ctx），控制器不直接触 DOM。
 */
import { OVERSCAN } from './layout'
import {
  computeRowHeights,
  createUniformRowGeometry,
  createVariableRowGeometry,
  computeAnchorShift,
  ensureRowMeasured,
  isEntryColumn
} from './row-geometry'
import { recordNumberOf } from '../shared/cell-identity'

/** autoRowSpan 标记签名值（函数形态取 'fn'——函数体不定长，不进签名串） */
function autoRowSpanMarkOf (value) {
  if (value == null) return ''

  return typeof value === 'function' ? 'fn' : String(value)
}

/**
 * 创建行几何控制器（组件壳 setup 内创建并持有，onMounted 前可用——getter 惰性求值）。
 *
 * @param {Object} ctx 组件壳注入的惰性上下文，getter 清单：
 * - getRows / getColumns：行集合（树开 = 平铺行数组）/ 已接线内部列
 * - getTreeIndents：树形列缩进回调 (colIndex, row) => px | null
 * - getRecordsOffset：rec_no 序号偏移
 * - getRecordsVersion：records 就地修改通知版本（精算快照失效维度，缺省视同 0）
 * - getTheme：主题快照；getMeasure / getWrapCache：文本测量/折行缓存（onMounted 创建）
 * - getColumnKey：原始列引用 → 稳定 key（估高列签名用）
 * - getSpans：合并单元格 SpansIndex | null（行高分层与扫描/缓存失效维度，缺省视同无合并）
 * - getScrollEl：滚动容器元素（锚定补偿 scrollTop 写入）
 * - getLayout / setLayout：layout shallowRef 读写
 * - relayout：壳 relayoutAndRedraw（uniform→variable 升级重估）
 */
export function createRowGeometryController (ctx) {
  // —— 状态 ——

  let mode = 'uniform'
  let variableGeometry = null

  let uniformGeometry = null
  let uniformSig = null

  // 行高精算缓存：按 record 引用留存，估高 rebuild 前混入未变行真值，
  // 保证 totalHeight 单调不回缩；条目为快照 { height, indent, recordsVersion }，
  // 缓存不随滚动帧刷新——records 就地改值必须 bump recordsVersion（唯一通知通道）
  let measuredRowHeights = new WeakMap()
  let measuredHeightsSig = null

  // scanSignature 状态（估高扫描输入，维度见模块头）
  let lastScanRows = null
  let lastScanColumns = null
  let lastScanColumnSig = null
  let lastScanMetricsSig = null
  let lastScanSpans = null

  // 精算缓存随 spans 引用变化整体失效的判定源
  let lastSpansRef = null

  // —— 内部工具 ——

  /** 列计数语义签名：列身份（按原始列引用稳定）+ 影响估高行数/模式判定的
      字段 + autoRowSpan 标记（合并声明改变行高分层数据链）；列数组每渲染
      重建但语义不变时免重扫 */
  function estimateColumnSignature (columns) {
    return columns.map(col =>
      `${ctx.getColumnKey(col._raw)}|${col.type}|${col._maxLines}|${col._maxItems}` +
      `|${col.multiline === true}|${col._isTreeColumn === true}|${autoRowSpanMarkOf(col._autoRowSpan)}`
    ).join(';')
  }

  /** 变高候选列判定：maxLines>1 或 multiline 配置即入候选（函数形态配置存在
      即算，具体值经 _resolveMaxLines(record) 行级求值）；数组值/多条目经估高扫描发现 */
  function isVariableCandidate () {
    return ctx.getColumns().some(col => (col._maxLines ?? 1) > 1 || col.multiline)
  }

  /** 每次 relayout 均执行——估高跳过重扫时同样执行，保证签名漂移后旧精算值
      不被后续 rebuild 混入（失效维度见模块头 measureSignature） */
  function syncMeasuredHeightCache (colWidths, snapshot) {
    const heightSig =
      `${colWidths.join(',')}|${snapshot.fontSize}|${snapshot.fontFamily}` +
      `|${snapshot.rowHeight}|${snapshot.cellPadding}|${snapshot.cellLineHeight}`

    if (heightSig !== measuredHeightsSig) {
      measuredRowHeights = new WeakMap()
      measuredHeightsSig = heightSig
    }
  }

  /** 估高结果混入已精算真值（估高 = 下界 ≤ 精算，max 混入）：几何值高于缓存
      真值时（条目列 render 计数漂移等），该行随后经跳过判据失配
      （heightAt ≠ cached.height）重算修正 */
  function mergeMeasuredHeights (heights, rows) {
    for (let i = 0; i < heights.length; i++) {
      const measured = measuredRowHeights.get(rows[i])

      if (measured?.height > heights[i]) heights[i] = measured.height
    }
  }

  /** uniform 首过几何（按 rowHeight|rowCount 签名缓存；不可变对象复用） */
  function uniformGeometryOf ({ rowHeight, rowCount }) {
    const sig = `${rowHeight}|${rowCount}`

    if (!uniformGeometry || uniformSig !== sig) {
      uniformGeometry = createUniformRowGeometry({ rowHeight, rowCount })
      uniformSig = sig
    }

    return uniformGeometry
  }

  /** 模式升级：置空扫描行标记，强制下次 relayout 全量重扫重建 variableGeometry
      （uniform 期间的扫描不产变高几何） */
  function upgradeToVariable () {
    if (mode === 'variable') return

    mode = 'variable'
    lastScanRows = null
  }

  function measureContext () {
    return {
      columns: ctx.getColumns(),
      theme: ctx.getTheme(),
      measure: ctx.getMeasure(),
      wrapCache: ctx.getWrapCache(),
      treeIndents: ctx.getTreeIndents()
    }
  }

  // —— 扫描 / 单行重估内部流程 ——

  /** 估高扫描脏判定（四类维度任一变化，见模块头）；spanMethod 变化而行集合
      不变时，「合并格不参与行高」须重扫生效 */
  function isScanDirty (rows, metricsSig, columnsChanged, columnSig, spans) {
    return lastScanRows !== rows ||
      lastScanMetricsSig !== metricsSig ||
      lastScanSpans !== spans ||
      (columnsChanged && columnSig !== lastScanColumnSig)
  }

  function resolveGeometry (rows, theme) {
    if (mode === 'variable') return variableGeometry

    return uniformGeometryOf({
      rowHeight: theme.rowHeight || 36,
      rowCount: rows.length
    })
  }

  /** 变高几何落地：行集合变化新建几何，否则 Fenwick 整体重建 O(n)（调宽/主题失效重估） */
  function applyEstimatedHeights (heights, rows) {
    if (!variableGeometry || variableGeometry.rowCount !== rows.length) {
      variableGeometry = createVariableRowGeometry({ initialHeights: heights })
    } else {
      variableGeometry.rebuild(heights)
    }
  }

  /**
   * 估高扫描落地：更新 lastScan* 状态 → computeRowHeights 全量估高 → 变高判定
   * （现有变高几何 / 变高候选列 / 估高发现多条目）命中则模式升级 + 精算真值
   * 混入 + 变高几何重建。返回 rebuild=true 时壳须以返回 geometry 重跑 relayout。
   */
  function rescanRowHeights (rows, columns, colWidths, theme, metricsSig, columnSig, spans) {
    lastScanRows = rows
    lastScanColumnSig = columnSig
    lastScanMetricsSig = metricsSig
    lastScanSpans = spans

    const { heights, hasArrayValues } = computeRowHeights({
      records: rows,
      columns,
      colWidths,
      theme,
      measure: ctx.getMeasure(),
      wrapCache: ctx.getWrapCache(),
      treeIndents: ctx.getTreeIndents(),
      spans
    })

    if (!(mode === 'variable' || isVariableCandidate() || hasArrayValues)) return false

    mode = 'variable'

    mergeMeasuredHeights(heights, rows)
    applyEstimatedHeights(heights, rows)

    return true
  }

  function isRowInRange (row, cur, rows) {
    return cur && rows && row >= 0 && row < rows.length
  }

  /** uniform 单行重估：判定该行是否引入数组值/多条目，是则模式升级 + 壳全量 relayout。
      不传 spans——records 为单行数组而下标 0 与真实行号错位（误用会错排分层）；
      误升级由随后的全量 relayout 重扫（带 spans）纠正 */
  function remeasureUniformRow (record, cur) {
    const { hasArrayValues } = computeRowHeights({
      records: [record],
      colWidths: cur.colWidths,
      ...measureContext()
    })

    if (!hasArrayValues) return

    upgradeToVariable()
    ctx.relayout()
  }

  /** 锚定补偿 + contentHeight/spacer 同步（同帧批次内一次写入） */
  function syncAnchoredLayout (cur, el, geometry, anchorRow, prevTopAtAnchor) {
    const shift = computeAnchorShift({
      prevTopAtAnchor,
      nextTopAtAnchor: geometry.topAt(anchorRow)
    })

    if (shift) el.scrollTop += shift

    const totalHeight = geometry.totalHeight

    ctx.setLayout({
      ...cur,
      contentHeight: cur.headHeight + totalHeight,
      spacerHeight: Math.max(0, cur.headHeight + totalHeight - cur.stickyHeight)
    })
  }

  /** 精算快照条目：树缩进仅在树开且存在变高候选列时求值（条目列行数来自
      render 计数、与宽度无关，其余场景恒 0）；与 remeasureVisibleRows 的
      循环外提口径同一规则 */
  function measuredSnapshot (row, height) {
    const treeIndents = ctx.getTreeIndents()
    let indent = 0

    if (treeIndents && isVariableCandidate()) {
      const treeColIndex = ctx.getColumns().findIndex(col => col._isTreeColumn)

      if (treeColIndex >= 0) indent = treeIndents(treeColIndex, row) || 0
    }

    return { height, indent, recordsVersion: ctx.getRecordsVersion?.() ?? 0 }
  }

  function remeasureVariableRow (row, cur, rows) {
    const el = ctx.getScrollEl()
    const geometry = variableGeometry

    if (!el || !geometry) return

    const anchorRow = geometry.offsetToRow(el.scrollTop)
    const prevTopAtAnchor = geometry.topAt(anchorRow)
    const height = ensureRowMeasured({
      record: rows[row],
      recordNumber: (ctx.getRecordsOffset() || 0) + row + 1,
      colWidths: cur.colWidths,
      ...measureContext(),
      row,
      spans: ctx.getSpans?.() ?? null
    })

    measuredRowHeights.set(rows[row], measuredSnapshot(row, height))

    if (!geometry.updateHeight(row, height)) return

    syncAnchoredLayout(cur, el, geometry, anchorRow, prevTopAtAnchor)
  }

  // —— 对外 API ——

  const controller = {
    get mode () {
      return mode
    },

    /** 变高几何实例（uniform 模式为 null；主题锚定等外部只读消费） */
    get geometry () {
      return variableGeometry
    },

    /** relayout 首过几何（列宽求解用）：变高 = 现有几何、uniform = 等高几何 */
    currentGeometry ({ rowHeight, rowCount }) {
      return mode === 'variable' && variableGeometry
        ? variableGeometry
        : uniformGeometryOf({ rowHeight, rowCount })
    },

    /**
     * relayout 扫描块（壳 relayoutAndRedraw 内调用，先以 currentGeometry 解出
     * colWidths 后传入）：扫描维度未变则跳过全量扫描沿用现有高度；rebuild 为
     * true 时壳须以返回 geometry 重跑 relayout。
     * @returns {{ geometry: Object, scanCount: Number, rebuild: Boolean }}
     */
    resolveForRelayout ({ colWidths, theme }) {
      const spans = ctx.getSpans?.() ?? null

      if (spans !== lastSpansRef) {
        measuredRowHeights = new WeakMap()
        lastSpansRef = spans
      }

      syncMeasuredHeightCache(colWidths, theme)

      const rows = ctx.getRows() ?? []
      const columns = ctx.getColumns()
      const metricsSig = `${theme.rowHeight}|${theme.cellPadding}|${theme.cellLineHeight}`
      const columnsChanged = lastScanColumns !== columns
      const columnSig = columnsChanged ? estimateColumnSignature(columns) : lastScanColumnSig
      let scanCount = 0
      let rebuild = false

      if (columnsChanged) lastScanColumns = columns

      // 表级估高短路：uniform + 无 spans + 全列为确定单行列（非条目列、无变高
      // 候选）时本次扫描是 no-op——isVariableCandidate() false ∧ hasArrayValues
      // false（唯一产源为条目列）⟹ rescanRowHeights 必返回 false 且 heights
      // 全部弃用。须按「已扫描」写回 lastScan*（lastScanColumns 由上方既有行
      // 更新），否则脏判定停留在更早输入上；mode 变 variable 只来自
      // upgradeToVariable（第一动作 lastScanRows = null）或 rescanRowHeights
      // 自身，编辑升级路径（remeasureUniformRow）不被截断
      if (
        mode === 'uniform' && !spans && columns.every(
          col => !isEntryColumn(col) && !((col._maxLines ?? 1) > 1) && !col.multiline
        )
      ) {
        lastScanRows = rows
        lastScanColumnSig = columnSig
        lastScanMetricsSig = metricsSig
        lastScanSpans = spans

        return {
          geometry: resolveGeometry(rows, theme),
          scanCount: 0,
          rebuild: false
        }
      }

      if (isScanDirty(rows, metricsSig, columnsChanged, columnSig, spans)) {
        scanCount = rows.length
        rebuild = rescanRowHeights(rows, columns, colWidths, theme, metricsSig, columnSig, spans)
      }

      return {
        geometry: resolveGeometry(rows, theme),
        scanCount,
        rebuild
      }
    },

    /**
     * 进窗精算（滚动帧调用）：可视窗口 ±OVERSCAN 逐行处理。命中精算缓存快照
     * （几何值 + recordsVersion + 树缩进全匹配）的行直接跳过——此时
     * updateHeight(row, cached.height) 恒返回 0，测量侧零重算；未命中行精算
     * → 写快照 → updateHeight → Δ 累计滚动锚定 + contentHeight/spacer 同步。
     * uniform 模式零成本跳过。
     */
    // 每行热路径：拆分引入参数打包与调用开销，复杂度收益低于回归风险
    // eslint-disable-next-line complexity
    remeasureVisibleRows () {
      const cur = ctx.getLayout()
      const el = ctx.getScrollEl()

      if (!cur || !el || mode !== 'variable' || !variableGeometry) return

      const rows = ctx.getRows() ?? []
      const { start, end } = variableGeometry.visibleRange(el.scrollTop, cur.viewH, OVERSCAN)
      const anchorRow = variableGeometry.offsetToRow(el.scrollTop)
      const prevTopAtAnchor = variableGeometry.topAt(anchorRow)
      const base = measureContext()
      const spans = ctx.getSpans?.() ?? null
      const recordsOffset = ctx.getRecordsOffset() || 0
      const version = ctx.getRecordsVersion?.() ?? 0
      const { columns, treeIndents } = base
      const needIndent = !!treeIndents && isVariableCandidate()
      const treeColIndex = needIndent
        ? columns.findIndex(col => col._isTreeColumn)
        : -1
      const indentOf = row =>
        needIndent && treeColIndex >= 0 ? treeIndents(treeColIndex, row) || 0 : 0
      let delta = 0

      for (let row = start; row < end; row++) {
        const cached = measuredRowHeights.get(rows[row])
        const indent = indentOf(row)

        if (
          cached &&
          variableGeometry.heightAt(row) === cached.height &&
          cached.recordsVersion === version &&
          cached.indent === indent
        ) continue

        const height = ensureRowMeasured({
          record: rows[row],
          recordNumber: recordNumberOf(recordsOffset, row),
          colWidths: cur.colWidths,
          ...base,
          row,
          spans
        })

        measuredRowHeights.set(rows[row], { height, indent, recordsVersion: version })
        delta += variableGeometry.updateHeight(row, height)
      }

      if (!delta) return

      const shift = computeAnchorShift({
        prevTopAtAnchor,
        nextTopAtAnchor: variableGeometry.topAt(anchorRow)
      })

      if (shift) el.scrollTop += shift

      const totalHeight = variableGeometry.totalHeight

      ctx.setLayout({
        ...cur,
        contentHeight: cur.headHeight + totalHeight,
        spacerHeight: Math.max(0, cur.headHeight + totalHeight - cur.stickyHeight)
      })
    },

    /**
     * 单行行高重估（编辑提交 nextTick 调用）：variable 单行精算 + updateHeight
     * + 锚定 + 布局同步；uniform 判定该行是否引入数组值/多条目 → 模式升级 +
     * 壳全量 relayout。
     */
    remeasureRow (row) {
      const cur = ctx.getLayout()
      const rows = ctx.getRows()

      if (!isRowInRange(row, cur, rows)) return

      if (mode !== 'variable') {
        remeasureUniformRow(rows[row], cur)

        return
      }

      remeasureVariableRow(row, cur, rows)
    },

    /** 列定义变化（columns 引用替换）：行高缓存签名置空强制下次 relayout 重建
        （缓存键为 record 引用，不含列定义维度），壳同时清空拖拽宽度覆盖 */
    invalidateMeasureCache () {
      measuredHeightsSig = null
    }
  }

  return controller
}
