import isDate from 'lodash.isdate'
import isString from 'lodash.isstring'

export function str2Date (s) {
  let i = Date.parse(s)
  if (isNaN(i)) {
    i = Date.parse(
      s.indexOf('-') > 0
        ? s.replace(/-/g, '/')
        : (
            s.indexOf('/') > 0 ? s.replace(/\//g, '-') : null
          )
    )
  }
  if (isNaN(i)) throw new Error(`${s} isn't a valid Date string.`)
  return new Date(i)
}

export function date2Obj (date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    date: date.getDate()
  }
}

export function convertToDate (value) {
  let result = null
  try {
    result = isDate(value)
      ? value
      : (isString(value) ? str2Date(value) : null)
  } catch (e) {
  }
  return result
}

export function convertToDateObj (value) {
  const date = convertToDate(value)
  return date ? date2Obj(date) : null
}

export function getMonthDays (year, month) {
  return month === 1 &&
    ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)
    ? 29
    : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
}

export function getMonthFirstDay (year, month) {
  return (new Date(year, month, 1)).getDay()
}

export function isEqual (a, b) {
  a = isDate(a) ? date2Obj(a) : Object(a)
  b = isDate(b) ? date2Obj(b) : Object(b)
  return a.year === b.year && a.month === b.month && a.date === b.date
}

export function getSiblingMonth (year, month, step) {
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

export function filterByMonth (dates, year, month) {
  return dates.reduce((result, date) => {
    const p = convertToDateObj(date)
    if (p && p.year === year && p.month === month) result.push(p)
    return result
  }, [])
}

export function formatDate (date, format = 'yyyy-MM-dd') {
  let result = /(y+)/i.test(format)
    ? format.replace(
        RegExp.$1,
        ('' + date.getFullYear()).substr(4 - RegExp.$1.length)
      )
    : format
  const patterns = {
    '(M+)': date.getMonth() + 1,
    '(d+)': date.getDate(),
    '(h+)': date.getHours(),
    '(m+)': date.getMinutes(),
    '(s+)': date.getSeconds(),
    '(S+)': date.getMilliseconds()
  }
  Object.keys(patterns).forEach(pattern => {
    const re = new RegExp(
      pattern,
      (pattern === '(d+)' || pattern === '(h+)') ? 'i' : undefined
    )
    if (re.test(result)) {
      const len = RegExp.$1.length
      const v = '' + patterns[pattern]
      const start = v.length
      result = result.replace(
        RegExp.$1,
        len === 2
          ? ('00' + v).substr(start)
          : (len === 3 ? ('000' + v).substr(start) : v)
      )
    }
  })
  return result
}
