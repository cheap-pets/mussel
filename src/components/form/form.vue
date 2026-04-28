<template>
  <div class="mu-form">
    <slot>
      <template v-for="item in items" :key="getItemKey(item)">
        <mu-form-row v-if="Array.isArray(item)" :items="item" />
        <hr v-else-if="item === '--'">
        <mu-flex-break v-else-if="item === '->'" />
        <div v-else-if="isString(item)" class="mu-form__title">
          {{ item }}
        </div>
        <component :is="item.is" v-else-if="item.is" v-bind="item.attrs" v-on="item.events">
          {{ item.text }}
        </component>
        <mu-form-field v-else-if="item.prop" v-bind="item" />
      </template>
    </slot>
  </div>
</template>

<script setup>
  import './form.scss'

  import { provide } from 'vue'
  import { isString } from '@/utils/type'
  import { autoIncrementKeyBuilder } from '@/utils/key-builder'

  defineOptions({ name: 'MusselForm' })

  const props = defineProps({
    model: Object,
    items: Array,
    labelWidth: String,
    labelAlign: String
  })

  const getItemKey = autoIncrementKeyBuilder()

  provide('form', props)
</script>
