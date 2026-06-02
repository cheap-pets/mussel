<template>
  <div class="mu-tags">
    <div v-for="el in items" :key="getKey(el)" class="mu-tags__tag" tabindex="-1">
      <label :title="tooltip ? (el.title || el.label) : null">
        {{ el.label }}
      </label>
      <mu-icon v-if="removable" icon="X" @click.stop="onRemove(el)" />
    </div>
    <mu-dropdown
      v-if="moreCount || dropdownVisible"
      ref="dropdown"
      v-bind="dropdownBindings"
      class="mu-tags__more"
      tabindex="-1"
      @click.stop>
      +{{ moreCount }}
      <template #dropdown>
        <mu-tags
          :tags="tags"
          :tooltip="tooltip"
          :removable="removable"
          @tag-remove="onRemove" />
      </template>
    </mu-dropdown>
  </div>
</template>

<script setup>
  import './tags.scss'

  import { ref, computed, useAttrs } from 'vue'
  import { pickBy } from '@/utils/object'
  import { autoIncrementKeyBuilder } from '@/utils/key-builder'

  defineOptions({ name: 'MusselTags' })

  const emit = defineEmits(['tag-remove'])

  const props = defineProps({
    removable: Boolean,
    expandable: Boolean,
    max: { type: Number },
    tags: { type: Array, default: () => [] },
    tooltip: { type: Boolean, default: true },
    dropdownSnapTo: { default: '$parent' }
  })

  const attrs = useAttrs()

  const getKey = autoIncrementKeyBuilder()

  const dropdown = ref()

  const dropdownVisible = computed(() =>
    props.tags.length &&
    dropdown.value?.dropdownVisible
  )

  const dropdownBindings = computed(() => ({
    'dropdown-width': '$same',
    'dropdown-trigger': 'click',
    'dropdown-disabled': !props.expandable,
    'dropdown-snap-to': props.dropdownSnapTo,
    ...pickBy(attrs, key => key.startsWith('dropdown'))
  }))

  const moreCount = computed(() => {
    const max = props.max
    const len = props.tags.length

    return !max || max >= len
      ? 0
      : Math.min(len - max, 99)
  })

  const items = computed(() =>
    moreCount.value
      ? props.tags.slice(0, props.max)
      : props.tags
  )

  function onRemove (tag) {
    emit('tag-remove', tag)
  }
</script>
