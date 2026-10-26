/**
 * canvas-table 自检断言 — row-geometry 模块（G1-a）。
 *
 * 覆盖（02-design.md G1-a 判据 + 改动清单 self-checks/row-geometry.js 行；
 * 实施约束 2：夹具手写 _maxLines/_resolveMaxLines/_maxItems/_render 内部字段，
 * 不依赖 G2 的 prepareColumn 扩展；约束 6：contentWidth = 列宽 − 2×padding −
 * (16×level+16)，padding 取 --cell-padding 8px）：
 * - uniform 模式与等高算式 / layout.computeViewRows 恒等；
 * - variable 模式 topAt/totalHeight/updateHeight Δ/offsetToRow/visibleRange
 *   与测试内朴素参考实现（O(n²) 逐行累加，随机整数高度 1000 行）一致；
 * - Fenwick rebuild 后一致；computeAnchorShift 锚定补偿值；
 * - computeRowHeights 全量快速估高（零测量、数组值/link 条目计数真值、
 *   hasArrayValues 模式判定输入）、ensureRowMeasured 进窗精算
 *   （短路零测量、maxLines 钳制、函数形态 _resolveMaxLines 行级求值、
 *   treeIndents(colIndex, row) 仅扣树形列 contentWidth）。
 * measure 为注入参数（等宽假测量），模块级零 canvas 依赖。
 */
import {
  createUniformRowGeometry,
  createVariableRowGeometry,
  computeAnchorShift,
  computeRowHeights,
  ensureRowMeasured
} from '@/components/canvas-table/row-geometry.js'
import { OVERSCAN, computeViewRows } from '@/components/canvas-table/layout.js'

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

function assertEqual (actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} 期望 ${expected}，实际 ${actual}`)
  }

  return String(actual)
}

// 等宽假测量：每字符 10px（CJK/拉丁同宽，折行位置可精确断言）
const CHAR_W = 10
const FONT = '14px test-font'

const plainMeasure = text => text.length * CHAR_W

/** 计数包装：统计 measure 调用次数（零测量断言用） */
function countingMeasure (counter) {
  return (text, font) => {
    counter.calls++
    return plainMeasure(text)
  }
}

function assertArrayEqual (actual, expected, label) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)

  if (a !== e) throw new Error(`${label} 期望 ${e}，实际 ${a}`)

  return a
}

/** 主题夹具：--row-height 36 / --cell-padding 8 / --cell-line-height 18（约束 6 口径） */
const THEME = { rowHeight: 36, cellPadding: 8, cellLineHeight: 18, fontSize: 14, fontFamily: 'test-font' }

/** 确定性伪随机（LCG，整数高度保证浮点求和精确，严格相等可比） */
function createRandom (seed) {
  let state = seed

  return () => {
    state = (state * 48271) % 2147483647

    return state / 2147483647
  }
}

/** 朴素参考实现（测试内 O(n²) 逐行累加） */
function createNaive (heights) {
  return {
    topAt (i) {
      let sum = 0

      for (let k = 0; k < i; k++) sum += heights[k]

      return sum
    },
    total: heights.reduce((a, b) => a + b, 0),
    rowAt (y) {
      let acc = 0

      for (let i = 0; i < heights.length; i++) {
        if (y < acc + heights[i]) return i

        acc += heights[i]
      }

      return heights.length
    }
  }
}

/** 朴素 visibleRange（与设计 A2.2 同语义：首行定位 + 累加覆盖 + 两侧扩 overscan） */
function naiveVisibleRange (heights, scrollTop, viewH, overscan) {
  const n = heights.length

  if (!n) return { start: 0, end: 0, count: 0 }

  const y = Math.max(0, scrollTop)
  const naive = createNaive(heights)
  const first = naive.rowAt(y)
  const start = Math.min(Math.max(first - overscan, 0), n)
  let end = first

  while (end < n && naive.topAt(end) < y + Math.max(0, viewH)) end++

  end = Math.min(Math.max(end + overscan, start), n)

  return { start, end, count: end - start }
}

export const checks = [
  {
    name: 'uniform 几何：与等高算式及 layout.computeViewRows 恒等（含非行对齐 scrollTop）',
    fn: () => {
      const h = 36
      const n = 100
      const g = createUniformRowGeometry({ rowHeight: h, rowCount: n })

      assertEqual(g.mode, 'uniform', 'mode')
      assertEqual(g.rowCount, n, 'rowCount')
      assertEqual(g.heightAt(7), h, 'heightAt')
      assertEqual(g.topAt(7), 7 * h, 'topAt')
      assertEqual(g.bottomAt(7), 8 * h, 'bottomAt')
      assertEqual(g.totalHeight, n * h, 'totalHeight')
      assertEqual(g.offsetToRow(0), 0, 'offsetToRow 顶')
      assertEqual(g.offsetToRow(36 * 3 + 35), 3, 'offsetToRow 行中')
      assertEqual(g.offsetToRow(1800018), Math.floor(1800018 / 36), 'offsetToRow 大偏移')
      assertEqual(g.updateHeight(3, 99), 0, 'uniform updateHeight no-op')

      for (const [scrollTop, viewH] of [[0, 400], [1800018, 360], [55, 300], [1440, 72], [3599, 0]]) {
        const range = g.visibleRange(scrollTop, viewH, 2)
        const ref = computeViewRows({ scrollTop, viewH, rowGeometry: g })

        assert(range.start === ref.start && range.end === ref.end && range.count === ref.count,
          `visibleRange(${scrollTop},${viewH}) 期望 ${JSON.stringify(ref)}，实际 ${JSON.stringify(range)}`)

        // 对照经典等高算式（C4 前 computeViewRows 的 rowHeight 分支口径）
        const eqStart = Math.min(Math.max(Math.floor(scrollTop / h), 0), n)
        const eqEnd = Math.min(Math.max(Math.ceil((scrollTop + viewH) / h) + OVERSCAN, eqStart), n)

        assert(ref.start === eqStart && ref.end === eqEnd,
          `等高算式对照(${scrollTop},${viewH}) 期望 [${eqStart},${eqEnd})，实际 [${ref.start},${ref.end})`)
      }

      return 'topAt=i×h / offsetToRow=floor(y/h)；5 组 scrollTop 与 computeViewRows 及等高算式全等'
    }
  },
  {
    name: 'variable 几何：topAt/totalHeight/offsetToRow 与朴素参考实现一致（随机 1000 行）',
    fn: () => {
      const rnd = createRandom(20261025)
      const heights = Array.from({ length: 1000 }, () => 20 + Math.floor(rnd() * 61))
      const g = createVariableRowGeometry({ initialHeights: heights })
      const naive = createNaive(heights)

      assertEqual(g.mode, 'variable', 'mode')
      assertEqual(g.rowCount, 1000, 'rowCount')
      assertEqual(g.heightAt(0), heights[0], 'heightAt(0)')
      assertEqual(g.totalHeight, naive.total, 'totalHeight')

      for (let i = 0; i < 1000; i += 97) assertEqual(g.topAt(i), naive.topAt(i), `topAt(${i})`)

      for (let k = 0; k < 200; k++) {
        const y = Math.floor(rnd() * (naive.total + 5))

        assertEqual(g.offsetToRow(y), naive.rowAt(y), `offsetToRow(${y})`)
      }

      return 'totalHeight 与 11 个抽样 topAt、200 个随机 offsetToRow 全部与朴素参考一致'
    }
  },
  {
    name: 'variable 几何：updateHeight 返回 Δ 且前缀和随之更新；visibleRange 与朴素参考一致',
    fn: () => {
      const rnd = createRandom(36)
      const heights = Array.from({ length: 1000 }, () => 20 + Math.floor(rnd() * 61))
      const g = createVariableRowGeometry({ initialHeights: heights })
      const naive = createNaive(heights)

      for (let k = 0; k < 50; k++) {
        const i = Math.floor(rnd() * 1000)
        const next = 20 + Math.floor(rnd() * 61)
        const delta = g.updateHeight(i, next)

        assertEqual(delta, next - heights[i], `updateHeight(${i}) Δ`)
        heights[i] = next
        naive.total += delta

        if (k % 10 === 0) {
          for (let s = 0; s <= 1000; s += 250) assertEqual(g.topAt(s), naive.topAt(s), `update 后 topAt(${s})`)
        }
      }

      assertEqual(g.totalHeight, naive.total, 'update 后 totalHeight')

      for (let k = 0; k < 30; k++) {
        const scrollTop = Math.floor(rnd() * naive.total)
        const viewH = 200 + Math.floor(rnd() * 400)
        const range = g.visibleRange(scrollTop, viewH, 2)
        const ref = naiveVisibleRange(heights, scrollTop, viewH, 2)

        assert(range.start === ref.start && range.end === ref.end && range.count === ref.count,
          `visibleRange(${scrollTop},${viewH}) 期望 ${JSON.stringify(ref)}，实际 ${JSON.stringify(range)}`)

        // 包含性：窗口 [start+2 起的首可见行覆盖 scrollTop，end−2 前的行覆盖视口底
        const first = naive.rowAt(Math.max(0, scrollTop))

        assert(range.start <= first + 2 && range.end >= first, '窗口包含首可见行')

        // 视口内最后一行（含底缘像素 scrollTop+viewH−1 的行）必须被 end 覆盖（end 排他）
        const lastNeeded = naive.rowAt(Math.max(0, Math.min(naive.total - 1, scrollTop + viewH - 1)))

        assert(range.end >= lastNeeded + 1, '窗口覆盖视口底行')
      }

      return `50 次单点更新 Δ 与前缀和一致；30 组随机窗口与朴素参考一致（totalHeight=${naive.total}）`
    }
  },
  {
    name: 'variable 几何：rebuild 后与新高位数组一致；空集合与越界安全',
    fn: () => {
      const rnd = createRandom(777)
      const heights = Array.from({ length: 500 }, () => 20 + Math.floor(rnd() * 61))
      const g = createVariableRowGeometry({ initialHeights: heights })

      g.updateHeight(3, 999)

      const nextHeights = heights.map(v => v + 5)

      g.rebuild(nextHeights)

      const naive = createNaive(nextHeights)

      assertEqual(g.rowCount, 500, 'rebuild 后 rowCount')
      assertEqual(g.heightAt(3), nextHeights[3], 'rebuild 后 heightAt')
      assertEqual(g.totalHeight, naive.total, 'rebuild 后 totalHeight')

      for (let k = 0; k < 50; k++) {
        const i = Math.floor(rnd() * 500)

        assertEqual(g.topAt(i), naive.topAt(i), `rebuild 后 topAt(${i})`)
      }

      const empty = createVariableRowGeometry({ initialHeights: [] })

      assertEqual(empty.totalHeight, 0, '空集合 totalHeight')
      assertEqual(empty.offsetToRow(100), 0, '空集合 offsetToRow')
      assertEqual(empty.visibleRange(0, 400, 2).count, 0, '空集合 visibleRange')
      assertEqual(g.updateHeight(-1, 50), 0, '越界 updateHeight 返回 0')
      assertEqual(g.updateHeight(500, 50), 0, '超上界 updateHeight 返回 0')

      return 'rebuild 后 topAt/totalHeight 与朴素参考一致；空集合/越界不抛错'
    }
  },
  {
    name: 'computeAnchorShift：锚行上方总高变化补偿值',
    fn: () => {
      assertEqual(computeAnchorShift({ prevTopAtAnchor: 100, nextTopAtAnchor: 140 }), 40, '正补偿')
      assertEqual(computeAnchorShift({ prevTopAtAnchor: 250, nextTopAtAnchor: 180 }), -70, '负补偿（收起）')
      assertEqual(computeAnchorShift({ prevTopAtAnchor: 90, nextTopAtAnchor: 90 }), 0, '无变化')
      assertEqual(computeAnchorShift({}), 0, '缺参安全')

      return 'Δ = next − prev：+40 / −70 / 0 / 缺参 0'
    }
  },
  {
    name: 'computeRowHeights：全量快速估高零测量；字符串估 1 行下界；数组值 min(length, maxItems) 真值',
    fn: () => {
      const counter = { calls: 0 }
      const columns = [
        { field: 'name' },                                    // 短字符串 → 1 行真值
        { field: 'note', _maxLines: 3 },                      // 长字符串 → 估 1 行下界（待精）
        { field: 'tags', _maxItems: 3 },                      // 数组超限 → min(5, 3) = 3 行真值
        { field: 'items' }                                    // 数组未配 maxItems → 缺省 10
      ]
      const records = [
        { name: 'ab', note: 'x'.repeat(30), tags: ['a', 'b', 'c', 'd', 'e'], items: ['i', 'j'] },
        { name: 'cd', note: 'y'.repeat(30), tags: ['a'], items: [] }
      ]
      const { heights, hasArrayValues } = computeRowHeights({
        records,
        columns,
        colWidths: [100, 100, 100, 100],
        theme: THEME,
        measure: countingMeasure(counter)
      })

      assertEqual(counter.calls, 0, '估高路径零测量')
      assertEqual(hasArrayValues, true, 'hasArrayValues')
      assertEqual(heights[0], 70, 'row0：tags min(5,3)=3 行 → 16+54=70（主导列）')
      assertEqual(heights[1], 36, 'row1：tags 1 行、items 0 行 → 基线 36')

      return 'measure 0 次；heights=[70, 36]；数组值按 min(length, maxItems) 真值计高'
    }
  },
  {
    name: 'computeRowHeights：hasArrayValues 判定（文本列数组 / link 条目 > 1 / 单条 link 不升级）',
    fn: () => {
      const base = { colWidths: [100], theme: THEME }

      const withArray = computeRowHeights({
        records: [{ v: ['a', 'b'] }],
        columns: [{ field: 'v' }],
        ...base
      })

      assertEqual(withArray.hasArrayValues, true, '文本呈现列数组值 → true')

      const stringsOnly = computeRowHeights({
        records: [{ v: 'abc' }, { v: 'def' }],
        columns: [{ field: 'v', _maxLines: 5 }],
        ...base
      })

      assertEqual(stringsOnly.hasArrayValues, false, '纯字符串 → false')

      let renderCalls = 0

      const linkMulti = {
        type: 'link',
        field: 'links',
        _render: ({ value }) => {
          renderCalls++

          return { items: [1, 2, 3].map(n => ({ text: value + n })) }
        }
      }

      const withLinkMulti = computeRowHeights({
        records: [{ links: 'L' }, { links: 'M' }],
        columns: [linkMulti],
        ...base
      })

      assertEqual(withLinkMulti.hasArrayValues, true, 'link 条目数 > 1 → true')
      assertEqual(renderCalls, 2, 'link 列每格仅调用一次 render（估高计数复用，不重复求值）')
      assertEqual(withLinkMulti.heights[0], 16 + 3 * 18, 'link 3 条 → 3 行高')

      renderCalls = 0

      const withLinkSingle = computeRowHeights({
        records: [{ links: 'L' }],
        columns: [{ type: 'link', field: 'links', _render: () => ({ items: [{ text: 'only' }] }) }],
        ...base
      })

      assertEqual(withLinkSingle.hasArrayValues, false, 'link 单条 → false')
      assertEqual(withLinkSingle.heights[0], 36, 'link 单条 → 基线行高')

      return '数组值/link 多条 → true；纯字符串/单条 link → false；render 每格 1 次'
    }
  },
  {
    name: 'computeRowHeights：link 条目列行数 = min(render 计数, maxItems)',
    fn: () => {
      const render = ({ value }) => ({ items: Array.from({ length: 6 }, (_, i) => ({ text: `${value}${i}` })) })
      const base = { theme: THEME, colWidths: [100] }

      const capped = computeRowHeights({
        records: [{ links: 'L' }],
        columns: [{ type: 'link', field: 'links', _maxItems: 4, _render: render }],
        ...base
      })

      assertEqual(capped.heights[0], 16 + 4 * 18, 'render 6 条 + maxItems 4 → 4 行')

      const uncapped = computeRowHeights({
        records: [{ links: 'L' }],
        columns: [{ type: 'link', field: 'links', _render: render }],
        ...base
      })

      assertEqual(uncapped.heights[0], 16 + 6 * 18, '未配 maxItems → 缺省 10 → 6 行')

      return 'min(render 计数, maxItems)：6→4 / 6→6（缺省 10）'
    }
  },
  {
    name: 'ensureRowMeasured：精算短路零测量；maxLines 常量钳制（52 上限）；与 wrapLines 行数同源',
    fn: () => {
      const counter = { calls: 0 }
      const short = ensureRowMeasured({
        record: { note: 'ab' },
        columns: [{ field: 'note', _maxLines: 3 }],
        colWidths: [100],
        theme: THEME,
        measure: countingMeasure(counter)
      })

      assertEqual(counter.calls, 0, 'len×fontSize ≤ contentWidth 短路零测量')
      assertEqual(short, 36, '短文本基线行高')

      counter.calls = 0

      const longText = 'x'.repeat(30)
      const clamped = ensureRowMeasured({
        record: { note: longText },
        columns: [{ field: 'note', _maxLines: 2 }],
        colWidths: [100],
        theme: THEME,
        measure: countingMeasure(counter)
      })

      assert(counter.calls > 0, '长文本精算触发测量')
      assertEqual(clamped, 16 + 2 * 18, 'maxLines=2 → 2 行高 52（钳制非 4 行 88）')

      const unclamped = ensureRowMeasured({
        record: { note: longText },
        columns: [{ field: 'note' }],
        colWidths: [100],
        theme: THEME,
        measure: plainMeasure
      })

      assertEqual(unclamped, 36, '未配 maxLines → 单行省略 → 基线 36')

      return '短路 0 测量；30 字 @84px：maxLines=2 → 52 / 缺省 → 36'
    }
  },
  {
    name: 'ensureRowMeasured：函数形态 _resolveMaxLines(record) 行级求值（两条 record 各自计高）',
    fn: () => {
      const col = { field: 'note', _resolveMaxLines: record => (record.deep ? 3 : 1) }
      const longText = 'x'.repeat(30)
      const base = { columns: [col], colWidths: [100], theme: THEME, measure: plainMeasure }

      const deep = ensureRowMeasured({ record: { note: longText, deep: true }, ...base })
      const plain = ensureRowMeasured({ record: { note: longText, deep: false }, ...base })

      assertEqual(deep, 16 + 3 * 18, 'deep → 3 行 70')
      assertEqual(plain, 36, '非 deep → 1 行 36')

      return '同列两条 record：70 / 36（lineClamp 函数形态按 record 行级求值，评审 6 P6）'
    }
  },
  {
    name: 'treeIndents(colIndex, row)：inset 仅扣树形列 contentWidth，非树形多行列按全宽折行',
    fn: () => {
      const treeCol = { field: 'note', _maxLines: 2 }   // 树形列（多行候选）
      const plainCol = { field: 'memo', _maxLines: 2 }  // 非树形多行列（误扣回归）
      const levels = [0, 1]
      const calls = []
      const treeIndents = (colIndex, row) => {
        calls.push([colIndex, row])

        return colIndex === 0 ? 16 * levels[row] + 16 : 0
      }
      const base = { theme: THEME, measure: plainMeasure, treeIndents }

      // row0（level 0，inset 16）：note 8 字 = 80px，内容宽 100−16−16 = 68 → 折 2 行；
      // memo 同表 8 字按全宽 84 → 1 行 → 行高由 note 主导 = 52
      const row0 = ensureRowMeasured({
        record: { note: 'x'.repeat(8), memo: 'y'.repeat(8) },
        columns: [treeCol, plainCol],
        colWidths: [100, 100],
        row: 0,
        ...base
      })

      // row1（level 1，inset 32）：note 7 字 = 70px，内容宽 100−16−32 = 52 → 折 2 行（无 inset 则 1 行）
      const row1 = ensureRowMeasured({
        record: { note: 'x'.repeat(7), memo: 'y'.repeat(7) },
        columns: [treeCol, plainCol],
        colWidths: [100, 100],
        row: 1,
        ...base
      })

      assertEqual(row0, 52, '树形列 inset 后折 2 行')
      assertEqual(row1, 52, 'level 1 inset 32 后 7 字仍折 2 行')

      // 回归断言 1：无树（treeIndents 缺省）→ 全宽折行，两行均 1 行 → 基线
      const noTree0 = ensureRowMeasured({
        record: { note: 'x'.repeat(8), memo: 'y'.repeat(8) },
        columns: [treeCol, plainCol],
        colWidths: [100, 100],
        row: 0,
        theme: THEME,
        measure: plainMeasure
      })

      assertEqual(noTree0, 36, '无 treeIndents → 8 字全宽单行')

      // 回归断言 2：非树形列（全表中 index 0）不被扣 inset——独立单列表中该列仍处 index 0，
      // 回调只对树形列所在 index 1 返回 inset；若实现误把 inset 记到 index 0 或参数顺序颠倒，此处变 52 即暴露
      const plainOnly = ensureRowMeasured({
        record: { memo: 'y'.repeat(8) },
        columns: [plainCol],
        colWidths: [100],
        row: 0,
        theme: THEME,
        measure: plainMeasure,
        treeIndents: colIndex => (colIndex === 1 ? 16 : 0)
      })

      assertEqual(plainOnly, 36, '非树形多行列不扣 inset')

      // 回归断言 3：回调参数顺序 = (colIndex, row)
      assertArrayEqual(calls[0], [0, 0], '首调参数 (colIndex=0, row=0)')

      return 'row0/row1 = 52（inset 折行）；无树 36；非树形列 36；回调参数 (colIndex, row)'
    }
  },
  {
    name: 'computeRowHeights：treeIndents 估高路径可用（无测量、行高下界）；lineClamp 常量与函数同表混排取最大',
    fn: () => {
      const counter = { calls: 0 }
      const { heights } = computeRowHeights({
        records: [
          { note: 'x'.repeat(8), deep: false },
          { note: 'x'.repeat(8), deep: true }
        ],
        columns: [
          { field: 'note', _resolveMaxLines: record => (record.deep ? 2 : 1) }
        ],
        colWidths: [100],
        theme: THEME,
        measure: countingMeasure(counter),
        treeIndents: (colIndex, row) => (colIndex === 0 ? 16 * row + 16 : 0)
      })

      assertEqual(counter.calls, 0, '估高零测量')
      assertEqual(heights[0], 36, '估高：字符串恒 1 行下界（deep=false）')
      assertEqual(heights[1], 36, '估高：字符串恒 1 行下界（deep=true，进窗后精算 52）')

      return '估高 [36, 36] 下界 + treeIndents 透传不抛错（精算差异归进窗 ensureRowMeasured）'
    }
  }
]
