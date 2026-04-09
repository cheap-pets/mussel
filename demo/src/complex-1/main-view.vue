<template>
  <div class="mu-v-box" position="fixed fit">
    <!-- 左侧导航栏 -->
    <div class="mu-box sidebar" layout="flex" direction="column" width="180" position="relative">
      <div class="sidebar-header">
        <mu-icon icon=".ti.ti-home" />
        <span class="sidebar-title">独立入口</span>
      </div>
      <div class="sidebar-nav">
        <!-- 菜单分组1 -->
        <div
          v-for="item in navGroup1"
          :key="item.key"
          class="sidebar-item"
          :class="{ active: activeNav === item.key }"
          @click="activeNav = item.key">
          <mu-icon :icon="item.icon" />
          <span>{{ item.label }}</span>
          <mu-badge
            v-if="item.badge"
            accent>
            {{ item.badge }}
          </mu-badge>
        </div>

        <div class="sidebar-divider" />

        <div class="sidebar-group-title">
          产品分析轨迹
        </div>

        <!-- 菜单分组2 -->
        <div
          v-for="item in navGroup2"
          :key="item.key"
          class="sidebar-item"
          :class="{ active: activeNav === item.key }"
          @click="activeNav = item.key">
          <span>{{ item.label }}</span>
        </div>

        <div class="sidebar-divider" />

        <div
          class="sidebar-item"
          :class="{ active: activeNav === 'platform' }"
          @click="activeNav = 'platform'">
          <span>平台</span>
        </div>
        <div
          class="sidebar-item"
          :class="{ active: activeNav === 'other' }"
          @click="activeNav = 'other'">
          <span>其他</span>
        </div>
      </div>
    </div>

    <!-- 右侧主内容区 -->
    <div class="mu-v-box flex-1 content-area" position="relative">
      <!-- 页面标题 -->
      <div class="mu-box" layout="flex" position="relative" padding-x="2x" padding-top="2x" align-items="center" justify-content="space-between">
        <span class="page-title">产品反馈记录</span>
        <mu-button button-style="outline" size="small" caption="导出 Excel" icon=".ti.ti-download" />
      </div>

      <!-- 筛选器工具栏 -->
      <div class="mu-box" position="relative" padding-x="2x" padding-y="1x">
        <div class="mu-box filter-row" layout="flex" position="relative" align-items="center" gap-1x>
          <mu-select
            :options="feedbackTypeOptions"
            placeholder="全部反馈类型"
            style="width: 150px" />
          <mu-select
            :options="scopeOptions"
            placeholder="反馈范围"
            style="width: 130px" />
          <mu-select
            :options="situationOptions"
            placeholder="情况范围"
            style="width: 130px" />
          <mu-input
            placeholder="姓名/员工/负责人/处理..."
            style="width: 280px" />
          <mu-button button-style="outline" size="small" caption="高级筛选" icon=".ti.ti-filter" />
        </div>
        <div class="mu-box filter-row gap-1x" layout="flex" position="relative" align-items="center">
          <mu-select
            :options="priorityOptions"
            placeholder="金期优先级"
            style="width: 130px" />
          <mu-select
            :options="responseStatusOptions"
            placeholder="金期响应状态"
            style="width: 150px" />
          <mu-select
            :options="workOrderOptions"
            placeholder="金期响应工单"
            style="width: 150px" />
          <mu-button primary size="small" caption="查询" />
          <mu-button button-style="outline" size="small" caption="重置" />
        </div>
      </div>

      <!-- 数据表格 -->
      <div v-mu-scrollbar class="mu-box flex-1" position="relative" padding-x="2x" style="overflow: auto">
        <mu-table
          :columns="columns"
          :records="records"
          key-field="id"
          striped
          hover-mode="cross"
          gridlines="column"
          placeholder="-"
          @cell-click="onCellClick"
          @cell-item-click="onCellItemClick" />
      </div>

      <!-- 分页器 -->
      <div class="mu-box pagination-bar" layout="flex" position="relative" align-items="center" justify-content="space-between">
        <span class="text-subtle">共 2350 条</span>
        <div class="flex items-center gap-1x">
          <mu-button
            button-style="outline"
            size="small"
            caption="上一页"
            :disabled="currentPage <= 1"
            @click="currentPage--" />
          <mu-button
            v-for="p in visiblePages"
            :key="p"
            :caption="String(p)"
            size="small"
            :primary="p === currentPage"
            :button-style="p === currentPage ? 'normal' : 'outline'"
            @click="currentPage = p" />
          <mu-button
            button-style="outline"
            size="small"
            caption="下一页"
            :disabled="currentPage >= totalPages"
            @click="currentPage++" />
        </div>
        <div class="flex items-center gap-1x">
          <span class="text-subtle">{{ currentPage }} / {{ totalPages }} 页</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'

  const activeNav = ref('all')

  const navGroup1 = [
    { key: 'feedback-list', label: '反馈列表', icon: '.ti.ti-message-circle', badge: 23 },
    { key: 'map-location', label: '地图定位', icon: '.ti.ti-map-pin' },
    { key: 'system-settings', label: '系统设置', icon: '.ti.ti-settings' },
    { key: 'data-management', label: '数据管理', icon: '.ti.ti-database' }
  ]

  const navGroup2 = [
    { key: 'all', label: '全部' },
    { key: 'ai-cover', label: 'AI 盒盖' },
    { key: 'bim-cover', label: 'BIM 盒盖' },
    { key: 'quantity-cloud', label: '算量云' },
    { key: 'production-flow', label: '生产流程' },
    { key: 'material-mgmt', label: '物料管理' },
    { key: 'install-mgmt', label: '安装管理' },
    { key: 'subcontract-mgmt', label: '分包管理' },
    { key: 'org-mgmt', label: '组织管理' },
    { key: 'delay-qty', label: '延误工程量' },
    { key: 'bid-plan', label: '招投标计划' },
    { key: 'monitor-analysis', label: '监控分析' },
    { key: 'chief-manager', label: '总主管' },
    { key: 'subcontract-safety', label: '分包安全' },
    { key: 'system-mgmt', label: '系统管理' }
  ]

  const feedbackTypeOptions = [
    { value: 'BUG', label: 'BUG' },
    { value: 'feature', label: '功能缺失' },
    { value: 'improve', label: '优化建议' },
    { value: 'other', label: '其他' }
  ]

  const scopeOptions = [
    { value: 'beautify', label: '美化' },
    { value: 'calc', label: '算量' },
    { value: 'bim', label: 'BIM' }
  ]

  const situationOptions = [
    { value: 'untreated', label: '未处理' },
    { value: 'processing', label: '正在处理' },
    { value: 'done', label: '已处理' },
    { value: 'ignored', label: '已忽略' }
  ]

  const priorityOptions = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' }
  ]

  const responseStatusOptions = [
    { value: 'pending', label: '待响应' },
    { value: 'responded', label: '已响应' },
    { value: 'timeout', label: '超时' }
  ]

  const workOrderOptions = [
    { value: 'created', label: '已创建工单' },
    { value: 'not-created', label: '未创建工单' }
  ]

  const currentPage = ref(1)
  const pageSize = 50
  const totalRecords = 2350
  const totalPages = Math.ceil(totalRecords / pageSize)

  const visiblePages = computed(() => {
    const pages = []
    const max = 5
    let start = Math.max(1, currentPage.value - Math.floor(max / 2))
    const end = Math.min(totalPages, start + max - 1)
    start = Math.max(1, end - max + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  })

  const records = ref(generateMockRecords())

  function generateMockRecords () {
    const owners = ['董新运', '张伟', '李娜', '王磊', '赵敏', '钱芳', '孙浩', '周静', '吴强', '郑丽']
    const handlers = ['马德龙', '陈思远', '刘德华', '张晓明', '李红梅', '王建国', '赵雪', '钱浩然']
    const findTypes = ['测试', '用户反馈', '内部评审', '线上监控', '客户反馈']
    const feedbackTypes = ['BUG', '功能缺失', '优化建议', '交互问题', '性能问题']
    const statuses = ['未处理', '正在处理', '已处理', '已忽略']
    const priorities = ['high', 'medium', 'low']
    const products = ['美化', '算量云', 'BIM 盒盖', '生产流程', '物料管理', '安装管理']
    const apps = ['经济测算分析', '公路算量', '市政算量', 'BIM 建模', '项目管理', '合同管理']
    const modules = ['公路算量', '市政算量', '土建算量', '钢筋算量', '安装算量', '装饰算量']
    const suppliers = ['建工一建设集团', '中建三局', '中铁十二局', '中交二公局', '中冶集团']
    const descriptions = [
      '导出 Excel 时部分数据丢失，列顺序错乱',
      '表格筛选后切换页面，筛选条件未保留',
      'BIM 模型加载速度过慢，超过10秒',
      '图表交互时偶发闪退问题',
      '新增记录后列表未自动刷新',
      '日期选择器跨年选择时显示异常',
      '批量操作时进度条卡顿不动',
      '权限配置保存后未即时生效',
      '数据导入模板格式校验不准确',
      '打印预览与实际输出排版不一致'
    ]

    const result = []
    for (let i = 0; i < 50; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      const findTime = new Date(2026, 3, 9 - Math.floor(Math.random() * 30), 8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60))
      const expectedTime = new Date(findTime.getTime() + (3 + Math.random() * 72) * 3600000)

      result.push({
        id: `FK-${3606 - i}`,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        owner: owners[Math.floor(Math.random() * owners.length)],
        findType: findTypes[Math.floor(Math.random() * findTypes.length)],
        feedbackType: feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)],
        findTime: formatDateTime(findTime),
        expectedTime: formatDateTime(expectedTime),
        responseHours: (Math.random() * 48).toFixed(1),
        isTimeout: Math.random() > 0.7,
        actualTime: status === '已处理' ? formatDateTime(new Date(expectedTime.getTime() + Math.random() * 86400000)) : '',
        priority,
        status,
        productScope: products[Math.floor(Math.random() * products.length)],
        handler: handlers[Math.floor(Math.random() * handlers.length)],
        score: status === '已处理' ? (3 + Math.floor(Math.random() * 3)) : null,
        appName: apps[Math.floor(Math.random() * apps.length)],
        moduleName: modules[Math.floor(Math.random() * modules.length)],
        findSituation: findTypes[Math.floor(Math.random() * findTypes.length)],
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
        remark: Math.random() > 0.5 ? '已确认问题，安排下个迭代修复' : '',
        checked: false
      })
    }
    return result
  }

  function formatDateTime (date) {
    const pad = n => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const columns = [
    { type: 'check', field: 'checked', headerCheckbox: true, width: '40px' },
    {
      field: 'id',
      caption: '编号',
      width: '80px',
      type: 'link',
      links: () => [{ caption: '', action: 'view' }]
    },
    {
      field: 'description',
      caption: '相关描述',
      width: '200px',
      type: 'text',
      lineClamp: 1,
      title: (r) => r.description
    },
    { field: 'owner', caption: '负责人', width: '80px' },
    { field: 'findType', caption: '发现类型', width: '80px', align: 'center' },
    {
      field: 'feedbackType',
      caption: '反馈类型',
      width: '80px',
      align: 'center',
      type: 'tag',
      tags: (r) => {
        const colorMap = {
          BUG: { color: 'var(--mu-warning-color)' },
          功能缺失: { color: 'var(--mu-primary-color)' },
          优化建议: { color: 'var(--mu-secondary-color)' },
          交互问题: { color: 'var(--mu-warning-color)' },
          性能问题: { color: 'var(--mu-danger-color)' }
        }
        return [{ caption: r.feedbackType, ...colorMap[r.feedbackType] || {} }]
      }
    },
    { field: 'findTime', caption: '发现时间', width: '140px', type: 'datetime', sortable: true },
    {
      field: 'expectedTime',
      caption: '期望完成时间',
      width: '160px',
      text: (r) => `${r.expectedTime}（已响应 ${r.responseHours}h）`
    },
    { field: 'actualTime', caption: '实际完成', width: '90px', align: 'center' },
    {
      field: 'priority',
      caption: '优先级',
      width: '60px',
      align: 'center',
      type: 'enum',
      mappings: {
        high: { text: '高', style: { color: 'var(--mu-danger-color)' } },
        medium: { text: '中', style: { color: 'var(--mu-warning-color)' } },
        low: { text: '低', style: { color: 'var(--mu-success-color)' } }
      }
    },
    {
      field: 'status',
      caption: '处理状态',
      width: '90px',
      align: 'center',
      type: 'tag',
      tags: (r) => {
        const colorMap = {
          未处理: { color: 'var(--mu-gray-8)' },
          正在处理: { color: 'var(--mu-primary-color)' },
          已处理: { color: 'var(--mu-success-color)' },
          已忽略: { color: 'var(--mu-warning-color)' }
        }
        return [{ caption: r.status, ...colorMap[r.status] || {} }]
      }
    },
    {
      field: 'productScope',
      caption: '产品范围',
      width: '80px',
      type: 'link',
      links: () => [{ caption: '', action: 'scope' }]
    },
    { field: 'handler', caption: '处理人', width: '70px' },
    {
      field: 'remark',
      caption: '解释和评分设置',
      width: '100px',
      type: 'text',
      lineClamp: 1,
      title: (r) => r.remark
    },
    {
      field: 'score',
      caption: '评分',
      width: '50px',
      align: 'center',
      type: 'text',
      text: (r) => r.score != null ? String(r.score) : ''
    },
    { field: 'appName', caption: '应用名称', width: '100px' },
    { field: 'moduleName', caption: '模块名称', width: '100px' },
    { field: 'findSituation', caption: '发现经办情况', width: '120px' },
    { field: 'supplier', caption: '一级供应商', width: '110px' }
  ]

  function onCellClick ({ record, column }) {
    console.log('cell click:', record.id, column.field)
  }

  function onCellItemClick ({ record, link }) {
    console.log('item click:', record.id, link?.action)
  }
</script>

<style>
.sidebar {
  background: var(--mu-bg-strong);
  border-right: 1px solid var(--mu-border-color-soft);
}

.sidebar-header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--mu-border-color-soft);
  color: var(--mu-text-color-normal);
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  overflow: auto;
  padding: 4px 0;
}

.sidebar-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 7px 16px;
  cursor: pointer;
  font-size: 13px;
  color: var(--mu-text-color-subtle);
  transition: background-color 0.15s;
}

.sidebar-item:hover {
  background: var(--mu-bg-stripe);
  color: var(--mu-text-color-normal);
}

.sidebar-item.active {
  color: #fff;
  background: var(--mu-primary-color);
  font-weight: 500;
}

.sidebar-divider {
  margin: 4px 12px;
  border-top: 1px solid var(--mu-border-color-soft);
}

.sidebar-group-title {
  padding: 8px 16px 4px;
  font-size: 11px;
  color: var(--mu-text-color-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.content-area {
  background: var(--mu-bg-stripe);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--mu-text-color-normal);
}

.filter-row {
  margin-bottom: 8px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.pagination-bar {
  padding: 8px 24px;
  border-top: 1px solid var(--mu-border-color-soft);
  background: var(--mu-bg-normal);
}
</style>
