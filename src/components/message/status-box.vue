<template>
  <div
    class="mu-status-box mu-box"
    layout="flex" direction="column" content-center
    :style="sizeStyle">
    <slot name="icon">
      <mu-icon v-if="icon" class="mu-status-box_icon" :icon="icon" />
    </slot>
    <div v-if="title" class="mu-status-box_title">
      {{ title }}
    </div>
    <div v-if="message" class="mu-status-box_message">
      {{ message }}
    </div>
    <slot />
  </div>
</template>

<script setup>
  import './status-box.scss'

  import { sizeProps, useSize } from '@/hooks/size'

  defineOptions({ name: 'MusselStatusBox' })

  const props = defineProps({
    icon: String,
    title: String,
    message: String,
    ...sizeProps
  })

  const { sizeStyle } = useSize(props)
</script>
