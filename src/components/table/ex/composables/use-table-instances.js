/**
 * 实例生命周期 composable（C1 壳拆分自 table-ex.vue）：onMounted 创建
 * painter / 文本测量 / wrap 缓存 / 主题 watcher 四个模块实例（经 host setter
 * 写回壳实例槽）+ onUnmounted 清理 + 主题变更链（refreshTheme / onThemeChange，
 * 契约⑤ 评审 6 P9 / A2.2）。
 */
/**
 * host 消费面声明（O2，供依赖审计 grep；「壳」= table-ex.vue host 字面量成员）
 * @host-reads scrollEl, stickyEl, rootEl, canvasEl, rowGeometry（消费 geometry /
 *   remeasureVisibleRows）
 * @host-writes refreshTheme, onThemeChange
 * @host-calls getThemeWatcher / setThemeWatcher / setPainter / setMeasure /
 *   setWrapCache / getPainter（壳）, relayout（壳前向槽，use-relayout 后覆盖）,
 *   recomputeViewWindows / scrollFrame / onResize（提供方 use-relayout）,
 *   redraw（提供方 use-paint-state）, hideCellTooltip
 *   （提供方 use-cell-tooltip）, editor.destroy（壳 editor 控制器）
 */
import { nextTick, onMounted, onUnmounted } from 'vue'

import { createThemeWatcher, createTextMeasurer } from '../shared/theme'
import { createWrapCache } from '../shared/text-wrap'
import { createPainter } from '../table-paint/painter'

/**
 * @param {Object} host host 袋（读取 scrollEl, stickyEl, rootEl, canvasEl,
 *   getThemeWatcher, setThemeWatcher, getPainter, setPainter, setMeasure,
 *   setWrapCache, relayout, rowGeometry, recomputeViewWindows, redraw, editor,
 *   hideCellTooltip, scrollFrame, onResize）
 * @returns {{ refreshTheme, onThemeChange }}
 */
export function useTableInstances (host) {
  /** 手动重读 --mu-* 变量并 relayout + 整幅重绘（暗色感知兜底 / 尺寸变量覆盖生效通道） */
  function refreshTheme () {
    host.getThemeWatcher()?.refresh()
  }

  /** 契约⑤（评审 6 P9 / A2.2 主题·字号·行高变量刷新通道）：theme.js 仅发信号，
      重估链全部在壳——wrap 缓存失效 + 全量快速重估 + rebuild（relayoutAndRedraw 内）
      + 锚定补偿 + 窗口重精算（controller.remeasureVisibleRows 内）+ 窗口同步重绘 */
  function onThemeChange () {
    const el = host.scrollEl.value
    const geometry = host.rowGeometry.geometry
    let anchor = null

    // 锚定基准在 rebuild 重估前捕获（旧几何 topAt；主题变化不改行集合，行号不变）
    if (geometry && el) {
      const row = geometry.offsetToRow(el.scrollTop)

      anchor = { row, top: geometry.topAt(row) }
    }

    // wrap 缓存失效：key 含 text+font+width+maxLines，主题变化后旧条目不再命中，
    // 整体重建清掉死权重
    host.setWrapCache(createWrapCache())

    host.relayout()

    if (anchor && host.rowGeometry.geometry && el) {
      const shift = host.rowGeometry.geometry.topAt(anchor.row) - anchor.top

      if (shift) el.scrollTop += shift
    }

    host.rowGeometry.remeasureVisibleRows()
    host.recomputeViewWindows()
    host.redraw()
  }

  onMounted(() => {
    host.setPainter(createPainter({ canvas: host.canvasEl.value }))

    // 文本测量注入（A2.2）：单实例同时供行高估高/精算与绘制折行（单一事实源）
    host.setMeasure(createTextMeasurer())
    host.setWrapCache(createWrapCache())

    host.setThemeWatcher(createThemeWatcher({
      probeHost: host.stickyEl.value,
      componentRoot: host.rootEl.value,
      // 主题刷新（暗色切换 / DPR 变化 / refreshTheme）：契约⑤（评审 6 P9）——
      // wrap 缓存失效 + 变高行全量快速重估 + rebuild + 窗口重精算 + 锚定在壳
      // onChange 处理器（relayout 前），theme.js 仅发信号
      onChange: () => onThemeChange()
    }))

    // 首帧：canvas 入文档布局后 relayout + 绘制（A2）
    nextTick(() => host.relayout())
  })

  onUnmounted(() => {
    host.hideCellTooltip()
    host.editor.destroy()
    host.getThemeWatcher()?.destroy()
    host.getPainter()?.dispose()
    host.scrollFrame.cancel()
    host.onResize.cancel()
  })

  return {
    refreshTheme,
    onThemeChange
  }
}
