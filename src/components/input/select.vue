<template>
  <combo-wrapper v-model="comboValue" class="mu-select" :editable="false">
    <div
      class="mu-select_value-box mu-text-ellipsis"
      :placeholder="placeholder"
      :title="showValueTooltip ? comboValue : null">
      {{ comboValue }}
    </div>
    <template #dropdown>
      <slot name="dropdown">
        <component
          :is="el.is"
          v-for="el in optionItems" :key="el.key"
          v-bind="el.bindings" />
      </slot>
    </template>
  </combo-wrapper>
</template>

<script setup>
  import './select.scss'

  import ComboWrapper from './combo-wrapper.vue'

  import { selectProps, useSelect } from './select'

  defineOptions({ name: 'MusselSelect' })

  const model = defineModel()
  const props = defineProps({ ...selectProps, placeholder: String, showValueTooltip: Boolean })

  const {
    comboValue,
    optionItems
  } = useSelect(model, props)
</script>
