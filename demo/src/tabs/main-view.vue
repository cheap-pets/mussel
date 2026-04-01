<template>
  <div class="mu-box mu-bg-normal">
    <div class="mu-bar mu-box mu-bg-strong">
      <label>Tab Position</label>
      <mu-combo-box
        v-model="tabPosition" class="mu-box" :clear-button="false"
        style="width: 100px;" :options="positions" />
      <label>Tab Style</label>
      <mu-combo-box
        v-model="tabStyle" class="mu-box" :clear-button="false"
        style="width: 125px;" :options="styles" />
      <theme-switch />
    </div>

    <mu-tabs
      v-model:active-tab="activeTab"
      :tab-style="tabStyle"
      :tab-position="tabPosition"
      class="mu-box" margin="2x" padding="1x" border="dashed"
      @button-click="console.log($event)"
      @tab-click="console.log($event)"
      @tab-change="console.log($event)">
      <template #tab-bar>
        My tab bar content
      </template>
      <mu-tab-panel name="Tab_1" :tab-order="4" caption="Tab Alpha">
        This is Tab 1
      </mu-tab-panel>
      <mu-tab-panel name="Tab_2" :tab-order="3" caption="Tab Bravo">
        This is Tab 2
      </mu-tab-panel>
      <mu-tab-panel name="Tab_3" :tab-order="2" caption="Tab Charlie">
        This is Tab 3
      </mu-tab-panel>
      <mu-tab-panel v-if="tab4Visible" name="Tab_4" :tab-order="1" caption="Tab Delta" disabled>
        This is Tab 4
      </mu-tab-panel>
    </mu-tabs>

    <div class="mu-divider mu-box" margin-x="2x" thin />

    <mu-tabs
      :active-tab="activeTab2"
      :tab-style="tabStyle"
      class="mu-box" margin="2x" padding="1x" border="muted"
      style="--mu-tab-bar_active-bar-width: 1px;"
      @update:active-tab="updateActiveTab2">
      <template #tab-bar-prepend>
        <label class="mu-label">Customized Tab Bar</label>
        <div class="mu-space" />
        <div class="mu-divider" />
      </template>
      <template #tab-bar-append>
        <div class="mu-divider" />
        <div class="mu-space" />
        <mu-dropdown-button class="mu-box" caption="artist" :dropdown-items="artists" />
        <mu-input input-style="solid" prefix=":icon=search" placeholder="Search Something" />
      </template>
      <mu-tab-panel name="Tab_1">
        This is Tab 1
      </mu-tab-panel>
      <mu-tab-panel name="Tab_2">
        This is Tab 2
      </mu-tab-panel>
      <mu-tab-panel name="Tab_3">
        This is Tab 3
      </mu-tab-panel>
      <mu-tab-panel name="Tab_4" disabled>
        This is Tab 4
      </mu-tab-panel>
    </mu-tabs>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'

  import ThemeSwitch from '../common/theme-switch.vue'

  const positions = [
    { value: 'top' },
    { value: 'bottom' },
    { value: 'left' },
    { value: 'right' }
  ]

  const styles = [
    { value: 'button' },
    { value: 'small-button' },
    { value: 'simple' }
  ]

  const activeTab = ref()
  const activeTab2 = ref()
  const tabStyle = ref('simple')
  const tabPosition = ref('top')

  const artists = [
    { is: '-', label: 'GROUP 1' },
    { label: 'Ludwig van Beethoven', value: 1 },
    { label: 'Wolfgang Amadeus Mozart' },
    '-',
    { is: '-', label: 'GROUP 2' },
    { label: 'Frédéric François Chopin' },
    { label: 'Johann Baptist Strauss', disabled: true }
  ]

  function updateActiveTab2 (tabName) {
    activeTab2.value = tabName
  }

  const tab4Visible = ref(false)

  onMounted(() => {
    setTimeout(() => {
      tab4Visible.value = true
    }, 3000)
  })
</script>

<style>
  .mu-tabs {
    height: 200px;
  }
</style>
