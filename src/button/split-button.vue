<template>
  <div class="mu-button-group" :button-shape="buttonStyle">
    <mu-button
      v-bind="buttonParams"
      @click="onButtonClick">
      <slot />
    </mu-button>
    <mu-button
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
      buttonType: String,
      buttonStyle: String,
      buttonShape: String,
      caption: String,
      stopPropagation: Boolean,
      splitIcon: String,
      splitIconClass: String,
      splitTriggerType: String,
      splitSvgData: String
    },
    computed: {
      buttonParams () {
        return {
          caption: this.caption,
          buttonType: this.buttonType,
          buttonStyle: this.buttonStyle,
          stopPropagation: this.stopPropagation
        }
      },
      splitParams () {
        return {
          icon: this.splitIcon,
          iconClass: this.splitIconClass,
          triggerType:
            (this.splitIcon ||
              this.splitIconClass ||
              this.splitTriggerType ||
              this.splitSvgData
            )
              ? this.splitTriggerType
              : 'dropdown',
          svgData: this.splitSvgData,
          buttonType: this.buttonType,
          buttonStyle: this.buttonStyle,
          stopPropagation: this.stopPropagation
        }
      }
    },
    methods: {
      onButtonClick () {
        this.$emit('click')
      },
      onSplitButtonClick () {
        this.$emit('splitbuttonclick')
      }
    }
  }
</script>
