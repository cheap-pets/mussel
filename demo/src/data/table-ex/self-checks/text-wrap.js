/**
 * table-ex 自检断言 — text-wrap 模块（G1-a）。
 *
 * 覆盖（02-design.md G1-a 判据 + 改动清单 self-checks/text-wrap.js 行；
 * 实施约束 4：maxLines 溢出末行字符 = '...' 三个半角点）：
 * tokenize 分词（CJK 单字 / 拉丁数字连续段原子）、estimateLineCount 短路判定、
 * wrapLines 全宽下界判定 / CJK 逐字断行 / 拉丁词原子不拆 / 超长词逐字断 /
 * 缓存命中（计数 measure）/ maxLines 钳制（行数截断 + 末行 '...' 收缩 +
 * clamped 标记 + maxLines=1 等价单行省略）。
 * measure 为注入参数（等宽假测量），模块零 canvas 依赖。
 */
import {
  tokenize,
  estimateLineCount,
  wrapLines,
  createWrapCache,
  WRAP_CACHE_LIMIT
} from '@/components/table/ex/text-wrap.js'

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

function assertEqual (actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} 期望 ${expected}，实际 ${actual}`)
  }

  return String(actual)
}

function assertArray (actual, expected, label) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)

  if (a !== e) throw new Error(`${label} 期望 ${e}，实际 ${a}`)

  return a
}

// 等宽假测量：每字符 10px（CJK/拉丁同宽，折行位置可精确断言）
const CHAR_W = 10
const FONT = '14px test-font'

const plainMeasure = text => text.length * CHAR_W

/** 计数包装：统计 measure 调用次数（缓存命中断言用） */
function countingMeasure (counter) {
  return (text, font) => {
    counter.calls++
    return plainMeasure(text)
  }
}

export const checks = [
  {
    name: 'tokenize：拉丁/数字连续段原子、CJK 单字、空白并入后续词词首',
    fn: () => {
      assertArray(tokenize('hello world'), ['hello', ' world'], '拉丁词 + 空白')
      assertArray(tokenize('世界42'), ['世', '界', '42'], 'CJK 单字 + 数字连续段')
      assertArray(tokenize('中文 english'), ['中', '文', ' english'], 'CJK 后行首空白并入词首')
      assertArray(tokenize('a1b2 c'), ['a1b2', ' c'], '字母数字混合连续段')
      assertArray(tokenize(''), [], '空文本')
      assertArray(tokenize('   '), ['   '], '纯空白')

      return '["hello"," world"] / ["世","界","42"] / 混合段原子 / 空文本 []'
    }
  },
  {
    name: 'estimateLineCount：len×fontSize ≤ maxWidth 短路 → 1（不测量），否则待精算',
    fn: () => {
      assertEqual(estimateLineCount({ text: 'abc', fontSize: 10, maxWidth: 30 }), 1, '恰等宽短路')
      assertEqual(estimateLineCount({ text: 'abc', fontSize: 10, maxWidth: 31 }), 1, '富余短路')
      assertEqual(estimateLineCount({ text: 'abcd', fontSize: 10, maxWidth: 30 }), Infinity, '超宽待精算')
      assertEqual(estimateLineCount({ text: '', fontSize: 10, maxWidth: 0 }), 1, '空文本单行')

      return '3×10≤30 → 1；4×10>30 → 待精算（∞）'
    }
  },
  {
    name: 'wrapLines：全宽 measure 下界判定（整串放得下仅 1 次测量免折行）',
    fn: () => {
      const counter = { calls: 0 }
      const measure = countingMeasure(counter)
      const result = wrapLines({ text: '短文本', font: FONT, maxWidth: 60, measure })

      assertArray(result.lines, ['短文本'], '单行结果')
      assertEqual(result.lineCount, 1, 'lineCount')
      assertEqual(result.clamped, false, 'clamped')
      assertEqual(counter.calls, 1, '全宽下界判定测量次数')

      return 'lines=["短文本"] lineCount=1，measure 调用 1 次'
    }
  },
  {
    name: 'wrapLines：CJK 逐字断行（贪心填行）',
    fn: () => {
      const counter = { calls: 0 }
      const result = wrapLines({ text: '一一一一一', font: FONT, maxWidth: 30, measure: countingMeasure(counter) })

      assertArray(result.lines, ['一一一', '一一'], 'CJK 逐字断行')
      assertEqual(result.lineCount, 2, 'lineCount')
      assertEqual(result.clamped, false, '未钳制')

      return '5 字 @30px → ["一一一","一一"]'
    }
  },
  {
    name: 'wrapLines：拉丁词原子不拆（断点在词边界）',
    fn: () => {
      const result = wrapLines({ text: 'hello world', font: FONT, maxWidth: 60, measure: plainMeasure })

      assertArray(result.lines, ['hello', ' world'], '词边界断行')
      assertEqual(result.lineCount, 2, 'lineCount')

      // 整串刚好放得下：不折行
      const fit = wrapLines({ text: 'hello', font: FONT, maxWidth: 50, measure: plainMeasure })

      assertArray(fit.lines, ['hello'], '整串放得下')

      return '11 字 @60px → ["hello"," world"]；50px 单行'
    }
  },
  {
    name: 'wrapLines：超长词逐字断（单词自身超宽）',
    fn: () => {
      const result = wrapLines({ text: 'abcdefghij', font: FONT, maxWidth: 35, measure: plainMeasure })

      assertArray(result.lines, ['abc', 'def', 'ghi', 'j'], '逐字断行')
      assertEqual(result.lineCount, 4, 'lineCount')

      return '10 字 @35px → ["abc","def","ghi","j"]'
    }
  },
  {
    name: 'wrapLines：缓存命中（同参数二次调用零测量；参数不同不串缓存）',
    fn: () => {
      const counter = { calls: 0 }
      const measure = countingMeasure(counter)
      const cache = createWrapCache()

      assertEqual(cache.size, 0, '初始缓存空')

      const first = wrapLines({ text: '一一一一一', font: FONT, maxWidth: 30, measure, cache, maxLines: 2 })
      const callsAfterFirst = counter.calls
      const second = wrapLines({ text: '一一一一一', font: FONT, maxWidth: 30, measure, cache, maxLines: 2 })

      assertEqual(counter.calls, callsAfterFirst, '二次调用仍触发测量')
      assertEqual(second.lineCount, first.lineCount, '缓存结果不一致')
      assertEqual(cache.size, 1, '缓存条目数')

      // maxLines 不同 → key 不同 → 重新计算
      wrapLines({ text: '一一一一一', font: FONT, maxWidth: 30, measure, cache, maxLines: 1 })

      assertEqual(cache.size, 2, 'maxLines 参与缓存 key')

      return '二次调用 measure 计数不变；key = text+font+width+maxLines'
    }
  },
  {
    name: 'wrapLines：maxLines 钳制（行数截断 + 末行 \'...\' 收缩且适配 maxWidth + clamped）',
    fn: () => {
      // 8 个 CJK 字 @30px → 未钳制 3 行；maxLines=2 → 截 2 行 + 末行收缩
      const result = wrapLines({ text: '一二三四五六七八', font: FONT, maxWidth: 30, measure: plainMeasure, maxLines: 2 })
      const unclamped = wrapLines({ text: '一二三四五六七八', font: FONT, maxWidth: 30, measure: plainMeasure })

      assertEqual(unclamped.lineCount, 3, '未钳制行数基线')
      assertEqual(result.lineCount, 2, '钳制后行数')
      assertEqual(result.clamped, true, 'clamped 标记')
      assertEqual(result.lines.length, 2, 'lines 长度')
      assert(result.lines[1].endsWith('...'), `末行以 '...' 结尾（实际 ${JSON.stringify(result.lines[1])}）`)
      assert(plainMeasure(result.lines[1]) <= 30, '末行适配 maxWidth')

      return `3 行 → 2 行，末行 ${JSON.stringify(result.lines[1])}（'...' 三点半角点，实施约束 4）`
    }
  },
  {
    name: 'wrapLines：maxLines=1 等价单行省略；maxLines ≥ 实际行数不钳制',
    fn: () => {
      const single = wrapLines({ text: '一二三四五六七八', font: FONT, maxWidth: 30, measure: plainMeasure, maxLines: 1 })

      assertEqual(single.lineCount, 1, 'maxLines=1 行数')
      assertEqual(single.clamped, true, 'maxLines=1 clamped')
      assert(single.lines[0].endsWith('...'), 'maxLines=1 末行 \'...\' 收缩')
      assert(plainMeasure(single.lines[0]) <= 30, 'maxLines=1 适配 maxWidth')

      const roomy = wrapLines({ text: '一二三', font: FONT, maxWidth: 30, measure: plainMeasure, maxLines: 5 })

      assertEqual(roomy.lineCount, 1, '行数未达上限')
      assertEqual(roomy.clamped, false, '不钳制')

      return 'maxLines=1 → 单行 + \'...\'；上限富余时 clamped=false'
    }
  },
  {
    name: 'tokenize：码点边界空白（NBSP/BOM/行分隔符/OGM/全角空格）并入词首；全角标点 CJK 单字；U+3000 空白优先',
    fn: () => {
      // P4 码点判定等价集：逐类边界码点分词与原正则实现逐字一致
      assertArray(tokenize('a\u00A0b'), ['a', '\u00A0b'], 'NBSP(0xA0) 空白并入词首')
      assertArray(tokenize('\uFEFFab'), ['\uFEFFab'], 'BOM(0xFEFF) 空白暂存并入词首')
      assertArray(tokenize('x\u2028y'), ['x', '\u2028y'], '行分隔符(0x2028) 空白并入词首')
      assertArray(tokenize('文\u1680字'), ['文', '\u1680', '字'], 'OGM(0x1680) 空白独立成词')
      assertArray(tokenize('中\u2005东'), ['中', '\u2005', '东'], 'U+2005(0x2000 段) 空白独立成词')
      assertArray(tokenize('a（b！'), ['a', '（', 'b', '！'], '全角标点(0xFF00 段) CJK 单字逐字断')
      assertArray(tokenize('한국어'), ['한', '국', '어'], '谚文(0xAC00 段) CJK 单字逐字断')

      // 判定顺序锚点：U+3000 同落空白与 CJK 区间，必须按空白处理并入后续词
      // （若换序为 CJK 优先，会得 ['一', '\u3000', 'b']）
      assertArray(tokenize('一\u3000b'), ['一', '\u3000b'], 'U+3000 空白优先并入词首')

      return 'NBSP/BOM/行分隔符/OGM/U+2005/全角标点/谚文分词等价；U+3000 空白优先'
    }
  },
  {
    name: 'wrapLines：码点空白参与断行（NBSP 词首并入断行；全角空格占宽可断行；行分隔符/BOM 并入不强制断行）',
    fn: () => {
      // NBSP 处为合法断点，行首空白并入次行词首
      const nbsp = wrapLines({ text: 'abc\u00A0def', font: FONT, maxWidth: 60, measure: plainMeasure })

      assertArray(nbsp.lines, ['abc', '\u00A0def'], 'NBSP 断行')
      assertEqual(nbsp.lineCount, 2, 'NBSP lineCount')

      // 全角空格占一个字符宽参与贪心填行（宽 30px 处断行）
      const ideographic = wrapLines({ text: '甲乙\u3000丙', font: FONT, maxWidth: 30, measure: plainMeasure })

      assertArray(ideographic.lines, ['甲乙\u3000', '丙'], '全角空格占宽断行')

      // 行分隔符/BOM 均并入词首，宽度足够时不断行
      const ls = wrapLines({ text: 'x\u2028z', font: FONT, maxWidth: 30, measure: plainMeasure })

      assertArray(ls.lines, ['x\u2028z'], '行分隔符不断行')

      const bom = wrapLines({ text: 'ab\uFEFFcdef', font: FONT, maxWidth: 50, measure: plainMeasure })

      assertArray(bom.lines, ['ab', '\uFEFFcdef'], 'BOM 断行并词首')

      return '["abc","\\u00A0def"] / ["甲乙\\u3000","丙"] / ["x\\u2028z"] / ["ab","\\uFEFFcdef"]'
    }
  },
  {
    name: 'wrapLines：超长词逐字断（全角标点边界不拆词）',
    fn: () => {
      // 10 字拉丁词 @35px 逐字断为三行 + 余量 'a'，后续全角标点（CJK 单字）
      // 与余量合并成行（词原子不拆）
      const result = wrapLines({ text: 'aaaaaaaaaa！', font: FONT, maxWidth: 35, measure: plainMeasure })

      assertArray(result.lines, ['aaa', 'aaa', 'aaa', 'a！'], '超长词逐字断 + 全角标点并入')
      assertEqual(result.lineCount, 4, 'lineCount')
      assertEqual(result.clamped, false, '不钳制')

      return '@35px：["aaa","aaa","aaa","a！"]（逐字断路径，全角标点 CJK 单字边界）'
    }
  },
  {
    name: 'wrapLines：钳制末行收缩与 maxLines=1 单行省略逐字一致；极端窄列退化为空串',
    fn: () => {
      // 同文本同宽度（@45px 折 3 行：["一二三四","五六七八","九十"]）：maxLines=1
      // 与 maxLines=2 的收缩产物同为「最大可容纳前缀 + '...'」
      const single = wrapLines({ text: '一二三四五六七八九十', font: FONT, maxWidth: 45, measure: plainMeasure, maxLines: 1 })
      const clamped = wrapLines({ text: '一二三四五六七八九十', font: FONT, maxWidth: 45, measure: plainMeasure, maxLines: 2 })

      assertEqual(single.lineCount, 1, 'maxLines=1 行数')
      assertEqual(single.lines[0], '一...', 'maxLines=1 收缩结果逐字')
      assertEqual(clamped.clamped, true, 'maxLines=2 clamped')
      assertEqual(clamped.lines.length, 2, '钳制后行数')
      assertEqual(clamped.lines[1], '五...', '钳制末行收缩逐字')
      assert(plainMeasure(clamped.lines[1]) <= 45, '末行适配 maxWidth')

      // 极端窄列：任何前缀 + '...' 均超宽且 '...' 本身超宽 → 退化空串（绘制层兜底）
      const degenerated = wrapLines({ text: '一一一一', font: FONT, maxWidth: 20, measure: plainMeasure, maxLines: 1 })

      assertEqual(degenerated.clamped, true, '窄列 clamped')
      assertEqual(degenerated.lines[0], '', 'ELLIPSIS 超宽 → 空串')

      return 'maxLines=1 → "一..."；maxLines=2 末行 → "五..."；@20px → ""'
    }
  },
  {
    name: 'createWrapCache：容量上限整体清空（WRAP_CACHE_LIMIT）',
    fn: () => {
      assertEqual(WRAP_CACHE_LIMIT, 2000, '缓存上限常量')

      const cache = createWrapCache(3)

      for (let i = 0; i < 5; i++) {
        wrapLines({ text: `文本${i}`, font: FONT, maxWidth: 30, measure: plainMeasure, cache })
      }

      assert(cache.size <= 3, `缓存超限未清空（size=${cache.size}）`)

      return `limit=3 填 5 条后 size=${cache.size}（≤3）`
    }
  }
]
