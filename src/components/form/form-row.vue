<template>
  <div class="mu-form-row" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import './form-row.scss'

  import { sizeProps, useSize } from '@/components/common-hooks/size'

  defineOptions({ name: 'MusselFormRow' })

  const props = defineProps({ ...sizeProps })
  const style = useSize(props).resolved
</script>
