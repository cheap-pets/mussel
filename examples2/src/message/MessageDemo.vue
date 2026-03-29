<template>
  <div class="mu-box mu-bg-normal" position="fixed fit">
    <h2>
      Message Components & API
      <mu-switch
        v-model="darkMode"
        active-label="Dark"
        inactive-label="Light"
        @update:model-value="onUIModeChange" />
    </h2>
    <div class="group">
      <mu-button @click="alert">
        Alert
      </mu-button>
      <mu-button @click="confirm">
        Confirm
      </mu-button>
      <mu-button @click="error">
        Error
      </mu-button>
      <mu-button @click="warn">
        Warn
      </mu-button>
      <mu-button @click="showMessage">
        Show Message
      </mu-button>
    </div>
    <div class="group">
      <mu-button @click="notifyInfo">
        Notify Info
      </mu-button>
      <mu-button @click="notifySuccess">
        Notify Success
      </mu-button>
      <mu-button @click="notifyWarning">
        Notify Warning
      </mu-button>
      <mu-button @click="notifyError">
        Notify Error
      </mu-button>
    </div>
    <div class="group">
      <mu-status-box
        class="mu-bg-strong" width="500" height="300"
        border="divider" border-radius="2x"
        icon="bolt"
        title="CAUTION !"
        message="Something Wrong Here !">
        <mu-button primary round>
          Do Something ...
        </mu-button>
      </mu-status-box>
    </div>
    <div class="group">
      <mu-status-box
        class="mu-bg-strong" width="500" height="400"
        border="divider" border-radius="2x"
        title="NOT FOUND !"
        message="Something Wrong Here ! Something Wrong Here ! Something Wrong Here ! Something Wrong Here ! Something Wrong Here !">
        <template #icon>
          <div style="width: 64px; height: 64px; background: var(--mu-warning-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px;">
            !
          </div>
        </template>
        <div class="mu-box" layout="flex" margin-top="auto" align-self="stretch">
          <mu-button primary round>
            Create New ...
          </mu-button>
          <span flex="1" />
          <mu-button round>
            Dismiss
          </mu-button>
        </div>
      </mu-status-box>
    </div>
  </div>
</template>

<script setup>
  import { ref, getCurrentInstance } from 'vue'

  const darkMode = ref(false)
  const { proxy } = getCurrentInstance()

  function onUIModeChange () {
    document.querySelector('.mu-root').classList.toggle('mu-dark')
  }

  function alert () {
    proxy.$mussel.messageBox.alert('Hello World !')
      .then(btn => console.log(btn))
  }

  function confirm () {
    proxy.$mussel.messageBox.confirm('Hello World !')
      .then(btn => console.log(btn))
  }

  function error () {
    proxy.$mussel.messageBox.error('糟了！敌人正在朝咱们的阵地进攻！糟了！敌人正在朝咱们的阵地进攻！糟了！敌人正在朝咱们的阵地进攻！糟了！敌人正在朝咱们的阵地进攻！糟了！敌人正在朝咱们的阵地进攻！糟了！敌人正在朝咱们的阵地进攻！<p>进入防御状态！</p>')
      .then(btn => console.log(btn))
  }

  function warn () {
    proxy.$mussel.messageBox.warn('Hello World !')
      .then(btn => console.log(btn))
  }

  function showMessage () {
    proxy.$mussel.messageBox.showMessage({
      icon: 'bolt',
      message: 'Hello World !'
    })
      .then(btn => console.log(btn))
  }

  function notifyInfo () {
    proxy.$mussel.messageBox.notify({
      title: '提示',
      message: '这是一个普通提示。',
      type: 'alert'
    })
  }

  function notifySuccess () {
    proxy.$mussel.messageBox.notify({
      title: '提示',
      message: '数据保存成功。',
      type: 'success'
    })
  }

  function notifyWarning () {
    proxy.$mussel.messageBox.notify({
      type: 'warn',
      title: '警告',
      message: '这是一个做了危险操作的提示！'
    })
  }

  function notifyError () {
    proxy.$mussel.messageBox.notify({
      type: 'error',
      message: '这是一个出错的提示！'
    })
  }
</script>
