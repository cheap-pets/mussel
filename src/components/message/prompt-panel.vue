<template>
  <div
    class="mu-prompt-panel mu-flex-box"
    align-items="center"
    content-spacing
    :direction="iconPosition === 'top' ? 'column' : 'row'">
    <icon class="mu__icon" :icon="icon" :icon-class="iconClass" />
    <div content-spacing="between">
      <div v-if="headline" class="mu__headline">
        {{ headline }}
      </div>
      <div v-if="message" class="mu__message">
        {{ message }}
      </div>
      <div><slot /></div>
    </div>
  </div>
</template>

<script>
  import './prompt-panel.pcss'

  import Icon from '../icon/icon.vue'

  export default {
    name: 'MusselPromptPanel',
    components: {
      Icon
    },
    props: {
      icon: {
        type: String,
        default: 'info'
      },
      iconPosition: {
        type: String,
        default: 'left',
        validator (value) {
          return ['top', 'left'].indexOf(value) !== -1
        }
      },
      iconClass: String,
      headline: String,
      message: String
    }
  }
</script>
