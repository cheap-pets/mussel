<template>
  <mu-popup-editor-wrapper class="mu-date-range-editor">
    <mu-h-box class="mu-absolute-fit">
      <calendar
        size="1"
        :value="start"
        :language="language"
        :select-mode="selectMode"
        :marked-dates="markedDates"
        :range-start="rangeStart"
        :range-end="rangeEnd"
        @change="onSelectStart" />
      <div class="mu-date-range-editor_to">
        ~
      </div>
      <calendar
        size="1"
        :value="end"
        :language="language"
        :select-mode="selectMode"
        :marked-dates="markedDates"
        :range-start="start || rangeStart"
        :range-end="rangeEnd"
        @change="onSelectEnd" />
    </mu-h-box>
  </mu-popup-editor-wrapper>
</template>

<script>
  import isDate from 'lodash.isdate'
  import isString from 'lodash.isstring'

  import BasePopupEditor from './base-popup-editor'
  import Calendar from '../calendar/calendar.vue'

  import formatDate from '@utils/format-date'

  export default {
    name: 'MusselDateRangeEditor',
    components: {
      Calendar
    },
    extends: BasePopupEditor,
    props: {
      popupWidth: {
        type: String,
        default: '500px'
      },
      popupHeight: {
        type: String,
        default: '225px'
      },
      value: Object,
      format: String,
      rangeStart: Date,
      rangeEnd: Date,
      language: String,
      selectMode: String,
      markedDates: Array,
      endDate: [String, Date],
      startDate: [String, Date]
    },
    computed: {
      dateFormat () {
        const mode = this.selectMode
        return this.format || (
          mode === 'year'
            ? 'yyyy'
            : (
              mode === 'month'
                ? 'yyyy-MM'
                : (this.start && this.end ? 'yy-MM-dd' : 'yyyy-MM-dd')
            )
        )
      },
      start () {
        return this.parseDate(this.startDate || this.value?.startDate)
      },
      end () {
        return this.parseDate(this.endDate || this.value?.endDate)
      }
    },
    watch: {
      value: {
        handler (value = {}) {
          this.setValue(value.startDate, value.endDate)
        },
        immediate: true
      },
      startDate: {
        handler (value) {
          this.setValue(value, this.endDate)
        },
        immediate: true
      },
      endDate: {
        handler (value) {
          this.setValue(this.startDate, value)
        },
        immediate: true
      },
      rangeStart (value) {
        this.calendarParams.rangeStart = value
      },
      rangeEnd (value) {
        this.calendarParams.rangeEnd = value
      }
    },
    methods: {
      parseDate (value) {
        if (value) {
          try {
            value = isDate(value)
              ? value
              : (isString(value) ? new Date(Date.parse(value)) : null)
          } catch (e) {}
        }
        return value
      },
      setValue (startDate, endDate) {
        startDate = this.parseDate(startDate)
        endDate = this.parseDate(endDate)
        this.params.value = (startDate || endDate)
          ? (
            (startDate ? formatDate(startDate, this.dateFormat) : '') +
            ' ~ ' +
            (endDate ? formatDate(endDate, this.dateFormat) : '')
          )
          : ''
      },
      onSelectStart (value) {
        this.focus()
        if (value > this.end) {
          this.setValue(value, null)
          this.$emit('update:endDate', null)
          this.$emit('change', {
            startDate: value,
            endDate: null
          })
        } else {
          this.setValue(value, null)
          this.$emit('update:startDate', value)
          this.$emit('change', {
            startDate: value,
            endDate: this.end
          })
        }
      },
      onSelectEnd (value) {
        this.setValue(this.start, value)
        this.hidePopup()
        this.focus()
        this.$emit('update:endDate', value)
        this.$emit('change', {
          startDate: this.start,
          endDate: value
        })
      },
      onClearClick () {
        this.clear()
        this.setValue()
        this.$emit('update:startDate', null)
        this.$emit('update:endDate', null)
        this.$emit('change', null)
      }
    }
  }
</script>
