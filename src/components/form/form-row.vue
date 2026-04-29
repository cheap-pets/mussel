<template>
  <div class="mu-form-row">
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
  import { computed } from 'vue'
  import { autoIncrementKeyBuilder } from '@/utils/key-builder'
  import { resolveFormRowItems } from './item-types'

  defineOptions({ name: 'MusselFormRow' })

  const props = defineProps({ items: Array })

  const keyGen = autoIncrementKeyBuilder()

  const resolvedItems = computed(() => resolveFormRowItems(props.items, keyGen))
</script>
