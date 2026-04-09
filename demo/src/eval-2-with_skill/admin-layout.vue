<template>
  <mu-v-box position="fixed fit">
    <!-- 顶部工具栏 -->
    <mu-toolbar>
      <div class="mu-box" flex="1" layout="flex" align-items="center" padding-x="1x">
        <span class="text-normal" style="font-size: 16px; font-weight: 600;">Mussel Admin</span>
      </div>
      <div class="mu-box" layout="flex" align-items="center" gap-1x padding-x="1x">
        <span class="text-subtle" style="font-size: 13px;">Dark Mode</span>
        <mu-switch v-model="isDark" />
      </div>
    </mu-toolbar>

    <!-- 主体区域：侧边栏 + 内容 -->
    <mu-h-box flex="1">
      <!-- 左侧侧边栏 -->
      <div class="mu-box mu-v-box" flex="0" width="240" border-right>
        <div class="mu-box" padding="1x" style="background: var(--mu-bg-strong);">
          <span class="text-subtle" style="font-size: 12px;">Navigation</span>
        </div>
        <mu-list scrollbar @item-click="onMenuClick">
          <mu-list-item
            v-for="item in menuItems"
            :key="item.name"
            :icon="item.icon"
            :label="item.label" />
        </mu-list>
      </div>

      <!-- 可拖拽分割条 -->
      <mu-flex-splitter />

      <!-- 右侧主内容区 -->
      <div class="mu-box mu-v-box" flex="1">
        <mu-tabs v-model:active-tab="activeTab">
          <mu-tab-panel name="dashboard" icon=".icon-layout-dashboard" caption="Dashboard" />
          <mu-tab-panel name="users" icon=".icon-users" caption="User Management" />
          <mu-tab-panel name="settings" icon=".icon-settings" caption="System Settings" />
        </mu-tabs>

        <div class="mu-box" flex="1" padding="2x" overflow-auto>
          <!-- 仪表盘 -->
          <div v-show="activeTab === 'dashboard'">
            <h2 class="text-normal" style="margin: 0 0 1x 0;">
              Dashboard
            </h2>
            <mu-list-divider />
            <div class="mu-box" layout="flex" gap="1x" margin-top="2x">
              <div class="mu-box" flex="1" border padding="2x" style="background: var(--mu-bg-stripe);">
                <span class="text-subtle">Total Users</span>
                <div class="text-normal" style="font-size: 24px; font-weight: 600;">
                  1,284
                </div>
              </div>
              <div class="mu-box" flex="1" border padding="2x" style="background: var(--mu-bg-stripe);">
                <span class="text-subtle">Active Sessions</span>
                <div class="text-normal" style="font-size: 24px; font-weight: 600;">
                  356
                </div>
              </div>
              <div class="mu-box" flex="1" border padding="2x" style="background: var(--mu-bg-stripe);">
                <span class="text-subtle">Revenue</span>
                <div class="text-normal" style="font-size: 24px; font-weight: 600;">
                  $42.5k
                </div>
              </div>
            </div>
            <div class="mu-box" border margin-top="1x" padding="2x">
              <span class="text-subtle">Welcome to the admin dashboard. Here you can monitor key metrics and system health at a glance.</span>
            </div>
          </div>

          <!-- 用户管理 -->
          <div v-show="activeTab === 'users'">
            <h2 class="text-normal" style="margin: 0 0 1x 0;">
              User Management
            </h2>
            <mu-list-divider />
            <div class="mu-box" border margin-top="2x" padding="2x">
              <span class="text-subtle">Manage all registered users, assign roles, and control access permissions.</span>
            </div>
          </div>

          <!-- 系统设置 -->
          <div v-show="activeTab === 'settings'">
            <h2 class="text-normal" style="margin: 0 0 1x 0;">
              System Settings
            </h2>
            <mu-list-divider />
            <div class="mu-box" border margin-top="2x" padding="2x">
              <span class="text-subtle">Configure application preferences, notifications, security policies, and integrations.</span>
            </div>
          </div>
        </div>
      </div>
    </mu-h-box>
  </mu-v-box>
</template>

<script setup>
  import { ref, watch } from 'vue'

  const isDark = ref(false)
  const activeTab = ref('dashboard')

  const menuItems = [
    { name: 'dashboard', icon: '.icon-layout-dashboard', label: 'Dashboard' },
    { name: 'users', icon: '.icon-users', label: 'User Management' },
    { name: 'settings', icon: '.icon-settings', label: 'System Settings' }
  ]

  watch(isDark, (enabled) => {
    const root = document.querySelector('.mu-root') || document.body
    root.classList.toggle('mu-dark', enabled)
  })

  function onMenuClick (item) {
    activeTab.value = item.name
  }
</script>
