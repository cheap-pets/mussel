<template>
  <demo-page path="layout/scrollbar">
    <demo-section
      title="v-mu-scrollbar 指令"
      note="指令方式为任意容器挂自定义滚动条；scrollbar-visible=&quot;always&quot; 常显滚动条；内容 3000×30000，可横向/纵向滚动"
      :code="basicCode"
      vertical>
      <div v-mu-scrollbar class="demo-scroll-container" scrollbar-visible="always">
        <div class="demo-scroll-element" />
      </div>
    </demo-section>

    <demo-section
      title="程序化滚动"
      note="点击按钮修改内容尺寸或容器 scrollTop，滚动条与位置同步更新">
      <div class="demo-row">
        <mu-button caption="Reset Height" @click="resetHeight" />
        <mu-button caption="Set ScrollTop" @click="setScrollTop" />
      </div>
      <div
        v-mu-scrollbar
        class="demo-scroll-container demo-scroll-container--tall demo-mt"
        scrollbar-visible="always">
        <div class="demo-scroll-element--tall" />
      </div>
    </demo-section>

    <demo-section
      title="ScrollBox 组件"
      note="mu-scroll-box 开箱即用的滚动容器，默认显示自定义滚动条">
      <mu-scroll-box class="demo-scroll-container">
        <div class="demo-scroll-element demo-scroll-element--plain" />
      </mu-scroll-box>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="超大内容 + sticky 元素：滚动时左右两条红色参考带保持可见、顶部蓝色条吸顶，滚动条拖动流畅无跳动">
      <mu-scroll-box class="demo-scroll-container demo-scroll-container--bordered">
        <div style="position: sticky; left: 0; right: 0; top: 0;">
          <div
            class="demo-sticky demo-sticky--top">
            sticky top
          </div>
          <div class="demo-sticky demo-sticky--left">left</div>
          <div class="demo-sticky demo-sticky--right">right</div>
        </div>
        <div class="demo-scroll-element--huge">huge content</div>
      </mu-scroll-box>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<div v-mu-scrollbar class="container" scrollbar-visible="always">
  <div class="content" />
</div>`

  function resetHeight () {
    const el = document.querySelector('.demo-scroll-element--tall')
    if (el) {
      el.style.height = '1000px'
      el.style.width = '100px'
    }
  }

  function setScrollTop () {
    const el = document.querySelector('.demo-scroll-container--tall')
    if (el) {
      el.scrollTop = el.scrollTop + 500
    }
  }
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

  .demo-scroll-container {
    will-change: scroll-position;
    position: relative;
    width: 100%;
    max-width: 640px;
    height: 320px;
    overflow: auto;
  }

  .demo-scroll-container--bordered {
    border: 1px solid var(--mu-border-color);
    border-radius: 4px;
  }

  .demo-scroll-element {
    width: 3000px;
    height: 30000px;
    background-image: linear-gradient(45deg, var(--mu-warning-color, yellow), var(--mu-danger-color, red), var(--mu-warning-color, yellow));
  }

  .demo-scroll-element--tall {
    width: 2000px;
    height: 5000px;
    background-image: linear-gradient(45deg, var(--mu-success-color, green), var(--mu-primary-color, blue));
  }

  .demo-scroll-element--plain {
    width: 2000px;
    height: 2000px;
    background-image: linear-gradient(45deg, var(--mu-bg-strong), var(--mu-border-color));
  }

  .demo-scroll-element--huge {
    height: 5000px;
    width: 2000px;
    margin: 0 150px;
    background: var(--mu-bg-strong);
  }

  .demo-sticky {
    position: absolute;
    border: 1px solid var(--mu-border-color);
    color: var(--mu-text-color-inverse, #fff);
  }

  .demo-sticky--top {
    background: var(--mu-primary-color, blue);
    left: 0;
    right: 0;
    top: 0;
    height: 40px;
  }

  .demo-sticky--left {
    background: var(--mu-danger-color, red);
    left: 0;
    width: 150px;
    height: 2000px;
  }

  .demo-sticky--right {
    background: var(--mu-danger-color, red);
    right: 0;
    width: 150px;
    height: 2000px;
  }
</style>
