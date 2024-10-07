<template>
  <div class="mu-h-box mu-box" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { sizeProps, useSize } from '@/hooks/size'

  defineOptions({ name: 'MusselHBox' })

  const props = defineProps({ ...sizeProps })
  const style = useSize(props).sizeStyle
</script>
