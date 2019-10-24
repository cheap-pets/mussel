<template>
  <input
    class="mu-input"
    :type="type"
    :value="value"
    :disabled="disabled"
    @input="onInput"
    @click="onClick"
    @keydown="onKeyDown"
  >
</template>

<script>
  import './input.pcss'

  export default {
    name: 'MusselInput',
    model: {
      prop: 'value',
      event: 'input'
    },
    props: {
      type: {
        type: String,
        default: 'text'
      },
      value: [String, Number],
      icon: {
        type: String,
        default: 'key-down'
      },
      disabled: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      onInput (event) {
        this.$emit('input', event.target.value)
      },
      onKeyDown () {
        if (event.keyCode === 13) this.$emit('enterkey', this)
        else if (event.keyCode === 27) this.$emit('esckey', this)
      },
      onClick () {
        if (!this.disabled) this.$emit('click')
      }
    }
  }
</script>
