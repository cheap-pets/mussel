<template>
  <combo-wrapper v-model="value" class="mu-combo-box" :editable="editable">
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
  import { selectProps, useSelect } from './select'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselComboBox' })

  const model = defineModel({
    validator (v) {
      if (Array.isArray(v)) {
        console.warn(
          '[MUSSEL:COMBO]',
          'Prop "modelValue" cannot be specified as an array.'
        )

        return false
      }

      return true
    }
  })

  const props = defineProps({
    ...selectProps,
    editable: Boolean
  })

  const {
    value,
    optionItems
  } = useSelect(model, props)
</script>
