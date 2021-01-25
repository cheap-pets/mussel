<template>
  <v-box v-if="columns" class="mu-table_part">
    <div class="mu-table_header">
      <table>
        <thead>
          <th v-for="col in columns" :key="col._uid">
            {{ col.label }}
          </th>
        </thead>
      </table>
    </div>
    <div class="mu-table_body" size="1">
      <table v-if="data.length">
        <colgroup>
          <col v-for="col in columns" :key="col._uid" align="center">
        </colgroup>
        <tbody>
          <tr v-for="(rec, idx) in data" :key="idx">
            <td v-for="col in columns" :key="col._uid">
              {{ rec[col.field] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </v-box>
</template>

<script>
  import VBox from '../layout/flex-v-box'

  export default {
    components: {
      VBox
    },
    props: {
      columns: Array,
      data: Array
    }
  }
</script>
