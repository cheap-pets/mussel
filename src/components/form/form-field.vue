<template>
  <div
    class="mu-form-field"
    :class="{ 'mu-form-field--required': fieldRequired, 'mu-form-field--invalid': !!fieldError }"
    :label-align="labelAlignment"
    :style="size">
    <span v-if="label" class="mu-form-field__label text-ellipsis" :style="labelStyle">
      {{ label }}
    </span>
    <slot>
      <component :is="fieldInput.is" v-if="fieldInput.vModel" v-bind="fieldInput.attrs" v-model="form.model[prop]" />
      <component :is="fieldInput.is" v-else v-bind="fieldInput.attrs" />
    </slot>
    <span v-if="suffix" class="mu-form-field__suffix">{{ suffix }}</span>
  </div>
</template>

<script setup>
  import './form-field.scss'

  import { computed, inject, watch } from 'vue'

  import { isObject } from '@/utils/type'
  import { resolveSize } from '@/utils/size'

  import { INPUT_TYPES } from './input-types'

  defineOptions({ name: 'MusselFormField' })

  const props = defineProps({
    prop: String,
    input: [String, Object],
    width: [String, Number],
    label: String,
    labelWidth: String,
    labelAlign: { type: String, validator: v => ['left', 'right', 'top'].includes(v) },
    suffix: String,
    required: Boolean,
    error: [Boolean, String]
  })

  const form = inject('form', {})

  const size = computed(() => ({
    width: resolveSize(props.width),
    height: resolveSize(props.height)
  }))

  const labelAlignment = computed(() =>
    props.labelAlign || form.labelAlign || null
  )

  const labelStyle = computed(() => ({
    width: labelAlignment.value === 'top'
      ? undefined
      : resolveSize(props.labelWidth || form.labelWidth)
  }))

  const fieldInput = computed(() => {
    const { prop, input } = props

    const vModel = Boolean(form.model && prop)
    const inputOption = isObject(input) ? input : { type: input }

    const { is, type = 'text', ...attrs } = inputOption

    if (is) {
      return { vModel, is, attrs }
    }

    const [component, params] = INPUT_TYPES[type] || INPUT_TYPES.text

    return {
      vModel,
      is: component,
      attrs: { ...params, ...attrs }
    }
  })

  const fieldRule = computed(() =>
    form.rules?.[props.prop]
  )

  const fieldRequired = computed(() =>
    props.required || !!fieldRule.value?.find(el => el.required)
  )

  const fieldError = computed(() =>
    props.error || form.errors[props.prop]
  )

  watch(
    () => props.label,
    label => form.setLabel(props.prop, label),
    { immediate: true }
  )
</script>
