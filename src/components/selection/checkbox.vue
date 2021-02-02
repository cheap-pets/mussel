<template>
  <label class="mu-checkbox" :disabled="isDisabled" :style="{ width }">
    <input
      type="checkbox"
      :name="name"
      :value="optionValue"
      :checked="isChecked"
      :disabled="isDisabled"
      @change="onChange">
    <span class="mu-checkbox_fake" />
    <slot v-if="labelText">
      <span>{{ labelText }}</span>
    </slot>
  </label>
</template>

<script>
  import './checkbox.pcss'

  export default {
    name: 'MusselCheckbox',
    inject: {
      checkboxGroup: {
        default: null
      }
    },
    model: {
      prop: 'checked',
      event: 'change'
    },
    props: {
      name: String,
      option: null,
      checked: Boolean,
      disabled: Boolean
    },
    computed: {
      optionValue () {
        return this.option ?? this.label
      },
      labelText () {
        return this.label ?? this.option
      },
      isDisabled () {
        return this.disabled || this.checkboxGroup?.disabled
      },
      checkedValue () {
        return this.checkboxGroup?.value ?? this.checked ?? false
      },
      isChecked () {
        return Array.isArray(this.checkedValue)
          ? this.checkedValue.indexOf(this.optionValue) !== -1
          : !!this.checkedValue
      },
      width () {
        return this.checkboxGroup?.itemWidth
      }
    },
    methods: {
      onChange () {
        this.$emit('change', !this.isChecked)
        this.checkboxGroup?.toggleOption(this.optionValue)
      }
    }
  }
</script>
