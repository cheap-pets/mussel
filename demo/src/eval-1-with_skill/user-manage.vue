<template>
  <div class="mu-v-box p-2x" style="height: 100vh">
    <!-- 页面标题与操作栏 -->
    <div class="mu-h-box items-center justify-between mb-2x">
      <h3 style="margin: 0">
        用户管理
      </h3>
      <mu-button primary caption="新增用户" @click="handleAdd" />
    </div>

    <!-- 数据表格 -->
    <mu-table
      v-model:order-by="orderBy"
      :columns="columns"
      :records="records"
      key-field="id"
      striped
      hover-mode="row"
      gridlines="column"
      placeholder="-"
      @cell-item-click="onCellItemClick"
      @update:cell-value="onCellValueChange" />
  </div>

  <!-- 新增 / 编辑对话框 -->
  <mu-dialog
    v-model:visible="dialogVisible"
    :title="isEditing ? '编辑用户' : '新增用户'"
    width="520"
    easy-hide>
    <mu-form label-width="80px" label-align="right" class="py-1x">
      <mu-form-field label="姓名" flex="1 auto">
        <mu-input v-model="form.name" placeholder="请输入姓名" />
      </mu-form-field>
      <mu-form-field label="邮箱" flex="1 auto">
        <mu-input v-model="form.email" type="email" placeholder="请输入邮箱" />
      </mu-form-field>
      <mu-form-field label="角色" flex="1 auto">
        <mu-select
          v-model="form.role"
          :options="roleOptions"
          placeholder="请选择角色" />
      </mu-form-field>
      <mu-form-field label="状态" flex="1 auto">
        <mu-switch
          v-model="form.active"
          active-label="启用"
          inactive-label="停用" />
      </mu-form-field>
    </mu-form>
    <template #footer>
      <div class="mu-h-box justify-end gap-1x">
        <mu-button caption="取消" @click="dialogVisible = false" />
        <mu-button primary caption="确认" @click="handleSave" />
      </div>
    </template>
  </mu-dialog>
</template>

<script setup>
  import { ref, reactive, inject } from 'vue'

  const { messageBox } = inject('$mussel')

  // ---------- 排序 ----------
  const orderBy = ref('')

  // ---------- 对话框状态 ----------
  const dialogVisible = ref(false)
  const isEditing = ref(false)
  const editingId = ref(null)

  // ---------- 表单数据 ----------
  const getDefaultForm = () => ({
    name: '',
    email: '',
    role: '',
    active: true
  })
  const form = reactive(getDefaultForm())

  // ---------- 角色下拉选项 ----------
  const roleOptions = [
    { value: 'admin', label: '管理员' },
    { value: 'editor', label: '编辑者' },
    { value: 'viewer', label: '查看者' }
  ]

  // ---------- 模拟数据 ----------
  let nextId = 6
  const records = ref([
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin', active: true, created: '2024-06-01' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: 'editor', active: true, created: '2024-07-15' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: 'viewer', active: false, created: '2024-08-20' },
    { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: 'editor', active: true, created: '2025-01-10' },
    { id: 5, name: '孙七', email: 'sunqi@example.com', role: 'viewer', active: false, created: '2025-03-05' }
  ])

  // ---------- 角色映射 ----------
  const roleMappings = {
    admin: '管理员',
    editor: '编辑者',
    viewer: '查看者'
  }

  // ---------- 表格列配置 ----------
  const columns = [
    { type: 'rec_no', caption: '#', width: 60 },
    { type: 'check', field: 'checked', headerCheckbox: true, width: 50 },
    { field: 'name', caption: '姓名', type: 'text', sortable: true, width: 120 },
    { field: 'email', caption: '邮箱', type: 'text', width: 220 },
    {
      field: 'role',
      caption: '角色',
      type: 'enum',
      mappings: roleMappings,
      width: 100
    },
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
    {
      field: 'created',
      caption: '注册时间',
      type: 'date',
      format: 'yyyy-MM-dd',
      sortable: true,
      width: 130
    },
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

  // ---------- 表格事件 ----------
  function onCellItemClick ({ record, link }) {
    if (link.action === 'edit') {
      handleEdit(record)
    } else if (link.action === 'delete') {
      handleDelete(record)
    }
  }

  function onCellValueChange ({ record, column, value }) {
    if (column.type === 'check') {
      record.checked = value
    }
  }

  // ---------- 新增 ----------
  function handleAdd () {
    isEditing.value = false
    editingId.value = null
    Object.assign(form, getDefaultForm())
    dialogVisible.value = true
  }

  // ---------- 编辑 ----------
  function handleEdit (record) {
    isEditing.value = true
    editingId.value = record.id
    Object.assign(form, {
      name: record.name,
      email: record.email,
      role: record.role,
      active: record.active
    })
    dialogVisible.value = true
  }

  // ---------- 保存 ----------
  function handleSave () {
    if (!form.name.trim()) {
      messageBox.warn('请输入姓名')
      return
    }
    if (!form.email.trim()) {
      messageBox.warn('请输入邮箱')
      return
    }
    if (!form.role) {
      messageBox.warn('请选择角色')
      return
    }

    if (isEditing.value) {
      // 更新已有记录
      const target = records.value.find((r) => r.id === editingId.value)
      if (target) {
        target.name = form.name
        target.email = form.email
        target.role = form.role
        target.active = form.active
      }
      messageBox.notify({ title: '成功', message: '用户信息已更新', type: 'success' })
    } else {
      // 新增记录
      records.value.push({
        id: nextId++,
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active,
        created: new Date().toISOString().slice(0, 10)
      })
      messageBox.notify({ title: '成功', message: '用户已添加', type: 'success' })
    }

    dialogVisible.value = false
  }

  // ---------- 删除 ----------
  function handleDelete (record) {
    messageBox.confirm(`确认删除用户「${record.name}」吗？`).then((btn) => {
      if (btn === 'ok') {
        const index = records.value.findIndex((r) => r.id === record.id)
        if (index > -1) {
          records.value.splice(index, 1)
        }
        messageBox.notify({ title: '成功', message: '用户已删除', type: 'success' })
      }
    })
  }
</script>
