<template>
  <div class="bg-normal flex flex-wrap items-start gap-2x p-2x" style="width: 100%">
    <h2 style="width: 100%; margin: 0;">
      Menu Examples
      <theme-switch />
    </h2>

    <div class="demo-panel" style="width: 100%">
      <h3>1. Basic + Active</h3>
      <mu-menu
        v-model:active-item="active1"
        aria-label="主导航菜单"
        :items="menus"
        @item-click="onEvent('itemClick', $event)" />
      <p>active: {{ active1?.label ?? active1?.id ?? 'none' }}</p>
    </div>

    <div class="demo-panel" style="width: 100%">
      <h3>2. Overflow Collapse (adjust width)</h3>
      <mu-button
        v-for="w in [900, 640, 480, 360, 240, 120]"
        :key="w"
        :active="barWidth === w || null"
        @click="barWidth = w">
        {{ w }}px
      </mu-button>
      <div class="overflow-box" :style="{ width: barWidth + 'px' }">
        <mu-menu v-model:active-item="active2" :items="longMenus" />
      </div>
      <p>active: {{ active2?.label ?? active2?.id ?? 'none' }}</p>
      <mu-button @click="active2 = longMenus[4]">
        Active Id-less Item (object)
      </mu-button>
    </div>

    <div class="demo-panel" style="width: 100%">
      <h3>3. Bottom Anchor (popup flips up)</h3>
      <div class="bottom-box">
        <mu-menu v-model:active-item="active3" :items="menus" />
      </div>
    </div>

    <div class="demo-panel">
      <h3>4. Disabled</h3>
      <div style="width: 480px">
        <mu-menu
          v-model:active-item="active4"
          :disabled="rootDisabled"
          :items="menus" />
      </div>
      <mu-button @click="rootDisabled = !rootDisabled">
        Toggle Root Disabled ({{ rootDisabled }})
      </mu-button>
    </div>

    <div class="demo-panel">
      <h3>5. Popup Mutex With Dropdown</h3>
      <mu-menu v-model:active-item="active5" :items="menus" />
      <mu-dropdown :dropdown-items="ddItems">
        <mu-button>
          Dropdown
        </mu-button>
      </mu-dropdown>
    </div>

    <div class="demo-panel" style="width: 100%">
      <h3>6. Expand Trigger / Expand Icon</h3>
      <div class="flex items-center gap-1x">
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
        :items="menus" />
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
      `${name}: ${JSON.stringify(payload?.label ?? payload)}`
    )
    if (eventLog.value.length > 20) eventLog.value.length = 20
  }

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
            },
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

  const longMenus = [
    ...menus.slice(0, 3),
    { id: 'docs', icon: 'file', label: '文档中心' },
    { icon: 'star', label: '无 id 项' },
    { id: 'market', icon: 'grid', label: '应用市场' },
    { icon: 'bolt', label: '另一个无 id 项' },
    { id: 'help', icon: 'star', label: '帮助与支持' }
  ]

  const active1 = ref({ id: 'project-list' })

  const barWidth = ref(900)
  const active2 = ref({ id: 'help' })

  const active3 = ref()
  const active4 = ref({ id: 'home' })
  const rootDisabled = ref(false)

  const active5 = ref()

  const triggerMode = ref('click')
  const showExpandIcon = ref(true)

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

  .overflow-box {
    overflow: hidden;
    max-width: 100%;
    border: 1px dashed var(--mu-border-color-soft);
  }

  .bottom-box {
    display: flex;
    height: 70vh;

    align-items: flex-end;
  }
</style>
