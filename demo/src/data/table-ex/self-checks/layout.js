/**
 * table-ex 自检断言 — layout 模块（G2）。
 *
 * 覆盖（02-design.md G2 判据 + G1-b 既有 + decisions「[I1 前]①⑥」）：
 * solveWidths 宽度求解（min/max clamp、widthOverrides 优先级、剩余宽迭代分配）、
 * TYPE_DEFAULT_WIDTHS 宽/最小宽双值弹性分支（评审 6 P2/P5：resolveTypeMinWidth、
 * 字符串 minWidth 不回归、bool 60 不被抬高、无 type 回退 text、type.width 定宽不变）、
 * rowGeometry 必传契约（C4：uniform 等高回退已删，夹具统一经
 * createUniformRowGeometry 构造）、
 * 混合列宽前缀和、可视窗口起止索引（viewH = clientHeight − headHeight、
 * viewW = clientWidth − fixedWidth 口径）、命中检测（rowAt/colAt）、
 * 调宽手柄检测（含固定列排除）、relayout 对外暴露的计算纯函数。
 */
import {
  OVERSCAN,
  RESIZE_HANDLE,
  TYPE_DEFAULT_WIDTHS,
  resolveTypeMinWidth,
  solveWidths,
  computePrefixSums,
  computeViewRows,
  computeViewCols,
  rowAt,
  colAt,
  findResizeColumn,
  relayout
} from '@/components/table-ex/layout.js'
import { createUniformRowGeometry, createVariableRowGeometry } from '@/components/table-ex/row-geometry.js'

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

export const checks = [
  {
    name: '契约常量：OVERSCAN=2 / RESIZE_HANDLE=4',
    fn: () => {
      assertEqual(OVERSCAN, 2, 'OVERSCAN')
      assertEqual(RESIZE_HANDLE, 4, 'RESIZE_HANDLE')

      return 'OVERSCAN=2, RESIZE_HANDLE=4'
    }
  },
  {
    name: 'solveWidths：定宽列解析（px 字符串宽度、type.width 缺省）与 min/max clamp',
    fn: () => {
      const widths = solveWidths({
        columns: [
          { field: 'a', width: '50px' }, // px 字符串 → 50
          { field: 'b', width: 400, maxWidth: 260 }, // 超 maxWidth → clamp 260
          { field: 'c', width: 40, minWidth: 120 }, // 低于 minWidth → clamp 120
          { field: 'd', type: 'check' }, // 无 width → type.width('50px') → 50
          { field: 'e', width: 160 } // 原样
        ],
        containerWidth: 0 // 无剩余宽，只验证定宽解析
      })

      assertArray(widths, [50, 260, 120, 50, 160], '定宽列解析')

      return JSON.stringify(widths)
    }
  },
  {
    name: 'solveWidths：widthOverrides 按列 key 优先且不写回列定义',
    fn: () => {
      const columns = [
        { key: 'col-a', field: 'a', width: 100 },
        { key: 'col-b', field: 'b', width: 120 },
        { key: 'col-c', field: 'c', type: 'check' }, // 定宽来源为 type.width
        { key: 'col-d', field: 'd' } // 未定宽列
      ]
      const before = JSON.stringify(columns)
      const widths = solveWidths({
        columns,
        containerWidth: 0,
        widthOverrides: { 'col-a': 222, 'col-b': 88, 'col-c': 66, 'col-d': '77px' }
      })

      assertArray(widths, [222, 88, 66, 77], 'overrides 优先级')
      assertEqual(JSON.stringify(columns), before, '列定义被写回')

      // 按 _key（组件壳列准备生成的自动键）同样命中；无 overrides 时回退列定义
      const prepared = [{ field: 'a', width: 100, _key: 5 }]
      const byInternalKey = solveWidths({ columns: prepared, containerWidth: 0, widthOverrides: { 5: 140 } })

      assertArray(byInternalKey, [140], '按 _key 命中')
      assertArray(solveWidths({ columns: prepared, containerWidth: 0 }), [100], '无 overrides 回退')

      // 覆盖值不可解析为 px 时按未覆盖处理
      const invalid = solveWidths({ columns: prepared, containerWidth: 0, widthOverrides: { 5: 'auto' } })

      assertArray(invalid, [100], '非法 override 回退列定义')

      return 'override 优先于 width/type.width；_key 命中；列定义未被改写'
    }
  },
  {
    name: 'solveWidths：弹性分支类型感知双值（窄容器保持默认宽，宽容器均摊 ≥ 默认宽）',
    fn: () => {
      // 窄容器：初始宽 = 类型默认宽（text 160，显式 minWidth 不抬初始宽），
      // remain ≤ 0 保持初始宽 → 横向滚动（A3.2 语义）
      const narrow = solveWidths({
        columns: [{ field: 'a', width: 100 }, { field: 'b', minWidth: 80 }, { field: 'c' }],
        containerWidth: 400
      })

      assertArray(narrow, [100, 160, 160], '窄容器保持默认宽')
      assert(narrow[0] + narrow[1] + narrow[2] > 400, '总宽超出容器（横向滚动）')

      // 宽容器：均摊后逐列 ≥ 类型默认宽（未配 width 列参与剩余宽瓜分）
      const wide = solveWidths({
        columns: [{ field: 'a', width: 100 }, { field: 'b', minWidth: 80 }, { field: 'c' }],
        containerWidth: 560
      })

      assertArray(wide, [100, 230, 230], '宽容器均摊拉伸')
      assert(wide[1] >= TYPE_DEFAULT_WIDTHS.text.width && wide[2] >= TYPE_DEFAULT_WIDTHS.text.width, '均摊不低于默认宽')

      return `窄容器 ${JSON.stringify(narrow)}（=默认宽）；宽容器 ${JSON.stringify(wide)}（≥默认宽）`
    }
  },
  {
    name: 'solveWidths：maxWidth clamp 消耗迭代再摊（收敛总宽=容器宽）',
    fn: () => {
      // 定宽 100 + 初始 80×2 → 剩余 140；首轮各 +70：B 触顶 120（消耗 40），
      // C 150（消耗 70）；剩余 30 次轮再摊给 C → 180
      const widths = solveWidths({
        columns: [{ field: 'a', width: 100 }, { field: 'b', maxWidth: 120 }, { field: 'c' }],
        containerWidth: 400
      })

      assertArray(widths, [100, 120, 180], '迭代再摊')
      assertEqual(widths[0] + widths[1] + widths[2], 400, '总宽收敛')

      return JSON.stringify(widths) + '，总宽 400（3 轮内收敛）'
    }
  },
  {
    name: 'solveWidths：全部触顶保持 maxWidth（留白）；remain≤0 保持初始宽（横向滚动）',
    fn: () => {
      const capped = solveWidths({
        columns: [{ field: 'a', maxWidth: 100 }, { field: 'b', maxWidth: 150 }],
        containerWidth: 1000
      })

      assertArray(capped, [100, 150], '全部触顶')

      // 容器小于初始宽合计：保持初始宽（类型默认宽），总宽超出容器 → 横向滚动
      const overflow = solveWidths({
        columns: [{ field: 'a', minWidth: 80 }, { field: 'b', minWidth: 80 }],
        containerWidth: 100
      })

      assertArray(overflow, [160, 160], 'remain≤0 保持类型默认宽')

      return `触顶 ${JSON.stringify(capped)}；超容器 ${JSON.stringify(overflow)}`
    }
  },
  {
    name: 'TYPE_DEFAULT_WIDTHS：双值表形态齐全（13 条目，宽/最小宽均为正数）',
    fn: () => {
      const expected = {
        text: [160, 80],
        number: [100, 60],
        currency: [110, 60],
        date: [125, 80],
        datetime: [160, 100],
        bool: [60, 40],
        link: [140, 80],
        tag: [140, 80],
        img: [80, 40],
        image: [80, 40],
        progress: [120, 60],
        button: [140, 80],
        _fallback: [80, 40]
      }

      assertEqual(Object.keys(TYPE_DEFAULT_WIDTHS).length, Object.keys(expected).length, '条目数')

      for (const [name, [width, minWidth]] of Object.entries(expected)) {
        const entry = TYPE_DEFAULT_WIDTHS[name]

        assert(entry != null, `条目 ${name} 缺失`)
        assertEqual(entry.width, width, `${name}.width`)
        assertEqual(entry.minWidth, minWidth, `${name}.minWidth`)
        assert(typeof entry.width === 'number' && typeof entry.minWidth === 'number', `${name} 应为 number 双值`)
      }

      return '13 条目双值齐全（check/rec_no 不在表内——type.width 定宽）'
    }
  },
  {
    name: 'solveWidths：弹性分支类型感知默认宽/最小宽（bool 60、无 type 160、_fallback 80）',
    fn: () => {
      // bool 列缺省 60——不再被旧 80px 隐式下限抬高（A3.2 修正）
      assertArray(solveWidths({ columns: [{ field: 'v', type: 'bool' }], containerWidth: 0 }), [60], 'bool 缺省 60')
      // 无 type/空 type 列回退 text 条目（160/80，resolveColumnType(undefined) 同回退 TextColumn）
      assertArray(solveWidths({ columns: [{ field: 'name' }], containerWidth: 0 }), [160], '无 type 缺省 160')
      assertArray(solveWidths({ columns: [{ field: 'name', type: '' }], containerWidth: 0 }), [160], '空 type 回退 text')
      // 对象/函数自定义类型、未知类型字符串回退 _fallback（80/40）
      assertArray(solveWidths({ columns: [{ field: 'v', type: { render: () => ({}) } }], containerWidth: 0 }), [80], '自定义类型对象 80')
      assertArray(solveWidths({ columns: [{ field: 'v', type: 'no-such' }], containerWidth: 0 }), [80], '未知类型字符串 80')

      // col.minWidth 显式值覆盖类型最小宽（可大于或小于默认宽）
      assertArray(solveWidths({ columns: [{ field: 'v', minWidth: 200 }], containerWidth: 0 }), [200], 'minWidth 抬初始宽')
      assertArray(solveWidths({ columns: [{ field: 'v', type: 'bool', minWidth: 100 }], containerWidth: 0 }), [100], 'bool minWidth 覆盖')

      return 'bool=60 / 无 type=160 / 自定义=80 / minWidth 显式覆盖类型最小宽'
    }
  },
  {
    name: 'solveWidths：col.minWidth 字符串形态 \'80px\' 解析（下限复用已解析 min，不产 NaN）',
    fn: () => {
      // 弹性分支：初始宽 clamp(base.width, getPixelNumber('80px'), max) = clamp(60, 80, ∞) = 80
      const widths = solveWidths({ columns: [{ field: 'v', type: 'bool', minWidth: '80px' }], containerWidth: 0 })

      assert(typeof widths[0] === 'number' && !Number.isNaN(widths[0]), '列宽应为 Number 非 NaN（评审 6 P5）')
      assertArray(widths, [80], '字符串 minWidth 解析为 80')

      // 定宽分支 min 仍 getPixelNumber(col.minWidth) ?? 0（现状不动）：50 与 80 取大者
      const fixed = solveWidths({ columns: [{ field: 'v', type: 'check', minWidth: '80px' }], containerWidth: 0 })

      assertArray(fixed, [80], '定宽分支字符串 minWidth 同口径')

      return `bool+minWidth:'80px' → ${widths[0]}；check+minWidth:'80px' → ${fixed[0]}（均 Number）`
    }
  },
  {
    name: 'solveWidths：定宽链不变（显式 width 优先、type.width 定宽、type.width + minWidth clamp）',
    fn: () => {
      // 显式 width 优先于 TYPE_DEFAULT_WIDTHS（硬宽，不参与弹性基线）
      assertArray(solveWidths({ columns: [{ field: 'v', type: 'text', width: 90 }], containerWidth: 0 }), [90], '显式 width 优先')
      // check/rec_no 的 type.width 50px 仍走定宽分支（TYPE_DEFAULT_WIDTHS 无此二条目）
      assertArray(solveWidths({ columns: [{ field: 'v', type: 'check' }], containerWidth: 0 }), [50], 'type.width 定宽 50')
      // 定宽分支 min = getPixelNumber(col.minWidth) ?? 0：minWidth 20 不影响，minWidth 60 抬到 60
      assertArray(solveWidths({ columns: [{ field: 'v', type: 'check', minWidth: 20 }], containerWidth: 0 }), [50], '定宽 min 显式小值')
      assertArray(solveWidths({ columns: [{ field: 'v', type: 'check', minWidth: 60 }], containerWidth: 0 }), [60], '定宽 min 抬升')

      return '显式 width=90 / check=50 定宽 / 定宽分支 min 口径与现状一致'
    }
  },
  {
    name: 'resolveTypeMinWidth：类型最小宽导出（调宽下限缺省基线，评审 6 P2）',
    fn: () => {
      assertEqual(resolveTypeMinWidth({ type: 'text' }), 80, 'text 最小宽')
      assertEqual(resolveTypeMinWidth({ type: 'bool' }), 40, 'bool 最小宽')
      assertEqual(resolveTypeMinWidth({}), 80, '无 type 回退 text 最小宽')
      assertEqual(resolveTypeMinWidth({ type: { render: () => ({}) } }), 40, '_fallback 最小宽')
      assertEqual(resolveTypeMinWidth({ type: 'progress' }), 60, 'progress 最小宽')
      // col.minWidth 显式时不介入：函数恒返回类型最小宽，优先级组合在壳侧
      // startResize 传参（getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? 40）
      assertEqual(resolveTypeMinWidth({ type: 'text', minWidth: 200 }), 80, 'col.minWidth 显式不介入')

      return 'text=80 / bool=40 / 无 type=80 / _fallback=40 / progress=60'
    }
  },
  {
    name: 'computePrefixSums：混合列宽前缀和与总宽',
    fn: () => {
      const { colLefts, colsWidth } = computePrefixSums([48, 56, 80, 120])

      assertArray(colLefts, [0, 48, 104, 184], 'colLefts')
      assertEqual(colsWidth, 304, 'colsWidth')

      const empty = computePrefixSums([])

      assertArray(empty.colLefts, [], '空列 colLefts')
      assertEqual(empty.colsWidth, 0, '空列 colsWidth')

      return `colLefts=${JSON.stringify(colLefts)}，colsWidth=${colsWidth}`
    }
  },
  {
    name: 'computeViewRows：窗口起止索引（OVERSCAN、跨行、越界 clamp、空数据）',
    fn: () => {
      const rowHeight = 36
      // C4 起 rowGeometry 必传：等高窗口断言统一经 uniform 几何夹具
      const base = { rowGeometry: createUniformRowGeometry({ rowHeight, rowCount: 100000 }) }

      assertArray(Object.values(computeViewRows({ ...base, scrollTop: 0, viewH: 360 })), [0, 12, 12], 'scrollTop=0')
      assertArray(Object.values(computeViewRows({ ...base, scrollTop: 3600, viewH: 360 })), [100, 112, 12], '整行对齐滚动')

      // 上缘跨行（scrollTop 落在行中间）：多绘 1 行，count ≤ ceil(viewH/rowH)+OVERSCAN+1（lastPaint 断言口径上界）
      const straddle = computeViewRows({ ...base, scrollTop: 18, viewH: 360 })

      assertArray(Object.values(straddle), [0, 13, 13], '跨行滚动')
      assert(straddle.count <= Math.ceil(360 / rowHeight) + OVERSCAN + 1, 'count 超 lastPaint 断言口径上界')

      // 行数少于视口 / 无数据 / 滚动越界
      const few = { rowGeometry: createUniformRowGeometry({ rowHeight, rowCount: 3 }) }
      const empty = { rowGeometry: createUniformRowGeometry({ rowHeight, rowCount: 0 }) }

      assertArray(Object.values(computeViewRows({ ...few, scrollTop: 0, viewH: 360 })), [0, 3, 3], '少量行')
      assertArray(Object.values(computeViewRows({ ...empty, scrollTop: 0, viewH: 360 })), [0, 0, 0], '空数据')

      const beyond = computeViewRows({ ...base, scrollTop: 4000000, viewH: 360 })

      assertArray(Object.values(beyond), [100000, 100000, 0], '滚动越界 clamp')

      return '对齐 12 行 / 跨行 13 行 / 少量行 clamp / 空数据 0 / 越界 count=0'
    }
  },
  {
    name: 'computeViewCols：滚动区窗口起止（固定列区排除、左缘跨列含入）',
    fn: () => {
      // 列宽 [100, 200, 300, 80] → colLefts [0, 100, 300, 600, 680]
      const { colLefts } = computePrefixSums([100, 200, 300, 80])
      const args = { colLefts }

      // fixedLeftColumns=1（fixedWidth=100），viewW=clientWidth−fixedWidth=300
      assertArray(Object.values(computeViewCols({ ...args, scrollLeft: 0, viewW: 300, fixedLeftColumns: 1 })), [1, 3, 2], 'scrollLeft=0')
      assertArray(Object.values(computeViewCols({ ...args, scrollLeft: 150, viewW: 300, fixedLeftColumns: 1 })), [1, 3, 2], 'scrollLeft=150（含左缘跨列）')

      // fixedLeftColumns=2（fixedWidth=300），viewW=200
      assertArray(Object.values(computeViewCols({ ...args, scrollLeft: 0, viewW: 200, fixedLeftColumns: 2 })), [2, 3, 1], '固定 2 列')

      // 窗口退化
      assertArray(Object.values(computeViewCols({ ...args, scrollLeft: 0, viewW: 0, fixedLeftColumns: 1 })), [0, 0, 0], 'viewW=0')
      assertArray(Object.values(computeViewCols({ colLefts: [], scrollLeft: 0, viewW: 300, fixedLeftColumns: 0 })), [0, 0, 0], '空列')

      return 'start 含左缘跨列且 ≥ 固定列数；end 为排他边界'
    }
  },
  {
    name: 'rowAt/colAt：坐标→行列换算（表头区、越界、固定列区滚动位移）',
    fn: () => {
      const rows = { headHeight: 36, rowGeometry: createUniformRowGeometry({ rowHeight: 36, rowCount: 100 }) }

      assertEqual(rowAt(20, { ...rows, scrollTop: 0 }), -1, '表头区命中行')
      assertEqual(rowAt(36, { ...rows, scrollTop: 0 }), 0, '首行上缘')
      assertEqual(rowAt(72, { ...rows, scrollTop: 0 }), 1, '行上缘归下行')
      assertEqual(rowAt(107, { ...rows, scrollTop: 0 }), 1, '行中间')
      assertEqual(rowAt(36, { ...rows, scrollTop: 72 }), 2, '滚动后换算')
      assertEqual(rowAt(50, { ...rows, scrollTop: 72 }), 2, '滚动后行中间')
      assertEqual(rowAt(1836, { ...rows, scrollTop: 3600 }), -1, '滚动后超出行数')

      const cols = {
        colLefts: [0, 100, 300, 600],
        colWidths: [100, 200, 300, 80],
        fixedLeftColumns: 1
      }

      assertEqual(colAt(0, { ...cols, scrollLeft: 0 }), 0, '首列左缘')
      assertEqual(colAt(250, { ...cols, scrollLeft: 0 }), 1, '滚动区列中间')
      assertEqual(colAt(600, { ...cols, scrollLeft: 0 }), 3, '列左缘归该列')
      assertEqual(colAt(690, { ...cols, scrollLeft: 0 }), -1, '超出列总宽')
      assertEqual(colAt(-5, { ...cols, scrollLeft: 0 }), -1, '负坐标')
      assertEqual(colAt(50, { ...cols, scrollLeft: 200 }), 0, '固定列区不随滚动位移')
      assertEqual(colAt(350, { ...cols, scrollLeft: 200 }), 2, '滚动区按 contentX 换算')

      return 'rowAt/colAt 边界语义（上缘归下、表头/越界 -1、固定列视口坐标）'
    }
  },
  {
    name: 'findResizeColumn：手柄命中距离与左右邻列归一',
    fn: () => {
      const args = {
        colLefts: [0, 100, 300, 600],
        colWidths: [100, 200, 300, 80],
        columns: [{}, {}, {}, {}],
        fixedLeftColumns: 0,
        resizable: true
      }
      const noFixed = params => findResizeColumn({ ...args, ...params })

      assertEqual(noFixed({ x: 298, scrollLeft: 0 }), 1, '命中列右缘 → 该列')
      assertEqual(noFixed({ x: 104, scrollLeft: 0 }), 0, '命中列左缘 → 左邻列')
      assertEqual(noFixed({ x: 304, scrollLeft: 0 }), 1, '右邻列左缘 → 左邻列')
      assertEqual(noFixed({ x: 105, scrollLeft: 0 }), -1, '距列缘 >4px')
      assertEqual(noFixed({ x: 250, scrollLeft: 0 }), -1, '列中间无手柄')
      assertEqual(noFixed({ x: 676, scrollLeft: 0 }), 3, '末列右缘')
      assertEqual(noFixed({ x: 690, scrollLeft: 0 }), -1, '超出末列')

      // 滚动位移下按视口坐标判定（col 1 视口右缘 = 300 − 200 = 100）
      assertEqual(noFixed({ x: 104, scrollLeft: 200 }), 1, '滚动后视口坐标判定')

      return '±4px 命中，右缘归命中列、左缘归左邻列'
    }
  },
  {
    name: 'findResizeColumn：固定列排除（分界两侧）与列级 resizable=false',
    fn: () => {
      const args = {
        colLefts: [0, 100, 300, 600],
        colWidths: [100, 200, 300, 80],
        columns: [{}, {}, { resizable: false }, {}],
        fixedLeftColumns: 1,
        resizable: true
      }
      const detect = params => findResizeColumn({ ...args, ...params })

      assertEqual(detect({ x: 98, scrollLeft: 0 }), -1, '固定列右缘（分界）')
      assertEqual(detect({ x: 102, scrollLeft: 0 }), -1, '滚动区首列左缘（分界另一侧）')
      assertEqual(detect({ x: 50, scrollLeft: 0 }), -1, '固定列中间')
      assertEqual(detect({ x: 298, scrollLeft: 0 }), 1, '非固定列缘正常返回')
      assertEqual(detect({ x: 596, scrollLeft: 0 }), -1, '列级 resizable=false 的右缘')
      assertEqual(detect({ x: 604, scrollLeft: 0 }), -1, '左邻列 resizable=false 的左缘')
      assertEqual(findResizeColumn({ ...args, x: 298, scrollLeft: 0, resizable: false }), -1, '表格级 resizable 关闭')

      return '固定列区域整体不可调宽（含分界两侧）；列级/表格级开关生效'
    }
  },
  {
    name: 'rowGeometry 参数化：uniform 窗口与等高算式恒等 + 变高窗口来自几何（C4 后几何必传）',
    fn: () => {
      const rowHeight = 36
      const rowCount = 100000
      const uniform = createUniformRowGeometry({ rowHeight, rowCount })

      // uniform 几何窗口 = 经典等高算式（start=floor、end=ceil+OVERSCAN、clamp rowCount）
      const equalHeightRange = (scrollTop, viewH) => {
        const start = Math.min(Math.max(Math.floor(scrollTop / rowHeight), 0), rowCount)
        const end = Math.min(Math.max(Math.ceil((scrollTop + viewH) / rowHeight) + OVERSCAN, start), rowCount)

        return { start, end, count: end - start }
      }

      for (const [scrollTop, viewH] of [[0, 360], [18, 360], [3600, 360], [1800018, 360]]) {
        const viaGeometry = computeViewRows({ scrollTop, viewH, rowGeometry: uniform })

        assertArray(Object.values(viaGeometry), Object.values(equalHeightRange(scrollTop, viewH)), `等高恒等 scrollTop=${scrollTop}`)
      }

      // 变高：行高 [40, 20, 60, ...]，与几何自身 visibleRange/offsetToRow 一致
      const heights = [40, 20, 60, 30, 50, 10, 45, 25]
      const variable = createVariableRowGeometry({ initialHeights: heights })
      const viewRows = computeViewRows({ scrollTop: 60, viewH: 100, rowGeometry: variable })

      assertArray(Object.values(viewRows), Object.values(variable.visibleRange(60, 100, OVERSCAN)), '变高窗口来自几何')
      assertEqual(rowAt(36 + 61, { headHeight: 36, scrollTop: 0, rowGeometry: variable }), variable.offsetToRow(61), 'rowAt 变高定位')

      return 'uniform 与等高算式恒等 / 变高窗口与 offsetToRow'
    }
  },
  {
    name: 'relayout：rowGeometry 变高模式（contentHeight=totalHeight、快照携带几何引用）',
    fn: () => {
      // 14 行：行 1 变高 72，其余 36 → total = 13×36 + 72 = 540
      const heights = Array.from({ length: 14 }, (_, i) => (i === 1 ? 72 : 36))
      const geometry = createVariableRowGeometry({ initialHeights: heights })
      const layout = relayout({
        columns: [{ field: 'a', width: 800 }],
        rowCount: heights.length,
        containerWidth: 800,
        containerHeight: 436,
        rowHeight: 36,
        headHeight: 36,
        scrollTop: 0,
        rowGeometry: geometry
      })

      assertEqual(layout.contentHeight, 36 + 540, 'contentHeight = headHeight + totalHeight')
      assertEqual(layout.spacerHeight, 36 + 540 - 436, 'spacerHeight 随变高 totalHeight')
      assert(layout.rowGeometry === geometry, '快照应携带传入的 rowGeometry 引用')
      assertEqual(layout.viewRows.start, 0, '变高窗口 start')
      assertEqual(layout.viewRows.count, 13, '变高窗口（topAt(10)=396 < viewH 400，end=11 + OVERSCAN=13）')

      return `contentHeight=${layout.contentHeight}，spacerH=${layout.spacerHeight}，viewRows=${layout.viewRows.count} 行，几何引用一致`
    }
  },
  {
    name: 'relayout：纯函数输出全字段（viewH/viewW 口径、sticky/spacer、viewRows/viewCols）',
    fn: () => {
      const columns = [{ field: 'a', width: 100 }, { field: 'b', width: 200 }, { field: 'c' }]
      const before = JSON.stringify(columns)
      const layout = relayout({
        columns,
        rowCount: 100000,
        containerWidth: 800,
        containerHeight: 436,
        fixedLeftColumns: 1,
        rowHeight: 36,
        headHeight: 36,
        scrollTop: 0,
        scrollLeft: 0,
        rowGeometry: createUniformRowGeometry({ rowHeight: 36, rowCount: 100000 })
      })

      // 口径（decisions「[I1 前]④」）：viewH = clientHeight − headHeight；viewW = clientWidth − fixedWidth
      assertEqual(layout.viewH, 400, 'viewH')
      assertEqual(layout.viewW, 700, 'viewW')
      assertArray(layout.colWidths, [100, 200, 500], 'colWidths（未定宽列瓜分剩余）')
      assertArray(layout.colLefts, [0, 100, 300], 'colLefts')
      assertEqual(layout.colsWidth, 800, 'colsWidth')
      assertEqual(layout.contentWidth, 800, 'contentWidth')
      assertEqual(layout.contentHeight, 36 + 100000 * 36, 'contentHeight')
      assertEqual(layout.fixedWidth, 100, 'fixedWidth')
      assertEqual(layout.stickyWidth, 800, 'stickyWidth')
      assertEqual(layout.stickyHeight, 436, 'stickyHeight')
      assertEqual(layout.spacerWidth, 800, 'spacerWidth')
      assertEqual(layout.spacerHeight, 3600036 - 436, 'spacerHeight = contentHeight − clientHeight')
      assertEqual(layout.viewRows.count, 14, 'viewRows.count = ceil(viewH/rowH)+OVERSCAN')
      assert(layout.viewRows.count <= Math.ceil(layout.viewH / 36) + OVERSCAN + 1, 'viewRows 超 lastPaint 断言口径上界')
      assertArray(Object.values(layout.viewCols), [1, 3, 2], 'viewCols')
      assertEqual(JSON.stringify(columns), before, 'relayout 改写入参')

      return `viewH=400 viewW=700 spacerH=${layout.spacerHeight} rows=${layout.viewRows.count} cols=${layout.viewCols.count}`
    }
  },
  {
    name: 'relayout：少量行/空 records/空列的 clamp（spacerHeight=0）',
    fn: () => {
      const few = relayout({
        columns: [{ field: 'a', width: 200 }],
        rowCount: 3,
        containerWidth: 800,
        containerHeight: 436,
        rowHeight: 36,
        headHeight: 36,
        rowGeometry: createUniformRowGeometry({ rowHeight: 36, rowCount: 3 })
      })

      assertEqual(few.contentHeight, 36 + 3 * 36, '少量行 contentHeight')
      assertEqual(few.spacerHeight, 0, '少量行 spacerHeight clamp 0')
      assertEqual(few.spacerWidth, 800, '少量行 spacerWidth = max(列宽, 容器宽)')
      assertEqual(few.viewRows.count, 3, '少量行 viewRows')

      const empty = relayout({
        columns: [{ field: 'a', width: 200 }],
        rowCount: 0,
        containerWidth: 800,
        containerHeight: 436,
        rowHeight: 36,
        headHeight: 36,
        rowGeometry: createUniformRowGeometry({ rowHeight: 36, rowCount: 0 })
      })

      assertEqual(empty.spacerHeight, 0, '空 records spacerHeight')
      assertEqual(empty.viewRows.count, 0, '空 records viewRows')
      assertEqual(empty.contentHeight, 36, '空 records contentHeight 仅表头')

      const noCols = relayout({
        columns: [],
        rowCount: 10,
        containerWidth: 800,
        containerHeight: 436,
        fixedLeftColumns: 2,
        rowHeight: 36,
        headHeight: 36,
        rowGeometry: createUniformRowGeometry({ rowHeight: 36, rowCount: 10 })
      })

      assertArray(noCols.colWidths, [], '空列 colWidths')
      assertEqual(noCols.colsWidth, 0, '空列 colsWidth')
      assertEqual(noCols.fixedCount, 0, '空列 fixedCount clamp')
      assertEqual(noCols.viewW, 800, '空列 viewW')
      assertEqual(noCols.viewCols.count, 0, '空列 viewCols')

      return 'spacerHeight=0 / 空数据仅表头 / 空列退化为容器宽窗口'
    }
  }
]
