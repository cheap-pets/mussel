<template>
  <div
    class="mu-dropdown"
    :expanded="popupParams.visible"
    @click="onClick"
    @mouseover="onMouseOver"
    @mouseleave="onMouseLeave">
    <div
      v-if="splitButton"
      class="mu-button-group"
      :button-shape="buttonShape">
      <mu-button
        v-bind="buttonParams"
        @click="onButtonClick">
        <slot />
      </mu-button>
      <mu-button
        dropdown-trigger
        v-bind="splitParams"
        @click="onSplitButtonClick" />
    </div>
    <mu-button
      v-else
      v-bind="buttonParams"
      :button-shape="buttonShape"
      @click="onButtonClick">
      <slot>
        <span>{{ caption }}</span>
        <mu-icon trigger-type="dropdown" />
      </slot>
    </mu-button>
    <mu-dropdown-panel
      v-if="!disabled && popupParams.visible"
      v-bind="popupParams"
      @change="setPopupVisible"
      @mouseover.native.stop="clearHoverTimer"
      @mouseleave.native.stop="onMouseLeave"
      @click.native.stop="onDropdownClick">
      <slot name="dropdown" />
    </mu-dropdown-panel>
  </div>
</template>

<script>
  import Button from './button.jsx'
  import Icon from '../icon/index.vue'
  import SplitButton from './split-button.vue'
  import Dropdown from '../dropdown/dropdown.vue'

  export default {
    name: 'MusselDropdownButton',
    components: {
      'mu-button': Button,
      'mu-icon': Icon
    },
    extends: Dropdown,
    mixins: [SplitButton],
    props: {
      splitButton: Boolean
    }
  }
</script>
