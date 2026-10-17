import './split-box.scss'

import { reactive, computed, watch, inject } from 'vue'

import { kebabCase } from '@/utils/case.js'
import { warnDeprecated } from '@/utils/warn.js'
import { resolveSize } from '@/utils/size.js'
import { defaults, pick } from '@/utils/object.js'

const SPLIT_H_SIDES = { start: 'left', end: 'right' }
const SPLIT_V_SIDES = { start: 'top', end: 'bottom' }

const componentSides = {
  SplitHBox: SPLIT_H_SIDES,
  SplitVBox: SPLIT_V_SIDES
}

// 合法选项键：除 dblclickAction（box 层消费）外均为 splitter props，可整体 v-bind
const OPTION_KEYS = [
  'size',
  'shape',
  'visibility',
  'resizable',
  'collapsible',
  'collapseHandle',
  'dblclickAction'
]

// 全部选项均缺席即默认：渲染类键（size/shape/visibility/resizable/collapsible/collapseHandle）
// 由 splitter 组件自身 props 默认值兜底；dblclickAction 缺席视为 true（onSplitterDblclick 显式判 false）

// splitter 相关 props（新 API + 废弃兼容），按侧名生成
function createSplitterProps ({ start, end }) {
  const sideValues = [false, true, start, end]

  return {
    splitter: Object,
    [`${start}Splitter`]: { type: [Boolean, Object], default: true },
    [`${end}Splitter`]: { type: [Boolean, Object], default: true },
    resizable: {
      type: [Boolean, String],
      default: undefined,
      validator: v => sideValues.includes(v)
    },
    collapsible: {
      type: [Boolean, String],
      default: undefined,
      validator: v => sideValues.includes(v)
    },
    splitterSize: String,
    splitterShape: String,
    splitterCollapseHandle: { type: Boolean, default: undefined },
    splitterDblclickReset: { type: Boolean, default: undefined }
  }
}

export const hSplitterProps = createSplitterProps(SPLIT_H_SIDES)
export const vSplitterProps = createSplitterProps(SPLIT_V_SIDES)

// 透传给 splitter 的 props：剥离 dblclickAction（box 层消费）
function toSplitterProps (options) {
  const { dblclickAction, ...splitterProps } = options

  return splitterProps
}

export function useSplitBox (component, props) {
  const globalOptions = inject('$mussel', null)?.options?.splitter
  const sides = componentSides[component]

  const splitterPropNames = {
    start: `${sides.start}Splitter`,
    end: `${sides.end}Splitter`
  }

  function isSideEnabled (value, side) {
    return [true, sides[side]].includes(value)
  }

  function warnDeprecatedProps () {
    const alternatives = {
      resizable: `${sides.start}-splitter / ${sides.end}-splitter`,
      collapsible: `splitter.collapsible / ${sides.start}-splitter.collapsible`,
      splitterSize: 'splitter.size',
      splitterShape: 'splitter.shape',
      splitterCollapseHandle: 'splitter.collapseHandle',
      splitterDblclickReset: 'splitter.dblclickAction'
    }

    Object.entries(alternatives).forEach(([name, alternative]) =>
      props[name] !== undefined &&
      warnDeprecated({ component, deprecated: kebabCase(name), alternative })
    )
  }

  warnDeprecatedProps()

  function resolveLegacyOptions (side) {
    const options = {}

    // 显式传入时总是写入布尔结果：旧 prop 压过全局默认，又被新 API（splitter / 侧对象）覆盖
    if (props.collapsible !== undefined) {
      options.collapsible = isSideEnabled(props.collapsible, side)
    }

    if (props.resizable !== undefined) {
      options.resizable = isSideEnabled(props.resizable, side)
    }

    if (props.splitterSize !== undefined) options.size = props.splitterSize
    if (props.splitterShape !== undefined) options.shape = props.splitterShape
    if (props.splitterCollapseHandle !== undefined) options.collapseHandle = props.splitterCollapseHandle
    if (props.splitterDblclickReset !== undefined) options.dblclickAction = props.splitterDblclickReset

    return options
  }

  function resolveOptions (side) {
    // defaults 先到先得，按优先级倒序传入：
    // 侧对象 > splitter > 旧 prop 兼容值 > 全局（$mussel.options.splitter）
    return defaults(
      {},
      pick(props[splitterPropNames[side]], OPTION_KEYS),
      pick(props.splitter, OPTION_KEYS),
      resolveLegacyOptions(side),
      pick(globalOptions, OPTION_KEYS)
    )
  }

  function hasSplitter (side) {
    const sideSplitterOptions = props[splitterPropNames[side]]

    return !(
      sideSplitterOptions === false ||
      (props.resizable !== undefined && !isSideEnabled(props.resizable, side))
    )
  }

  const startOptions = computed(() => resolveOptions('start'))
  const endOptions = computed(() => resolveOptions('end'))

  const hasStartSplitter = computed(() => hasSplitter('start'))
  const hasEndSplitter = computed(() => hasSplitter('end'))

  const startSplitterProps = computed(() => toSplitterProps(startOptions.value))
  const endSplitterProps = computed(() => toSplitterProps(endOptions.value))

  const initialSize = reactive({})
  const currentSize = reactive({})
  const collapsed = reactive({ start: false, end: false })

  const startSizeStyle = computed(() => ({ flexBasis: currentSize.start, display: collapsed.start ? 'none' : undefined }))
  const endSizeStyle = computed(() => ({ flexBasis: currentSize.end, display: collapsed.end ? 'none' : undefined }))

  function init (startSize, endSize) {
    initialSize.start = currentSize.start = resolveSize(startSize)
    initialSize.end = currentSize.end = resolveSize(endSize)
  }

  function updateCollapsed (target, size) {
    const options = target === 'start' ? startOptions.value : endOptions.value

    collapsed[target] = !size && !!options.collapsible
  }

  function reset (target) {
    if (initialSize[target]) {
      updateCollapsed(target, currentSize[target] = initialSize[target])
    }
  }

  function resize (target, size) {
    // 收拢（空尺寸）不清除尺寸记录：保留收拢前宽度，展开时恢复
    if (size) currentSize[target] = size
    updateCollapsed(target, size)
  }

  function toggle (target) {
    // 展开仅翻转状态：currentSize 在收拢时未被清除，即收拢前宽度
    if (collapsed[target]) collapsed[target] = false
    else updateCollapsed(target, '')
  }

  const preview = reactive({ start: false, end: false })

  function onSplitterDblclick (target) {
    const options = target === 'start' ? startOptions.value : endOptions.value

    if (options.dblclickAction === false) return

    if (options.resizable) reset(target)
    else if (options.collapsible) toggle(target)
  }

  // 分隔条消失或折叠能力被关闭时，把对应面板复位为初始尺寸
  watch(
    [
      hasStartSplitter,
      () => startOptions.value.collapsible,
      hasEndSplitter,
      () => endOptions.value.collapsible
    ],
    () => {
      if (!hasStartSplitter.value || !startOptions.value.collapsible) reset('start')
      if (!hasEndSplitter.value || !endOptions.value.collapsible) reset('end')
    }
  )

  return {
    startSizeStyle,
    endSizeStyle,
    collapsed,
    preview,
    startSplitterProps,
    endSplitterProps,
    hasStartSplitter,
    hasEndSplitter,
    init,
    resize,
    toggle,
    onSplitterDblclick
  }
}
