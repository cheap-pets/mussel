<template>
  <combo-wrapper
    v-model="comboValue"
    class="mu-combo-box mu-select"
    :dropdown-items="dropdownItems"
    :dropdown-class="['mu-select__dropdown-panel', dropdownClass]"
    :dropdown-width="dropdownWidth"
    :dropdown-scrollbar="dropdownScrollbar"
    :editable="editable">
    <template v-if="$slots['dropdown-header']" #dropdown-header>
      <slot name="dropdown-header" />
    </template>
    <template v-if="$slots['dropdown-items']" #dropdown-items>
      <slot name="dropdown-items" />
    </template>
    <template v-else-if="$slots.dropdown" #dropdown>
      <slot name="dropdown" />
    </template>
    <template v-if="$slots['dropdown-footer']" #dropdown-footer>
      <slot name="dropdown-footer" />
    </template>
  </combo-wrapper>
</template>

<script setup>
  import { selectProps, useSelect } from './select'
  import { useFieldModel } from '../form/validation'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselComboBox' })

  const props = defineProps({ ...selectProps, editable: Boolean })

  const rawModel = defineModel()
  const model = useFieldModel(rawModel).modelProxy

  const { comboValue, dropdownItems } = useSelect(model, props)
</script>
