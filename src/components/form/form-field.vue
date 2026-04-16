<template>
  <div class="mu-form-field" :style="style">
    <label v-if="label" class="text-ellipsis" :text-align="labelAlign" :style="labelStyle">
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
    labelAlign: String
  })

  const form = inject('form', {})
  const style = useSize(props).resolved

  const labelAlign = computed(() =>
    props.labelAlign || form.labelAlign || null
  )

  const labelStyle = computed(() => ({
    width: resolveSize(props.labelWidth || form.labelWidth)
  }))
</script>
