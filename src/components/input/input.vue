<template>
  <div class="mu-input" v-bind="wrapperAttrs">
    <component :is="pre.is" v-if="pre" v-bind="pre.attrs" class="mu-input_prefix" @click="onPrefixClick">
      {{ pre.content }}
    </component>
    <input v-model="model" v-bind="inputAttrs">
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click="clear" />
    <component :is="suf.is" v-if="suf" v-bind="suf.attrs" class="mu-input_suffix" @click="onSuffixClick">
      {{ suf.content }}
    </component>
  </div>
</template>

<script setup>
  import './input.scss'

  import { inputProps, inputEvents, useInput } from './input'

  defineOptions({ name: 'MusselInput' })

  const model = defineModel()
  const props = defineProps({ ...inputProps, type: String })
  const emit = defineEmits([...inputEvents])

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
