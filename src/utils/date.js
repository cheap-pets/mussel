import { typeOf, isObject, isDate } from '@/utils/type'

export function toDate (value) {
  if (value == null || value === '') return null

  const type = typeOf(value)

  if (type === 'object') {
    value = new Date(value.year, value.month || 0, value.date || 1)
  } else if (type !== 'date') {
    value = new Date(value)
  }

  return isDate(value) ? value : null
}

export function toDateObject (value) {
  if (isObject(value)) return value

  const date = toDate(value)

  return date && {
    year: date.getFullYear(),
    month: date.getMonth(),
    date: date.getDate()
  }
}

function replaceByPatterns (str, patterns) {
  Object
    .keys(patterns)
    .forEach(p => {
      const re = new RegExp(p, ['(d+)', '(h+)'].includes(p) ? 'i' : undefined)
      const matched = re.exec(str)

      if (matched) {
        const token = matched[1]
        str = str.replace(token, String(patterns[p]).padStart(token.length, '0'))
      }
    })

  return str
}

export function toDateString (date, format = 'yyyy-MM-dd') {
  date = toDate(date)

  if (!date) return null

  const year = String(date.getFullYear())
  const matched = /(y+)/i.exec(format)

  const str = matched
    ? format.replace(matched[1], year.slice(year.length - matched[1].length))
    : format

  const patterns = {
    '(M+)': date.getMonth() + 1,
    '(d+)': date.getDate(),
    '(h+)': date.getHours(),
    '(m+)': date.getMinutes(),
    '(s+)': date.getSeconds(),
    '(S+)': date.getMilliseconds()
  }

  return replaceByPatterns(str, patterns)
}

export function isLeapYear (year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

export function getMonthDaysCount (year, month) {
  return isLeapYear(year) && month === 1
    ? 29
    : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
}

export function getMonthFirstDay (year, month) {
  return (new Date(year, month, 1)).getDay()
}

export function getPrevMonth (year, month) {
  return month > 0
    ? { year, month: month - 1 }
    : { year: year - 1, month: 11 }
}

export function getNextMonth (year, month) {
  return month < 11
    ? { year, month: month + 1 }
    : { year: year + 1, month: 0 }
}

export function filterDatesByMonth (dates, year, month) {
  return dates.reduce((t, el) => {
    el = toDateObject(el)

    if (el && el.year === year && el.month === month) {
      t.push(el)
    }

    return t
  }, [])
}

export function dateEquals (a, b) {
  a = toDateObject(a)
  b = toDateObject(b)

  return (
    a?.year &&
    b?.year &&
    a.year === b.year &&
    a.month === b.month &&
    a.date === b.date
  )
}

export function monthEquals (a, b) {
  a = toDateObject(a)
  b = toDateObject(b)

  return a?.year && b?.year && a.year === b.year && a.month === b.month
}

export function yearEquals (a, b) {
  a = toDateObject(a)
  b = toDateObject(b)

  return a?.year && b?.year && a.year === b.year
}

export function toQuarterObject (value) {
  if (value == null || value === '') return null

  const obj = toDateObject(value)

  if (obj) {
    return { year: obj.year, quarter: Math.floor(obj.month / 3) }
  }

  if (typeof value === 'string') {
    const matched = value.match(/(\d{4})\D*[Qq]?([1-4])/)

    if (matched) {
      return { year: parseInt(matched[1], 10), quarter: parseInt(matched[2], 10) - 1 }
    }
  }

  return null
}

export function quarterEquals (a, b) {
  a = toQuarterObject(a)
  b = toQuarterObject(b)

  return a?.year && b?.year && a.year === b.year && a.quarter === b.quarter
}

export function toQuarterString (year, quarter, format = 'yyyy-Qq') {
  quarter = quarter + 1

  return String(format)
    .replace(/yyyy/g, year)
    .replace(/yy/g, String(year).slice(-2))
    .replace(/q/g, quarter)
}

export function toTimeObject (value) {
  if (value == null || value === '') return null

  const type = typeOf(value)

  let parts

  if (type === 'string') {
    parts = value.split(':')
  } else if (type === 'object') {
    parts = [
      value.hour,
      value.minute,
      value.second,
      value.millisecond
    ]
  } else {
    value = type === 'date' ? value : new Date(value)

    if (!isDate(value)) return null

    parts = [
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds()
    ]
  }

  const [hour, minute = 0, second = 0, millisecond = 0] =
    parts.map((el, idx) => idx ? Number(el) || 0 : Number(el))

  return hour >= 0 && hour < 24
    ? { hour, minute, second, millisecond }
    : null
}

export function toTimeString (time, format = 'HH:mm:ss') {
  time = toTimeObject(time)

  if (!time) return null

  const patterns = {
    '(h+)': time.hour,
    '(m+)': time.minute,
    '(s+)': time.second,
    '(S+)': time.millisecond
  }

  return replaceByPatterns(format, patterns)
}
