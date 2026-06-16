<template>
  <div class="mu-input" v-bind="wrapperAttrs">
    <component :is="pre.is" v-if="pre" v-bind="pre.attrs" class="mu-input__prefix" @click="onPrefixClick">
      {{ pre.content }}
    </component>
    <input v-model="model" v-bind="inputAttrs" v-on="inputEvents">
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click="clear('')" />
    <component :is="suf.is" v-if="suf" v-bind="suf.attrs" class="mu-input__suffix" @click="onSuffixClick">
      {{ suf.content }}
    </component>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { debounce } from 'throttle-debounce'

  import { inputProps, inputEmits, useInput } from './input'

  defineOptions({ name: 'MusselSearchInput' })

  const props = defineProps({
    ...inputProps,
    type: String,
    modelValue: null,
    prefix: { type: [String, Object], default: ':icon=search' },
    clearable: { type: Boolean, default: true },
    debounceDelay: { type: Number, default: 500 }
  })

  const emit = defineEmits([...inputEmits, 'update:modelValue'])

  let updatedValue = props.modelValue ?? ''

  const localValue = ref(updatedValue)

  const debouncedUpdate = debounce(
    props.debounceDelay,
    v => (updatedValue !== v) && emit('update:modelValue', (updatedValue = v))
  )

  const model = computed({
    get () {
      return localValue.value
    },
    set (v) {
      localValue.value = v ?? ''
      debouncedUpdate(v)
    }
  })

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

  watch(() => props.modelValue, v => {
    v ??= ''

    if (v !== localValue.value) {
      localValue.value = updatedValue = v
    }
  })
</script>
