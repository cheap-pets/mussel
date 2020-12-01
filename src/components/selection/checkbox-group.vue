<template>
  <div class="mu-checkbox-group" :disabled="disabled">
    <slot />
  </div>
</template>

<script>
  export default {
    name: 'MusselCheckboxGroup',
    provide () {
      return {
        checkboxGroup: this
      }
    },
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      value: Array,
      disabled: Boolean,
      itemWidth: String
    },
    methods: {
      toggleOption (v) {
        const arr = (this.value || []).map(el => el)
        const idx = arr.indexOf(v)
        if (idx === -1) arr.push(v)
        else arr.splice(idx, 1)
        this.$emit('change', arr)
      }
    }
  }
</script>
