<template>
  <Teleport v-if="visible || ready" :to="teleportTo" :disabled="!teleport">
    <Transition name="mu-drawer-">
      <div
        v-show="modalVisible"
        v-bind="maskAttrs"
        class="mu-drawer-mask mu-modal-mask"
        :class="[maskClass, isAbsolutePosition && 'absolute', !mask && 'mu-modal-mask--invisible']"
        :style="{ zIndex }"
        @click="onMaskClick">
        <div
          v-bind="$attrs"
          class="mu-drawer"
          :class="[`mu-drawer--${position}`, rounded && 'mu-drawer--rounded']"
          :style="drawerSize">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import './drawer.scss'

  import { computed } from 'vue'
  import { resolveSize } from '@/utils/size'
  import { modalProps, modalEvents, useModal } from './modal'

  defineOptions({ name: 'MusselDrawer', inheritAttrs: false })

  const props = defineProps({
    ...modalProps,
    zIndex: String,
    width: [String, Number],
    height: [String, Number],
    rounded: Boolean,
    teleport: { type: Boolean, default: true },
    mask: { type: Boolean, default: true },
    position: {
      type: String,
      default: 'bottom',
      validator: v => ['top', 'right', 'bottom', 'left'].includes(v.toLowerCase())
    }
  })

  const emit = defineEmits([...modalEvents])

  const {
    ready,
    teleportTo,
    modalVisible,
    onMaskClick
  } = useModal(props, emit)

  const drawerSize = computed(() => ({
    width: resolveSize(props.width),
    height: resolveSize(props.height)
  }))
</script>
