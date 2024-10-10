<template>
  <input-wrapper ref="wrapper" v-model="value" class="mu-combo-box">
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
  import { ref, provide } from 'vue'
  import { selectProps, useSelect } from './select'

  import InputWrapper from './dropdown-input-wrapper.vue'

  defineOptions({ name: 'MusselComboBox' })

  const model = defineModel()
  const props = defineProps({ ...selectProps })

  const {
    value,
    mountOption,
    unmountOption,
    selectOptions
  } = useSelect(model, props)

  const wrapper = ref()

  // function onInputClick () {
  //   wrapper.value.toggleDropdown()
  // }

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
