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
    props: [
      'value',
      'disabled',
      'itemWidth'
    ],
    methods: {
      changeValue (v) {
        this.$emit('change', v)
      }
    }
  }
</script>
