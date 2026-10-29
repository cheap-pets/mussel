/**
 * table-ex 行几何控制器（C1 壳拆分自 table-ex.vue；02-design.md
 * A2.2/A2.3/A2.4 + 复核 2026-10-26 C0 签名显式化）。
 *
 * 持有 uniform/variable 双模式几何与行高缓存，三个显式语义维度（C0）：
 * - mode：'uniform' | 'variable'（只升不降，A2.2）；
 * - scanSignature：估高扫描输入签名（行集合引用 / 列计数语义 / 高度度量 / spans
 *   身份（§4），维度均未变则跳过 O(n×cols) 全量扫描——估高行数与列宽、字号无关，
 *   但行高公式依赖 rowHeight/cellPadding/cellLineHeight，高度度量变化必须重扫）；
 * - measureSignature：精算缓存失效签名（列宽 + 字号/字体/行高/padding，
 *   变化即整体清空 record 引用级精算缓存；仅颜色变化的暗色切换不失效）。
 *
 * 不变量（A2.4，verify-1 失败项 1）：估高 rebuild 前按 record 引用混入已精算
 * 真值，未变行保持精确高度，totalHeight/spacer 滚动全程单调不回缩（#15）；
 * 精算回填导致锚行上方总高变化 Δ 经 scrollTop 一次补偿写入（A2.2 管线 4）。
 *
 * 组件壳经 getter 注入行集合/列/主题/测量能力与 layout 读写（C4 起 layout
 * 恒携几何）；控制器不直接触 DOM（scrollTop 补偿经 getScrollEl 返回的元素）。
 */
import { OVERSCAN } from './layout'
import {
  computeRowHeights,
  createUniformRowGeometry,
  createVariableRowGeometry,
  computeAnchorShift,
  ensureRowMeasured
} from './row-geometry'

/** autoRowSpan 标记签名值（函数形态取 'fn'——函数体不定长，不进签名串） */
function autoRowSpanMarkOf (value) {
  if (value == null) return ''

  return typeof value === 'function' ? 'fn' : String(value)
}

/**
 * 创建行几何控制器（组件壳 setup 内创建并持有，onMounted 前可用——getter 惰性求值）。
 *
 * @param {Object} ctx 组件壳注入的惰性上下文
 * - getRows ()                    → 读行集合（树开 = 平铺行数组）
 * - getColumns ()                 → 已接线内部列（wiredColumns）
 * - getTreeIndents ()             → 树形列缩进回调 (colIndex, row) => px | null
 * - getRecordsOffset ()           → rec_no 序号偏移
 * - getTheme ()                   → 主题快照（themeWatcher.snapshot）
 * - getMeasure () / getWrapCache()→ 文本测量/折行缓存实例（onMounted 创建）
 * - getColumnKey (rawColumn)      → 原始列引用 → 稳定 key（估高列签名用）
 * - getSpans ()                   → 合并单元格 SpansIndex | null（§4 行高分层与
 *                                   扫描/缓存失效维度；缺省视同无合并）
 * - getScrollEl ()                → 滚动容器元素（锚定补偿 scrollTop 写入）
 * - getLayout () / setLayout (v)  → layout shallowRef 读写
 * - relayout ()                   → 壳 relayoutAndRedraw（uniform→variable 升级重估）
 */
export function createRowGeometryController (ctx) {
  // —— 状态（C0 显式语义字段） ——

  let mode = 'uniform'
  let variableGeometry = null

  // uniform 首过几何缓存（rowHeight|rowCount 签名；uniform 不可变，按签名复用）
  let uniformGeometry = null
  let uniformSig = null

  // A2.4 record 引用级行高缓存：进窗精算真值按 record 引用留存，估高 rebuild
  // 前混入；失效维度 = measureSignature（列宽或高度相关主题维度变化）
  let measuredRowHeights = new WeakMap()
  let measuredHeightsSig = null

  // scanSignature 状态（估高扫描输入，见模块头注释三类维度 + spans 身份 §4）
  let lastScanRows = null
  let lastScanColumns = null
  let lastScanColumnSig = null
  let lastScanMetricsSig = null
  let lastScanSpans = null

  // 精算缓存随 spans 身份整体失效的判定源（§4：spans 引用变化即清空）
  let lastSpansRef = null

  // —— 内部工具 ——

  /** 列计数语义签名：列对象身份（按原始列引用稳定）+ 影响估高行数/模式判定
      的字段 + autoRowSpan 标记（§4：合并声明改变行高分层数据链）。列引用重建
      但语义不变（父级每渲染新建列数组）时免重扫 */
  function estimateColumnSignature (columns) {
    return columns.map(col =>
      `${ctx.getColumnKey(col._raw)}|${col.type}|${col._maxLines}|${col._maxItems}` +
      `|${col.multiline === true}|${col._isTreeColumn === true}|${autoRowSpanMarkOf(col._autoRowSpan)}`
    ).join(';')
  }

  /** 变高候选（A2.2 模式判定的列输入）：文本呈现列 maxLines>1 常量或 multiline
      （函数形态配置存在即入候选——具体值经 _resolveMaxLines(record) 行级求值）；
      数组值/多条目经估高扫描发现 */
  function isVariableCandidate () {
    return ctx.getColumns().some(col => (col._maxLines ?? 1) > 1 || col.multiline)
  }

  /** A2.4 精算缓存失效判定：列宽或高度相关主题维度签名变化 → 整体清空
      （仅颜色变化的暗色切换不失效）。每次 relayout 调用——估高跳过重扫时
      同样执行，保证签名漂移后旧精算值不被后续 rebuild 混入 */
  function syncMeasuredHeightCache (colWidths, snapshot) {
    const heightSig =
      `${colWidths.join(',')}|${snapshot.fontSize}|${snapshot.fontFamily}` +
      `|${snapshot.rowHeight}|${snapshot.cellPadding}|${snapshot.cellLineHeight}`

    if (heightSig !== measuredHeightsSig) {
      measuredRowHeights = new WeakMap()
      measuredHeightsSig = heightSig
    }
  }

  /** 估高结果混入已精算真值（估高 = 下界 ≤ 精算）：rebuild 后未变行保持精确
      高度，totalHeight 不因 rebuild 回缩（#15 单调性） */
  function mergeMeasuredHeights (heights, rows) {
    for (let i = 0; i < heights.length; i++) {
      const measured = measuredRowHeights.get(rows[i])

      if (measured > heights[i]) heights[i] = measured
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

  /** 模式升级（A2.2 只升不降）：升级时置空扫描行标记，强制下次 relayout 全量
      重扫重建 variableGeometry（uniform 期间的扫描不产变高几何） */
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

  // —— 扫描 / 单行重估内部流程（resolveForRelayout / remeasureRow 拆分） ——

  /** 估高扫描脏判定（三类维度输入任一变化）：行集合引用 / 高度度量签名 / 列计数
      语义签名 / spans 身份（§4：spanMethod 变化而行集合不变时，「合并格不参与
      行高」须重扫生效） */
  function isScanDirty (rows, metricsSig, columnsChanged, columnSig, spans) {
    return lastScanRows !== rows ||
      lastScanMetricsSig !== metricsSig ||
      lastScanSpans !== spans ||
      (columnsChanged && columnSig !== lastScanColumnSig)
  }

  /** relayout 返回几何：variable = 现有变高几何；uniform = 等高几何（主题行高缺省回退） */
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
   * 估高扫描落地（A2.2 管线 1）：更新 lastScan* 状态 → 全量快速估高（O(n) 纯算术，
   * 数组值/link 条目计数真值、字符串估 1 行下界）→ 变高判定（现有变高几何 /
   * 变高候选列 / 估高发现数组值）命中则模式升级 + 精算真值混入 + 变高几何重建。
   * 返回 rebuild（变高几何重建，壳须以返回 geometry 重跑 relayout）。
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

    // A2.2 模式升级（只升不降）；升级前扫描已在 uniform 期间跑过也不产变高几何
    if (!(mode === 'variable' || isVariableCandidate() || hasArrayValues)) return false

    mode = 'variable'

    // A2.4：估高混入已精算真值（mergeMeasuredHeights 注释）
    mergeMeasuredHeights(heights, rows)
    applyEstimatedHeights(heights, rows)

    return true
  }

  /** remeasureRow 前置判定：布局就绪且行号落在行集合范围内 */
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

  /** 锚定补偿 + contentHeight/spacer 同步（A2.2 管线 4，同帧批次内一次写入） */
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

  /** variable 单行精算 + updateHeight（Δ 非零才同步锚定与布局） */
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

    // 精算真值入缓存（A2.4，按 record 引用为键）
    measuredRowHeights.set(rows[row], height)

    if (!geometry.updateHeight(row, height)) return

    syncAnchoredLayout(cur, el, geometry, anchorRow, prevTopAtAnchor)
  }

  // —— 对外 API ——

  const controller = {
    /** 当前模式（'uniform' | 'variable'，只升不降） */
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
     * colWidths 后传入）。三类估高维度输入任一变化才全量扫描重建；否则跳过并
     * 沿用现有高度。rebuild 为 true 时壳须以返回 geometry 重跑 relayout。
     *
     * @returns {{ geometry: Object, scanCount: Number, rebuild: Boolean }}
     */
    resolveForRelayout ({ colWidths, theme }) {
      // 精算缓存随 spans 身份整体失效（§4：spans 引用并入失效判定，变化即清空）
      const spans = ctx.getSpans?.() ?? null

      if (spans !== lastSpansRef) {
        measuredRowHeights = new WeakMap()
        lastSpansRef = spans
      }

      // A2.4 精算缓存失效判定先于扫描/混入执行（列宽或高度主题维度漂移即清空）
      syncMeasuredHeightCache(colWidths, theme)

      const rows = ctx.getRows() ?? []
      const columns = ctx.getColumns()
      const metricsSig = `${theme.rowHeight}|${theme.cellPadding}|${theme.cellLineHeight}`
      const columnsChanged = lastScanColumns !== columns
      const columnSig = columnsChanged ? estimateColumnSignature(columns) : lastScanColumnSig
      let scanCount = 0
      let rebuild = false

      if (columnsChanged) lastScanColumns = columns

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
     * 进窗精算（A2.2 管线 2，滚动帧调用）：可视窗口 ±OVERSCAN 逐行
     * ensureRowMeasured → updateHeight → Δ 累计滚动锚定（scrollTop 一次补偿
     * 写入）→ contentHeight/spacer 同步。uniform 模式零成本跳过。
     */
    // 每行热路径：拆分会引入参数打包与函数调用开销，复杂度收益低于回归风险（02-optimize A 线裁定 #2②）
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
      let delta = 0

      for (let row = start; row < end; row++) {
        const height = ensureRowMeasured({
          record: rows[row],
          recordNumber: (ctx.getRecordsOffset() || 0) + row + 1,
          colWidths: cur.colWidths,
          ...base,
          row,
          spans: ctx.getSpans?.() ?? null
        })

        // 精算真值入缓存（A2.4，按 record 引用为键）
        measuredRowHeights.set(rows[row], height)
        delta += variableGeometry.updateHeight(row, height)
      }

      if (!delta) return

      // 滚动锚定（A2.2 管线 4）：锚行上方总高变化 Δ 一次性补偿，视口内容视觉不动
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
     * 单行行高重估（A2.2 契约①，编辑提交 nextTick 调用）：variable 模式单行
     * 精算 + updateHeight + 锚定 + 布局同步；uniform 模式判定该行是否引入数组
     * 值/多条目 → 模式升级 + 壳全量 relayout。
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
