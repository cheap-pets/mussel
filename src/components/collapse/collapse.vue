<template>
  <div
    ref="rootEl"
    class="mu-collapse"
    :expanded="isExpanded || null"
    :disabled="isDisabled || null">
    <div class="mu-collapse__head" :class="isHeadTrigger && 'mu-collapse__head--trigger'" @click="onHeadClick">
      <slot name="head" :expanded="isExpanded" :disabled="isDisabled" :toggle="toggle">
        <slot name="head-prepend" :expanded="isExpanded" :disabled="isDisabled" :toggle="toggle" />
        <label v-if="title" class="mu-collapse__title">{{ title }}</label>
        <div v-else class="flex-space" />
        <slot name="head-append" :expanded="isExpanded" :disabled="isDisabled" :toggle="toggle" />
        <mu-icon
          v-if="arrow"
          class="mu-collapse__arrow"
          icon="treeNodeExpand"
          :expanded="isExpanded || null" />
      </slot>
    </div>
    <div class="mu-collapse__body">
      <div class="mu-collapse__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
  import './collapse.scss'

  import { computed, inject, onMounted, onUnmounted, ref, useId } from 'vue'

  defineOptions({ name: 'MusselCollapse' })

  const props = defineProps({
    id: [String, Number],
    title: String,
    disabled: Boolean,
    defaultExpanded: Boolean,
    arrow: { type: Boolean, default: true },
    expandTrigger: {
      type: String,
      validator: v => ['head', 'custom'].includes(v),
      default: 'head'
    }
  })

  const expandedModel = defineModel('expanded', { type: Boolean, default: undefined })
  const emit = defineEmits(['headClick'])

  const group = inject('collapseGroup', null)

  const fallbackId = useId()
  const itemId = computed(() => props.id ?? fallbackId)

  const isHeadTrigger = computed(() => props.expandTrigger === 'head')
  const isDisabled = computed(() => group?.disabled.value || props.disabled)

  const isExpanded = computed(() => {
    if (isDisabled.value) return false

    if (group) {
      return group.accordion.value
        ? group.expanded.value?.[0] === itemId.value
        : (group.expanded.value ?? []).includes(itemId.value)
    }

    return expandedModel.value ?? props.defaultExpanded
  })

  const rootEl = ref(null)

  function toggle () {
    if (isDisabled.value) return

    if (group) group.toggleItem(itemId.value)
    else expandedModel.value = !isExpanded.value
  }

  function onHeadClick () {
    emit('headClick')

    if (isHeadTrigger.value) toggle()
  }

  onMounted(() => {
    group?.register(itemId.value, rootEl.value)
  })

  onUnmounted(() => {
    group?.unregister(itemId.value)
  })
</script>
