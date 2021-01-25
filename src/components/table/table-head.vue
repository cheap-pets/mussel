<template>
  <div class="mu-table_head">
    <div class="mu-table_row">
      <div v-for="col in columns" :key="col._uid" class="mu-table_cell">
        {{ col.label }}
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      tableFixed: String,
      columns: Array
    }
  }
</script>
