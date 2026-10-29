<template>
  <demo-page path="overlay/context-menu">
    <mu-context-menu ref="contextMenu" :menus="menus" @itemclick="onItemClick" />
    <mu-context-menu ref="groupContextMenu" :menus="groupMenus" @itemclick="onItemClick" />
    <demo-section
      title="基础用法"
      note="在下方灰色区域点击鼠标右键打开菜单；菜单项点击结果见日志"
      :code="basicCode"
      vertical>
      <div
        class="demo-context-area"
        @contextmenu="onContextMenu">
        在此区域右键打开菜单
      </div>
      <div class="demo-log">
        最近选择：{{ lastPicked }}
      </div>
    </demo-section>

    <demo-section
      title="分组、分隔线与图标"
      note="右键打开；menus 数据中 '-' 渲染分隔线，{ is: '-', label } 渲染分组标题，icon 字段显示菜单项图标"
      vertical>
      <div
        class="demo-context-area"
        @contextmenu="onGroupContextMenu">
        在此区域右键打开带分组的菜单
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="在区域右下角右键：菜单靠近视口边缘时自动翻转，不溢出视口；ESC、点击外部、页面滚动与窗口缩放均会关闭菜单"
      regression>
      <div
        class="demo-context-area demo-context-area--edge"
        @contextmenu="onContextMenu">
        靠近本区域右下角右键，观察菜单翻转
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-context-menu ref="contextMenu" :menus="menus" />

<div @contextmenu="onContextMenu">
  右键区域
</div>

// menus: [{ label: 'Open', action: 'open' }, '-', { label: 'Delete' }]
function onContextMenu (event) {
  contextMenu.value.show(event)
}`

  const contextMenu = ref()
  const groupContextMenu = ref()
  const lastPicked = ref('无')

  const menus = ref([
    { label: '打开', icon: 'folderOpen', action: 'open' },
    { label: '属性', icon: 'info', action: 'properties' },
    '-',
    { label: '删除', action: 'delete' }
  ])

  const groupMenus = ref([
    { is: '-', label: '文件' },
    { label: '新建', action: 'new' },
    { label: '重命名', action: 'rename' },
    '-',
    { is: '-', label: '收藏' },
    { label: '添加收藏', icon: 'star', action: 'favorite' }
  ])

  function onItemClick (item) {
    lastPicked.value = item.value || item.label
  }

  function onContextMenu (event) {
    contextMenu.value.show(event)
  }

  function onGroupContextMenu (event) {
    groupContextMenu.value.show(event)
  }
</script>

<style>
  .demo-context-area {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--mu-border-color);
    border-radius: 4px;
    color: var(--mu-text-color-muted);
    height: 120px;
    user-select: none;
  }

  .demo-context-area--edge {
    height: 200px;
  }

  .demo-log {
    margin-top: 8px;
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
