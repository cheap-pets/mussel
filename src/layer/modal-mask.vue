<template>
  <div
    class="mu-modal-mask"
    :visible="visible"
    @click="onClick">
    <slot />
  </div>
</template>

<script>
  import RenderToBodyMixin from './mix-render-to-body'

  export default {
    mixins: [RenderToBodyMixin],
    props: {
      visible: Boolean
    },
    methods: {
      onClick (event) {
        if (event.target === this.$el) this.$emit('click')
      },
      show () {
        this.$emit('show')
        this.$emit('change', true)
      },
      hide () {
        this.$emit('hide')
        this.$emit('change', false)
      }
    }
  }
</script>

<style lang="postcss">
  .mu-modal-mask {
    position: absolute;
    z-index: 100;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    visibility: hidden;
    align-items: center;
    justify-content: center;
    background: $modalMaskBackground;

    &[visible] {
      visibility: visible;
    }
  }

  body > .mu-modal-mask {
    position: fixed;
  }
</style>
