<template>
  <combo-wrapper
    ref="wrapper"
    v-model="model"
    class="mu-color-input"
    :disabled="disabled"
    :readonly="readonly"
    :dropdown-class="['mu-color-input__grid', dropdownClass]">
    <a class="mu-color-input__color-block" :style="{ background: normalized }" @click.stop="onSwatchClick" />
    <input
      v-model="hexInput"
      class="uppercase"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @keydown.enter.prevent="onInputEnter"
      @keydown.esc.prevent="onInputEsc"
      @blur="onFieldBlur">
    <template #dropdown>
      <div v-for="(group, idx) in palette" :key="idx" class="mu-color-input__grid-row">
        <a
          v-for="color in group"
          :key="color"
          class="mu-color-input__color-block"
          :style="{ background: color }"
          :active="color.toUpperCase() === normalized || null"
          :title="color"
          @click="select(color)" />
      </div>
    </template>
  </combo-wrapper>
</template>

<script setup>
  import './color-input.scss'

  import { ref, computed, watch } from 'vue'
  import { useFieldModel } from '../form/validation'
  import { normalizeHex } from '@/utils/color'
  import { palette } from './color-palette'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselColorInput' })

  const props = defineProps({
    modelValue: String,
    disabled: Boolean,
    readonly: Boolean,
    placeholder: String,
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

  // HEX 输入框文本（允许临时非法值，仅在确认时规范化提交）
  const hexInput = ref(model.value || '')
  const normalized = computed(() => normalizeHex(model.value))

  function select (hex) {
    model.value = hex
    hexInput.value = hex
    emit('change', hex)
    wrapper.value?.collapse()
  }

  function onSwatchClick () {
    if (!props.disabled && !props.readonly) {
      wrapper.value?.expand()
    }
  }

  function commitHexInput () {
    const value = normalized.value

    if (value) {
      emit('change', (model.value = hexInput.value = value))
      return true
    }

    hexInput.value = model.value || ''
  }

  function onInputEnter () {
    if (commitHexInput()) {
      wrapper.value?.collapse()
    }
  }

  function onInputEsc () {
    hexInput.value = model.value || ''
    wrapper.value?.collapse()
  }

  function onFieldBlur () {
    if (hexInput.value !== (model.value || '')) {
      commitHexInput()
    }
  }

  // 外部修改 modelValue 时同步输入框
  watch(model, v => {
    if (normalizeHex(hexInput.value) !== (normalizeHex(v))) {
      hexInput.value = v || ''
    }
  })
</script>
