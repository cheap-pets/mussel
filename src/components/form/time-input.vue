<template>
  <combo-wrapper
    ref="wrapper"
    v-model="textInput"
    class="mu-time-input"
    dropdown-icon="clock"
    :dropdown-class="['mu-time-input__dropdown', dropdownClass]"
    @dropdown:show="onDropdownShow"
    @enter.prevent="onInputEnter"
    @esc.prevent="onInputEsc"
    @blur="onInputBlur">
    <template #dropdown>

    </template>
  </combo-wrapper>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { parseTime, formatTime } from '@/utils/date'
  import { useFieldModel } from '../form/validation'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselTimeInput' })

  const props = defineProps({
    modelValue: String,
    second: Boolean,
    minuteStep: { type: Number, default: 5 },
    secondStep: { type: Number, default: 5 },
    dropdownClass: null
  })

  const emit = defineEmits([
    'update:modelValue',
    'dropdown:show',
    'dropdown:hide'
  ])

  function onDropdownShow () {

  }

  function onInputEnter () {

  }

  function onInputEsc () {

  }

  function onInputBlur () {
    
  }
</script>
