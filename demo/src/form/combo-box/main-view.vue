<template>
  <demo-page path="form/combo-box">
    <demo-section
      title="基础用法"
      note="options 渲染下拉项，输入内容过滤或自由填写需配合 editable"
      :code="basicCode">
      <mu-combo-box
        v-model="artist"
        :options="artists"
        style="width: 300px" />
      <span class="demo-value">值：{{ artist || '空' }}</span>
    </demo-section>

    <demo-section
      title="自定义下拉"
      note="#dropdown 插槽用 mu-option 自组下拉项">
      <mu-combo-box
        v-model="artist"
        prefix="Artist: "
        style="width: 300px">
        <template #dropdown>
          <mu-option value="Ludwig van Beethoven" />
          <mu-option value="Wolfgang Amadeus Mozart" />
          <mu-option value="Frédéric François Chopin" />
        </template>
      </mu-combo-box>
    </demo-section>

    <demo-section
      title="可编辑"
      note="editable 后可在输入框直接输入任意值，同时保留下拉选择">
      <mu-combo-box
        v-model="artist"
        editable
        :options="artists"
        style="width: 300px" />
    </demo-section>

    <demo-section
      title="事件与动态选项"
      note="prefix-click、dropdown:show 事件；点击按钮动态追加选项">
      <div class="demo-row">
        <mu-combo-box
          v-model="dynamicArtist"
          prefix="Artist: "
          dropdown-host="$parent"
          :options="dynamicArtists"
          style="width: 300px"
          @prefix-click="onLog('prefix-click')"
          @dropdown:show="onLog('dropdown:show')"
          @esc="onLog('esc')" />
        <mu-button
          caption="Add Option"
          @click="addOption" />
        <span class="demo-value">事件：{{ eventLog || '无' }}</span>
      </div>
    </demo-section>

    <demo-section
      title="value-mode 复合值"
      note="composite 模式值为 { value, label }；下拉宽面板演示"
      vertical>
      <mu-combo-box
        v-model="cnArtist"
        value-mode="composite"
        dropdown-width="600px"
        style="width: 300px"
        :options="artistsCn" />
      <span class="demo-value">值：{{ JSON.stringify(cnArtist) }}</span>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="初始值、禁用项与空值"
      regression
      vertical>
      <div class="demo-row">
        <span>初始选中值：</span>
        <mu-combo-box
          v-model="artist"
          :options="artists"
          style="width: 300px" />
      </div>
      <div class="demo-row">
        <span>含禁用项（肖邦不可选）：</span>
        <mu-combo-box
          v-model="emptyArtist"
          :options="artists"
          style="width: 300px" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-combo-box
  v-model="artist"
  :options="[
    { value: 'Ludwig van Beethoven' },
    { value: 'Mozart', disabled: true }
  ]" />`

  const artist = ref('Johann Baptist Strauss')
  const emptyArtist = ref()
  const dynamicArtist = ref()
  const cnArtist = ref()
  const eventLog = ref('')

  const artists = [
    { is: '-', label: 'GROUP 1' },
    { value: 'Ludwig van Beethoven' },
    { value: 'Wolfgang Amadeus Mozart' },
    { value: 'Frédéric François Chopin', disabled: true },
    { is: '-', label: 'GROUP 2' },
    { value: 'Johann Baptist Strauss' }
  ]

  const dynamicArtists = ref([
    { value: 'Ludwig van Beethoven' },
    { value: 'Wolfgang Amadeus Mozart' }
  ])

  const artistsCn = [
    { value: 'Ludwig van Beethoven', label: '贝多芬' },
    { value: 'Wolfgang Amadeus Mozart', label: '莫扎特' },
    { value: 'Frédéric François Chopin', label: '肖邦' },
    '-',
    { value: 'Johann Baptist Strauss', label: '斯特劳斯', disabled: true }
  ]

  function onLog (name) {
    eventLog.value = name
  }

  function addOption () {
    dynamicArtists.value.push({ value: `Option ${dynamicArtists.value.length + 1}` })
  }
</script>

<style>
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-value {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
