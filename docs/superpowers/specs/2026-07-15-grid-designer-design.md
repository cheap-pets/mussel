# Grid Layout Designer — Design Spec

Date: 2026-07-15
Location: `demo/src/grid-designer/` (new demo page)

## Goal

A visual designer inside the demo app where the user defines a grid layout by
adding, moving, and resizing rectangular cells on a grid canvas. The resulting
layout can be exported as JSON to the console.

## Constraints

- Mouse events + HTML5 `drag` events only. Do **not** use `src/events/touch`
  (the gesture recognizer system).
- Cells must never overlap. The invariant: **no overlap ever enters state.**
  - Move: an invalid drop is not applied (full snap-back to last position).
  - Resize: each step clamps to the last valid line (the dragged edge stops at
    the neighbor/boundary), so an invalid step is also never committed.
- Follow existing demo conventions: one folder under `demo/src/`, with
  `main.js` + `main-view.vue`; reuse `mu-grid-box` / `mu-grid-cell`, `mu-bar`,
  `mu-button`, `mu-input`, `theme-switch`.

## Data Model

A single reactive array of cells. Each cell uses **inclusive** index ranges,
matching `mu-grid-cell` props so the exported JSON feeds straight back into the
components.

```js
const columns = ref(12)          // initial 12 × 8
const rows = ref(8)
const cells = ref([
  { id, colStart, colEnd, rowStart, rowEnd }, // all 1-based, inclusive
  ...
])
```

`id` is an auto-incrementing integer used as `v-for` key and to exclude the
active cell from overlap checks.

### Exported JSON (on "获取布局")

Logged to the console via `console.log(JSON.stringify(result, null, 2))`:

```json
{
  "columns": 12,
  "rows": 8,
  "cells": [
    { "colStart": 1, "colEnd": 3, "rowStart": 1, "rowEnd": 2 }
  ]
}
```

(`id` is stripped from the export; cells are cell ranges, not CSS grid lines.)

## UI Layout

Full-height column. Top toolbar is a `mu-bar`; below it is the canvas.

```
┌──────────────────────────────────────────────────────────────┐
│ mu-bar                                                       │
│  Grid Designer                       [cols][rows] [+][↻][⤓] │
│   <theme-switch />                                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   mu-grid-box  (grid canvas, cell-line background)           │
│   ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐                     │
│   │  │██│██│  │  │  │  │  │  │  │  │  │                     │
│   ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                     │
│   │  │██│██│  │  │  │  │  │  │  │  │  │                     │
│   ├──┼──┴──┴──┼──┼──┼──┼──┼──┼──┼──┼──┤                     │
│   │  │  ▢ ╳   │  │  │  │  │  │  │  │  │   (× = delete btn)   │
│   └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Toolbar controls

| Control | Element | Behavior |
|---|---|---|
| Columns | `mu-input type="number"` (min 1) | `v-model="columns"`. On change → `cells.value = []`. |
| Rows | `mu-input type="number"` (min 1) | `v-model="rows"`. On change → `cells.value = []`. |
| 添加单元格 | `mu-button primary` | Append a 1×1 cell at the first free slot (row-major scan). No-op + toast/log if the grid is full. |
| 重置 | `mu-button` | `cells.value = []`. |
| 获取布局 | `mu-button secondary` | `console.log(JSON.stringify({ columns, rows, cells: stripped }))`. |
| theme-switch | `<theme-switch />` | Existing dark-mode toggle. |

The columns/rows watchers use a flag to distinguish *user edits* from program
updates, so internal re-renders don't wipe cells. (Simplest correct approach:
clear in an `@input`/`@change` handler rather than a deep watch.)

## Grid Canvas

```html
<mu-grid-box
  ref="gridEl"
  class="designer-canvas"
  :columns="columns"
  :rows="rows"
>
  <mu-grid-cell
    v-for="cell in cells"
    :key="cell.id"
    :col-start="cell.colStart"
    :col-end="cell.colEnd"
    :row-start="cell.rowStart"
    :row-end="cell.rowEnd"
    :end-offset="1"
    ...
  />
</mu-grid-box>
```

- A CSS background on the canvas draws faint vertical + horizontal guide lines
  matching the grid, so cell boundaries are visible even in empty regions.
- Canvas has a fixed pixel size (e.g. responsive width, height derived from a
  fixed cell aspect) so geometry math is stable.

## Cell Rendering & Interactions

Each cell is a `mu-grid-cell` whose content is a positioned wrapper carrying:
- the cell index/label,
- a delete `×` button (top-right),
- 8 resize handles (n, s, e, w, ne, nw, se, sw).

### Move (HTML5 drag)

- Cell body is `draggable="true"`.
- `dragstart`: record `draggingId` + the offset (pointer cell − cell origin).
- `drag` (fires continuously): compute the snapped target `{col,row}` from the
  pointer position; build the proposed rectangle (same span as current).
- `dragend`: validate the proposed rectangle; **commit only if valid**, else do
  nothing (the cell reverts to its unchanged reactive position = snap back).

### Resize (mouse events)

- Each handle has `@mousedown` that records `resizingId` + which edge(s) are
  being dragged + the start pointer + the original rect.
- A single pair of `window` listeners (`mousemove`/`mouseup`) installed while a
  resize is active:
  - `mousemove`: convert pointer → cell col/row, recompute only the dragged
    edge(s) of the rect, clamp span ≥ 1, validate (in-bounds + no overlap with
    others); update the cell's rect live **only while still valid** — if a step
    would overlap or go out of bounds, stop at the last valid line.
  - `mouseup`: finalize; remove the window listeners.

> Both move and resize use the same validation gate. For move we fully
> snap-back on invalid; for resize we clamp-to-last-valid per move step because
> that produces usable handle behavior. Both never let an overlap into state.

### Remove cell

The `×` button filters the cell out of `cells`.

## Geometry Helpers (pure functions in the component)

```js
// pointer → 1-based cell indices, clamped to grid
function pointerToCell(event, gridEl) {
  const r = gridEl.getBoundingClientRect()
  const cw = r.width / columns.value
  const ch = r.height / rows.value
  const col = Math.floor((event.clientX - r.left) / cw) + 1
  const row = Math.floor((event.clientY - r.top) / ch) + 1
  return {
    col: Math.max(1, Math.min(columns.value, col)),
    row: Math.max(1, Math.min(rows.value, row))
  }
}

// inclusive AABB overlap test on cell-index ranges
function rectsOverlap(a, b) {
  return !(
    a.colEnd < b.colStart || b.colEnd < a.colStart ||
    a.rowEnd < b.rowStart || b.rowEnd < a.rowStart
  )
}

// valid = fully in-bounds AND no overlap with any sibling
function isValid(rect, cells, excludeId) {
  if (rect.colStart < 1 || rect.colEnd > columns.value) return false
  if (rect.rowStart < 1 || rect.rowEnd > rows.value) return false
  if (rect.colStart > rect.colEnd || rect.rowStart > rect.rowEnd) return false
  return cells.value.every(c => c.id === excludeId || !rectsOverlap(rect, c))
}
```

## First-free-slot placement

```js
function firstFreeSlot() {
  for (let row = 1; row <= rows.value; row++)
    for (let col = 1; col <= columns.value; col++) {
      const rect = { colStart: col, colEnd: col, rowStart: row, rowEnd: row }
      if (cells.value.every(c => !rectsOverlap(rect, c))) return rect
    }
  return null
}
```

## Error Handling

- Invalid moves/resizes never mutate state (validation gate).
- `mu-input type="number"` values are clamped to `≥ 1` in the change handler.
- "添加单元格" when the grid is full is a no-op (optionally a `console.log`).
- No external services, no async, no persistence.

## Files

| File | Purpose |
|---|---|
| `demo/src/grid-designer/main.js` | Vite entry; `createVueApp(MainView)`. |
| `demo/src/grid-designer/main-view.vue` | The designer (template + `<script setup>` + scoped `<style>`). Single self-contained file. |
| `demo/src/index.html` | Add a `grid-designer` tile to the launchpad. |

No `src/` library changes — this is a demo-only feature.

## Out of Scope (YAGNI)

- Persistence / save to localStorage.
- Cell content editing, types, or templates.
- Undo/redo.
- Touch / pointer events (mouse + drag only).
- Snapping to free regions, auto-packing, collision pushing.
- Multi-select.
