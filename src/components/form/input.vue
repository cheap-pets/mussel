<template>
  <input
    class="mu-input"
    :type="type"
    :value="value"
    :disabled="disabled"
    @input="onInput"
    @blur="onBlur"
    @click="onClick"
    @keydown="onKeyDown"
  >
</template>

<script>
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
      disabled: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      onInput (event) {
        const value = event.target.value
        if (value !== this.value) this.$emit('input', value)
      },
      onKeyDown () {
        if (event.keyCode === 13) this.$emit('enterkey', this)
        else if (event.keyCode === 27) this.$emit('esckey', this)
      },
      onClick () {
        if (!this.disabled) this.$emit('click')
      },
      onBlur () {
        this.$emit('blur', this)
      }
    }
  }
</script>
