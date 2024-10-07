<template>
  <mu-tree-node
    v-for="el in nodes"
    :key="el[keyProp]"
    :node="el"
    :level="level">
    <template #default="scoped">
      <slot :node="scoped.node" />
    </template>
    <template #buttons="scoped">
      <slot name="buttons" :node="scoped.node" />
    </template>
  </mu-tree-node>
</template>

<script setup>
  import { inject } from 'vue'

  defineProps({
    nodes: Array,
    level: Number
  })

  const { keyProp } = inject('tree')
</script>
