<template>
  <mu-popup-editor-wrapper>
    <calendar
      class="mu-absolute-fit"
      v-bind="calendarParams"
      @change="onSelect" />
  </mu-popup-editor-wrapper>
</template>

<script>
  import BasePopupEditor from './base-popup-editor'
  import Calendar from '../calendar/calendar.vue'

  import { convertToDate, formatDate } from '@/utils/date'

  export default {
    name: 'MusselDateEditor',
    components: {
      Calendar
    },
    extends: BasePopupEditor,
    props: {
      popupWidth: {
        type: String,
        default: '245px'
      },
      popupHeight: {
        type: String,
        default: '225px'
      },
      icon: {
        type: String,
        default: 'calendar'
      },
      value: [String, Date],
      format: String,
      rangeStart: Date,
      rangeEnd: Date,
      language: String,
      selectMode: String,
      marked: Array,
      markedDates: Array
    },
    data () {
      const p = this
      return {
        calendarParams: {
          value: this.value,
          rangeStart: p.rangeStart,
          rangeEnd: p.rangeEnd,
          language: p.language,
          selectMode: p.selectMode,
          marked: p.marked,
          markedDates: p.markedDates
        }
      }
    },
    computed: {
      dateFormat () {
        const mode = this.selectMode
        return this.format || (
          mode === 'year'
            ? 'yyyy'
            : (mode === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd')
        )
      }
    },
    watch: {
      value: {
        handler (value) {
          this.calendarParams.value = value
          this.setValue(value)
        },
        immediate: true
      },
      rangeStart (value) {
        this.calendarParams.rangeStart = value
      },
      rangeEnd (value) {
        this.calendarParams.rangeEnd = value
      },
      marked (value) {
        this.calendarParams.marked = value
      },
      markedDates (value) {
        this.calendarParams.markedDates = value
      },
      selectMode (value) {
        this.calendarParams.selectMode = value
      }
    },
    methods: {
      setValue (value) {
        value = convertToDate(value)

        this.params.value = value
          ? formatDate(value, this.dateFormat)
          : ''
      },
      onSelect (value, year, month, date) {
        this.setValue(value)
        this.hidePopup()
        this.focus()
        this.$emit('change', value, year, month, date)
      }
    }
  }
</script>
