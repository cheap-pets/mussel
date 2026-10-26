/**
 * canvas-table 自检断言 — theme 模块（G1-b）。
 *
 * 覆盖 02-design.md G1-b 判据：快照 20 固定字段计数（14 色 + 字号/字体 + 4 尺寸，
 * 含 bgStrong/textColorMuted/bgDisabled；controlHeight 已随 C3 死代码清理移除）+ colors 固定
 * 17 色形态（12 彩色 + 5 语义，gray 不入，每色 color+translucent 双形态）+
 * bgStrong 半透明形态；另含 readVar/readFont/readPx 输出合法颜色计算值与 px 数、
 * withAlpha、测量缓存容量上限、createTextMeasurer 测量工厂、观察根解析
 * （closest('.mu-root') 与组件根）、watcher 接线（refresh 同步通知 / destroy 清理）、
 * snapshotsEqual 快照相等判定（mutation 变更抑制门控，verify-1 失败项 1 回归）。
 *
 * 尺寸变量来自自检容器内联声明（style="--row-height: 36px"），不依赖
 * canvas-table.scss（该文件 G2 才改动）。断言只校验取值形态与级联覆盖，
 * 不校验具体色值（页面明暗主题均可通过）；颜色形态不写死 rgb()/rgba()——
 * 相对色变量求值序列化因浏览器而异（本机 Chrome 为 color(srgb ...)），
 * 以「任一合法 CSS 颜色形态」判定（assertValidCssColor）。
 */
import {
  MEASURE_CACHE_LIMIT,
  createMeasureCache,
  createProbe,
  createTextMeasurer,
  createThemeWatcher,
  parseColor,
  readFont,
  readInheritedFontSize,
  readPx,
  readSnapshot,
  readVar,
  resolveObserverRoots,
  snapshotsEqual,
  withAlpha
} from '../../../../../src/components/canvas-table/theme.js'

// G1-a 阶段 scss 未创建，四个尺寸变量由自检容器内联声明（值与 table.scss 镜像一致）
const SIZE_VARS =
  '--row-height: 36px; --head-row-height: 36px; --cell-padding: 8px; --cell-line-height: 20px;'

// colors 固定色板独立口径（A6.1：色名集合 = tag.scss:28-45 色类体系，gray 不入）
const EXPECTED_BASE_COLORS = [
  'red', 'pink', 'grape', 'violet', 'indigo', 'blue',
  'cyan', 'teal', 'green', 'lime', 'yellow', 'orange'
]
const EXPECTED_SEMANTIC_COLORS = ['primary', 'secondary', 'success', 'warning', 'danger']

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

/**
 * 求值结果为任一合法 CSS 颜色形态即可（rgb()/rgba() 或 color(srgb ...)）：
 * 不同浏览器对相对色变量的序列化不同（本机 Chrome 实测为 color(srgb ...)），
 * 不写死形态；仍须排除 token 串（含 var( 的求值前原文）。
 */
function assertValidCssColor (value, name) {
  assert(typeof value === 'string' && value.length > 0, `${name} 计算值为空`)
  assert(!value.includes('var('), `${name} 仍为 token 串未求值：「${value}」`)
  assert(CSS.supports('color', value), `${name} 不是合法 CSS 颜色形态：「${value}」`)
}

/** 挂载临时夹具容器（document.body 在 demo 下带 .mu-root，变量作用域可用），用后移除 */
function withFixture (extraStyles, run) {
  const fixture = document.createElement('div')

  fixture.style.cssText = SIZE_VARS + (extraStyles || '')
  document.body.appendChild(fixture)

  try {
    return run(fixture)
  } finally {
    fixture.remove()
  }
}

/** 相对色语法变量（--mu-gray-translucent）：token 串须经真实属性求值为合法颜色 */
function checkRelativeColorVar () {
  return withFixture('', fixture => {
    const probe = createProbe(fixture)
    const computed = readVar(probe, '--mu-gray-translucent')
    const raw = getComputedStyle(probe).getPropertyValue('--mu-gray-translucent').trim()

    assertValidCssColor(computed, '--mu-gray-translucent')
    assert(computed !== raw, `相对色变量未求值：计算值与 token 串相同「${computed}」`)

    // 半透明变量叠加前 alpha < 1（明 0.1 / 暗 0.2），withAlpha 透明度叠加才有意义；
    // alpha 经 parseColor 提取（同时覆盖 rgb()/color(srgb) 两种形态的解析）
    const parsed = parseColor(computed)
    assert(parsed && parsed.a < 1, `半透明变量应可解析且 alpha < 1，实际「${computed}」`)

    probe.remove()
    return `${computed}（alpha=${parsed.a}）`
  })
}

export const checks = [
  {
    name: 'createProbe：隐藏探针挂载 host 且可布局',
    fn: () =>
      withFixture('', fixture => {
        const probe = createProbe(fixture)

        assert(probe.parentNode === fixture, '探针未挂载到 host')
        assert(probe.getAttribute('aria-hidden') === 'true', '探针缺 aria-hidden')
        assert(probe.style.visibility === 'hidden', '探针须 visibility:hidden（display:none 不可布局）')
        assert(probe.style.pointerEvents === 'none', '探针须 pointer-events:none')
        assert(probe.style.width === '0px' && probe.style.height === '0px', '探针须 0 尺寸')

        probe.remove()
        return '探针挂载并可布局'
      })
  },
  {
    name: 'readVar：--mu-* 颜色变量读取为 rgb()/rgba() 计算值',
    fn: () =>
      withFixture('', fixture => {
        const probe = createProbe(fixture)
        const primary = readVar(probe, '--mu-primary-color')

        assertValidCssColor(primary, '--mu-primary-color')

        for (const name of [
          '--mu-text-color-normal', '--mu-border-color-normal', '--mu-border-color-soft',
          '--mu-border-color-strong', '--mu-bg-normal', '--mu-bg-fill', '--mu-bg-stripe',
          '--mu-primary-faint', '--mu-gray'
        ]) {
          assertValidCssColor(readVar(probe, name), name)
        }

        probe.remove()
        return `primary=${primary}`
      })
  },
  {
    name: 'readVar：相对色语法变量（--mu-gray-translucent）经真实属性求值',
    fn: checkRelativeColorVar
  },
  {
    name: 'readPx：内联声明的尺寸变量解析为 px 数（含嵌套覆盖级联）',
    fn: () =>
      withFixture('', outer => {
        const outerProbe = createProbe(outer)

        assert(readPx(outerProbe, '--row-height') === 36, '--row-height 应为 36')
        assert(readPx(outerProbe, '--head-row-height') === 36, '--head-row-height 应为 36')
        assert(readPx(outerProbe, '--cell-padding') === 8, '--cell-padding 应为 8')
        assert(readPx(outerProbe, '--cell-line-height') === 20, '--cell-line-height 应为 20')

        // 嵌套容器内联覆盖（对应 demo「--row-height 覆盖」夹具的读取层机制）
        const inner = document.createElement('div')
        inner.style.cssText = '--row-height: 48px;'
        outer.appendChild(inner)

        const innerProbe = createProbe(inner)
        assert(readPx(innerProbe, '--row-height') === 48, '内层覆盖后 --row-height 应为 48')
        assert(readPx(outerProbe, '--row-height') === 36, '外层 --row-height 不受内层覆盖影响')

        outerProbe.remove()
        innerProbe.remove()
        return 'outer=36 / inner override=48 / padding=8 / line-height=20'
      })
  },
  {
    name: 'readFont：字体族 token 原样读取（不走 color 求值路径）',
    fn: () =>
      withFixture('', fixture => {
        const probe = createProbe(fixture)
        const font = readFont(probe, '--mu-font-sans')
        const raw = getComputedStyle(probe).getPropertyValue('--mu-font-sans').trim()

        assert(typeof font === 'string' && font.length > 0, '--mu-font-sans 读取为空')
        assert(font === raw, `readFont 应返回 token 原文，实际「${font}」≠「${raw}」`)
        assert(!font.startsWith('rgb'), '字体族不应走 color 求值路径（m1 回归）')

        probe.remove()
        return font
      })
  },
  {
    name: 'readInheritedFontSize：继承父链计算字号',
    fn: () =>
      withFixture('', fixture => {
        const probe = createProbe(fixture)
        const base = readInheritedFontSize(probe)

        assert(base > 0, `继承字号应为正数，实际 ${base}`)

        const sized = document.createElement('div')
        sized.style.cssText = 'font-size: 18px;'
        fixture.appendChild(sized)

        const sizedProbe = createProbe(sized)
        assert(readInheritedFontSize(sizedProbe) === 18, '父级 font-size:18px 时应读到 18')

        probe.remove()
        sizedProbe.remove()
        return `base=${base} / 18px 父链下=18`
      })
  },
  {
    name: 'withAlpha：rgb()/rgba()/color(srgb) → 指定 alpha 的 rgba()，非法输入原样返回',
    fn: () => {
      assert(
        withAlpha('rgb(51, 51, 51)', 0.5) === 'rgba(51, 51, 51, 0.5)',
        'rgb() 叠加失败：' + withAlpha('rgb(51, 51, 51)', 0.5)
      )
      assert(
        withAlpha('rgba(0, 0, 0, 0.04)', 0.6) === 'rgba(0, 0, 0, 0.6)',
        'rgba() 应替换而非叠加 alpha'
      )
      // 相对色变量在 Chrome 求值为 color(srgb ...) 形态：分量 0-1 → 0-255
      assert(
        withAlpha('color(srgb 0.482 0.510 0.533 / 0.1)', 0.5) === 'rgba(123, 130, 136, 0.5)',
        'color(srgb) 叠加失败：' + withAlpha('color(srgb 0.482 0.510 0.533 / 0.1)', 0.5)
      )
      assert(
        withAlpha('color(srgb 0 0 0)', 0.25) === 'rgba(0, 0, 0, 0.25)',
        'color(srgb) 缺省 alpha 应按 1 解析分量'
      )
      assert(withAlpha('var(--unknown)', 0.5) === 'var(--unknown)', 'token 串应原样返回')
      assert(withAlpha('not-a-color', 0.5) === 'not-a-color', '非法颜色串应原样返回')

      // parseColor：两种形态的分量与 alpha 解析，非法输入返回 null
      assert(
        JSON.stringify(parseColor('rgba(10, 20, 30, 0.5)')) ===
          JSON.stringify({ r: 10, g: 20, b: 30, a: 0.5 }),
        'parseColor rgba() 解析失败'
      )
      assert(
        JSON.stringify(parseColor('color(srgb 1 0.5 0 / 0.2)')) ===
          JSON.stringify({ r: 255, g: 128, b: 0, a: 0.2 }),
        'parseColor color(srgb) 解析失败'
      )
      assert(parseColor('not-a-color') === null, 'parseColor 非法输入应返回 null')

      return 'rgb / rgba / color(srgb)×2 / 非法输入 + parseColor 三态通过'
    }
  },
  {
    name: 'readSnapshot：快照 20 固定字段齐全，颜色/字号/字体/尺寸形态正确',
    fn: () =>
      withFixture('', fixture => {
        const probe = createProbe(fixture)
        const snapshot = readSnapshot(probe)

        const colorKeys = [
          'textColor', 'textColorMuted', 'borderColor', 'borderColorSoft', 'borderColorStrong',
          'bgNormal', 'bgFill', 'bgStripe', 'bgStrong', 'bgDisabled',
          'selectBg', 'hoverBg', 'primaryColor', 'gray'
        ]
        const pxKeys = { rowHeight: 36, headHeight: 36, cellPadding: 8, cellLineHeight: 20 }

        for (const key of colorKeys) {
          assertValidCssColor(snapshot[key], `快照.${key}`)
        }

        assert(snapshot.fontSize > 0, `快照.fontSize 应为正数，实际 ${snapshot.fontSize}`)
        assert(
          typeof snapshot.fontFamily === 'string' && snapshot.fontFamily.length > 0,
          '快照.fontFamily 应为非空字符串'
        )

        for (const [key, expected] of Object.entries(pxKeys)) {
          assert(snapshot[key] === expected, `快照.${key} 应为 ${expected}，实际 ${snapshot[key]}`)
        }

        assert(snapshot.colors && typeof snapshot.colors === 'object', '快照.colors 缺失')

        // 20 固定字段（14 色 + 字号/字体 + 4 尺寸）+ colors map = 21 键
        const fixedCount = colorKeys.length + 2 + Object.keys(pxKeys).length
        assert(fixedCount === 20, `固定字段计数口径应为 20，实际 ${fixedCount}`)
        assert(
          Object.keys(snapshot).length === fixedCount + 1,
          `快照应含 ${fixedCount + 1} 个键（20 固定字段 + colors），实际 ${Object.keys(snapshot).length}`
        )

        probe.remove()
        return `${Object.keys(snapshot).length} 键：20 固定字段（14 色 + 字号/字体 + 4 尺寸）+ colors`
      })
  },
  {
    name: 'readSnapshot：bgStrong/bgDisabled 半透明形态，textColorMuted 色形态',
    fn: () =>
      withFixture('', fixture => {
        const probe = createProbe(fixture)
        const snapshot = readSnapshot(probe)

        // bgStrong / bgDisabled 定义为 rgba 半透明（明暗双态 alpha 0.08/0.12 < 1）：
        // 半透明形态是 progress 轨道、check disabled 底衬等叠绘正确的前提
        for (const key of ['bgStrong', 'bgDisabled']) {
          assertValidCssColor(snapshot[key], `快照.${key}`)
          const parsed = parseColor(snapshot[key])
          assert(parsed && parsed.a < 1, `快照.${key} 应为半透明（alpha < 1），实际「${snapshot[key]}」`)
        }

        // textColorMuted（--mu-text-color-muted）为不透明语义灰，只断合法色形态
        assertValidCssColor(snapshot.textColorMuted, '快照.textColorMuted')

        probe.remove()
        return `bgStrong alpha=${parseColor(snapshot.bgStrong).a} / bgDisabled alpha=${parseColor(snapshot.bgDisabled).a} / textColorMuted 合法色`
      })
  },
  {
    name: 'readSnapshot.colors：固定 17 色（12 彩色 + 5 语义，gray 不入）双形态',
    fn: () =>
      withFixture('', fixture => {
        const probe = createProbe(fixture)
        const { colors } = readSnapshot(probe)
        const names = Object.keys(colors)
        const expected = [...EXPECTED_BASE_COLORS, ...EXPECTED_SEMANTIC_COLORS]

        assert(names.length === 17, `colors 应为固定 17 色，实际 ${names.length}：${names.join(',')}`)
        assert(
          names.every(name => expected.includes(name)),
          'colors 含色板外色名'
        )
        for (const name of expected) {
          assert(names.includes(name), `colors 缺色名 ${name}`)
        }
        assert(!('gray' in colors), 'gray 不应入 colors map（绘制回退色，tag.scss 口径）')

        for (const name of expected) {
          const entry = colors[name]

          assert(entry && typeof entry === 'object', `colors.${name} 应为 { color, translucent } 对象`)
          assertValidCssColor(entry.color, `colors.${name}.color`)
          assertValidCssColor(entry.translucent, `colors.${name}.translucent`)

          // translucent（明态 0.1 / 暗态 0.2）半透明是 tag/button 底色叠绘正确的前提
          const parsed = parseColor(entry.translucent)
          assert(
            parsed && parsed.a < 1,
            `colors.${name}.translucent 应为半透明（alpha < 1），实际「${entry.translucent}」`
          )
        }

        probe.remove()
        return '17 色（12 彩 + 5 语义）color+translucent 双形态、gray 不入、translucent 半透明'
      })
  },
  {
    name: 'createTextMeasurer：离屏 canvas 测量 measure(text, font)，缓存命中与 font 区分',
    fn: () => {
      const measure = createTextMeasurer()
      const font = '14px sans-serif'

      const width = measure('hello', font)
      assert(typeof width === 'number' && width > 0 && Number.isFinite(width), `测量宽度应为正有限数，实际 ${width}`)
      assert(measure('hello', font) === width, '相同 text+font 应命中缓存（宽度一致）')
      assert(measure('hello', '12px sans-serif') !== width, '不同 font 应重新测量')

      const longer = measure('hello world, longer text sample', font)
      assert(longer > width, `更长文本应测得更宽，实际 ${longer} ≤ ${width}`)

      return `hello=${width.toFixed(1)}px / 缓存命中 / 换 font 重测 / 长文本=${longer.toFixed(1)}px`
    }
  },
  {
    name: 'resolveObserverRoots：closest(.mu-root) 与组件根均入集合（含去重与兜底）',
    fn: () => {
      // 常规：组件根在 .mu-root 内 → 两个观察目标
      const fakeRoot = document.createElement('div')
      fakeRoot.className = 'mu-root'
      const mid = document.createElement('div')
      const host = document.createElement('div')
      mid.appendChild(host)
      fakeRoot.appendChild(mid)

      const roots = resolveObserverRoots(host)
      assert(roots.size === 2, `常规场景应含 2 个观察根，实际 ${roots.size}`)
      assert(roots.has(fakeRoot) && roots.has(host), '观察根应含 .mu-root 祖先与组件根自身')

      // mu-dark 直接挂组件根（组件根本身即 .mu-root）→ Set 去重为 1 个
      const selfRoot = document.createElement('div')
      selfRoot.className = 'mu-root'
      const selfRoots = resolveObserverRoots(selfRoot)
      assert(selfRoots.size === 1, `组件根即 .mu-root 时应去重为 1 个，实际 ${selfRoots.size}`)

      // 无 .mu-root 祖先 → 兜底 documentElement + 组件根
      const orphan = document.createElement('div')
      const orphanRoots = resolveObserverRoots(orphan)
      assert(
        orphanRoots.size === 2 && orphanRoots.has(document.documentElement) && orphanRoots.has(orphan),
        '无 .mu-root 祖先时应兜底 documentElement'
      )

      return '常规 2 / 自身去重 1 / 兜底 documentElement'
    }
  },
  {
    name: 'createThemeWatcher：探针/快照/观察根接线，refresh 同步通知，destroy 清理',
    fn: () =>
      withFixture('', fixture => {
        const changes = []
        const watcher = createThemeWatcher({
          probeHost: fixture,
          componentRoot: fixture,
          onChange: (snapshot, reason) => changes.push({ snapshot, reason })
        })

        try {
          assert(watcher.probe.parentNode === fixture, '探针未挂载到 probeHost')
          assert(watcher.roots.has(fixture), '观察根应含组件根')
          assert(watcher.snapshot && typeof watcher.snapshot === 'object', '初始快照缺失')

          watcher.refresh('test')
          assert(changes.length === 1, `refresh 应同步通知一次 onChange，实际 ${changes.length} 次`)
          assert(changes[0].reason === 'test', 'refresh 的 reason 未透传 onChange')
          assert(changes[0].snapshot === watcher.snapshot, 'onChange 收到的快照与当前快照不一致')
        } finally {
          watcher.destroy()
        }

        assert(watcher.probe.isConnected === false, 'destroy 未移除探针')

        return `refresh 通知 ${changes.length} 次（${changes[0]?.reason}），destroy 已清理`
      })
  },
  {
    name: 'snapshotsEqual：快照相等判定（mutation 变更抑制门控，verify-1 失败项 1 回归）',
    fn: () =>
      withFixture('', fixture => {
        const probe = createProbe(fixture)
        const a = readSnapshot(probe)
        const b = readSnapshot(probe)

        assert(snapshotsEqual(a, b), '同环境两次快照应相等（滚动状态 class 翻转场景重读不变）')
        assert(snapshotsEqual(a, a), '同引用应相等（短路路径）')
        assert(!snapshotsEqual(a, null) && !snapshotsEqual(null, a), '空值应判不等')
        assert(
          !snapshotsEqual({ ...a, fontSize: a.fontSize + 1 }, a),
          '固定字段（fontSize）变化应判不等'
        )

        // colors 维度：单色 color 变化判不等；浅拷贝同色值相等；键集合不一致防护
        const singleColorChanged = {
          ...a,
          colors: { ...a.colors, primary: { ...a.colors.primary, color: 'rgb(1, 2, 3)' } }
        }

        assert(!snapshotsEqual(a, singleColorChanged), 'colors 单色 color 变化应判不等')

        const translucentChanged = {
          ...a,
          colors: { ...a.colors, success: { ...a.colors.success, translucent: 'rgba(0,0,0,0.9)' } }
        }

        assert(!snapshotsEqual(a, translucentChanged), 'colors 单色 translucent 变化应判不等')

        const shallowCopied = { ...a, colors: { ...a.colors } }

        assert(snapshotsEqual(a, shallowCopied), 'colors 浅拷贝（同色值）应相等')

        const missingColors = {}

        for (const key of Object.keys(a)) {
          if (key !== 'colors') missingColors[key] = a[key]
        }

        assert(!snapshotsEqual(a, missingColors), '键集合不一致（缺 colors）应判不等')

        probe.remove()
        return '同环境相等 / 同引用 / 空值 / fontSize / colors 单色两维度 / 浅拷贝 / 键集合'
      })
  },
  {
    name: 'createMeasureCache：相同 text+font 命中缓存，超上限整体清空',
    fn: () => {
      assert(MEASURE_CACHE_LIMIT === 2000, `缓存上限应为 2000，实际 ${MEASURE_CACHE_LIMIT}`)

      let calls = 0
      const measure = text => {
        calls++
        return text.length * 10
      }
      const measureText = createMeasureCache(measure)

      assert(measureText('a', 'f1') === 10 && calls === 1, '首次应真实测量')
      assert(measureText('a', 'f1') === 10 && calls === 1, '相同 text+font 未命中缓存')
      assert(measureText('a', 'f2') === 10 && calls === 2, '不同 font 应重新测量（key 含 font）')

      // 填满至上限：最早的条目被整体清空，再次读取须重新测量
      for (let i = 0; i < MEASURE_CACHE_LIMIT; i++) measureText('k' + i, 'f2')
      const before = calls
      measureText('a', 'f1')
      assert(calls === before + 1, '超过容量上限后未清空缓存（早条目仍命中）')

      return `上限 ${MEASURE_CACHE_LIMIT} 条；命中/换 font/超限清空 三类通过`
    }
  }
]
