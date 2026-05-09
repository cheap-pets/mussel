<template>
  <div class="mu-form">
    <slot>
      <template v-for="item in formItems" :key="item.key">
        <component :is="item.is" v-if="item.text" v-bind="item.attrs">
          {{ item.text }}
        </component>
        <component :is="item.is" v-else v-bind="item.attrs" />
      </template>
    </slot>
  </div>
</template>

<script setup>
  import './form.scss'

  import { ref, reactive, toRefs, toRaw, computed, provide } from 'vue'
  import { isEmpty } from '@/utils/type'

  import { useFormItems } from './items'
  import { normalizeRule, validateRequired, executeValidator } from './validation'

  defineOptions({ name: 'MusselForm' })

  const props = defineProps({
    items: Array,
    model: Object,
    rules: Object,
    labelWidth: String,
    labelAlign: String
  })

  const { model, labelWidth, labelAlign } = toRefs(props)
  const { items: formItems } = useFormItems(props)

  const labels = {}
  const extraRequired = {}
  const errors = ref({})

  const normalizedRules = computed(() => {
    const rawRules = props.rules || {}
    const outRules = {}

    Object.keys(rawRules).forEach(prop => {
      const rule = normalizeRule(rawRules[prop])

      if (rule) outRules[prop] = rule
    })

    return outRules
  })

  function setRequired (prop, value) {
    if (value) extraRequired[prop] = true
    else delete extraRequired[prop]
  }

  function setLabel (prop, value) {
    if (value) labels[prop] = value
    else delete labels[prop]
  }

  function validateField (prop) {
    const rule = { ...normalizedRules.value[prop] }

    if (extraRequired[prop]) rule.required = true

    const { required, validator, ...params } = rule

    params.label ||= labels[prop]

    const value = props.model[prop]

    const error =
      (required && validateRequired(value, params)) ||
      (validator && executeValidator(validator, value, params))

    if (error) {
      errors.value[prop] = error
    } else {
      delete errors.value[prop]
    }
  }

  function validate () {
    Object
      .keys({ ...extraRequired, ...normalizedRules.value })
      .forEach(validateField)

    return isEmpty(errors.value)
      ? { ok: true }
      : { errors: toRaw(errors.value) }
  }

  function resetValidation () {
    errors.value = {}
  }

  const form = reactive({
    model,
    labelWidth,
    labelAlign,
    rules: normalizedRules,
    errors,
    setLabel,
    setRequired,
    validateField
  })

  provide('form', form)

  defineExpose({
    errors,
    validate,
    resetValidation
  })
</script>
