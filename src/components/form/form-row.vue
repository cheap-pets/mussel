<template>
  <div class="mu-form-row">
    <slot>
      <template v-for="item in items" :key="getItemKey(item)">
        <div v-if="isString(item)" class="mu-form-row__title">
          {{ item }}
        </div>
        <mu-form-field v-else-if="item.prop" v-bind="item" />
      </template>
    </slot>
  </div>
</template>

<script setup>
  import { isString } from '@/utils/type'
  import { autoIncrementKeyBuilder } from '@/utils/key-builder'

  defineOptions({ name: 'MusselFormRow' })

  const getItemKey = autoIncrementKeyBuilder()
</script>
