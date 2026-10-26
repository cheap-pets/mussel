/**
 * canvas-table 文本折行纯函数（02-design.md A2.2 / A3.5，评审 6 P4/P6）。
 *
 * 测量能力全部经注入的 measure(text, font) 回调，模块自身不触 canvas——
 * measure 由组件壳经 theme.js createTextMeasurer() 创建注入；行高计算
 * （row-geometry）与绘制（cell-painters）用同一 wrapLines + 同一缓存，
 * 折行结果单一事实源。
 *
 * 省略字符二分（00-task.md 实施约束 4，评审 6 P4）：
 * - maxLines 溢出末行收缩字符 = '...'（三个半角点，数据条目字面口径）；
 * - 单行超宽视觉省略 '…'（U+2026，CSS ellipsis 同款）不在本模块
 *   （drawText 现状 ELLIPSIS，cell-painters 消费 wrapLines 前自行处理）。
 */

/** 折行结果缓存上限（超限整体清空，同 theme.js createMeasureCache 策略） */
export const WRAP_CACHE_LIMIT = 2000

const CACHE_SEPARATOR = '\u0000'

/** maxLines/maxItems 配置值钳制上限（人工 2 意见 2：最大 10） */
export const MAX_LINES_LIMIT = 10

const DOTS = '...'

// CJK 字符判定：CJK 部首/符号/统一表意文字、日文假名、韩文谚文、全角形态
const CJK_PATTERN =
  /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\uAC00-\uD7AF]/

/** CJK 单字（含全角标点）：逐字可断 */
function isCjkChar (ch) {
  return CJK_PATTERN.test(ch)
}

/**
 * 文本分词：CJK 单字 + 拉丁/数字/半角符号连续段为原子词。
 * 空白并入后续词的词首（行首空白同规则），保证断点落在空白边界。
 *
 * @param {String} text
 * @returns {String[]} token 数组（空文本返回空数组）
 */
export function tokenize (text) {
  const source = String(text ?? '')
  const tokens = []
  let current = ''

  const push = () => {
    if (current) tokens.push(current)
    current = ''
  }

  let index = 0

  while (index < source.length) {
    const ch = source[index]

    if (/\s/.test(ch)) {
      // 空白并入当前 token（无当前 token 时暂存，与后续词合并）
      current += ch
    } else if (isCjkChar(ch)) {
      push()
      tokens.push(ch)
    } else {
      // 拉丁/数字/半角符号连续段为原子词；此前暂存的行首空白并入词首
      if (current && !/\S/.test(current)) {
        // current 仅含空白：作为词首前缀保留
      } else {
        push()
      }
      let word = current
      current = ''

      while (index < source.length) {
        const wch = source[index]

        if (/\s/.test(wch) || isCjkChar(wch)) break
        word += wch
        index++
      }

      tokens.push(word)
      continue
    }

    index++
  }

  push()

  return tokens
}

/**
 * 短路行数判定（高性能文本测量："仅测量更长的字段"）：
 * text.length × fontSize ≤ maxWidth 时整串必然单行，无需测量。
 *
 * @param {Object} params
 * @param {String} params.text
 * @param {Number} params.fontSize
 * @param {Number} params.maxWidth 内容区宽（px）
 * @returns {Number} 1 = 确定单行；Infinity = 需精算（wrapLines 测量判定）
 */
export function estimateLineCount ({ text, fontSize, maxWidth }) {
  const length = String(text ?? '').length

  if (length * fontSize <= maxWidth) return 1

  return Infinity
}

/**
 * 逐字符收缩：使 content + DOTS 适配 maxWidth（末行自尾部退格并复测）。
 * measure 走上游测量缓存（createMeasureCache），同一文本重复收缩零成本。
 */
function shrinkToFit (content, font, maxWidth, measure) {
  let last = content

  while (last && measure(last + DOTS, font) > maxWidth) last = last.slice(0, -1)

  // 极端窄列：DOTS 本身超宽时丢弃点号（退化为空内容，由绘制层兜底）
  return measure(last + DOTS, font) > maxWidth ? '' : last + DOTS
}

/** 折行核心（无缓存路径） */
function computeWrap ({ text, font, maxWidth, measure, maxLines }) {
  const source = String(text ?? '')

  if (!source || !(maxWidth > 0)) {
    return { lines: [source], lineCount: 1, clamped: false }
  }

  // 全宽 measure 下界判定：整串放得下则免折行（仅 1 次测量）
  if (measure(source, font) <= maxWidth) {
    return { lines: [source], lineCount: 1, clamped: false }
  }

  const tokens = tokenize(source)
  const lines = []
  let current = ''

  for (const token of tokens) {
    // 词首空白并入 current 时 candidate 与 token 相同，直接走放不下分支
    if (current && measure(current + token, font) <= maxWidth) {
      current += token
      continue
    }

    if (!current) {
      current = token
    } else {
      lines.push(current)
      current = token
    }

    // 超长词（单词自身超宽）逐字断
    while (measure(current, font) > maxWidth) {
      let chunk = ''

      while (current.length > 1 && measure(chunk + current[0], font) <= maxWidth) {
        chunk += current[0]
        current = current.slice(1)
      }

      // 至少保底 1 字符防死循环（单字符仍超宽时接受溢出）
      if (!chunk) {
        chunk = current[0]
        current = current.slice(1)
      }

      lines.push(chunk)
    }
  }

  if (current || !lines.length) lines.push(current)

  // maxLines 钳制：截断为 maxLines 行，末行收缩加 '...'（实施约束 4）
  if (maxLines != null && lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)

    kept[maxLines - 1] = shrinkToFit(kept[maxLines - 1] ?? '', font, maxWidth, measure)

    return { lines: kept, lineCount: maxLines, clamped: true }
  }

  return { lines, lineCount: lines.length, clamped: false }
}

/**
 * 贪心折行：CJK 逐字可断、拉丁/数字连续段原子不拆、超长词逐字断。
 * maxLines 钳制在函数内完成（行数截断 + 末行收缩 '...'），返回 clamped 标记。
 *
 * @param {Object} params
 * @param {String} params.text
 * @param {String} params.font canvas font 串（如 '14px sans-serif'）
 * @param {Number} params.maxWidth 内容区宽（px）
 * @param {Function} params.measure 测量回调 (text, font) => px 宽
 * @param {Object} [params.cache] createWrapCache 产物（折行结果缓存）
 * @param {Number} [params.maxLines] 最大行数（null/undefined = 不限）
 * @returns {{ lines: String[], lineCount: Number, clamped: Boolean }}
 */
export function wrapLines ({ text, font, maxWidth, measure, cache, maxLines }) {
  const key = cache
    ? String(text ?? '') + CACHE_SEPARATOR + font + CACHE_SEPARATOR + maxWidth + CACHE_SEPARATOR + (maxLines ?? Infinity)
    : null

  if (key && cache.get(key) !== undefined) return cache.get(key)

  const result = computeWrap({ text, font, maxWidth, measure, maxLines })

  if (key) cache.set(key, result)

  return result
}

/**
 * 折行结果缓存：key = text + font + width + maxLines，容量上限整体清空
 * （复用 theme.js createMeasureCache 模式）。
 *
 * @param {Number} [limit=WRAP_CACHE_LIMIT]
 * @returns {{ get: (key: String) => any, set: (key: String, value: any) => void, size: Number }}
 */
export function createWrapCache (limit = WRAP_CACHE_LIMIT) {
  const cache = new Map()

  return {
    get: key => cache.get(key),
    set: (key, value) => {
      if (cache.size >= limit) cache.clear()
      cache.set(key, value)
    },
    get size () {
      return cache.size
    }
  }
}
