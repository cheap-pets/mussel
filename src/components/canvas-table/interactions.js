/**
 * canvas-table 指针交互纯逻辑（02-design.md A4.3 click 单一入口 / A3 脏区 / A5 编辑触发）。
 *
 * 本模块只含决策函数与两个无 DOM 的工厂，不绑定任何事件——DOM 接线
 * （__sticky 层监听、拖拽期 window 级 pointermove/pointerup、emit 执行、
 * rAF 回调里的重绘）由组件壳（canvas-table.vue）完成：组件壳在事件处理器里
 * 调用本模块取得决策/动作列表后执行 emit 与状态更新。编辑触发 = click
 * （A5.2 意见 2a，dblclick 通道已删除）。
 *
 * 坐标口径（与 layout.js 一致，02-design.md A5）：x/y 为相对 canvas 视口的
 * 坐标（getBoundingClientRect 差值换算，不用 offsetX）。
 */
import { colAt, findResizeColumn, rowAt } from './layout'

/** 拖拽调宽的下限缺省（02-design.md A5：col.minWidth ?? 40） */
export const RESIZE_MIN_WIDTH = 40

/** 树形列缩进/箭头槽常量（镜像 tree.scss --mu-tree_node-indent: 16px，与
    row-geometry.TREE_INDENT / cell-painters 内部常量同值；组件探针不可达取常量） */
const TREE_INDENT = 16

/** 单元格内容区 padding 缺省（--cell-padding 镜像值，hitTest cellX 口径用） */
const CELL_PADDING_FALLBACK = 8

/**
 * 命中检测（02-design.md A5 / 评审 6 P3）：指针坐标 → 表头/行列/调宽手柄。
 * 调宽手柄仅在表头区检测（isHeader 且距某列右/左缘 <= RESIZE_HANDLE），
 * 固定列排除与列级 resizable 判定在 findResizeColumn 内。
 *
 * @param {Object} params
 * @param {Number} params.x 相对 canvas 的 x
 * @param {Number} params.y 相对 canvas 的 y
 * @param {Number} [params.headHeight=0]
 * @param {Number} [params.scrollTop=0]
 * @param {Number} [params.scrollLeft=0]
 * @param {Number[]} params.colLefts 列前缀和（layout.js computePrefixSums）
 * @param {Number[]} params.colWidths 列宽数组
 * @param {Number} params.rowHeight
 * @param {Number} params.rowCount
 * @param {Array} params.columns 列定义（读取列级 resizable）
 * @param {Number} [params.fixedLeftColumns=0]
 * @param {Boolean} [params.resizable=false] 表格级调宽开关
 * @param {Number} [params.cellPadding=8] 内容区 padding（cellX 口径扣减，缺省 8）
 * @param {Object} [params.rowGeometry] 行几何实例（变高模式行定位，A2.2 统一接口；
 *   缺省按 rowHeight/rowCount 等高算式）
 * @returns {{ isHeader: Boolean, colIndex: Number, rowIndex: Number, resizeCol: Number,
 *   x: Number, y: Number, cellX: Number|null }}
 *   colIndex/rowIndex 越界（表头区/数据区外）为 -1；resizeCol 无手柄为 -1；
 *   x/y 为输入指针坐标透传（resolveItemClick 条目矩形反查用）；cellX = 指针相对
 *   命中列【内容区左缘】的偏移（实施约束 3：列缘偏移再减 padding——树槽判定
 *   cellX < level×16+16 与绘制侧 padding 起画同口径），colIndex < 0 时为 null
 */
export function hitTest ({
  x,
  y,
  headHeight = 0,
  scrollTop = 0,
  scrollLeft = 0,
  colLefts,
  colWidths,
  rowHeight,
  rowCount,
  columns,
  fixedLeftColumns = 0,
  resizable = false,
  cellPadding = CELL_PADDING_FALLBACK,
  rowGeometry
}) {
  const isHeader = y < headHeight
  const colIndex = colAt(x, { scrollLeft, colLefts, colWidths, fixedLeftColumns })
  const rowIndex = rowAt(y, { headHeight, scrollTop, rowHeight, rowCount, rowGeometry })
  const resizeCol = isHeader
    ? findResizeColumn({ x, scrollLeft, colLefts, colWidths, columns, fixedLeftColumns, resizable })
    : -1

  // 固定列不随滚动位移，滚动区列减 scrollLeft（与 painter viewportColX 同式）
  const cellX = colIndex >= 0
    ? x - (colLefts[colIndex] - (colIndex < fixedLeftColumns ? 0 : scrollLeft)) - cellPadding
    : null

  return { isHeader, colIndex, rowIndex, resizeCol, x, y, cellX }
}

/**
 * 树箭头槽命中判定（02-design.md A3.4 / 评审 6 P3，resolveTreeToggle 与
 * resolveCursor 共用）：树平铺中 + 命中列为树形列（_isTreeColumn）+ 该行有
 * 子级（flatInfo.hasChildren）+ hit.cellX 在箭头槽内（cellX < level×16+16，
 * 内容区相对口径，实施约束 3）。
 *
 * @param {Object} params
 * @param {Object} params.hit hitTest 产出（消费 x 之外的 cellX）
 * @param {Array} params.columns 已准备内部列（消费 _isTreeColumn 标记）
 * @param {Object|null} [params.flatInfo] 树平铺信息 { levels, hasChildren }（树关 = null）
 * @returns {Boolean}
 */
function isTreeArrowSlot ({ hit, columns, flatInfo }) {
  if (!flatInfo || !hit || hit.isHeader || hit.colIndex < 0 || hit.rowIndex < 0) return false
  if (!columns?.[hit.colIndex]?._isTreeColumn) return false
  if (!flatInfo.hasChildren?.[hit.rowIndex]) return false

  const level = flatInfo.levels?.[hit.rowIndex] ?? 0

  return hit.cellX != null && hit.cellX < level * TREE_INDENT + TREE_INDENT
}

/**
 * 指针光标（02-design.md A5 pointermove 行 + A5.3 / 评审 6 P3）：手柄上
 * col-resize；表头可排序列内 pointer；树箭头槽 pointer（context.flatInfo 提供
 * hasChildren 判定，A3.4）；表体可编辑格 text（context.editable +
 * context.isCellEditableFn，A5.3）；其余 default。context 缺省时行为与既有
 * 两参签名一致（回归安全）。
 *
 * @param {Object} hit hitTest 产出（含 cellX）
 * @param {Array} columns 列定义（读取列级 sortable / _isTreeColumn）
 * @param {Object} [context] { flatInfo, editable, isCellEditableFn }
 * @returns {String} 'col-resize' | 'pointer' | 'text' | 'default'
 */
export function resolveCursor (hit, columns, context = {}) {
  if (hit.resizeCol >= 0) return 'col-resize'
  if (hit.isHeader && hit.colIndex >= 0 && columns?.[hit.colIndex]?.sortable) return 'pointer'

  if (isTreeArrowSlot({ hit, columns, flatInfo: context.flatInfo })) return 'pointer'

  if (!hit.isHeader && hit.colIndex >= 0 && context.editable) {
    const column = columns?.[hit.colIndex]

    if (column && context.isCellEditableFn?.(column)) return 'text'
  }

  return 'default'
}

/**
 * 排序 next（02-design.md A5）：无 → asc → desc → 无（清空为 ''）。
 * orderBy 解析同 table.vue sortDirection（'field:asc' 经 replace(':', ' ').split(' ')）；
 * 排序图标方向由 orderBy prop 驱动，本模块不持排序状态。
 *
 * @param {String} orderBy 当前值（'field:asc' 格式，可为空）
 * @param {String} field 点击列的字段名
 * @returns {String} 下一状态（'field:asc' | 'field:desc' | ''）
 */
export function resolveOrderByNext (orderBy, field) {
  const [currentField, direction] = String(orderBy ?? '').replace(':', ' ').split(' ')

  if (currentField !== field || (direction !== 'asc' && direction !== 'desc')) {
    return `${field}:asc`
  }

  return direction === 'asc' ? `${field}:desc` : ''
}

/**
 * check ✓ 表头判定（table.vue:22 渲染条件同款）：
 * type === 'check' 且配置 field/headerCheckbox 且表格级 headerChecked 受控对象存在。
 * headerChecked 缺失时 ✓ 不渲染，该列按普通表头处理（table.vue:20 无条件 header-click 语义）。
 *
 * @param {Object} column 列定义（原始或内部列）
 * @param {Object} [headerChecked] 表格级受控对象
 * @returns {Boolean}
 */
export function isCheckHeaderColumn (column, headerChecked) {
  return Boolean(
    column &&
    column.type === 'check' &&
    column.field &&
    column.headerCheckbox &&
    headerChecked
  )
}

/**
 * 表头点击动作（02-design.md A5）：
 * - check ✓ 表头只发 update:header-checked(column, !checked)，不发 header-click
 *   （对齐 table.vue:25 @click.stop）；
 * - 其余表头均发 header-click（原始列定义，table.vue:20 无条件语义）；
 *   可排序列另发 update:order-by(next)，header-click 照发保持兼容。
 *
 * @param {Object} params
 * @param {Object} params.column 命中列（原始或带 _raw 的内部列，payload 取原始列）
 * @param {Object} [params.headerChecked] 表格级受控对象
 * @param {String} [params.orderBy] 当前排序
 * @returns {{ events: Array<{ name: String, args: Array }> }}
 */
export function resolveHeaderClick ({ column, headerChecked, orderBy }) {
  const raw = column?._raw ?? column
  const events = []

  if (isCheckHeaderColumn(column, headerChecked)) {
    events.push({
      name: 'update:header-checked',
      args: [raw, !headerChecked[column.field]]
    })

    return { events }
  }

  events.push({ name: 'header-click', args: [raw] })

  if (column?.sortable) {
    events.push({ name: 'update:order-by', args: [resolveOrderByNext(orderBy, column.field)] })
  }

  return { events }
}

/**
 * 表体单元格点击动作（02-design.md A5 / A1 cell-click 对照行）：
 * - check 列：disabled 为真 → 跳过翻转（不发 update:cell-value，DOM 版 [disabled]
 *   仅 pointer-events:none，点击仍命中 td）；否则翻转 value 一并发出（check.js click
 *   语义 + recordIndex 扩展）。无论是否翻转都继续单元格点击流程（选中 + cell-click，
 *   对齐 check.js click 不 stopPropagation + td @click 冒泡）。
 * - 选中：key/record 与当前选中一致时不发对应事件（table.vue onCellClick 同款）。
 * - 事件顺序：update:cell-value → update:selected-record-key →
 *   update:selected-record → cell-click。
 *
 * @param {Object} params
 * @param {Object} params.record 命中行记录
 * @param {Number} params.recordIndex 行号
 * @param {Object} params.column 命中列（原始或带 _raw 的内部列，payload 取原始列）
 * @param {*} [params.recordKey] 该行 key（S1 按 keyField 解析后传入）
 * @param {*} [params.selectedRecordKey] 当前选中 key
 * @param {Object} [params.selectedRecord] 当前选中记录
 * @param {Boolean} [params.isCheck] 是否 check 列，缺省按 column.type === 'check' 判定
 * @param {Boolean} [params.disabled=false] check 禁用态（S1 从单元格 items attrs.disabled 解析）
 * @param {*} [params.value] check 列当前值
 * @returns {{ events: Array<{ name: String, args: Array }>, toggled: Boolean }}
 *   toggled 为 true 时 S1 在 nextTick 重绘该行（A3 数据契约①：父级同步就地改 record）
 */
export function resolveCellClick ({
  record,
  recordIndex,
  column,
  recordKey,
  selectedRecordKey,
  selectedRecord,
  isCheck = column?.type === 'check',
  disabled = false,
  value
} = {}) {
  const raw = column?._raw ?? column
  const toggled = Boolean(isCheck) && !disabled
  const events = []

  if (toggled) {
    events.push({
      name: 'update:cell-value',
      args: [{ record, recordIndex, column: raw, value: !value }]
    })
  }

  if (recordKey !== selectedRecordKey) {
    events.push({ name: 'update:selected-record-key', args: [recordKey] })
  }

  if (record !== selectedRecord) {
    events.push({ name: 'update:selected-record', args: [record] })
  }

  events.push({ name: 'cell-click', args: [{ record, recordIndex, column: raw }] })

  return { events, toggled }
}

/**
 * 拖拽 move 的列宽 clamp（02-design.md A5）：
 * newWidth = clamp(pointerX + scrollLeft − columnLeft, minWidth ?? 40, maxWidth ?? Infinity)。
 * pointerX 为相对 canvas 视口的 x，columnLeft 为拖拽列内容坐标左缘（colLefts[colIndex]）。
 *
 * @param {Object} params
 * @param {Number} params.pointerX
 * @param {Number} [params.scrollLeft=0]
 * @param {Number} params.columnLeft
 * @param {Number} [params.minWidth] 缺省 RESIZE_MIN_WIDTH（40）
 * @param {Number} [params.maxWidth] 缺省 Infinity
 * @returns {Number} clamp 后的列宽
 */
export function resolveResizeWidth ({ pointerX, scrollLeft = 0, columnLeft, minWidth, maxWidth }) {
  const min = minWidth ?? RESIZE_MIN_WIDTH
  const max = maxWidth ?? Infinity

  return Math.min(Math.max(pointerX + scrollLeft - columnLeft, min), max)
}

/**
 * 拖拽 move 的脏区（02-design.md A3 重绘表 / A5 move 行 / 评审 M9）：
 * 该列【左缘】至视口右端的竖带 + 表头整幅。左界取列左缘而非右缘——列宽变化
 * 同时影响该列内容截断与右侧所有列位置，取 min(旧右缘, 新右缘) 会在加宽时
 * 遗留 [旧右缘, 新右缘] 旧像素残影，取列左缘则一并覆盖该列重绘需求。
 *
 * @param {Object} params
 * @param {Number} params.columnLeft 拖拽列左缘（canvas 视口坐标，固定列不可调宽故恒为 colLefts − scrollLeft）
 * @param {Number} params.viewportWidth canvas 视口宽（容器 clientWidth）
 * @returns {{ band: { x: Number, width: Number }, header: Boolean }}
 *   band 为视口坐标竖带；header 为 true 表示表头整幅一并重绘
 */
export function resolveResizeDirty ({ columnLeft, viewportWidth }) {
  return {
    band: { x: columnLeft, width: Math.max(0, viewportWidth - columnLeft) },
    header: true
  }
}

/**
 * hover 变化的脏区矩形（02-design.md A3 重绘表：仅旧行+新行两条横带，列 hover
 * 则两条竖带）。返回 canvas 视口坐标矩形数组（行带全宽、列带表头以下全高、
 * cell 模式逐格矩形）；prev 与 next 相同位置去重为一条，均无则空数组。
 * 调用方（S1）在 rAF 合帧回调内将矩形交给 painter clip 重绘。
 *
 * @param {Object} params
 * @param {String} [params.mode='row'] hoverMode：'none'|'row'|'column'|'cross'|'cell'
 * @param {{ row: Number, col: Number }} [params.prev] 旧 hover 位置（行列号）
 * @param {{ row: Number, col: Number }} [params.next] 新 hover 位置
 * @param {Number} params.rowHeight
 * @param {Number} [params.headHeight=0]
 * @param {Number} [params.scrollTop=0]
 * @param {Number} [params.scrollLeft=0]
 * @param {Number[]} params.colLefts 列前缀和
 * @param {Number[]} params.colWidths 列宽数组
 * @param {Number} [params.fixedLeftColumns=0]
 * @param {Number} params.viewportWidth canvas 视口宽
 * @param {Number} params.viewportHeight canvas 视口高
 * @returns {Array<{ x: Number, y: Number, width: Number, height: Number }>}
 */
export function resolveHoverDirtyRects ({
  mode = 'row',
  prev,
  next,
  rowHeight,
  headHeight = 0,
  scrollTop = 0,
  scrollLeft = 0,
  colLefts,
  colWidths,
  fixedLeftColumns = 0,
  viewportWidth,
  viewportHeight
} = {}) {
  if (!mode || mode === 'none') return []

  const same = (a, b) => a && b && a.row === b.row && a.col === b.col
  const positions = []

  if (prev) positions.push(prev)
  if (next && !same(prev, next)) positions.push(next)

  const rects = []

  for (const { row, col } of positions) {
    // 列带 x：固定列不随滚动位移，滚动区按视口坐标（colLefts − scrollLeft）
    const colX = col != null && colLefts
      ? colLefts[col] - (col < fixedLeftColumns ? 0 : scrollLeft)
      : null

    if ((mode === 'row' || mode === 'cross') && row != null) {
      rects.push({
        x: 0,
        y: headHeight + row * rowHeight - scrollTop,
        width: viewportWidth,
        height: rowHeight
      })
    }

    if ((mode === 'column' || mode === 'cross') && colX != null) {
      rects.push({
        x: colX,
        y: headHeight,
        width: colWidths?.[col] ?? 0,
        height: Math.max(0, viewportHeight - headHeight)
      })
    }

    if (mode === 'cell' && colX != null && row != null) {
      rects.push({
        x: colX,
        y: headHeight + row * rowHeight - scrollTop,
        width: colWidths?.[col] ?? 0,
        height: rowHeight
      })
    }
  }

  return rects
}

/**
 * 画布 pointerdown 决策（02-design.md A6 画布侧隔离 + A5 拖拽开始）：
 * editing 中落在画布的 pointerdown 不屏蔽命中，先同步 commit 当前编辑再继续
 * 正常命中处理（点击其他单元格一步完成「提交 + 选中新行」）；落在表头手柄上
 * 则开始拖拽（S1 绑 window 级 pointermove/pointerup）。
 *
 * @param {Object} params
 * @param {Object} [params.editing] 当前编辑状态（S1 持有，编辑中为非空）
 * @param {Object} params.hit hitTest 产出
 * @returns {{ commitEditing: Boolean, startResize: Boolean }}
 */
export function resolvePointerdown ({ editing, hit }) {
  return {
    commitEditing: Boolean(editing),
    startResize: Boolean(hit?.resizeCol >= 0)
  }
}

/**
 * 树箭头槽 toggle 决策（02-design.md A3.4/A4.3 序 2 / 评审 6 P3）：树平铺中
 * 命中树形列的箭头槽（isTreeArrowSlot 判定，hit.cellX 槽内 + hasChildren）→
 * 返回 toggle 目标；槽外（cellX 超出槽位）或叶行空槽 → null（走普通单元格
 * 点击链）。命中时 toggle 不选中行、不发 cell-click（局部交互，对齐 tree-node
 * __expand-icon 的 pointer-events 隔离）。
 *
 * @param {Object} params
 * @param {Object} params.hit hitTest 产出（含 cellX）
 * @param {Array} params.columns 已准备内部列（消费 _isTreeColumn）
 * @param {Object|null} params.flatInfo 树平铺信息 { levels, hasChildren }（树关 = null）
 * @param {*} [params.recordKey] 该行 key（组件壳按树 key 字段解析后传入）
 * @returns {{ row: Number, key: * } | null}
 */
export function resolveTreeToggle ({ hit, columns, flatInfo, recordKey } = {}) {
  if (!isTreeArrowSlot({ hit, columns, flatInfo })) return null

  return { row: hit.rowIndex, key: recordKey }
}

/**
 * 条目点击命中（02-design.md A3.3/A4.3 序 3 / 评审 6 P4）：hit.x/hit.y 对
 * painter itemHits（Map<row, Map<col, Array<{ kind, index, rect }>>>，视口坐标）
 * 反查命中条目；dots '...' 超限省略条目同样命中（对齐 DOM 版 dots 绑定
 * events.click）；窗口外行不在集合内 → null。link/tag/button 命中，progress/img
 * 不回报矩形（DOM 版无对应事件）。
 *
 * @param {Object} params
 * @param {Object} params.hit hitTest 产出（消费 x/y/rowIndex/colIndex）
 * @param {Map} [params.itemHits] painter 收集的条目命中矩形集合
 * @returns {{ kind: String, index: Number, row: Number, col: Number } | null}
 */
export function resolveItemClick ({ hit, itemHits } = {}) {
  if (!itemHits || !hit || hit.isHeader || hit.colIndex < 0 || hit.rowIndex < 0) return null

  const rects = itemHits.get(hit.rowIndex)?.get(hit.colIndex)

  if (!rects) return null

  for (const entry of rects) {
    const rect = entry.rect

    if (
      hit.x >= rect.x && hit.x < rect.x + rect.width &&
      hit.y >= rect.y && hit.y < rect.y + rect.height
    ) {
      return { kind: entry.kind, index: entry.index, row: hit.rowIndex, col: hit.colIndex }
    }
  }

  return null
}

/**
 * 单击开编辑的门控（02-design.md A5.2 意见 2a：编辑触发改 click，dblclick
 * 路径删除）：仅表体单元格且该格可编辑时 openEditor 为 true。cellEditable 由
 * 组件壳按只读控制链（editable / column.editable / editor 配置 / 列类型排除表）
 * 解析后传入；编辑器的打开与状态机在 editor.js。
 *
 * @param {Object} params
 * @param {Object} params.hit hitTest 产出
 * @param {Boolean} [params.cellEditable=false]
 * @returns {{ openEditor: Boolean, rowIndex: Number, colIndex: Number }}
 */
export function resolveCellClickOpen ({ hit, cellEditable = false } = {}) {
  return {
    openEditor: Boolean(!hit.isHeader && hit.colIndex >= 0 && hit.rowIndex >= 0 && cellEditable),
    rowIndex: hit.rowIndex,
    colIndex: hit.colIndex
  }
}

/**
 * 拖拽误触抑制（02-design.md A5「up 后的 click 丢弃」；decisions「[I1 前]⑧」）：
 * 拖拽开始 arm()；click 处理器内 consume() 返回 true 并立即解除（消费即清除，
 * kaka EventBinding 模式）；pointerup 时 release() 延时清除——拖拽在 canvas 外
 * 释放、click 未触发的场景下，残留 flag 经延时任务清除，不会吞掉下一次表头点击。
 * schedule 可注入（自检同步验证用），缺省 setTimeout 0（click 在 pointerup 同一
 * 任务内同步触发，先于延时任务被 consume 消费）。
 *
 * @param {Object} [options]
 * @param {Function} [options.schedule] 延时任务注入（默认 setTimeout(fn, 0)）
 * @returns {{ arm: Function, consume: Function, release: Function }}
 */
export function createClickGuard ({ schedule } = {}) {
  const defer = schedule ?? (fn => setTimeout(fn, 0))
  let armed = false

  return {
    /** 拖拽开始（pointerdown 命中手柄）时调用 */
    arm () {
      armed = true
    },
    /** click 处理器内调用：返回 true 表示该 click 应丢弃（消费并立即解除） */
    consume () {
      const discard = armed

      armed = false

      return discard
    },
    /** pointerup 时调用：延时清除残留 flag */
    release () {
      defer(() => {
        armed = false
      })
    }
  }
}

/**
 * rAF 合帧（02-design.md A3 滚动行 / A5 pointermove 行）：同一帧内多次 schedule()
 * 合并为一次回调（同帧多次 scroll/hover 只重绘一次）；cancel 供组件卸载。
 * raf 可注入（自检同步验证用），缺省 requestAnimationFrame（Node 环境退化为
 * setTimeout 16ms，仅为容错）。
 *
 * @param {Function} fn 帧回调
 * @param {Function} [raf] 帧调度注入
 * @returns {{ schedule: Function, cancel: Function }}
 */
export function createFrameScheduler (fn, raf) {
  const scheduleFrame = raf ??
    (typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame.bind(window)
      : (callback => setTimeout(callback, 16)))
  let pending = false
  let cancelled = false

  return {
    schedule () {
      if (pending || cancelled) return

      pending = true
      scheduleFrame(() => {
        pending = false

        if (!cancelled) fn()
      })
    },
    /** 组件卸载后挂起的帧回调不再执行 */
    cancel () {
      cancelled = true
    }
  }
}
