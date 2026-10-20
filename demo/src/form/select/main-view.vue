<template>
  <demo-page path="form/select">
    <demo-section
      title="基础用法"
      note="options 数组渲染下拉项；分组项用 { is: '-' } 或字符串 '-'"
      :code="basicCode">
      <mu-select
        v-model="picked"
        placeholder="select an artist"
        style="width: 280px"
        :options="artists" />
      <span class="demo-value">值：{{ JSON.stringify(picked) }}</span>
    </demo-section>

    <demo-section
      title="受控属性"
      note="prefix 前缀文本、dropdown-width 面板宽度、disabled 禁用">
      <mu-select
        v-model="picked"
        prefix="Artist:"
        dropdown-width="auto"
        placeholder="with prefix"
        style="width: 280px"
        :options="artists" />
      <mu-select
        v-model="picked"
        disabled
        placeholder="disabled"
        style="width: 280px"
        :options="artists" />
    </demo-section>

    <demo-section
      title="自定义下拉面板"
      note="#dropdown 插槽自组内容：搜索框 + 滚动列表 + mu-option"
      vertical>
      <mu-select
        v-model="searchPicked"
        placeholder="search & select"
        dropdown-class="combo-search-panel flex flex-col gap-half"
        :dropdown-scrollbar="false">
        <template #dropdown>
          <mu-search-input
            v-model="searchKey"
            class="flex-none"
            input-style="solid"
            style="width: 100%" />
          <mu-scroll-box class="flex-auto">
            <mu-option
              v-for="el in filteredItems"
              :key="el"
              :value="el" />
          </mu-scroll-box>
        </template>
      </mu-select>
      <mu-select
        v-model="headerPicked"
        placeholder="search & select (dropdown-header slot)"
        :options="headerFilteredItems">
        <template #dropdown-header>
          <mu-search-input
            v-model="headerSearchKey"
            input-style="solid"
            class="mb-half"
            style="width: 100%" />
        </template>
      </mu-select>
    </demo-section>

    <demo-section
      title="MultiSelect 多选"
      note="v-model 为数组；tag 显示已选项">
      <mu-multi-select
        v-model="multiPicked"
        :options="artists"
        style="width: 420px"
        placeholder="select artists" />
      <span class="demo-value">值：{{ JSON.stringify(multiPicked) }}</span>
    </demo-section>

    <demo-section
      title="MultiSelect 标签定制"
      note="max-tags 限制标签数、tag-shrink 超出收缩、tag-tooltip 提示全文、value-mode 复合对象值">
      <mu-multi-select
        v-model="compositePicked"
        :options="artists"
        :max-tags="2"
        :tag-shrink="true"
        :tag-tooltip="true"
        value-mode="composite"
        style="width: 420px"
        nowrap
        placeholder="select an artist" />
      <span class="demo-value">值：{{ JSON.stringify(compositePicked) }}</span>
    </demo-section>

    <demo-section
      title="value-mode 与 label 映射"
      note="composite 模式下值为 { value, label } 对象；label 与 value 可不同">
      <mu-select
        v-model="cnPicked"
        dropdown-width="600px"
        style="width: 280px"
        :options="artistsCn"
        placeholder="composite select" />
      <span class="demo-value">值：{{ JSON.stringify(cnPicked) }}</span>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="空 options、含禁用项、清空"
      regression
      vertical>
      <div class="demo-row">
        <span>空 options：</span>
        <mu-select
          v-model="emptyPicked"
          style="width: 240px"
          placeholder="no options"
          :options="[]" />
      </div>
      <div class="demo-row">
        <span>禁用项不可选（肖邦）：</span>
        <mu-select
          v-model="disabledPicked"
          style="width: 240px"
          :options="artists"
          placeholder="disabled option" />
      </div>
      <div class="demo-row">
        <span>选择后可清空（clearable）：</span>
        <mu-select
          v-model="clearablePicked"
          style="width: 240px"
          :options="artists" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-select
  v-model="picked"
  placeholder="select an artist"
  :options="[
    { is: '-', label: 'GROUP 1' },
    { value: 'Ludwig van Beethoven' },
    { value: 'Mozart', disabled: true }
  ]" />`

  const picked = ref()
  const searchPicked = ref()
  const headerPicked = ref()
  const multiPicked = ref([])
  const compositePicked = ref([{ value: 'Ludwig van Beethoven' }])
  const cnPicked = ref()
  const emptyPicked = ref()
  const disabledPicked = ref()
  const clearablePicked = ref()

  const artists = [
    { is: '-', label: 'GROUP 1' },
    { value: 'Ludwig van Beethoven' },
    { value: 'Wolfgang Amadeus Mozart' },
    { value: 'Frédéric François Chopin', disabled: true },
    { is: '-', label: 'GROUP 2' },
    { value: 'Johann Baptist Strauss' }
  ]

  const artistsCn = [
    { value: 'beethoven', label: '贝多芬' },
    { value: 'mozart', label: '莫扎特' },
    { value: 'chopin', label: '肖邦' }
  ]

  const searchKey = ref('')
  const items = new Array(50).fill(0).map((el, idx) => `items${idx}`)

  const filteredItems = computed(() =>
    items.filter(item => !searchKey.value || item.includes(searchKey.value))
  )

  const headerSearchKey = ref('')

  const headerFilteredItems = computed(() =>
    items.filter(item => !headerSearchKey.value || item.includes(headerSearchKey.value))
  )
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

  .combo-search-panel {
    width: 300px;
    max-height: 240px;
  }
</style>
