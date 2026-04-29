<template>
  <div class="mu-form">
    <slot>
      <template v-for="item in resolvedItems" :key="item.key">
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

  import { provide, computed } from 'vue'
  import { autoIncrementKeyBuilder } from '@/utils/key-builder'
  import { resolveFormItems } from './item-types'

  defineOptions({ name: 'MusselForm' })

  const props = defineProps({
    model: Object,
    items: Array,
    labelWidth: String,
    labelAlign: String
  })

  const keyGen = autoIncrementKeyBuilder()

  const resolvedItems = computed(() => resolveFormItems(props.items, keyGen))

  provide('form', props)
</script>
