/**
 * table-ex 文本折行纯函数（02-design.md A2.2 / A3.5，评审 6 P4/P6）。
 *
 * 测量能力全部经注入的 measure(text, font) 回调，模块自身不触 canvas——
 * measure 由组件壳经 theme.js createTextMeasurer() 创建注入；行高计算
 * （row-geometry）与绘制（cell-painters）用同一 wrapLines + 同一缓存，
 * 折行结果单一事实源。
 *
 * 省略字符统一 '...'（00-task.md 实施约束 4）：maxLines 溢出末行收缩
 * （shrinkToFit）与单行超宽截断（ellipsize）同字面，均在本模块——
 * cell-painters（表体）与 painter（表头）共用 ellipsize，测量经注入的
 * measure 回调走上游缓存。
 */
import { ELLIPSIS, FONT_SIZE_FALLBACK, FONT_FAMILY_FALLBACK } from './constants'

/** 折行结果缓存上限（超限整体清空，同 theme.js createMeasureCache 策略） */
export const WRAP_CACHE_LIMIT = 2000

const CACHE_SEPARATOR = '\u0000'

/** maxLines/maxItems 配置值钳制上限（人工 2 意见 2：最大 10） */
export const MAX_LINES_LIMIT = 10

/**
 * 单元格正文字体串（theme 快照 → canvas font）：cell-painters（绘制）与
 * row-geometry（行高估高/精算）共用（C2 cellFontOf 收拢，接受 theme 快照
 * 入参；表头字体带 500 字重，见 painter.headerFontOf，不在此合并）。
 */
export function cellFontOf (theme) {
  return `${theme?.fontSize || FONT_SIZE_FALLBACK}px ${theme?.fontFamily || FONT_FAMILY_FALLBACK}`
}

// CJK 字符判定：CJK 部首/符号/统一表意文字、日文假名、韩文谚文、全角形态
// （P4 码点化：原 CJK_PATTERN 正则逐字 test 换 charCodeAt 范围比较，等价集合，
// 全部 BMP——surrogate 对与现行为一致，落入原子词段）

/** 空白判定（JS \s 全集，BMP）：0x09-0x0D、0x20、0xA0、0x1680、0x2000-0x200A、
    0x2028、0x2029、0x202F、0x205F、0x3000、0xFEFF。
    热路径（tokenize 每字符调用）：范围链直接展开最快，复杂度豁免口径同
    row-geometry 每行热路径（拆查表/函数反而引入遍历开销） */
// eslint-disable-next-line complexity
function isWhitespaceCode (code) {
  return code === 0x20 ||
    (code >= 0x09 && code <= 0x0D) ||
    code === 0xA0 ||
    code === 0x1680 ||
    (code >= 0x2000 && code <= 0x200A) ||
    code === 0x2028 ||
    code === 0x2029 ||
    code === 0x202F ||
    code === 0x205F ||
    code === 0x3000 ||
    code === 0xFEFF
}

/** CJK 单字判定（含全角标点）：0x2E80-0x9FFF、0xF900-0xFAFF、0xFF00-0xFFEF、
    0xAC00-0xD7AF（原 CJK_PATTERN 四段）。与空白集合重叠（U+3000 等同落两段），
    调用方必须保持空白优先判定顺序 */
function isCjkCode (code) {
  return (code >= 0x2E80 && code <= 0x9FFF) ||
    (code >= 0xF900 && code <= 0xFAFF) ||
    (code >= 0xFF00 && code <= 0xFFEF) ||
    (code >= 0xAC00 && code <= 0xD7AF)
}

/**
 * 文本分词：CJK 单字 + 拉丁/数字/半角符号连续段为原子词。
 * 空白并入后续词的词首（行首空白同规则），保证断点落在空白边界。
 *
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

    // P4 码点判定（原两次正则 test 换 charCodeAt 范围比较）；空白与 CJK 集合
    // 重叠（如 U+3000 同落 CJK 区间），必须保持空白优先的同序 if/else-if
    const code = source.charCodeAt(index)

    if (isWhitespaceCode(code)) {
      // 空白并入当前 token（无当前 token 时暂存，与后续词合并）
      current += ch
    } else if (isCjkCode(code)) {
      push()
      tokens.push(ch)
    } else {
      // 拉丁/数字/半角符号连续段为原子词；此前暂存的行首空白并入词首
      // （current 在该点只可能是空串或纯空白累积，判首字符码点即可）
      if (current && isWhitespaceCode(current.charCodeAt(0))) {
        // current 仅含空白：作为词首前缀保留
      } else {
        push()
      }
      let word = current
      current = ''

      while (index < source.length) {
        const wcode = source.charCodeAt(index)

        if (isWhitespaceCode(wcode) || isCjkCode(wcode)) break
        word += source[index]
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
 * @param {Number} params.maxWidth 内容区宽（px）
 * @returns {Number} 1 = 确定单行；Infinity = 需精算（wrapLines 测量判定）
 */
export function estimateLineCount ({ text, fontSize, maxWidth }) {
  const length = String(text ?? '').length

  if (length * fontSize <= maxWidth) return 1

  return Infinity
}

/**
 * 收缩适配：使 content + ELLIPSIS 适配 maxWidth。
 * 前缀宽度随字符数单调（与 ellipsize 同一假设）⇒ 二分定位最大可容纳前缀
 * （P4：O(n) 次测量 → O(log n)；measure 走上游测量缓存，重复测量零成本）。
 * 边界与线性回退一致：无前缀可容纳时先测空前缀，ELLIPSIS 本身超宽返回 ''
 * （退化空内容，由绘制层兜底），否则返回 ELLIPSIS。
 */
function shrinkToFit (content, font, maxWidth, measure) {
  let lo = 0
  let hi = content.length

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1

    if (measure(content.slice(0, mid) + ELLIPSIS, font) <= maxWidth) lo = mid
    else hi = mid - 1
  }

  // 极端窄列：ELLIPSIS 本身超宽时丢弃点号（退化为空内容，由绘制层兜底）
  return measure(content.slice(0, lo) + ELLIPSIS, font) > maxWidth ? '' : content.slice(0, lo) + ELLIPSIS
}

/**
 * 单行省略截断（A7 单行省略；溢出字符 '...' 按实施约束 4 统一）：
 * 前缀宽度随字符数单调 ⇒ 二分收缩定位最大可容纳前缀（O(log n) 次测量，
 * 测量经注入的 measure 走上游缓存），替代逐字符线性回退。
 * 一个字符都放不下（含 maxWidth ≤ 0）时返回空串（drawText 空串跳过语义）。
 *
 * @param {Object} params
 * @param {String} params.font canvas font 串（如 '14px sans-serif'）
 * @param {Number} params.maxWidth 最大宽度 px
 * @param {Function} params.measure 测量回调 (text, font) => px 宽
 * @returns {{ text: String, width: Number }} text = 截断结果（整串放得下为原文），
 *   width = 截断结果测量宽度（调用方免二次测量）
 */
export function ellipsize ({ text, font, maxWidth, measure }) {
  const source = String(text ?? '')

  if (!(maxWidth > 0)) return { text: '', width: 0 }

  const full = measure(source, font)

  if (full <= maxWidth) return { text: source, width: full }

  let lo = 0
  let hi = source.length

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1

    if (measure(source.slice(0, mid) + ELLIPSIS, font) <= maxWidth) lo = mid
    else hi = mid - 1
  }

  if (lo <= 0) return { text: '', width: 0 }

  const clipped = source.slice(0, lo) + ELLIPSIS

  return { text: clipped, width: measure(clipped, font) }
}

/**
 * 超长词（单词自身超宽）逐字断：当前行首部切出放得下的前缀压行，余量续断。
 * 至少保底 1 字符防死循环（单字符仍超宽时接受溢出）；返回未压行的余量
 * （作为下一 token 的并入起点，'' = 整词耗尽）。
 */
function splitOverflowLine (lines, current, font, maxWidth, measure) {
  while (measure(current, font) > maxWidth) {
    let chunk = ''

    while (current.length > 1 && measure(chunk + current[0], font) <= maxWidth) {
      chunk += current[0]
      current = current.slice(1)
    }

    if (!chunk) {
      chunk = current[0]
      current = current.slice(1)
    }

    lines.push(chunk)
  }

  return current
}

/** 贪心折行主循环：token 逐个并入当前行，放不下则换行（超长词逐字断）。 */
function wrapTokens (tokens, font, maxWidth, measure) {
  const lines = []
  let current = ''

  for (const token of tokens) {
    // 词首空白并入 current 时 candidate 与 token 相同，直接走放不下分支
    if (current && measure(current + token, font) <= maxWidth) {
      current += token
      continue
    }

    if (current) lines.push(current)

    current = splitOverflowLine(lines, token, font, maxWidth, measure)
  }

  if (current || !lines.length) lines.push(current)

  return lines
}

/** maxLines 钳制：截断为 maxLines 行，末行收缩加 '...'（实施约束 4）；未超限原样返回。 */
function clampToMaxLines (lines, font, maxWidth, measure, maxLines) {
  if (maxLines == null || lines.length <= maxLines) {
    return { lines, lineCount: lines.length, clamped: false }
  }

  const kept = lines.slice(0, maxLines)

  kept[maxLines - 1] = shrinkToFit(kept[maxLines - 1] ?? '', font, maxWidth, measure)

  return { lines: kept, lineCount: maxLines, clamped: true }
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

  const lines = wrapTokens(tokenize(source), font, maxWidth, measure)

  return clampToMaxLines(lines, font, maxWidth, measure, maxLines)
}

/**
 * 贪心折行：CJK 逐字可断、拉丁/数字连续段原子不拆、超长词逐字断。
 * maxLines 钳制在函数内完成（行数截断 + 末行收缩 '...'），返回 clamped 标记。
 *
 * @param {Object} params
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
