<template>
  <div class="mu-v-box p-2x gap-2x">
    <!-- 页面标题 -->
    <h2 class="text-normal mb-1x" style="font-size: 20px; font-weight: 600;">
      系统设置
    </h2>

    <!-- 基本设置 -->
    <mu-form label-width="120px" label-align="right">
      <h3 class="text-normal mb-1x" style="font-size: 16px; font-weight: 500;">
        基本设置
      </h3>
      <mu-form-field label="站点名称" flex="1 auto">
        <mu-input v-model="form.siteName" placeholder="请输入站点名称" />
      </mu-form-field>
      <mu-form-field label="站点描述" flex="1 auto">
        <textarea
          v-model="form.siteDescription"
          class="mu-input"
          placeholder="请输入站点描述"
          rows="3"
          style="resize: vertical;" />
      </mu-form-field>
    </mu-form>

    <!-- 主题设置 -->
    <mu-form label-width="120px" label-align="right">
      <h3 class="text-normal mb-1x" style="font-size: 16px; font-weight: 500;">
        主题设置
      </h3>
      <mu-form-row>
        <mu-form-field flex="1" label="主色调">
          <mu-select
            v-model="form.primaryColor"
            :options="colorOptions" />
        </mu-form-field>
        <mu-form-field flex="1" label="字体大小">
          <mu-select
            v-model="form.fontSize"
            :options="fontSizeOptions" />
        </mu-form-field>
      </mu-form-row>
    </mu-form>

    <!-- 通知设置 -->
    <mu-form label-width="120px" label-align="right">
      <h3 class="text-normal mb-1x" style="font-size: 16px; font-weight: 500;">
        通知设置
      </h3>
      <mu-form-row>
        <mu-form-field flex="1" label="邮件通知">
          <mu-switch v-model="form.emailNotify" />
        </mu-form-field>
        <mu-form-field flex="1" label="短信通知">
          <mu-switch v-model="form.smsNotify" />
        </mu-form-field>
      </mu-form-row>
      <mu-form-field label="通知邮箱" flex="1 auto">
        <mu-input
          v-model="form.notifyEmail"
          placeholder="请输入通知邮箱"
          :disabled="!form.emailNotify" />
      </mu-form-field>
    </mu-form>

    <!-- 安全设置 -->
    <mu-form label-width="120px" label-align="right">
      <h3 class="text-normal mb-1x" style="font-size: 16px; font-weight: 500;">
        安全设置
      </h3>
      <mu-form-row>
        <mu-form-field flex="1" label="密码过期天数">
          <mu-input
            v-model="form.passwordExpireDays"
            type="number"
            placeholder="请输入天数" />
        </mu-form-field>
        <mu-form-field flex="1" label="两步验证">
          <mu-switch v-model="form.twoFactorAuth" />
        </mu-form-field>
      </mu-form-row>
    </mu-form>

    <!-- 暗色模式 -->
    <mu-form label-width="120px" label-align="right">
      <h3 class="text-normal mb-1x" style="font-size: 16px; font-weight: 500;">
        显示设置
      </h3>
      <mu-form-field label="暗色模式">
        <mu-switch v-model="darkMode" />
      </mu-form-field>
    </mu-form>

    <!-- 保存按钮 -->
    <div class="flex justify-end mt-2x">
      <mu-button caption="保存设置" primary @click="onSave" />
    </div>
  </div>
</template>

<script setup>
  import { reactive, ref, watch, inject } from 'vue'

  const { messageBox } = inject('$mussel')

  // 暗色模式
  const darkMode = ref(false)

  watch(darkMode, (enabled) => {
    const root = document.querySelector('.mu-root') || document.body
    root.classList.toggle('mu-dark', enabled)
  })

  // 表单数据
  const form = reactive({
    siteName: '',
    siteDescription: '',
    primaryColor: 'blue',
    fontSize: '14px',
    emailNotify: false,
    smsNotify: false,
    notifyEmail: '',
    passwordExpireDays: 90,
    twoFactorAuth: false
  })

  // 主色调选项
  const colorOptions = [
    { value: 'blue', label: '蓝色' },
    { value: 'green', label: '绿色' },
    { value: 'violet', label: '紫色' },
    { value: 'orange', label: '橙色' }
  ]

  // 字体大小选项
  const fontSizeOptions = [
    { value: '12px', label: '12px (小)' },
    { value: '14px', label: '14px (默认)' },
    { value: '16px', label: '16px (大)' },
    { value: '18px', label: '18px (特大)' }
  ]

  // 保存
  function onSave () {
    messageBox.alert('保存成功')
  }
</script>
