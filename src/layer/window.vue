<template>
  <mu-v-box
    class="mu-modal-mask"
    flex-center
    :visible="actualVisible"
    @click.native="onMaskClick">
    <mu-v-box class="mu-window" :style="style" :visible="windowVisible">
      <mu-close-button class="window-close-button" />
      <div class="mu-window-header">
        {{ title }}
      </div>
      <mu-flex-item class="mu-window-body" :size="height ? 'auto' : undefined">
        <slot />
      </mu-flex-item>
      <slot name="footer">
        <mu-h-box
          v-if="buttons"
          class="mu-window-footer"
          justify-content="center">
          <div style="margin-right: auto" />
          <mu-button
            v-for="btn in btns"
            :key="btn.label || btn.icon || btn.iconClass"
            v-bind="btn"
            @click="onButtonClick(btn)" />
        </mu-h-box>
      </slot>
    </mu-v-box>
  </mu-v-box>
</template>

<script>
  import isString from 'lodash.isstring'

  import Modal from './modal.vue'
  import VBox from '../layout/flex-v-box'
  import CloseButton from '../button/close-button.vue'

  export default {
    components: {
      'mu-v-box': VBox,
      'mu-close-button': CloseButton
    },
    extends: Modal,
    props: {
      title: String,
      width: String,
      height: String,
      buttons: Array,
      parimaryButton: String
    },
    data () {
      return {
        maskVisible: false,
        windowVisible: false
      }
    },
    computed: {
      style () {
        return {
          width: this.width,
          height: this.height
        }
      },
      bodyProps () {
        return {
          size: this.height ? 'auto' : undefined
        }
      },
      btns () {
        return this.buttons.map(button => {
          const btn = isString(button) ? { caption: button } : { ...button }
          if (this.parimaryButton === btn.caption) btn.buttonType = 'primary'
        })
      }
    },
    methods: {
      clearHideTimer () {
        if (this.hideTimer) {
          clearTimeout(this.hideTimer)
          this.hideTimer = null
        }
      },
      show () {
        window.__mussel_modal = this
        this.clearHideTimer()
        this.actualVisible = true
        this.$nextTick(() => {
          this.windowVisible = true
        })
        this.$emit('show')
        this.$emit('change', true)
      },
      hide () {
        this.deactivate()
        this.windowVisible = false
        this.clearHideTimer()
        this.$hideTimer = setTimeout(() => {
          this.actualVisible = false
        }, 200)
        this.$emit('hide')
        this.$emit('change', false)
      }
    }
  }
</script>

<style lang="postcss">
  .mu-window {
    position: relative;
    min-width: 200px;
    min-height: 100px;
    background: $windowBackground;
    opacity: 0;
    transform: translateY(300px);
    transition: all .2s ease-in-out;

    &[visible]{
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mu-window-header {
    padding: 16px;
  }

  .mu-window-footer {
    margin-top: auto;
    padding: 16px;
  }

  .mu-window-body {
    padding: 32px;
  }
</style>
