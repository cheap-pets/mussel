<template>
  <demo-page path="basics/icon">
    <demo-section
      title="基础用法"
      note="icon 为内置图标名（installIcons 注册表），如 check、star、search"
      :code="basicCode">
      <mu-icon icon="check" />
      <mu-icon icon="star" />
      <mu-icon icon="search" />
      <mu-icon icon="folder" />
      <mu-icon icon="clock" />
      <mu-icon icon="calendar" />
      <mu-icon icon="file" />
      <mu-icon icon="list" />
    </demo-section>

    <demo-section
      title="尺寸与颜色"
      note="图标大小跟随 font-size（1em），颜色继承 currentColor">
      <mu-icon
        icon="bolt"
        style="font-size: 14px" />
      <mu-icon
        icon="bolt"
        style="font-size: 20px" />
      <mu-icon
        icon="bolt"
        style="font-size: 28px" />
      <mu-icon
        icon="bolt"
        style="color: var(--mu-danger-color)" />
      <mu-icon
        icon="bolt"
        style="color: var(--mu-success-color)" />
    </demo-section>

    <demo-section
      title="动画"
      note="icon 值加 &quot;:spin&quot; 后缀或 animation 属性；hover-* 悬停触发">
      <mu-icon icon="sun:spin" />
      <mu-icon
        icon="star"
        animation="hover-grow" />
      <mu-icon
        icon="check"
        animation="hover-shrink" />
      <mu-icon
        icon="moon"
        animation="hover-rotate-180" />
    </demo-section>

    <demo-section
      title="CSS 类图标"
      note="icon 值以 &quot;.&quot; 开头时作为 CSS 类名解析（多个类以 . 分隔）">
      <mu-icon icon=".demo-icon-cls" />
    </demo-section>

    <demo-section
      title="链接图标"
      note="tag=&quot;a&quot; 渲染为链接元素">
      <mu-icon
        tag="a"
        icon="star"
        style="color: var(--mu-primary-color)" />
      <mu-icon
        tag="a"
        icon="search"
        style="color: var(--mu-primary-color)" />
    </demo-section>

    <demo-section
      title="排序图标"
      note="MuSortIcon 用于表格列头，direction 为 up / down，未设置时双向箭头">
      <mu-sort-icon />
      <mu-sort-icon direction="up" />
      <mu-sort-icon direction="down" />
    </demo-section>

    <demo-section
      title="自定义注册"
      note="installIcons 注册自定义图标，同名覆盖内置注册表">
      <mu-icon icon="demoStar" />
      <mu-icon icon="demoTriangle" />
    </demo-section>

    <demo-section
      title="边界与回归"
      note="未注册图标名与空 icon 值的控制台行为"
      regression
      vertical>
      <div class="demo-icon-row">
        <span>未注册图标名（控制台输出 Invalid icon 警告，渲染为空）：</span>
        <mu-icon icon="notExistsIcon" />
      </div>
      <div class="demo-icon-row">
        <span>空 icon 值（渲染为空 span，不警告）：</span>
        <mu-icon icon="" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { installIcons } from 'mussel'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-icon icon="check" />
<mu-icon icon="sun:spin" />`

  installIcons({
    demoStar:
      '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"/></svg>',
    demoTriangle: {
      svg:
        '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 4l8 14H4z"/></svg>',
      animation: 'hover-shrink'
    }
  })
</script>

<style>
  .demo-icon-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .mu-icon.demo-icon-cls {
    color: var(--mu-danger-color);
    font-size: 24px;
  }

  .mu-icon.demo-icon-cls::before {
    content: '◆';
    display: block;
  }
</style>
