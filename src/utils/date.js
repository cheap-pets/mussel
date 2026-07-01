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

      if (re.test(str)) {
        const len = RegExp.$1.length
        const value = '' + patterns[p]
        const start = value.length

        str = str.replace(
          RegExp.$1,
          len === 3
            ? ('000' + value).substr(start)
            : (
                len === 2
                  ? ('00' + value).substr(start)
                  : value
              )
        )
      }
    })

  return str
}

export function toDateString (date, format = 'yyyy-MM-dd') {
  date = toDate(date)

  if (!date) return null

  const str = /(y+)/i.test(format)
    ? format.replace(RegExp.$1, ('' + date.getFullYear()).substr(4 - RegExp.$1.length))
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

const TOKEN_RUN = /[yY]+|M+|[dD]+|[hH]+|m+|s+|S+/g

const TOKEN_FIELDS = {
  y: 'year',
  Y: 'year',
  M: 'month',
  d: 'date',
  D: 'date',
  h: 'hour',
  H: 'hour',
  m: 'minute',
  s: 'second',
  S: 'millisecond'
}

function escapeRegExp (str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function dateStringToObject (str, format = 'yyyy-MM-dd') {
  if (str == null || str === '') return null

  str = String(str)
  format = String(format)

  const tokens = []
  const parts = []
  let lastIndex = 0

  for (const match of format.matchAll(TOKEN_RUN)) {
    if (match.index > lastIndex) {
      parts.push(escapeRegExp(format.slice(lastIndex, match.index)))
    }

    tokens.push(match[0][0])
    parts.push('(\\d+)')
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < format.length) {
    parts.push(escapeRegExp(format.slice(lastIndex)))
  }

  if (!tokens.length) return null

  const matched = str.match(new RegExp('^' + parts.join('') + '$'))

  if (!matched) return null

  const obj = {}

  tokens.forEach((char, i) => {
    const field = TOKEN_FIELDS[char]

    if (!field) return

    const value = parseInt(matched[i + 1], 10)

    // month is 1-based in the format string, 0-based in the object
    obj[field] = field === 'month' ? value - 1 : value
  })

  return obj
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
