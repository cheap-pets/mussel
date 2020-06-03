<template>
  <div class="mu-calendar">
    <div class="mu-calendar-header">
      <div class="mu-calendar-title" @click="onTitleClick">
        {{ title }}
      </div>
      <icon-button
        button-style="link"
        icon="key-up"
        @click="goPrev" />
      <icon-button
        button-style="link"
        icon="calendar"
        @click="goNow" />
      <icon-button
        button-style="link"
        icon="key-down"
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
            :present="cell.today"
            :marked="cell.marked"
            :invalid="cell.invalid"
            :adjacent="cell.adjacent"
            :active="cell.text === dateText"
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
            :present="cell.present"
            :invalid="cell.invalid"
            :adjacent="cell.adjacent"
            :active="cell.year === naviYear"
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
  import isDate from 'lodash.isdate'
  import isString from 'lodash.isstring'

  import IconButton from '../button/icon-button'
  import { isZh } from '../../utils/language'

  import {
    compare,
    fillGrid,
    parseDate,
    getMaxDays,
    getFirstDay,
    getMonthName,
    getSiblingMonth,
    getFilteredMarks
  } from './calendar-util'

  export default {
    components: {
      IconButton
    },
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      value: [String, Date],
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
      return {
        tab: 'date',
        dateText: '',
        dateRows: [],
        yearRows: [],
        startYear: null,
        naviYear: null,
        naviMonth: null
      }
    },
    computed: {
      isChinese () {
        return isZh(this.language)
      },
      weekDays () {
        return this.isChinese
          ? ['日', '一', '二', '三', '四', '五', '六']
          : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
      },
      title () {
        const {
          isChinese,
          startYear,
          naviYear: year,
          naviMonth: month
        } = this
        return this.tab === 'date'
          ? `${year} ${isChinese ? '年' : ''} ${getMonthName(month, isChinese)}`
          : `${startYear} ~ ${startYear + 9}`
      },
      monthRows () {
        let n = 0
        return fillGrid(3, 4, row => {
          row.push({
            month: n,
            monthName: getMonthName(n, this.isChinese)
          })
          n++
        })
      }
    },
    watch: {
      value (v) {
        this.update(v)
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
      this.tab = this.selectMode === 'date' ? 'date' : 'year'
      this.update(this.value)
    },
    methods: {
      setDateCellStatus (cell, marks, today) {
        const date = new Date(cell.year, cell.month, cell.date)
        const { rangeStart: start, rangeEnd: end } = this
        if (compare(cell, today)) cell.today = true
        if (marks.indexOf(cell.text) !== -1) cell.marked = true
        if ((start && date < start) || (end && date > end)) {
          cell.invalid = true
        }
      },
      updateDateCells () {
        const { naviYear: year, naviMonth: month, markedDates } = this
        const today = parseDate()
        const firstDay = getFirstDay({ year, month })
        const maxDays = getMaxDays({ year, month })
        const prev = getSiblingMonth({ year, month, step: -1 })
        const prevMaxDays = getMaxDays(prev)
        const next = getSiblingMonth({ year, month, step: 1 })
        const marks = getFilteredMarks(markedDates, year, month)
        let n = 1
        this.dateRows = fillGrid(7, 7, (row, i, j) => {
          const isPrevMonth = i === 0 && j < firstDay
          const isNextMonth = n > maxDays
          const cell = isPrevMonth
            ? {
              year: prev.year,
              month: prev.month,
              date: prevMaxDays - firstDay + j + 1,
              adjacent: true
            }
            : (
              isNextMonth
                ? {
                  year: next.year,
                  month: next.month,
                  date: n - maxDays,
                  adjacent: true
                }
                : {
                  year: year,
                  month: month,
                  date: n
                }
            )
          cell.text = `${cell.year}-${cell.month + 1}-${cell.date}`
          if (!isPrevMonth) n++
          this.setDateCellStatus(cell, marks, today)
          row.push(cell)
        })
        this.$emit('updatecells', { year, month })
        this.$emit('navigate', { year, month })
      },
      updateYearCells () {
        let n = this.startYear - 1
        this.yearRows = fillGrid(3, 4, row => {
          const cell = { year: n }
          if (n < this.startYear || n > this.startYear + 9) {
            cell.adjacent = true
          }
          if (n === parseDate().year) cell.present = true
          row.push(cell)
          n++
        })
      },
      update (value) {
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
        this.dateText = v ? `${year}-${month + 1}-${date}` : ''
        this.startYear = Math.trunc(year / 10) * 10
        if (this.naviYear !== year || this.naviMonth !== month) {
          this.naviYear = year
          this.naviMonth = month
          return this.tab === 'year'
            ? this.updateYearCells()
            : this.updateDateCells()
        }
      },
      goMonth (step) {
        const { year, month } = getSiblingMonth({
          year: this.naviYear,
          month: this.naviMonth,
          step
        })
        this.naviYear = year
        this.naviMonth = month
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
        this.naviYear = year
        this.naviMonth = month
        this.updateDateCells()
      },
      goPrevYears () {
        this.startYear -= 10
        this.updateYearCells()
      },
      goNextYears () {
        this.startYear += 10
        this.updateYearCells()
      },
      goThisYear () {
        this.startYear = Math.trunc((new Date()).getFullYear() / 10) * 10
        this.updateYearCells()
      },
      onTitleClick () {
        if (this.tab === 'date') {
          this.startYear = Math.trunc(this.naviYear / 10) * 10
          this.updateYearCells()
          this.tab = 'year'
        }
      },
      onYearCellClick (cell) {
        this.naviYear = cell.year
        if (this.selectMode === 'year') {
          this.$emit(
            'change',
            new Date(this.naviYear, 1, 1),
            this.naviYear
          )
        }
      },
      onMonthCellClick (cell) {
        const { naviYear, startYear, selectMode } = this
        this.naviMonth = cell.month
        if (naviYear >= startYear - 1 && naviYear < startYear + 11) {
          if (selectMode === 'date') {
            this.updateDateCells()
            this.tab = 'date'
          } else {
            const value = new Date(naviYear, this.naviMonth, 1)
            this.$emit('change', value, naviYear, this.naviMonth)
          }
        }
      },
      onDateCellClick (cell) {
        const { year, month, date, invalid } = cell
        const value = new Date(year, month, date)
        if (invalid) return
        if (!this.value || !compare(cell, this.value)) {
          this.dateText = `${year}-${month + 1}-${date}`
          this.$emit('change', value, year, month, date)
        }
      }
    }
  }
</script>
