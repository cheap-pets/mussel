<template>
  <mu-v-box
    class="mu-modal-mask"
    flex-center
    :visible="params.modalVisible"
    @click.native="onMaskClick"
  >
    <mu-v-box
      v-if="params.keepAlive || params.modalVisible"
      v-show="!params.keepAlive || params.modalVisible"
      class="mu-dialog"
      :style="style"
      :danger="params.danger"
      :visible="params.dialogVisible"
    >
      <mu-h-box
        class="mu-dialog-header"
        align-items="center"
        @mousedown.native="onDragStart"
      >
        <mu-flex-item class="mu-dialog-title mu-text-ellipsis" size="auto">
          {{ params.title }}
        </mu-flex-item>
        <slot name="header" />
        <mu-close-button class="mu-text-color-subtitle" @click="hide" />
      </mu-h-box>
      <mu-flex-item
        class="mu-dialog-body"
        :size="params.height ? 'auto' : undefined"
      >
        <slot />
      </mu-flex-item>
      <mu-h-box
        v-if="params.footer"
        class="mu-dialog-footer"
        align-items="center"
      >
        <slot name="footer" />
        <div style="margin-right: auto" />
        <mu-button
          v-for="btn in params.buttons"
          :key="btn.caption || btn.icon || btn.iconClass"
          v-bind="btn"
          @click="onButtonClick(btn)" />
      </mu-h-box>
    </mu-v-box>
  </mu-v-box>
</template>

<script>
  import VBox from '../layout/flex-v-box'
  import CloseButton from '../button/close-button.vue'

  import getClientRect from '../../utils/client-rect'

  export default {
    name: 'MusselDialogWrapper',
    components: {
      'mu-v-box': VBox,
      'mu-close-button': CloseButton
    },
    inject: ['dialog', 'params'],
    data () {
      return {
        translateX: 0,
        translateY: 0,
        transitionDuration: '.2s'
      }
    },
    computed: {
      style () {
        const { dialogVisible: visible, width, height } = this.params
        let {
          translateX: tx,
          translateY: ty,
          transitionDuration
        } = this
        ty = visible ? ty : ty + 200
        return {
          width,
          height,
          transitionDuration,
          transform: `translate3d(${tx}px, ${ty}px, 0)`
        }
      }
    },
    methods: {
      onMaskClick (event) {
        if (!this.dragState) this.dialog.onMaskClick(event)
      },
      hide () {
        this.dialog.hide()
      },
      onButtonClick (btn) {
        this.dialog.onButtonClick(btn)
      },
      onDragStart (event) {
        const { target, pageX, pageY } = event
        const el = this.$el.querySelector('.mu-dialog')
        const isIcon = String(target.className).indexOf('mu-icon') !== -1
        const isInput = target.tagName.toLowerCase() === 'input'

        if (!el || this.params.draggable === false || isIcon || isInput) return

        this.dragState = {
          tx: this.translateX,
          ty: this.translateY,
          startX: pageX,
          startY: pageY,
          el: this.$el.querySelector('.mu-dialog')
        }
        this.transitionDuration = '0s'
        window.addEventListener('mousemove', this.onDragMove)
        window.addEventListener('mouseup', this.onDragEnd)
      },
      onDragMove (event) {
        if (!this.dragState) return

        const { pageX: x, pageY: y } = event
        const { el, tx, ty, startX, startY } = this.dragState
        const { top, left } = getClientRect(el)
        const newX = tx + x - startX
        const newY = ty + y - startY
        if (
          (left > 0 || newX > this.translateX) &&
          (x < window.innerWidth)
        ) {
          this.translateX = newX
        }
        if (
          (top > 0 || ty + y - startY > this.translateY) &&
          (y < window.innerHeight)
        ) {
          this.translateY = newY
        }
      },
      onDragEnd (event) {
        if (!this.dragState) return
        window.removeEventListener('mousemove', this.onDragMove)
        window.removeEventListener('mouseup', this.onDragEnd)
        this.transitionDuration = '.2s'
        setTimeout(() => {
          delete this.dragState
        }, 50)
      }
    }
  }
</script>
