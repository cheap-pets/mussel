import { ref, provide, nextTick } from 'vue'

// 弹层链协调：持有全部层级弹层实例（v-for 按层序惰性生成、常驻复用），
// provide('popupChain') 供弹层层间互访与下钻路由
export function usePopupChain () {
  // 弹层链实例表（按层序）：非响应式数组，仅命令式访问（show/hide/链式级联）
  const popupLayerCount = ref(1)
  const popupLayers = []

  function getLayer (index) {
    return popupLayers[index]
  }

  function setLayer (index, instance) {
    popupLayers[index] = instance
  }

  // 生成或复用层实例并弹出：新层首次触发时先扩容 v-for，待实例挂载后 show
  async function showLayer (index, group, anchor, options) {
    if (popupLayerCount.value <= index) {
      popupLayerCount.value = index + 1
      await nextTick()
    }

    popupLayers[index]?.show(anchor, group, options)
  }

  provide('popupChain', {
    getLayer,
    setLayer,
    showLayer
  })

  return {
    popupLayers,
    popupLayerCount,
    showLayer
  }
}
