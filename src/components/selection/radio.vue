<template>
  <label
    class="mu-radio "
    :disabled="isDisabled"
    :style="{ width }"
    :checked="isChecked">
    <input
      type="radio"
      :name="name"
      :value="optionValue"
      :checked="isChecked"
      :disabled="isDisabled"
      @change="onChange">
    <span class="mu-radio_fake" />
    <span class="mu-text-ellipsis">
      <slot>{{ labelText }}</slot>
    </span>
  </label>
</template>

<script>
  import './radio.pcss'

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
      'disabled',
      'radioStyle'
    ],
    computed: {
      optionValue () {
        return this.option ?? this.label
      },
      checkedValue () {
        return this.value ?? this.radioGroup?.value
      },
      isChecked () {
        return this.checkedValue === this.optionValue
      },
      labelText () {
        return this.label ?? this.option
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
