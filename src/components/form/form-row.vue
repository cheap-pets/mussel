<template>
  <div class="mu-form-row">
    <slot>
      <template v-for="item in rowItems" :key="item.key">
        <component :is="item.is" v-if="item.text" v-bind="item.attrs">
          {{ item.text }}
        </component>
        <component :is="item.is" v-else v-bind="item.attrs" />
      </template>
    </slot>
  </div>
</template>

<script setup>
  import { useFormRowItems } from './items'

  defineOptions({ name: 'MusselFormRow' })

  const props = defineProps({ items: Array })
  const rowItems = useFormRowItems(props).items
</script>
