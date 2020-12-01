<template>
  <div class="mu-toggle" :active="value === activeValue" :disabled="disabled">
    <label
      v-if="label || inactiveLabel"
      :class="labelClass"
      @click="onLeftLabelClick">
      {{ label || inactiveLabel }}
    </label>
    <div class="mu-toggle-slide-bar" @click="changeValue()" />
    <label
      v-if="activeLabel"
      :class="activeLabelClass"
      @click="onRightLabelClick">
      {{ activeLabel }}
    </label>
  </div>
</template>

<script>
  import './toggle.pcss'

  export default {
    name: 'MusselToggle',
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      value: null,
      activeValue: {
        type: null,
        default: true
      },
      inactiveValue: {
        type: null,
        default: false
      },
      label: String,
      disabled: Boolean,
      activeLabel: String,
      inactiveLabel: String
    },
    data () {
      return {
        active: false
      }
    },
    computed: {
      leftLabel () {
        return this.label || this.inactiveLabel
      },
      labelClass () {
        return this.activeLabel
          ? (
            this.value === this.activeValue
              ? 'mu-text-color-subtitle'
              : 'mu-text-color-title'
          )
          : 'mu-text-color-normal'
      },
      activeLabelClass () {
        return this.value === this.activeValue
          ? 'mu-text-color-success'
          : 'mu-text-color-subtitle'
      }
    },
    methods: {
      changeValue (value) {
        if (this.disabled) return
        this.$emit(
          'change',
          arguments.length
            ? value
            : (
              this.value === this.activeValue
                ? this.inactiveValue
                : this.activeValue
            )
        )
      },
      onLeftLabelClick () {
        if (this.activeLabel) {
          if (this.value === this.activeValue) {
            this.changeValue(this.inactiveValue)
          }
        } else {
          this.changeValue()
        }
      },
      onRightLabelClick () {
        if (this.value === this.inactiveValue) {
          this.changeValue(this.activeValue)
        }
      }
    }
  }
</script>
