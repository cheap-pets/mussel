import './input.scss'

import { computed, inject } from 'vue'
import { isString, isEmpty } from '@/utils/type'

export const inputProps = {
  invalid: Boolean,
  readonly: Boolean,
  disabled: Boolean,
  placeholder: String,
  prefix: [String, Object],
  suffix: [String, Object],
  tabindex: { default: '-1' },
  clearable: {
    type: Boolean,
    default: () => inject('$mussel').options.input?.clearable
  }
}

export const inputEmits = [
  'input',
  'focus',
  'blur',
  'keydown',
  'enter',
  'esc',
  'click',
  'prefixClick',
  'suffixClick'
]

export function useInput (model, props, emit) {
  const formField = inject('formField', {})

  const wrapperAttrs = computed(() => ({
    tabindex: props.tabindex,
    disabled: props.disabled || null,
    readonly: props.readonly || null,
    invalid: props.invalid || !!formField.error || null
  }))

  const inputAttrs = computed(() => ({
    type: props.type || 'text',
    disabled: props.disabled,
    readonly: props.readonly || props.editable === false,
    placeholder: props.placeholder
  }))

  const inputEvents = {
    click: e => emit('click', e),
    input: e => emit('input', e),
    focus: e => emit('focus', e),
    blur: e => emit('blur', e),
    keydown (e) {
      emit('keydown', e)

      if (e.keyCode === 13) emit('enter', e)
      else if (e.keyCode === 27) emit('esc', e)
    }
  }

  const clearButtonAttrs = {
    class: 'mu-input__clear-button',
    tag: 'a',
    icon: 'x'
  }

  const clearButtonVisible = computed(() =>
    props.clearable &&
    !props.disabled &&
    !props.readonly &&
    !isEmpty(model.value, { skipBoolean: true })
  )

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
      Object.assign(opts, { class: `mu-input__${affixType}` })
    )
  }

  const prefix = computed(() => resolveAffixComponent('prefix', props.prefix))
  const suffix = computed(() => resolveAffixComponent('suffix', props.suffix))

  function onPrefixClick (event) {
    emit('prefixClick')
  }

  function onSuffixClick (event) {
    emit('suffixClick')
  }

  function clear (v = null) {
    model.value = v
  }

  return {
    wrapperAttrs,
    inputAttrs,
    inputEvents,
    prefix,
    suffix,
    onPrefixClick,
    onSuffixClick,
    clearButtonVisible,
    clearButtonAttrs,
    clear
  }
}
