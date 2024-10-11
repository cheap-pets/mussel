<template>
  <combo-wrapper ref="comboBox" v-model="value" class="mu-combo-box">
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
  import { ref } from 'vue'
  import { selectProps, useSelect } from './select'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselComboBox' })

  const comboBox = ref()

  const model = defineModel()
  const props = defineProps({ ...selectProps })

  const { value, optionItems } = useSelect(comboBox, model, props)
</script>
