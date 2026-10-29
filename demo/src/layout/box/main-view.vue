<template>
  <demo-page path="layout/box">
    <demo-section
      title="基础用法"
      note="mu-h-box 横向排列子元素，gap 属性控制间距"
      :code="basicCode">
      <div class="demo-palette-wrap">
        <mu-h-box gap="1x">
          <div class="demo-block">
            1
          </div>
          <div class="demo-block">
            2
          </div>
          <div class="demo-block">
            3
          </div>
        </mu-h-box>
      </div>
    </demo-section>

    <demo-section
      title="纵向排列"
      note="mu-v-box 纵向排列；flex-center 同时居中对齐主轴与交叉轴">
      <div class="demo-palette-wrap" style="height: 160px;">
        <mu-v-box gap="half" style="height: 100%;">
          <div class="demo-block">
            1
          </div>
          <div class="demo-block">
            2
          </div>
          <div class="demo-block">
            3
          </div>
        </mu-v-box>
      </div>
    </demo-section>

    <demo-section
      title="布局属性"
      note="gap 间距、flex-wrap 换行、flex-center 居中、align-items / justify-content 对齐、inline 行内、flex-reverse 反向">
      <div class="demo-col">
        <mu-h-box gap="half" flex-wrap style="width: 320px;">
          <div v-for="i in 8" :key="i" class="demo-block demo-block--sm">
            {{ i }}
          </div>
        </mu-h-box>
        <div class="demo-palette-wrap" style="height: 120px;">
          <mu-h-box flex-center class="w-full h-full">
            <div class="demo-block">
              center
            </div>
          </mu-h-box>
        </div>
        <mu-h-box align-items="end" justify-content="space-between">
          <div class="demo-block demo-block--sm">
            start
          </div>
          <div class="demo-block demo-block--sm">
            end
          </div>
        </mu-h-box>
        <mu-h-box flex-reverse gap="half">
          <div class="demo-block demo-block--sm">
            1
          </div>
          <div class="demo-block demo-block--sm">
            2
          </div>
          <div class="demo-block demo-block--sm">
            3
          </div>
        </mu-h-box>
        <div>
          <mu-h-box inline gap="half" class="demo-inline-box">
            <div class="demo-block demo-block--sm">
              inline
            </div>
          </mu-h-box>
          <span class="demo-log">（inline 盒与文本同行）</span>
        </div>
      </div>
    </demo-section>

    <demo-section
      title="辅助组件"
      note="flex-divider 分隔线占满交叉轴；flex-space 弹性占位把后续元素推向另一端；flex-break 在换行容器中强制换行">
      <div class="demo-col">
        <mu-h-box class="demo-toolbar-like">
          <span>Label</span>
          <mu-flex-divider />
          <span>Divider</span>
        </mu-h-box>
        <mu-h-box class="demo-toolbar-like">
          <span>Left</span>
          <mu-flex-space />
          <span>Right</span>
        </mu-h-box>
        <mu-h-box gap="1x" flex-wrap style="width: 280px;">
          <div class="demo-block demo-block--sm">
            1
          </div>
          <div class="demo-block demo-block--sm">
            2
          </div>
          <mu-flex-break />
          <div class="demo-block demo-block--sm">
            3
          </div>
          <div class="demo-block demo-block--sm">
            4
          </div>
        </mu-h-box>
      </div>
    </demo-section>

    <demo-section
      title="flex 原子类"
      note="flex / flex-col / gap-* / items-* / justify-* / flex-1 等原子类可直接用于普通元素，与组件生成相同类名">
      <div class="demo-col">
        <div class="flex flex-col gap-half">
          <div class="demo-block demo-block--sm">
            flex-col
          </div>
          <div class="demo-block demo-block--sm">
            gap-half
          </div>
        </div>
        <div class="flex items-center gap-1x">
          <div class="demo-block demo-block--sm">
            A
          </div>
          <div class="demo-block demo-block--sm">
            B
          </div>
          <span class="demo-log">items-center + gap-1x</span>
        </div>
        <div class="flex" style="height: 80px;">
          <div class="demo-block demo-block--sm flex-none" style="width: 80px;">
            fixed
          </div>
          <div class="demo-block demo-block--sm flex-1">
            flex-1
          </div>
        </div>
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="header / content / footer 经典结构：固定头尾 + flex-1 内容区自适应，内容超出时内部滚动">
      <div class="demo-frame flex flex-col">
        <div class="flex-none px-2x py-1x border-b border-soft">
          header
        </div>
        <div class="flex-1 p-2x" style="overflow: auto;">
          <p v-for="i in 20" :key="i">
            line {{ i }}
          </p>
        </div>
        <div class="flex-none px-2x py-1x border-t border-soft">
          footer
        </div>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-h-box gap="1x">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</mu-h-box>`
</script>

<style>
  .demo-col {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .demo-palette-wrap {
    display: flex;
    border: 1px dashed var(--mu-border-color);
    border-radius: 4px;
    padding: 8px;
  }

  .demo-block {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    min-height: 48px;
    padding: 8px 12px;
    border-radius: 4px;
    background: var(--mu-primary-color);
    color: var(--mu-text-color-inverse, #fff);
  }

  .demo-block--sm {
    min-width: 48px;
    min-height: 36px;
  }

  .demo-toolbar-like {
    align-items: center;
    border: 1px dashed var(--mu-border-color);
    border-radius: 4px;
    padding: 8px 12px;
  }

  .demo-inline-box {
    vertical-align: middle;
  }

  .demo-frame {
    height: 240px;
    border: 1px solid var(--mu-border-color);
    border-radius: 4px;
    overflow: hidden;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
