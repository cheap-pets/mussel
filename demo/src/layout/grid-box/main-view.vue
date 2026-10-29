<template>
  <demo-page path="layout/grid-box">
    <demo-section
      title="基础用法"
      note="mu-grid-box 用 columns / rows 划分等分轨道，mu-grid-cell 用 col-start / col-end / row-start / row-end 指定占据区间（end 为末轨道号，含端点）"
      :code="basicCode">
      <mu-grid-box class="demo-grid" :columns="4" :rows="2">
        <mu-grid-cell class="demo-cell">
          1
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          2
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          3
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          4
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          5
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          6
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          7
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          8
        </mu-grid-cell>
      </mu-grid-box>
    </demo-section>

    <demo-section
      title="跨行跨列"
      note="col-span / row-span 指定跨越数；span 与 end 同时设置时 span 优先">
      <mu-grid-box class="demo-grid" :columns="4" :rows="3">
        <mu-grid-cell class="demo-cell" :col-span="2">
          col-span 2
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          2
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          3
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell" :row-span="2">
          row-span 2
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          5
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          6
        </mu-grid-cell>
        <mu-grid-cell class="demo-cell">
          7
        </mu-grid-cell>
      </mu-grid-box>
    </demo-section>

    <demo-section
      title="auto 轨道"
      note="columns / rows 传 auto 时按内容自动扩展轨道，容器超出的部分产生滚动">
      <div class="demo-row">
        <mu-button :caption="autoExpanded ? '恢复固定轨道' : '切换 auto 轨道'" @click="autoExpanded = !autoExpanded" />
      </div>
      <mu-grid-box
        class="demo-grid demo-mt"
        :columns="autoExpanded ? 'auto' : 3"
        :rows="2">
        <mu-grid-cell v-for="i in 6" :key="i" class="demo-cell">
          {{ autoExpanded ? `auto ${i}` : i }}
        </mu-grid-cell>
      </mu-grid-box>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="不规则合并布局（跨行跨列组合，原 grid-layout 页配置）；单元格同时指定 start/end 与 span 时不产生轨道冲突">
      <mu-grid-box class="demo-grid demo-grid--case" :columns="7" :rows="5">
        <mu-grid-cell
          v-for="(cell, idx) in caseCells"
          :key="idx"
          class="demo-cell"
          :col-start="cell.colStart" :col-end="cell.colEnd"
          :row-start="cell.rowStart" :row-end="cell.rowEnd">
          {{ idx + 1 }}
        </mu-grid-cell>
      </mu-grid-box>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-grid-box :columns="4" :rows="2">
  <mu-grid-cell>1</mu-grid-cell>
  <mu-grid-cell :col-span="2">2</mu-grid-cell>
  <mu-grid-cell>3</mu-grid-cell>
  ...
</mu-grid-box>`

  const autoExpanded = ref(false)

  const caseCells = [
    { colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 2 },
    { colStart: 3, colEnd: 7, rowStart: 1, rowEnd: 2 },
    { colStart: 1, colEnd: 2, rowStart: 3, rowEnd: 5 },
    { colStart: 3, colEnd: 5, rowStart: 3, rowEnd: 5 },
    { colStart: 6, colEnd: 7, rowStart: 3, rowEnd: 5 }
  ]
</script>

<style>
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-mt {
    margin-top: 12px;
  }

  .demo-grid {
    height: 240px;
    border: 1px dashed var(--mu-border-color);
    border-radius: 4px;
    padding: 8px;
  }

  .demo-grid--case {
    max-width: 480px;
  }

  .demo-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 4px;
    border-radius: 4px;
    background: var(--mu-primary-color);
    color: var(--mu-text-color-inverse, #fff);
  }
</style>
