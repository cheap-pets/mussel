<template>
  <label class="mu-radio" :disabled="isDisabled" :style="{ width }">
    <input
      type="radio"
      :name="name"
      :value="optionValue"
      :checked="checkedValue === optionValue"
      :disabled="isDisabled"
      @change="onChange">
    <span class="mu-radio_fake" />
    <slot>
      <span>{{ labelText }}</span>
    </slot>
  </label>
</template>

<script>
  export default {
    name: 'MusselRadio',
    inject: {
      radioGroup: {
        default: null
      }
    },
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
    computed: {
      optionValue () {
        return this.option ?? this.label
      },
      labelText () {
        return this.label ?? this.option
      },
      checkedValue () {
        return this.value ?? this.radioGroup?.value
      },
      isDisabled () {
        return this.disabled || this.radioGroup?.disabled
      },
      width () {
        return this.radioGroup?.itemWidth
      }
    },
    methods: {
      onChange () {
        this.radioGroup?.changeValue(this.optionValue)
        this.$emit('change', this.optionValue)
      }
    }
  }
</script>
