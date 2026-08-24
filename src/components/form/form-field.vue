<template>
  <div
    class="mu-form-field"
    :class="{ 'mu-form-field--required': fieldRequired, 'mu-form-field--invalid': !!fieldError }"
    :label-align="labelAlignment"
    :style="size">
    <label v-if="label" class="mu-form-field__label" :style="labelStyle">
      <span class="text-ellipsis">{{ label }}</span>
    </label>
    <div class="mu-form-field__input">
      <slot>
        <component :is="control.is" v-if="control.vModel" v-bind="control.attrs" v-model="form.model[prop]" />
        <component :is="control.is" v-else v-bind="control.attrs" />
      </slot>
      <span v-if="fieldError && fieldError !== true" class="mu-form-field__error text-ellipsis">{{ fieldError }}</span>
    </div>
    <span v-if="suffix" class="mu-form-field__suffix">{{ suffix }}</span>
  </div>
</template>

<script setup>
  import './form-field.scss'

  import { reactive, computed, provide, inject, watch, onBeforeUnmount } from 'vue'

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
    required: Boolean,
    suffix: String,
    error: [Boolean, String]
  })

  const form = inject('form', {})

  const size = computed(() => ({
    width: resolveSize(props.width)
  }))

  const labelAlignment = computed(() =>
    props.labelAlign || form.labelAlign || null
  )

  const labelStyle = computed(() => ({
    width: labelAlignment.value === 'top'
      ? undefined
      : resolveSize(props.labelWidth || form.labelWidth)
  }))

  const control = computed(() => {
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
    props.required || fieldRule.value?.required
  )

  const fieldError = computed(() =>
    props.error || form.errors?.[props.prop]
  )

  provide('formField', reactive({
    error: fieldError,
    validate: () => props.prop && form.validateField?.(props.prop)
  }))

  watch(
    () => props.required,
    value => form.setRequired?.(props.prop, value),
    { immediate: true }
  )

  watch(
    () => props.label,
    value => form.setLabel?.(props.prop, value),
    { immediate: true }
  )

  onBeforeUnmount(() => {
    form.setRequired?.(props.prop)
    form.setLabel?.(props.prop)
  })
</script>
