<template>
  <div class="mu-v-box mu-box" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { sizeProps, useSize } from '@/hooks/size'

  defineOptions({ name: 'MusselVBox' })

  const props = defineProps({ ...sizeProps })
  const style = useSize(props).sizeStyle
</script>
