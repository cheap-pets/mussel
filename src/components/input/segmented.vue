<template>
  <div class="mu-segmented" :icon-position="iconPosition !== 'left' ? iconPosition : null">
    <div class="mu-segmented__thumb" :style="thumbStyle" />
    <div
      v-for="(option, idx) in normalizedOptions"
      :key="option.value"
      :ref="el => itemRefs[idx] = el"
      class="mu-segmented__item"
      :active="model === option.value || null"
      :disabled="option.disabled || null"
      @click="select(option)"
      @sizechange="model === option.value && updateThumb(true)">
      <slot :option="option">
        <mu-icon v-if="option.icon" :icon="option.icon" />
        <span v-if="option.label">{{ option.label }}</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
  import './segmented.scss'

  import { ref, computed, watch, onMounted } from 'vue'
  import { useFieldModel } from '../form/validation'

  import MuIcon from '../icon/icon.vue'

  defineOptions({ name: 'MusselSegmented' })

  const props = defineProps({
    options: Array,
    iconPosition: { type: String, default: 'left', validator: v => ['left', 'top'].includes(v) },
    modelValue: null
  })

  const emit = defineEmits(['update:modelValue'])

  const { model } = useFieldModel(props, 'modelValue', emit)

  const itemRefs = ref([])
  const thumbStyle = ref({})

  const normalizedOptions = computed(() =>
    props.options?.map(option =>
      typeof option === 'string' || typeof option === 'number'
        ? { label: String(option), value: option }
        : option
    )
  )

  const activeIndex = computed(() =>
    normalizedOptions.value?.findIndex(o => o.value === model.value)
  )

  function updateThumb (immediate) {
    const el = itemRefs.value?.[activeIndex.value]

    if (!el) return

    thumbStyle.value = el
      ? {
        opacity: 1,
        width: `${el.offsetWidth}px`,
        transform: `translateX(${el.offsetLeft}px)`,
        transition: immediate ? 'none' : undefined
      }
      : {
        opacity: 0
      }
  }

  function select (option) {
    model.value = option.value
  }

  watch(activeIndex, () => updateThumb())
  onMounted(updateThumb)
</script>
