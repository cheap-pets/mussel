<template>
  <div
    class="mu-toggle"
    :button-style="buttonStyle"
    :active="isActive"
    :disabled="disabled">
    <label v-if="label" class="mu-label">{{ label }}</label>
    <template v-if="isOutsideLabel">
      <span
        v-if="inactiveLabel"
        class="mu-text-color-subtitle"
        @click="onInactiveLabelClick">
        {{ inactiveLabel }}
      </span>
      <span class="mu-toggle_slide-bar" @click="toggleValue" />
      <span
        v-if="activeLabel"
        :class="activeLabelClass"
        @click="onActiveLabelClick">
        {{ activeLabel }}
      </span>
    </template>
    <template v-else-if="buttonStyle">
      <span
        class="mu-toggle_active-button"
        :active="isActive"
        :style="{ width: buttonWidth }"
        @click="onActiveLabelClick">
        {{ activeLabel }}
      </span>
      <span
        class="mu-toggle_inactive-button"
        :active="!isActive"
        :style="{ width: buttonWidth }"
        @click="onInactiveLabelClick">
        {{ inactiveLabel }}
      </span>
    </template>
    <span
      v-else
      class="mu-toggle_slide-bar"
      @click="toggleValue">
      {{ toggleLabel }}
    </span>
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
      label: String,
      disabled: Boolean,
      buttonStyle: Boolean,
      activeLabel: String,
      inactiveLabel: String,
      activeLabelPosition: {
        type: String,
        default: 'inside',
        validator (v) {
          return ['inside', 'outside'].indexOf(v) !== -1
        }
      },
      activeValue: {
        type: null,
        default: true
      },
      inactiveValue: {
        type: null,
        default: false
      },
      buttonWidth: String
    },
    computed: {
      isActive () {
        return this.value === this.activeValue
      },
      isOutsideLabel () {
        return !this.buttonStyle && this.activeLabelPosition === 'outside'
      },
      activeLabelClass () {
        return this.isActive ? 'mu-text-color-success' : 'mu-text-color-subtitle'
      },
      toggleLabel () {
        return this.isActive ? this.activeLabel : this.inactiveLabel
      }
    },
    methods: {
      changeValue (value) {
        if (this.disabled || value === this.value) return
        this.$emit('change', value)
      },
      toggleValue () {
        this.changeValue(this.isActive ? this.inactiveValue : this.activeValue)
      },
      onInactiveLabelClick () {
        this.changeValue(this.inactiveValue)
      },
      onActiveLabelClick () {
        this.changeValue(this.activeValue)
      }
    }
  }
</script>
