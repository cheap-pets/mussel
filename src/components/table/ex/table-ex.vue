<template>
  <div
    ref="rootEl"
    class="mu-table-ex"
    :class="wrapClass">
    <div
      ref="scrollEl"
      v-mu-scrollbar
      class="mu-table-ex__scroll"
      @scroll="onScroll"
      @sizechange="onResize">
      <!-- 指针交互监听层（A4.3 click 单一入口：树槽 → 条目 → 编辑 → 选中链）；
           v-mu-scrollbar 注入的 .mu-scrollbar__tracks 经 insertBefore 成为 __scroll 首子元素 -->
      <div
        ref="stickyEl"
        class="mu-table-ex__sticky"
        :style="stickyStyle"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
        @pointerdown="onPointerDown"
        @click="onClick">
        <canvas ref="canvasEl" class="mu-table-ex__canvas" />
        <div class="mu-table-ex__overlay">
          <div class="mu-table-ex__header-shadow" />
          <div class="mu-table-ex__bottom-shadow" />
          <div v-if="isEmpty" class="mu-table-ex__empty">
            <slot name="empty">
              {{ emptyText }}
            </slot>
          </div>
          <!-- 编辑浮层（A5/A6）：分类型 v-on 合成、容器 tabindex=-1 承接 esc；
               bordered === false 挂 --borderless；画布侧 pointerdown 先提交再续行。
               textarea 须渲染真实元素（<component :is> 下 v-model 失效，memo 约定） -->
          <div
            v-if="editor.state.editing"
            ref="editorEl"
            class="mu-table-ex__editor"
            :class="{ 'mu-table-ex__editor--borderless': editor.state.editing.bordered === false }"
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
              :is="editor.state.editing.component"
              v-else
              v-model="editor.state.editing.value"
              :invalid="editor.state.editing.invalid || null"
              v-bind="editor.state.editing.props"
              v-on="editor.state.editing.events" />
          </div>
        </div>
      </div>
      <div ref="spacerEl" class="mu-table-ex__spacer" :style="spacerStyle" />
    </div>
  </div>
</template>

<script setup>
  import { computed, nextTick, onMounted, onUnmounted, shallowRef, watch, ref } from 'vue'
  import { throttle } from 'throttle-debounce'

  import { autoIncrementKeyBuilder } from '@/utils/key-builder'
  import { warn } from '@/utils/warn'

  import { resolveSelectedKey } from '../utils'

  import { createThemeWatcher, createTextMeasurer } from './theme'
  import { createWrapCache } from './text-wrap'
  import { createRowGeometryController } from './row-geometry-controller'
  import { useTreeRows } from './use-tree-rows'
  import { useColumnResize } from './use-column-resize'
  import { buildSpans, regionAt, resolveSpanCell, spanRectOf } from './spans'
  import { computeViewCols, computeViewRows, relayout as computeLayout } from './layout'
  import { prepareColumn, resolveCellContent } from './cell-painters'
  import { cellRectAt, createPainter } from './painter'

  import {
    createFrameScheduler,
    hitTest,
    resolveCellClick,
    resolveCellClickOpen,
    resolveCursor,
    resolveHeaderClick,
    resolveItemClick,
    resolvePointerdown,
    resolveTreeToggle
  } from './interactions'

  import {
    computeEditorStyle,
    createEditorController,
    editorButtonRectOf,
    isCellEditable,
    resolveEditorType
  } from './editor'

  import './table-ex.scss'

  defineOptions({ name: 'MusselTableEx' })

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
    // —— 合并单元格（02-design.md §2.3 入口 B）——
    // (info) => Record<string, number | { rowspan?, colspan? | 'rest' }> | null，
    // 每行调用一次返回该行作为主行的声明；列级入口 autoRowSpan 配在列定义上
    spanMethod: { type: Function, default: null },
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

  // 列准备（table.vue internalColumns 等价物）：columns 变化即重建；
  // _key 经 genColumnKey WeakMap 记忆，列对象不变则键稳定（widthOverrides 定位键）
  // placeholder 不进此依赖：绘制期第三级兜底，切换占位只整幅重绘不重建列
  const preparedColumns = computed(() =>
    props.columns.map(el => {
      const col = prepareColumn(el)

      col._key = el.key ?? genColumnKey(el)

      return col
    })
  )

  const layout = shallowRef(null)

  // —— 树接线（A2.4，C1 拆出 use-tree-rows）：childrenIndex/flatRows/displayRows/
  // wiredColumns/缩进回调/toggle + 三条树 watch。
  // immediate tree watch 在 setup 期触发 relayout，scrollEl 未挂载早退，无顺序问题 ——

  const {
    treeExpanded,
    treeOptions,
    flatRows,
    displayRows,
    wiredColumns,
    treeIndentsOf,
    applyTreeToggle,
    expandAll,
    collapseAll,
    getTreeExpandedKeys
  } = useTreeRows({
    props,
    emit,
    getPreparedColumns: () => preparedColumns.value,
    commit: () => editor.commit(),
    relayout: () => relayoutAndRedraw(),
    recomputeViewWindows,
    redraw,
    getScrollEl: () => scrollEl.value,
    getLayout: () => layout.value
  })

  // —— 合并单元格（02-design.md §4）：SpansIndex computed，无合并恒 null（快路径） ——
  // 依赖：displayRows（records 引用/树展开收起）、wiredColumns（列集变化）、
  // spanMethod 引用、recordsVersion（就地改值通道）、orderBy（防御：父级只改
  // orderBy 未替换 records 引用时仍重算）。列宽调整 / 行高精算 / hover 不依赖，
  // 不重算，仅重绘（声明与几何解耦，§2.1）

  /** 构建期 dev 警告出口（utils/warn once 去重；自检经 buildSpans warn 参数注入捕获） */
  function devWarn (message) {
    warn({ component: 'table-ex', message })
  }

  const spans = computed(() => {
    void props.recordsVersion

    return buildSpans({
      records: displayRows.value,
      columns: wiredColumns.value,
      spanMethod: props.spanMethod,
      flatInfo: flatRows.value,
      fixedCount: props.fixedLeftColumns ?? 0,
      recordsOffset: props.recordsOffset,
      orderBy: props.orderBy,
      warn: devWarn
    })
  })

  // —— 行几何策略（A2.2，C1 拆出 row-geometry-controller）：uniform/variable
  // 双模式几何、估高扫描输入签名（scanSignature）、精算缓存失效签名
  // （measureSignature）、进窗精算/单行重估与锚定补偿 ——

  const rowGeometry = createRowGeometryController({
    getRows: () => displayRows.value,
    getColumns: () => wiredColumns.value,
    getTreeIndents: () => treeIndentsOf(),
    getRecordsOffset: () => props.recordsOffset,
    getTheme: () => themeWatcher?.snapshot,
    getMeasure: () => measureFn,
    getWrapCache: () => wrapCacheObj,
    getColumnKey: col => genColumnKey(col),
    getSpans: () => spans.value,
    getScrollEl: () => scrollEl.value,
    getLayout: () => layout.value,
    setLayout: next => {
      layout.value = next
    },
    relayout: () => relayoutAndRedraw()
  })

  // —— 列宽拖拽（A5，C1 拆出 use-column-resize）：widthOverrides/clickGuard/
  // startResize + move 临时几何 ——

  const { resizeGuideX, clickGuard, widthOverrides, startResize, resetOverrides } = useColumnResize({
    props,
    emit,
    getPreparedColumns: () => preparedColumns.value,
    getLayout: () => layout.value,
    setLayout: next => {
      layout.value = next
    },
    getCanvasEl: () => canvasEl.value,
    invalidate,
    relayout: () => relayoutAndRedraw()
  })

  // 文本测量实例（onMounted 创建；行高估高/精算与绘制折行单一事实源，A2.2）
  let measureFn = null
  let wrapCacheObj = null

  const selectedKey = computed(() => resolveSelectedKey(props))

  const hover = shallowRef(null)
  // 条目悬停（20261027 问题 7）：{ row, col, kind, index, disabled } | null，
  // onPointerMove 经 resolveItemClick 求值；paintState.hoverItem 在 syncPaintState
  // 以本值归一（hoverMode none 恒 null）
  const hoverItem = shallowRef(null)
  const cursor = ref('default')

  const yScrolled = ref(false)
  const yScrolledEnd = ref(false)
  const yOverflowed = ref(false)

  const isEmpty = computed(() => !props.records?.length)

  const wrapClass = computed(() => ({
    'mu-table-ex--empty': isEmpty.value,
    'mu-table-ex--y-scrolled': yScrolled.value,
    'mu-table-ex--y-scrolled-end': yScrolledEnd.value,
    'mu-table-ex--y-overflowed': yOverflowed.value
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
  // 最近一次 relayout 统计（getLayoutInfo 暴露，调试面板显示）
  let lastRelayout = null
  // veil 编辑格行列（20261027 问题 6）：editor 控制器的 editing 不含 row/col，
  // 行列由壳承载；paintState.editingCell 在 syncPaintState 以本值归一
  let editingCellRef = null

  // painter 持久 state（G2-a 契约：原地变更后 invalidate/draw 即以新状态重绘；
  // paintState 组装扩展（A2.1/A2.2）：displayRows/flatInfo/expandedKeys/
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
    getRecordKey: (record, row) => resolveRecordKey(record),
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
      ? {
        levels: flatRows.value.levels,
        hasChildren: flatRows.value.hasChildren,
        parentKeys: flatRows.value.parentKeys
      }
      : null
    paintState.spans = spans.value
    paintState.expandedKeys = props.tree ? treeExpanded.value : null
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
    paintState.placeholder = props.placeholder
    paintState.hover = hover.value
    // 条目悬停（问题 7）+ veil 编辑格（问题 6）。hoverMode none 总开关归一：
    // 条目 hover 色在表体 pass（drawCell）绘制，不经 paintOverlay 的 hoverMode
    // 门控，切到 none 后（指针不动）须由本处立即置 null
    paintState.hoverItem = props.hoverMode === 'none' ? null : hoverItem.value
    paintState.editingCell = editingCellRef
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

  /** 统一布局重算入口（A2 relayout()）：探针尺寸 → 变高候选全量快速估高 + 几何
      重建/升级 → sticky/spacer 尺寸 → 列宽求解 → canvas 物理尺寸 → 可视窗口 → 整幅重绘。
      估高需 contentWidth（列宽），先按首过几何解一次列宽再带几何重算（纯函数，成本可忽略） */
  function relayoutAndRedraw () {
    const el = scrollEl.value

    if (!el || !themeWatcher) return

    const startedAt = performance.now()
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

    // 首过：以现有几何（变高）/等高几何解列宽；scanDirty 时重建几何再算一次
    let next = computeLayout({ ...base, rowGeometry: rowGeometry.currentGeometry(base) })
    const { geometry, scanCount, rebuild } = rowGeometry.resolveForRelayout({
      colWidths: next.colWidths,
      theme: snapshot
    })

    if (rebuild) next = computeLayout({ ...base, rowGeometry: geometry })

    layout.value = next

    yOverflowed.value = next.contentHeight > next.stickyHeight + 0.5
    yScrolled.value = next.scrollTop > 0.5
    yScrolledEnd.value =
      yScrolled.value && next.contentHeight - next.scrollTop - next.stickyHeight < 1

    syncCanvasSize(next.stickyWidth, next.stickyHeight)
    redraw()

    // relayout 计时（getLayoutInfo 暴露：lastPaint 只覆盖 paint()，本字段补齐
    // 估高扫描/几何重建阶段的可见性，复核 2026-10-26 验证设施缺口）
    lastRelayout = { elapsed: performance.now() - startedAt, scanCount, rebuild }
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

  // —— 滚动 / 尺寸响应 ——

  const scrollFrame = createFrameScheduler(() => {
    rowGeometry.remeasureVisibleRows()
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
        rowGeometry.remeasureRow(recordIndex)
        painter?.invalidateRow(recordIndex)
      })
    }
  })

  // —— 指针交互（A5；决策函数来自 interactions.js，本壳执行 emit 与状态更新；
  //     clickGuard/startResize 来自 use-column-resize） ——

  function pointOf (event) {
    const rect = canvasEl.value.getBoundingClientRect()

    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function hitAt (event) {
    const cur = layout.value

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
      columns: wiredColumns.value,
      fixedLeftColumns: cur.fixedCount,
      resizable: props.resizable,
      cellPadding: themeWatcher?.snapshot?.cellPadding
    })

    // 合并命中归一（§5.4 单一接入点）：covered 格 → 主格坐标（浅拷贝仅改
    // rowIndex/colIndex，cellX/x/y 原样）。归一后 hit 供 resolveCursor /
    // updateHover / updateHoverItem / applyItemCursor / isEditorButtonHit /
    // tryEditorButtonClick / finishCellClick / openEditorAt / resolveItemClick；
    // rawHit 供 resolveTreeToggle（树槽判定用原始 hit，树列不参与归一改写）
    return {
      point: { x, y },
      hit: resolveSpanCell(spans.value, raw),
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
    const prev = hover.value

    if (isSameHover(prev, next)) return

    hover.value = next
    syncPaintState()

    // hover 变化仅脏带重绘（A3）：行带/列带/单格。prev/next 同行（同行内横移、
    // row/cross 模式）或同列时脏带完全重合，按行列号去重后各区域至多一次同步
    // 应用（N1，复核 2026-10-26：同行横移 2 次 → 1 次）
    for (const region of hoverRegions(prev, next, props.hoverMode || 'row')) invalidate(region)
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
    const prev = hoverItem.value
    const next = props.hoverMode === 'none'
      ? null
      : resolveItemClick({ hit, itemHits: paintState.itemHits })

    if (isSameHoverItem(prev, next)) return

    hoverItem.value = next
    paintState.hoverItem = next

    for (const cell of hoverItemCells(prev, next)) invalidate({ cell })
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

    updateHoverItem(result.hit)
    updateHover(result.hit)

    // 光标覆盖（问题 5/7）：resolveCursor 结果先落位，条目 / 编辑按钮区再覆盖
    applyItemCursor(result.hit)
  }

  function onPointerLeave () {
    cursor.value = 'default'
    updateHoverItem(null)
    updateHover(null)
  }

  /** 编辑按钮命中判定（20261027 问题 5）：列配 editorButton.icon 且指针落在
      editorButtonRectOf 区矩形内（半开区间，与 interactions.isItemRectHit 同口径）；
      区矩形 = spanRectOf（合并区域为区域矩形，§5.3），为 painter 绘制与壳命中共用
      的单一事实源 */
  function isEditorButtonHit (hit, col) {
    if (!col?.editorButton?.icon) return false

    const rect = editorButtonRectOf(
      spanRectOf(layout.value, hit.rowIndex, hit.colIndex, spans.value),
      {
        padding: themeWatcher?.snapshot?.cellPadding,
        rowHeight: themeWatcher?.snapshot?.rowHeight
      }
    )

    return (
      hit.x >= rect.x && hit.x < rect.x + rect.width &&
      hit.y >= rect.y && hit.y < rect.y + rect.height
    )
  }

  /** 光标覆盖（问题 5/7）：resolveCursor 结果之后追加判定，仅覆盖表体
      text/default——条目（link/button 且非禁用）与编辑按钮区为 pointer；
      col-resize 手柄与表头 pointer 不覆盖 */
  function applyItemCursor (hit) {
    if (hit.resizeCol >= 0 || hit.isHeader) return

    const item = hoverItem.value

    if (item && !item.disabled && (item.kind === 'link' || item.kind === 'button')) {
      cursor.value = 'pointer'

      return
    }

    const col = hit.colIndex >= 0 ? wiredColumns.value[hit.colIndex] : null

    if (isEditorButtonHit(hit, col)) cursor.value = 'pointer'
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

  /** 编辑按钮派发（20261027 问题 5，局部交互——对齐树槽先例：不选中行、不发
      cell-click、不开编辑，点击行为由用户 editorButton.onClick 定义，column 传
      原始列引用）；命中并派发返回 true */
  function tryEditorButtonClick (hit, record, col) {
    if (!isEditorButtonHit(hit, col)) return false

    col.editorButton.onClick?.({
      record,
      recordIndex: hit.rowIndex,
      column: col._raw ?? col
    })

    return true
  }

  /** 树箭头槽 toggle（A4.3 序 2，局部交互）：命中则应用展开态并返回 true */
  function tryToggleTreeRow (hit, record) {
    if (!props.tree || !flatRows.value) return false

    const toggle = resolveTreeToggle({
      hit,
      columns: wiredColumns.value,
      flatInfo: flatRows.value,
      recordKey: resolveRecordKey(record)
    })

    if (toggle) applyTreeToggle(toggle.key)

    return !!toggle
  }

  /** check 列选中态输入（G2-b 契约，与 drawCheck 同款判定）：disabled/value
      从单元格 items attrs 读取，非 check 列为缺省值 */
  function checkColumnState (col, record, rowIndex) {
    if (col._raw?.type !== 'check') return { disabled: false, value: undefined }

    const content = resolveCellContent(col, {
      record,
      recordNumber: (props.recordsOffset || 0) + rowIndex + 1,
      emit
    })
    const attrs = Array.isArray(content.items) ? content.items[0]?.attrs : null

    return {
      disabled: attrs?.disabled != null && attrs?.disabled !== false,
      value: attrs?.['data-checked'] ?? false
    }
  }

  /** A4.3 序 3-4 / A5.2：条目 cell-item-click → 选中/cell-click 事件链 → 单击进编辑 */
  function finishCellClick (hit, record, col) {
    const item = resolveItemClick({ hit, itemHits: paintState.itemHits })

    if (item) emitCellItemClick(item, record, col, hit.rowIndex)

    const { disabled, value } = checkColumnState(col, record, hit.rowIndex)
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

    // 先发完整选中/cell-click 链再开编辑，父级一次收到全部事件，选中态与编辑态一致
    if (resolveCellClickOpen({ hit, cellEditable: cellEditableOf(col) }).openEditor) {
      openEditorAt(hit, record, col)
    }
  }

  /** R5：空白延伸区点击（行有效、x 越出列区右缘）仅选中行——同 resolveCellClick
      的选中事件序（key → record），不发 cell-click（无对应列），check/树槽/编辑不适用 */
  function selectRowOnly (record) {
    const recordKey = resolveRecordKey(record)

    if (recordKey !== selectedKey.value) emit('update:selected-record-key', recordKey)
    if (record !== props.selectedRecord) emit('update:selected-record', record)
  }

  function onClick (event) {
    // 拖拽误触抑制：拖拽后紧随的 click 丢弃（A5 / decisions「[I1 前]⑧」）
    if (clickGuard.consume()) return

    const result = hitAt(event)

    if (!result) return

    const { hit, rawHit } = result
    const col = hit.colIndex >= 0 ? wiredColumns.value[hit.colIndex] : null

    if (hit.isHeader) {
      emitHeaderClick(col)

      return
    }

    const record = displayRows.value?.[hit.rowIndex]

    if (record == null) return

    // R5：空白延伸区命中（beyondCols）无对应列，仅选中行
    if (!col) {
      if (hit.beyondCols) selectRowOnly(record)

      return
    }

    // 编辑按钮命中（20261027 问题 5）：局部交互，不选中行、不发 cell-click、
    // 不开编辑；判定在树槽之前（A4.3 序 2 前置）
    if (tryEditorButtonClick(hit, record, col)) return

    // A4.3 序 2：树箭头槽 toggle（局部交互，不选中行、不发 cell-click）；
    // 树槽判定消费原始 hit（§5.4）
    if (tryToggleTreeRow(rawHit, record)) return

    finishCellClick(hit, record, col)
  }

  // cell-item-click 派发（A1/A3.3，payload 对齐 DOM 版 + recordIndex）：
  // link/tag 经 render 产物 events.click 取同源 payload；button（canvas 专属产物，
  // 无 DOM events 通道）payload = buttons[index]；disabled 条目只续链不发
  function emitCellItemClick (item, record, col, row) {
    const raw = col._raw ?? col
    const recordNumber = (props.recordsOffset || 0) + row + 1

    if (item.kind === 'button') {
      emitButtonItemClick(item, record, col, raw, recordNumber, row)

      return
    }

    emitDomItemClick(item, record, col, raw, recordNumber, row)
  }

  /** button 条目派发（canvas 专属 render 产物，无 DOM events 通道）：
      payload = buttons[index] 配置对象 */
  function emitButtonItemClick (item, record, col, raw, recordNumber, row) {
    const value = col._value?.(record) ?? (col.field != null ? record?.[col.field] : undefined)
    const produced = col._render?.({ record, recordNumber, value, emit })
    const button = produced?.buttons?.[item.index]

    if (button != null && !isDisabledAttr(button.disabled)) {
      emit('cell-item-click', { record, column: raw, button, recordIndex: row })
    }
  }

  /** link/tag 条目派发：经列类型 render 产物的 events.click 取 DOM 版同源 payload
      （常规条目 = 条目对象，link 对象数组元素即原引用），外包 recordIndex */
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
    const domItem = items?.[item.index]

    if (domItem && !isDisabledAttr(domItem.attrs?.disabled)) {
      // dots payload（A1/A3.3）：DOM render 自产 dots（item.text === '...'）与
      // canvas 侧 _maxItems 截断 dots 的 payload 值同为 '...'；
      // 常规条目 = 条目对象（link 对象数组元素即原引用）
      if (isDotsItem(item, domItem, items, col)) {
        emit('cell-item-click', { record, column: raw, [item.kind]: '...', recordIndex: row })
      } else {
        domItem.events?.click?.()
      }
    }
  }

  /** dots 条目判定：DOM render 自产 '...' 或 canvas 侧 _maxItems 截断省略条目 */
  function isDotsItem (item, domItem, items, col) {
    const maxItems = col._maxItems ?? 10
    const canvasCappedDots = items.length > maxItems && item.index === maxItems - 1

    return canvasCappedDots || domItem.text === '...'
  }

  /** disabled 存在性判定（实施约束 7：与 G2 绘制侧 linkTextColorOf 同一谓词） */
  function isDisabledAttr (disabled) {
    return disabled != null && disabled !== false
  }

  /** 单击进编辑（A5.2/A5.5）：style 按 computeEditorStyle 浮层盒（贴格线内侧，
      border/编辑器类型分支），editorType 判定用开值形态与 _resolveMaxLines(record) 行级求值。
      合并区域（§5.5）：cellRect 经 spanRectOf 取区域矩形（浮层覆盖整个合并区域），
      rowFrom/colTo 供格线内缩按区域外缘判定 */
  function openEditorAt (hit, record, col) {
    const cur = layout.value

    if (!cur) return

    const rawValue =
      col._value?.(record) ??
      (col.field != null ? record?.[col.field] : undefined)

    const editorType = resolveEditorType(col, { rawValue, record })
    const border = isObjectEditor(col.editor) ? col.editor.border !== false : true
    const region = regionAt(spans.value, hit.rowIndex, hit.colIndex)

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
      cellRect: spanRectOf(cur, hit.rowIndex, hit.colIndex, spans.value),
      rowFrom: region?.rowFrom,
      colTo: region?.colTo
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

    if (!opened) return

    focusEditor()

    // veil 接线（20261027 问题 6）：先更新行列引用再失效——旧格 invalidate 时
    // 已不在 veil（恢复内容），新格 invalidate 置 veil；同一 tick 内「提交旧格 +
    // 打开新格」时旧格恢复由本处失效直接完成
    const prevCell = editingCellRef

    editingCellRef = { row: hit.rowIndex, col: hit.colIndex }

    if (prevCell) invalidate({ cell: prevCell })
    invalidate({ cell: editingCellRef })
  }

  /** column.editor 为对象形态时读取 border（true 形态按缺省 true） */
  function isObjectEditor (editorConfig) {
    return editorConfig != null && typeof editorConfig === 'object'
  }

  /** 编辑器聚焦（A5.5）：渲染完成后 input/select/date 聚焦内部真实 input，
      textarea 聚焦 textarea 元素，switch 聚焦容器。focus() 会把最近的可滚动
      祖先滚出溢出量（浮层相对画布漂移），聚焦后复位浮层容器滚动 */
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

  // —— 行定位辅助（选中横带 / scrollToRecord；树模式下在平铺行数组内查找） ——

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

  // —— 暴露方法（A1；树展开操作见 use-tree-rows 解构） ——

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
      + 锚定补偿 + 窗口重精算（controller.remeasureVisibleRows 内）+ 窗口同步重绘 */
  function onThemeChange () {
    const el = scrollEl.value
    const geometry = rowGeometry.geometry
    let anchor = null

    // 锚定基准在 rebuild 重估前捕获（旧几何 topAt；主题变化不改行集合，行号不变）
    if (geometry && el) {
      const row = geometry.offsetToRow(el.scrollTop)

      anchor = { row, top: geometry.topAt(row) }
    }

    // wrap 缓存失效：key 含 text+font+width+maxLines，主题变化后旧条目不再命中，
    // 整体重建清掉死权重
    wrapCacheObj = createWrapCache()

    relayoutAndRedraw()

    if (anchor && rowGeometry.geometry && el) {
      const shift = rowGeometry.geometry.topAt(anchor.row) - anchor.top

      if (shift) el.scrollTop += shift
    }

    rowGeometry.remeasureVisibleRows()
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
      rowGeometryMode: rowGeometry.mode,
      lastPaint: painter?.lastPaint ? { ...painter.lastPaint } : null,
      lastRelayout: lastRelayout ? { ...lastRelayout } : null
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

  // 编辑关闭 veil 清理（20261027 问题 6）：仅 editing 变为 null（关闭）时恢复
  // 编辑格内容。commit 与 open 落在同一 tick 时 watcher 只 flush 一次，无条件
  // 清除会把新格 veil 抹掉；行列由 editingCellRef 承载，覆盖全部关闭路径
  watch(() => editor.state.editing, newValue => {
    if (newValue != null) return

    const cell = editingCellRef

    if (cell == null) return

    editingCellRef = null

    // 卸载路径空值防护：painter 未创建 / 已 dispose 时无重绘意义
    if (!painter) {
      paintState.editingCell = null

      return
    }

    invalidate({ cell })
  })

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
    resetOverrides()
    rowGeometry.invalidateMeasureCache()
    relayoutAndRedraw()
  })

  // 数据版本：异步就地修改 records 后的通知通道 → spans 重算 + relayout（§4：
  // 合并行高分层随 spans 身份重扫）→ 整幅重绘（A3 数据契约②）
  watch(() => props.recordsVersion, () => relayoutAndRedraw())

  // spanMethod / orderBy 引用变化 → spans 重算 + relayout（§4：与既有 relayout
  // 触发点同批次；orderBy 变化即行序语义变化，合并块随 recordsVersion/records
  // 引用/本 watch 重算）
  watch([() => props.spanMethod, () => props.orderBy], () => relayoutAndRedraw())

  // 渲染 props → 整幅重绘；placeholder 不进列准备（绘制期兜底，见
  // preparedColumns 注释），切换占位文本仅整幅重绘、不触发估高重扫
  watch(
    () => [
      props.gridlines,
      props.hoverMode,
      props.striped,
      props.recordsOffset,
      props.placeholder
    ],
    () => redraw()
  )

  // headerChecked 受控变化 → 表头区整幅（受控 ✓ 状态变化即重绘）
  watch(() => props.headerChecked, () => invalidate({ header: true }))

  // 选中变化（selectedRecordKey/selectedRecord/keyField 经 selectedKey 汇聚）→
  // 旧/新选中行两条横带（合并区域由 painter 脏区扩展到区域包围盒，覆盖行底色随动）；
  // 覆盖行 key 被受控选中 → 区域无选中反馈，dev 警告一次（§5.8/§7）
  watch(selectedKey, (newValue, oldValue) => {
    for (const key of new Set([oldValue, newValue])) {
      const row = findRowByKey(key)

      if (row >= 0) invalidateRow(row)
    }

    if (newValue != null && spans.value) {
      const row = findRowByKey(newValue)

      // covered 顶层键存在即该行在至少一列被区域覆盖（区域内无选中反馈）
      if (row >= 0 && spans.value.covered.has(row)) {
        warn({
          component: 'table-ex',
          message: `选中 key "${String(newValue)}" 落在合并区域的覆盖行上，该区域无选中反馈（选中仅可由锚行表达）`
        })
      }
    }
  })

  // fixedLeftColumns → relayout（固定区宽度 / viewW 口径变化）
  watch(() => props.fixedLeftColumns, () => relayoutAndRedraw())

  // —— 树 watch（tree/treeProps/treeExpandedKeys 三条已随 use-tree-rows 注册） ——

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
