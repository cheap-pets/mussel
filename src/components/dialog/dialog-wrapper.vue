<template>
  <div
    :visible="params.modalVisible"
    class="mu-modal-mask mu-dialog-mask"
    @click.native="onMaskClick">
    <div
      v-if="params.keepAlive || params.modalVisible"
      v-show="!params.keepAlive || params.modalVisible"
      class="mu-dialog mu-flex-box"
      direction="column"
      :style="dialogStyle"
      :danger="params.danger"
      :visible="params.dialogVisible">
      <div
        class="mu-dialog-header mu-flex-box"
        align-items="center"
        @mousedown.native="onDragStart">
        <label class="mu-dialog_title mu-text-ellipsis" size="auto">
          {{ params.title }}
        </label>
        <slot name="header" />
        <icon
          class="mu-dialog_close-button"
          icon="x"
          @click="onCloseButtonClick" />
      </div>
      <div class="mu-dialog-body" :size="params.height ? 1 : undefined">
        <slot />
      </div>
      <h-box
        v-if="params.footer"
        class="mu-dialog-footer"
        align-items="center">
        <slot name="footer" />
        <div style="margin-right: auto" />
        <mu-button
          v-for="btn in params.buttons"
          :key="btn.caption || btn.icon || btn.iconClass"
          v-bind="btn"
          @click="onButtonClick(btn)" />
      </h-box>
    </div>
  </div>
</template>

<script>
  import './dialog.pcss'

  import Icon from '../icon/icon.vue'
  import HBox from '../layout/flex-h-box'
  import Button from '../button/button.jsx'

  import delay from '@/utils/delay'

  import { getClientRect } from '@/utils/client-rect'

  export default {
    name: 'MusselDialogWrapper',
    components: {
      Icon,
      HBox,
      'mu-button': Button
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
      dialogStyle () {
        const { dialogVisible, width, height } = this.params
        let {
          translateX: tx,
          translateY: ty,
          transitionDuration
        } = this
        ty = dialogVisible ? ty : ty + 200
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
      onCloseButtonClick () {
        this.dialog.tryHide('$close')
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

        delay().then(() => {
          delete this.dragState
        })
      }
    }
  }
</script>
