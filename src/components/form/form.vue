<template>
  <div class="mu-form" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { provide } from 'vue'
  import { sizeProps, useSize } from '@/hooks/size'

  defineOptions({ name: 'MusselForm' })

  const props = defineProps({ ...sizeProps, labelWidth: String, labelAlign: String })
  const style = useSize(props).sizeStyle

  provide('form', props)

</script>
