<template>
  <div class="mu-radio-group" :disabled="disabled">
    <slot />
  </div>
</template>

<script>
  export default {
    name: 'MusselRadioGroup',
    provide () {
      return {
        radioGroup: this
      }
    },
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      value: null,
      itemWidth: String,
      disabled: Boolean
    },
    methods: {
      changeValue (v) {
        this.$emit('change', v)
      }
    }
  }
</script>
