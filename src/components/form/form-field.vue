<template>
  <div
    class="mu-form-field"
    :class="{ 'mu-form-field--required': required, 'mu-form-field--invalid': invalid }"
    :label-align="labelAlignment"
    :style="size">
    <span v-if="label" class="mu-form-field__label text-ellipsis" :style="labelStyle">
      {{ label }}
    </span>
    <slot>
      <component :is="fieldInput.is" v-if="fieldInput.useModel" v-bind="fieldInput.attrs" v-model="form.model[prop]" />
      <component :is="fieldInput.is" v-else v-bind="fieldInput.attrs" />
    </slot>
    <span v-if="suffix" class="mu-form-field__suffix">{{ suffix }}</span>
  </div>
</template>

<script setup>
  import './form-field.scss'

  import { computed, inject } from 'vue'
  import { isObject } from '@/utils/type'
  import { resolveSize } from '@/utils/size'

  import { INPUT_COMPONENTS } from './input-types'

  defineOptions({ name: 'MusselFormField' })

  const props = defineProps({
    prop: String,
    input: [String, Object],
    width: [String, Number],
    label: String,
    labelWidth: String,
    labelAlign: {
      type: String,
      validator: v => ['left', 'right', 'top'].includes(v)
    },
    suffix: String,
    required: Boolean,
    invalid: Boolean
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
    const opt = isObject(props.input) ? props.input : { type: props.input }

    const {
      is,
      type = 'text',
      useModel = Boolean(form.model && props.prop),
      ...attrs
    } = opt

    const result = { is, attrs, useModel }

    if (!is) {
      const [component, params] = INPUT_COMPONENTS[type] || INPUT_COMPONENTS.text

      result.is = component
      result.attrs = { ...params, ...attrs }
    }

    return result
  })
</script>
