<template>
  <div
    class="mu-list-item"
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

  import { unsetOrFalse } from '../utils/prop'

  export default {
    name: 'MusselListItem',
    components: {
      'mu-icon': Icon
    },
    props: {
      value: null,
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
        return !unsetOrFalse(this.iconIndent)
      },
      actualActive () {
        return this.active
      },
      actualSelected () {
        return !unsetOrFalse(this.selected)
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
      font-weight: 600;
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

    & > .mu-icon {
      display: inline-block;
      width: 20px;
    }

    &:not([multi-lines]) {
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: default;
    }
  }
</style>
