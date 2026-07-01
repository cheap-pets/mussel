<template>
  <div class="mu-input" v-bind="wrapperAttrs">
    <component :is="pre.is" v-if="pre" v-bind="pre.attrs" class="mu-input__prefix" @click="onPrefixClick">
      {{ pre.content }}
    </component>
    <input v-model="model" v-bind="inputAttrs" v-on="inputEvents">
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click="clear()" />
    <component :is="suf.is" v-if="suf" v-bind="suf.attrs" class="mu-input__suffix" @click="onSuffixClick">
      {{ suf.content }}
    </component>
  </div>
</template>

<script setup>
  import { inputProps, inputEmits, useInput } from './input'
  import { useFieldModel } from '../form/validation'

  defineOptions({ name: 'MusselInput' })

  const emit = defineEmits([...inputEmits])
  const props = defineProps({ ...inputProps, type: String })

  const rawModel = defineModel()
  const model = useFieldModel(rawModel).modelProxy

  const {
    wrapperAttrs,
    inputAttrs,
    inputEvents,
    prefix: pre,
    suffix: suf,
    onPrefixClick,
    onSuffixClick,
    clearButtonVisible,
    clearButtonAttrs,
    clear
  } = useInput(model, props, emit)
</script>
