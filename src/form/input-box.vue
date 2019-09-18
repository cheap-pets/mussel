<template>
  <div class="mu-input-box" :buttons="buttons">
    <mu-input :type="type" :value="value" @change="onChange" />
    <mu-input-button
      v-if="clearBtnVisible"
      button-type="button"
      icon="close"
      @click="clear" />
    <mu-input-button
      v-if="inputBtnType"
      :button-type="inputBtnType"
      :icon-class="iconClass"
      :icon="icon" />
  </div>
</template>

<script>
  import './input-box.pcss'

  import Input from './input.vue'
  import InputButton from './input-button.vue'

  export default {
    components: {
      'mu-input': Input,
      'mu-input-button': InputButton
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
      value: {
        type: String,
        default: ''
      },
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
      icon: String,
      iconClass: String,
      validator: Function
    },
    computed: {
      clearBtnVisible () {
        return this.clearable && !!this.value
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
    methods: {
      onChange (value) {
        this.$emit('change', value)
      },
      clear () {
        this.$emit('change', '')
      }
    }
  }
</script>
