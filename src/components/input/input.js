import { computed } from 'vue'
import { isString } from '@/utils/type'

export const inputProps = {
  readonly: Boolean,
  disabled: Boolean,
  clearable: Boolean,
  placeholder: String,
  prefix: [String, Object],
  suffix: [String, Object],
  tabindex: { default: '-1' }
}

export const inputEvents = [
  'prefixClick',
  'suffixClick'
]

export function useInput (model, props, emit) {
  const wrapperAttrs = computed(() => ({
    tabindex: props.tabindex,
    disabled: props.disabled || null,
    readonly: props.readonly || null
  }))

  const inputAttrs = computed(() => ({
    type: props.type || 'text',
    disabled: props.disabled,
    readonly: props.readonly || props.editable === false,
    placeholder: props.placeholder
  }))

  const AffixResolver = {
    icon: ({ value, ...attrs }) => ({ is: 'mu-icon', attrs: { icon: value, ...attrs } }),
    tool: ({ value, ...attrs }) => ({ is: 'mu-icon', attrs: { tag: 'a', icon: value, ...attrs } }),
    text: ({ value, ...attrs }) => ({ is: 'span', content: value, attrs }),
    link: ({ value, ...attrs }) => ({ is: 'a', content: value, attrs })
  }

  const AFFIX_PATTERN = /^:(?<type>icon|text|tool|link)?=(?<value>.+)?$/

  function resolveAffixComponent (affixType, option) {
    if (!option) return

    const { type = 'text', ...opts } = isString(option)
      ? AFFIX_PATTERN.exec(option)?.groups || { value: option }
      : Object(option)

    return AffixResolver[type]?.(
      Object.assign(opts, { class: `mu-input_${affixType}` })
    )
  }

  const prefix = computed(() => resolveAffixComponent('prefix', props.prefix))
  const suffix = computed(() => resolveAffixComponent('suffix', props.suffix))

  function onPrefixClick () {
    emit('prefixClick')
  }

  function onSuffixClick () {
    emit('suffixClick')
  }

  const clearButtonAttrs = {
    class: 'mu-input_clear-button',
    tag: 'a',
    icon: 'x'
  }

  const clearButtonVisible = computed(() =>
    !props.disabled &&
    !props.readonly &&
    props.clearable &&
    model.value != null &&
    model.value !== ''
  )

  return {
    wrapperAttrs,
    inputAttrs,
    prefix,
    suffix,
    onPrefixClick,
    onSuffixClick,
    clearButtonVisible,
    clearButtonAttrs
  }
}
