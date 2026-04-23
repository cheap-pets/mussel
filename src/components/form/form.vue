<template>
  <div class="mu-form" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import './form.scss'

  import { provide } from 'vue'
  import { sizeProps, useSize } from '@/components/common-hooks/size'

  defineOptions({ name: 'MusselForm' })

  const props = defineProps({ ...sizeProps, labelWidth: String, labelAlign: String })
  const style = useSize(props).resolved

  provide('form', props)

</script>
