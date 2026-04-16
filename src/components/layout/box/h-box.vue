<template>
  <div class="mu-h-box mu-box" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { sizeProps, useSize } from '@/components/common-hooks/size'

  defineOptions({ name: 'MusselHBox' })

  const props = defineProps({ ...sizeProps })
  const style = useSize(props).resolved
</script>
