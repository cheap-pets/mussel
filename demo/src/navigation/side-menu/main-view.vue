<template>
  <demo-page path="navigation/side-menu">
    <demo-section
      title="基础用法"
      note="v-model:active-item 绑定叶子项；设置分组或不存在 id 会被忽略"
      :code="basicCode"
      vertical>
      <mu-side-menu
        v-model:active-item="active1"
        :items="menus"
        class="demo-side-menu"
        @item-click="onEvent('item-click', $event)" />
      <div class="demo-row">
        <mu-button caption="设为分组（应被忽略）" @click="active1 = menus[1]" />
        <mu-button caption="设为不存在 id（应被忽略）" @click="active1 = { id: 'not-exist' }" />
        <span class="demo-log">active：{{ active1?.label ?? 'none' }}；{{ lastEvent }}</span>
      </div>
    </demo-section>

    <demo-section
      title="手风琴与自动展开"
      note="accordion 互斥展开；auto-expand-top 激活深层项时自动展开祖先（初始填充不受 accordion 限制）">
      <mu-side-menu
        v-model:active-item="active2"
        accordion
        auto-expand-top
        :items="menus"
        class="demo-side-menu" />
    </demo-section>

    <demo-section
      title="异步数据"
      note="数据异步加载后 auto-expand-top 自动展开到激活项；点「激活深层项」观察展开与滚动定位"
      vertical>
      <div class="demo-row">
        <mu-button caption="激活深层项（g8-i2）" @click="active3 = { id: 'g8-i2' }" />
        <mu-button caption="重新加载数据" @click="loadAsync" />
        <span class="demo-log">active：{{ active3?.label ?? 'none' }}</span>
      </div>
      <mu-side-menu
        v-model:active-item="active3"
        auto-expand-top
        :items="asyncMenus"
        class="demo-side-menu demo-side-menu--short" />
    </demo-section>

    <demo-section
      title="折叠与自定义头尾"
      note="v-model:collapsed 控制折叠；#header / #footer 作用域插槽随折叠切换显示"
      vertical>
      <div class="demo-row">
        <mu-button @click="collapsed = !collapsed">
          collapsed = {{ collapsed }}
        </mu-button>
      </div>
      <mu-side-menu
        v-model:active-item="active4"
        v-model:collapsed="collapsed"
        v-model:favorites="favorites4"
        :items="menus"
        class="demo-side-menu">
        <template #header="{ collapsed: c }">
          <div class="demo-menu-header">
            <mu-icon icon="star" />
            <span v-if="!c">Mussel Demo</span>
          </div>
        </template>
        <template #footer="{ collapsed: c }">
          <div class="demo-menu-header">
            <mu-icon icon="moon" />
            <span v-if="!c">user@demo</span>
          </div>
        </template>
      </mu-side-menu>
    </demo-section>

    <demo-section
      title="收藏"
      note="v-model:favorites 绑定收藏 id 数组，悬停叶子项点星标切换，触发 favorite-toggle 事件"
      vertical>
      <div class="demo-row">
        <span class="demo-log">favorites：{{ favorites }}</span>
      </div>
      <mu-side-menu
        v-model:active-item="active5"
        v-model:favorites="favorites"
        :items="menus"
        class="demo-side-menu"
        @favorite-toggle="onEvent('favorite-toggle', $event)" />
    </demo-section>

    <demo-section
      title="窄栏（rail）模式"
      note="rail 固定为图标窄栏（collapsed 被忽略），悬停弹出子级面板"
      vertical>
      <mu-side-menu
        v-model:active-item="active6"
        v-model:collapsed="collapsed6"
        rail
        :items="menus"
        class="demo-side-menu demo-side-menu--short" />
      <span class="demo-log">collapsed：{{ collapsed6 }}（rail 下被忽略）</span>
    </demo-section>

    <demo-section
      title="禁用与弹层互斥"
      note="disabled 整树禁用；与 Dropdown 同时只允许一个弹层展开"
      vertical>
      <div class="demo-row">
        <mu-button @click="rootDisabled = !rootDisabled">
          切换整树禁用（{{ rootDisabled }}）
        </mu-button>
      </div>
      <div class="demo-row mt-1x">
        <mu-side-menu
          v-model:active-item="active7"
          :disabled="rootDisabled"
          :items="menus"
          class="demo-side-menu demo-side-menu--short" />
        <mu-dropdown :dropdown-items="ddItems">
          <mu-button>
            Dropdown
          </mu-button>
        </mu-dropdown>
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="无 id 项以对象引用激活（含三级深层叶子）、id 对象激活回归"
      regression
      vertical>
      <div class="demo-row">
        <mu-button caption="激活无 id 顶层叶子" @click="active8 = idlessMenus[0]" />
        <mu-button caption="激活无 id 三级叶子" @click="active8 = deepLeaf" />
        <mu-button caption="按 id 对象激活" @click="active8 = { id: 'with-id-child' }" />
        <span class="demo-log">active：{{ active8?.label ?? 'none' }}</span>
      </div>
      <mu-side-menu
        v-model:active-item="active8"
        v-model:favorites="favorites8"
        auto-expand-top
        :items="idlessMenus"
        class="demo-side-menu" />
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-side-menu v-model:active-item="active" :items="menus" />

const menus = [
  { id: 'home', icon: 'grid', label: '首页' },
  { id: 'group', icon: 'folder', label: '项目管理', items: [
    { id: 'list', icon: 'file', label: '项目列表' }
  ] }
]`

  const active1 = ref()
  const active2 = ref({ id: 'quality-inspect' })
  const active3 = ref({ id: 'g2-i1' })
  const active4 = ref({ id: 'report-weekly' })
  const active5 = ref({ id: 'project-list' })
  const active6 = ref()
  const active7 = ref()
  const active8 = ref()

  const collapsed = ref(false)
  const collapsed6 = ref(false)
  const rootDisabled = ref(false)
  const lastEvent = ref('')

  const favorites4 = ref(['report-weekly'])
  const favorites = ref(['project-list', 'settings'])
  const favorites8 = ref(['with-id-leaf'])

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
            { id: 'report-monthly', icon: 'file', label: '月报' },
            { id: 'report-annual', icon: 'file', label: '年度统计汇总报表' },
            {
              id: 'report-finance',
              icon: 'folder',
              label: '财务报表',
              items: [
                { id: 'report-finance-budget', icon: 'file', label: '预算报表' },
                { id: 'report-finance-audit', icon: 'file', label: '审计报表' }
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

  const deepLeaf = { icon: 'file', label: '无 id 三级叶子' }

  const idlessMenus = [
    { icon: 'grid', label: '无 id 叶子（顶层）' },
    {
      icon: 'folder',
      label: '无 id 组',
      items: [
        { icon: 'file', label: '无 id 子叶子' },
        { id: 'with-id-child', icon: 'file', label: '有 id 子叶子' },
        {
          icon: 'folder',
          label: '无 id 二级组',
          items: [deepLeaf]
        }
      ]
    },
    { id: 'with-id-leaf', icon: 'list', label: '有 id 叶子' }
  ]

  const ddItems = [
    { caption: 'Action 1', action: 'a1' },
    { caption: 'Action 2', action: 'a2' }
  ]

  function buildAsyncMenus () {
    return Array.from({ length: 10 }, (_, gi) => ({
      id: `g${gi}`,
      icon: 'folder',
      label: `分组 ${gi}`,
      items: Array.from({ length: 3 }, (_unused, ii) => ({
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

  function onEvent (name, payload) {
    lastEvent.value = `${name}: ${JSON.stringify(Array.isArray(payload) ? payload : payload?.label ?? payload)}`
  }
</script>

<style>
  .demo-side-menu {
    height: 380px;
  }

  .demo-side-menu--short {
    height: 280px;
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
