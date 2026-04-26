<template>
  <div
    class="mu-form-field"
    :class="{ 'mu-form-field--required': required, 'mu-form-field--invalid': invalid }"
    :label-align="labelAlignment"
    :style="size">
    <span v-if="label" class="mu-form-field__label text-ellipsis" :style="labelStyle">
      {{ label }}
    </span>
    <slot />
  </div>
</template>

<script setup>
  import './form-field.scss'

  import { computed, inject } from 'vue'
  import { resolveSize } from '@/utils/size'

  defineOptions({ name: 'MusselFormField' })

  const props = defineProps({
    width: [String, Number],
    height: [String, Number],
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

  const size = computed(() => ({
    width: resolveSize(props.width),
    height: resolveSize(props.height)
  }))

  const labelAlignment = computed(() =>
    props.labelAlign || form.labelAlign || null
  )

  const labelStyle = computed(() => ({
    width: labelAlignment.value === 'top'
      ? '100%'
      : resolveSize(props.labelWidth || form.labelWidth)
  }))
</script>
