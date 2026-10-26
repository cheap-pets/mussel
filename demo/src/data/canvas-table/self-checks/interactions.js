/**
 * canvas-table 自检断言 — interactions 模块（G3）。
 *
 * 覆盖（02-design.md G3 判据 + 03-review-4 问题 1 + 评审 6 P2/P3/P4）：
 * 命中检测（hitTest 表头/表体/手柄 + x/y/cellX 返回值，cellX 内容区相对口径）、
 * 排序 next（无→asc→desc→无）、调宽 clamp 与 move 脏区左界=列左缘、
 * resolveResizeWidth + resolveTypeMinWidth 组合拖拽下限（评审 6 P2）、
 * check disabled 跳过翻转但续行点击流程、树槽 toggle（hit.cellX 槽内判定，
 * 槽外/叶行不 toggle）、条目点击反查（hit.x/y，含 dots '...' 命中、窗口外不命中）、
 * 单击开编辑门控（click 语义，dblclick 通道已删除——03-review-4 问题 1）、
 * resolveCursor 三参 context（树槽 pointer / 叶行 default / 可编辑格 text /
 * context 缺省回归）、拖拽误触抑制（pointerup 后延时清除）、hover 脏区、
 * editing 中 pointerdown 先提交再续命中、光标决策与 rAF 合帧。
 */
import {
  RESIZE_MIN_WIDTH,
  hitTest,
  resolveCursor,
  resolveOrderByNext,
  isCheckHeaderColumn,
  resolveHeaderClick,
  resolveCellClick,
  resolveItemClick,
  resolveCellClickOpen,
  resolveResizeWidth,
  resolveResizeDirty,
  resolveHoverDirtyRects,
  resolvePointerdown,
  resolveTreeToggle,
  createClickGuard,
  createFrameScheduler
} from '@/components/canvas-table/interactions.js'
import { resolveTypeMinWidth } from '@/components/canvas-table/layout.js'
import { getPixelNumber } from '@/components/table/utils'

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

function assertEqual (actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} 期望 ${expected}，实际 ${actual}`)
  }

  return String(actual)
}

function assertArray (actual, expected, label) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)

  if (a !== e) throw new Error(`${label} 期望 ${e}，实际 ${a}`)

  return a
}

/** 事件序列比较：[{ name, args }] 归一为 JSON 比较 */
function assertEvents (events, expected, label) {
  const normalized = events.map(({ name, args }) => ({ name, args }))

  return assertArray(normalized, expected, label)
}

// 命中检测共用布局（与 layout 自检同款）：列宽 [100, 200, 300, 80]
const HIT_BASE = {
  headHeight: 36,
  scrollTop: 0,
  scrollLeft: 0,
  colLefts: [0, 100, 300, 600],
  colWidths: [100, 200, 300, 80],
  rowHeight: 36,
  rowCount: 100,
  columns: [{}, {}, {}, {}],
  fixedLeftColumns: 0,
  resizable: true
}

export const checks = [
  {
    name: 'hitTest：表头/表体/行列换算与手柄（手柄仅表头区检测）',
    fn: () => {
      const hit = hitTest({ ...HIT_BASE, x: 250, y: 50 })

      assertEqual(hit.isHeader, false, '表体 isHeader')
      assertEqual(hit.colIndex, 1, '表体列号')
      assertEqual(hit.rowIndex, 0, '表体行号（(50−36)/36）')
      assertEqual(hit.resizeCol, -1, '表体无手柄')

      const header = hitTest({ ...HIT_BASE, x: 250, y: 20 })

      assertEqual(header.isHeader, true, '表头 isHeader')
      assertEqual(header.rowIndex, -1, '表头区行号 -1')

      // 手柄：x=298 距列 1 右缘 2px；表体同坐标不检测手柄
      const handle = hitTest({ ...HIT_BASE, x: 298, y: 20 })

      assertEqual(handle.resizeCol, 1, '表头手柄命中列 1')
      assertEqual(hitTest({ ...HIT_BASE, x: 298, y: 50 }).resizeCol, -1, '表体同坐标无手柄')

      // 越界
      assertEqual(hitTest({ ...HIT_BASE, x: 250, y: 36 + 100 * 36 }).rowIndex, -1, '行越界 -1')
      assertEqual(hitTest({ ...HIT_BASE, x: 690, y: 50 }).colIndex, -1, '列越界 -1')

      // 返回值 x/y 透传与 cellX（内容区相对口径，评审 6 P3 + 实施约束 3）：
      // cellX = x − (colLefts[col] − (固定列 ? 0 : scrollLeft)) − padding
      assertEqual(hit.x, 250, 'hit.x 透传')
      assertEqual(hit.y, 50, 'hit.y 透传')
      assertEqual(hit.cellX, 250 - 100 - 8, 'cellX = 列缘偏移再减 padding（142）')
      assertEqual(hitTest({ ...HIT_BASE, x: 690, y: 50 }).cellX, null, '列越界 cellX null')

      // 固定列不含 scrollLeft 偏移、滚动列含（两态对照，评审 6 P3）
      const scrolled = hitTest({ ...HIT_BASE, x: 30, y: 50, scrollLeft: 60, fixedLeftColumns: 1 })

      assertEqual(scrolled.colIndex, 0, '固定列命中列 0')
      assertEqual(scrolled.cellX, 30 - 0 - 8, '固定列 cellX 不含 scrollLeft')
      assertEqual(
        hitTest({ ...HIT_BASE, x: 130, y: 50, scrollLeft: 60 }).cellX,
        130 - (100 - 60) - 8,
        '滚动列 cellX 含 scrollLeft 偏移'
      )

      return '表头/表体/手柄/越界判定正确；x/y 透传；cellX 内容区相对口径两态对照'
    }
  },
  {
    name: 'resolveCursor：col-resize / pointer（可排序列内）/ default',
    fn: () => {
      assertEqual(resolveCursor({ resizeCol: 1 }, HIT_BASE.columns), 'col-resize', '手柄光标')
      assertEqual(
        resolveCursor({ isHeader: true, colIndex: 1, resizeCol: -1 }, [{}, { sortable: true }, {}, {}]),
        'pointer',
        '可排序列光标'
      )
      assertEqual(
        resolveCursor({ isHeader: true, colIndex: 1, resizeCol: -1 }, HIT_BASE.columns),
        'default',
        '非排序列光标'
      )
      assertEqual(resolveCursor({ isHeader: false, colIndex: 1, rowIndex: 0, resizeCol: -1 }, HIT_BASE.columns), 'default', '表体光标')

      return 'col-resize / pointer / default'
    }
  },
  {
    name: 'resolveOrderByNext：无 → asc → desc → 无（含其他字段与异常值）',
    fn: () => {
      assertEqual(resolveOrderByNext('', 'name'), 'name:asc', '空 → asc')
      assertEqual(resolveOrderByNext(undefined, 'name'), 'name:asc', 'undefined → asc')
      assertEqual(resolveOrderByNext('name:asc', 'name'), 'name:desc', 'asc → desc')
      assertEqual(resolveOrderByNext('name:desc', 'name'), '', 'desc → 清空')
      assertEqual(resolveOrderByNext('age:asc', 'name'), 'name:asc', '其他字段 → 该列 asc')
      assertEqual(resolveOrderByNext('name:foo', 'name'), 'name:asc', '非法方向按无处理')
      assertEqual(resolveOrderByNext('name', 'name'), 'name:asc', '无方向后缀按无处理')

      return "'' → 'f:asc' → 'f:desc' → ''；异常值回 asc"
    }
  },
  {
    name: 'resolveHeaderClick：普通表头发 header-click + 排序列另发 order-by；payload 为原始列',
    fn: () => {
      const raw = { field: 'name', caption: '名称', sortable: true }
      const prepared = { ...raw, _raw: raw }

      assertEvents(resolveHeaderClick({ column: prepared, orderBy: '' }).events, [
        { name: 'header-click', args: [raw] },
        { name: 'update:order-by', args: ['name:asc'] }
      ], '可排序列双事件')

      // 排序循环推进
      assertEvents(resolveHeaderClick({ column: prepared, orderBy: 'name:asc' }).events, [
        { name: 'header-click', args: [raw] },
        { name: 'update:order-by', args: ['name:desc'] }
      ], 'asc → desc')

      // 非排序列只发 header-click（table.vue:20 无条件语义）
      const plain = { field: 'memo', caption: '备注' }

      assertEvents(resolveHeaderClick({ column: plain, orderBy: 'name:asc' }).events, [
        { name: 'header-click', args: [plain] }
      ], '非排序列仅 header-click')

      return 'header-click 照发；order-by 按 orderBy 推进；payload 为 _raw 原始列'
    }
  },
  {
    name: 'resolveHeaderClick：check ✓ 表头只发 update:header-checked；headerChecked 缺失按普通表头',
    fn: () => {
      const raw = { field: 'checked', type: 'check', headerCheckbox: true }
      const column = { ...raw, _raw: raw }

      assertEvents(resolveHeaderClick({ column, headerChecked: { checked: false } }).events, [
        { name: 'update:header-checked', args: [raw, true] }
      ], 'check 表头翻转')

      assertEvents(resolveHeaderClick({ column, headerChecked: { checked: true }, orderBy: '' }).events, [
        { name: 'update:header-checked', args: [raw, false] }
      ], 'check 表头取消（无 header-click / order-by）')

      // headerChecked 未绑定（falsy）→ ✓ 不渲染（table.vue:22 v-if），按普通表头发 header-click
      assertEvents(resolveHeaderClick({ column, headerChecked: null }).events, [
        { name: 'header-click', args: [raw] }
      ], 'headerChecked 缺失按普通表头')

      // headerCheckbox 未配置 → 普通表头
      const noFlag = { field: 'checked', type: 'check', _raw: raw }

      assertEvents(resolveHeaderClick({ column: noFlag, headerChecked: {} }).events, [
        { name: 'header-click', args: [raw] }
      ], '无 headerCheckbox 按普通表头')

      assertEqual(isCheckHeaderColumn(column, { checked: false }), true, '判定 helper 为真')
      assertEqual(isCheckHeaderColumn(column, null), false, '判定 helper headerChecked 缺失')

      return '✓ 表头仅 update:header-checked；受控对象缺失回退普通表头'
    }
  },
  {
    name: 'resolveCellClick：check 列翻转并续行点击流程（cell-value → 选中 → cell-click）',
    fn: () => {
      const raw = { field: 'checked', type: 'check' }
      const column = { ...raw, _raw: raw }
      const record = { checked: false }
      const result = resolveCellClick({
        record,
        recordIndex: 7,
        column,
        recordKey: 'k7',
        selectedRecordKey: 'k1',
        selectedRecord: {},
        value: false
      })

      assertEvents(result.events, [
        { name: 'update:cell-value', args: [{ record, recordIndex: 7, column: raw, value: true }] },
        { name: 'update:selected-record-key', args: ['k7'] },
        { name: 'update:selected-record', args: [record] },
        { name: 'cell-click', args: [{ record, recordIndex: 7, column: raw }] }
      ], 'check 翻转 + 续行流程')
      assertEqual(result.toggled, true, 'toggled 标记（S1 nextTick 重绘该行）')

      return '翻转 + 选中 + cell-click 同发；payload column 为原始列'
    }
  },
  {
    name: 'resolveCellClick：disabled 跳过翻转但仍续行；选中一致时不发 selected-*',
    fn: () => {
      const record = { checked: true }
      const column = { field: 'checked', type: 'check' }

      // disabled：无 update:cell-value，选中与 cell-click 照发（DOM 版 [disabled] 仅 pointer-events:none）
      const disabled = resolveCellClick({
        record,
        recordIndex: 0,
        column,
        recordKey: 'k0',
        selectedRecordKey: 'k9',
        selectedRecord: {},
        value: true,
        disabled: true
      })

      assertEvents(disabled.events, [
        { name: 'update:selected-record-key', args: ['k0'] },
        { name: 'update:selected-record', args: [record] },
        { name: 'cell-click', args: [{ record, recordIndex: 0, column }] }
      ], 'disabled 跳过翻转续行')
      assertEqual(disabled.toggled, false, 'disabled toggled=false')

      // 选中一致：无 selected-*（check 翻转与 cell-click 照发）
      const same = resolveCellClick({
        record,
        recordIndex: 0,
        column,
        recordKey: 'k0',
        selectedRecordKey: 'k0',
        selectedRecord: record,
        value: true
      })

      assertEvents(same.events, [
        { name: 'update:cell-value', args: [{ record, recordIndex: 0, column, value: false }] },
        { name: 'cell-click', args: [{ record, recordIndex: 0, column }] }
      ], '已选中去重 selected-*')

      // 非 check 列：无翻转，正常选中 + cell-click
      const text = resolveCellClick({
        record,
        recordIndex: 2,
        column: { field: 'name' },
        recordKey: 'k2',
        selectedRecordKey: 'k9',
        selectedRecord: {}
      })

      assertEqual(text.events.length, 3, '非 check 无 update:cell-value')
      assertEqual(text.events[0].name, 'update:selected-record-key', '非 check 首事件为选中 key')

      return 'disabled 只跳过翻转；选中去重；非 check 无翻转'
    }
  },
  {
    name: 'resolveResizeWidth：clamp（minWidth ?? 40 / maxWidth）与 scrollLeft 补偿',
    fn: () => {
      // pointerX=250（视口），columnLeft=100，scrollLeft=0 → 150
      assertEqual(resolveResizeWidth({ pointerX: 250, columnLeft: 100 }), 150, '基础宽度')
      assertEqual(resolveResizeWidth({ pointerX: 250, scrollLeft: 200, columnLeft: 100 }), 350, 'scrollLeft 补偿')

      // minWidth 缺省 40；配置 minWidth/maxWidth 生效
      assertEqual(resolveResizeWidth({ pointerX: 5, columnLeft: 100 }), RESIZE_MIN_WIDTH, '缺省下限 40')
      assertEqual(RESIZE_MIN_WIDTH, 40, 'RESIZE_MIN_WIDTH 契约')
      assertEqual(resolveResizeWidth({ pointerX: 5, columnLeft: 100, minWidth: 60 }), 60, '列级 minWidth')
      assertEqual(resolveResizeWidth({ pointerX: 900, columnLeft: 100, maxWidth: 400 }), 400, 'maxWidth clamp')

      return 'pointerX+scrollLeft−columnLeft，clamp [minWidth??40, maxWidth??∞]'
    }
  },
  {
    name: 'resolveResizeDirty：move 脏区左界=列左缘（至视口右端）+ 表头整幅',
    fn: () => {
      const dirty = resolveResizeDirty({ columnLeft: 100, viewportWidth: 800 })

      assertArray(dirty.band, { x: 100, width: 700 }, '脏区竖带（左界=列左缘）')
      assertEqual(dirty.header, true, '表头整幅标记')

      // 加宽场景：左界不因旧右缘收缩（列左缘一并覆盖该列与右侧列的重绘需求，防残影）
      const widened = resolveResizeDirty({ columnLeft: 100, viewportWidth: 800 })

      assertEqual(widened.band.x, 100, '加宽后左界仍为列左缘（非 min(旧右缘, 新右缘)）')

      const clamped = resolveResizeDirty({ columnLeft: 900, viewportWidth: 800 })

      assertEqual(clamped.band.width, 0, '列左缘超出视口时带宽 clamp 0')

      return 'band.x=columnLeft，band.width=viewportWidth−columnLeft，header=true'
    }
  },
  {
    name: 'resolveHoverDirtyRects：行带/列带/交叉/单元格（旧+新去重）与 none/移出',
    fn: () => {
      const base = {
        rowHeight: 36,
        headHeight: 36,
        scrollTop: 72,
        scrollLeft: 200,
        colLefts: [0, 100, 300, 600],
        colWidths: [100, 200, 300, 80],
        fixedLeftColumns: 1,
        viewportWidth: 800,
        viewportHeight: 436
      }

      // row 模式：旧行+新行两条全宽横带；y 含 scrollTop/行高换算
      const rows = resolveHoverDirtyRects({ ...base, mode: 'row', prev: { row: 0, col: 1 }, next: { row: 2, col: 1 } })

      assertEqual(rows.length, 2, 'row 两条横带')
      assertArray(rows[0], { x: 0, y: 36 + 0 * 36 - 72, width: 800, height: 36 }, '旧行带')
      assertArray(rows[1], { x: 0, y: 36 + 2 * 36 - 72, width: 800, height: 36 }, '新行带')

      // 同位置去重为一条；移出（next 缺）只剩旧行；移入（prev 缺）只剩新行
      assertEqual(resolveHoverDirtyRects({ ...base, mode: 'row', prev: { row: 1, col: 0 }, next: { row: 1, col: 0 } }).length, 1, '同位置去重')
      assertEqual(resolveHoverDirtyRects({ ...base, mode: 'row', prev: { row: 1, col: 0 }, next: null }).length, 1, '移出仅旧行')
      assertEqual(resolveHoverDirtyRects({ ...base, mode: 'row', prev: null, next: { row: 1, col: 0 } }).length, 1, '移入仅新行')

      // column 模式：固定列按视口坐标、滚动列减 scrollLeft；竖带表头以下全高
      const cols = resolveHoverDirtyRects({ ...base, mode: 'column', prev: { row: 1, col: 0 }, next: { row: 1, col: 2 } })

      assertEqual(cols.length, 2, 'column 两条竖带')
      assertArray(cols[0], { x: 0, y: 36, width: 100, height: 400 }, '固定列带（不随滚动位移）')
      assertArray(cols[1], { x: 300 - 200, y: 36, width: 300, height: 400 }, '滚动列带')

      // cross：行列各两条；cell：逐格矩形
      assertEqual(resolveHoverDirtyRects({ ...base, mode: 'cross', prev: { row: 0, col: 0 }, next: { row: 2, col: 2 } }).length, 4, 'cross 四条')
      assertArray(
        resolveHoverDirtyRects({ ...base, mode: 'cell', prev: null, next: { row: 1, col: 2 } })[0],
        { x: 100, y: 36 + 36 - 72, width: 300, height: 36 },
        'cell 单格矩形'
      )

      // none / 无 hover
      assertEqual(resolveHoverDirtyRects({ ...base, mode: 'none', prev: { row: 1, col: 0 }, next: { row: 2, col: 0 } }).length, 0, 'none 无脏区')
      assertEqual(resolveHoverDirtyRects({ ...base, mode: 'row' }).length, 0, '无位置无脏区')

      return '行带/列带/交叉/单格；旧+新去重；固定列视口坐标'
    }
  },
  {
    name: 'resolvePointerdown：editing 先提交再续命中；手柄开拖拽',
    fn: () => {
      // editing 中画布 pointerdown：先同步 commit，再继续正常命中（含手柄开拖）
      assertArray(
        Object.values(resolvePointerdown({ editing: {}, hit: { resizeCol: -1 } })),
        [true, false],
        'editing 中 commit'
      )
      assertArray(
        Object.values(resolvePointerdown({ editing: null, hit: { resizeCol: -1 } })),
        [false, false],
        '非 editing 不 commit'
      )
      assertArray(
        Object.values(resolvePointerdown({ editing: {}, hit: { resizeCol: 2 } })),
        [true, true],
        'editing + 手柄：提交且开拖'
      )
      assertArray(
        Object.values(resolvePointerdown({ editing: null, hit: { resizeCol: 2 } })),
        [false, true],
        '手柄开拖拽'
      )

      return 'commit 先行；手柄开拖'
    }
  },
  {
    name: 'resolveCellClickOpen：单击开编辑门控（click 语义，dblclick 通道已删除）',
    fn: () => {
      // 表体可编辑格 → openEditor；表头/列越界/不可编辑 → false（A5.2 意见 2a）
      assertArray(
        Object.values(resolveCellClickOpen({ hit: { isHeader: false, colIndex: 1, rowIndex: 3 }, cellEditable: true })),
        [true, 3, 1],
        '可编辑格 openEditor'
      )
      assertEqual(resolveCellClickOpen({ hit: { isHeader: true, colIndex: 1, rowIndex: -1 }, cellEditable: true }).openEditor, false, '表头不开编辑')
      assertEqual(resolveCellClickOpen({ hit: { isHeader: false, colIndex: -1, rowIndex: 3 }, cellEditable: true }).openEditor, false, '列越界不开编辑')
      assertEqual(resolveCellClickOpen({ hit: { isHeader: false, colIndex: 1, rowIndex: 3 } }).openEditor, false, 'cellEditable 缺省 false')
      assertEqual(resolveCellClickOpen({ hit: { isHeader: false, colIndex: 1, rowIndex: -1 }, cellEditable: true }).openEditor, false, '行越界不开编辑')

      return 'click 仅表体可编辑格开编辑；表头/越界/缺省不开'
    }
  },
  {
    name: 'resolveTreeToggle：hit.cellX 槽内判定（槽外/叶行/非树列不 toggle；右半可 toggle）',
    fn: () => {
      // 树形列 level 1：箭头槽 = cellX ∈ [16, 32)（level×16 至 level×16+16，内容区相对）
      const treeColumns = [{}, { _isTreeColumn: true }]
      const flatInfo = { levels: [0, 1], hasChildren: [true, true] }

      // 箭头中心 cellX = level×16 + 8 = 24 → toggle（自检点击坐标口径 = padding + level×16 + 8 的内容区值）
      const center = resolveTreeToggle({
        hit: { isHeader: false, colIndex: 1, rowIndex: 1, cellX: 24 },
        columns: treeColumns,
        flatInfo,
        recordKey: 'k-1'
      })

      assertArray([center.row, center.key], [1, 'k-1'], '箭头中心槽内 toggle')

      // 箭头右半 cellX = level×16 + 12 = 28 仍 < 32 → toggle（实施约束 3 断言）
      const rightHalf = resolveTreeToggle({
        hit: { isHeader: false, colIndex: 1, rowIndex: 1, cellX: 28 },
        columns: treeColumns,
        flatInfo,
        recordKey: 'k-1'
      })

      assertEqual(rightHalf.key, 'k-1', '箭头右半可 toggle')

      // 槽外（cellX ≥ level×16+16）→ null，走普通单元格点击链（评审 6 P3）
      assertEqual(
        resolveTreeToggle({ hit: { isHeader: false, colIndex: 1, rowIndex: 1, cellX: 32 }, columns: treeColumns, flatInfo, recordKey: 'k-1' }),
        null,
        '槽外不 toggle'
      )
      // 叶行槽内不 toggle（无箭头空槽）
      assertEqual(
        resolveTreeToggle({
          hit: { isHeader: false, colIndex: 1, rowIndex: 0, cellX: 8 },
          columns: treeColumns,
          flatInfo: { levels: [0], hasChildren: [false] },
          recordKey: 'k0'
        }),
        null,
        '叶行槽内不 toggle'
      )
      // 非树形列 / 树关（flatInfo null）/ 表头 / cellX 缺失
      assertEqual(
        resolveTreeToggle({ hit: { isHeader: false, colIndex: 0, rowIndex: 1, cellX: 8 }, columns: treeColumns, flatInfo, recordKey: 'k' }),
        null,
        '非树形列不 toggle'
      )
      assertEqual(
        resolveTreeToggle({ hit: { isHeader: false, colIndex: 1, rowIndex: 1, cellX: 24 }, columns: treeColumns, flatInfo: null, recordKey: 'k' }),
        null,
        '树关不 toggle'
      )
      assertEqual(
        resolveTreeToggle({ hit: { isHeader: true, colIndex: 1, rowIndex: -1, cellX: null }, columns: treeColumns, flatInfo, recordKey: 'k' }),
        null,
        '表头不 toggle'
      )

      return 'cellX < level×16+16 槽内且 hasChildren 才 toggle；右半可 toggle；槽外/叶行/非树列不 toggle'
    }
  },
  {
    name: 'resolveItemClick：hit.x/y 条目矩形反查（dots 命中、窗口外行不命中）',
    fn: () => {
      // itemHits 形状（painter 契约）：Map<row, Map<col, Array<{ kind, index, rect }>>>，
      // rect 为视口坐标
      const itemHits = new Map([
        [3, new Map([
          [1, [
            { kind: 'link', index: 0, rect: { x: 120, y: 120, width: 40, height: 18 } },
            { kind: 'link', index: 2, rect: { x: 120, y: 156, width: 24, height: 18 } }
          ]],
          [2, [
            { kind: 'tag', index: 0, rect: { x: 320, y: 120, width: 30, height: 36 } }
          ]]
        ])]
      ])

      // 命中 link 条目 0
      const hitLink = resolveItemClick({ hit: { isHeader: false, colIndex: 1, rowIndex: 3, x: 130, y: 130 }, itemHits })

      assertArray([hitLink.kind, hitLink.index, hitLink.row, hitLink.col], ['link', 0, 3, 1], 'link 条目反查')

      // dots '...' 条目（index 2）同样命中（评审 6 P4：DOM 版 dots 绑定 events.click）
      const hitDots = resolveItemClick({ hit: { isHeader: false, colIndex: 1, rowIndex: 3, x: 132, y: 160 }, itemHits })

      assertArray([hitDots.kind, hitDots.index], ['link', 2], 'dots 条目命中')

      // 矩形间空隙不命中
      assertEqual(
        resolveItemClick({ hit: { isHeader: false, colIndex: 1, rowIndex: 3, x: 130, y: 145 }, itemHits }),
        null,
        '条目间隙不命中'
      )
      // 窗口外行不在集合内
      assertEqual(
        resolveItemClick({ hit: { isHeader: false, colIndex: 1, rowIndex: 9, x: 130, y: 130 }, itemHits }),
        null,
        '窗口外行不命中'
      )
      // 表头 / itemHits 缺失
      assertEqual(
        resolveItemClick({ hit: { isHeader: true, colIndex: 1, rowIndex: -1, x: 130, y: 10 }, itemHits }),
        null,
        '表头不反查'
      )
      assertEqual(resolveItemClick({ hit: { isHeader: false, colIndex: 1, rowIndex: 3, x: 1, y: 1 } }), null, 'itemHits 缺省安全')

      return 'x/y (row,col) 反查命中；dots 命中；间隙/窗口外/表头不命中'
    }
  },
  {
    name: 'resolveCursor 三参 context：树槽 pointer / 叶行槽内 default / 可编辑格 text / 缺省回归',
    fn: () => {
      const columns = [{}, { _isTreeColumn: true }, { editor: true }]
      const flatInfo = { levels: [1, 1], hasChildren: [true, false] }

      // 树箭头槽内（cellX < 32）+ hasChildren → pointer（A3.4/A5.3）
      assertEqual(
        resolveCursor(
          { isHeader: false, colIndex: 1, rowIndex: 0, resizeCol: -1, cellX: 24 },
          columns,
          { flatInfo, editable: true, isCellEditableFn: () => true }
        ),
        'pointer',
        '树箭头槽 pointer'
      )
      // 叶行空槽（hasChildren false）+ 非可编辑列 → 不感知 pointer 落 default
      assertEqual(
        resolveCursor(
          { isHeader: false, colIndex: 1, rowIndex: 1, resizeCol: -1, cellX: 24 },
          columns,
          { flatInfo, editable: true, isCellEditableFn: () => false }
        ),
        'default',
        '叶行槽内 default'
      )
      // 叶行空槽 + 可编辑列：无 pointer 但仍按可编辑格感知 text（空槽可进编辑）
      assertEqual(
        resolveCursor(
          { isHeader: false, colIndex: 1, rowIndex: 1, resizeCol: -1, cellX: 24 },
          columns,
          { flatInfo, editable: true, isCellEditableFn: () => true }
        ),
        'text',
        '叶行槽内可编辑格 text'
      )
      // 可编辑格 → text（A5.3）
      assertEqual(
        resolveCursor(
          { isHeader: false, colIndex: 2, rowIndex: 0, resizeCol: -1, cellX: 40 },
          columns,
          { flatInfo, editable: true, isCellEditableFn: col => col.editor != null }
        ),
        'text',
        '可编辑格 text'
      )
      // editable 关 / 判定函数拒绝 → default
      assertEqual(
        resolveCursor(
          { isHeader: false, colIndex: 2, rowIndex: 0, resizeCol: -1, cellX: 40 },
          columns,
          { flatInfo, editable: false, isCellEditableFn: () => true }
        ),
        'default',
        'editable 关 default'
      )
      // context 缺省 → 两参行为回归（评审 6 P3）
      assertEqual(
        resolveCursor({ isHeader: false, colIndex: 1, rowIndex: 0, resizeCol: -1, cellX: 24 }, columns),
        'default',
        'context 缺省回归 default'
      )
      // 手柄 / 表头可排序优先级不变
      assertEqual(resolveCursor({ resizeCol: 1 }, columns, { flatInfo }), 'col-resize', '手柄优先')
      assertEqual(
        resolveCursor({ isHeader: true, colIndex: 1, resizeCol: -1 }, [{}, { sortable: true }], { flatInfo }),
        'pointer',
        '表头可排序优先'
      )

      return '树槽 pointer/叶行 default/可编辑 text/缺省回归/手柄与表头优先级不变'
    }
  },
  {
    name: 'resolveResizeWidth 组合 resolveTypeMinWidth：拖拽下限缺省 = 类型最小宽（评审 6 P2）',
    fn: () => {
      // 壳 startResize 传参组合（接线链 = col.minWidth 显式值 > 类型最小宽 > 40 兜底；
      // 真正 clamp 在 resolveResizeWidth，A4.1）
      const dragMinWidthOf = col =>
        getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH
      const dragWidthOf = (col, pointerX) => resolveResizeWidth({
        pointerX,
        columnLeft: 100,
        minWidth: dragMinWidthOf(col)
      })

      // text 列：意图 30px → clamp 到类型最小宽 80
      assertEqual(dragWidthOf({ type: 'text' }, 130), 80, 'text 列下限 80')
      // bool 列 40（窄类型不再被 80 抬高）
      assertEqual(dragWidthOf({ type: 'bool' }, 130), 40, 'bool 列下限 40')
      // col.minWidth 显式值优先（覆盖类型最小宽；'96px' 字符串解析）
      assertEqual(dragWidthOf({ type: 'text', minWidth: 120 }, 130), 120, 'col.minWidth 显式优先')
      assertEqual(dragWidthOf({ type: 'text', minWidth: '96px' }, 130), 96, 'col.minWidth 字符串解析')
      // 无类型列 = text 80；自定义类型对象 = _fallback 40
      assertEqual(dragWidthOf({}, 130), 80, '无 type 列下限 80')
      assertEqual(dragWidthOf({ type: {} }, 130), 40, '_fallback 下限 40')
      // 正常拖拽不受下限影响
      assertEqual(dragWidthOf({ type: 'text' }, 250), 150, '超下限不 clamp')

      return 'text 80 / bool 40 / 显式 minWidth 优先 / 无 type 80 / _fallback 40'
    }
  },
  {
    name: 'createClickGuard：consume 消费即清除；release 后延时清除（decisions ⑧ 延时窗口）',
    fn: () => {
      const queue = []
      const guard = createClickGuard({ schedule: fn => queue.push(fn) })

      // 未 arm：click 不丢弃
      assertEqual(guard.consume(), false, '未 arm 不丢弃')

      // arm → consume 返回 true 且立即解除（消费并清除）
      guard.arm()
      assertEqual(guard.consume(), true, '拖拽后 click 丢弃')
      assertEqual(guard.consume(), false, '消费后立即解除')

      // canvas 外释放（无 click）：release 后延时窗口内的 click 仍被消费，延时任务执行后清除
      guard.arm()
      guard.release()
      assertEqual(queue.length, 1, 'release 排入延时清除')
      assertEqual(guard.consume(), true, '延时未到：click 窗口内仍消费')
      queue.shift()()
      assertEqual(guard.consume(), false, '延时清除后不再吞 click')

      // 延时任务在无 click 时同样清除残留 flag
      guard.arm()
      guard.release()
      queue.shift()()
      assertEqual(guard.consume(), false, '无 click 场景延时清除')

      return 'consume 即清；release 延时窗口内消费、窗口后清除；canvas 外释放无残留'
    }
  },
  {
    name: 'createFrameScheduler：同帧多次 schedule 合并为一次回调；cancel 后不再执行',
    fn: () => {
      const frames = []
      const raf = fn => {
        frames.push(fn)

        return frames.length
      }
      let runs = 0
      const scheduler = createFrameScheduler(() => runs++, raf)

      scheduler.schedule()
      scheduler.schedule()
      scheduler.schedule()
      assertEqual(frames.length, 1, '同帧仅入队一次 rAF')

      frames.shift()()
      assertEqual(runs, 1, '帧回调执行一次')

      // 下一帧可再次调度
      scheduler.schedule()
      assertEqual(frames.length, 1, '新帧重新入队')
      frames.shift()()
      assertEqual(runs, 2, '第二帧执行')

      // cancel 后挂起帧不执行
      scheduler.schedule()
      scheduler.cancel()
      frames.shift()()
      assertEqual(runs, 2, 'cancel 后不执行')

      // Node 容错：未注入 raf 时可创建（setTimeout 路径）
      const fallback = createFrameScheduler(() => {})

      assertEqual(typeof fallback.schedule, 'function', '缺省 raf 可创建')

      return '同帧合并 / 帧边界重置 / cancel 屏蔽 / 缺省 raf 容错'
    }
  }
]
