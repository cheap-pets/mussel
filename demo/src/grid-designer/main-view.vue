<template>
  <div class="grid-designer flex flex-col fixed" style="inset: 0;">
    <!-- 工具栏 -->
    <mu-bar class="designer-toolbar">
      <h2>Grid Designer</h2>
      <span class="field">
        <label>列</label>
        <mu-input
          :model-value="columns"
          type="number"
          size="small"
          class="num-input"
          @update:model-value="onDimensionChange('columns', $event)" />
      </span>
      <span class="field">
        <label>行</label>
        <mu-input
          :model-value="rows"
          type="number"
          size="small"
          class="num-input"
          @update:model-value="onDimensionChange('rows', $event)" />
      </span>
      <mu-button color="primary" caption="添加单元格" @click="addCell" />
      <mu-button caption="重置" @click="reset" />
      <mu-button color="secondary" caption="获取布局" @click="exportLayout" />
      <span class="toolbar-tail">
        <theme-switch />
      </span>
    </mu-bar>

    <!-- 画布区 -->
    <div class="designer-canvas-wrap flex-1">
      <div
        ref="gridEl"
        class="designer-grid"
        :style="gridStyle">
        <!-- 网格引导线（独立层，避免与背景简写冲突） -->
        <div class="grid-lines" aria-hidden="true" />
        <mu-grid-cell
          v-for="cell in cells"
          :key="cell.id"
          :col-start="cell.colStart"
          :col-end="cell.colEnd"
          :row-start="cell.rowStart"
          :row-end="cell.rowEnd"
          class="designer-cell"
          :class="{ 'is-dragging': draggingId === cell.id, 'is-resizing': resizingId === cell.id }">
          <div
            class="cell-body"
            @mousedown.stop.prevent="onMoveStart($event, cell)">
            <span class="cell-label">{{ cell.id }}</span>
            <a class="cell-remove" title="删除" @mousedown.stop @click="removeCell(cell.id)">×</a>
          </div>
          <!-- 8 个调整大小手柄 -->
          <span
            v-for="h in HANDLES"
            :key="h"
            class="resize-handle"
            :class="'handle-' + h"
            @mousedown.stop.prevent="onResizeStart($event, cell, h)" />
        </mu-grid-cell>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onUnmounted } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  // ── 维度 ──────────────────────────────────────────────
  const columns = ref(12)
  const rows = ref(8)

  // 修改列/行数会清空已添加的单元格（按需求约定）
  function onDimensionChange (which, value) {
    const n = clampInt(value, 1, 60)
    if (which === 'columns') columns.value = n
    else rows.value = n
    cells.value = []
  }

  function clampInt (value, min, max) {
    const n = Math.round(Number(value))
    if (isNaN(n)) return min
    return Math.max(min, Math.min(max, n))
  }

  // ── 单元格数据 ─────────────────────────────────────────
  const cells = ref([])
  let nextId = 1

  function addCell () {
    const slot = firstFreeSlot()
    if (!slot) {
      console.log('网格已满，无法添加新单元格')
      return
    }
    cells.value.push({ id: nextId++, ...slot })
  }

  function reset () {
    cells.value = []
  }

  function removeCell (id) {
    cells.value = cells.value.filter(c => c.id !== id)
  }

  function exportLayout () {
    const result = {
      columns: columns.value,
      rows: rows.value,
      cells: cells.value.map(({ id, ...rest }) => rest)
    }
    console.log(JSON.stringify(result, null, 2))
  }

  // ── 几何工具：纯函数 ──────────────────────────────────
  // 指针坐标 → 1-based 网格单元索引（钳制到网格范围）
  function pointerToCell (clientX, clientY) {
    const el = gridEl.value
    const r = el.getBoundingClientRect()
    const cw = r.width / columns.value
    const ch = r.height / rows.value
    const col = Math.floor((clientX - r.left) / cw) + 1
    const row = Math.floor((clientY - r.top) / ch) + 1
    return {
      col: Math.max(1, Math.min(columns.value, col)),
      row: Math.max(1, Math.min(rows.value, row))
    }
  }

  // 包含式范围相交测试（基于单元格索引）
  function rectsOverlap (a, b) {
    return !(
      a.colEnd < b.colStart || b.colEnd < a.colStart ||
      a.rowEnd < b.rowStart || b.rowEnd < a.rowStart
    )
  }

  // 矩形是否合法：在边界内 + 跨度≥1 + 与其它单元格不重叠
  function isValid (rect, excludeId) {
    if (!rect) return false
    if (rect.colStart < 1 || rect.colEnd > columns.value) return false
    if (rect.rowStart < 1 || rect.rowEnd > rows.value) return false
    if (rect.colStart > rect.colEnd || rect.rowStart > rect.rowEnd) return false
    return cells.value.every(c => c.id === excludeId || !rectsOverlap(rect, c))
  }

  // 寻找首个空闲 1×1 位置（行优先扫描）
  function firstFreeSlot () {
    for (let row = 1; row <= rows.value; row++) {
      for (let col = 1; col <= columns.value; col++) {
        const rect = { colStart: col, colEnd: col, rowStart: row, rowEnd: row }
        if (cells.value.every(c => !rectsOverlap(rect, c))) return rect
      }
    }
    return null
  }

  // ── 画布样式 ───────────────────────────────────────────
  const gridStyle = computed(() => ({
    gridColumnGap: 0,
    gridRowGap: 0,
    '--cols': columns.value,
    '--rows': rows.value,
    gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
    gridTemplateRows: `repeat(${rows.value}, 1fr)`
  }))

  const gridEl = ref(null)

  // ── 拖拽移动（mouse 事件，无浏览器默认拖拽影像）────────
  const draggingId = ref(null)
  let dragCtx = null // { id, spanCol, spanRow, dCol, dRow }

  function onMoveStart (e, cell) {
    draggingId.value = cell.id
    const p = pointerToCell(e.clientX, e.clientY)
    dragCtx = {
      id: cell.id,
      spanCol: cell.colEnd - cell.colStart,
      spanRow: cell.rowEnd - cell.rowStart,
      dCol: p.col - cell.colStart,
      dRow: p.row - cell.rowStart
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onMoveEnd)
  }

  function onMove (e) {
    const ctx = dragCtx
    if (!ctx) return
    const cell = cells.value.find(c => c.id === ctx.id)
    if (!cell) return

    const p = pointerToCell(e.clientX, e.clientY)
    const colStart = clampInt(p.col - ctx.dCol, 1, columns.value - ctx.spanCol)
    const rowStart = clampInt(p.row - ctx.dRow, 1, rows.value - ctx.spanRow)

    const proposed = {
      colStart,
      colEnd: colStart + ctx.spanCol,
      rowStart,
      rowEnd: rowStart + ctx.spanRow
    }

    // 仅在合法时更新位置（snap-at-valid，非法则停在上一个合法位置）
    if (isValid(proposed, ctx.id)) Object.assign(cell, proposed)
  }

  function onMoveEnd () {
    draggingId.value = null
    dragCtx = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onMoveEnd)
  }

  // ── 调整大小（鼠标事件）──────────────────────────────
  const HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
  const resizingId = ref(null)
  let resizeCtx = null

  function onResizeStart (e, cell, handle) {
    resizingId.value = cell.id
    resizeCtx = {
      id: cell.id,
      handle,
      start: { ...cell },
      edges: {
        n: handle.includes('n'),
        s: handle.includes('s'),
        e: handle.includes('e'),
        w: handle.includes('w')
      }
    }
    window.addEventListener('mousemove', onResizeMove)
    window.addEventListener('mouseup', onResizeEnd)
  }

  // eslint-disable-next-line complexity
  function onResizeMove (e) {
    const ctx = resizeCtx
    if (!ctx) return

    const cell = cells.value.find(c => c.id === ctx.id)
    if (!cell) return

    const p = pointerToCell(e.clientX, e.clientY)
    // 从原始矩形拷贝，仅修改被拖动的边
    const next = { ...ctx.start }

    if (ctx.edges.w) next.colStart = Math.min(p.col, ctx.start.colEnd)
    if (ctx.edges.e) next.colEnd = Math.max(p.col, ctx.start.colStart)
    if (ctx.edges.n) next.rowStart = Math.min(p.row, ctx.start.rowEnd)
    if (ctx.edges.s) next.rowEnd = Math.max(p.row, ctx.start.rowStart)

    // 保证跨度至少为 1（inclusive：start === end 即为 1 格）
    if (next.colStart > next.colEnd) {
      if (ctx.edges.w) next.colStart = next.colEnd
      else next.colEnd = next.colStart
    }
    if (next.rowStart > next.rowEnd) {
      if (ctx.edges.n) next.rowStart = next.rowEnd
      else next.rowEnd = next.rowStart
    }

    // 仅在合法时提交该步；非法则停留在上一合法状态（snap-at-edge）
    if (isValid(next, ctx.id)) {
      Object.assign(cell, next)
      ctx.start = next // 让后续步骤基于新的合法位置继续
    }
  }

  function onResizeEnd () {
    resizingId.value = null
    resizeCtx = null
    window.removeEventListener('mousemove', onResizeMove)
    window.removeEventListener('mouseup', onResizeEnd)
  }

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onMoveEnd)
    window.removeEventListener('mousemove', onResizeMove)
    window.removeEventListener('mouseup', onResizeEnd)
  })
</script>

<style scoped>
  .grid-designer {
    color: var(--mu-text-color-normal);
    background: var(--mu-background-color);
  }

  /* 工具栏 */
  .designer-toolbar {
    gap: 12px;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--mu-border-color-normal);
  }

  .designer-toolbar h2 {
    margin: 0;
    padding: 0;
    border: none;

    font-size: 1rem;
    font-weight: 600;
  }

  .designer-toolbar .field {
    display: inline-flex;
    gap: 6px;
    align-items: center;

    font-size: 0.85rem;
    color: var(--mu-text-color-light);
  }

  .num-input {
    width: 70px;
  }

  .toolbar-tail {
    margin-left: auto;
  }

  /* 画布 */
  .designer-canvas-wrap {
    overflow: auto;
    padding: 16px;
  }

  .designer-grid {
    position: relative;

    overflow: hidden;
    display: grid;

    width: 100%;
    height: 100%;
    min-height: 420px;
    border: 1px solid var(--mu-border-color-normal);

    background-color: var(--mu-bg-strong);
  }

  /* 网格引导线层：绝对定位覆盖整个画布，置于单元格之下 */
  .grid-lines {
    pointer-events: none;

    position: absolute;
    z-index: 0;
    inset: 0;

    background-image:
      linear-gradient(to right, var(--mu-border-color-normal) 1px, transparent 1px),
      linear-gradient(to bottom, var(--mu-border-color-normal) 1px, transparent 1px);
    background-position: 0 0;
    background-size:
      calc(100% / var(--cols, 12)) calc(100% / var(--rows, 8));
  }

  /* 单元格 */
  .designer-cell {
    position: relative;
    z-index: 1;
    padding: 2px;
  }

  .cell-body {
    cursor: move;
    user-select: none;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;
    min-height: 24px;
    border-radius: 4px;

    color: #fff;

    background: var(--mu-primary-color, #5b7fff);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  .designer-cell.is-dragging .cell-body {
    opacity: 0.5;
  }

  .designer-cell.is-resizing .cell-body {
    box-shadow: 0 0 0 2px rgba(91, 127, 255, 0.5);
  }

  .cell-label {
    pointer-events: none;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .cell-remove {
    cursor: pointer;

    position: absolute;
    top: 0;
    right: 2px;

    width: 16px;
    height: 16px;
    border-radius: 50%;

    font-size: 14px;
    line-height: 14px;
    color: rgba(255, 255, 255, 0.85);
    text-align: center;
  }

  .cell-remove:hover {
    color: #fff;
    background: rgba(0, 0, 0, 0.25);
  }

  /* 调整大小手柄 */
  .resize-handle {
    position: absolute;
    z-index: 2;
  }

  .handle-n, .handle-s {
    cursor: ns-resize;
    right: 4px;
    left: 4px;
    height: 6px;
  }
  .handle-n { top: -3px; }
  .handle-s { bottom: -3px; }

  .handle-e, .handle-w {
    cursor: ew-resize;
    top: 4px;
    bottom: 4px;
    width: 6px;
  }
  .handle-e { right: -3px; }
  .handle-w { left: -3px; }

  .handle-ne, .handle-nw, .handle-se, .handle-sw {
    width: 10px;
    height: 10px;
  }
  .handle-ne { cursor: nesw-resize; top: -5px; right: -5px; }
  .handle-nw { cursor: nwse-resize; top: -5px; left: -5px; }
  .handle-se { cursor: nwse-resize; right: -5px; bottom: -5px; }
  .handle-sw { cursor: nesw-resize; bottom: -5px; left: -5px; }
</style>
