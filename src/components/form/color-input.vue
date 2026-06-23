<template>
  <combo-wrapper
    ref="wrapper"
    v-model="model"
    class="mu-color-input"
    dropdown-icon="dropdownExpand"
    :dropdown-class="['mu-color-input__panel', dropdownClass]"
    :editable="false"
    @dropdown:show="onDropdownShow"
    @dropdown:hide="onDropdownHide">
    <!-- 默认 slot：色块 + HEX 输入（覆盖 combo-wrapper 内置 input） -->
    <span
      class="mu-color-input__swatch"
      :style="swatchStyle"
      @click.stop="onSwatchClick" />
    <input
      v-model="hexInput"
      class="mu-color-input__field"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @keydown.enter.prevent="onFieldEnter"
      @keydown.esc.prevent="onFieldEsc"
      @blur="onFieldBlur">
    <template #dropdown>
      <div class="mu-color-input__grid">
        <div
          v-for="(group, gi) in palette.groups"
          :key="gi"
          class="mu-color-input__row">
          <button
            v-for="c in group.colors"
            :key="c"
            type="button"
            class="mu-color-input__cell"
            :style="{ background: c }"
            :active="isActive(c) || null"
            :title="c"
            @click="select(c)" />
        </div>
      </div>
    </template>
  </combo-wrapper>
</template>

<script setup>
  import './color-input.scss'

  import { ref, computed, watch } from 'vue'
  import { inputProps } from './input'
  import { useFieldModel } from '../form/validation'
  import { normalizeHex } from '@/utils/color'
  import { MUSSEL_PALETTE } from './color-palette'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselColorInput' })

  const props = defineProps({
    ...inputProps,
    modelValue: String,
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

  const palette = MUSSEL_PALETTE

  const swatchStyle = computed(() => {
    const hex = normalizeHex(model.value)

    return { background: hex || 'transparent' }
  })

  function isActive (c) {
    const cur = normalizeHex(model.value)

    return cur && c.toUpperCase() === cur.toUpperCase()
  }

  function select (hex) {
    model.value = hex
    hexInput.value = hex
    emit('change', hex)
    wrapper.value?.collapse()
  }

  function onSwatchClick () {
    if (props.disabled || props.readonly) return
    wrapper.value?.expand()
  }

  function commitHexInput () {
    const normalized = normalizeHex(hexInput.value)

    if (normalized) {
      model.value = normalized
      hexInput.value = normalized
      emit('change', normalized)
      return true
    }

    // 非法：回滚到当前值
    hexInput.value = model.value || ''
    return false
  }

  function onFieldEnter () {
    if (commitHexInput()) wrapper.value?.collapse()
  }

  function onFieldEsc () {
    hexInput.value = model.value || ''
    wrapper.value?.collapse()
  }

  function onFieldBlur () {
    if (hexInput.value !== (model.value || '')) commitHexInput()
  }

  function onDropdownShow () {
    hexInput.value = model.value || ''
    emit('dropdown:show')
  }

  function onDropdownHide () {
    emit('dropdown:hide')
  }

  // 外部修改 modelValue 时同步输入框
  watch(model, v => {
    if (normalizeHex(hexInput.value) !== (normalizeHex(v))) {
      hexInput.value = v || ''
    }
  })
</script>
