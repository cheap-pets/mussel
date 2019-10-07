<template>
  <div class="mu-calendar">
    <div class="mu-calendar-header">
      <div class="mu-calendar-title" @click="onTitleClick">
        {{ title }}
      </div>
      <icon-button
        button-type="primary"
        button-style="text"
        icon="key-left"
        @click="goPrev" />
      <icon-button
        button-type="primary"
        button-style="text"
        icon="calendar"
        @click="goNow" />
      <icon-button
        button-type="primary"
        button-style="text"
        icon="key-right"
        @click="goNext" />
    </div>
    <template v-if="tab === 'date'">
      <div class="mu-week-header">
        <div v-for="name in weekDays" :key="name" class="mu-week-cell">
          {{ name }}
        </div>
      </div>
      <div class="mu-calendar-grid">
        <div
          v-for="(row, rowIdx) in dateRows"
          :key="rowIdx"
          class="mu-calendar-row"
          size="auto">
          <div
            v-for="(cell, cellIdx) in row"
            :key="cellIdx"
            class="mu-calendar-cell"
            :today="cell.today"
            :active="cell.active"
            :marked="cell.marked"
            :adjacent="cell.adjacent"
            :out-of-range="cell.outOfRange"
            @click="onDateCellClick(cell)">
            {{ cell.date }}
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="mu-calendar-grid">
        <div
          v-for="(row, rowIdx) in yearRows"
          :key="rowIdx"
          class="mu-calendar-row">
          <div
            v-for="(cell, cellIdx) in row"
            :key="cellIdx"
            class="mu-calendar-cell"
            :class="{ active: cell.year === naviYear }"
            :active="cell.year === naviYear"
            :adjacent="cell.adjacent"
            :this-year="cell.year === thisYear"
            :out-of-range="cell.outOfRange"
            @click="onYearCellClick(cell)">
            {{ cell.year }}
          </div>
        </div>
      </div>
      <div v-if="selectMode !== 'year'" class="mu-calendar-grid">
        <div
          v-for="(row, rowIdx) in monthRows"
          :key="rowIdx"
          class="mu-calendar-row">
          <div
            v-for="(cell, cellIdx) in row"
            :key="cellIdx" class="mu-calendar-cell"
            :active="cell.month === naviMonth"
            @click="onMonthCellClick(cell)">
            {{ cell.monthName }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
  import './calendar.pcss'

  import isDate from 'lodash.isdate'
  import isString from 'lodash.isstring'

  import IconButton from '../button/icon-button'

  function getFirstDay ({ year, month }) {
    return (new Date(year, month, 1)).getDay()
  }

  function getMaxDays ({ year, month }) {
    return month === 1 &&
      ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)
      ? 29
      : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
  }

  function getSiblingMonth ({ year, month, step }) {
    month += step
    if (month < 0) {
      month = 11
      year--
    } else if (month > 11) {
      month = 0
      year++
    }
    return { year, month }
  }

  function parseDate (v) {
    v = v || new Date()
    return {
      year: v.getFullYear(),
      month: v.getMonth(),
      date: v.getDate()
    }
  }

  function isSameDate (a, b) {
    return a.year === b.year &&
      a.month === b.month &&
      (!a.date || !b.date || a.date === b.date)
  }

  export default {
    components: {
      IconButton
    },
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      value: Date,
      rangeStart: Date,
      rangeEnd: Date,
      language: {
        type: String,
        validator (v) {
          return ['zh', 'en'].indexOf(v) !== -1
        }
      },
      selectMode: {
        type: String,
        default: 'date',
        validator (v) {
          return ['year', 'month', 'date'].indexOf(v) !== -1
        }
      },
      markedDates: {
        type: Array,
        default () {
          return []
        }
      }
    },
    data () {
      const { year, month, date } = parseDate()
      return {
        year,
        month,
        date,
        thisYear: year,
        thisMonth: month,
        naviStartYear: null,
        naviYear: null,
        naviMonth: null,
        naviDate: null,
        naviDateYear: year,
        naviDateMonth: month,
        monthlyMarkedDates: [],
        dateRows: [],
        yearRows: [],
        tab: 'date'
      }
    },
    computed: {
      isZh () {
        return (
          this.language ||
          navigator.language ||
          navigator.userLanguage
        ).indexOf('zh') === 0
      },
      months () {
        return this.isZh
          ? [
            '1', '2', '3', '4', '5', '6',
            '7', '8', '9', '10', '11', '12'
          ]
          : [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
          ]
      },
      weekDays () {
        return this.isZh
          ? ['日', '一', '二', '三', '四', '五', '六']
          : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
      },
      yearLabel () {
        return this.isZh ? '年' : ''
      },
      monthLabel () {
        return this.isZh ? '月' : ''
      },
      title () {
        const {
          months,
          naviDateYear: year,
          naviDateMonth: month,
          yearLabel,
          monthLabel,
          naviStartYear
        } = this

        return this.tab === 'date'
          ? `${year} ${yearLabel} ${months[month]} ${monthLabel}`
          : `${naviStartYear} ~ ${naviStartYear + 9}`
      },
      monthRows () {
        const rows = []
        let n = 0
        for (let i = 0; i < 3; i++) {
          const row = []
          for (let j = 0; j < 4; j++) {
            row.push({
              month: n,
              monthName: this.months[n] + this.monthLabel
            })
            n++
          }
          rows.push(row)
        }
        return rows
      }
    },
    watch: {
      value (v) {
        this.resetDate(v)
      },
      rangeStart () {
        this.updateDateCells()
      },
      rangeEnd () {
        this.updateDateCells()
      },
      markedDates () {
        this.updateDateCells()
      }
    },
    mounted () {
      this.setTab(
        this.selectMode === 'year' || this.selectMode === 'month'
          ? 'year'
          : 'date'
      )
      this.resetDate(this.value)
    },
    methods: {
      setTab (v) {
        this.tab = ['year', 'month'].indexOf(v) >= 0 ? 'year' : 'date'
      },
      setDateCellStatus (cell) {
        const date = new Date(cell.year, cell.month, cell.date)
        const str = `${cell.year}-${cell.month + 1}-${cell.date}`
        const { rangeStart: start, rangeEnd: end } = this
        if (isSameDate(cell, this)) cell.active = true
        if (isSameDate(cell, parseDate())) cell.today = true
        if (this.monthlyMarkedDates.indexOf(str) >= 0) cell.marked = true
        if ((start && date < start) || (end && date > end)) {
          cell.outOfRange = true
        }
      },
      updateDateCells () {
        this.filterMarkedDates()
        const year = this.naviDateYear
        const month = this.naviDateMonth
        const firstDay = getFirstDay({ year, month })
        const maxDays = getMaxDays({ year, month })
        const prev = getSiblingMonth({ year, month, step: -1 })
        const prevMaxDays = getMaxDays(prev)
        const next = getSiblingMonth({ year, month, step: 1 })
        const rows = []
        let n = 1
        for (let i = 0; i < 7; i++) {
          const row = []
          let cell
          for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
              cell = {
                year: prev.year,
                month: prev.month,
                date: prevMaxDays - firstDay + j + 1,
                adjacent: true
              }
            } else if (i > 0 && n > maxDays) {
              cell = {
                year: next.year,
                month: next.month,
                date: n - maxDays,
                adjacent: true
              }
              n++
            } else {
              cell = {
                year: year,
                month: month,
                date: n
              }
              n++
            }
            this.setDateCellStatus(cell)
            row.push(cell)
          }
          rows.push(row)
        }
        this.dateRows = rows
        this.$emit('navigate', { year, month })
      },
      filterMarkedDates () {
        const arr = []
        const current = { year: this.naviDateYear, month: this.naviDateMonth }
        this.markedDates.forEach(date => {
          const p = parseDate(date)
          if (isSameDate(p, current)) {
            arr.push(p.year + '-' + (p.month + 1) + '-' + p.date)
          }
        })
        this.monthlyMarkedDates = arr
      },
      updateYearCells () {
        const rows = []
        let n = this.naviStartYear - 1
        for (let i = 0; i < 3; i++) {
          const row = []
          for (let j = 0; j < 4; j++) {
            const cell = { year: n }
            if (n < this.naviStartYear || n > this.naviStartYear + 9) {
              cell.adjacent = true
            }
            row.push(cell)
            n++
          }
          rows.push(row)
        }
        this.yearRows = rows
      },
      resetDate (value) {
        let v
        try {
          v = value
            ? (
              isDate(value)
                ? value
                : (isString(value) ? new Date(Date.parse(value)) : null)
            )
            : null
        } catch (e) {
        }
        const { year, month, date } = parseDate(v)
        this.year = year
        this.month = month
        this.date = date
        this.naviStartYear = Math.trunc(year / 10) * 10
        this.naviYear = year
        this.naviMonth = month
        this.naviDateYear = year
        this.naviDateMonth = month
        this.naviDate = date
        this.updateYearCells()
        this.updateDateCells()
      },
      goMonth (step) {
        const { year, month } = getSiblingMonth({
          year: this.naviDateYear,
          month: this.naviDateMonth,
          step
        })
        this.naviDateYear = year
        this.naviDateMonth = month
        this.updateDateCells()
      },
      goNow () {
        return this.tab === 'date'
          ? this.goThisMonth()
          : this.goThisYear()
      },
      goPrev () {
        return this.tab === 'date'
          ? this.goMonth(-1)
          : this.goPrevYears()
      },
      goNext () {
        return this.tab === 'date'
          ? this.goMonth(1)
          : this.goNextYears()
      },
      goThisMonth () {
        const { year, month } = parseDate()
        this.naviDateYear = year
        this.naviDateMonth = month
        this.updateDateCells()
      },
      goPrevYears () {
        this.naviStartYear -= 10
        this.updateYearCells()
      },
      goNextYears () {
        this.naviStartYear += 10
        this.updateYearCells()
      },
      goThisYear () {
        this.naviStartYear = Math.trunc((new Date()).getFullYear() / 10) * 10
        this.updateYearCells()
      },
      onTitleClick () {
        if (this.tab === 'date') {
          this.naviMonth = this.naviDateMonth
          this.naviYear = this.naviDateYear
          this.naviStartYear = Math.trunc(this.naviYear / 10) * 10
          this.updateYearCells()
          this.tab = 'year'
        }
      },
      onYearCellClick (cell) {
        this.naviYear = cell.year
        if (this.selectMode === 'year') {
          this.$emit('change', new Date(this.naviYear, 1, 1), this.naviYear)
        }
      },
      onMonthCellClick (cell) {
        this.naviMonth = cell.month
        if (this.naviYear >= this.naviStartYear - 1 &&
          this.naviYear < this.naviStartYear + 11) {
          if (this.selectMode !== 'year' && this.selectMode !== 'month') {
            this.naviDateYear = this.naviYear
            this.naviDateMonth = this.naviMonth
            this.updateDateCells()
            this.tab = 'date'
          } else {
            this.$emit(
              'change',
              new Date(this.naviYear, this.naviMonth, 1),
              this.naviYear,
              this.naviMonth
            )
          }
        }
      },
      onDateCellClick (cell) {
        if (cell.outOfRange) return
        this.naviDate = cell.date
        if (!this.value || !isSameDate(cell, this)) {
          this.$emit(
            'change',
            new Date(cell.year, cell.month, cell.date),
            cell.year,
            cell.month,
            cell.date
          )
        }
      }
    }
  }
</script>
