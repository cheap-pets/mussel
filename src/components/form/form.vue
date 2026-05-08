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

  import { ref, toRefs, reactive, computed, provide } from 'vue'

  import { isString, isFunction, isObject } from '@/utils/type'
  import { useFormItems } from './items'

  import { RULE_TYPES } from './rules'

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

  const labels = ref({})
  const errors = ref({})

  const formRules = computed(() => {
    const rawRules = props.rules || {}
    const outRules = {}

    Object.keys(rawRules).forEach(prop => {
      const value = rawRules[prop]
      const rawFieldRules = Array.isArray(value) ? value : [value]
      const outFieldRules = []

      rawFieldRules.forEach(el => {
        if (isString(el) && RULE_TYPES[el]) {
          outFieldRules.push({ validator: RULE_TYPES[el] })
        } else if (isFunction(el)) {
          outFieldRules.push({ validator: el })
        } else if (isObject(el)) {
          if (el.validator) {
            outFieldRules.push(el)
          } else {
            const ruleType = el.type
              ? RULE_TYPES[el.type]
              : el.required && RULE_TYPES.required

            if (ruleType) {
              outFieldRules.push({ validator: el, ...el })
            }
          }
        }
      })

      if (outFieldRules.length) {
        outRules[prop] = rawFieldRules
      }
    })

    return outRules
  })

  function setLabel (prop, label) {
    labels.value[prop] = label
  }

  function validateField (prop) {
    const rules = formRules.value[prop]

    rules.forEach(rule => {
      const { validator, ...params } = rule

      params.label ||= labels.value[prop] || 'This field'

      const value = form.model[prop]
      const error = validator(value, params)

      if (error === false) {
        errors.value[prop] = params.message || `${params.label} is invalid`
      } else if (isString(error)) {
        errors.value[prop] = error
      } else {
        delete errors.value[prop]
      }
    })
  }

  function validate () {
    Object.keys(formRules.value).forEach(validateField)
  }

  function resetValidation () {
    errors.value = {}
  }

  const form = reactive({
    model,
    labelWidth,
    labelAlign,
    rules: formRules,
    errors,
    setLabel,
    validateField
  })

  provide('form', form)

  defineExpose({
    validate,
    resetValidation
  })
</script>
