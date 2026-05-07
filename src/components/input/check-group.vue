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

  import MuCheck from './check.vue'

  defineOptions({ name: 'MusselCheckGroup' })

  const model = defineModel({ type: Array })

  defineProps({
    options: Array,
    disabled: Boolean
  })

  provide('checkGroup', { model })
</script>
