<template>
  <mu-v-box
    class="mu-modal-mask"
    flex-center
    :visible="params.modalVisible"
    @click.native="onMaskClick">
    <mu-v-box
      v-if="params.modalVisible"
      class="mu-dialog"
      :style="style"
      :danger="params.danger"
      :visible="params.dialogVisible"
    >
      <mu-h-box class="mu-dialog-header" align-items="center">
        <mu-flex-item class="mu-dialog-title mu-text-ellipsis" size="auto">
          {{ params.title }}
        </mu-flex-item>
        <mu-close-button class="mu-text-color-subtitle" @click="hide" />
      </mu-h-box>
      <mu-flex-item
        class="mu-dialog-body"
        :size="params.height ? 'auto' : undefined"
      >
        <slot />
      </mu-flex-item>
      <slot name="footer">
        <mu-h-box
          v-if="params.buttons"
          class="mu-dialog-footer"
          align-items="center">
          <div style="margin-right: auto" />
          <mu-button
            v-for="btn in params.buttons"
            :key="btn.caption || btn.icon || btn.iconClass"
            v-bind="btn"
            @click="onButtonClick(btn)" />
        </mu-h-box>
      </slot>
    </mu-v-box>
  </mu-v-box>
</template>

<script>
  import VBox from '../layout/flex-v-box'
  import CloseButton from '../button/close-button.vue'

  export default {
    name: 'MusselDialogWrapper',
    components: {
      'mu-v-box': VBox,
      'mu-close-button': CloseButton
    },
    inject: ['dialog', 'params'],
    computed: {
      style () {
        return {
          width: this.params.width,
          height: this.params.height
        }
      }
    },
    methods: {
      onMaskClick (event) {
        this.dialog.onMaskClick(event)
      },
      hide () {
        this.dialog.hide()
      },
      onButtonClick (btn) {
        this.dialog.onButtonClick(btn)
      }
    }
  }
</script>
