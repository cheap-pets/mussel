<template>
  <div class="flex flex-col" style="height: 100vh">
    <!-- 顶部导航栏 -->
    <header
      class="flex-none flex items-center px-2x"
      style=" z-index: 10; height: 48px; background: var(--mu-bg-header);">
      <span style="font-size: 18px; font-weight: 600; color: var(--mu-primary-color);">Mussel Admin</span>
      <div class="ml-2x" style="font-size: 12px; opacity: 0.5;">
        管理控制台
      </div>
      <div class="ml-auto flex items-center gap-1x">
        <mu-icon-button icon="icon icon-bell" @click="showNotifications" />
        <div class="border-l" style="height: 20px; margin: 0 4px;" />
        <span style="font-size: 13px;">Admin</span>
        <theme-switch />
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧菜单栏 -->
      <aside
        class="flex-none flex flex-col overflow-auto"
        style="width: 200px; background: var(--mu-bg-strong);">
        <div class="py-1x">
          <div
            v-for="item in menuItems"
            :key="item.name"
            class="flex items-center px-3x"
            :style="{
              height: '36px',
              fontSize: '13px',
              color: activeMenu === item.name ? 'var(--mu-primary-color)' : 'var(--mu-text-color-normal)',
              background: activeMenu === item.name ? 'var(--mu-primary-color-light)' : 'transparent',
              borderRight: activeMenu === item.name ? '2px solid var(--mu-primary-color)' : '2px solid transparent',
              cursor: 'pointer'
            }"
            @click="activeMenu = item.name">
            <span>{{ item.caption }}</span>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="flex-1 overflow-auto p-2x" style="background: var(--mu-bg-main);">
        <!-- 面包屑 + 标题 -->
        <div class="flex items-center mb-2x">
          <span style="font-size: 13px; opacity: 0.5;">首页</span>
          <span style="margin: 0 6px; opacity: 0.3;">/</span>
          <span style="font-size: 13px; font-weight: 500;">{{ currentMenuCaption }}</span>
          <div class="ml-auto flex items-center gap-1x">
            <mu-input
              v-model="searchText"
              placeholder="搜索..."
              clear-button
              style="width: 200px;" />
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="flex gap-2x mb-2x" style="flex-wrap: wrap;">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="flex-1 flex flex-col border border-soft p-2x"
            style="min-width: 160px; border-radius: var(--mu-window-border-radius);">
            <span style="font-size: 12px; opacity: 0.5;">{{ stat.label }}</span>
            <div class="flex items-center mt-1x">
              <span style="font-size: 24px; font-weight: 600;">{{ stat.value }}</span>
              <span
                class="ml-1x"
                :style="{ fontSize: '12px', color: stat.trend > 0 ? 'var(--mu-success-color)' : 'var(--mu-danger-color)' }">
                {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
              </span>
            </div>
          </div>
        </div>

        <!-- 标签页区域 -->
        <mu-tabs v-model:active-tab="activeTab" tab-style="border-card">
          <!-- 订单列表 -->
          <mu-tab-panel name="orders" caption="订单管理">
            <div class="p-2x">
              <!-- 工具栏 -->
              <div class="flex items-center justify-between mb-2x">
                <mu-select
                  v-model="orderStatusFilter"
                  :options="orderStatusOptions"
                  placeholder="全部状态"
                  style="width: 130px;" />
                <mu-button caption="刷新" @click="refreshOrders" />
                <mu-button primary caption="新建订单" @click="showNewOrder" />
              </div>

              <!-- 表格 -->
              <mu-table
                v-model:order-by="orderBy"
                :columns="orderColumns"
                :records="filteredOrders"
                key-field="id"
                striped
                hover-mode="row"
                gridlines="column"
                placeholder="-"
                @cell-item-click="onCellItemClick"
                @update:cell-value="onCellValueChange" />
            </div>
          </mu-tab-panel>

          <!-- 用户管理 -->
          <mu-tab-panel name="users" caption="用户管理">
            <div class="p-2x">
              <div class="flex items-center justify-between mb-2x">
                <div class="flex items-center gap-1x">
                  <mu-input v-model="userSearch" placeholder="搜索用户..." clear-button style="width: 200px;" />
                  <mu-select
                    v-model="roleFilter"
                    :options="roleOptions"
                    placeholder="全部角色"
                    style="width: 130px;" />
                </div>
                <mu-button primary caption="新增用户" @click="showAddUser" />
              </div>

              <mu-table
                v-model:order-by="userOrderBy"
                :columns="userColumns"
                :records="filteredUsers"
                key-field="id"
                striped
                hover-mode="row"
                gridlines="column"
                placeholder="-"
                @cell-item-click="onUserCellClick"
                @update:cell-value="onUserCellValueChange" />
            </div>
          </mu-tab-panel>

          <!-- 系统设置 -->
          <mu-tab-panel name="settings" caption="系统设置">
            <div class="flex flex-col gap-2x p-2x" style="max-width: 600px;">
              <!-- 基本设置 -->
              <div class="border border-soft p-2x" style="border-radius: var(--mu-window-border-radius);">
                <h3 class="mb-1x">
                  基本设置
                </h3>
                <mu-form label-width="100px" label-align="right">
                  <mu-form-row>
                    <mu-form-field label="系统名称：">
                      <mu-input v-model="settings.siteName" placeholder="请输入系统名称" />
                    </mu-form-field>
                  </mu-form-row>
                  <mu-form-row>
                    <mu-form-field label="系统描述：">
                      <mu-input v-model="settings.siteDesc" type="textarea" placeholder="请输入系统描述" />
                    </mu-form-field>
                  </mu-form-row>
                  <mu-form-row>
                    <mu-form-field label="管理员邮箱：">
                      <mu-input v-model="settings.adminEmail" type="email" placeholder="请输入邮箱" />
                    </mu-form-field>
                  </mu-form-row>
                  <mu-form-row>
                    <mu-form-field label="语言：">
                      <mu-select
                        v-model="settings.language"
                        :options="languageOptions" />
                    </mu-form-field>
                  </mu-form-row>
                </mu-form>
              </div>

              <!-- 通知设置 -->
              <div class="border border-soft p-2x" style="border-radius: var(--mu-window-border-radius);">
                <h3 class="mb-1x">
                  通知设置
                </h3>
                <mu-form label-width="100px" label-align="right">
                  <mu-form-row>
                    <mu-form-field label="邮件通知：">
                      <mu-switch v-model="settings.emailNotify" active-label="开启" inactive-label="关闭" />
                    </mu-form-field>
                  </mu-form-row>
                  <mu-form-row>
                    <mu-form-field label="浏览器通知：">
                      <mu-switch v-model="settings.browserNotify" active-label="开启" inactive-label="关闭" />
                    </mu-form-field>
                  </mu-form-row>
                  <mu-form-row>
                    <mu-form-field label="通知频率：">
                      <mu-radio v-model="settings.notifyFreq" value="realtime">
                        实时
                      </mu-radio>
                      <mu-radio v-model="settings.notifyFreq" value="hourly">
                        每小时
                      </mu-radio>
                      <mu-radio v-model="settings.notifyFreq" value="daily">
                        每天
                      </mu-radio>
                    </mu-form-field>
                  </mu-form-row>
                </mu-form>
              </div>

              <div class="flex justify-end gap-1x">
                <mu-button caption="重置" @click="resetSettings" />
                <mu-button primary caption="保存设置" @click="saveSettings" />
              </div>
            </div>
          </mu-tab-panel>
        </mu-tabs>
      </main>
    </div>

    <!-- 底部状态栏 -->
    <footer
      class="flex-none flex items-center px-2x"
      style="height: 28px; border-top: 1px solid var(--mu-border-color-soft); font-size: 12px; background: var(--mu-bg-header);">
      <span style="opacity: 0.5;">Mussel Admin v1.0.0</span>
      <div class="ml-auto flex items-center gap-2x">
        <span style="opacity: 0.5;">在线用户：3</span>
        <span style="color: var(--mu-success-color);">●</span>
        <span style="opacity: 0.5;">系统正常</span>
      </div>
    </footer>
  </div>

  <!-- 新建订单对话框 -->
  <mu-dialog
    v-model:visible="orderDialogVisible"
    title="新建订单"
    width="480"
    dismissible>
    <mu-form label-width="80px" label-align="right" class="py-1x">
      <mu-form-row>
        <mu-form-field label="客户：" class="flex-auto">
          <mu-select v-model="orderForm.customer" :options="customerOptions" placeholder="请选择客户" />
        </mu-form-field>
      </mu-form-row>
      <mu-form-row>
        <mu-form-field label="商品：" class="flex-auto">
          <mu-input v-model="orderForm.product" placeholder="请输入商品名称" />
        </mu-form-field>
      </mu-form-row>
      <mu-form-row>
        <mu-form-field label="数量：" class="flex-auto">
          <mu-input v-model="orderForm.quantity" type="number" placeholder="请输入数量" />
        </mu-form-field>
      </mu-form-row>
      <mu-form-row>
        <mu-form-field label="金额：" class="flex-auto">
          <mu-input v-model="orderForm.amount" type="number" prefix="¥" placeholder="请输入金额" />
        </mu-form-field>
      </mu-form-row>
    </mu-form>
    <template #footer>
      <div class="flex justify-end gap-1x">
        <mu-button caption="取消" @click="orderDialogVisible = false" />
        <mu-button primary caption="确认创建" @click="handleCreateOrder" />
      </div>
    </template>
  </mu-dialog>

  <!-- 新增 / 编辑用户对话框 -->
  <mu-dialog
    v-model:visible="userDialogVisible"
    :title="isEditingUser ? '编辑用户' : '新增用户'"
    width="480"
    dismissible>
    <mu-form label-width="80px" label-align="right" class="py-1x">
      <mu-form-row>
        <mu-form-field label="姓名：" class="flex-auto">
          <mu-input v-model="userForm.name" placeholder="请输入姓名" />
        </mu-form-field>
      </mu-form-row>
      <mu-form-row>
        <mu-form-field label="邮箱：" class="flex-auto">
          <mu-input v-model="userForm.email" type="email" placeholder="请输入邮箱" />
        </mu-form-field>
      </mu-form-row>
      <mu-form-row>
        <mu-form-field label="角色：" class="flex-auto">
          <mu-select v-model="userForm.role" :options="roleOptions" placeholder="请选择角色" />
        </mu-form-field>
      </mu-form-row>
      <mu-form-row>
        <mu-form-field label="状态：" class="flex-auto">
          <mu-switch v-model="userForm.active" active-label="启用" inactive-label="停用" />
        </mu-form-field>
      </mu-form-row>
    </mu-form>
    <template #footer>
      <div class="flex justify-end gap-1x">
        <mu-button caption="取消" @click="userDialogVisible = false" />
        <mu-button primary caption="确认" @click="handleSaveUser" />
      </div>
    </template>
  </mu-dialog>
</template>

<script setup>
  import { ref, reactive, computed, inject } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const { messageBox } = inject('$mussel')

  // ==================== 菜单 ====================
  const activeMenu = ref('dashboard')

  const menuItems = [
    { name: 'dashboard', caption: '仪表盘' },
    { name: 'analytics', caption: '数据分析' },
    { name: 'products', caption: '商品管理' },
    { name: 'orders', caption: '订单管理' },
    { name: 'users', caption: '用户管理' },
    { name: 'settings', caption: '系统设置' }
  ]

  const currentMenuCaption = computed(() => {
    const item = menuItems.find(i => i.name === activeMenu.value)
    return item ? item.caption : ''
  })

  const searchText = ref('')

  // ==================== 标签页 ====================
  const activeTab = ref('orders')

  // ==================== 统计卡片 ====================
  const stats = [
    { label: '总订单', value: '1,284', trend: 12.5 },
    { label: '总收入', value: '¥86.4K', trend: 8.2 },
    { label: '活跃用户', value: '368', trend: -2.1 },
    { label: '转化率', value: '24.6%', trend: 3.7 }
  ]

  // ==================== 订单管理 ====================
  const orderBy = ref('')
  const orderStatusFilter = ref('')

  const orderStatusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ]

  const orderStatusMappings = {
    pending: '待处理',
    processing: '处理中',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }

  const statusTagMappings = {
    pending: { text: '待处理', style: 'warning' },
    processing: { text: '处理中', style: 'accent' },
    shipped: { text: '已发货', style: 'primary' },
    completed: { text: '已完成', style: 'success' },
    cancelled: { text: '已取消', style: 'danger' }
  }

  let nextOrderId = 7
  const orders = ref([
    { id: 1001, customer: '张三', product: 'MacBook Pro 16"', quantity: 1, amount: 18999, status: 'completed', date: '2025-12-01', checked: false },
    { id: 1002, customer: '李四', product: 'iPhone 16 Pro', quantity: 2, amount: 17598, status: 'shipped', date: '2025-12-05', checked: false },
    { id: 1003, customer: '王五', product: 'AirPods Pro 3', quantity: 5, amount: 8495, status: 'processing', date: '2025-12-08', checked: false },
    { id: 1004, customer: '赵六', product: 'iPad Air M3', quantity: 1, amount: 4799, status: 'pending', date: '2025-12-10', checked: false },
    { id: 1005, customer: '孙七', product: 'Apple Watch Ultra 3', quantity: 3, amount: 20997, status: 'completed', date: '2025-12-12', checked: false },
    { id: 1006, customer: '周八', product: 'Magic Keyboard', quantity: 10, amount: 23990, status: 'cancelled', date: '2025-12-13', checked: false }
  ])

  const filteredOrders = computed(() => {
    let list = orders.value
    if (orderStatusFilter.value) {
      list = list.filter(o => o.status === orderStatusFilter.value)
    }
    return list
  })

  const orderColumns = [
    { type: 'rec_no', caption: '#', width: 60 },
    { type: 'check', field: 'checked', headerCheckbox: true, width: 50 },
    { field: 'id', caption: '订单号', type: 'text', sortable: true, width: 100 },
    { field: 'customer', caption: '客户', type: 'text', width: 100 },
    { field: 'product', caption: '商品', type: 'text', width: 180 },
    { field: 'quantity', caption: '数量', type: 'number', align: 'center', width: 70 },
    {
      field: 'amount',
      caption: '金额',
      type: 'currency',
      format: '¥{value}',
      align: 'right',
      sortable: true,
      width: 120
    },
    {
      field: 'status',
      caption: '状态',
      type: 'tag',
      tags: (rec) => [statusTagMappings[rec.status]],
      width: 100
    },
    {
      field: 'date',
      caption: '日期',
      type: 'date',
      format: 'yyyy-MM-dd',
      sortable: true,
      width: 120
    },
    {
      caption: '操作',
      type: 'link',
      align: 'center',
      width: 120,
      links: () => [
        { caption: '查看', action: 'view' },
        { caption: '删除', action: 'delete', danger: true }
      ]
    }
  ]

  function onCellItemClick ({ record, link }) {
    if (link.action === 'view') {
      messageBox.alert(`订单 #${record.id}\n客户: ${record.customer}\n商品: ${record.product}\n数量: ${record.quantity}\n金额: ¥${record.amount.toLocaleString()}\n状态: ${orderStatusMappings[record.status]}`)
    } else if (link.action === 'delete') {
      handleDeleteOrder(record)
    }
  }

  function onCellValueChange ({ record, column, value }) {
    if (column.type === 'check') {
      record.checked = value
    }
  }

  function handleDeleteOrder (record) {
    messageBox.confirm(`确认删除订单 #${record.id} 吗？`).then((btn) => {
      if (btn === 'OK') {
        const index = orders.value.findIndex(o => o.id === record.id)
        if (index > -1) orders.value.splice(index, 1)
        messageBox.notify({ title: '成功', message: '订单已删除', type: 'success' })
      }
    })
  }

  function refreshOrders () {
    messageBox.notify({ title: '提示', message: '数据已刷新', type: 'success' })
  }

  // 新建订单
  const orderDialogVisible = ref(false)
  const orderForm = reactive({
    customer: '',
    product: '',
    quantity: 1,
    amount: 0
  })

  const customerOptions = [
    { value: '张三', label: '张三' },
    { value: '李四', label: '李四' },
    { value: '王五', label: '王五' },
    { value: '赵六', label: '赵六' },
    { value: '孙七', label: '孙七' }
  ]

  function showNewOrder () {
    orderForm.customer = ''
    orderForm.product = ''
    orderForm.quantity = 1
    orderForm.amount = 0
    orderDialogVisible.value = true
  }

  function handleCreateOrder () {
    if (!orderForm.customer) { messageBox.warn('请选择客户'); return }
    if (!orderForm.product) { messageBox.warn('请输入商品名称'); return }
    if (!orderForm.amount || orderForm.amount <= 0) { messageBox.warn('请输入有效金额'); return }

    orders.value.unshift({
      id: nextOrderId++,
      customer: orderForm.customer,
      product: orderForm.product,
      quantity: Number(orderForm.quantity) || 1,
      amount: Number(orderForm.amount),
      status: 'pending',
      date: new Date().toISOString().slice(0, 10),
      checked: false
    })
    orderDialogVisible.value = false
    messageBox.notify({ title: '成功', message: '订单已创建', type: 'success' })
  }

  // ==================== 用户管理 ====================
  const userOrderBy = ref('')
  const userSearch = ref('')
  const roleFilter = ref('')

  const roleOptions = [
    { value: 'admin', label: '管理员' },
    { value: 'editor', label: '编辑者' },
    { value: 'viewer', label: '查看者' }
  ]

  const roleMappings = { admin: '管理员', editor: '编辑者', viewer: '查看者' }

  let nextUserId = 6
  const users = ref([
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin', active: true, created: '2024-06-01', checked: false },
    { id: 2, name: '李四', email: 'lisi@example.com', role: 'editor', active: true, created: '2024-07-15', checked: false },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: 'viewer', active: false, created: '2024-08-20', checked: false },
    { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: 'editor', active: true, created: '2025-01-10', checked: false },
    { id: 5, name: '孙七', email: 'sunqi@example.com', role: 'viewer', active: false, created: '2025-03-05', checked: false }
  ])

  const filteredUsers = computed(() => {
    let list = users.value
    if (roleFilter.value) {
      list = list.filter(u => u.role === roleFilter.value)
    }
    if (userSearch.value.trim()) {
      const keyword = userSearch.value.trim().toLowerCase()
      list = list.filter(u => u.name.toLowerCase().includes(keyword) || u.email.toLowerCase().includes(keyword))
    }
    return list
  })

  const userColumns = [
    { type: 'rec_no', caption: '#', width: 60 },
    { type: 'check', field: 'checked', headerCheckbox: true, width: 50 },
    { field: 'name', caption: '姓名', type: 'text', sortable: true, width: 120 },
    { field: 'email', caption: '邮箱', type: 'text', width: 220 },
    { field: 'role', caption: '角色', type: 'enum', mappings: roleMappings, width: 100 },
    {
      field: 'active',
      caption: '状态',
      type: 'bool',
      mappings: {
        true: { text: '启用', class: 'text-success' },
        false: { text: '停用', class: 'text-muted' }
      },
      width: 80
    },
    { field: 'created', caption: '注册时间', type: 'date', format: 'yyyy-MM-dd', sortable: true, width: 130 },
    {
      caption: '操作',
      type: 'link',
      align: 'center',
      width: 120,
      links: (rec) => [
        { caption: '编辑', action: 'edit' },
        { caption: '删除', action: 'delete', danger: true }
      ]
    }
  ]

  function onUserCellClick ({ record, link }) {
    if (link.action === 'edit') {
      handleEditUser(record)
    } else if (link.action === 'delete') {
      handleDeleteUser(record)
    }
  }

  function onUserCellValueChange ({ record, column, value }) {
    if (column.type === 'check') {
      record.checked = value
    }
  }

  // 用户对话框
  const userDialogVisible = ref(false)
  const isEditingUser = ref(false)
  const editingUserId = ref(null)
  const userForm = reactive({ name: '', email: '', role: '', active: true })

  function getUserDefaultForm () {
    return { name: '', email: '', role: '', active: true }
  }

  function showAddUser () {
    isEditingUser.value = false
    editingUserId.value = null
    Object.assign(userForm, getUserDefaultForm())
    userDialogVisible.value = true
  }

  function handleEditUser (record) {
    isEditingUser.value = true
    editingUserId.value = record.id
    Object.assign(userForm, { name: record.name, email: record.email, role: record.role, active: record.active })
    userDialogVisible.value = true
  }

  function handleSaveUser () {
    if (!userForm.name.trim()) { messageBox.warn('请输入姓名'); return }
    if (!userForm.email.trim()) { messageBox.warn('请输入邮箱'); return }
    if (!userForm.role) { messageBox.warn('请选择角色'); return }

    if (isEditingUser.value) {
      const target = users.value.find(u => u.id === editingUserId.value)
      if (target) Object.assign(target, { name: userForm.name, email: userForm.email, role: userForm.role, active: userForm.active })
      messageBox.notify({ title: '成功', message: '用户信息已更新', type: 'success' })
    } else {
      users.value.push({
        id: nextUserId++,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        active: userForm.active,
        created: new Date().toISOString().slice(0, 10),
        checked: false
      })
      messageBox.notify({ title: '成功', message: '用户已添加', type: 'success' })
    }
    userDialogVisible.value = false
  }

  function handleDeleteUser (record) {
    messageBox.confirm(`确认删除用户「${record.name}」吗？`).then((btn) => {
      if (btn === 'OK') {
        const index = users.value.findIndex(u => u.id === record.id)
        if (index > -1) users.value.splice(index, 1)
        messageBox.notify({ title: '成功', message: '用户已删除', type: 'success' })
      }
    })
  }

  // ==================== 系统设置 ====================
  const settings = reactive({
    siteName: 'Mussel Admin',
    siteDesc: '基于 Mussel 4 组件库的管理控制台',
    adminEmail: 'admin@mussel.dev',
    language: 'zh-CN',
    emailNotify: true,
    browserNotify: false,
    notifyFreq: 'realtime'
  })

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' },
    { value: 'ja-JP', label: '日本語' }
  ]

  function saveSettings () {
    messageBox.notify({ title: '成功', message: '设置已保存', type: 'success' })
  }

  function resetSettings () {
    messageBox.confirm('确认重置所有设置为默认值吗？').then((btn) => {
      if (btn === 'OK') {
        Object.assign(settings, {
          siteName: 'Mussel Admin',
          siteDesc: '基于 Mussel 4 组件库的管理控制台',
          adminEmail: 'admin@mussel.dev',
          language: 'zh-CN',
          emailNotify: true,
          browserNotify: false,
          notifyFreq: 'realtime'
        })
        messageBox.notify({ title: '成功', message: '设置已重置', type: 'success' })
      }
    })
  }

  // ==================== 通知 ====================
  function showNotifications () {
    messageBox.alert('暂无新通知')
  }
</script>
