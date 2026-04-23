<template>
  <div
    class="mu-form-field"
    :class="{
      'mu-form-field--required': required,
      'mu-form-field--invalid': invalid
    }"
    :label-align="labelAlignment"
    :style="style">
    <label v-if="label" class="mu-form-field__label text-ellipsis" :style="labelStyle">
      {{ label }}
    </label>
    <slot />
  </div>
</template>

<script setup>
  import './form-field.scss'

  import { computed, inject } from 'vue'
  import { resolveSize } from '@/utils/size'
  import { useSize } from '@/components/common-hooks/size'

  defineOptions({ name: 'MusselFormField' })

  const props = defineProps({
    label: String,
    labelWidth: String,
    labelAlign: {
      type: String,
      validator: v => ['left', 'right', 'top'].includes(v)
    },
    required: Boolean,
    invalid: Boolean
  })

  const form = inject('form', {})
  const style = useSize(props).resolved

  const labelAlignment = computed(() =>
    props.labelAlign || form.labelAlign || null
  )

  const labelStyle = computed(() => ({
    width: labelAlignment.value === 'top'
      ? '100%'
      : resolveSize(props.labelWidth || form.labelWidth)
  }))
</script>
