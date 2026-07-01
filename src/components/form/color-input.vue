<template>
  <combo-wrapper
    ref="wrapper"
    v-model="model"
    class="mu-color-input"
    :disabled="disabled"
    :readonly="readonly"
    :dropdown-class="['mu-color-input__dropdown', dropdownClass]">
    <a class="mu-color-input__color-block" :style="{ background: normalized }" @click.stop="onSwatchClick" />
    <input
      v-model="inputValue"
      class="uppercase"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @keydown.enter.prevent="onInputEnter"
      @keydown.esc.prevent="onInputEsc"
      @blur="onFieldBlur">
    <template #dropdown>
      <div v-for="(group, idx) in palette" :key="idx" class="mu-color-input__color-group">
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

  import { ref, shallowRef, computed, watch } from 'vue'
  import { useFieldModel } from '../form/validation'
  import { normalizeHex } from '@/utils/color'
  import { palette } from './color-palette'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselColorInput' })

  const props = defineProps({
    disabled: Boolean,
    readonly: Boolean,
    placeholder: String,
    dropdownClass: null
  })

  const rawModel = defineModel({ type: String })
  const model = useFieldModel(rawModel).modelProxy

  const wrapper = shallowRef()

  // HEX 输入框文本（允许临时非法值，仅在确认时规范化提交）
  const inputValue = ref(model.value || '')
  const normalized = computed(() => normalizeHex(inputValue.value))

  function select (hex) {
    model.value = inputValue.value = hex
    wrapper.value?.collapse()
  }

  function onSwatchClick () {
    if (!props.disabled && !props.readonly) {
      wrapper.value?.expand()
    }
  }

  function commitInput () {
    const value = normalized.value

    if (value) {
      model.value = inputValue.value = value
      return true
    }

    inputValue.value = model.value || ''
  }

  function onInputEnter () {
    if (commitInput()) {
      wrapper.value?.collapse()
    }
  }

  function onInputEsc () {
    inputValue.value = model.value || ''
    wrapper.value?.collapse()
  }

  function onFieldBlur () {
    if (inputValue.value !== (model.value || '')) {
      commitInput()
    }
  }

  // 外部修改 modelValue 时同步输入框
  watch(model, v => {
    if (normalizeHex(inputValue.value) !== normalizeHex(v)) {
      inputValue.value = v || ''
    }
  })
</script>
