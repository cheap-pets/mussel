<template>
  <demo-page path="data/list">
    <demo-section
      title="基础用法"
      note="mu-list-item 渲染列表项（icon + label）；mu-list-divider 渲染分组标题或分隔线；MuList 未导出，列表容器用普通元素组织"
      :code="basicCode"
      vertical>
      <div class="demo-list">
        <mu-list-divider label="分组一" />
        <mu-list-item icon="file" label="文件一" @click="onPick('文件一')" />
        <mu-list-item icon="file" label="文件二" @click="onPick('文件二')" />
        <mu-list-divider label="分组二" />
        <mu-list-item icon="folder" label="文件夹" @click="onPick('文件夹')" />
        <span class="demo-log">最近点击：{{ picked }}</span>
      </div>
    </demo-section>

    <demo-section
      title="链接形态"
      note="tag 为 a 时渲染为链接（默认 div 行为，配合 href 由业务自行处理）"
      vertical>
      <div class="demo-list">
        <mu-list-item tag="a" icon="search" label="外部链接" href="https://example.com" target="_blank" />
        <mu-list-item icon="info" label="普通条目" />
      </div>
    </demo-section>

    <demo-section
      title="纯分隔线"
      note="divider 不传 label 时仅渲染一条分隔线"
      vertical>
      <div class="demo-list">
        <mu-list-item icon="star" label="收藏一" />
        <mu-list-divider />
        <mu-list-item icon="star" label="收藏二" />
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="仅图标、仅 label 为空、超长文本截断"
      regression
      vertical>
      <div class="demo-list">
        <mu-list-item icon="star" />
        <mu-list-item label="" />
        <mu-list-item class="demo-list-item--long" :label="longLabel" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-list-item icon="file" label="文件一" />
<mu-list-divider label="分组" />`

  const picked = ref('无')
  const longLabel = '这是一条非常长的列表项文本，用于验证超出容器宽度时的省略号截断表现。'

  function onPick (name) {
    picked.value = name
  }
</script>

<style>
  .demo-list {
    width: 320px;
    max-width: 100%;
    border: 1px solid var(--mu-border-color-soft);
  }

  .demo-list-item--long :deep(label),
  .demo-list-item--long label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .demo-log {
    display: block;
    padding: 4px 8px;
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
