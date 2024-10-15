<template>
  <combo-wrapper ref="comboBox" v-model="value" class="mu-select" :editable="false">
    <template #input="{ placeholder }">
      <div
        class="mu-select_selected-item mu-text-ellipsis"
        :placeholder="placeholder"
        :title="showValueTooltip ? value : null">
        {{ value }}
      </div>
    </template>
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

  import { ref } from 'vue'
  import { selectProps, useSelect } from './select'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselSelect' })

  const model = defineModel()
  const props = defineProps({ ...selectProps, showValueTooltip: Boolean })

  const comboBox = ref()

  const { value, optionItems } = useSelect(comboBox, model, props)
</script>
