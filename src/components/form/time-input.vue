<template>
  <combo-wrapper
    ref="wrapper"
    v-model="comboValue"
    class="mu-time-input"
    dropdown-icon="clock"
    :dropdown-width="dropdownWidth"
    :dropdown-class="['mu-time-input__dropdown', dropdownClass]"
    @dropdown:show="picker?.updatePosition()">
    <template #dropdown>
      <time-picker
        ref="picker"
        v-model="editingTime"
        :minute-step="minuteStep"
        :second-step="secondStep" />
      <mu-button
        :caption="t('Button.OK')"
        class="mu-time-input__accept-button"
        button-style="text"
        size="small"
        @click="updateModelValue" />
    </template>
  </combo-wrapper>
</template>

<script setup>
  import { ref, shallowRef, computed, watchEffect } from 'vue'

  import { toTimeString } from '@/utils/date'
  import { t } from '@/langs'

  import { useFieldModel } from '../form/validation'
  import { timeSteProp } from '../calendar/props'

  import ComboWrapper from './combo-wrapper.vue'
  import TimePicker from '../calendar/time-picker.vue'

  defineOptions({ name: 'MusselTimeInput' })

  const props = defineProps({
    format: { type: String, default: 'HH:mm:ss' },
    minuteStep: timeSteProp,
    secondStep: timeSteProp,
    dropdownWidth: { default: 'anchor' },
    dropdownClass: null
  })

  const rawModel = defineModel({ type: String })
  const model = useFieldModel(rawModel).modelProxy

  const wrapper = shallowRef()
  const picker = shallowRef()
  const editingTime = ref(model.value)

  const comboValue = computed({
    get: () => toTimeString(model.value, props.format),
    set: v => { model.value = v }
  })

  function updateModelValue () {
    model.value = toTimeString(editingTime.value, props.format)
    wrapper.value.collapse()
  }

  watchEffect(() => {
    editingTime.value = model.value
  })
</script>

<style>
  .mu-time-input__dropdown > .mu-time-picker {
    background: none;
  }

  .mu-time-input__accept-button {
    width: 100%;
    margin-top: var(--mu-half-spacing);
  }
</style>
