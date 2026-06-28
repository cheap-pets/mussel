<template>
  <div>
    <h2>
      DROPDOWN & CONTEXT-MENU
      <theme-switch />
    </h2>
    <mu-context-menu ref="contextMenu" :menus="artists" />
    <div style="height: 100%; min-height: 800px;" @contextmenu="onContextMenu">
      <div class="group">
        <mu-dropdown
          style="display: inline-block;"
          :dropdown-items="artists"
          trigger-action="click"
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
