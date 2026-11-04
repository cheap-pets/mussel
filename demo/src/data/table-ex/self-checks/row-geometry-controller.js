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
import { createRowGeometryController } from '@/components/table/ex/row-geometry-controller.js'
import { buildSpans } from '@/components/table/ex/spans.js'
import { createWrapCache } from '@/components/table/ex/text-wrap.js'

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
  }
]
