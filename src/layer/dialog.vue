<template>
  <mu-v-box
    class="mu-modal-mask"
    flex-center
    :visible="actualVisible"
    @click.native="onMaskClick">
    <mu-v-box
      class="mu-dialog"
      :style="style"
      :danger="danger"
      :visible="dialogVisible"
    >
      <mu-h-box class="mu-dialog-header">
        <mu-flex-item class="mu-dialog-title" size="auto">
          {{ title }}
        </mu-flex-item>
        <mu-close-button @click="hide" />
      </mu-h-box>
      <mu-flex-item class="mu-dialog-body" :size="height ? 'auto' : undefined">
        <slot />
      </mu-flex-item>
      <slot name="footer">
        <mu-h-box
          v-if="buttons"
          class="mu-dialog-footer"
          align-items="center">
          <div style="margin-right: auto" />
          <mu-button
            v-for="btn in btns"
            :key="btn.caption || btn.icon || btn.iconClass"
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
      danger: Boolean,
      primaryButton: String
    },
    data () {
      return {
        dialogVisible: false
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
          const btn = isString(button)
            ? { caption: button, _rawData: button }
            : { ...button }
          if (this.primaryButton === btn.caption) {
            btn.buttonType = this.danger ? 'danger' : 'primary'
          }
          return btn
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
      show (callbackOnce) {
        window.__mussel_modal = this
        this.callbackOnce = callbackOnce
        this.clearHideTimer()
        this.actualVisible = true
        setTimeout(() => {
          this.dialogVisible = true
        }, 10)
        this.$emit('show')
        this.$emit('change', true)
      },
      actualHide () {
        this.callbackOnce = null
        this.deactivate()
        this.dialogVisible = false
        this.clearHideTimer()
        this.$hideTimer = setTimeout(() => {
          this.actualVisible = false
        }, 200)
        this.$emit('hide')
        this.$emit('change', false)
      },
      hide () {
        if (this.callbackOnce) {
          this.callback(this.actualHide)
        } else {
          this.actualHide()
        }
      },
      onButtonClick (btn) {
        this.$emit('buttonclick', btn._rawData || btn, this)
      }
    }
  }
</script>

<style lang="postcss">
  .mu-dialog {
    position: relative;
    min-width: 200px;
    min-height: 100px;
    background: $dialogBackground;
    opacity: 0;
    box-shadow: $dialogShadow;
    transform: translateY(300px);
    transition: all .2s ease-in-out;

    &[visible]{
      opacity: 1;
      transform: translateY(0);
    }

    &[danger] > .mu-dialog-header {
      border-bottom-color: $dangerColor;
    }
  }

  .mu-dialog-header {
    height: $(dialogHeaderHeightPx)px;
    padding: calc($unitSpacingSizePx * 2)px;
    background: $dialogHeaderBackground;
    border-bottom: $dialogHeaderBorderBottom;

    & > .mu-dialog-title {
      font-size: $dialogTitleFontSize;
      font-weight: 600;
    }
  }

  .mu-dialog-footer {
    margin-top: auto;
    height: $(dialogFooterHeightPx)px;
    background: $dialogFooterBackground;
    padding: 0 calc($unitSpacingSizePx * 2)px;
    & > .mu-button {
      margin-left: $(unitSpacingSizePx)px;
    }
  }

  .mu-dialog-body {
    padding: calc($unitSpacingSizePx * 2)px;
  }
</style>
