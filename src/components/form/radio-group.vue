<template>
  <div class="mu-radio-group" :disabled="disabled">
    <slot />
  </div>
</template>

<script>
  export default {
    name: 'MusselRadioGroup',
    model: {
      prop: 'value',
      event: 'change'
    },
    props: [
      'value',
      'disabled',
      'itemWidth'
    ],
    provide () {
      return {
        radioGroup: this
      }
    },
    methods: {
      changeValue (v) {
        this.$emit('change', v)
      }
    }
  }
</script>
