<template>
  <label
    class="mu-checkbox"
    :checked="isChecked"
    :disabled="isDisabled"
    :style="{ width: boxWidth }">
    <input
      type="checkbox"
      :name="name"
      :value="optionValue"
      :checked="isChecked"
      :disabled="isDisabled"
      @change="onChange">
    <span class="mu-checkbox_fake" />
    <span>
      <slot>
        {{ labelText }}
      </slot>
    </span>
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
      label: String,
      option: null,
      width: null,
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
      boxWidth () {
        return this.checkboxGroup?.itemWidth || this.width
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
