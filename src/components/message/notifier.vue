<template>
  <transition-group name="mu-notifier-group" tag="div" class="mu-notifier-group">
    <mu-message
      v-for="el in notifications"
      :key="el.id"
      class="mu-notifier"
      v-bind="el" />
  </transition-group>
</template>

<script setup>
  import './notifier.scss'

  import MuMessage from './message.vue'

  defineOptions({ name: 'MuNotifier' })
  defineProps({ notifications: Array })
</script>
