<template>
  <div class="mu-box" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { sizeProps, useSize } from '@/hooks/size'

  defineOptions({ name: 'MusselBox' })

  const props = defineProps({ ...sizeProps })
  const style = useSize(props).sizeStyle
</script>
