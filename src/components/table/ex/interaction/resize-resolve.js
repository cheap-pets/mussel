/**
 * table-ex 调宽域决策：拖拽 move 的列宽 clamp 与下限缺省常量。只含纯决策
 * 函数；命中检测与光标判定见 hit-test.js，click 分支决策见 click-resolve.js。
 */

/** 拖拽调宽下限缺省（列未配 minWidth 时） */
export const RESIZE_MIN_WIDTH = 40

/**
 * 拖拽 move 的列宽 clamp。pointerX 为相对 canvas 视口的 x，
 * columnLeft 为拖拽列内容坐标左缘（colLefts[colIndex]）。
 */
export function resolveResizeWidth ({ pointerX, scrollLeft = 0, columnLeft, minWidth, maxWidth }) {
  const min = minWidth ?? RESIZE_MIN_WIDTH
  const max = maxWidth ?? Infinity

  return Math.min(Math.max(pointerX + scrollLeft - columnLeft, min), max)
}
