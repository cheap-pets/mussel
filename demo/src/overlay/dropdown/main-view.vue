<template>
  <demo-page path="overlay/dropdown">
    <demo-section
      title="基础用法"
      note="mu-dropdown 包裹任意触发元素；dropdown-trigger 支持 click / hover，菜单项由 dropdown-items 数据驱动"
      :code="basicCode"
      vertical>
      <div class="demo-row">
        <mu-dropdown
          dropdown-trigger="click"
          :dropdown-items="artists"
          @dropdown:itemclick="onItemClick">
          <mu-button>{{ picked || '点击打开下拉' }}</mu-button>
        </mu-dropdown>
        <mu-dropdown
          dropdown-trigger="hover"
          :dropdown-items="artists"
          @dropdown:itemclick="onItemClick">
          <mu-button button-style="outline">
            悬停打开下拉
          </mu-button>
        </mu-dropdown>
        <span class="demo-log">最近选择：{{ lastPicked }}</span>
      </div>
    </demo-section>

    <demo-section
      title="DropdownButton 下拉按钮"
      note="独立下拉按钮；split-button 拆分主按钮与箭头区域，箭头区域才触发出菜单">
      <div class="demo-row">
        <mu-dropdown-button
          caption="Dropdown Button"
          :dropdown-items="artists"
          @dropdown:itemclick="onItemClick" />
        <mu-dropdown-button
          color="danger"
          split-button
          caption="Split Button"
          :dropdown-items="artists"
          @click="logClick"
          @dropdown:itemclick="onItemClick" />
        <mu-dropdown-button
          class="mu-icon-button"
          button-style="text"
          dropdown-trigger="hover"
          :dropdown-items="artists"
          @dropdown:itemclick="onItemClick" />
        <mu-dropdown-button
          x-color="cyan"
          split-button
          caption="Custom Color"
          :dropdown-items="artists"
          @dropdown:itemclick="onItemClick" />
      </div>
    </demo-section>

    <demo-section
      title="Check 与 Radio 菜单项"
      note="点击按钮展开菜单；check 项多选、radio 项单选，均用 v-model 绑定选中值">
      <div class="demo-row">
        <mu-dropdown-button
          split-button
          caption="Check & Radio"
          @dropdown:itemclick="onItemClick">
          <template #dropdown>
            <mu-dropdown-check-item
              v-model="checkedArtists"
              value="Ludwig van Beethoven" />
            <mu-dropdown-check-item
              v-model="checkedArtists"
              value="Wolfgang Amadeus Mozart" />
            <mu-dropdown-radio-item
              v-model="checkedArtist"
              value="Frédéric François Chopin" />
            <mu-dropdown-radio-item
              v-model="checkedArtist"
              value="Johann Baptist Strauss" />
          </template>
        </mu-dropdown-button>
        <span class="demo-log">多选：{{ checkedArtists.join('、') || '无' }}；单选：{{ checkedArtist || '无' }}</span>
      </div>
    </demo-section>

    <demo-section
      title="自定义下拉内容"
      note="点击按钮展开；#dropdown 插槽放搜索框 + 滚动列表，dropdown-class 控制面板尺寸">
      <mu-dropdown
        dropdown-class="dropdown-max-height-200 flex flex-col gap-half"
        dropdown-trigger="click">
        <mu-button>Search & Select</mu-button>
        <template #dropdown>
          <mu-search-input v-model="searchKey" class="flex-none" input-style="solid" style="width: 100%;" />
          <mu-scroll-box class="flex-auto">
            <mu-dropdown-item v-for="el in filteredItems" :key="el" :label="el" />
          </mu-scroll-box>
        </template>
      </mu-dropdown>
    </demo-section>

    <demo-section
      title="Header / Footer 插槽"
      note="点击按钮展开；dropdown-header 与 dropdown-footer 固定在列表两端，#dropdown-items 接管列表区">
      <mu-dropdown-button
        split-button
        caption="Items + Header & Footer"
        @dropdown:itemclick="onItemClick">
        <template #dropdown-header>
          已选 {{ checkedArtists.length }} 位
        </template>
        <template #dropdown-items>
          <mu-dropdown-check-item
            v-model="checkedArtists"
            value="Ludwig van Beethoven" />
          <mu-dropdown-check-item
            v-model="checkedArtists"
            value="Wolfgang Amadeus Mozart" />
          <mu-dropdown-check-item
            v-model="checkedArtists"
            value="Frédéric François Chopin" />
          <mu-dropdown-check-item
            v-model="checkedArtists"
            value="Johann Baptist Strauss" />
        </template>
        <template #dropdown-footer>
          <mu-button block caption="Clear" @click="checkedArtists = []" />
        </template>
      </mu-dropdown-button>
    </demo-section>

    <demo-section
      title="事件与程序化控制"
      note="点击「外部展开」按钮通过 ref.expand() 打开菜单；dropdown:show / hide / itemclick / action 事件结果见日志"
      vertical>
      <div class="demo-row">
        <mu-button caption="外部展开" @click="expandDropdown" />
        <mu-dropdown
          ref="dropdownRef"
          dropdown-trigger="click"
          :dropdown-items="artists"
          @dropdown:show="logEvent('dropdown:show')"
          @dropdown:hide="logEvent('dropdown:hide')"
          @dropdown:itemclick="onItemClick"
          @action="onAction">
          <mu-button button-style="outline">
            Ref Dropdown
          </mu-button>
        </mu-dropdown>
      </div>
      <div class="demo-log demo-log--block">
        {{ eventLog || '（暂无事件）' }}
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="禁用态不响应触发；短选项下拉宽度不小于触发文本；全屏元素内下拉正常弹出（点击按钮进入全屏后操作下拉）"
      regression
      vertical>
      <div class="demo-row">
        <mu-dropdown dropdown-disabled :dropdown-items="artists">
          <mu-button disabled>
            Disabled
          </mu-button>
        </mu-dropdown>
        <mu-dropdown-button caption="短文本 Options 下拉宽度测试" :dropdown-items="shortOptions" />
        <mu-dropdown-button
          style="align-self: flex-start;"
          color="primary"
          split-button
          button-style="outline"
          caption="Request Fullscreen"
          dropdown-trigger="click"
          :dropdown-items="artists"
          @click="requestFullscreen"
          @dropdown:itemclick="onItemClick" />
      </div>
      <div id="divX" class="demo-fullscreen-area">
        全屏区域（Request Fullscreen 按钮的宿主容器）
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-dropdown
  dropdown-trigger="click"
  :dropdown-items="[
    { label: 'Beethoven', action: 'A' },
    '-',
    { label: 'Mozart', action: 'B' }
  ]"
  @dropdown:itemclick="onItemClick">
  <mu-button>Open Dropdown</mu-button>
</mu-dropdown>`

  const dropdownRef = ref()
  const picked = ref()
  const lastPicked = ref('无')
  const eventLog = ref('')

  const artists = ref([
    { is: '-', label: 'GROUP 1' },
    { label: 'Ludwig van Beethoven', icon: 'info', action: 'A' },
    { label: 'Wolfgang Amadeus Mozart', icon: 'question', action: 'B' },
    '-',
    { is: '-', label: 'GROUP 2' },
    { label: 'Frédéric François Chopin', icon: '', action: 'C' },
    { label: 'Johann Baptist Strauss', icon: 'ok', action: 'D' }
  ])

  const shortOptions = ref(['1', '2', '3'])

  const checkedArtist = ref(null)
  const checkedArtists = ref([])

  const searchKey = ref('')
  const items = new Array(50).fill(0).map((el, idx) => `items${idx}`)
  const filteredItems = computed(() => items.filter(item => !searchKey.value || item.includes(searchKey.value)))

  function onItemClick (item) {
    picked.value = item.value || item.label
    lastPicked.value = picked.value
    logEvent(`itemclick: ${picked.value}`)
  }

  function onAction (action) {
    logEvent(`action: ${action}`)
  }

  function logEvent (text) {
    eventLog.value = `[${new Date().toLocaleTimeString()}] ${text}`
  }

  function logClick () {
    logEvent('split button 主按钮点击')
  }

  function expandDropdown () {
    dropdownRef.value?.expand()
  }

  function requestFullscreen () {
    document.querySelector('#divX').requestFullscreen()
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

  .demo-log--block {
    margin-top: 8px;
  }

  .demo-fullscreen-area {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 12px;
    border: 1px dashed var(--mu-border-color);
    color: var(--mu-text-color-muted);
    height: 120px;
  }

  .dropdown-max-height-200 {
    overflow: hidden;
    width: 300px;
    max-height: 200px;
  }
</style>
