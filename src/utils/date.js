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

export function toDateString (date, format = 'yyyy-MM-dd') {
  date = toDate(date)

  if (!date) return null

  let result = /(y+)/i.test(format)
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

  Object
    .keys(patterns)
    .forEach(p => {
      const re = new RegExp(p, ['(d+)', '(h+)'].includes(p) ? 'i' : undefined)

      if (re.test(result)) {
        const len = RegExp.$1.length
        const value = '' + patterns[p]
        const start = value.length

        result = result.replace(
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

  return result
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
  if (!value) return null

  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value)

  if (!m) return null

  const hour = +m[1]
  const minute = +m[2]
  const second = m[3] != null ? +m[3] : 0

  if (hour > 23 || minute > 59 || second > 59) return null

  return { hour, minute, second }
}

export function toTimeString (time, includeSecond = false) {
  if (!time) return null

  const hour = String(time.hour ?? 0).padStart(2, '0')
  const minute = String(time.minute ?? 0).padStart(2, '0')
  const second = String(time.second ?? 0).padStart(2, '0')

  return includeSecond ? `${hour}:${minute}:${second}` : `${hour}:${minute}`
}
