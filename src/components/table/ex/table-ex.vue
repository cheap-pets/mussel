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
      <!-- 指针交互监听层（click 单一入口：树槽 → 条目 → 编辑 → 选中链）；
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
          <div class="mu-table-ex__header-shadow" :style="headerShadowStyle" />
          <div class="mu-table-ex__bottom-shadow" />
          <div v-if="isEmpty" class="mu-table-ex__empty">
            <slot name="empty">
              {{ emptyText }}
            </slot>
          </div>
          <!-- 编辑浮层：分类型 v-on 合成、容器 tabindex=-1 承接 esc；
               bordered === false 挂 --borderless；画布侧 pointerdown 先提交再续行。
               textarea 须渲染真实元素（<component :is> 下 v-model 失效） -->
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
          <!-- tooltip 合成锚点（title 列协议）：常驻透明元素，不参与空态/编辑分支；
               矩形 = 命中格视口矩形（showCellTooltip 命令式写 style，__overlay 原点 =
               canvas 视口原点），mu-tooltip 全局面板以其为定位锚 -->
          <div ref="tooltipAnchorEl" class="mu-table-ex__tooltip-anchor" />
        </div>
      </div>
      <div ref="spacerEl" class="mu-table-ex__spacer" :style="spacerStyle" />
    </div>
  </div>
</template>

<script setup>
  import { computed, nextTick, ref, shallowRef, watch } from 'vue'

  import { autoIncrementKeyBuilder } from '@/utils/key-builder'
  import { warn } from '@/utils/warn'
  import { resolveSelectedKey } from '../utils'

  import { createRowGeometryController } from './geometry/row-geometry-controller'
  import { useTreeRows } from './composables/use-tree-rows'
  import { useColumnResize } from './composables/use-column-resize'
  import { buildSpans } from './spans/spans'
  import { prepareColumn } from './cell-paint/cell-content'
  import { contentRightXOf } from './table-paint/paint-utils'
  import { createEditorController } from './editing/editor'
  import { isCellEditable } from './editing/editor-resolve'

  // 功能纵切 composables（TDZ 约束：useCellTooltip 先于 useTreeRows，
  // useCellSelect 居 9 与 10 之间，host.relayout 前向槽在 useRelayout 后覆盖）
  import { useCellTooltip } from './composables/use-cell-tooltip'
  import { usePaintState } from './composables/use-paint-state'
  import { usePointer } from './composables/use-pointer'
  import { useCellClick } from './composables/use-cell-click'
  import { useCellSelect } from './composables/use-cell-select'
  import { useRelayout } from './composables/use-relayout'
  import { useTableInstances } from './composables/use-table-instances'
  import { useTableApi } from './composables/use-table-api'

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
    // —— 合并单元格（入口 B）——
    // (info) => Record<string, number | { rowspan?, colspan? | 'rest' }> | null，
    // 每行调用一次返回该行作为主行的声明；列级入口 autoRowSpan 配在列定义上
    spanMethod: { type: Function, default: null },
    // —— 树模式 ——
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
    'tree-expand',
    'tree-collapse',
    'cell-item-click',
    'edit-button-click'
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

  const selectedKey = computed(() => resolveSelectedKey(props))

  const hover = shallowRef(null)
  // 条目悬停：{ row, col, kind, index, disabled } | null，
  // onPointerMove 经 resolveItemClick 求值；paintState.hoverItem 在 syncPaintState
  // 以本值归一（hoverMode none 恒 null）
  const hoverItem = shallowRef(null)
  const cursor = ref('default')
  // 单元格选中：{ row, col } | null 锚格坐标
  // （合并区域经 resolveSpanCell 归一）；paintState.selectedCell 在 syncPaintState
  // 同步，getLayoutInfo 暴露内省；useCellSelect 编排置清与键盘通道
  const selectedCell = shallowRef(null)

  // —— 模块实例槽（useTableInstances / useRelayout 经 host setter 写入） ——
  // 文本测量实例（onMounted 创建；行高估高/精算与绘制折行单一事实源）
  let measureFn = null
  let wrapCacheObj = null

  let painter = null
  let themeWatcher = null
  // 最近一次 relayout 统计（getLayoutInfo 暴露，调试面板显示）
  let lastRelayout = null
  // veil 编辑格行列：editor 控制器的 editing 不含 row/col，
  // 行列由壳承载；paintState.editingCell 在 syncPaintState 以本值归一
  let editingCellRef = null

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

  // —— host 袋（单一 host 载体，各 composable 以 useX(host) 调用、返回值
  // Object.assign(host, api) 并入；响应式状态对象直传，shell 普通 let 经
  // get*/set* 读写；尚未创建的成员一律 host 惰性读取，setup 期唯一同步
  // 前向调用 = tree immediate watch 的 host.relayout() 空实现）——
  const host = {
    props,
    emit,
    rootEl,
    scrollEl,
    stickyEl,
    canvasEl,
    spacerEl,
    editorEl,
    preparedColumns,
    layout,
    selectedKey,
    hover,
    hoverItem,
    cursor,
    selectedCell,
    getPreparedColumns: () => preparedColumns.value,
    getScrollEl: () => scrollEl.value,
    getLayout: () => layout.value,
    setLayout: next => {
      layout.value = next
    },
    getCanvasEl: () => canvasEl.value,
    getPainter: () => painter,
    setPainter: value => {
      painter = value
    },
    getThemeWatcher: () => themeWatcher,
    setThemeWatcher: value => {
      themeWatcher = value
    },
    getMeasure: () => measureFn,
    setMeasure: value => {
      measureFn = value
    },
    getWrapCache: () => wrapCacheObj,
    setWrapCache: value => {
      wrapCacheObj = value
    },
    getLastRelayout: () => lastRelayout,
    setLastRelayout: value => {
      lastRelayout = value
    },
    getEditingCellRef: () => editingCellRef,
    setEditingCellRef: value => {
      editingCellRef = value
    },
    resolveRecordKey,
    cellEditableOf,
    genRecordKey,
    // useTreeRows 运行时提交通道（editor 步骤赋值前不触达）
    commit: () => host.editor.commit(),
    // 前向槽：useTreeRows immediate watch setup 期调用等价早退，useRelayout 后覆盖
    relayout: () => {},
    // tooltipEnabled computed 声明在 useTreeRows 之后（依赖 wiredColumns），
    // usePointer 运行时经本惰性键读取
    isTooltipEnabled: () => tooltipEnabled.value
  }

  // 1. tooltip 壳级编排（须先于 useTreeRows：immediate tree watch 的运行时链路
  //    依赖 hideCellTooltip；tooltipAnchorEl 为模板 ref 绑定）
  const tooltipApi = useCellTooltip(host)
  Object.assign(host, tooltipApi)
  const { tooltipAnchorEl, tooltipController } = tooltipApi

  // 2. 树接线
  const treeApi = useTreeRows(host)
  Object.assign(host, treeApi)
  const {
    treeOptions,
    flatRows,
    displayRows,
    wiredColumns,
    treeIndentsOf,
    expandAll,
    collapseAll,
    getTreeExpandedKeys
  } = treeApi

  // 3. 合并单元格：SpansIndex computed，无合并恒 null（快路径）
  // 依赖：displayRows（records 引用/树展开收起）、wiredColumns（列集变化）、
  // spanMethod 引用、recordsVersion（就地改值通道）、orderBy（防御：父级只改
  // orderBy 未替换 records 引用时仍重算）。列宽调整 / 行高精算 / hover 不依赖，
  // 不重算，仅重绘（声明与几何解耦）

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

  host.spans = spans

  // 4. 行几何策略：uniform/variable 双模式几何、估高扫描输入签名（scanSignature）、
  // 精算缓存失效签名（measureSignature）、进窗精算/单行重估与锚定补偿。
  // 注入 getter 清单见 geometry/row-geometry-controller.js 的 @param deps 声明
  const rowGeometry = createRowGeometryController({
    getRows: () => displayRows.value,
    getColumns: () => wiredColumns.value,
    getTreeIndents: () => treeIndentsOf(),
    getRecordsOffset: () => props.recordsOffset,
    // 精算快照失效维度：records 就地改值通知版本（合并 watch 不改）
    getRecordsVersion: () => props.recordsVersion,
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
    relayout: () => host.relayout()
  })

  host.rowGeometry = rowGeometry

  // 5. 列宽拖拽：widthOverrides/clickGuard/startResize/resetOverrides 并入
  // host 供 usePointer/useCellClick/useRelayout 运行时读取。host.invalidate
  // 此刻未赋值——useColumnResize 只在拖拽 move 回调调用它，运行时已由步骤 6 赋值
  Object.assign(host, useColumnResize(host))

  // 6. painter 持久 state 组装 + redraw/invalidate/invalidateRow 重绘入口
  Object.assign(host, usePaintState(host))

  // 7. 编辑器（触发点 = 单击）
  const editor = createEditorController({
    onCommit ({ record, recordIndex, column, value }) {
      emit('update:cell-value', { record, recordIndex, column, value })

      // 数据契约：父级在事件处理器内同步就地改 record 后，nextTick 重绘该行；
      // 多行列含行高重估 + 锚定，值形态变数组且当前 uniform 时触发模式升级
      nextTick(() => {
        rowGeometry.remeasureRow(recordIndex)
        painter?.invalidateRow(recordIndex)
      })
    }
  })

  host.editor = editor

  // 8. click 单一入口派发（表头/树槽/编辑按钮/条目/选中/check + 编辑开启）
  const clickApi = useCellClick(host)
  Object.assign(host, clickApi)
  const { onClick } = clickApi

  // 9. 指针交互（hover/hoverItem/cursor 已在 shell 声明并入 host，本步不回填）
  const pointerApi = usePointer(host)
  Object.assign(host, pointerApi)
  const { onPointerMove, onPointerLeave, onPointerDown } = pointerApi

  // 9.5 单元格选中（selectedCell 已在 shell 声明，本步不回填）：清除 watch 先于
  // useRelayout 合并 watch flush（pre watcher 按创建 id 排序），同 tick 先清旧
  // 选中格再整幅重绘，避免 relayout 帧残留选中描边
  Object.assign(host, useCellSelect(host))

  // 10. 布局重算/滚动/尺寸响应 + 三个源 watch；末尾覆盖 host.relayout 前向槽
  const relayoutApi = useRelayout(host)
  Object.assign(host, relayoutApi)
  host.relayout = relayoutApi.relayoutAndRedraw
  const { onScroll, onResize, yScrolled, yScrolledEnd, yOverflowed } = relayoutApi

  const isEmpty = computed(() => !props.records?.length)

  const wrapClass = computed(() => ({
    'mu-table-ex--empty': isEmpty.value,
    'mu-table-ex--y-scrolled': yScrolled.value,
    'mu-table-ex--y-scrolled-end': yScrolledEnd.value,
    'mu-table-ex--y-overflowed': yOverflowed.value
  }))

  // 光标反馈经 stickyStyle 一并绑定在 __sticky 上
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

  // 表头滚动阴影条宽度收口（contentRightXOf 共享口径，同 striped/表头背景/行线）：
  // 窄列（列总宽 < 表格宽）时阴影止于列内容区右缘，超宽空白区不再画阴影；
  // 列总宽 ≥ 表格宽（横向滚动态）min 恒取 stickyWidth，行为不变。
  // layout 未就绪返回 null，CSS width:100% 兜底（首帧无 --y-scrolled 类，不显阴影）
  const headerShadowStyle = computed(() => {
    const cur = layout.value

    if (!cur) return null

    return { width: `${Math.min(cur.stickyWidth, contentRightXOf(cur))}px` }
  })

  // 11. 实例生命周期（onMounted/onUnmounted 内部注册，首帧 nextTick(host.relayout)）
  const instancesApi = useTableInstances(host)
  Object.assign(host, instancesApi)
  const { refreshTheme } = instancesApi

  // 12. 暴露方法 + 选中 watch
  const apiApi = useTableApi(host)
  Object.assign(host, apiApi)
  const { scrollToRecord, getLayoutInfo, getThemeSnapshot, getCellRect } = apiApi

  // —— 单元格 tooltip 开关（title 列协议）：依赖 wiredColumns，留 useTreeRows 之后 ——
  const tooltipEnabled = computed(() => wiredColumns.value.some(col => Boolean(col?.title)))

  // 控制器缺失的降级提示（utils/warn once 去重）
  watch(tooltipEnabled, enabled => {
    if (enabled && !tooltipController) {
      devWarn('列配置了 title，但 $mussel.tooltip 控制器不存在（宿主未安装 mussel 或未走完整 install），单元格 tooltip 功能关闭')
    }
  }, { immediate: true })

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
</script>
