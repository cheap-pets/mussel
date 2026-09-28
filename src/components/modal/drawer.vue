<template>
  <Teleport v-if="visible || ready" :to="teleportTo" :disabled="!teleport">
    <Transition name="mu-drawer-">
      <div
        v-show="modalVisible"
        ref="maskEl"
        class="mu-drawer-mask mu-modal-mask"
        :class="[maskClass, isAbsolutePosition && 'absolute', !mask && 'mu-modal-mask--invisible']"
        :style="{ zIndex }"
        @click="onMaskClick">
        <div
          ref="drawerEl"
          v-bind="$attrs"
          class="mu-drawer"
          :class="[`mu-drawer--${position}`, rounded && 'mu-drawer--rounded', resizing && 'mu-drawer--resizing']"
          :style="{ ...drawerSize, cursor: resizing || undefined }">
          <slot />
          <div v-if="resizable" class="mu-drawer__resize-handle" @pointerdown.stop="onResizeStart" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import './drawer.scss'

  import { computed, reactive, shallowRef, watch } from 'vue'
  import { resolveSize } from '@/utils/size'
  import { modalProps, modalEvents, useModal } from './modal'
  import { useDrawerResize } from './drawer-resize'

  defineOptions({ name: 'MusselDrawer', inheritAttrs: false })

  const props = defineProps({
    ...modalProps,
    zIndex: String,
    width: [String, Number],
    height: [String, Number],
    rounded: Boolean,
    resizable: Boolean,
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
    isAbsolutePosition,
    onMaskClick
  } = useModal(props, emit)

  const maskEl = shallowRef()
  const drawerEl = shallowRef()

  // 用户拖拽物化的尺寸；undefined 时回落 props
  const userSize = reactive({ width: undefined, height: undefined })

  const { resizing, onResizeStart, releaseResize } = useDrawerResize({
    props, drawerEl, maskEl, modalVisible, userSize
  })

  const drawerSize = computed(() => ({
    width: userSize.width ?? resolveSize(props.width),
    height: userSize.height ?? resolveSize(props.height)
  }))

  // 重开重置：重开恢复 props 尺寸
  watch(() => props.visible, v => {
    if (v) userSize.width = userSize.height = undefined
  })

  // props 尺寸/position 为真源：任一变更 ⇒ 终止进行中的拖拽 + 丢弃物化尺寸。
  // 不先 release 则 move 闭包按旧 base 继续写回，把 props 变更静默覆盖并回弹一次；
  // position 变更时旧维度的 px 在另一维度上语义失效。
  // watch 回调同步执行，期间不会插入 pointermove，先 release 再清空即无残留
  watch([() => props.width, () => props.height, () => props.position], () => {
    releaseResize()
    userSize.width = userSize.height = undefined
  })
</script>
