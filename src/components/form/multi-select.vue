<template>
  <combo-wrapper
    ref="wrapper"
    v-model="comboValue"
    class="mu-multi-select"
    :disabled="disabled"
    :readonly="readonly"
    :dropdown-width="dropdownWidth"
    :dropdown-items="dropdownItems"
    :dropdown-class="['mu-select__dropdown-panel', dropdownClass]"
    :dropdown-scrollbar="dropdownScrollbar"
    :editable="false"
    @keydown="onKeyDown">
    <template #default="{ placeholder }">
      <mu-tags
        expandable
        :max="maxTags"
        :tags="selectedItems"
        :tooltip="tagTooltip"
        :tag-shrink="tagShrink || null"
        :removable="!disabled && !readonly"
        :placeholder="placeholder"
        :dropdown-anchor="wrapper"
        :dropdown-width="dropdownWidth"
        :dropdown-class="['mu-select__dropdown-panel', dropdownClass]"
        :dropdown-scrollbar="dropdownScrollbar"
        @tag-remove="onItemRemove" />
    </template>
    <template #dropdown>
      <slot name="dropdown" />
    </template>
  </combo-wrapper>
</template>

<script setup>
  import './multi-select.scss'

  import { ref } from 'vue'

  import { multiSelectProps, useMultiSelect } from './multi-select'
  import { useFieldModel } from '../form/validation'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselMultiSelect' })

  const props = defineProps({
    disabled: Boolean,
    readonly: Boolean,
    ...multiSelectProps
  })

  const rawModel = defineModel()
  const model = useFieldModel(rawModel).modelProxy

  const {
    comboValue,
    selectedItems,
    dropdownItems,
    toggleOption
  } = useMultiSelect(model, props)

  const wrapper = ref()

  function onItemRemove (item) {
    toggleOption(item, false)
  }

  function onKeyDown ({ keyCode }) {
    if (![37, 39].includes(keyCode)) return

    const wrapperEl = wrapper.value.$el
    const target = wrapperEl.querySelector('.mu-tags > :focus')

    const sibling = target
      ? (
        (keyCode === 37 && target.previousElementSibling) ||
        (keyCode === 39 && target.nextElementSibling)
      )
      : wrapperEl.querySelector('.mu-tags > div')

    if (!sibling) return
    if (target) wrapper.value.collapse()

    sibling.focus()
    sibling.scrollIntoView()
  }
</script>
