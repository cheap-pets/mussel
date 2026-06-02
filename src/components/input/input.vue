<template>
  <div class="mu-input" v-bind="wrapperAttrs">
    <component :is="pre.is" v-if="pre" v-bind="pre.attrs" class="mu-input__prefix" @click="onPrefixClick">
      {{ pre.content }}
    </component>
    <input v-model="model" v-bind="inputAttrs">
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click="clear" />
    <component :is="suf.is" v-if="suf" v-bind="suf.attrs" class="mu-input__suffix" @click="onSuffixClick">
      {{ suf.content }}
    </component>
  </div>
</template>

<script setup>
  import './input.scss'

  import { inputProps, inputEvents, useInput } from './input'
  import { useFieldModel } from '../form/validation'

  defineOptions({ name: 'MusselInput' })

  const props = defineProps({ ...inputProps, type: String, modelValue: null })
  const emit = defineEmits([...inputEvents, 'update:modelValue'])

  const { model } = useFieldModel(props, 'modelValue', emit)

  const {
    wrapperAttrs,
    inputAttrs,
    prefix: pre,
    suffix: suf,
    onPrefixClick,
    onSuffixClick,
    clearButtonVisible,
    clearButtonAttrs
  } = useInput(model, props, emit)

  function clear () {
    model.value = null
  }
</script>
