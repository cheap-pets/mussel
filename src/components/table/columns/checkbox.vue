<template>
  <span
    class="mu-table_checkbox"
    :checked="value"
    @click="onClick" />
</template>

<script>
  export default {
    name: 'MusselTableCheckbox',
    props: {
      value: Boolean,
      disabled: Boolean
    },
    methods: {
      onClick () {
        if (!this.disabled) this.$emit('change', !this.value)
      }
    }
  }
</script>
