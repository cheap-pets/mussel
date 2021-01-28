<template>
  <div>
    <div class="mu-table_row mu-table_head-row">
      <div
        v-for="col in columns"
        :key="col._uid"
        :style="{ width: col.width }"
        class="mu-table_cell">
        <div>
          {{ col.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      columns: Array
    }
  }
</script>
