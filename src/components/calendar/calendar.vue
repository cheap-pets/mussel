<template>
  <div class="mu-calendar">
    <div class="mu-calendar-header">
      <div class="mu-calendar-title" @click="onTitleClick">
        {{ title }}
      </div>
      <icon-button button-style="link" icon="key-up" @click="goPrev" />
      <icon-button button-style="link" icon="calendar" @click="goNow" />
      <icon-button button-style="link" icon="key-down" @click="goNext" />
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
            :key="cellIdx"
            class="mu-calendar-cell"
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

  import lang from '../../lang'
  import IconButton from '../button/icon-button.jsx'

  import { fillGrid } from '@utils/array'
  import fillMonthGrid from './fill-month-grid'

  import {
    isEqual,
    date2Obj,
    getSiblingMonth,
    convertToDateObj
  } from '@utils/date'

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
      weekDays () {
        return [
          'SUNDAY',
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY'
        ].map(el => lang.Calendar[el])
      },
      monthNames () {
        const Calendar = lang.Calendar
        return [
          'JANUARY', 'FEBRUARY', 'MARCH',
          'APRIL', 'MAY', 'JUNE',
          'JULY', 'AUGUST', 'SEPTEMBER',
          'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ].map(el => Calendar[el])
      },
      title () {
        const { YEAR } = lang.Calendar
        const {
          startYear,
          naviYear: year,
          naviMonth: month
        } = this
        return this.tab === 'date'
          ? `${year} ${YEAR} ${this.monthNames[month]}`
          : `${startYear} ~ ${startYear + 9}`
      },
      monthRows () {
        let n = 0
        return fillGrid(3, 4, row => {
          row.push({
            month: n,
            monthName: this.monthNames[n]
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
      updateDateCells () {
        const {
          naviYear: year,
          naviMonth: month,
          rangeStart: start,
          rangeEnd: end,
          markedDates: marked,
          today
        } = this
        this.dateRows = fillMonthGrid(year, month, marked, start, end, today)
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
          if (n === this.today.year) cell.present = true
          row.push(cell)
          n++
        })
      },
      update (value) {
        const today = date2Obj(new Date())
        const {
          year = today.year,
          month = today.month,
          date
        } = convertToDateObj(value) || {}

        this.dateText = date ? `${year}-${month + 1}-${date}` : ''
        this.startYear = Math.trunc(year / 10) * 10
        this.today = today

        if (this.naviYear !== year || this.naviMonth !== month) {
          this.naviYear = year
          this.naviMonth = month
          if (this.tab === 'date') this.updateDateCells()
        }
        if (this.tab === 'year') this.updateYearCells()
      },
      goMonth (step) {
        const target = getSiblingMonth(this.naviYear, this.naviMonth, step)
        this.naviYear = target.year
        this.naviMonth = target.month
        this.updateDateCells()
      },
      goNow () {
        return this.tab === 'date' ? this.goThisMonth() : this.goThisYear()
      },
      goPrev () {
        return this.tab === 'date' ? this.goMonth(-1) : this.goPrevYears()
      },
      goNext () {
        return this.tab === 'date' ? this.goMonth(1) : this.goNextYears()
      },
      goThisMonth () {
        this.naviYear = this.today.year
        this.naviMonth = this.today.month
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
          this.$emit('change', new Date(this.naviYear, 1, 1), this.naviYear)
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
        if (!this.value || !isEqual(cell, this.value)) {
          this.dateText = `${year}-${month + 1}-${date}`
          this.$emit('change', value, year, month, date)
        }
      }
    }
  }
</script>
