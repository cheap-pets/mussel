<template>
  <input-wrapper ref="wrapper" v-model="model" class="mu-date-input">
    <template #input="attrs">
      <input v-model="value" v-bind="attrs" @click.stop="onInputClick">
    </template>
    <template #dropdown>
      <mu-calendar
        v-model="model"
        class="mu-date-input_calendar"
        :format="format" :min="min" :max="max" />
    </template>
  </input-wrapper>
</template>

<script setup>
  import './date-input.scss'

  import { ref, computed } from 'vue'
  import { toString } from '@/utils/date'
  import { calendarProps } from '../picker/calendar'

  import InputWrapper from './dropdown-input-wrapper.vue'

  defineOptions({ name: 'MusselDateInput' })

  const model = defineModel({ type: [Date, String, Array] })
  const props = defineProps({ ...calendarProps })

  const wrapper = ref()

  const value = computed({
    get () {
      return toString(model.value, props.format)
    },
    set (v) {
      model.value = v
    }
  })

  function onInputClick () {
    wrapper.value.onTriggerClick()
  }

  function hideDropdown () {
    wrapper.value.hideDropdown()
  }
</script>
