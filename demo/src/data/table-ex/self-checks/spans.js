/**
 * table-ex 自检断言 — spans 模块（合并单元格，02-design.md §9 自检 1–13）。
 *
 * 覆盖：级联分段（1）、autoRowSpan string/Function 键与 undefined 边界（2）、
 * tag 列 true 形态不合并 + 警告（3）、树父链切断（4）、spanMethod 键解析
 * key 优先/field 多列/无匹配（5）、'rest' 展开与固定列夹紧（6）、重叠丢弃/
 * 越界截断/rowspan 0 忽略/跨度 < 2 静默丢弃（7）、resolveSpanCell 浅拷贝契约（8）、
 * spanRectOf 等高/变高/普通格退化/colspan 区域矩形（9）、行高分层数据链（10）、
 * rowRegions 窗口查询（11）、spanMethod 异常处置（12）、editorGridlineFlagsOf
 * rowFrom/colTo 入参（13）。
 *
 * 列夹具经 prepareColumn 真实管线准备（_autoRowSpan/_mapText 同源）；警告经
 * buildSpans warn 参数注入捕获。
 */
import {
  buildSpans,
  resolveSpanCell,
  spanRectOf,
  regionsForRows
} from '@/components/table/ex/spans.js'
import { prepareColumn } from '@/components/table/ex/cell-painters.js'
import {
  computeRowHeights,
  ensureRowMeasured,
  createUniformRowGeometry,
  createVariableRowGeometry
} from '@/components/table/ex/row-geometry.js'
import { cellRectAt } from '@/components/table/ex/painter.js'
import { editorGridlineFlagsOf } from '@/components/table/ex/editor.js'

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

function assertEqual (actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} 期望 ${expected}，实际 ${actual}`)
  }

  return String(actual)
}

/** 列定义 → prepareColumn 真实内部列（_autoRowSpan 等内部字段同源） */
const prep = defs => defs.map(def => prepareColumn(def))

/** 警告捕获出口 */
function createCaptureWarn () {
  const messages = []

  return { messages, warn: message => messages.push(message) }
}

// 主题夹具（row-geometry 自检同口径：--row-height 36 / --cell-padding 8 /
// --cell-line-height 18）
const THEME = { rowHeight: 36, cellPadding: 8, cellLineHeight: 18, fontSize: 14, fontFamily: 'test-font' }

// 等宽假测量：每字符 10px（折行位置可精确断言）
const plainMeasure = text => text.length * 10

export const checks = [
  {
    name: '级联分段：三列 autoRowSpan，同一子类值跨分类产出两段',
    fn: () => {
      const columns = prep([
        { caption: '分类', field: 'cat', autoRowSpan: true },
        { caption: '子类', field: 'sub', autoRowSpan: true },
        { caption: '名称', field: 'name' }
      ])
      const records = [
        { cat: 'A', sub: 'S1', name: 'n1' },
        { cat: 'A', sub: 'S1', name: 'n2' },
        { cat: 'A', sub: 'S2', name: 'n3' },
        { cat: 'B', sub: 'S1', name: 'n4' },
        { cat: 'B', sub: 'S1', name: 'n5' }
      ]
      const spans = buildSpans({ records, columns })

      assert(spans != null, '存在合并区域')
      // 分类列 A×3 与 B×2 各成一段（B 段亦满足 rowspan ≥ 2）；子类列 S1 两段
      assertEqual(spans.regions.length, 4, '区域总数（分类 2 段 + 子类 2 段）')

      const cat1 = spans.anchors.get(0).get(0)
      const cat2 = spans.anchors.get(3).get(0)

      assertEqual(cat1.rowspan, 3, '分类列 A 段跨度')
      assertEqual(cat2.rowFrom, 3, '分类列 B 段起点（级联分段的左列边界）')

      const sub1 = spans.anchors.get(0).get(1)
      const sub2 = spans.anchors.get(3).get(1)

      assertEqual(sub1.rowFrom, 0, '子类 S1 第一段起点')
      assertEqual(sub1.rowspan, 2, '子类 S1 第一段跨度')
      assertEqual(sub2.rowFrom, 3, '同一子类值跨分类的第二段起点')
      assertEqual(sub2.rowspan, 2, '第二段跨度')
      assertEqual(spans.covered.get(2).get(0).row, 0, '分类列 covered 归一主格')
      assert(spans.covered.get(2)?.get(1) == null, '子类 S2 单行段不产生覆盖')

      return '分类 [0,3)+[3,5)；子类 [0,2)+[3,5) 两段；(2,0)→(0,0)'
    }
  },
  {
    name: "autoRowSpan 'field' 与 Function 键；Function 返回 undefined 作分段边界（小计行隔离）",
    fn: () => {
      const columns = prep([
        { caption: '分组', field: 'group', autoRowSpan: 'group' },
        { caption: '函数键', field: 'val', autoRowSpan: record => (record.total ? undefined : 'x') }
      ])
      const records = [
        { group: 'g1', val: 'a' },
        { group: 'g1', val: 'b' },
        { group: 'g1', val: '小计', total: true },
        { group: 'g1', val: 'c' }
      ]
      const spans = buildSpans({ records, columns })

      assertEqual(spans.anchors.get(0).get(0).rowspan, 4, "string 键 'group' 段")

      const fnRegion = spans.anchors.get(0).get(1)

      assertEqual(fnRegion.rowFrom, 0, 'Function 键段起点')
      assertEqual(fnRegion.rowspan, 2, 'Function 键段止于小计行前')
      assert(spans.anchors.get(3)?.get(1) == null, 'undefined 键后新段不与前方合并（小计行隔离）')
      assertEqual(spans.covered.get(1).get(1).row, 0, '函数键段 covered 归一')

      return "group 键 [0,4)；Function 键 [0,2)、行 2 边界、行 3 独立"
    }
  },
  {
    name: 'tag 列 autoRowSpan: true 不合并 + 警告一次',
    fn: () => {
      const columns = prep([{ caption: '标签', field: 'tags', type: 'tag', autoRowSpan: true }])
      const records = [
        { tags: ['a', 'b'] },
        { tags: ['a', 'b'] },
        { tags: ['a', 'b'] }
      ]
      const capture = createCaptureWarn()
      const spans = buildSpans({ records, columns, warn: capture.warn })

      assertEqual(spans, null, '非原始值键恒不相等 → 无任何有效区域（null 快路径）')
      assertEqual(capture.messages.length, 1, '警告一次/列')
      assert(capture.messages[0].includes('true 形态'), '警告含 true 形态说明')

      return 'spans = null；警告 ×1（请改用 string 或 Function 键）'
    }
  },
  {
    name: '树：同层不同父不合并；层级变化处切断（parentKeys 父链）',
    fn: () => {
      const columns = prep([{ caption: '值', field: 'val', autoRowSpan: true }])
      const records = [
        { val: 'v' },
        { val: 'v' },
        { val: 'v' },
        { val: 'v' }
      ]
      // 合成 flatInfo（buildFlatRows 产物同构）：行 1/2 同层不同父 → 切断；
      // 行 0/1 层级变化 → 切断；行 2/3 同层同父 → 合并
      const flatInfo = { levels: [0, 1, 1, 1], parentKeys: [null, 'p1', 'p2', 'p2'] }
      const spans = buildSpans({ records, columns, flatInfo })

      assert(spans != null, '行 2-3 同父可合并')
      assert(spans.anchors.get(0)?.get(0) == null, '层级变化处切断（行 0 不合并）')
      assert(spans.anchors.get(1)?.get(0) == null, '同层不同父不合并（行 1 不合并）')

      const region = spans.anchors.get(2).get(0)

      assertEqual(region.rowFrom, 2, '同父段起点')
      assertEqual(region.rowspan, 2, '同父段跨度')

      return '仅 [2,4) 合并；levels/parentKeys 双条件切断'
    }
  },
  {
    name: 'spanMethod 键解析：key 优先、field 唯一命中、多列命中警告、无命中警告、info 载荷',
    fn: () => {
      const columns = prep([
        { caption: '键列', key: 'ka', field: 'fa' },
        { caption: '甲', field: 'fb' },
        { caption: '乙', field: 'fb' },
        { caption: '键优先', key: 'kb', field: 'fb' },
        { caption: '丁', field: 'fd' }
      ])
      const records = [{}, {}, {}]
      let firstInfo = null
      const capture = createCaptureWarn()
      const spans = buildSpans({
        records,
        columns,
        recordsOffset: 100,
        spanMethod: info => {
          if (firstInfo == null) firstInfo = info
          if (info.recordIndex !== 0) return null

          return { ka: 2, kb: 3, fb: 2, ghost: 2 }
        },
        warn: capture.warn
      })

      assertEqual(spans.anchors.get(0).get(0).rowspan, 2, 'ka 按 key 命中列 0')
      assertEqual(spans.anchors.get(0).get(3).rowspan, 3, 'kb 按 key 命中列 3（不落 field 组）')
      assertEqual(spans.anchors.get(0).get(1).rowspan, 2, 'fb field 命中列 1')
      assertEqual(spans.anchors.get(0).get(2).rowspan, 2, 'fb field 命中列 2')
      assert(spans.anchors.get(1)?.get(3) == null, '列 3 的 fb 声明与 kb 区域重叠整条丢弃')
      assert(capture.messages.some(m => m.includes('命中 3 列')), 'field 多列命中警告（作用于全部）')
      assert(capture.messages.some(m => m.includes('ghost') && m.includes('无匹配列')), '无匹配列警告')
      // §3.2/§7 警告坐标 = 被丢弃声明的锚格 (row, col)：声明产自 recordIndex 0 → (0, 3)
      assert(capture.messages.some(m => m.includes('重叠') && m.includes('(0, 3)')), '重叠丢弃警告带坐标')

      assertEqual(firstInfo.recordNumber, 101, 'recordNumber = recordsOffset + recordIndex + 1')
      assertEqual(firstInfo.prevRecord, null, '首行 prevRecord null')
      assertEqual(firstInfo.nextRecord, records[1], 'nextRecord 为下一行记录')
      assertEqual(firstInfo.columns, columns, 'columns 透传内部列')

      return 'key 优先；fb→列 1/2；ghost 警告；info 契约齐全'
    }
  },
  {
    name: "colspan: 'rest' 展开到分区末列；数值跨固定列边界夹紧 + 警告",
    fn: () => {
      const columns = prep([
        { caption: 'c0', field: 'c0' },
        { caption: 'c1', field: 'c1' },
        { caption: 'c2', field: 'c2' },
        { caption: 'c3', field: 'c3' },
        { caption: 'c4', field: 'c4' }
      ])
      const records = [{}, {}, {}, {}]
      const capture = createCaptureWarn()
      const spans = buildSpans({
        records,
        columns,
        fixedCount: 2,
        spanMethod: ({ recordIndex }) => {
          if (recordIndex === 0) return { c0: { colspan: 'rest' } }
          if (recordIndex === 1) return { c1: { rowspan: 2, colspan: 9 } }
          if (recordIndex === 3) return { c3: { colspan: 'rest' } }

          return null
        },
        warn: capture.warn
      })

      const restFixed = spans.anchors.get(0).get(0)

      assertEqual(restFixed.colspan, 2, "固定列区 'rest' 展开到 fixedCount")
      assertEqual(restFixed.rowspan, 1, '纯 colspan 区域 rowspan 1')

      const clamped = spans.anchors.get(1).get(1)

      assertEqual(clamped.colspan, 1, '数值跨固定列边界夹紧到固定区末列')
      assertEqual(clamped.rowspan, 2, '夹紧后 rowspan 保持')
      assert(capture.messages.some(m => m.includes('夹紧')), '跨固定列边界警告')

      const restScroll = spans.anchors.get(3).get(3)

      assertEqual(restScroll.colspan, 2, "滚动区 'rest' 展开到总末列")

      return "rest→[0,2)/[3,5)；colspan 9 夹紧为 1 + 警告"
    }
  },
  {
    name: '重叠整条丢弃；越界截断；rowspan: 0 忽略；截断后跨度 < 2 静默丢弃',
    fn: () => {
      const columns = prep([
        { caption: 'a', field: 'a' },
        { caption: 'b', field: 'b' }
      ])
      const records = [{}, {}, {}, {}, {}, {}]
      const capture = createCaptureWarn()
      const spans = buildSpans({
        records,
        columns,
        spanMethod: ({ recordIndex }) => {
          switch (recordIndex) {
            case 0: return { a: 3 }
            case 1: return { a: 2 }
            case 2: return { b: 0 }
            case 3: return { a: 99 }
            case 5: return { b: { rowspan: 9 } }

            default: return null
          }
        },
        warn: capture.warn
      })

      assertEqual(spans.anchors.get(0).get(0).rowspan, 3, '首条 [0,3) 登记')
      assert(spans.anchors.get(1)?.get(0) == null, '重叠声明整条丢弃（不做部分截断）')
      assert(capture.messages.some(m => m.includes('重叠') && m.includes('(1, 0)')), '重叠警告')
      assert(spans.anchors.get(2)?.get(1) == null, 'rowspan 0 整条丢弃')
      assert(capture.messages.some(m => m.includes('rowspan=0')), '非 ≥1 整数警告')
      assertEqual(spans.anchors.get(3).get(0).rowspan, 3, 'rowspan 99 截到 rowCount（[3,6)）')
      assert(spans.anchors.get(5)?.get(1) == null, '截断后跨度 < 2 丢弃')
      assert(!capture.messages.some(m => m.includes('(5, 1)')), '跨度 < 2 丢弃不警告')

      return '[0,3)+[3,6)；重叠/0 警告；行 5 静默丢弃'
    }
  },
  {
    name: 'resolveSpanCell：covered→anchor、anchor/普通格原样、null spans 短路、浅拷贝仅改行列',
    fn: () => {
      const columns = prep([
        { caption: 'a', field: 'a' },
        { caption: 'b', field: 'b' }
      ])
      const records = [{ a: 1 }, { a: 1 }, { a: 2 }]
      const spans = buildSpans({
        records,
        columns,
        spanMethod: ({ recordIndex }) => (recordIndex === 0 ? { a: 2 } : null)
      })

      const hit = {
        isHeader: false,
        rowIndex: 1,
        colIndex: 0,
        x: 12,
        y: 34,
        cellX: 5,
        beyondCols: false,
        resizeCol: -1
      }
      const normalized = resolveSpanCell(spans, hit)

      assert(normalized !== hit, '浅拷贝新对象')
      assertEqual(normalized.rowIndex, 0, 'covered → 主格行')
      assertEqual(normalized.colIndex, 0, 'covered → 主格列')
      assertEqual(hit.rowIndex, 1, '原 hit 不改写')
      assertEqual(normalized.cellX, 5, 'cellX 契约：不重算')
      assertEqual(normalized.x, 12, 'x 原样')
      assertEqual(normalized.y, 34, 'y 原样')
      assertEqual(normalized.beyondCols, false, 'beyondCols 原样')
      assertEqual(normalized.resizeCol, -1, 'resizeCol 原样')

      const anchorHit = { isHeader: false, rowIndex: 0, colIndex: 0, x: 1, y: 1, cellX: null, beyondCols: false, resizeCol: -1 }

      assert(resolveSpanCell(spans, anchorHit) === anchorHit, 'anchor/普通格原引用短路')

      const headerHit = { isHeader: true, rowIndex: -1, colIndex: 1 }

      assert(resolveSpanCell(spans, headerHit) === headerHit, '表头不归一')
      assert(resolveSpanCell(null, anchorHit) === anchorHit, 'null spans 短路')

      return 'row 1→0；其余字段逐字保留；短路三态原引用'
    }
  },
  {
    name: 'spanRectOf：等高/变高区域矩形、普通格退化 = cellRectAt、colspan 区域宽',
    fn: () => {
      const layout = {
        colLefts: [0, 100, 250, 400],
        colWidths: [100, 150, 150, 200],
        fixedCount: 1,
        headHeight: 36,
        scrollTop: 36,
        scrollLeft: 50,
        rowGeometry: createUniformRowGeometry({ rowHeight: 36, rowCount: 8 })
      }
      const columns = prep([
        { caption: '固定', field: 'f0' },
        { caption: 'a', field: 'a' },
        { caption: 'b', field: 'b' },
        { caption: 'c', field: 'c' }
      ])
      const records = Array.from({ length: 6 }, () => ({}))
      const spans = buildSpans({
        records,
        columns,
        spanMethod: ({ recordIndex }) => (recordIndex === 2 ? { a: { rowspan: 2, colspan: 2 } } : null)
      })

      const rect = spanRectOf(layout, 3, 2, spans)

      assertEqual(rect.x, 50, '区域左缘 = colLefts[colFrom] − scrollLeft')
      assertEqual(rect.y, 72, '区域上缘 = headHeight + topAt(rowFrom) − scrollTop')
      assertEqual(rect.width, 300, 'colspan 区域宽 = Σ colWidths')
      assertEqual(rect.height, 72, '等高区域高 = 2 × rowHeight')

      const plain = spanRectOf(layout, 5, 3, spans)
      const expected = cellRectAt(layout, 5, 3)

      assertEqual(plain.x, expected.x, '普通格 x 与 cellRectAt 一致')
      assertEqual(plain.y, expected.y, '普通格 y 与 cellRectAt 一致')
      assertEqual(plain.width, expected.width, '普通格宽与 cellRectAt 一致')
      assertEqual(plain.height, expected.height, '普通格高与 cellRectAt 一致')

      const variable = createVariableRowGeometry({ initialHeights: [40, 60, 36, 80, 36, 36, 36, 36] })
      const rectV = spanRectOf({ ...layout, rowGeometry: variable }, 3, 2, spans)

      assertEqual(rectV.height, 116, '变高区域高 = heightAt(2) + heightAt(3)')
      assertEqual(rectV.y, 100, '变高区域上缘按 topAt 累加')

      // 普通格（非区域）spanRectOf 恒等 cellRectAt（含变高）
      const plainV = spanRectOf({ ...layout, rowGeometry: variable }, 4, 0, spans)
      const expectedV = cellRectAt({ ...layout, rowGeometry: variable }, 4, 0)

      assertEqual(plainV.height, expectedV.height, '变高普通格退化一致')

      return '区域 [50,72,300,72]；普通格双几何退化 cellRectAt'
    }
  },
  {
    name: '行高分层：rowspan>1 主格与 covered 格不计入且不触发 hasArrayValues；colspan 主格按区域宽',
    fn: () => {
      // ① rowspan>1 主格持数组值：不参与行高、hasArrayValues 恒 false
      const defsA = prep([
        { caption: 'a', field: 'a' },
        { caption: 'arr', field: 'arr', maxLines: 3 }
      ])
      const recordsA = [
        { a: ['x', 'y', 'z'], arr: 'plain' },
        { a: ['x', 'y', 'z'], arr: 'plain' }
      ]
      const spansA = buildSpans({
        records: recordsA,
        columns: defsA,
        spanMethod: ({ recordIndex }) => (recordIndex === 0 ? { a: 2 } : null)
      })
      const outA = computeRowHeights({
        records: recordsA,
        columns: defsA,
        colWidths: [100, 100],
        theme: THEME,
        spans: spansA
      })

      assertEqual(outA.heights[0], 36, 'rowspan>1 主格排除（数组值不计行高）')
      assertEqual(outA.heights[1], 36, 'covered 格排除')
      assertEqual(outA.hasArrayValues, false, '被排除格数组值不触发变高模式升级')
      assertEqual(
        computeRowHeights({ records: recordsA, columns: defsA, colWidths: [100, 100], theme: THEME }).hasArrayValues,
        true,
        '对照组：无 spans 时数组值触发（排除确由分层产生）'
      )

      // ② rowspan===1 的 colspan 主格按区域宽折行（precise 精算）
      const LONG = 'x'.repeat(40)
      const defsB = prep([
        { caption: 'b', field: 'b', maxLines: 10 },
        { caption: 'c', field: 'c' }
      ])
      const recordsB = [{ b: LONG, c: 'p' }, { b: LONG, c: 'p' }]
      const spansB = buildSpans({
        records: recordsB,
        columns: defsB,
        spanMethod: ({ recordIndex }) => (recordIndex === 0 ? { b: { colspan: 2 } } : null)
      })
      const base = { columns: defsB, colWidths: [100, 100], theme: THEME, measure: plainMeasure }
      const regionH = ensureRowMeasured({ ...base, record: recordsB[0], spans: spansB, row: 0 })
      const singleH = ensureRowMeasured({ ...base, record: recordsB[0], spans: null, row: 0 })

      assertEqual(regionH, 8 * 2 + 3 * 18, '区域宽 184 → 3 行（18 字符/行）')
      assertEqual(singleH, 8 * 2 + 5 * 18, '对照：单列宽 84 → 5 行（8 字符/行）')

      // covered 行（b 被纵向区域覆盖）：b 排除、c 单行 → 最小行高
      const spansC = buildSpans({
        records: recordsB,
        columns: defsB,
        spanMethod: ({ recordIndex }) => (recordIndex === 0 ? { b: 2 } : null)
      })
      const coveredH = ensureRowMeasured({ ...base, record: recordsB[1], spans: spansC, row: 1 })

      assertEqual(coveredH, 36, 'covered 行（b 被纵向区域覆盖）排除 → 最小行高')

      return 'heights [36,36]+hasArrayValues false；区域宽 3 行 vs 单列 5 行；covered 36'
    }
  },
  {
    name: 'rowRegions：窗口查询 = 所有与窗口相交的区域（含锚行在窗口上方的跨行长区域）',
    fn: () => {
      const columns = prep([
        { caption: 'a', field: 'a' },
        { caption: 'b', field: 'b' }
      ])
      const records = Array.from({ length: 9 }, () => ({}))
      const spans = buildSpans({
        records,
        columns,
        spanMethod: ({ recordIndex }) => {
          if (recordIndex === 0) return { a: 6 }
          if (recordIndex === 7) return { b: 2 }

          return null
        }
      })
      const long = spans.anchors.get(0).get(0)
      const short = spans.anchors.get(7).get(1)

      const hits = regionsForRows(spans, 4, 8)

      assertEqual(hits.length, 2, '窗口 [4,8) 命中两个区域')
      assert(hits.includes(long), '长区域 [0,6) 锚行在窗口上方仍命中')
      assert(hits.includes(short), '短区域 [7,9) 命中')

      assertEqual(regionsForRows(spans, 6, 7).length, 0, '窗口 [6,7) 无相交区域')
      assertEqual(regionsForRows(null, 0, 100).length, 0, 'null spans 短路')

      return '[4,8) → 长+短；[6,7) → 空；null 短路'
    }
  },
  {
    name: 'spanMethod 异常：抛错行按 null 处置，整表构建不中断',
    fn: () => {
      const columns = prep([
        { caption: 'a', field: 'a' },
        { caption: 'b', field: 'b' }
      ])
      const records = [{}, {}, {}]
      const capture = createCaptureWarn()
      const spans = buildSpans({
        records,
        columns,
        spanMethod: ({ recordIndex }) => {
          if (recordIndex === 0) return { a: 2 }
          if (recordIndex === 1) throw new Error('boom')

          return null
        },
        warn: capture.warn
      })

      assert(spans != null, '构建不中断')
      assertEqual(spans.anchors.get(0).get(0).rowspan, 2, '其余行声明照常登记')
      assert(capture.messages.some(m => m.includes('boom') && m.includes('行 1')), '警告含错误信息与行号')

      return '行 1 按 null；行 0 区域保留；警告含 boom'
    }
  },
  {
    name: 'editorGridlineFlagsOf rowFrom/colTo 入参：区域右缘末列不误缩、缺省回退现行行为',
    fn: () => {
      // 缺省回退：topGridline 按 rowIndex、rightGridline 按 colIndex + 1
      const legacy = editorGridlineFlagsOf({ rowIndex: 3, colIndex: 2, colCount: 5, gridlines: 'all' })

      assertEqual(legacy.topGridline, true, '缺省 topGridline（rowIndex > 0）')
      assertEqual(legacy.rightGridline, true, '缺省 rightGridline（colIndex + 1 < colCount）')

      const legacyEdge = editorGridlineFlagsOf({ rowIndex: 0, colIndex: 4, colCount: 5, gridlines: 'all' })

      assertEqual(legacyEdge.topGridline, false, '缺省首行无顶格线')
      assertEqual(legacyEdge.rightGridline, false, '缺省末列无右格线（无空白尾）')

      // 合并区域：rowFrom 显式化 + colTo 末列不误缩
      const atHeaderEdge = editorGridlineFlagsOf({ rowIndex: 2, colIndex: 3, colCount: 5, gridlines: 'all', rowFrom: 0, colTo: 5 })

      assertEqual(atHeaderEdge.topGridline, false, '区域首行在表头下 → 无顶格线（rowFrom 生效）')
      assertEqual(atHeaderEdge.rightGridline, false, '区域右缘在末列 → 无右格线（colTo 生效，不按锚列误缩）')

      const mid = editorGridlineFlagsOf({ rowIndex: 2, colIndex: 3, colCount: 5, gridlines: 'all', rowFrom: 2, colTo: 4 })

      assertEqual(mid.topGridline, true, '区域首行 > 0 → 有顶格线')
      assertEqual(mid.rightGridline, true, '区域右缘非末列 → 有右格线')

      // 空白尾：末列右格线仍画（缺省与区域形态一致）
      const blankTail = editorGridlineFlagsOf({ rowIndex: 0, colIndex: 4, colCount: 5, stickyWidth: 600, contentWidth: 500, gridlines: 'all' })

      assertEqual(blankTail.rightGridline, true, '空白尾时末列右格线保留')

      return '缺省两态回退；rowFrom/colTo 区域四态；空白尾保留'
    }
  }
]
