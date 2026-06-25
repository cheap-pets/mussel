<template>
  <combo-wrapper
    ref="wrapper"
    v-model="textInput"
    class="mu-time-input"
    dropdown-icon="clock"
    @dropdown:show="onDropdownShow"
    @enter.prevent="onInputEnter"
    @esc.prevent="onInputEsc"
    @blur="onFieldBlur">
    <template #dropdown>
      <time-picker
        ref="picker"
        v-model="timeObj"
        :type="type"
        :minute-step="minuteStep"
        :second-step="secondStep"
        @change="onPickerChange" />
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
    'change',
    'dropdown:show',
    'dropdown:hide'
  ])

  const { model } = useFieldModel(props, 'modelValue', emit)

  const wrapper = ref()
  const picker = ref()

  const includeSecond = computed(() => props.type === 'time')

  // 输入框暂存文本（允许临时非法值，确认时校验）
  const textInput = ref(model.value || '')

  // 面板用的结构化对象：由 modelValue 解析
  const timeObj = ref(parseTime(model.value) || { hour: 0, minute: 0, second: 0 })

  // modelValue 外部变化 → 同步 textInput 与 timeObj
  watch(model, v => {
    if (v !== textInput.value) textInput.value = v || ''
    const parsed = parseTime(v)
    if (parsed) timeObj.value = parsed
  })

  // 面板点选/滚动吸附 → 组装回 24h 字符串并 emit
  // 仅点击选值时收起面板；滚动吸附不收起，避免用户滚动浏览时面板被收起
  function onPickerChange (meta) {
    const v = formatTime(timeObj.value, includeSecond.value)
    if (v !== model.value) {
      model.value = v
      textInput.value = v
      emit('change', v)
    }
    if (meta?.from === 'click') wrapper.value?.collapse()
  }

  function commitInput () {
    const v = textInput.value.trim()
    const parsed = parseTime(v)
    if (parsed) {
      const normalized = formatTime(parsed, includeSecond.value)
      if (normalized !== model.value) {
        model.value = normalized
        timeObj.value = parsed
        emit('change', normalized)
      }
      textInput.value = normalized
      return true
    }
    // 非法 → 回滚
    textInput.value = model.value || ''
    return false
  }

  function onInputEnter () {
    if (commitInput()) wrapper.value?.collapse()
  }

  function onInputEsc () {
    textInput.value = model.value || ''
    wrapper.value?.collapse()
  }

  function onFieldBlur () {
    if (textInput.value !== (model.value || '')) commitInput()
  }

  function onDropdownShow () {
    picker.value?.scrollToSelected()
  }

  defineExpose({
    expand: () => wrapper.value?.expand(),
    collapse: () => wrapper.value?.collapse()
  })
</script>
