<template>
  <input
    class="mu-input"
    :type="type"
    :value="value"
    :disabled="disabled"
    @input="onInput"
    @blur="onBlur"
    @focus="onFocus"
    @click="onClick"
    @keydown="onKeyDown">
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
      disabled: Boolean,
      autofocus: Boolean
    },
    mounted () {
      if (this.autofocus) this.$el.focus()
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
      onClick (event) {
        if (!this.disabled) this.$emit('click', event)
      },
      onFocus () {
        this.$emit('focus', this)
      },
      onBlur () {
        this.$emit('blur', this)
      }
    }
  }
</script>
