import { isString, isObject, isDate } from '@/utils/type'

export function resolveDate (value) {
  if (isString(value)) {
    value = new Date(value)
  }

  return isDate(value) ? value : null
}

export function toObject (value) {
  if (isObject(value)) return value

  const date = resolveDate(value)

  return date && {
    year: date.getFullYear(),
    month: date.getMonth(),
    date: date.getDate()
  }
}

export function toString (date, format = 'yyyy-MM-dd') {
  date = resolveDate(date)

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

export function filterDatesByMonth (dates, year, month) {
  return dates.reduce((t, el) => {
    el = toObject(el)

    if (el && el.year === year && el.month === month) {
      t.push(el)
    }

    return t
  }, [])
}

export function equals (a, b) {
  a = toObject(a)
  b = toObject(b)

  return a && b && a.year === b.year && a.month === b.month && a.date === b.date
}
