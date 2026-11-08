/**
 * table-ex click 分支决策：click 单入口（use-cell-click）按域派发的各分支
 * 动作——表头点击（排序/check ✓）、树槽 toggle、条目点击反查、单元格点击
 * （check 翻转/选中）、单击开编辑门控。只含纯决策函数，不绑定任何事件；
 * 命中检测与光标判定见 hit-test.js，调宽 clamp 见 resize-resolve.js。
 */
import { isTreeArrowSlot } from './hit-test'

/**
 * 排序 next：无 → asc → desc → 无（清空为 ''）。orderBy 解析同 table.vue
 * sortDirection；本模块不持排序状态（图标方向由 orderBy prop 驱动）。
 *
 * @param {String} orderBy 当前值（'field:asc' 格式，可为空）
 * @param {String} field 点击列的字段名
 * @returns {String} 'field:asc' | 'field:desc' | ''
 */
export function resolveOrderByNext (orderBy, field) {
  const [currentField, direction] = String(orderBy ?? '').replace(':', ' ').split(' ')

  if (currentField !== field || (direction !== 'asc' && direction !== 'desc')) {
    return `${field}:asc`
  }

  return direction === 'asc' ? `${field}:desc` : ''
}

/**
 * check ✓ 表头判定（渲染条件与 table.vue 同款）：type === 'check' 且配置
 * field/headerCheckbox 且 headerChecked 受控对象存在。headerChecked 缺失时
 * ✓ 不渲染，该列按普通表头处理。
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
 * 表头点击动作：check ✓ 表头只发 update:header-checked，不发 header-click
 * （对齐 table.vue @click.stop）；其余表头均发 header-click（payload 取原始列），
 * 可排序列另发 update:order-by(next)，header-click 照发保持兼容。
 *
 * @param {Object} params.column 命中列（原始或带 _raw 的内部列）
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
 * 表体单元格点击动作：
 * - check 列：disabled 为真跳过翻转（不发 update:cell-value；DOM 版 [disabled]
 *   仅 pointer-events:none，点击仍命中 td）；无论是否翻转都继续点击流程
 *   （对齐 check.js click 不 stopPropagation）。
 * - 选中：key/record 与当前选中一致时不发对应事件。
 * - 事件顺序：update:cell-value → update:selected-record-key →
 *   update:selected-record → cell-click。
 *
 * @param {Object} params.column 命中列（原始或带 _raw 的内部列，payload 取原始列）
 * @param {*} [params.recordKey] 该行 key（按 keyField 解析后传入）
 * @param {*} [params.selectedRecordKey] 当前选中 key
 * @param {Object} [params.selectedRecord] 当前选中记录
 * @param {Boolean} [params.isCheck] 是否 check 列，缺省按 column.type === 'check' 判定
 * @param {Boolean} [params.disabled=false] check 禁用态（从单元格 items attrs.disabled 解析）
 * @returns {{ events: Array<{ name: String, args: Array }>, toggled: Boolean }}
 *   toggled 为 true 时壳在 nextTick 重绘该行（父级同步就地改 record）
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
 * 树箭头槽 toggle 决策：命中槽 → toggle 目标，槽外或不可展开空槽 → null
 * （走普通单元格点击链）。命中时 toggle 不选中行、不发 cell-click
 * （对齐 tree-node __expand-icon 的 pointer-events 隔离）。
 *
 * @param {Object} params.hit hitTest 产出（含 cellX）
 * @param {Array} params.columns 已准备内部列（消费 _isTreeColumn）
 * @param {Object|null} params.flatInfo 树平铺信息 { levels, expandable }（树关 = null）
 * @param {*} [params.recordKey] 该行 key（组件壳按树 key 字段解析后传入）
 * @returns {{ row: Number, key: * } | null}
 */
export function resolveTreeToggle ({ hit, columns, flatInfo, recordKey } = {}) {
  if (!isTreeArrowSlot({ hit, columns, flatInfo })) return null

  return { row: hit.rowIndex, key: recordKey }
}

function isItemClickable (itemHits, hit) {
  return (
    Boolean(itemHits) && Boolean(hit) && !hit.isHeader && hit.colIndex >= 0 && hit.rowIndex >= 0
  )
}

/** 矩形命中判定（视口坐标，半开区间 [x, x+w) × [y, y+h)） */
function isItemRectHit (hit, rect) {
  return (
    hit.x >= rect.x && hit.x < rect.x + rect.width &&
    hit.y >= rect.y && hit.y < rect.y + rect.height
  )
}

/** 首个命中条目，无命中 null；disabled 随条目透传（缺字段 false），link =
    entry.link !== false（与 item-painters isLinkEntryHovered 同谓词） */
function findHitItem (hit, rects) {
  for (const entry of rects) {
    if (isItemRectHit(hit, entry.rect)) {
      return {
        kind: entry.kind,
        index: entry.index,
        row: hit.rowIndex,
        col: hit.colIndex,
        disabled: entry.disabled === true,
        link: entry.link !== false
      }
    }
  }

  return null
}

/**
 * 条目点击命中：hit.x/hit.y 对 painter itemHits（Map<row, Map<col,
 * Array<{ kind, index, rect, disabled, link? }>>>，视口坐标）反查命中条目。
 * dots '...' 超限省略条目同样命中（对齐 DOM 版 dots 绑定 events.click）；
 * 窗口外行不在集合内 → null。link/tag/button 命中，progress/img 不回报矩形
 * （DOM 版无对应事件）；disabled/link 语义见 findHitItem。
 *
 * @param {Object} params.hit hitTest 产出（消费 x/y/rowIndex/colIndex）
 * @param {Map} [params.itemHits] painter 收集的条目命中矩形集合
 * @returns {{ kind: String, index: Number, row: Number, col: Number,
 *   disabled: Boolean, link: Boolean } | null}
 */
export function resolveItemClick ({ hit, itemHits } = {}) {
  if (!isItemClickable(itemHits, hit)) return null

  const rects = itemHits.get(hit.rowIndex)?.get(hit.colIndex)

  if (!rects) return null

  return findHitItem(hit, rects)
}

/**
 * 单击开编辑的门控：仅表体单元格且该格可编辑时 openEditor 为 true。cellEditable
 * 由组件壳按只读控制链（editable / column.editable / editor 配置 / 列类型排除表）
 * 解析后传入；编辑器状态机在 editor.js。
 *
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
