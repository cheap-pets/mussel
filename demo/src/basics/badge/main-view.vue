<template>
  <demo-page path="basics/badge">
    <demo-section
      title="Badge 基础用法"
      note="MuBadge 组件，默认灰底白字"
      :code="basicCode">
      <mu-badge>Default</mu-badge>
      <mu-badge primary>
        Primary
      </mu-badge>
    </demo-section>

    <demo-section
      title="Badge 色彩"
      note="primary / secondary / success / warning / danger 属性">
      <mu-badge>Default</mu-badge>
      <mu-badge primary>
        Primary
      </mu-badge>
      <mu-badge secondary>
        Secondary
      </mu-badge>
      <mu-badge success>
        Success
      </mu-badge>
      <mu-badge warning>
        Warning
      </mu-badge>
      <mu-badge danger>
        Danger
      </mu-badge>
    </demo-section>

    <demo-section
      title="圆点徽标"
      note="内容为空时收缩为圆点（默认 danger 色），用于消息提醒">
      <mu-button>
        消息<mu-badge>6</mu-badge>
      </mu-button>
      <mu-button>
        通知<mu-badge />
      </mu-button>
    </demo-section>

    <demo-section
      title="Tag 基础用法"
      note="MuTag 组件，默认灰底描边；color 走 tones（faint 淡底 / solid 实底）；pill 全圆角、flat 去描边">
      <mu-tag>Default</mu-tag>
      <mu-tag color="success">
        Success
      </mu-tag>
      <mu-tag
        color="success"
        faint>
        Success faint
      </mu-tag>
      <mu-tag
        color="pink"
        pill>
        Pink pill
      </mu-tag>
      <mu-tag flat>
        Flat
      </mu-tag>
    </demo-section>

    <demo-section
      title="Tags 基础用法"
      note="MuTags 组件，tags 为 { label, title? } 数组，title 为悬停提示">
      <mu-tags :tags="tags" />
    </demo-section>

    <demo-section
      title="数量上限与展开"
      note="max 限制显示数量，超出部分收进 &quot;+N&quot; 下拉；expandable 控制是否可展开">
      <mu-tags
        :tags="tags"
        :max="2"
        expandable />
      <mu-tags
        :tags="tags"
        :max="2" />
    </demo-section>

    <demo-section
      title="可删除标签"
      note="removable 显示删除图标，tagRemove 事件交由外部更新数据">
      <mu-tags
        :tags="removableTags"
        removable
        @tag-remove="onRemove" />
      <span
        v-if="!removableTags.length"
        class="demo-tags-empty">已全部删除</span>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="空数据与单项数据"
      regression
      vertical>
      <div class="demo-tags-row">
        <span>空 tags 数组：</span>
        <mu-tags :tags="[]" />
      </div>
      <div class="demo-tags-row">
        <span>单项 tags + max=1：</span>
        <mu-tags
          :tags="[tags[0]]"
          :max="1"
          expandable />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-badge>Default</mu-badge>
<mu-badge primary>Primary</mu-badge>`

  const tags = ref([
    { label: 'Vue' },
    { label: 'React' },
    { label: 'Angular', title: '已停止维护' },
    { label: 'Svelte' },
    { label: 'Solid' }
  ])

  const removableTags = ref([
    { label: '待办' },
    { label: '进行中' },
    { label: '已完成' }
  ])

  function onRemove (tag) {
    removableTags.value = removableTags.value.filter(t => t !== tag)
  }
</script>

<style>
  .demo-tags-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .demo-tags-empty {
    color: var(--mu-text-color-muted);
  }
</style>
