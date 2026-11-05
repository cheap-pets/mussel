/**
 * 布局重算 / 滚动 / 尺寸响应 composable（C1 壳拆分自 table-ex.vue；
 * 02-design.md A2 DPR 适配与布局重算 + A3 滚动行 + relayout 源合一 watch）。
 */
import { ref, watch } from 'vue'
import { throttle } from 'throttle-debounce'

import { computeViewCols, computeViewRows, relayout as computeLayout } from './layout'
import { createFrameScheduler } from './interactions'

/**
 * @param {Object} ctx host 袋（读取 scrollEl, canvasEl, props, preparedColumns,
 *   displayRows, rowGeometry, widthOverrides, layout, paintState, getThemeWatcher,
 *   hideCellTooltip, editor, redraw, invalidate, resetOverrides, setLastRelayout）
 * @returns {{ relayoutAndRedraw, recomputeViewWindows, onScroll, onResize,
 *   scrollFrame, yScrolled, yScrolledEnd, yOverflowed }}
 */
export function useRelayout (ctx) {
  const { props } = ctx

  const yScrolled = ref(false)
  const yScrolledEnd = ref(false)
  const yOverflowed = ref(false)

  function syncCanvasSize (cssWidth, cssHeight) {
    const canvas = ctx.canvasEl.value

    if (!canvas) return

    const dpr = window.devicePixelRatio || 1

    ctx.paintState.dpr = dpr

    const physicsWidth = Math.round(cssWidth * dpr)
    const physicsHeight = Math.round(cssHeight * dpr)

    if (canvas.width !== physicsWidth) canvas.width = physicsWidth
    if (canvas.height !== physicsHeight) canvas.height = physicsHeight

    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`
  }

  /** 统一布局重算入口（A2 relayout()）：探针尺寸 → 变高候选全量快速估高 + 几何
      重建/升级 → sticky/spacer 尺寸 → 列宽求解 → canvas 物理尺寸 → 可视窗口 → 整幅重绘。
      估高需 contentWidth（列宽），先按首过几何解一次列宽再带几何重算（纯函数，成本可忽略） */
  function relayoutAndRedraw () {
    // tooltip 收起（状态失效类）：数据/几何变化即旧格提示过期（含 recordsVersion 通道）
    ctx.hideCellTooltip()

    const el = ctx.scrollEl.value
    const themeWatcher = ctx.getThemeWatcher()

    if (!el || !themeWatcher) return

    const startedAt = performance.now()
    const snapshot = themeWatcher.snapshot
    const base = {
      columns: ctx.preparedColumns.value,
      rowCount: ctx.displayRows.value?.length ?? 0,
      containerWidth: el.clientWidth,
      containerHeight: el.clientHeight,
      fixedLeftColumns: props.fixedLeftColumns ?? 0,
      // 探针读取失败（变量未定义）时回退 table.scss 镜像缺省（兜底在消费方）
      rowHeight: snapshot.rowHeight || 36,
      headHeight: snapshot.headHeight || 36,
      scrollTop: el.scrollTop,
      scrollLeft: el.scrollLeft,
      widthOverrides: ctx.widthOverrides
    }

    // 首过：以现有几何（变高）/等高几何解列宽；scanDirty 时重建几何再算一次
    let next = computeLayout({ ...base, rowGeometry: ctx.rowGeometry.currentGeometry(base) })
    const { geometry, scanCount, rebuild } = ctx.rowGeometry.resolveForRelayout({
      colWidths: next.colWidths,
      theme: snapshot
    })

    if (rebuild) next = computeLayout({ ...base, rowGeometry: geometry })

    ctx.layout.value = next

    yOverflowed.value = next.contentHeight > next.stickyHeight + 0.5
    yScrolled.value = next.scrollTop > 0.5
    yScrolledEnd.value =
      yScrolled.value && next.contentHeight - next.scrollTop - next.stickyHeight < 1

    syncCanvasSize(next.stickyWidth, next.stickyHeight)

    // relayout 出口统一精算（20261029 问题 2，onThemeChange 先例同款三连）：
    // 估高对字符串多行列恒取 1 行下界，relayout 尾部只 redraw 会令行高/格线停在
    // 估高位置；补可视行精算（uniform 模式零成本早退）+ 窗口重算 + 整幅重绘，
    // 保证一切 relayout 出口的可视行高为真值、格线落在精算位置
    ctx.rowGeometry.remeasureVisibleRows()
    ctx.recomputeViewWindows()
    ctx.redraw()

    // relayout 计时（getLayoutInfo 暴露：lastPaint 只覆盖 paint()，本字段补齐
    // 估高扫描/几何重建阶段的可见性，复核 2026-10-26 验证设施缺口）
    ctx.setLastRelayout({ elapsed: performance.now() - startedAt, scanCount, rebuild })
  }

  // 滚动路径不重跑 solveWidths（G1-b 契约）：直接以现有 colLefts 重算可视窗口
  function recomputeViewWindows () {
    const el = ctx.scrollEl.value
    const cur = ctx.layout.value

    if (!el || !cur) return

    const scrollTop = el.scrollTop
    const scrollLeft = el.scrollLeft

    ctx.layout.value = {
      ...cur,
      scrollTop,
      scrollLeft,
      viewRows: computeViewRows({
        scrollTop,
        viewH: cur.viewH,
        rowGeometry: cur.rowGeometry
      }),
      viewCols: computeViewCols({
        scrollLeft,
        viewW: cur.viewW,
        colLefts: cur.colLefts,
        fixedLeftColumns: cur.fixedCount
      })
    }
  }

  // —— 滚动 / 尺寸响应 ——

  const scrollFrame = createFrameScheduler(() => {
    ctx.rowGeometry.remeasureVisibleRows()
    ctx.recomputeViewWindows()
    ctx.redraw()
  })

  function onScroll () {
    const el = ctx.scrollEl.value

    if (!el) return

    // 滚动即提交（A6，kaka SELECTED_CELL/SCROLL 同语义）
    ctx.editor.commit()

    // tooltip 收起（壳统一收起：锚点在 sticky 层内不随内容滚动，面板会停在旧视觉位置）
    ctx.hideCellTooltip()

    yScrolled.value = el.scrollTop > 0.5
    yScrolledEnd.value =
      yScrolled.value && el.scrollHeight - el.scrollTop - el.clientHeight < 1

    // rAF 合帧：同帧多次 scroll 只重绘一次（A3）
    scrollFrame.schedule()
  }

  const onResize = throttle(100, () => {
    if (ctx.scrollEl.value) relayoutAndRedraw()
  }, { noLeading: true })

  // —— 渲染源 watch（A3 重绘表） ——

  // relayout 源合一（20261030 P1 合帧）：六个源（records / columns / recordsVersion /
  // spanMethod / orderBy / fixedLeftColumns）合并为单一 watch——同批多源变化（如父级
  // 一次替换数据与列定义）从「每 watch 各跑一次完整 relayout（估高扫描 + 精算 +
  // 重绘）」变为一次；回调内按源 diff 执行各自前置副作用，顺序与合并前各 watch
  // 定义序一致：
  // - records 引用变化：滚动复位（A2 数据契约，table.vue 同款）
  // - columns 引用变化：清空拖拽宽度覆盖（G1-b 契约）+ 行高缓存签名置空（列定义
  //   变化改变行高语义；缓存键为 record 引用，不含列定义维度）
  // - recordsVersion：异步就地修改 records 后的通知通道 → spans 重算 + relayout
  //   （§4：合并行高分层随 spans 身份重扫，A3 数据契约②）
  // - spanMethod / orderBy：spans 重算（orderBy 变化即行序语义变化，合并块随本批重算，§4）
  // - fixedLeftColumns：固定区宽度 / viewW 口径变化
  // 之后统一 relayout（含尾部可视行精算与整幅重绘）
  watch(
    [
      () => props.records,
      () => props.columns,
      () => props.recordsVersion,
      () => props.spanMethod,
      () => props.orderBy,
      () => props.fixedLeftColumns
    ],
    ([records, columns], [prevRecords, prevColumns]) => {
      if (records !== prevRecords) {
        ctx.scrollEl.value?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }

      if (columns !== prevColumns) {
        ctx.resetOverrides()
        ctx.rowGeometry.invalidateMeasureCache()
      }

      relayoutAndRedraw()
    }
  )

  // 渲染 props → 整幅重绘；placeholder 不进列准备（绘制期兜底，见
  // preparedColumns 注释），切换占位文本仅整幅重绘、不触发估高重扫
  watch(
    () => [
      props.gridlines,
      props.hoverMode,
      props.striped,
      props.recordsOffset,
      props.placeholder
    ],
    () => {
      // hoverMode 切换等重绘路径同步收起 tooltip（去重键同步清空）
      ctx.hideCellTooltip()
      ctx.redraw()
    }
  )

  // headerChecked 受控变化 → 表头区整幅（受控 ✓ 状态变化即重绘）
  watch(() => props.headerChecked, () => ctx.invalidate({ header: true }))

  return {
    relayoutAndRedraw,
    recomputeViewWindows,
    onScroll,
    onResize,
    scrollFrame,
    yScrolled,
    yScrolledEnd,
    yOverflowed
  }
}
