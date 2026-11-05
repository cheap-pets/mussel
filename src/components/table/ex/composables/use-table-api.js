/**
 * 暴露方法 composable（C1 壳拆分自 table-ex.vue；02-design.md A1）：
 * scrollToRecord / getLayoutInfo / getThemeSnapshot / getCellRect
 * + 选中变化 watch（选中横带脏区 + 合并覆盖行 dev 警告）。
 */
import { watch } from 'vue'

import { warn } from '@/utils/warn'
import { cellRectAt } from '../table-paint/painter'

/**
 * @param {Object} ctx host 袋（读取 props, scrollEl, canvasEl, displayRows,
 *   treeOptions, layout, getPainter, rowGeometry, getThemeWatcher, spans,
 *   invalidateRow, selectedKey, selectedCell, genRecordKey, getLastRelayout）
 * @returns {{ scrollToRecord, getLayoutInfo, getThemeSnapshot, getCellRect }}
 */
export function useTableApi (ctx) {
  const { props } = ctx

  // —— 行定位辅助（选中横带 / scrollToRecord；树模式下在平铺行数组内查找） ——

  function keyNameOf () {
    return props.tree ? ctx.treeOptions.value.key : props.keyField
  }

  function findRowByKey (key) {
    if (key == null) return -1

    const rows = ctx.displayRows.value ?? []
    const keyName = keyNameOf()

    if (keyName != null) {
      return rows.findIndex(rec => rec?.[keyName] === key)
    }

    return rows.findIndex(rec => ctx.genRecordKey(rec) === key)
  }

  // —— 暴露方法（A1；树展开操作见 use-tree-rows 解构） ——

  function scrollToRecord (keyOrIndex) {
    const rows = ctx.displayRows.value ?? []
    const keyName = keyNameOf()
    let row = -1

    // keyField 值优先，退化为行号
    if (keyName != null) {
      row = rows.findIndex(rec => rec?.[keyName] === keyOrIndex)
    }

    if (row < 0) {
      const index = Number(keyOrIndex)

      row = Number.isInteger(index) && index >= 0 && index < rows.length ? index : -1
    }

    const el = ctx.scrollEl.value
    const cur = ctx.layout.value

    if (row < 0 || !el || !cur) return false

    // 不可见时置于视口顶部：行顶对准表头下缘（变高模式 top 经 rowGeometry.topAt）
    const top = Math.min(
      Math.max(cur.rowGeometry.topAt(row), 0),
      Math.max(0, cur.contentHeight - cur.stickyHeight)
    )

    el.scrollTo({ top, behavior: 'instant' })

    return true
  }

  function getLayoutInfo () {
    const cur = ctx.layout.value
    const painter = ctx.getPainter()
    const lastRelayout = ctx.getLastRelayout()

    if (!cur) return null

    return {
      colWidths: cur.colWidths.slice(),
      contentWidth: cur.contentWidth,
      contentHeight: cur.contentHeight,
      rowHeight: cur.rowHeight,
      headHeight: cur.headHeight,
      // 单元格选中内省（20261105-table-ex-cell-select 验证锚点，getCellRect 同
      // 先例；additive 字段，消费方按需读取）
      selectedCell: ctx.selectedCell.value ? { ...ctx.selectedCell.value } : null,
      viewRows: { ...cur.viewRows },
      rowGeometryMode: ctx.rowGeometry.mode,
      lastPaint: painter?.lastPaint ? { ...painter.lastPaint } : null,
      lastRelayout: lastRelayout ? { ...lastRelayout } : null
    }
  }

  /** 主题快照（G0 偏离 4 契约）：直接返回 watcher.snapshot（getter，随 refresh 更新） */
  function getThemeSnapshot () {
    return ctx.getThemeWatcher()?.snapshot ?? null
  }

  /** 坐标辅助（decisions「[I1 前]②」）：单元格视口矩形 + 页面坐标，供 playwright
      page.mouse 坐标级交互换算；未挂载返回 null */
  function getCellRect (row, col) {
    const canvas = ctx.canvasEl.value
    const cur = ctx.layout.value

    if (!canvas || !cur) return null

    const base = canvas.getBoundingClientRect()
    const cell = cellRectAt(cur, row, col)

    return {
      left: base.left + cell.x,
      top: base.top + cell.y,
      width: cell.width,
      height: cell.height,
      x: cell.x,
      y: cell.y
    }
  }

  // 选中变化（selectedRecordKey/selectedRecord/keyField 经 selectedKey 汇聚）→
  // 旧/新选中行两条横带（合并区域由 painter 脏区扩展到区域包围盒，覆盖行底色随动）；
  // 覆盖行 key 被受控选中 → 区域无选中反馈，dev 警告一次（§5.8/§7）
  watch(ctx.selectedKey, (newValue, oldValue) => {
    for (const key of new Set([oldValue, newValue])) {
      const row = findRowByKey(key)

      if (row >= 0) ctx.invalidateRow(row)
    }

    if (newValue != null && ctx.spans.value) {
      const row = findRowByKey(newValue)

      // covered 顶层键存在即该行在至少一列被区域覆盖（区域内无选中反馈）
      if (row >= 0 && ctx.spans.value.covered.has(row)) {
        warn({
          component: 'table-ex',
          message: `选中 key "${String(newValue)}" 落在合并区域的覆盖行上，该区域无选中反馈（选中仅可由锚行表达）`
        })
      }
    }
  })

  return {
    scrollToRecord,
    getLayoutInfo,
    getThemeSnapshot,
    getCellRect
  }
}
