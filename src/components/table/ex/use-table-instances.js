/**
 * 实例生命周期 composable（C1 壳拆分自 table-ex.vue）：onMounted 创建
 * painter / 文本测量 / wrap 缓存 / 主题 watcher 四个模块实例（经 host setter
 * 写回壳实例槽）+ onUnmounted 清理 + 主题变更链（refreshTheme / onThemeChange，
 * 契约⑤ 评审 6 P9 / A2.2）。
 */
import { nextTick, onMounted, onUnmounted } from 'vue'

import { createThemeWatcher, createTextMeasurer } from './theme'
import { createWrapCache } from './text-wrap'
import { createPainter } from './painter'

/**
 * @param {Object} ctx host 袋（读取 scrollEl, stickyEl, rootEl, canvasEl,
 *   getThemeWatcher, setThemeWatcher, getPainter, setPainter, setMeasure,
 *   setWrapCache, relayout, rowGeometry, recomputeViewWindows, redraw, editor,
 *   hideCellTooltip, scrollFrame, onResize）
 * @returns {{ refreshTheme, onThemeChange }}
 */
export function useTableInstances (ctx) {
  /** 手动重读 --mu-* 变量并 relayout + 整幅重绘（暗色感知兜底 / 尺寸变量覆盖生效通道） */
  function refreshTheme () {
    ctx.getThemeWatcher()?.refresh()
  }

  /** 契约⑤（评审 6 P9 / A2.2 主题·字号·行高变量刷新通道）：theme.js 仅发信号，
      重估链全部在壳——wrap 缓存失效 + 全量快速重估 + rebuild（relayoutAndRedraw 内）
      + 锚定补偿 + 窗口重精算（controller.remeasureVisibleRows 内）+ 窗口同步重绘 */
  function onThemeChange () {
    const el = ctx.scrollEl.value
    const geometry = ctx.rowGeometry.geometry
    let anchor = null

    // 锚定基准在 rebuild 重估前捕获（旧几何 topAt；主题变化不改行集合，行号不变）
    if (geometry && el) {
      const row = geometry.offsetToRow(el.scrollTop)

      anchor = { row, top: geometry.topAt(row) }
    }

    // wrap 缓存失效：key 含 text+font+width+maxLines，主题变化后旧条目不再命中，
    // 整体重建清掉死权重
    ctx.setWrapCache(createWrapCache())

    ctx.relayout()

    if (anchor && ctx.rowGeometry.geometry && el) {
      const shift = ctx.rowGeometry.geometry.topAt(anchor.row) - anchor.top

      if (shift) el.scrollTop += shift
    }

    ctx.rowGeometry.remeasureVisibleRows()
    ctx.recomputeViewWindows()
    ctx.redraw()
  }

  onMounted(() => {
    ctx.setPainter(createPainter({ canvas: ctx.canvasEl.value }))

    // 文本测量注入（A2.2）：单实例同时供行高估高/精算与绘制折行（单一事实源）
    ctx.setMeasure(createTextMeasurer())
    ctx.setWrapCache(createWrapCache())

    ctx.setThemeWatcher(createThemeWatcher({
      probeHost: ctx.stickyEl.value,
      componentRoot: ctx.rootEl.value,
      // 主题刷新（暗色切换 / DPR 变化 / refreshTheme）：契约⑤（评审 6 P9）——
      // wrap 缓存失效 + 变高行全量快速重估 + rebuild + 窗口重精算 + 锚定在壳
      // onChange 处理器（relayout 前），theme.js 仅发信号
      onChange: () => onThemeChange()
    }))

    // 首帧：canvas 入文档布局后 relayout + 绘制（A2）
    nextTick(() => ctx.relayout())
  })

  onUnmounted(() => {
    ctx.hideCellTooltip()
    ctx.editor.destroy()
    ctx.getThemeWatcher()?.destroy()
    ctx.getPainter()?.dispose()
    ctx.scrollFrame.cancel()
    ctx.onResize.cancel()
  })

  return {
    refreshTheme,
    onThemeChange
  }
}
