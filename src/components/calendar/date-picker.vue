<template>
  <div class="mu-date-picker" @sizechange="onResize">
    <div class="mu-date-grid mu-date-picker__head">
      <span v-for="w in daysOfWeek" :key="w">{{ w }}</span>
    </div>
    <div class="mu-date-grid mu-date-picker__body">
      <div
        v-for="(cell, i) in cells" :key="i"
        class="mu-date-cell"
        :muted="cell.prev || cell.next"
        :present="cell.present"
        :selected="cell.selected || null"
        @click="onCellClick(cell)">
        {{ cell.date }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  import { dateEquals, toDateObject } from '@/utils/date'
  import { useDateGrid } from './use-date-grid'

  defineOptions({ name: 'MusselDatePicker' })

  const emit = defineEmits(['dateCellClick'])
  const model = defineModel({ type: Date, default: null })
  const props = defineProps({ year: Number, month: Number, weekStartsOn: Number })

  const { daysOfWeek, data, onResize } = useDateGrid(model, props)

  // 单选：在网格基础上为与 model 匹配的单元格追加 selected 标记。
  const cells = computed(() => {
    const selected = toDateObject(model.value)
    return data.value.map(cell =>
      cell.year === selected?.year &&
      cell.month === selected?.month &&
      cell.date === selected?.date
        ? { ...cell, selected: true }
        : cell
    )
  })

  function onCellClick (cell) {
    if (!dateEquals(cell, model.value)) {
      model.value = new Date(cell.year, cell.month, cell.date)
    }

    emit('dateCellClick', cell)
  }
</script>

<style>
  .mu-date-picker {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .mu-date-picker--masked {
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgb(0 0 0 / 10%);
    }
  }

  .mu-date-picker__head,
  .mu-date-picker__body {
    grid-template-columns: repeat(7, 1fr);
  }

  .mu-date-picker__head {
    place-items: center;
    height: 32px;
    font-weight: 600;
    color: var(--mu-text-color-soft);
  }

  .mu-date-picker__body {
    flex: 1;
  }
</style>
