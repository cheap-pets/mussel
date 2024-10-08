<template>
  <input-wrapper
    ref="wrapper"
    v-model="model"
    class="mu-select">
    <template #input="attrs">
      <div
        class="mu-select_value mu-text-ellipsis"
        :placeholder="attrs.placeholder">
        {{ value }}
      </div>
    </template>
    <template #dropdown>
      <slot name="dropdown">
        <component
          :is="el.is"
          v-for="el in selectOptions" :key="el.key"
          v-bind="el.bindings" />
      </slot>
    </template>
  </input-wrapper>
</template>

<script setup>
  import './select.scss'

  import { ref, provide } from 'vue'
  import { selectProps, useSelect } from './select'

  import InputWrapper from './dropdown-input-wrapper.vue'

  defineOptions({ name: 'MusselSelect' })

  const model = defineModel()
  const props = defineProps({ ...selectProps })

  const {
    value,
    mountOption,
    unmountOption,
    selectOptions
  } = useSelect(model, props)

  const wrapper = ref()

  function onOptionClick (option) {
    model.value = option.value
    wrapper.value.hideDropdown()
  }

  provide('select', {
    mountOption,
    unmountOption,
    onOptionClick
  })
</script>
