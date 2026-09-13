<template>
  <div>
    <h2>
      DROPDOWN & CONTEXT-MENU & TOOLTIP
      <theme-switch />
    </h2>
    <mu-context-menu ref="contextMenu" :menus="artists" />
    <div style="height: 100%; min-height: 800px;" @contextmenu="onContextMenu">
      <div class="group">
        <mu-dropdown
          style="display: inline-block;"
          dropdown-trigger="click"
          :dropdown-items="artists"
          @dropdown:show="onShow"
          @dropdown:itemclick="onItemClick"
          @action="onAction">
          <mu-button>{{ artist || 'Mouse Hover' }}</mu-button>
        </mu-dropdown>
        <mu-dropdown
          style="display: inline-block;"
          dropdown-trigger="click"
          :dropdown-items="artists"
          @dropdown:show="onShow"
          @dropdown:itemclick="onItemClick"
          @action="onAction">
          <mu-button>Press me</mu-button>
        </mu-dropdown>
      </div>
      <div class="group">
        <mu-dropdown-button
          danger
          :dropdown-items="artists"
          @dropdown:itemclick="onItemClick"
          @action="onAction">
          Dropdown Button A
        </mu-dropdown-button>
        <mu-dropdown-button
          x-color="cyan"
          split-button
          caption="Split Button"
          :dropdown-items="artists"
          @click="onButtonClick"
          @dropdown:itemclick="onItemClick"
          @action="onAction" />
        <mu-dropdown-button
          class="mu-icon-button"
          button-style="text"
          dropdown-icon
          dropdown-trigger="hover"
          :dropdown-items="artists"
          @dropdown:itemclick="onItemClick"
          @action="onAction" />
      </div>
      <div class="group">
        <mu-dropdown-button
          split-button
          caption="Check & Radio"
          @dropdown:itemclick="onItemClick"
          @action="onAction">
          <template #dropdown>
            <mu-dropdown-check-item
              v-model="checkedArtists"
              value="Ludwig van Beethoven" />
            <mu-dropdown-check-item
              v-model="checkedArtists"
              value="Wolfgang Amadeus Mozart" />
            <mu-list-divider />
            <mu-dropdown-radio-item
              v-model="checkedArtist"
              value="Frédéric François Chopin" />
            <mu-dropdown-radio-item
              v-model="checkedArtist"
              value="Johann Baptist Strauss" />
          </template>
        </mu-dropdown-button>
      </div>
      <div class="group">
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
      </div>
      <div class="group">
        <mu-dropdown-button
          split-button
          caption="Items + Header & Footer"
          @dropdown:itemclick="onItemClick"
          @action="onAction">
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
      </div>
      <div class="group">
        <mu-dropdown-button caption="短文本 Options 下拉宽度测试" :dropdown-items="shortOptions" />
      </div>
      <div class="group">
        <mu-tooltip content="删除后不可恢复">
          <mu-button danger>
            删除
          </mu-button>
        </mu-tooltip>
        <mu-tooltip placement="right" content="右侧提示（主轴空间不足自动翻转）">
          <mu-icon-button icon="info" />
        </mu-tooltip>
        <mu-tooltip :arrow="false" content="无箭头提示">
          <mu-button>无箭头</mu-button>
        </mu-tooltip>
        <mu-tooltip trigger="focus" content="聚焦时显示的提示">
          <mu-input placeholder="focus 触发" />
        </mu-tooltip>
        <mu-tooltip trigger="click" content="点击触发的提示（外点 / ESC 关闭）">
          <mu-button>Click Trigger</mu-button>
        </mu-tooltip>
      </div>
      <div class="group">
        <mu-tooltip placement="bottom">
          <mu-icon-button icon="question" />
          <template #tooltip>
            支持 <b>富文本</b> 与 <mu-icon icon="info" /> 图标
          </template>
        </mu-tooltip>
        <mu-tooltip content="长文本换行：提示内容超过最大宽度 320px 时会自动折行，保证在狭小视口内仍然可读。">
          <mu-button>长文本</mu-button>
        </mu-tooltip>
        <mu-button v-mu-tooltip="'字符串指令提示'">
          v-mu-tooltip
        </mu-button>
        <mu-button v-mu-tooltip="{ content: '对象配置 · bottom-end', placement: 'bottom-end' }">
          对象 value
        </mu-button>
        <mu-button v-mu-tooltip="dynamicTip" @click="cycleTip">
          动态 value
        </mu-button>
        <mu-button v-mu-tooltip="'disabled 控件不触发（已知限制）'" disabled>
          Disabled
        </mu-button>
      </div>
      <div class="group" style="flex-wrap: wrap;">
        <mu-tooltip v-for="p in placements" :key="p" :content="`placement: ${p}`" :placement="p">
          <mu-button button-style="outline">
            {{ p }}
          </mu-button>
        </mu-tooltip>
      </div>
      <div class="group">
        <mu-toolbar class="bg-fill" size="large" style="gap: 0;">
          <mu-search-input class="flex-1 mu-input--inset" />
          <mu-flex-divider />
          <mu-dropdown-button
            class="mu-icon-button"
            button-style="link"
            dropdown-icon="folder"
            dropdown-anchor="$parent"
            :dropdown-items="artists"
            @dropdown:itemclick="onItemClick"
            @action="onAction" />
        </mu-toolbar>
      </div>
      <div id="divX" class="group">
        <mu-dropdown-button
          style="align-self: flex-start;"
          primary
          split-button
          button-style="outline"
          caption="Request Fullscreen"
          dropdown-trigger="click"
          :dropdown-items="artists"
          @click="requestFullscreen"
          @dropdown:itemclick="onItemClick"
          @action="onAction" />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const contextMenu = ref()
  const artist = ref()
  const artists = ref([
    { is: '-', label: 'GROUP 1' },
    { label: 'Ludwig van Beethoven', icon: 'info', action: 'A' },
    { label: 'Wolfgang Amadeus Mozart', icon: 'question', action: 'B' },
    '-',
    { is: '-', label: 'GROUP 2' },
    { is: '-', label: 'GROUP 3' },
    { label: 'Frédéric François Chopin', icon: '', action: 'C' },
    { label: 'Johann Baptist Strauss', icon: 'ok', action: 'D' }
  ])

  const shortOptions = ref(['1', '2', '3'])

  const dynamicTip = ref('动态提示 1')
  const placements = [
    'top-start', 'top', 'top-end',
    'right-start', 'right', 'right-end',
    'bottom-start', 'bottom', 'bottom-end',
    'left-start', 'left', 'left-end'
  ]

  function cycleTip () {
    dynamicTip.value = dynamicTip.value === '动态提示 1'
      ? '动态提示 2（updated 字段 diff 同步，不重播动画）'
      : '动态提示 1'
  }

  const checkedArtist = ref(null)
  const checkedArtists = ref([])

  const searchKey = ref('')
  const items = new Array(50).fill(0).map((el, idx) => `items${idx}`)
  const filteredItems = computed(() => items.filter(item => !searchKey.value || item.includes(searchKey.value)))

  function onShow () {
    console.log('show')
  }

  function onItemClick (item) {
    artist.value = item.value || item.label
  }

  function onAction (action) {
    console.log('action:', action)
  }

  function onButtonClick () {
    console.log('button click')
  }

  function requestFullscreen () {
    const divX = document.querySelector('#divX')
    divX.requestFullscreen()
  }

  function onContextMenu (event) {
    contextMenu.value.show(event)
  }
</script>

<style>
  .filter-bar.mu-toolbar {
    gap: 0;
  }

  .dropdown-max-height-200 {
    overflow: hidden;
    width: 300px;
    max-height: 200px;
  }
</style>
