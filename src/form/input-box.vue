<template>
  <div class="mu-input-box" :buttons="buttons" :disabled="disabled">
    <mu-input-button
      v-if="inputBtnType && buttonPosition === 'left'"
      :button-type="inputBtnType"
      :icon-class="iconClass"
      :icon="icon"
      @click="onButtonClick" />
    <mu-input
      :type="type"
      :value="inputValue"
      :disabled="disabled"
      :readonly="readonly"
      @input="onInput"
      @click="onInputClick" />
    <mu-input-button
      v-if="clearBtnVisible"
      button-type="button"
      icon="close"
      @click="clear" />
    <mu-input-button
      v-if="inputBtnType && buttonPosition === 'right'"
      :button-type="inputBtnType"
      :icon-class="iconClass"
      :icon="icon"
      @click="onButtonClick" />
  </div>
</template>

<script>
  import './input-box.pcss'

  import Input from './input.vue'
  import InputButton from './input-button.js'

  export default {
    provide () {
      return {
        inputBox: this
      }
    },
    components: {
      'mu-input': Input,
      'mu-input-button': InputButton
    },
    inject: {
      form: {
        default: null
      }
    },
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      type: {
        type: String,
        default: 'text'
      },
      value: [String, Number],
      clearable: {
        type: Boolean,
        default: true
      },
      buttonType: {
        type: String,
        validator (value) {
          return ['button', 'icon'].indexOf(value) !== -1
        }
      },
      buttonPosition: {
        type: String,
        default: 'right',
        validator (value) {
          return ['left', 'right'].indexOf(value) !== -1
        }
      },
      disabled: {
        type: Boolean,
        default: false
      },
      icon: String,
      iconClass: String,
      readonly: Boolean,
      validator: Function
    },
    data () {
      return {
        inputValue: this.value
      }
    },
    computed: {
      clearBtnVisible () {
        return this.clearable && !!this.inputValue
      },
      inputBtnType () {
        return this.buttonType || (
          this.icon || this.iconClass
            ? 'icon'
            : undefined
        )
      },
      buttons () {
        return 0 + (this.clearBtnVisible ? 1 : 0) + (this.inputBtnType ? 1 : 0)
      }
    },
    watch: {
      value: {
        handler (v) {
          this.inputValue = v
        },
        immediate: true
      }
    },
    methods: {
      onInput (value) {
        this.inputValue = value
        this.$emit('change', value)
      },
      onButtonClick () {
        this.$el.querySelector('input').focus()
        this.$emit('buttonclick')
      },
      onInputClick () {
        this.$emit('inputclick')
      },
      clear () {
        this.inputValue = ''
        this.$emit('change', '')
        this.$emit('clear', '')
      }
    }
  }
</script>
