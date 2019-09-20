<template>
  <input
    class="mu-input"
    :type="type"
    :value="value"
    :disabled="disabled"
    @input="onInput"
    @click="onClick"
  >
</template>

<script>
  import './input.pcss'

  export default {
    model: {
      prop: 'value',
      event: 'input'
    },
    props: {
      type: {
        type: String,
        default: 'text'
      },
      value: {
        type: String,
        value: ''
      },
      icon: {
        type: String,
        default: 'key-down'
      },
      disabled: {
        type: Boolean,
        default: false
      },
      validator: Function
    },
    methods: {
      onInput (event) {
        this.$emit('input', event.target.value)
      },
      onClick () {
        if (!this.disabled) this.$emit('click')
      },
      validate () {
      }
    }
  }
</script>
