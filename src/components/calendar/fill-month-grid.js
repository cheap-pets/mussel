import {
  isEqual,
  getMonthDays,
  filterByMonth,
  getSiblingMonth,
  getMonthFirstDay
} from '@utils/date'

import { fillGrid } from '@utils/array'

function setCellStatus (cell, marks, start, end, today) {
  const date = new Date(cell.year, cell.month, cell.date)

  if (isEqual(cell, today)) cell.today = true
  if (marks.indexOf(cell.text) !== -1) cell.marked = true
  if ((start && date < start) || (end && date > end)) cell.invalid = true
}

export default function fillMonthGrid (year, month, marked, start, end, today) {
  const maxDays = getMonthDays(year, month)
  const firstDay = getMonthFirstDay(year, month)
  const prev = getSiblingMonth(year, month, -1)
  const prevMaxDays = getMonthDays(prev.year, prev.month)
  const next = getSiblingMonth(year, month, 1)
  const marks = filterByMonth(marked, year, month).map(
    el => `${el.year}-${el.month + 1}-${el.date}`
  )

  let n = 1
  return fillGrid(7, 7, (row, i, j) => {
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
    setCellStatus(cell, marks, start, end, today)
    row.push(cell)
  })
}
