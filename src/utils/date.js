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

/**
 * 计算给定日期的 ISO 8601 周年份与周序号。
 *
 * ISO 周以周一为起始；每年第一周是包含当年第一个周四的那一周，
 * 因此年末/年初的几天可能归属相邻年份的周。
 *
 * @param {Date} date
 * @returns {{ year: number, week: number }}
 */
function getISOWeek (date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // 将当天对齐到本周周四：ISO 周序号以周四所属年份为准。
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)

  const year = d.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.floor(((d - yearStart) / 86400000) / 7) + 1

  return { year, week }
}

export function toWeekObject (value) {
  if (value == null || value === '') return null

  const date = toDate(value)

  if (date) {
    return {
      ...getISOWeek(date),
      date
    }
  }

  if (typeof value === 'string') {
    const matched = value.match(/(\d{4})\D*[Ww]?(\d{1,2})/)

    if (matched) {
      return { year: parseInt(matched[1], 10), week: parseInt(matched[2], 10) }
    }
  }

  return null
}

export function weekEquals (a, b) {
  a = toWeekObject(a)
  b = toWeekObject(b)

  return a?.year && b?.year && a.year === b.year && a.week === b.week
}

/**
 * 计算某日是其所在月的第几周（按 weekStartsOn 划分行）。
 *
 * @param {Date} date
 * @param {number} weekStartsOn - 周起始日（0=周日 … 6=周六）。
 * @returns {number}
 */
function getWeekOfMonth (date, weekStartsOn = 0) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  const offset = (firstDay - weekStartsOn + 7) % 7

  return Math.floor((date.getDate() + offset - 1) / 7) + 1
}

/**
 * 格式化周字符串。
 *
 * - format 不含 M（月）时，w 为 ISO 周序号（如 2026-W29）；
 * - format 含 M（月）时，w 改为该月的第几周（如 2026-07-W1）。
 *
 * @param {number} year - ISO 周年份。
 * @param {number} week - ISO 周序号。
 * @param {string} [format]
 * @param {{ date?: Date, weekStartsOn?: number }} [options]
 *   date 用于计算月内周；weekStartsOn 决定行划分（默认周日）。
 */
export function toWeekString (year, week, format = 'yyyy-Www', options = {}) {
  const { date, weekStartsOn = 0 } = options

  // format 含 M（月）时，w 改为月内第几周；否则用 ISO 周序号。
  const w = date && /[Mm]/.test(format)
    ? getWeekOfMonth(date, weekStartsOn)
    : week

  let str = String(format)
    .replace(/yyyy/g, year)
    .replace(/yy/g, String(year).slice(-2))

  if (date && /[Mm]/.test(format)) {
    const month = date.getMonth() + 1
    str = str
      .replace(/MM/g, String(month).padStart(2, '0'))
      .replace(/M/g, month)
  }

  return str
    .replace(/ww/g, String(w).padStart(2, '0'))
    .replace(/w/g, w)
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
