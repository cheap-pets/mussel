<template>
  <div
    ref="rootEl"
    class="mu-canvas-table"
    :class="wrapClass">
    <div
      ref="scrollEl"
      v-mu-scrollbar
      class="mu-canvas-table__scroll"
      @scroll="onScroll"
      @sizechange="onResize">
      <!-- 指针交互监听层（A4.3 click 单一入口：树槽 → 条目 → 编辑 → 选中链）；
           v-mu-scrollbar 注入的 .mu-scrollbar__tracks 经 insertBefore 成为 __scroll 首子元素 -->
      <div
        ref="stickyEl"
        class="mu-canvas-table__sticky"
        :style="stickyStyle"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
        @pointerdown="onPointerDown"
        @click="onClick">
        <canvas ref="canvasEl" class="mu-canvas-table__canvas" />
        <div class="mu-canvas-table__overlay">
          <div class="mu-canvas-table__header-shadow" />
          <div class="mu-canvas-table__bottom-shadow" />
          <div v-if="isEmpty" class="mu-canvas-table__empty">
            <slot name="empty">{{ emptyText }}</slot>
          </div>
          <!-- 编辑浮层（A5/A6）：分类型 v-on 合成、容器 tabindex=-1 聚焦承接 esc；
               bordered === false（switch 无边框 / editor.border:false）挂 --borderless；
               事件冒泡拦截，画布侧 pointerdown 先同步提交再续行命中。
               textarea 分支渲染真实 <textarea class="mu-input" v-model>（memo 约定）——
               <component :is="'textarea'"> 的 v-model 编译为 modelValue prop（落到
               modelvalue 属性），不产生 vModelText 语义（实现偏离记录 03 编号）。
               keydown.esc 空值防护：input 内 esc 转发 cancel 后同一事件冒泡到容器，
               届时 editing 已清空 -->
          <div
            v-if="editor.state.editing"
            ref="editorEl"
            class="mu-canvas-table__editor"
            :class="{ 'mu-canvas-table__editor--borderless': editor.state.editing.bordered === false }"
            :style="editor.state.editing.style"
            :title="editor.state.editing.message || null"
            tabindex="-1"
            @pointerdown.stop
            @click.stop
            @keydown.esc="editor.state.editing?.onEsc()">
            <textarea
              v-if="editor.state.editing.editorType === 'textarea'"
              v-model="editor.state.editing.value"
              class="mu-input"
              v-bind="editor.state.editing.props"
              v-on="editor.state.editing.events" />
            <component
              v-else
              :is="editor.state.editing.component"
              v-model="editor.state.editing.value"
              :invalid="editor.state.editing.invalid || null"
              v-bind="editor.state.editing.props"
              v-on="editor.state.editing.events" />
          </div>
        </div>
      </div>
      <div ref="spacerEl" class="mu-canvas-table__spacer" :style="spacerStyle" />
    </div>
  </div>
</template>

<script setup>
  import { computed, nextTick, onMounted, onUnmounted, shallowRef, watch, ref } from 'vue'
  import { throttle } from 'throttle-debounce'

  import { autoIncrementKeyBuilder } from '@/utils/key-builder'
  import { getPixelNumber } from '../table/utils'

  import { createThemeWatcher, createTextMeasurer } from './theme'
  import { createWrapCache } from './text-wrap'
  import {
    computeRowHeights,
    createVariableRowGeometry,
    computeAnchorShift,
    ensureRowMeasured,
    TREE_INDENT
  } from './row-geometry'
  import { buildChildrenIndex, buildFlatRows, resolveInitialExpandedKeys, toggleKey } from './tree'
  import {
    computePrefixSums,
    computeViewCols,
    computeViewRows,
    relayout as computeLayout,
    resolveTypeMinWidth,
    OVERSCAN
  } from './layout'
  import { prepareColumn, resolveCellContent } from './cell-painters'
  import { cellRectAt, createPainter } from './painter'
  import {
    createClickGuard,
    createFrameScheduler,
    hitTest,
    resolveCellClick,
    resolveCellClickOpen,
    resolveCursor,
    resolveHeaderClick,
    resolveItemClick,
    resolvePointerdown,
    resolveResizeWidth,
    resolveTreeToggle,
    RESIZE_MIN_WIDTH
  } from './interactions'
  import {
    computeEditorStyle,
    createEditorController,
    isCellEditable,
    resolveEditorType
  } from './editor'

  import './canvas-table.scss'

  defineOptions({ name: 'MusselCanvasTable' })

  const props = defineProps({
    keyField: String,
    records: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    selectedRecord: Object,
    selectedRecordKey: [String, Number],
    headerChecked: Object,
    orderBy: String,
    recordsOffset: { type: Number, default: 0 },
    fixedLeftColumns: Number,
    gridlines: {
      default: 'all',
      validator: v => ['none', 'all', 'row', 'column'].includes(v)
    },
    hoverMode: {
      default: 'row',
      validator: v => ['none', 'row', 'column', 'cross', 'cell'].includes(v)
    },
    striped: Boolean,
    placeholder: String,
    emptyText: { type: String, default: '' },
    recordsVersion: { type: Number, default: 0 },
    editable: { type: Boolean, default: false },
    resizable: { type: Boolean, default: false },
    // —— 树模式（A2.4，意见 1）——
    tree: { type: Boolean, default: false },
    // 树字段名配置 { key, parentKey }，缺省 { key: keyField ?? 'id', parentKey: 'parentId' }
    treeProps: Object,
    // 展开节点 key 受控数组（宽松受控，同 headerChecked 模式）
    treeExpandedKeys: Array,
    // 初始展开层级（0-based：level <= defaultExpandLevel 展开，-1 = 全收起，对齐 tree 组件）
    defaultExpandLevel: { type: Number, default: 0 }
  })

  const emit = defineEmits([
    'header-click',
    'cell-click',
    'update:header-checked',
    'update:cell-value',
    'update:selected-record',
    'update:selected-record-key',
    'update:order-by',
    'column-resize',
    'update:tree-expanded-keys',
    'cell-item-click'
  ])

  const rootEl = shallowRef()
  const scrollEl = shallowRef()
  const stickyEl = shallowRef()
  const canvasEl = shallowRef()
  const spacerEl = shallowRef()
  const editorEl = shallowRef()

  const genRecordKey = autoIncrementKeyBuilder()
  const genColumnKey = autoIncrementKeyBuilder()

  // 列准备（table.vue internalColumns 等价物）：columns/placeholder 变化即重建；
  // _key 经 genColumnKey WeakMap 记忆，列对象不变则键稳定（widthOverrides 定位键）
  const preparedColumns = computed(() =>
    props.columns.map(el => {
      const col = prepareColumn(el, { placeholder: props.placeholder })

      col._key = el.key ?? genColumnKey(el)

      return col
    })
  )

  // 拖拽列宽存放（按列 key），不写回 props（decisions「[I1 前]⑥」G1-b 契约：
  // overrides 由组件壳持有，columns 引用替换时清空）
  const widthOverrides = {}

  const layout = shallowRef(null)

  // —— 树接线（A2.4：records/treeProps/treeExpandedKeys → 平铺行数组，全绘制/交互消费） ——

  // 展开节点 key 集合（内部持有；受控 prop 引用变化覆盖，点击箭头 toggle + emit）
  const treeExpanded = shallowRef(new Set())

  const treeOptions = computed(() => ({
    key: props.treeProps?.key ?? props.keyField ?? 'id',
    parentKey: props.treeProps?.parentKey ?? 'parentId'
  }))

  // 子级索引（O(n) Map + hasChildren Set；树关 = null 零成本）
  const childrenIndex = computed(() => {
    if (!props.tree) return null

    const { key, parentKey } = treeOptions.value

    return buildChildrenIndex(props.records, {
      keyOf: record => record?.[key],
      parentKeyOf: record => record?.[parentKey]
    })
  })

  // DFS 展开序平铺（迭代防爆栈、visited 防环、孤儿挂根）；树关 = null
  const flatRows = computed(() => {
    if (!props.tree) return null

    const { key, parentKey } = treeOptions.value

    return buildFlatRows(props.records, {
      keyOf: record => record?.[key],
      parentKeyOf: record => record?.[parentKey],
      expandedKeys: treeExpanded.value,
      childrenIndex: childrenIndex.value
    })
  })

  // 读行集合（A2.1 paintState 契约）：树开 = 平铺行数组、树关 = records 原序；
  // painter/interactions/editor 全消费方经此取行
  const displayRows = computed(() => (props.tree ? flatRows.value?.rows ?? [] : props.records))

  // 列接线：树开且未显式指定 treeNode 时缺省首个数据列为树形列（A3.4；
  // check/rec_no 为图形列不作为树形列缺省）
  const wiredColumns = computed(() => {
    const cols = preparedColumns.value

    if (!props.tree || cols.some(col => col._isTreeColumn)) return cols

    let index = cols.findIndex(col => col.type !== 'check' && col.type !== 'rec_no')

    if (index < 0) index = 0

    return cols.map((col, i) => (i === index ? { ...col, _isTreeColumn: true } : col))
  })

  const treeColumnIndex = computed(() => wiredColumns.value.findIndex(col => col._isTreeColumn))

  /** 树形列缩进回调（评审 6 P8：签名带列号——仅树形列返回 16×level+16，
      非树形多行列返回 0 不误扣；A2.4/实施约束 6）；无树传 null 零成本 */
  function treeIndentsOf () {
    if (!props.tree) return null

    const colIndex = treeColumnIndex.value
    const levels = flatRows.value?.levels

    return (i, row) => (i === colIndex ? TREE_INDENT * (levels?.[row] ?? 0) + TREE_INDENT : 0)
  }

  // —— 行几何策略（A2.2：等高 O(1) 保留 / 变高 Fenwick，模式只升不降） ——

  const rowGeometryMode = shallowRef('uniform')
  let variableGeometry = null
  // A2.4 record 引用级行高缓存（verify-1 失败项 1）：进窗精算真值按 record 引用
  // 留存，估高 rebuild（树 toggle / 主题重估等）前按引用混入——未变行复用精确
  // 高度，窗外已精算行高不丢失，滚动全程 totalHeight/spacer 单调不回缩（#15）。
  // 失效维度 = 列宽或高度相关主题维度（字号/字体/行高/padding）变化（relayout
  // 时签名比对判定，仅颜色变化的暗色切换不失效）+ 列定义变化（watch 置空签名）
  let measuredRowHeights = new WeakMap()
  let measuredHeightsSig = null
  let measureFn = null
  let wrapCacheObj = null
  // 估高扫描输入标记（A2.2：扫描在 records/columns 准备期运行；uniform 且输入
  // 未变时跳过，避免容器 resize 等高频 relayout 重复全量扫描）
  let lastScanRecords = null
  let lastScanColumns = null

  /** 变高候选（A2.2 模式判定的列输入）：文本呈现列 maxLines>1 常量或 multiline
      （DOM 风格 multiline+lineClamp 兼容，函数形态配置存在即入候选——具体值
      经 _resolveMaxLines(record) 行级求值）；数组值/多条目经估高扫描发现 */
  function isVariableCandidate () {
    return wiredColumns.value.some(col => (col._maxLines ?? 1) > 1 || col.multiline)
  }

  const selectedKey = computed(() =>
    props.selectedRecordKey ?? props.selectedRecord?.[props.keyField || '_key']
  )

  const hover = shallowRef(null)
  const resizeGuideX = shallowRef(null)
  const cursor = ref('default')

  const yScrolled = ref(false)
  const yScrolledEnd = ref(false)
  const yOverflowed = ref(false)

  const isEmpty = computed(() => !props.records?.length)

  const wrapClass = computed(() => ({
    'mu-canvas-table--empty': isEmpty.value,
    'mu-canvas-table--y-scrolled': yScrolled.value,
    'mu-canvas-table--y-scrolled-end': yScrolledEnd.value,
    'mu-canvas-table--y-overflowed': yOverflowed.value
  }))

  // 光标反馈（A5 pointermove 行）经 stickyStyle 一并绑定在 __sticky 上
  const stickyStyle = computed(() => {
    const cur = layout.value
    const style = { cursor: cursor.value }

    if (cur) {
      style.width = `${cur.stickyWidth}px`
      style.height = `${cur.stickyHeight}px`
    }

    return style
  })

  const spacerStyle = computed(() => {
    const cur = layout.value

    return cur ? { width: `${cur.spacerWidth}px`, height: `${cur.spacerHeight}px` } : null
  })

  // —— 模块实例（onMounted 创建） ——

  let painter = null
  let themeWatcher = null

  // painter 持久 state（G2-a 契约：原地变更后 invalidate/draw 即以新状态重绘；
  // paintState 组装扩展（A2.1/A2.2）：displayRows/flatInfo/expandedKeys/tree/
  // editable/isCellEditableFn/measure/wrapCache/itemHits）
  const itemHits = new Map()

  const paintState = {
    dpr: 1,
    layout: null,
    theme: null,
    records: props.records,
    displayRows: null,
    flatInfo: null,
    expandedKeys: null,
    tree: false,
    editable: props.editable,
    isCellEditableFn: null,
    measure: null,
    wrapCache: null,
    itemHits,
    columns: [],
    recordsOffset: props.recordsOffset,
    emit,
    keyField: props.keyField,
    getRecordKey: (record, row) => resolveRecordKey(record),
    selectedKey: null,
    headerChecked: props.headerChecked,
    gridlines: props.gridlines,
    hoverMode: props.hoverMode,
    striped: props.striped,
    orderBy: props.orderBy,
    hover: null,
    resizeGuideX: null
  }

  /** 行 key：树模式 = 树 key 字段（treeProps.key ?? keyField ?? 'id'，箭头展开态
      与 toggle 同口径）；普通模式 = keyField ?? 自增键 */
  function resolveRecordKey (record) {
    if (props.tree) {
      const { key } = treeOptions.value

      return record?.[key]
    }

    return props.keyField ? record?.[props.keyField] : genRecordKey(record)
  }

  /** 可编辑格判定（hover 描边 / cursor text / 单击开编辑共用） */
  function cellEditableOf (column) {
    return isCellEditable({ editable: props.editable, column })
  }

  function syncPaintState () {
    paintState.layout = layout.value
    paintState.records = props.records
    paintState.displayRows = displayRows.value
    paintState.flatInfo = flatRows.value
      ? { levels: flatRows.value.levels, hasChildren: flatRows.value.hasChildren }
      : null
    paintState.expandedKeys = props.tree ? treeExpanded.value : null
    paintState.tree = props.tree
    paintState.editable = props.editable
    paintState.isCellEditableFn = cellEditableOf
    paintState.measure = measureFn
    paintState.wrapCache = wrapCacheObj
    paintState.columns = wiredColumns.value
    paintState.recordsOffset = props.recordsOffset
    paintState.keyField = props.keyField
    paintState.selectedKey = selectedKey.value
    paintState.headerChecked = props.headerChecked
    paintState.gridlines = props.gridlines
    paintState.hoverMode = props.hoverMode
    paintState.striped = props.striped
    paintState.orderBy = props.orderBy
    paintState.hover = hover.value
    paintState.resizeGuideX = resizeGuideX.value
    paintState.theme = themeWatcher?.snapshot ?? paintState.theme
  }

  function redraw () {
    syncPaintState()
    painter?.draw(paintState)
  }

  // 脏区重绘一律 immediate：painter 的 rAF 队列 apply 的是上次绘制时的 state 浅拷贝，
  // 本壳以持久 state 原地变更后必须同步应用才能以新状态重绘（G2-a invalidate 契约）；
  // 同帧多次调用各自独立应用，范围即脏带本身
  function invalidate (region) {
    syncPaintState()

    return painter?.invalidate(region, { state: paintState, immediate: true }) ?? false
  }

  function invalidateRow (row) {
    syncPaintState()

    return painter?.invalidateRow(row, { state: paintState, immediate: true }) ?? false
  }

  // —— DPR 适配与布局重算（A2） ——

  function syncCanvasSize (cssWidth, cssHeight) {
    const canvas = canvasEl.value

    if (!canvas) return

    const dpr = window.devicePixelRatio || 1

    paintState.dpr = dpr

    const physicsWidth = Math.round(cssWidth * dpr)
    const physicsHeight = Math.round(cssHeight * dpr)

    if (canvas.width !== physicsWidth) canvas.width = physicsWidth
    if (canvas.height !== physicsHeight) canvas.height = physicsHeight

    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`
  }

  /** A2.4 record 引用级行高缓存（verify-1 失败项 1）：失效判定（列宽或高度相关
      主题维度签名变化 → 整体重建；仅颜色变化的暗色切换不失效）+ 估高结果混入
      已精算真值（估高 = 下界 ≤ 精算），rebuild 后未变行保持精确高度，totalHeight
      不因 rebuild 回缩（#15 单调性） */
  function applyMeasuredHeightCache (heights, rows, colWidths, snapshot) {
    const heightSig =
      `${colWidths.join(',')}|${snapshot.fontSize}|${snapshot.fontFamily}` +
      `|${snapshot.rowHeight}|${snapshot.cellPadding}|${snapshot.cellLineHeight}`

    if (heightSig !== measuredHeightsSig) {
      measuredRowHeights = new WeakMap()
      measuredHeightsSig = heightSig
    }

    for (let i = 0; i < heights.length; i++) {
      const measured = measuredRowHeights.get(rows[i])

      if (measured > heights[i]) heights[i] = measured
    }
  }

  /** 统一布局重算入口（A2 relayout()）：探针尺寸 → 变高候选全量快速估高 + 几何
      重建/升级 → sticky/spacer 尺寸 → 列宽求解 → canvas 物理尺寸 → 可视窗口 →
      整幅重绘。估高需 contentWidth（列宽），先按 uniform 口径解一次列宽再带几何
      重算（solveWidths 纯函数，重复求解成本可忽略） */
  function relayoutAndRedraw () {
    const el = scrollEl.value

    if (!el || !themeWatcher) return

    const snapshot = themeWatcher.snapshot
    const base = {
      columns: preparedColumns.value,
      rowCount: displayRows.value?.length ?? 0,
      containerWidth: el.clientWidth,
      containerHeight: el.clientHeight,
      fixedLeftColumns: props.fixedLeftColumns ?? 0,
      // 探针读取失败（变量未定义）时回退 table.scss 镜像缺省（兜底在消费方）
      rowHeight: snapshot.rowHeight || 36,
      headHeight: snapshot.headHeight || 36,
      scrollTop: el.scrollTop,
      scrollLeft: el.scrollLeft,
      widthOverrides
    }

    let next = computeLayout(base)

    // A2.2 模式判定（数据 + 列双输入，只升不降）：文本呈现列 maxLines>1 /
    // multiline 配置存在（列输入）或估高扫描发现数组值/多条目（数据输入）→
    // variable；估高扫描在 records/columns 变更时运行（uniform 未变时跳过全量扫描）
    const wantVariable = rowGeometryMode.value === 'variable' || isVariableCandidate()
    const scanDirty =
      wantVariable || lastScanRecords !== displayRows.value || lastScanColumns !== wiredColumns.value

    if (scanDirty) {
      lastScanRecords = displayRows.value
      lastScanColumns = wiredColumns.value

      // A2.2 管线 1：全量快速估高（O(n) 纯算术，数组值/link 条目计数真值、
      // 字符串估 1 行下界）；hasArrayValues 为模式判定输入
      const { heights, hasArrayValues } = computeRowHeights({
        records: displayRows.value,
        columns: wiredColumns.value,
        colWidths: next.colWidths,
        theme: snapshot,
        measure: measureFn,
        wrapCache: wrapCacheObj,
        treeIndents: treeIndentsOf()
      })

      if (wantVariable || hasArrayValues) {
        rowGeometryMode.value = 'variable'

        // A2.4：失效判定 + 估高混入已精算真值（applyMeasuredHeightCache 内联注释）
        applyMeasuredHeightCache(heights, displayRows.value ?? [], next.colWidths, snapshot)

        if (!variableGeometry || variableGeometry.rowCount !== base.rowCount) {
          variableGeometry = createVariableRowGeometry({ initialHeights: heights })
        } else {
          // 行集合不变（调宽/主题失效重估）→ Fenwick 整体重建 O(n)
          variableGeometry.rebuild(heights)
        }

        next = computeLayout({ ...base, rowGeometry: variableGeometry })
      }
    }

    layout.value = next

    yOverflowed.value = next.contentHeight > next.stickyHeight + 0.5
    yScrolled.value = next.scrollTop > 0.5
    yScrolledEnd.value =
      yScrolled.value && next.contentHeight - next.scrollTop - next.stickyHeight < 1

    syncCanvasSize(next.stickyWidth, next.stickyHeight)
    redraw()
  }

  // 滚动路径不重跑 solveWidths（G1-b 契约）：直接以现有 colLefts 重算可视窗口
  function recomputeViewWindows () {
    const el = scrollEl.value
    const cur = layout.value

    if (!el || !cur) return

    const scrollTop = el.scrollTop
    const scrollLeft = el.scrollLeft

    layout.value = {
      ...cur,
      scrollTop,
      scrollLeft,
      viewRows: computeViewRows({
        scrollTop,
        viewH: cur.viewH,
        rowHeight: cur.rowHeight,
        rowCount: displayRows.value?.length ?? 0,
        rowGeometry: cur.rowGeometry
      }),
      viewCols: computeViewCols({
        scrollLeft,
        viewW: cur.viewW,
        colLefts: cur.colLefts,
        fixedLeftColumns: cur.fixedCount
      })
    }
  }

  /** 进窗精算（A2.2 管线 2，滚动帧调用）：可视窗口 ±OVERSCAN 逐行
      ensureRowMeasured → updateHeight → Δ 累计滚动锚定（scrollTop 一次补偿写入）
      → contentHeight/spacer 同步。uniform 模式零成本跳过 */
  function remeasureVisibleRows () {
    const cur = layout.value
    const el = scrollEl.value

    if (!cur || !el || rowGeometryMode.value !== 'variable' || !variableGeometry) return

    const rows = displayRows.value ?? []
    const { start, end } = variableGeometry.visibleRange(el.scrollTop, cur.viewH, OVERSCAN)
    const anchorRow = variableGeometry.offsetToRow(el.scrollTop)
    const prevTopAtAnchor = variableGeometry.topAt(anchorRow)
    let delta = 0

    for (let row = start; row < end; row++) {
      const height = ensureRowMeasured({
        record: rows[row],
        recordNumber: (props.recordsOffset || 0) + row + 1,
        columns: wiredColumns.value,
        colWidths: cur.colWidths,
        theme: themeWatcher?.snapshot,
        measure: measureFn,
        wrapCache: wrapCacheObj,
        treeIndents: treeIndentsOf(),
        row
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

    layout.value = {
      ...layout.value,
      contentHeight: cur.headHeight + totalHeight,
      spacerHeight: Math.max(0, cur.headHeight + totalHeight - cur.stickyHeight)
    }
  }

  // —— 滚动 / 尺寸响应 ——

  const scrollFrame = createFrameScheduler(() => {
    remeasureVisibleRows()
    recomputeViewWindows()
    redraw()
  })

  function onScroll () {
    const el = scrollEl.value

    if (!el) return

    // 滚动即提交（A6，kaka SELECTED_CELL/SCROLL 同语义）
    editor.commit()

    yScrolled.value = el.scrollTop > 0.5
    yScrolledEnd.value =
      yScrolled.value && el.scrollHeight - el.scrollTop - el.clientHeight < 1

    // rAF 合帧：同帧多次 scroll 只重绘一次（A3）
    scrollFrame.schedule()
  }

  const onResize = throttle(100, () => {
    if (scrollEl.value) relayoutAndRedraw()
  }, { noLeading: true })

  // —— 编辑器（G2-c 契约；触发点 = 单击，A5.2） ——

  const editor = createEditorController({
    onCommit ({ record, recordIndex, column, value }) {
      emit('update:cell-value', { record, recordIndex, column, value })

      // A3 数据契约①：父级在事件处理器内同步就地改 record 后，nextTick 重绘该行；
      // 多行列含行高重估 + 锚定，值形态变数组且当前 uniform 时触发模式升级（A2.2）
      nextTick(() => {
        remeasureRow(recordIndex)
        painter?.invalidateRow(recordIndex)
      })
    }
  })

  /** 单行行高重估（A2.2 契约①）：variable 模式单行精算 + updateHeight + 锚定 +
      布局同步；uniform 模式判定该行是否引入数组值/多条目 → 模式升级 + 全量重估 */
  function remeasureRow (row) {
    const cur = layout.value
    const rows = displayRows.value

    if (!cur || !rows || row < 0 || row >= rows.length) return

    if (rowGeometryMode.value !== 'variable') {
      const { hasArrayValues } = computeRowHeights({
        records: [rows[row]],
        columns: wiredColumns.value,
        colWidths: cur.colWidths,
        theme: themeWatcher?.snapshot,
        measure: measureFn,
        wrapCache: wrapCacheObj,
        treeIndents: treeIndentsOf()
      })

      if (hasArrayValues) {
        rowGeometryMode.value = 'variable'
        relayoutAndRedraw()
      }

      return
    }

    const el = scrollEl.value
    const geometry = variableGeometry

    if (!el || !geometry) return

    const anchorRow = geometry.offsetToRow(el.scrollTop)
    const prevTopAtAnchor = geometry.topAt(anchorRow)
    const height = ensureRowMeasured({
      record: rows[row],
      recordNumber: (props.recordsOffset || 0) + row + 1,
      columns: wiredColumns.value,
      colWidths: cur.colWidths,
      theme: themeWatcher?.snapshot,
      measure: measureFn,
      wrapCache: wrapCacheObj,
      treeIndents: treeIndentsOf(),
      row
    })

    // 精算真值入缓存（A2.4，按 record 引用为键）
    measuredRowHeights.set(rows[row], height)

    if (!geometry.updateHeight(row, height)) return

    // 锚定补偿 + contentHeight/spacer 同步（同帧批次内一次写入）
    const shift = computeAnchorShift({
      prevTopAtAnchor,
      nextTopAtAnchor: geometry.topAt(anchorRow)
    })

    if (shift) el.scrollTop += shift

    const totalHeight = geometry.totalHeight

    layout.value = {
      ...cur,
      contentHeight: cur.headHeight + totalHeight,
      spacerHeight: Math.max(0, cur.headHeight + totalHeight - cur.stickyHeight)
    }
  }

  // —— 指针交互（A5；决策函数来自 interactions.js，本壳执行 emit 与状态更新） ——

  const clickGuard = createClickGuard()

  function pointOf (event) {
    const rect = canvasEl.value.getBoundingClientRect()

    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function hitAt (event) {
    const cur = layout.value

    if (!cur) return null

    const { x, y } = pointOf(event)

    return {
      point: { x, y },
      hit: hitTest({
        x,
        y,
        headHeight: cur.headHeight,
        scrollTop: cur.scrollTop,
        scrollLeft: cur.scrollLeft,
        colLefts: cur.colLefts,
        colWidths: cur.colWidths,
        rowHeight: cur.rowHeight,
        rowCount: displayRows.value?.length ?? 0,
        rowGeometry: cur.rowGeometry,
        columns: wiredColumns.value,
        fixedLeftColumns: cur.fixedCount,
        resizable: props.resizable,
        cellPadding: themeWatcher?.snapshot?.cellPadding
      })
    }
  }

  function updateHover (hit) {
    const next =
      hit && !hit.isHeader && hit.colIndex >= 0 && hit.rowIndex >= 0
        ? { row: hit.rowIndex, col: hit.colIndex }
        : null
    const prev = hover.value

    if (
      (prev == null) === (next == null) &&
      (prev == null || (prev.row === next.row && prev.col === next.col))
    ) return

    hover.value = next
    syncPaintState()

    // hover 变化仅脏带重绘（A3）：行带/列带/单格，各区域独立同步应用
    const mode = props.hoverMode || 'row'

    if (mode !== 'none') {
      for (const pos of [prev, next]) {
        if (!pos) continue

        if (mode === 'row' || mode === 'cross') invalidate({ rows: [pos.row, pos.row + 1] })
        if (mode === 'column' || mode === 'cross') invalidate({ cols: [pos.col, pos.col + 1] })
        if (mode === 'cell') invalidate({ cell: pos })
      }
    }
  }

  function onPointerMove (event) {
    const result = hitAt(event)

    if (!result) return

    // hover 感知（A5.3 / 评审 6 P3）：context 提供树槽 pointer 与可编辑格 text 判定
    cursor.value = resolveCursor(result.hit, wiredColumns.value, {
      flatInfo: flatRows.value,
      editable: props.editable,
      isCellEditableFn: cellEditableOf
    })

    updateHover(result.hit)
  }

  function onPointerLeave () {
    cursor.value = 'default'
    updateHover(null)
  }

  function onPointerDown (event) {
    const result = hitAt(event)

    if (!result) return

    const decision = resolvePointerdown({ editing: editor.state.editing, hit: result.hit })

    // editing 中画布 pointerdown 先同步提交再续行命中（A6 画布侧隔离：
    // 点击其他单元格一步完成「提交 + 选中新行」）
    if (decision.commitEditing) editor.commit()
    if (decision.startResize) startResize(event, result.hit)
  }

  function runEvents (events) {
    for (const ev of events) emit(ev.name, ...ev.args)
  }

  function onClick (event) {
    // 拖拽误触抑制：拖拽后紧随的 click 丢弃（A5 / decisions「[I1 前]⑧」）
    if (clickGuard.consume()) return

    const result = hitAt(event)

    if (!result) return

    const { hit } = result
    const col = hit.colIndex >= 0 ? wiredColumns.value[hit.colIndex] : null

    if (hit.isHeader) {
      if (col) {
        runEvents(
          resolveHeaderClick({
            column: col,
            headerChecked: props.headerChecked,
            orderBy: props.orderBy
          }).events
        )
      }

      return
    }

    const record = displayRows.value?.[hit.rowIndex]

    if (!col || record == null) return

    // A4.3 序 2：树箭头槽 toggle（局部交互，不选中行、不发 cell-click）
    if (props.tree && flatRows.value) {
      const toggle = resolveTreeToggle({
        hit,
        columns: wiredColumns.value,
        flatInfo: flatRows.value,
        recordKey: resolveRecordKey(record)
      })

      if (toggle) {
        applyTreeToggle(toggle.key)

        return
      }
    }

    // A4.3 序 3：条目命中（link/tag/button，含 dots '...'）→ cell-item-click，
    // 随后完整续行序 4（对齐 DOM a/span 点击冒泡 td）
    const item = resolveItemClick({ hit, itemHits: paintState.itemHits })

    if (item) emitCellItemClick(item, record, col, hit.rowIndex)

    // check 列 disabled/value 从单元格 items attrs 读取（G2-b 契约，与 drawCheck 同款判定）
    let disabled = false
    let value

    if (col._raw?.type === 'check') {
      const content = resolveCellContent(col, {
        record,
        recordNumber: (props.recordsOffset || 0) + hit.rowIndex + 1,
        emit
      })
      const attrs = Array.isArray(content.items) ? content.items[0]?.attrs : null

      disabled = attrs?.disabled != null && attrs?.disabled !== false
      value = attrs?.['data-checked'] ?? false
    }

    const { events, toggled } = resolveCellClick({
      record,
      recordIndex: hit.rowIndex,
      column: col,
      recordKey: resolveRecordKey(record),
      selectedRecordKey: selectedKey.value,
      selectedRecord: props.selectedRecord,
      disabled,
      value
    })

    runEvents(events)

    // check 翻转后 nextTick 重绘该行（A3 数据契约①）
    if (toggled) nextTick(() => painter?.invalidateRow(hit.rowIndex))

    // A4.3 序 4 / A5.2：单击进编辑——先发完整选中/cell-click 链再开编辑，
    // 父级一次收到全部事件，选中态与编辑态一致
    if (resolveCellClickOpen({ hit, cellEditable: cellEditableOf(col) }).openEditor) {
      openEditorAt(hit, record, col)
    }
  }

  /**
   * cell-item-click 派发（A1/A3.3，payload 对齐 DOM 版 + canvas 附加 recordIndex）：
   * - link/tag：经列类型 render 产物的 events.click 取 DOM 版同源 payload
     （dots 条目值 = '...'、常规条目 = 条目对象——link 对象数组元素即原引用），
     外包 recordIndex；
   * - button（canvas 专属 render 产物，无 DOM events 通道）：payload = buttons[index]
     配置对象；
   * - disabled 条目只续链不发 item 事件（A8 #12 注，约束 7 存在性判定与绘制侧一致）。
   */
  function emitCellItemClick (item, record, col, row) {
    const raw = col._raw ?? col
    const recordNumber = (props.recordsOffset || 0) + row + 1

    if (item.kind === 'button') {
      const value = col._value?.(record) ?? (col.field != null ? record?.[col.field] : undefined)
      const produced = col._render?.({ record, recordNumber, value, emit })
      const button = produced?.buttons?.[item.index]

      if (button != null && !isDisabledAttr(button.disabled)) {
        emit('cell-item-click', { record, column: raw, button, recordIndex: row })
      }

      return
    }

    const wrappedEmit = (name, payload) => {
      if (name === 'cell-item-click') {
        emit('cell-item-click', { ...payload, recordIndex: row })
      } else {
        emit(name, payload)
      }
    }

    const content = resolveCellContent(col, { record, recordNumber, emit: wrappedEmit })
    const items = Array.isArray(content.items) ? content.items : null
    const domItem = items?.[item.index]

    if (domItem && !isDisabledAttr(domItem.attrs?.disabled)) {
      // dots payload（A1/A3.3，评审 6 P4）：DOM render 自产 dots（linkOption.max /
      // tagOption.max，item.text === '...'）与 canvas 侧 maxItems 截断 dots
      // （渲染条目数 > _maxItems 时第 _maxItems 条为绘制层省略条目）payload 值
      // 同为 '...'；常规条目 = 条目对象（link 对象数组元素即原引用）
      const maxItems = col._maxItems ?? 10
      const canvasCappedDots = items.length > maxItems && item.index === maxItems - 1

      if (canvasCappedDots || domItem.text === '...') {
        emit('cell-item-click', { record, column: raw, [item.kind]: '...', recordIndex: row })
      } else {
        domItem.events?.click?.()
      }
    }
  }

  /** disabled 存在性判定（实施约束 7：与 G2 绘制侧 linkTextColorOf 同一谓词） */
  function isDisabledAttr (disabled) {
    return disabled != null && disabled !== false
  }

  /** 单击进编辑（A5.2/A5.5）：style 按 A5.4 内容区矩形（border/编辑器类型分支），
      editorType 判定用开值形态与 _resolveMaxLines(record) 行级求值 */
  function openEditorAt (hit, record, col) {
    const cur = layout.value

    if (!cur) return

    const rawValue = col._value?.(record) ??
      (col.field != null ? record?.[col.field] : undefined)
    const editorType = resolveEditorType(col, { rawValue, record })
    const border = isObjectEditor(col.editor) ? col.editor.border !== false : true
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
      theme: themeWatcher?.snapshot,
      editorType,
      border
    })

    const opened = editor.open({
      column: col,
      record,
      recordIndex: hit.rowIndex,
      editable: props.editable,
      style: toPxStyle(editorStyle),
      bordered: editorStyle.bordered,
      getEditorEl: () => editorEl.value
    })

    if (opened) focusEditor()
  }

  /** column.editor 为对象形态时读取 border（true 形态按缺省 true） */
  function isObjectEditor (editor) {
    return editor != null && typeof editor === 'object'
  }

  /** 编辑器聚焦（A5.5 打开流程）：渲染完成后 input/select/date 聚焦内部真实 input，
      textarea 聚焦 textarea 元素，switch 聚焦 __editor 容器（tabindex=-1 承接 esc）。
      focus() 会把最近的可滚动祖先滚出溢出量——__overlay 为 overflow:hidden 亦可被
      程序化滚动（宽表格浮层超出视口右缘时 scrollLeft 被滚到 83 等值，浮层相对画布
      漂移），聚焦后复位浮层容器滚动 */
  function focusEditor () {
    nextTick(() => {
      const el = editorEl.value
      const editing = editor.state.editing

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

  // —— 列宽拖拽（A5；widthOverrides 存放见组件壳顶部说明） ——

  function startResize (event, hit) {
    const colIndex = hit.resizeCol
    const col = preparedColumns.value[colIndex]
    const cur = layout.value

    if (!col || !cur) return

    clickGuard.arm()

    const canvasRect = canvasEl.value.getBoundingClientRect()
    const containerWidth = cur.stickyWidth
    let lastWidth = cur.colWidths[colIndex]

    const onMove = ev => {
      const base = layout.value

      if (!base) return

      const width = resolveResizeWidth({
        pointerX: ev.clientX - canvasRect.left,
        scrollLeft: base.scrollLeft,
        columnLeft: base.colLefts[colIndex],
        // 拖拽下限（评审 6 P2）：col.minWidth 显式值 > 类型最小宽 > 40 兜底
        // （真正 clamp 在 resolveResizeWidth 内，A4.1）
        minWidth: getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH,
        maxWidth: getPixelNumber(col.maxWidth)
      })

      if (width === lastWidth) return

      lastWidth = width

      // move 中不重跑 solveWidths（A5 防其他列抖动）：暂存 override 并临时更新列几何
      widthOverrides[col._key] = width

      applyOverrideGeometry(colIndex, width, base)

      // 参考线 = 拖拽列右缘视口 x（overlay 覆盖层绘制）
      resizeGuideX.value = base.colLefts[colIndex] + width - base.scrollLeft

      // move 脏区：该列左缘至视口右端竖带 + 表头整幅（A3 重绘表 / 评审 M9）
      invalidate({ colFrom: colIndex })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      // pointerup 后延时清除残留 flag（decisions「[I1 前]⑧」）
      clickGuard.release()

      resizeGuideX.value = null

      // up：emit → relayout（拖拽列显式定宽〔overrides 已写入〕，
      // 其余未定宽列重跑求解重新瓜分剩余空间，A3/A5）
      emit('column-resize', { column: col._raw, width: lastWidth })
      relayoutAndRedraw()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  /** move 中临时更新列几何：被拖列改宽后仅重算前缀和与 spacer，不重跑宽度求解 */
  function applyOverrideGeometry (colIndex, width, base) {
    const colWidths = base.colWidths.slice()

    colWidths[colIndex] = width

    const { colLefts, colsWidth } = computePrefixSums(colWidths)

    layout.value = {
      ...base,
      colWidths,
      colLefts,
      colsWidth,
      contentWidth: colsWidth,
      spacerWidth: Math.max(colsWidth, base.stickyWidth)
    }
  }

  // —— 行定位辅助（选中横带 / scrollToRecord；树模式下在平铺行数组内查找） ——

  /** 行 key 字段名：树模式 = 树 key 字段，普通模式 = keyField */
  function keyNameOf () {
    return props.tree ? treeOptions.value.key : props.keyField
  }

  function findRowByKey (key) {
    if (key == null) return -1

    const rows = displayRows.value ?? []
    const keyName = keyNameOf()

    if (keyName != null) {
      return rows.findIndex(rec => rec?.[keyName] === key)
    }

    return rows.findIndex(rec => genRecordKey(rec) === key)
  }

  // —— 树展开操作（A1 方法 / A2.4 watch 契约） ——

  /** defaultExpandLevel 初始解析（约束 9）：首次入场 + tree 关闭→开启首开 +
      treeProps 变化时调用；treeExpandedKeys 受控非空时经
      resolveInitialExpandedKeys 直接取 prop（受控优先） */
  function resolveInitialExpansion () {
    if (!props.tree) return

    const { key, parentKey } = treeOptions.value

    treeExpanded.value = new Set(resolveInitialExpandedKeys({
      treeExpandedKeys: props.treeExpandedKeys,
      defaultExpandLevel: props.defaultExpandLevel,
      records: props.records,
      keyOf: record => record?.[key],
      parentKeyOf: record => record?.[parentKey],
      childrenIndex: childrenIndex.value
    }))
  }

  /** 树箭头 toggle（A2.4 联动链）：行号语义失效先提交（commit 幂等）→
      toggle + emit → 平铺重建（displayRows computed 失效）→ 全量估高 + 几何
      rebuild + spacer + 锚定（视口首行内容保持）+ 整幅重绘 */
  function applyTreeToggle (key) {
    const el = scrollEl.value
    const cur = layout.value
    let anchor = null

    if (el && cur) {
      const geometry = cur.rowGeometry
      const row = geometry.offsetToRow(el.scrollTop)

      anchor = { record: displayRows.value?.[row], top: geometry.topAt(row) }
    }

    editor.commit()

    treeExpanded.value = toggleKey(treeExpanded.value, key)
    emit('update:tree-expanded-keys', [...treeExpanded.value])

    relayoutAndRedraw()

    if (anchor && el && layout.value) {
      const row = (displayRows.value ?? []).indexOf(anchor.record)

      if (row >= 0) {
        const shift = layout.value.rowGeometry.topAt(row) - anchor.top

        if (shift) el.scrollTop += shift
      }
    }

    // 锚定补偿写入后以最终 scrollTop 同步窗口并重绘（不等下一帧 scroll 事件）
    recomputeViewWindows()
    redraw()
  }

  /** 展开全部（A1：等价展开集 = 全部有子节点 key） */
  function expandAll () {
    if (!props.tree || !childrenIndex.value) return

    editor.commit()
    treeExpanded.value = new Set(childrenIndex.value.hasChildren)
    emit('update:tree-expanded-keys', [...treeExpanded.value])
    relayoutAndRedraw()
  }

  /** 收起全部（A1：清空展开集） */
  function collapseAll () {
    editor.commit()
    treeExpanded.value = new Set()
    emit('update:tree-expanded-keys', [])
    relayoutAndRedraw()
  }

  /** 当前展开 key 数组（A1：调试/受控回读） */
  function getTreeExpandedKeys () {
    return [...treeExpanded.value]
  }

  // —— 暴露方法（A1） ——

  function scrollToRecord (keyOrIndex) {
    const rows = displayRows.value ?? []
    const keyName = keyNameOf()
    let row = -1

    // keyField 值优先，退化为行号
    if (keyName != null) {
      row = rows.findIndex(rec => rec?.[keyName] === keyOrIndex)
    }

    if (row < 0) {
      const index = Number(keyOrIndex)

      row = Number.isInteger(index) && index >= 0 && index < rows.length ? index : -1
    }

    const el = scrollEl.value
    const cur = layout.value

    if (row < 0 || !el || !cur) return false

    // 不可见时置于视口顶部：行顶对准表头下缘（变高模式 top 经 rowGeometry.topAt）
    const top = Math.min(
      Math.max(cur.rowGeometry.topAt(row), 0),
      Math.max(0, cur.contentHeight - cur.stickyHeight)
    )

    el.scrollTo({ top, behavior: 'instant' })

    return true
  }

  /** 手动重读 --mu-* 变量并 relayout + 整幅重绘（暗色感知兜底 / 尺寸变量覆盖生效通道） */
  function refreshTheme () {
    themeWatcher?.refresh()
  }

  /** 契约⑤（评审 6 P9 / A2.2 主题·字号·行高变量刷新通道）：theme.js 仅发信号，
      重估链全部在壳——wrap 缓存失效 + 全量快速重估 + rebuild（relayoutAndRedraw 内）
      + 锚定补偿 + 窗口重精算（remeasureVisibleRows 内）+ 窗口同步重绘 */
  function onThemeChange () {
    const el = scrollEl.value
    let anchor = null

    // 锚定基准在 rebuild 重估前捕获（旧几何 topAt；主题变化不改行集合，行号不变）
    if (rowGeometryMode.value === 'variable' && variableGeometry && el) {
      const row = variableGeometry.offsetToRow(el.scrollTop)

      anchor = { row, top: variableGeometry.topAt(row) }
    }

    // wrap 缓存失效：key 含 text+font+width+maxLines，主题变化后旧条目不再命中，
    // 整体重建清掉死权重
    wrapCacheObj = createWrapCache()

    relayoutAndRedraw()

    if (anchor && variableGeometry && el) {
      const shift = variableGeometry.topAt(anchor.row) - anchor.top

      if (shift) el.scrollTop += shift
    }

    remeasureVisibleRows()
    recomputeViewWindows()
    redraw()
  }

  function getLayoutInfo () {
    const cur = layout.value

    if (!cur) return null

    return {
      colWidths: cur.colWidths.slice(),
      contentWidth: cur.contentWidth,
      contentHeight: cur.contentHeight,
      rowHeight: cur.rowHeight,
      headHeight: cur.headHeight,
      viewRows: { ...cur.viewRows },
      rowGeometryMode: rowGeometryMode.value,
      lastPaint: painter?.lastPaint ? { ...painter.lastPaint } : null
    }
  }

  /** 主题快照（G0 偏离 4 契约）：直接返回 watcher.snapshot（getter，随 refresh 更新） */
  function getThemeSnapshot () {
    return themeWatcher?.snapshot ?? null
  }

  /** 坐标辅助（decisions「[I1 前]②」）：单元格视口矩形 + 页面坐标，供 playwright
      page.mouse 坐标级交互换算；未挂载返回 null */
  function getCellRect (row, col) {
    const canvas = canvasEl.value
    const cur = layout.value

    if (!canvas || !cur) return null

    const base = canvas.getBoundingClientRect()
    const cell = cellRectAt(cur, row, col)

    return {
      left: base.left + cell.x,
      top: base.top + cell.y,
      width: cell.width,
      height: cell.height,
      x: cell.x,
      y: cell.y
    }
  }

  defineExpose({
    scrollToRecord,
    refreshTheme,
    getLayoutInfo,
    getThemeSnapshot,
    getCellRect,
    expandAll,
    collapseAll,
    getTreeExpandedKeys
  })

  // —— 渲染 props watch（A3 重绘表） ——

  // records 引用变化：滚动复位 → relayout → 整幅重绘（A2，table.vue 同款 watch）
  watch(() => props.records, (newValue, oldValue) => {
    if (newValue === oldValue) return

    scrollEl.value?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    relayoutAndRedraw()
  })

  // columns 引用变化：清空拖拽宽度覆盖（G1-b 契约）→ 列准备（computed 依赖）→ relayout；
  // 列定义变化（maxLines/maxItems/类型）改变行高语义 → 行高缓存签名置空，
  // 下次 relayout 重建（缓存键为 record 引用，不含列定义维度）
  watch(() => props.columns, () => {
    for (const key of Object.keys(widthOverrides)) delete widthOverrides[key]
    measuredHeightsSig = null
    relayoutAndRedraw()
  })

  // 数据版本：异步就地修改 records 后的通知通道 → 整幅重绘（A3 数据契约②）
  watch(() => props.recordsVersion, () => redraw())

  // 渲染 props → 整幅重绘；placeholder 已进列准备（computed 依赖），同走整幅
  watch(
    () => [
      props.gridlines,
      props.hoverMode,
      props.striped,
      props.orderBy,
      props.recordsOffset,
      props.placeholder
    ],
    () => redraw()
  )

  // headerChecked 受控变化 → 表头区整幅（受控 ✓ 状态变化即重绘）
  watch(() => props.headerChecked, () => invalidate({ header: true }))

  // 选中变化（selectedRecordKey/selectedRecord/keyField 经 selectedKey 汇聚）→
  // 旧/新选中行两条横带
  watch(selectedKey, (newValue, oldValue) => {
    for (const key of new Set([oldValue, newValue])) {
      const row = findRowByKey(key)

      if (row >= 0) invalidateRow(row)
    }
  })

  // fixedLeftColumns → relayout（固定区宽度 / viewW 口径变化）
  watch(() => props.fixedLeftColumns, () => relayoutAndRedraw())

  // —— 树 watch 契约（A2.4 / 约束 9） ——

  // tree 开/关 → displayRows 切换 records 原序/平铺 + 几何 rebuild + spacer + 锚定 +
  // 整幅重绘；关闭→开启首开重解析展开集（受控 prop 非空时经受控优先直取 prop）。
  // immediate：首布局前解析（首次入场 defaultExpandLevel 解析）
  watch(() => props.tree, (now, before) => {
    if (now && !before) resolveInitialExpansion()
    relayoutAndRedraw()
  }, { immediate: true })

  // treeProps 引用变化 → key/parentKey 字段名变化使既有展开集语义失效 →
  // 清空展开集 + defaultExpandLevel 重解析 → childrenIndex/displayRows 全链重建
  watch(() => props.treeProps, () => {
    if (!props.tree) return

    resolveInitialExpansion()
    relayoutAndRedraw()
  })

  // treeExpandedKeys 受控引用变化 → 覆盖内部 Set → 重建平铺（A2.4）
  watch(() => props.treeExpandedKeys, value => {
    if (value == null) return

    const next = new Set(value)
    const current = treeExpanded.value
    const same = current.size === next.size && [...next].every(k => current.has(k))

    treeExpanded.value = next

    if (!same) relayoutAndRedraw()
  })

  // —— 生命周期 ——

  onMounted(() => {
    painter = createPainter({ canvas: canvasEl.value })

    // 文本测量注入（A2.2）：单实例同时供行高估高/精算与绘制折行（单一事实源）
    measureFn = createTextMeasurer()
    wrapCacheObj = createWrapCache()

    themeWatcher = createThemeWatcher({
      probeHost: stickyEl.value,
      componentRoot: rootEl.value,
      // 主题刷新（暗色切换 / DPR 变化 / refreshTheme）：契约⑤（评审 6 P9）——
      // wrap 缓存失效 + 变高行全量快速重估 + rebuild + 窗口重精算 + 锚定在壳
      // onChange 处理器（relayout 前），theme.js 仅发信号
      onChange: () => onThemeChange()
    })

    // 首帧：canvas 入文档布局后 relayout + 绘制（A2）
    nextTick(relayoutAndRedraw)
  })

  onUnmounted(() => {
    editor.destroy()
    themeWatcher?.destroy()
    painter?.dispose()
    scrollFrame.cancel()
    onResize.cancel()
  })
</script>
