<template>
  <div class="mu-status-box" :icon-position="iconPosition">
    <slot name="icon">
      <mu-icon v-if="icon" class="mu-status-box__icon" :icon="icon" />
    </slot>
    <div class="mu-status-box__body">
      <div v-if="title" class="mu-status-box__title">
        {{ title }}
      </div>
      <div v-if="message" class="mu-status-box__message">
        {{ message }}
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
  import './status-box.scss'

  defineOptions({ name: 'MusselStatusBox' })

  defineProps({
    icon: String,
    title: String,
    message: String,
    iconPosition: {
      type: String,
      default: 'top',
      validator: v => ['top', 'left', 'right'].includes(v)
    }
  })
</script>
