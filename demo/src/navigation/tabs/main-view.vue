<template>
  <demo-page path="navigation/tabs">
    <demo-section
      title="基础用法"
      note="mu-tab-panel 组成页签，v-model:active-tab 绑定当前页签名（name）；点击页签切换内容"
      :code="basicCode"
      vertical>
      <mu-tabs
        v-model:active-tab="activeTab"
        class="demo-tabs">
        <mu-tab-panel name="Tab_1" caption="Tab Alpha">
          This is Tab 1
        </mu-tab-panel>
        <mu-tab-panel name="Tab_2" caption="Tab Bravo">
          This is Tab 2
        </mu-tab-panel>
        <mu-tab-panel name="Tab_3" caption="Tab Charlie">
          This is Tab 3
        </mu-tab-panel>
      </mu-tabs>
      <span class="demo-log">active-tab：{{ activeTab ?? '未选中' }}</span>
    </demo-section>

    <demo-section
      title="风格与位置"
      note="tab-style 为 simple / lined-simple / button / small-button / card；tab-position 为 top / bottom / left / right"
      vertical>
      <div class="demo-row">
        <span class="demo-log">tab-style：</span>
        <mu-select
          v-model="tabStyle"
          :options="styleOptions"
          :clear-button="false"
          style="width: 160px" />
        <span class="demo-log">tab-position：</span>
        <mu-select
          v-model="tabPosition"
          :options="positionOptions"
          :clear-button="false"
          style="width: 120px" />
      </div>
      <mu-tabs
        v-model:active-tab="activeTab2"
        :tab-style="tabStyle"
        :tab-position="tabPosition"
        class="demo-tabs mt-1x">
        <mu-tab-panel name="Tab_1" caption="Alpha">
          Alpha 内容
        </mu-tab-panel>
        <mu-tab-panel name="Tab_2" caption="Bravo">
          Bravo 内容
        </mu-tab-panel>
        <mu-tab-panel name="Tab_3" caption="Charlie">
          Charlie 内容
        </mu-tab-panel>
      </mu-tabs>
    </demo-section>

    <demo-section
      title="排序、禁用与动态页签"
      note="tab-order 调整页签顺序；disabled 禁用点击；3 秒后动态插入 Tab Delta 页签（观察页签栏自动更新）"
      vertical>
      <mu-tabs
        v-model:active-tab="activeTab3"
        class="demo-tabs">
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
    </demo-section>

    <demo-section
      title="自定义页签栏"
      note="#tab-bar 完全接管；#tab-bar-prepend / #tab-bar-append 在默认页签前后插内容"
      vertical>
      <mu-tabs
        class="demo-tabs"
        :active-tab="activeTab4"
        @update:active-tab="activeTab4 = $event">
        <template #tab-bar-prepend>
          <label>自定义前缀</label>
          <div class="flex-space" />
        </template>
        <template #tab-bar-append>
          <div class="flex-space" />
          <mu-button caption="重置到 Tab_1" button-style="text" @click="activeTab4 = 'Tab_1'" />
        </template>
        <mu-tab-panel name="Tab_1" caption="Tab 1">
          This is Tab 1
        </mu-tab-panel>
        <mu-tab-panel name="Tab_2" caption="Tab 2">
          This is Tab 2
        </mu-tab-panel>
        <mu-tab-panel name="Tab_3" caption="Tab 3">
          This is Tab 3
        </mu-tab-panel>
      </mu-tabs>
    </demo-section>

    <demo-section
      title="大量页签"
      note="16 个页签超出宽度时页签栏横向滚动"
      vertical>
      <mu-tabs
        v-model:active-tab="activeTab5"
        class="demo-tabs">
        <mu-tab-panel
          v-for="i in 16"
          :key="i"
          :name="`Tab_${i}`"
          :caption="`Tab Button ${i}`">
          This is Tab {{ i }}
        </mu-tab-panel>
      </mu-tabs>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="受控模式（仅 prop 不 v-model）、空页签内容、无 active-tab 初始态"
      regression
      vertical>
      <mu-tabs class="demo-tabs">
        <mu-tab-panel name="A" caption="空内容页签" />
        <mu-tab-panel name="B" caption="有内容">
          B 内容
        </mu-tab-panel>
      </mu-tabs>
      <mu-tabs class="demo-tabs demo-tabs--short">
        <mu-tab-panel name="A" caption="A">
          A 内容
        </mu-tab-panel>
        <mu-tab-panel name="B" caption="B">
          B 内容
        </mu-tab-panel>
      </mu-tabs>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-tabs v-model:active-tab="activeTab">
  <mu-tab-panel name="Tab_1" caption="Tab Alpha">内容一</mu-tab-panel>
  <mu-tab-panel name="Tab_2" caption="Tab Bravo">内容二</mu-tab-panel>
</mu-tabs>`

  const activeTab = ref('Tab_1')
  const activeTab2 = ref()
  const activeTab3 = ref()
  const activeTab4 = ref('Tab_1')
  const activeTab5 = ref()

  const tabStyle = ref('simple')
  const tabPosition = ref('top')
  const tab4Visible = ref(false)

  const styleOptions = [
    { value: 'simple' },
    { value: 'lined-simple' },
    { value: 'button' },
    { value: 'small-button' },
    { value: 'card' }
  ]

  const positionOptions = [
    { value: 'top' },
    { value: 'bottom' },
    { value: 'left' },
    { value: 'right' }
  ]

  onMounted(() => {
    setTimeout(() => {
      tab4Visible.value = true
    }, 3000)
  })
</script>

<style>
  .demo-tabs {
    height: 180px;

    /* 16 页签内容超宽时 stretch 不收缩，限制在 section 容器内，页签栏横向滚动 */
    max-width: 100%;
  }

  .demo-tabs--short {
    height: 120px;
    margin-top: 16px;
  }

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
