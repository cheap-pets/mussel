<template>
  <div class="mu-form-field" :style="style">
    <label v-if="label" class="mu-text-ellipsis" :text-align="labelAlign" :style="labelStyle">
      {{ label }}
    </label>
    <slot />
  </div>
</template>

<script setup>
  import './form-field.scss'

  import { computed, inject } from 'vue'
  import { resolveSize } from '@/utils/size'
  import { sizeProps, useSize } from '@/hooks/size'

  defineOptions({ name: 'MusselFormField' })

  const props = defineProps({
    ...sizeProps,
    label: String,
    labelWidth: String,
    labelAlign: String
  })

  const form = inject('form', {})
  const style = useSize(props).sizeStyle

  const labelAlign = computed(() =>
    props.labelAlign || form.labelAlign || null
  )

  const labelStyle = computed(() => ({
    width: resolveSize(props.labelWidth || form.labelWidth)
  }))
</script>
