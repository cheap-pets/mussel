<template>
  <div class="mu-table_cell-buttons">
    <mu-button
      v-for="(btn, index) in btns"
      :key="+new Date() + '_' + index"
      v-bind="btn"
      @click="onClick(btn)" />
  </div>
</template>

<script>
  import isString from 'lodash.isstring'

  import Button from '../../button/button.jsx'

  export default {
    components: {
      'mu-button': Button
    },
    props: {
      buttons: Array
    },
    computed: {
      btns () {
        return this.buttons.map(button => {
          const btn = isString(button) ? { caption: button } : button
          return {
            button,
            caption: btn.caption,
            icon: btn.icon,
            iconClass: btn.iconClass,
            buttonType: btn.type || 'primary',
            buttonStyle: btn.style || 'link',
            buttonShape: btn.shape,
            disabled: btn.disabled
          }
        })
      }
    },
    methods: {
      onClick (btn) {
        this.$emit('buttonclick', btn.button)
      }
    }
  }
</script>
