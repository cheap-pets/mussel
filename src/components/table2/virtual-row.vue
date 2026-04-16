<template>
  <div class="mu-big-table__row" :class="rowClass">
    <div
      v-for="cell in cells"
      :key="cell.col._key"
      class="mu-big-table__cell"
      :class="cell.class"
      :style="[cell.colStyle, cell.cellStyle]"
      @mouseenter="onCellEnter($event.target, cell)"
      @mouseleave="removeTitle($event.target)"
      @click="onCellClick(record, cell.col._raw, recordIndex)">
      <template v-if="cell.items">
        <component
          :is="item.is"
          v-for="(item, idx) in cell.items"
          :key="idx"
          v-bind="item.attrs"
          v-on="item.events"
          @mouseenter="setTitle($event.target, item.title)"
          @mouseleave="removeTitle($event.target)">
          {{ item.text }}
        </component>
      </template>
      <template v-else>
        {{ cell.text ?? cell.col.placeholder }}
      </template>
    </div>
  </div>
</template>

<script setup>
  import { computed, inject } from 'vue'

  const props = defineProps({
    columns: Array,
    record: Object,
    recordIndex: Number,
    recordNumber: Number,
    globalIndex: Number,
    selected: Boolean,
    striped: Boolean
  })

  const { setHoverIndicator, onCellClick, emit } = inject('big-table')

  const rowClass = computed(() => ({
    'mu-big-table__row--striped': props.striped && props.globalIndex % 2 === 1,
    'mu-big-table__row--selected': props.selected
  }))

  const cells = computed(() => {
    const { record, recordNumber, columns } = props

    return columns.map(col => {
      const text = col._text(record)
      const title = col._title(record)

      const cell = {
        col,
        colStyle: col._colStyle,
        class: [col._ctrlClass, col._class(record)],
        cellStyle: [col._ctrlStyle, col._style(record)]
      }

      if (text == null) {
        const value =
          col._value(record) ?? (col.field ? record[col.field] : undefined)

        const { class: rClass, rStyle, ...params } =
          col._render({ record, recordNumber, value, emit }) || {}

        cell.class.push(rClass)
        cell.cellStyle.push(rStyle)

        Object.assign(cell, params)
      } else {
        cell.text = text
      }

      cell.title ??= title === true ? cell.text : title

      return cell
    })
  })

  function setTitle (target, title) {
    if (title) target.setAttribute('title', title)
  }

  function removeTitle (target) {
    target.removeAttribute('title')
  }

  function onCellEnter (target, cell) {
    setHoverIndicator(target, cell.col)
    setTitle(target, cell.title)
  }
</script>
