<template>
  <demo-page path="navigation/menu">
    <demo-section
      title="基础用法"
      note="items 声明菜单树（id/icon/label/items 子级），v-model:active-item 绑定叶子项，点击触发 item-click"
      :code="basicCode"
      vertical>
      <mu-menu
        v-model:active-item="active1"
        :items="menus"
        class="demo-menu"
        @item-click="onEvent('item-click', $event)" />
      <span class="demo-log">active：{{ active1?.label ?? 'none' }}；{{ lastEvent }}</span>
    </demo-section>

    <demo-section
      title="溢出折叠"
      note="容器过窄时放不下的顶层项自动折叠进「更多」下拉；点击宽度按钮观察折叠数量变化"
      vertical>
      <div class="demo-row">
        <mu-button
          v-for="w in [900, 640, 480, 360, 240, 120]"
          :key="w"
          :active="barWidth === w || null"
          @click="barWidth = w">
          {{ w }}px
        </mu-button>
        <span class="demo-log">active：{{ active2?.label ?? active2?.id ?? 'none' }}</span>
      </div>
      <div class="demo-overflow-box" :style="{ width: barWidth + 'px' }">
        <mu-menu v-model:active-item="active2" :items="longMenus" />
      </div>
    </demo-section>

    <demo-section
      title="展开交互"
      note="expand-trigger 为 click / hover 控制子级展开方式；expand-icon 控制展开箭头显隐"
      vertical>
      <div class="demo-row">
        <mu-button
          :active="triggerMode === 'hover' || null"
          @click="triggerMode = triggerMode === 'click' ? 'hover' : 'click'">
          expand-trigger: {{ triggerMode }}
        </mu-button>
        <mu-button
          :active="!showExpandIcon || null"
          @click="showExpandIcon = !showExpandIcon">
          expand-icon: {{ showExpandIcon }}
        </mu-button>
      </div>
      <mu-menu
        :expand-trigger="triggerMode"
        :expand-icon="showExpandIcon"
        :items="menus"
        class="demo-menu mt-1x" />
    </demo-section>

    <demo-section
      title="禁用"
      note="disabled 禁用整棵菜单（含展开与选中）"
      vertical>
      <div class="demo-row">
        <mu-button @click="rootDisabled = !rootDisabled">
          切换整树禁用（{{ rootDisabled }}）
        </mu-button>
        <span class="demo-log">禁用后点击菜单项不应有任何响应</span>
      </div>
      <mu-menu
        v-model:active-item="active4"
        :disabled="rootDisabled"
        :items="menus"
        class="demo-menu mt-1x" />
    </demo-section>

    <demo-section
      title="与 Dropdown 弹层互斥"
      note="同一时刻只允许一个弹层展开：打开菜单子级后再点开 Dropdown，菜单子级应自动收起">
      <div class="demo-row">
        <mu-menu v-model:active-item="active5" :items="menus" class="demo-menu demo-menu--inline" />
        <mu-dropdown :dropdown-items="ddItems">
          <mu-button>
            Dropdown
          </mu-button>
        </mu-dropdown>
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="底部空间不足时子级弹层向上翻转、无 id 项以对象引用激活、禁用项不可选"
      regression
      vertical>
      <p class="demo-log">滚动到页面底部，展开「项目管理」子级，弹层应向上翻转而不溢出视口</p>
      <div class="demo-bottom-box">
        <mu-menu v-model:active-item="active6" :items="menus" />
      </div>
      <div class="demo-row mt-1x">
        <mu-button @click="active6 = longMenus[4]">
          激活无 id 项（对象）
        </mu-button>
        <span class="demo-log">active：{{ active6?.label ?? 'none' }}（计划管理为禁用项，点击不应选中）</span>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-menu v-model:active-item="active" :items="menus" />

const menus = [
  { id: 'home', icon: 'grid', label: '首页' },
  { id: 'group', icon: 'folder', label: '项目管理', items: [
    { id: 'list', icon: 'file', label: '项目列表' }
  ] }
]`

  const active1 = ref({ id: 'project-list' })
  const active2 = ref({ id: 'help' })
  const active4 = ref({ id: 'home' })
  const active5 = ref()
  const active6 = ref()

  const barWidth = ref(640)
  const rootDisabled = ref(false)
  const triggerMode = ref('click')
  const showExpandIcon = ref(true)
  const lastEvent = ref('')

  const menus = [
    { id: 'home', icon: 'grid', label: '首页' },
    {
      id: 'group',
      icon: 'folder',
      label: '项目管理',
      items: [
        { id: 'project-list', icon: 'file', label: '项目列表' },
        { id: 'project-plan', icon: 'file', label: '计划管理（禁用）', disabled: true },
        {
          id: 'project-report',
          icon: 'folder',
          label: '报表',
          items: [
            { id: 'report-weekly', icon: 'file', label: '周报' },
            {
              id: 'report-custom',
              icon: 'folder',
              label: '自定义报表',
              items: [
                { id: 'report-custom-daily', icon: 'file', label: '日报' },
                { id: 'report-custom-realtime', icon: 'file', label: '实时报表' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'quality',
      icon: 'bolt',
      label: '质量管理',
      items: [
        { id: 'quality-inspect', icon: 'file', label: '质量检验' },
        { id: 'quality-issue', icon: 'file', label: '问题跟踪' }
      ]
    },
    { id: 'settings', icon: 'list', label: '设置' }
  ]

  const longMenus = [
    ...menus.slice(0, 3),
    { id: 'docs', icon: 'file', label: '文档中心' },
    { icon: 'star', label: '无 id 项' },
    { id: 'market', icon: 'grid', label: '应用市场' },
    { icon: 'bolt', label: '另一个无 id 项' },
    { id: 'help', icon: 'star', label: '帮助与支持' }
  ]

  const ddItems = [
    { caption: 'Action 1', action: 'a1' },
    { caption: 'Action 2', action: 'a2' }
  ]

  function onEvent (name, item) {
    lastEvent.value = `${name}: ${item?.label ?? ''}`
  }
</script>

<style>
  .demo-menu {
    width: 280px;
    max-width: 100%;
  }

  .demo-menu--inline {
    width: 240px;
  }

  .demo-overflow-box {
    overflow: hidden;
    max-width: 100%;
    border: 1px dashed var(--mu-border-color-soft);
  }

  .demo-bottom-box {
    display: flex;
    height: 120px;
    align-items: flex-end;
  }

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
