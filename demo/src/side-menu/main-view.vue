<template>
  <div class="bg-normal flex flex-wrap items-start gap-2x p-2x" style="width: 100%">
    <h2 style="width: 100%; margin: 0;">
      SideMenu Examples
      <theme-switch />
    </h2>

    <div class="demo-panel">
      <h3>1. Basic + Active</h3>
      <mu-side-menu
        v-model:active-item="active1"
        aria-label="主导航菜单"
        style="height: 420px"
        :data="menus"
        @select="onEvent('select', $event)"
        @item-click="onEvent('itemClick', $event)" />
      <p>active: {{ active1 ?? 'none' }}</p>
      <mu-button @click="active1 = 'group'">
        Set Active To Group Key (ignored)
      </mu-button>
      <mu-button @click="active1 = 'not-exist'">
        Set Active To Missing Key (ignored)
      </mu-button>
    </div>

    <div class="demo-panel">
      <h3>2. Accordion + v-model:expanded-keys</h3>
      <mu-side-menu
        v-model:active-item="active2"
        v-model:expanded-keys="expandedKeys"
        accordion
        style="height: 420px"
        :data="menus"
        @group-expand="onEvent('groupExpand', $event)"
        @group-collapse="onEvent('groupCollapse', $event)" />
      <p>expanded: {{ expandedKeys }}</p>
    </div>

    <div class="demo-panel">
      <h3>3. Auto Expand Active + Scroll Into View</h3>
      <mu-side-menu
        v-model:active-item="active3"
        style="height: 300px"
        :data="asyncMenus"
        @select="onEvent('select', $event)" />
      <p>active: {{ active3 ?? 'none' }}</p>
      <mu-button @click="active3 = 'g8-i2'">
        Active Deep Item
      </mu-button>
      <mu-button @click="loadAsync">
        Reload Data (async)
      </mu-button>
    </div>

    <div class="demo-panel">
      <h3>4. Collapsed + Slots + collapse-button</h3>
      <mu-side-menu
        v-model:active-item="active4"
        v-model:collapsed="collapsed"
        v-model:favorites="favorites4"
        collapse-button
        width="220px"
        style="height: 420px"
        :data="menus">
        <template #header="{ collapsed }">
          <div class="demo-menu-header">
            <mu-icon icon="star" />
            <span v-if="!collapsed">Mussel Demo</span>
          </div>
        </template>
        <template #footer="{ collapsed }">
          <div class="demo-menu-header">
            <mu-icon icon="moon" />
            <span v-if="!collapsed">user@demo</span>
          </div>
        </template>
        <template #item="{ item, level, active }">
          <mu-icon :icon="item.icon" />
          <span
            class="mu-side-menu__item-label"
            :style="{ color: active ? undefined : level === 0 ? 'var(--mu-text-color-strong)' : undefined }">
            {{ item.label }}
          </span>
        </template>
      </mu-side-menu>
      <p>
        collapsed: {{ collapsed }}
        <mu-button @click="collapsed = !collapsed">
          Toggle
        </mu-button>
      </p>
    </div>

    <div class="demo-panel">
      <h3>5. Favorites</h3>
      <mu-side-menu
        v-model:active-item="active5"
        v-model:favorites="favorites"
        accordion
        style="height: 420px"
        :data="menus"
        @favorite-toggle="onEvent('favoriteToggle', $event)" />
      <p>favorites: {{ favorites }}</p>
      <h4>Not bound (no v-model) - no stars</h4>
      <mu-side-menu
        :favorites="favorites"
        style="height: 200px"
        :data="menus" />
    </div>

    <div class="demo-panel">
      <h3>6. Disabled</h3>
      <mu-side-menu
        v-model:active-item="active6"
        :disabled="rootDisabled"
        style="height: 260px"
        :data="menus" />
      <mu-button @click="rootDisabled = !rootDisabled">
        Toggle Root Disabled ({{ rootDisabled }})
      </mu-button>
    </div>

    <div class="demo-panel">
      <h3>7. Field Props Mapping + Expand Icons</h3>
      <mu-side-menu
        v-model:active-item="active7"
        :data="mappedMenus"
        :props="{ key: 'code', label: 'name', childNodes: 'children' }"
        :expand-icons="{ expanded: 'chevronDown', collapsed: 'chevronDown' }"
        style="height: 300px" />
    </div>

    <div class="demo-panel">
      <h3>8. Popup Mutex With Dropdown</h3>
      <mu-side-menu
        v-model:active-item="active8"
        v-model:collapsed="collapsed8"
        collapse-button
        style="height: 260px"
        :data="menus" />
      <mu-dropdown :dropdown-items="ddItems">
        <mu-button>
          Dropdown
        </mu-button>
      </mu-dropdown>
    </div>

    <div class="demo-panel" style="width: 100%">
      <h3>Events</h3>
      <pre style="max-height: 160px; overflow: auto; margin: 0">{{ eventLog.join('\n') }}</pre>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const eventLog = ref([])

  function onEvent (name, payload) {
    eventLog.value.unshift(
      `${name}: ${JSON.stringify(
        Array.isArray(payload) ? payload : payload?.label ?? payload
      )}`
    )
    if (eventLog.value.length > 20) eventLog.value.length = 20
  }

  const menus = [
    { id: 'home', icon: 'grid', label: '首页' },
    {
      id: 'group',
      icon: 'folder',
      label: '项目管理',
      childNodes: [
        { id: 'project-list', icon: 'file', label: '项目列表' },
        { id: 'project-plan', icon: 'file', label: '计划管理（禁用）', disabled: true },
        {
          id: 'project-report',
          icon: 'folder',
          label: '报表',
          childNodes: [
            { id: 'report-weekly', icon: 'file', label: '周报' },
            { id: 'report-monthly', icon: 'file', label: '月报' },
            { id: 'report-quarter', icon: 'file', label: '季度工程质量检验汇总报告' },
            { id: 'report-acceptance', icon: 'file', label: '验收报表' },
            { id: 'report-settlement', icon: 'file', label: '结算报表' },
            { id: 'report-annual', icon: 'file', label: '年度建设工程项目质量检验数据统计汇总分析与报表导出中心' }
          ]
        }
      ]
    },
    {
      id: 'quality',
      icon: 'bolt',
      label: '质量管理',
      childNodes: [
        { id: 'quality-inspect', icon: 'file', label: '质量检验' },
        { id: 'quality-issue', icon: 'file', label: '问题跟踪' },
        { id: 'quality-history', icon: 'file', label: '建设工程项目质量检验历史记录查询' },
        { id: 'quality-analysis', icon: 'file', label: '建设工程项目质量检验历史记录查询与统计分析报表导出功能' }
      ]
    },
    { id: 'settings', icon: 'list', label: '设置' }
  ]

  const active1 = ref()
  const active2 = ref('quality-inspect')
  const expandedKeys = ref(['group'])

  const active3 = ref('g2-i1')

  function buildAsyncMenus () {
    return Array.from({ length: 10 }, (_, gi) => ({
      id: `g${gi}`,
      icon: 'folder',
      label: `分组 ${gi}`,
      childNodes: Array.from({ length: 3 }, (_, ii) => ({
        id: `g${gi}-i${ii}`,
        icon: 'file',
        label: `项目 ${gi}-${ii}`
      }))
    }))
  }

  const asyncMenus = ref([])

  function loadAsync () {
    asyncMenus.value = []
    setTimeout(() => {
      asyncMenus.value = buildAsyncMenus()
    }, 1000)
  }

  loadAsync()

  const collapsed = ref(false)
  const active4 = ref('report-weekly')
  const favorites4 = ref(['report-weekly'])

  const active5 = ref('project-list')
  const favorites = ref(['project-list', 'settings'])

  const active6 = ref('home')
  const rootDisabled = ref(false)

  const active7 = ref('c2')

  const mappedMenus = [
    {
      code: 'c1',
      icon: 'album',
      name: '映射分组',
      children: [
        { code: 'c2', icon: 'file', name: '映射叶子 1' },
        { code: 'c3', icon: 'file', name: '映射叶子 2' }
      ]
    },
    { code: 'c4', icon: 'flag', name: '映射独立项' }
  ]

  const active8 = ref()
  const collapsed8 = ref(true)

  const ddItems = ref([
    { caption: 'Action 1', action: 'a1' },
    { caption: 'Action 2', action: 'a2' }
  ])
</script>

<style scoped>
  .demo-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;

    padding: 16px;
    border: 1px solid var(--mu-border-color-soft);
    border-radius: 8px;
  }

  .demo-menu-header {
    display: flex;
    gap: 8px;
    align-items: center;

    height: 48px;
    padding: 0 16px;
    overflow: hidden;
    white-space: nowrap;
  }
</style>
