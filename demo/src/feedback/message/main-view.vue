<template>
  <demo-page path="feedback/message">
    <demo-section
      title="对话框（alert / confirm）"
      note="$mussel.messageBox.alert / confirm 弹出模态对话框，Promise resolve 用户点击的按钮名"
      :code="basicCode"
      vertical>
      <div class="demo-row">
        <mu-button caption="Alert" color="primary" @click="alert" />
        <mu-button caption="Confirm" @click="confirm" />
        <span class="demo-log">最近结果：{{ lastResult }}</span>
      </div>
    </demo-section>

    <demo-section
      title="状态对话框（error / warn / showMessage）"
      note="error / warn 为预设图标与按钮的状态框；showMessage 传对象可自定义 icon/title/buttons">
      <div class="demo-row">
        <mu-button caption="Error" @click="error" />
        <mu-button caption="Warn" @click="warn" />
        <mu-button caption="ShowMessage（自定义）" @click="showMessage" />
      </div>
    </demo-section>

    <demo-section
      title="通知（notify）"
      note="messageBox.notify 弹出右上角通知，duration 后自动关闭（默认 3000ms）；type 支持 alert / success / warn / error">
      <div class="demo-row">
        <mu-button caption="Info" @click="notifyInfo" />
        <mu-button caption="Success" @click="notifySuccess" />
        <mu-button caption="Warning" @click="notifyWarning" />
        <mu-button caption="Error" @click="notifyError" />
        <mu-button caption="长驻通知（duration 10s）" @click="notifyLong" />
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="多行与富文本消息内容、连续弹出叠加、回调 callback 参数"
      regression
      vertical>
      <div class="demo-row">
        <mu-button caption="长文本换行" @click="error" />
        <mu-button caption="连弹 3 条通知" @click="notifyStack" />
        <span class="demo-log">notify 按 duration 自动关闭，也可用 messageBox.dismiss(id) 手动关闭（id 由内部分配）</span>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, getCurrentInstance } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

proxy.$mussel.messageBox.alert('Hello World !').then(btn => {
  // btn 为用户点击的按钮名
})`

  const { proxy } = getCurrentInstance()
  const messageBox = proxy.$mussel.messageBox

  const lastResult = ref('无')

  function alert () {
    messageBox.alert('Hello World !').then(btn => { lastResult.value = `alert: ${btn}` })
  }

  function confirm () {
    messageBox.confirm('确认执行该操作吗？').then(btn => { lastResult.value = `confirm: ${btn}` })
  }

  function error () {
    messageBox.error('糟了！敌人正在朝咱们的阵地进攻！糟了！敌人正在朝咱们的阵地进攻！\n糟了！敌人正在朝咱们的阵地进攻！糟了！敌人正在朝咱们的阵地进攻！糟了！敌人正在朝咱们的阵地进攻！糟了！敌人正在朝咱们的阵地进攻！<p>进入防御状态！</p>')
  }

  function warn () {
    messageBox.warn('磁盘空间不足 10%')
  }

  function showMessage () {
    messageBox.showMessage({
      icon: 'bolt',
      title: '自定义',
      message: '这是一个自定义 showMessage'
    })
  }

  function notifyInfo () {
    messageBox.notify({ title: '提示', message: '这是一个普通提示。', type: 'alert' })
  }

  function notifySuccess () {
    messageBox.notify({ title: '提示', message: '数据保存成功。', type: 'success' })
  }

  function notifyWarning () {
    messageBox.notify({ type: 'warn', title: '警告', message: '这是一个做了危险操作的提示！' })
  }

  function notifyError () {
    messageBox.notify({ type: 'error', message: '这是一个出错的提示！' })
  }

  function notifyLong () {
    messageBox.notify({ title: '提示', message: '10 秒后自动关闭。', duration: 10000 })
  }

  function notifyStack () {
    notifyInfo()
    notifySuccess()
    notifyWarning()
  }
</script>

<style>
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
