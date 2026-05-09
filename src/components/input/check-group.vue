<template>
  <div class="mu-check-group" :disabled="disabled || null">
    <slot>
      <mu-check
        v-for="option in options"
        :key="option.value ?? option.label"
        :value="option.value"
        :label="option.label"
        :disabled="option.disabled" />
    </slot>
  </div>
</template>

<script setup>
  import './check-group.scss'

  import { provide } from 'vue'
  import { useFieldModel } from '../form/validation'

  import MuCheck from './check.vue'

  defineOptions({ name: 'MusselCheckGroup' })

  const props = defineProps({
    options: Array,
    disabled: Boolean,
    modelValue: Array
  })
  const emit = defineEmits(['update:modelValue'])

  const { model } = useFieldModel(props, 'modelValue', emit)

  provide('checkGroup', { model })
</script>
