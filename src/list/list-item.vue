<template>
  <div
    class="mu-list-item"
    :class="className"
    :active="actualActive"
    :selected="actualSelected"
    :icon-indent="actualIconIndent"
    @click="onClick">
    <mu-icon
      v-if="actualIcon || actualIconClass || actualIconIndent"
      :icon="actualIcon"
      :icon-class="actualIconClass"
      @click="onIconClick" />
    <slot>{{ actualLabel }}</slot>
  </div>
</template>

<script>
  import Icon from '../icon/index.vue'

  import { equalFalse } from '../utils/prop'

  export default {
    name: 'MusselListItem',
    components: {
      'mu-icon': Icon
    },
    props: {
      value: null,
      className: String,
      icon: String,
      iconClass: String,
      iconIndent: null,
      label: String,
      selected: null,
      active: Boolean,
      disabled: Boolean,
      triggerIcon: String
    },
    computed: {
      actualLabel () {
        return this.label
      },
      actualIcon () {
        return this.icon
      },
      actualIconClass () {
        return this.iconClass
      },
      actualIconIndent () {
        return !equalFalse(this.iconIndent)
      },
      actualActive () {
        return this.active
      },
      actualSelected () {
        return !equalFalse(this.selected)
      },
      actualTriggerIcon () {
        return this.triggerIcon
      }
    },
    methods: {
      onClick () {
        if (!this.disabled) this.$emit('click')
      },
      onIconClick () {
        if (!this.disabled) this.$emit('iconclick')
      }
    }
  }
</script>

<style lang="postcss">
  .mu-list-item {
    position: relative;
    line-height: $(listItemLineHeightPx)px;
    padding: $(listItemYPaddingPx)px $(listItemXPaddingPx)px;
    overflow: hidden;

    &[selected] {
      color: $primaryColor;
      fill: $primaryColor;
      font-weight: 700;
    }

    &:hover {
      color: $primaryColor;
      fill: $primaryColor;
      background: $listItemHoverBackground;
    }

    &[active] {
      color: #fff;
      fill: #fff;
      background: $primaryColor;
    }

    & > .mu-icon:first-child {
      display: inline-block;
      width: 20px;
    }

    &:not([multi-lines]) {
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: default;
    }
  }

  .mu-dropdown-panel > .mu-list-item {
    padding: $(dropdownItemYPaddingPx)px $(listItemXPaddingPx)px;
    cursor: pointer;
  }
  .mu-dropdown-menu > .mu-list-item {
    &:hover {
      color: #fff;
      fill: #fff;
      background: $primaryColor;
    }
  }
</style>
