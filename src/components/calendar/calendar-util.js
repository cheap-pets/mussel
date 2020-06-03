import isDate from 'lodash.isdate'
import isString from 'lodash.isstring'

export function fillGrid (rowCount, colCount, callbackFn) {
  const rows = []
  for (let i = 0; i < rowCount; i++) {
    const row = []
    for (let j = 0; j < colCount; j++) {
      callbackFn(row, i, j)
    }
    rows.push(row)
  }
  return rows
}

export function parseDate (v) {
  try {
    v = v
      ? (
        isDate(v)
          ? v
          : (isString(v) ? new Date(Date.parse(v)) : null)
      )
      : null
  } catch (e) {
  }
  v = v || new Date()
  return {
    year: v.getFullYear(),
    month: v.getMonth(),
    date: v.getDate()
  }
}

export function getMaxDays ({ year, month }) {
  return month === 1 &&
    ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)
    ? 29
    : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
}

export function getFirstDay ({ year, month }) {
  return (new Date(year, month, 1)).getDay()
}

export function getMonthName (month, isZh) {
  const months = isZh
    ? [
      '1', '2', '3', '4', '5', '6',
      '7', '8', '9', '10', '11', '12'
    ]
    : [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
  return months[month] + (isZh ? ' 月' : '')
}

export function compare (a, b) {
  a = isDate(a) ? parseDate(a) : Object(a)
  b = isDate(b) ? parseDate(b) : Object(b)
  return a.year === b.year && a.month === b.month && a.date === b.date
}

export function getSiblingMonth ({ year, month, step }) {
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

export function getFilteredMarks (markedDates, year, month) {
  return markedDates.reduce((items, date) => {
    const p = parseDate(date)
    if (p.year === year && p.month === month) {
      items.push(`${p.year}-${p.month + 1}-${p.date}`)
    }
    return items
  }, [])
}
