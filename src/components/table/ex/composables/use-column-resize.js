/**
 * table-ex 列宽拖拽 composable。
 *
 * 职责：拖拽宽度覆盖（widthOverrides，按列 key 存放、不写回 props，columns
 * 引用替换时清空）、move 中临时几何更新（被拖列改宽仅重算前缀和与 spacer，
 * 不重跑宽度求解防其他列抖动）、参考线 x 状态、拖拽误触抑制 clickGuard 接线。
 */
/**
 * host 消费面声明（供依赖审计 grep；「壳」= table-ex.vue host 字面量成员）
 * @host-reads emit
 * @host-writes resizeGuideX, clickGuard, widthOverrides, startResize, resetOverrides
 * @host-calls getPreparedColumns（壳）, getLayout / setLayout（壳）,
 *   getCanvasEl（壳）, invalidate（提供方 use-paint-state）, relayout
 *   （壳前向槽，use-relayout 后覆盖）
 */
import { shallowRef } from 'vue'

import { getPixelNumber } from '@/utils/size'
import { computePrefixSums, resolveTypeMinWidth } from '../geometry/layout'
import { resolveResizeWidth, RESIZE_MIN_WIDTH } from '../interaction/interactions'
import { createClickGuard } from '../interaction/schedulers'

/**
 * 创建列宽拖拽（组件壳 setup 内调用；消费面见文件头 @host-* 声明）。
 *
 * @returns {{
 *   resizeGuideX: Object, clickGuard: Object, widthOverrides: Object,
 *   startResize: Function, resetOverrides: Function
 * }}
 */
export function useColumnResize (host) {
  const { emit } = host

  /** 调宽拖拽参考线视口 x（overlay 覆盖层绘制；拖拽中非 null） */
  const resizeGuideX = shallowRef(null)

  /** 拖拽误触抑制：拖拽后紧随的 click 丢弃 */
  const clickGuard = createClickGuard()

  const widthOverrides = {}

  function applyOverrideGeometry (colIndex, width, base) {
    const colWidths = base.colWidths.slice()

    colWidths[colIndex] = width

    const { colLefts, colsWidth } = computePrefixSums(colWidths)

    host.setLayout({
      ...base,
      colWidths,
      colLefts,
      colsWidth,
      contentWidth: colsWidth,
      spacerWidth: Math.max(colsWidth, base.stickyWidth)
    })
  }

  /** 表头手柄 pointerdown 开拖：window 级 pointermove/pointerup 接线 */
  function startResize (event, hit) {
    const colIndex = hit.resizeCol
    const col = host.getPreparedColumns()[colIndex]
    const cur = host.getLayout()

    if (!col || !cur) return

    clickGuard.arm()

    const canvasRect = host.getCanvasEl().getBoundingClientRect()
    let lastWidth = cur.colWidths[colIndex]

    const onMove = ev => {
      const base = host.getLayout()

      if (!base) return

      const width = resolveResizeWidth({
        pointerX: ev.clientX - canvasRect.left,
        scrollLeft: base.scrollLeft,
        columnLeft: base.colLefts[colIndex],
        // 拖拽下限：col.minWidth 显式值 > 类型最小宽 > 40 兜底
        // （真正 clamp 在 resolveResizeWidth 内）
        minWidth: getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH,
        maxWidth: getPixelNumber(col.maxWidth)
      })

      if (width === lastWidth) return

      lastWidth = width

      widthOverrides[col._key] = width

      applyOverrideGeometry(colIndex, width, base)

      resizeGuideX.value = base.colLefts[colIndex] + width - base.scrollLeft

      // move 脏区：该列左缘至视口右端竖带 + 表头整幅
      host.invalidate({ colFrom: colIndex })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      // pointerup 后延时清除残留 flag
      clickGuard.release()

      resizeGuideX.value = null

      // up：emit → relayout（拖拽列显式定宽〔overrides 已写入〕，其余未定宽列
      // 重跑求解重新瓜分剩余空间）
      emit('column-resize', { column: col._raw, width: lastWidth })
      host.relayout()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

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
