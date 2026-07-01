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
  defineProps({ options: Array, disabled: Boolean })

  const rawModel = defineModel({ type: Array })
  const model = useFieldModel(rawModel).modelProxy

  provide('checkGroup', { model })
</script>
