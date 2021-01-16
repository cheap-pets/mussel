<template>
  <div class="mu-button-group" :button-shape="buttonShape">
    <mu-button
      v-bind="buttonParams"
      @click="onButtonClick">
      <slot />
    </mu-button>
    <mu-icon-button
      v-bind="splitParams"
      @click="onSplitButtonClick" />
  </div>
</template>

<script>
  import Button from './button.jsx'

  export default {
    name: 'MusselSplitButton',
    components: {
      'mu-button': Button
    },
    props: {
      caption: String,
      disabled: Boolean,
      buttonType: String,
      buttonStyle: String,
      buttonShape: String,
      splitIcon: String,
      splitIconClass: String
    },
    computed: {
      buttonParams () {
        return {
          caption: this.caption,
          disabled: this.disabled,
          buttonType: this.buttonType,
          buttonStyle: this.buttonStyle
        }
      },
      splitParams () {
        return {
          icon: this.splitIcon || (
            this.splitIconClass ? undefined : 'dropdown'
          ),
          iconClass: this.splitIconClass,
          disabled: this.disabled,
          buttonType: this.buttonType,
          buttonStyle: this.buttonStyle
        }
      }
    },
    methods: {
      onButtonClick (event) {
        this.$emit('click', event)
      },
      onSplitButtonClick (event) {
        this.$emit('splitbuttonclick', event)
      }
    }
  }
</script>
