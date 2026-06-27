<template>
  <div class="fixed" style="inset: 0; background: #000;">
    <mu-grid-box
      class="p-1x" style="width: 480px; height: 270px; background-color: rgba(0, 47, 167, .5);"
      :columns="config.columns" :rows="config.rows">
      <mu-grid-cell
        v-for="(cell, idx) in config.cells" :key="cell" :col-start="cell.colStart" :col-end="cell.colEnd"
        :end-offset="1"
        :row-start="cell.rowStart" :row-end="cell.rowEnd" style="background-color: rgba(0, 47, 167, 1);" class="m-1x">
        {{ idx + 1 }}
      </mu-grid-cell>
    </mu-grid-box>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  const config = ref({
    layout: 'grid',
    rows: 5,
    columns: 7,
    cells: [
      {
        colStart: 1,
        colEnd: 2,
        rowStart: 1,
        rowEnd: 2
      },
      {
        colStart: 3,
        colEnd: 7,
        rowStart: 1,
        rowEnd: 2
      },
      {
        colStart: 1,
        colEnd: 2,
        rowStart: 3,
        rowEnd: 5
      },
      {
        colStart: 3,
        colEnd: 5,
        rowStart: 3,
        rowEnd: 5
      },
      {
        colStart: 6,
        colEnd: 7,
        rowStart: 3,
        rowEnd: 5
      }
    ]
  })
</script>
