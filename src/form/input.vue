<template>
  <input
    class="mu-input"
    :type="type"
    :value="value"
    @input="onInput"
  >
</template>

<script>
  import './input.pcss'

  export default {
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
        value: ''
      },
      icon: {
        type: String,
        default: 'key-down'
      },
      validator: Function
    },
    methods: {
      onInput (event) {
        this.$emit('change', event.target.value)
      },
      validate () {
      }
    }
  }
</script>
