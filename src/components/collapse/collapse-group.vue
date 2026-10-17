<template>
  <div class="mu-collapse-group">
    <slot />
  </div>
</template>

<script setup>
  import './collapse.scss'

  import { computed, getCurrentInstance, onMounted, provide, shallowRef } from 'vue'

  import { warn } from '@/utils/warn'

  defineOptions({ name: 'MusselCollapseGroup' })

  const props = defineProps({
    accordion: Boolean,
    disabled: Boolean,
    defaultExpand: {
      type: String,
      validator: v => ['first', 'all'].includes(v)
    }
  })

  const expanded = defineModel('expanded', { type: Array, default: () => [] })

  const items = shallowRef([])

  function register (id, el) {
    items.value = [...items.value, { id, el }]
  }

  function unregister (id) {
    items.value = items.value.filter(it => it.id !== id)
  }

  function toggleItem (id) {
    const list = expanded.value ?? []

    expanded.value = list.includes(id)
      ? list.filter(el => el !== id)
      : (props.accordion ? [id] : [...list, id])
  }

  provide('collapseGroup', {
    expanded,
    disabled: computed(() => props.disabled),
    accordion: computed(() => props.accordion),
    register,
    unregister,
    toggleItem
  })

  function applyDefaultExpand () {
    if (props.defaultExpand === 'first') {
      if (items.value.length) expanded.value = [items.value[0].id]
    } else if (props.defaultExpand === 'all') {
      if (props.accordion) {
        warn({
          component: 'CollapseGroup',
          message: 'Accordion mode allows only one expanded panel; defaultExpand="all" falls back to "first".'
        })
        if (items.value.length) expanded.value = [items.value[0].id]
      } else {
        expanded.value = items.value.map(it => it.id)
      }
    }
  }

  onMounted(() => {
    // 受控判定只能读原始 vnode props：model 声明了默认值后 props.expanded 恒为数组，判定永远命中
    const rawProps = getCurrentInstance().vnode.props ?? {}

    if (!('expanded' in rawProps)) applyDefaultExpand()

    if (props.accordion && expanded.value?.length > 1) {
      expanded.value = [expanded.value[0]]
    }
  })
</script>
