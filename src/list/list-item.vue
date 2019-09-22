<template>
  <div
    class="mu-list-item"
    :class="className"
    :active="actualActive"
    :selected="actualSelected"
    @click="onClick">
    <mu-icon
      v-if="actualIcon || actualIconClass || keepIconIndent"
      :icon="actualIcon"
      :icon-class="actualIconClass"
      @click="onButtonClick" />
    <slot>{{ actualLabel }}</slot>
  </div>
</template>

<script>
  import Icon from '../icon/index.vue'

  export default {
    components: {
      'mu-icon': Icon
    },
    inject: {
      keepIconIndent: {
        default: false
      }
    },
    props: {
      className: String,
      iconClass: String,
      icon: String,
      label: String,
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
      actualActive () {
        return this.active
      },
      actualSelected () {
        return this.selected
      },
      actualTriggerIcon () {
        return this.triggerIcon
      }
    },
    methods: {
      onClick () {
        if (!this.disabled) this.$emit('click')
      },
      onButtonClick () {
        if (!this.disabled) this.$emit('buttonclick')
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

  .mu-list-divider {
    display: block;
    margin-top: 4px;
    margin-bottom: 4px;
    height: 1px;
    border-bottom: 1px solid $(listDividerColor);

    &:first-child, &:last-child {
      display: none;
    }
  }

  .mu-dropdown > .mu-list-item {
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
