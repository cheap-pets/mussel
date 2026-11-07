/**
 * table-ex 自检断言 — row-geometry-controller 模块（20261105-measure-perf-apply P1）。
 *
 * createRowGeometryController 无 Vue/DOM 依赖，以假 ctx 直驱断言：
 * - 进窗精算跳过（P1）：几何值 + recordsVersion + 树缩进三条件快照全匹配才跳过；
 * - recordsVersion 快照失配 → 重算（就地改值通知通道，粘性契约）；
 * - 树缩进快照失配 → 重算且高度随折行宽度变化；
 * - 列宽/主题签名清空（syncMeasuredHeightCache）、spans 身份整体清空重算；
 * - 几何值被直接抬高（模拟 mergeMeasuredHeights max 命中）→ 失配重算回落；
 * - 条目列 render 计数粘性：版本不 bump 不重算，bump 后重算反映新计数；
 * - 重扫 rebuild → mergeMeasuredHeights 混入真值 → totalHeight 不回缩（#15）。
 * measure 为注入参数（等宽假测量），模块级零 canvas 依赖。
 */
import { createRowGeometryController } from '@/components/table/ex/geometry/row-geometry-controller.js'
import { buildSpans } from '@/components/table/ex/spans/spans.js'
import { createWrapCache } from '@/components/table/ex/shared/text-wrap.js'

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

function assertEqual (actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} 期望 ${expected}，实际 ${actual}`)
  }

  return String(actual)
}

// 主题夹具：--row-height 36 / --cell-padding 8 / --cell-line-height 18（row-geometry 自检同口径）
const THEME = { rowHeight: 36, cellPadding: 8, cellLineHeight: 18, fontSize: 14, fontFamily: 'test-font' }

// 等宽假测量：每字符 10px（CJK/拉丁同宽，折行位置可精确断言）
const plainMeasure = text => text.length * 10

/** list/link 条目列 render 夹具（与 self-checks/row-geometry.js listRenderOf 同式） */
function listRenderOf ({ value }) {
  return { items: (Array.isArray(value) ? value : []).map(el => ({ text: el })) }
}

/**
 * 假 ctx 夹具：3 列 × 10 行。
 * - 列 0：`_maxLines: 2` + `_isTreeColumn: true` 多行树形列（8 字 = 80px：
 *   inset 0 → 内容宽 84 ≥ 80 单行 36；inset 16 → 68 < 80 两行 52）；
 * - 列 1：`type: 'list'` + 手写 `_render` 条目列（行 0 三条目 → 估高/精算同真值 70）；
 * - 列 2：专用 `_value` 计数列（valueCalls.count = 测量侧求值数）。
 * 窗口：viewH 400 + OVERSCAN 2 → scrollTop 0 时窗口 = 全部 10 行
 * （总高 70 + 36×9 = 394 < 400）。
 */
function createFixture () {
  const state = {
    recordsVersion: 0,
    levels: new Array(10).fill(0),
    rows: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      note: 'x'.repeat(8),
      tags: i === 0 ? ['a', 'b', 'c'] : ['a'],
      name: `r${i}`
    })),
    spans: null
  }
  const valueCalls = { count: 0 }
  const renderCalls = { count: 0 }
  const wrapCache = createWrapCache()
  const columns = [
    { field: 'note', _maxLines: 2, _isTreeColumn: true },
    {
      type: 'list',
      field: 'tags',
      _render: ({ value }) => {
        renderCalls.count++

        return listRenderOf({ value })
      }
    },
    {
      field: 'name',
      _value: record => {
        valueCalls.count++

        return record.name
      }
    }
  ]
  const treeIndents = (colIndex, row) => (colIndex === 0 ? 16 * state.levels[row] : 0)
  let layout = { viewH: 400, colWidths: [100, 100, 100], headHeight: 36, stickyHeight: 0 }
  const controller = createRowGeometryController({
    getRows: () => state.rows,
    getColumns: () => columns,
    getTreeIndents: () => treeIndents,
    getRecordsOffset: () => 0,
    getRecordsVersion: () => state.recordsVersion,
    getTheme: () => THEME,
    getMeasure: () => plainMeasure,
    getWrapCache: () => wrapCache,
    getColumnKey: col => col?.field ?? '',
    getSpans: () => state.spans,
    getScrollEl: () => ({ scrollTop: 0 }),
    getLayout: () => layout,
    setLayout: next => {
      layout = next
    },
    relayout: () => {}
  })

  return { state, columns, valueCalls, renderCalls, controller, layoutBox: () => layout }
}

/** 首扫进变高模式（行 0 list 三条目触发 hasArrayValues）+ 首轮进窗精算 */
function prime (fixture) {
  const { valueCalls, controller, layoutBox } = fixture
  const result = controller.resolveForRelayout({ colWidths: layoutBox().colWidths, theme: THEME })

  valueCalls.count = 0
  controller.remeasureVisibleRows()

  return result
}

/** 表级短路夹具：全确定单行列（无条目列、无变高候选、无 spans）——短路谓词
 *  成立的最小场景 */
function createSingleLineFixture () {
  const state = {
    rows: Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `r${i}`, count: i, checked: false })),
    columns: [
      { field: 'name' },
      { field: 'count', type: 'number' },
      { field: 'checked', type: 'check' }
    ],
    spans: null
  }
  let layout = { viewH: 400, colWidths: [100, 100, 100], headHeight: 36, stickyHeight: 0 }
  const controller = createRowGeometryController({
    getRows: () => state.rows,
    getColumns: () => state.columns,
    getTreeIndents: () => null,
    getRecordsOffset: () => 0,
    getRecordsVersion: () => 0,
    getTheme: () => THEME,
    getMeasure: () => plainMeasure,
    getWrapCache: () => createWrapCache(),
    getColumnKey: col => col?.field ?? '',
    getSpans: () => state.spans,
    getScrollEl: () => ({ scrollTop: 0 }),
    getLayout: () => layout,
    setLayout: next => {
      layout = next
    },
    relayout: () => {}
  })

  return { state, controller, layoutBox: () => layout }
}

/** 升级路径夹具：uniform 表（全单条目，条目列在场谓词假、不短路）——编辑引入
 *  多条目后经 remeasureUniformRow 升级 variable */
function createUpgradableFixture () {
  const state = {
    rows: Array.from({ length: 4 }, (_, i) => ({ id: i + 1, name: `r${i}`, tags: ['a'] })),
    columns: [
      { field: 'name' },
      { field: 'tags', type: 'list', _render: listRenderOf }
    ],
    spans: null
  }
  let layout = { viewH: 400, colWidths: [100, 100], headHeight: 36, stickyHeight: 0 }
  let relayoutCalls = 0
  const controller = createRowGeometryController({
    getRows: () => state.rows,
    getColumns: () => state.columns,
    getTreeIndents: () => null,
    getRecordsOffset: () => 0,
    getRecordsVersion: () => 0,
    getTheme: () => THEME,
    getMeasure: () => plainMeasure,
    getWrapCache: () => createWrapCache(),
    getColumnKey: col => col?.field ?? '',
    getSpans: () => state.spans,
    getScrollEl: () => ({ scrollTop: 0 }),
    getLayout: () => layout,
    setLayout: next => {
      layout = next
    },
    relayout: () => {
      relayoutCalls++
    }
  })

  return { state, controller, layoutBox: () => layout, relayoutCalls: () => relayoutCalls }
}

export const checks = [
  {
    name: 'P1 跳过：首次进窗精算计数列求值 = 窗口行数；稳态再次调用增量 0',
    fn: () => {
      const fixture = createFixture()
      const { valueCalls, controller } = fixture

      assertEqual(controller.mode, 'uniform', '初建 uniform')

      prime(fixture)

      assertEqual(controller.mode, 'variable', 'list 条目 > 1 → variable')
      assertEqual(valueCalls.count, 10, '首次精算 = 窗口行数（10 行全窗）')

      controller.remeasureVisibleRows()

      assertEqual(valueCalls.count, 10, '稳态帧跳过：增量 0')

      return '首扫 10 次求值；稳态帧 +0（几何值 + 版本 + 缩进快照全匹配跳过）'
    }
  },
  {
    name: 'recordsVersion 快照失配：版本 bump 后重算（增量恢复 = 窗口行数），rows 引用不变不重扫',
    fn: () => {
      const fixture = createFixture()
      const { state, valueCalls, controller, layoutBox } = fixture

      prime(fixture)

      controller.remeasureVisibleRows()
      assertEqual(valueCalls.count, 10, '稳态帧仍跳过')

      state.recordsVersion++

      const relayout = controller.resolveForRelayout({ colWidths: layoutBox().colWidths, theme: THEME })

      assertEqual(relayout.scanCount, 0, '版本变化不触发重扫（树关 rows 引用不变）')

      valueCalls.count = 0
      controller.remeasureVisibleRows()

      assertEqual(valueCalls.count, 10, '版本快照失配 → 全窗口重算')

      return 'scanCount 0；remeasure 增量 10（records 就地改值的唯一通知通道）'
    }
  },
  {
    name: '列宽签名漂移：resolveForRelayout 清空精算缓存 → 重算（syncMeasuredHeightCache 失效路径不受 P1 影响）',
    fn: () => {
      const fixture = createFixture()
      const { valueCalls, controller, layoutBox } = fixture

      prime(fixture)

      controller.remeasureVisibleRows()
      assertEqual(valueCalls.count, 10, '基线稳态跳过')

      layoutBox().colWidths = [120, 100, 100]
      controller.resolveForRelayout({ colWidths: [120, 100, 100], theme: THEME })

      valueCalls.count = 0
      controller.remeasureVisibleRows()

      assertEqual(valueCalls.count, 10, '缓存清空 → 全窗口重算')

      return '列宽签名变化 → WeakMap 整体清空 → 增量 10'
    }
  },
  {
    name: 'spans 身份变化：buildSpans 新 SpansIndex → resolveForRelayout 整体清空 → 重算（同一实例消费）',
    fn: () => {
      const fixture = createFixture()
      const { state, columns, valueCalls, controller, layoutBox } = fixture

      prime(fixture)

      controller.remeasureVisibleRows()
      assertEqual(valueCalls.count, 10, '基线稳态跳过')

      // 真实 SpansIndex：note 列启用 autoRowSpan（8 字同值 → 全表 rowspan 10 合并）
      state.spans = buildSpans({
        records: state.rows,
        columns: [{ ...columns[0], _autoRowSpan: true }, columns[1], columns[2]],
        fixedCount: 0,
        recordsOffset: 0,
        orderBy: '',
        warn: () => {}
      })

      assert(state.spans, 'buildSpans 应产出非空 SpansIndex')

      controller.resolveForRelayout({ colWidths: layoutBox().colWidths, theme: THEME })

      valueCalls.count = 0
      controller.remeasureVisibleRows()

      assertEqual(valueCalls.count, 10, 'spans 身份失效 → 全窗口重算')

      return 'spans 引用变化 → WeakMap 清空 → 增量 10（合并分层重扫语义保持）'
    }
  },
  {
    name: '几何值高于缓存真值：直接抬高后不跳过、重算并回落（merge max 命中路径）',
    fn: () => {
      const fixture = createFixture()
      const { valueCalls, controller } = fixture

      prime(fixture)

      controller.remeasureVisibleRows()
      assertEqual(valueCalls.count, 10, '基线稳态跳过')
      assertEqual(controller.geometry.heightAt(3), 36, '行 3 精算真值 36')

      // 模拟 rebuild 后 merge 把几何抬高超过缓存真值（条目列 render 计数漂移场景）
      controller.geometry.updateHeight(3, 100)

      valueCalls.count = 0
      controller.remeasureVisibleRows()

      assertEqual(valueCalls.count, 1, '仅抬高行失配重算（其余行跳过）')
      assertEqual(controller.geometry.heightAt(3), 36, '重算后回落精算真值')

      return 'heightAt ≠ cached.height → 失配重算；36 ← 100 回落'
    }
  },
  {
    name: '条目列粘性契约：render 计数漂移不 bump 版本不重算；bump 后重算反映新计数',
    fn: () => {
      const fixture = createFixture()
      const { state, renderCalls, controller } = fixture

      prime(fixture)

      controller.remeasureVisibleRows()
      assertEqual(controller.geometry.heightAt(0), 70, '行 0 三条目基线')

      // 就地改条目数据（render 计数 3 → 5）但不 bump 版本：跳过 → 高度冻结（粘性）
      state.rows[0].tags = ['a', 'b', 'c', 'd', 'e']

      controller.remeasureVisibleRows()
      assertEqual(controller.geometry.heightAt(0), 70, '版本未 bump → 高度不随内容变')

      state.recordsVersion++

      const renderBefore = renderCalls.count

      controller.remeasureVisibleRows()

      // 版本是全表快照维度：bump 后窗口内全部行失配重算（行 0 反映新计数 106）
      assertEqual(renderCalls.count, renderBefore + 10, '版本 bump → 全窗口重算')
      assertEqual(controller.geometry.heightAt(0), 16 + 5 * 18, '重算反映新计数 106')

      return '不 bump → 70 冻结；bump → 全窗重算、行 0 高 106（估高/精算同走 render 计数）'
    }
  },
  {
    name: '树缩进快照失配：levels 变化（rows 引用/版本不变）→ 重算且高度 36 → 52',
    fn: () => {
      const fixture = createFixture()
      const { state, valueCalls, controller } = fixture

      prime(fixture)

      controller.remeasureVisibleRows()
      assertEqual(valueCalls.count, 10, '基线全窗精算')
      assertEqual(controller.geometry.heightAt(1), 36, 'inset 0 → 8 字单行 36')

      // 树层级变化：仅缩进快照失配（rows 引用、版本均不变）
      state.levels[1] = 1

      valueCalls.count = 0
      controller.remeasureVisibleRows()

      assertEqual(valueCalls.count, 1, '仅缩进变化行重算')
      assertEqual(controller.geometry.heightAt(1), 52, 'inset 16 → 68 < 80 两行 52')

      return '行 1 失配重算：36 → 52；其余行跳过（增量 1）'
    }
  },
  {
    name: '重扫 rebuild：rows 引用替换（同 record 对象）→ 重扫 + merge 混入真值 totalHeight 不回缩；随后增量 0',
    fn: () => {
      const fixture = createFixture()
      const { state, valueCalls, controller, layoutBox } = fixture

      prime(fixture)

      controller.remeasureVisibleRows()
      assertEqual(valueCalls.count, 10, '基线全窗精算')

      const totalBefore = controller.geometry.totalHeight

      // 模拟树重建 / 排序：同 record 对象的新数组（缓存键仍命中）
      state.rows = [...state.rows]

      const relayout = controller.resolveForRelayout({ colWidths: layoutBox().colWidths, theme: THEME })

      assertEqual(relayout.scanCount, 10, '行集合引用变化触发重扫')
      assertEqual(relayout.rebuild, true, '变高模式重建')

      const totalAfter = controller.geometry.totalHeight

      assert(totalAfter >= totalBefore, `merge 后 totalHeight 回缩（${totalAfter} < ${totalBefore}）`)
      assertEqual(totalAfter, totalBefore, '真值混入后总高与重扫前一致')

      valueCalls.count = 0
      controller.remeasureVisibleRows()

      assertEqual(valueCalls.count, 0, '缓存快照未被清空 → 稳态跳过')

      return 'scanCount 10 / rebuild true；totalHeight 不回缩；remeasure 增量 0'
    }
  },
  {
    name: '表级短路：全确定单行列 uniform 首次 resolveForRelayout scanCount=0、mode 保持 uniform、rows 替换后仍 0',
    fn: () => {
      const fixture = createSingleLineFixture()
      const { state, controller } = fixture

      assertEqual(controller.mode, 'uniform', '初建 uniform')

      const first = controller.resolveForRelayout({ colWidths: [100, 100, 100], theme: THEME })

      assertEqual(first.scanCount, 0, '首次 relayout 短路 scanCount = 0（不执行 computeRowHeights）')
      assertEqual(first.rebuild, false, 'rebuild false')
      assertEqual(controller.mode, 'uniform', 'mode 保持 uniform')
      assertEqual(first.geometry.mode, 'uniform', '返回等高几何')

      // rows 引用替换（排序/树重建同构）→ isScanDirty 真但谓词仍成立 → 仍 0
      state.rows = [...state.rows]

      const second = controller.resolveForRelayout({ colWidths: [100, 100, 100], theme: THEME })

      assertEqual(second.scanCount, 0, 'rows 替换后仍短路 0')
      assertEqual(controller.mode, 'uniform', 'rows 替换后 mode 仍 uniform')

      return '首扫 0 / rebuild false / uniform 保持；rows 替换后仍 0'
    }
  },
  {
    name: '短路条件破坏：列加条目列 / 出现变高候选 / spans 非 null / mode 已 variable → 恢复全量扫 scanCount = n',
    fn: () => {
      // ① 列集合加入 list 条目列（columnsChanged + 谓词假 → 全量扫，单条目不升级）
      const f1 = createSingleLineFixture()
      const { state, controller, layoutBox } = f1

      controller.resolveForRelayout({ colWidths: layoutBox().colWidths, theme: THEME })

      state.columns = [...state.columns, { field: 'tags', type: 'list', _render: listRenderOf }]
      state.rows.forEach(r => {
        r.tags = ['a']
      })

      const withLink = controller.resolveForRelayout({ colWidths: [100, 100, 100, 100], theme: THEME })

      assertEqual(withLink.scanCount, 6, '列加条目列 → 全量扫 6')
      assertEqual(controller.mode, 'uniform', '单条目不升级')

      // ② 出现变高候选（_maxLines > 1 列加入，列引用替换进签名）
      const f2 = createSingleLineFixture()

      f2.controller.resolveForRelayout({ colWidths: [100, 100, 100], theme: THEME })

      f2.state.columns = [...f2.state.columns, { field: 'name', _maxLines: 3 }]

      const withCandidate = f2.controller.resolveForRelayout({ colWidths: [100, 100, 100, 100], theme: THEME })

      assertEqual(withCandidate.scanCount, 6, '出现变高候选列 → 全量扫 6')

      // ③ spans 非 null（grp 列同值 autoRowSpan → 全表合并区，保证 buildSpans
      // 非 null）——谓词 !spans 假
      const f3 = createSingleLineFixture()

      f3.controller.resolveForRelayout({ colWidths: [100, 100, 100], theme: THEME })

      f3.state.spans = buildSpans({
        records: f3.state.rows.map(r => ({ ...r, grp: 'g' })),
        columns: [...f3.state.columns, { field: 'grp', _autoRowSpan: true }],
        fixedCount: 0,
        recordsOffset: 0,
        orderBy: '',
        warn: () => {}
      })

      assert(f3.state.spans, '前置：buildSpans 应产出非空 SpansIndex（无有效区域时返回 null）')

      const withSpans = f3.controller.resolveForRelayout({ colWidths: [100, 100, 100], theme: THEME })

      assertEqual(withSpans.scanCount, 6, 'spans 非 null → 全量扫 6')

      // ④ mode 已 variable（只升不降）→ 谓词 mode === 'uniform' 恒假 → 列变仍全量扫
      const f4 = createSingleLineFixture()

      f4.state.columns = [...f4.state.columns, { field: 'tags', type: 'list', _render: listRenderOf }]
      f4.state.rows[0].tags = ['a', 'b', 'c']
      f4.controller.resolveForRelayout({ colWidths: [100, 100, 100, 100], theme: THEME })

      assertEqual(f4.controller.mode, 'variable', '前置：多条目升级 variable')

      f4.state.columns = f4.state.columns.slice(0, 3)

      const backToSingle = f4.controller.resolveForRelayout({ colWidths: [100, 100, 100], theme: THEME })

      assertEqual(backToSingle.scanCount, 6, 'mode 已 variable → 列变仍全量扫（不短路）')

      return '条目列/变高候选/spans/mode 已 variable 四条破坏路径均恢复全量扫 6'
    }
  },
  {
    name: '升级路径完整：uniform 表编辑引入多条目 → remeasureUniformRow 升级 variable + relayout 全量重扫',
    fn: () => {
      const fixture = createUpgradableFixture()
      const { state, controller, layoutBox, relayoutCalls } = fixture

      // 全部单条目：条目列在场谓词假 → 全量扫 4，但 mode 保持 uniform
      const first = controller.resolveForRelayout({ colWidths: layoutBox().colWidths, theme: THEME })

      assertEqual(first.scanCount, 4, '首扫全量 4（条目列在场不短路）')
      assertEqual(controller.mode, 'uniform', '单条目不升级')

      // 编辑引入多条目：remeasureRow → remeasureUniformRow 判定 hasArrayValues
      state.rows[1].tags = ['a', 'b', 'c']
      controller.remeasureRow(1)

      assertEqual(relayoutCalls(), 1, '升级触发壳全量 relayout 恰 1 次')
      assertEqual(controller.mode, 'variable', 'mode 升级 variable')

      // 升级后首轮 relayout：lastScanRows 已置 null → 全量重扫 + 变高几何重建
      const after = controller.resolveForRelayout({ colWidths: layoutBox().colWidths, theme: THEME })

      assertEqual(after.scanCount, 4, '升级后全量重扫 4')
      assertEqual(after.rebuild, true, '变高几何重建')
      assertEqual(after.geometry.mode, 'variable', '返回变高几何')
      assertEqual(after.geometry.heightAt(1), 16 + 3 * 18, '行 1 高 70（3 条目真值）')

      return 'remeasureRow 升级 + relayout 1 次；重扫 scanCount 4 / rebuild true / 行 1 高 70'
    }
  }
]
