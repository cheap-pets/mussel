<template>
  <label class="mu-radio-box" :disabled="disabled">
    <input
      type="radio"
      :name="name"
      :value="option"
      :checked="value === option"
      :disabled="disabled"
      @change="onChange">
    <span class="mu-radio-box_fake" />
    <slot>
      <span>{{ label }}</span>
    </slot>
  </label>
</template>

<script>
  export default {
    name: 'MusselRadioBox',
    model: {
      prop: 'value',
      event: 'change'
    },
    props: [
      'name',
      'value',
      'label',
      'option',
      'disabled'
    ],
    methods: {
      onChange () {
        this.$emit('change', this.option)
      }
    }
  }
</script>
