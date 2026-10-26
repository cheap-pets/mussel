/**
 * canvas-table 列宽拖拽 composable（C1 壳拆分自 canvas-table.vue；02-design.md
 * A5、decisions「[I1 前]⑥⑧」）。
 *
 * 职责：拖拽宽度覆盖（widthOverrides，按列 key 存放、不写回 props，columns
 * 引用替换时清空）、move 中临时几何更新（被拖列改宽仅重算前缀和与 spacer，
 * 不重跑宽度求解防其他列抖动）、参考线 x 状态、拖拽误触抑制 clickGuard 接线。
 */
import { shallowRef } from 'vue'

import { getPixelNumber } from '../table/utils'
import { computePrefixSums, resolveTypeMinWidth } from './layout'
import { createClickGuard, resolveResizeWidth, RESIZE_MIN_WIDTH } from './interactions'

/**
 * 创建列宽拖拽（组件壳 setup 内调用）。
 *
 * @param {Object} ctx 组件壳注入
 * - props / emit                    组件 props（resizable）与 emit
 * - getPreparedColumns ()           → prepareColumn 后的内部列数组
 * - getLayout () / setLayout (v)    → layout shallowRef 读写（拖拽 move 临时几何）
 * - getCanvasEl ()                  → canvas 元素（拖拽起点 rect）
 * - invalidate (region)             → 壳脏区重绘（move 脏带：该列左缘至视口右端 + 表头）
 * - relayout ()                     → 壳 relayoutAndRedraw（up 后全量重算）
 * @returns {{
 *   resizeGuideX: Object, clickGuard: Object, widthOverrides: Object,
 *   startResize: Function, resetOverrides: Function
 * }}
 */
export function useColumnResize (ctx) {
  const { props, emit } = ctx

  /** 调宽拖拽参考线视口 x（overlay 覆盖层绘制；拖拽中非 null） */
  const resizeGuideX = shallowRef(null)

  /** 拖拽误触抑制（A5 / decisions「[I1 前]⑧」）：拖拽后紧随的 click 丢弃 */
  const clickGuard = createClickGuard()

  // 拖拽列宽存放（按列 key），不写回 props（decisions「[I1 前]⑥」G1-b 契约：
  // overrides 由组件壳持有，columns 引用替换时清空）
  const widthOverrides = {}

  /** move 中临时更新列几何：被拖列改宽后仅重算前缀和与 spacer，不重跑宽度求解 */
  function applyOverrideGeometry (colIndex, width, base) {
    const colWidths = base.colWidths.slice()

    colWidths[colIndex] = width

    const { colLefts, colsWidth } = computePrefixSums(colWidths)

    ctx.setLayout({
      ...base,
      colWidths,
      colLefts,
      colsWidth,
      contentWidth: colsWidth,
      spacerWidth: Math.max(colsWidth, base.stickyWidth)
    })
  }

  /** 表头手柄 pointerdown 开拖（A5）：window 级 pointermove/pointerup 接线 */
  function startResize (event, hit) {
    const colIndex = hit.resizeCol
    const col = ctx.getPreparedColumns()[colIndex]
    const cur = ctx.getLayout()

    if (!col || !cur) return

    clickGuard.arm()

    const canvasRect = ctx.getCanvasEl().getBoundingClientRect()
    let lastWidth = cur.colWidths[colIndex]

    const onMove = ev => {
      const base = ctx.getLayout()

      if (!base) return

      const width = resolveResizeWidth({
        pointerX: ev.clientX - canvasRect.left,
        scrollLeft: base.scrollLeft,
        columnLeft: base.colLefts[colIndex],
        // 拖拽下限（评审 6 P2）：col.minWidth 显式值 > 类型最小宽 > 40 兜底
        // （真正 clamp 在 resolveResizeWidth 内，A4.1）
        minWidth: getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH,
        maxWidth: getPixelNumber(col.maxWidth)
      })

      if (width === lastWidth) return

      lastWidth = width

      // move 中不重跑 solveWidths（A5 防其他列抖动）：暂存 override 并临时更新列几何
      widthOverrides[col._key] = width

      applyOverrideGeometry(colIndex, width, base)

      // 参考线 = 拖拽列右缘视口 x（overlay 覆盖层绘制）
      resizeGuideX.value = base.colLefts[colIndex] + width - base.scrollLeft

      // move 脏区：该列左缘至视口右端竖带 + 表头整幅（A3 重绘表 / 评审 M9）
      ctx.invalidate({ colFrom: colIndex })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      // pointerup 后延时清除残留 flag（decisions「[I1 前]⑧」）
      clickGuard.release()

      resizeGuideX.value = null

      // up：emit → relayout（拖拽列显式定宽〔overrides 已写入〕，
      // 其余未定宽列重跑求解重新瓜分剩余空间，A3/A5）
      emit('column-resize', { column: col._raw, width: lastWidth })
      ctx.relayout()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  /** columns 引用变化时清空拖拽宽度覆盖（G1-b 契约） */
  function resetOverrides () {
    for (const key of Object.keys(widthOverrides)) delete widthOverrides[key]
  }

  return {
    resizeGuideX,
    clickGuard,
    widthOverrides,
    startResize,
    resetOverrides
  }
}
