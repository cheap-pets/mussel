<template>
  <demo-page path="layout/bar">
    <demo-section
      title="Bar 页头栏"
      note="mu-bar 是通用栏容器，常用于页头/区块头">
      <mu-bar class="demo-bar">
        <strong>Page Title</strong>
        <span class="demo-log">mu-bar 容器</span>
      </mu-bar>
    </demo-section>

    <demo-section
      title="Toolbar 工具栏"
      note="mu-toolbar 组合表单控件与按钮；tool-size 控制内部控件尺寸，default-button-style 设置按钮默认风格">
      <div class="demo-col">
        <mu-toolbar class="demo-toolbar">
          <label>Filter</label>
          <mu-select v-model="filterKey" style="width: 140px;" :options="['title', 'author', 'date']" />
          <mu-search-input v-model="keyword" input-style="solid" style="width: 200px;" placeholder="Search" />
          <mu-flex-space />
          <mu-button caption="New" color="primary" />
          <mu-icon-button icon="dots" />
        </mu-toolbar>
        <mu-toolbar class="demo-toolbar" tool-size="small" default-button-style="text">
          <mu-button caption="Small Text" />
          <mu-button caption="Buttons" />
          <mu-flex-divider />
          <mu-icon-button icon="search" />
        </mu-toolbar>
      </div>
    </demo-section>

    <demo-section
      title="ScrollArea 横向滚动"
      note="内容溢出时两端出现滚动箭头；轻点位移一步，按住连续滚动，到边界自动停">
      <mu-scroll-area class="demo-scroll-area">
        <div v-for="i in 20" :key="i" class="demo-chip">
          item {{ i }}
        </div>
      </mu-scroll-area>
    </demo-section>

    <demo-section
      title="ScrollArea 纵向滚动"
      note="vertical 属性切换为纵向，滚动箭头出现在上下两端">
      <mu-scroll-area vertical class="demo-scroll-area demo-scroll-area--vertical">
        <div v-for="i in 20" :key="i" class="demo-chip demo-chip--wide">
          row {{ i }}
        </div>
      </mu-scroll-area>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="工具栏内 dropdown-anchor=&quot;$parent&quot; 时菜单锚定到工具栏整行而非按钮本身；内容不溢出时不显示滚动箭头">
      <div class="demo-col">
        <mu-toolbar class="demo-toolbar">
          <mu-search-input class="flex-1 mu-input--inset" placeholder="flex-1 撑满剩余空间" />
          <mu-flex-divider />
          <mu-dropdown-button
            class="mu-icon-button"
            button-style="link"
            dropdown-icon="folder"
            dropdown-anchor="$parent"
            :dropdown-items="artists" />
        </mu-toolbar>
        <mu-scroll-area class="demo-scroll-area" style="width: 160px;">
          <div class="demo-chip">
            short
          </div>
        </mu-scroll-area>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const filterKey = ref('title')
  const keyword = ref('')

  const artists = [
    { is: '-', label: 'GROUP 1' },
    { label: 'Ludwig van Beethoven', action: 'A' },
    { label: 'Wolfgang Amadeus Mozart', action: 'B' }
  ]
</script>

<style>
  .demo-col {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .demo-bar {
    align-items: center;
    gap: 12px;
  }

  .demo-toolbar {
    align-items: center;
    gap: 8px;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .demo-scroll-area {
    max-width: 100%;
    border: 1px dashed var(--mu-border-color);
    border-radius: 4px;
    padding: 4px;
  }

  .demo-scroll-area--vertical {
    height: 160px;
    width: 280px;
  }

  .demo-chip {
    flex: none;
    margin: 4px;
    padding: 8px 16px;
    border-radius: 4px;
    background: var(--mu-bg-strong);
    border: 1px solid var(--mu-border-color);
    white-space: nowrap;
  }

  .demo-chip--wide {
    display: block;
    width: 100%;
    text-align: center;
  }
</style>
