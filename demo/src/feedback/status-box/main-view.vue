<template>
  <demo-page path="feedback/status-box">
    <demo-section
      title="基础用法"
      note="icon / title / message 组成状态块；width / height 控制尺寸（数字或字符串）；默认插槽放操作按钮"
      :code="basicCode">
      <mu-status-box
        class="mu-bg-strong border border-dashed radius-panel"
        width="500"
        height="300"
        icon="bolt"
        title="CAUTION !"
        message="Something Wrong Here !">
        <mu-button caption="Do Something ..." round />
      </mu-status-box>
    </demo-section>

    <demo-section
      title="图标位置"
      note="icon-position 为 center（默认）/ left，left 时图标与文本水平排列">
      <mu-status-box
        class="mu-bg-strong border border-dashed radius-panel"
        width="500"
        height="240"
        icon="bolt"
        icon-position="left"
        title="CAUTION !"
        message="Something Wrong Here !">
        <mu-button caption="Do Something ..." round />
      </mu-status-box>
    </demo-section>

    <demo-section
      title="自定义图标与布局"
      note="#icon 插槽替换默认图标；插槽内容配合原子类自由布局（mt-auto 底部操作行）">
      <mu-status-box
        class="mu-bg-strong border border-dashed radius-panel"
        width="500"
        height="400"
        title="NOT FOUND !"
        message="Something Wrong Here ! Something Wrong Here ! Something Wrong Here ! Something Wrong Here !">
        <template #icon>
          <div class="demo-big-icon">
            !
          </div>
        </template>
        <div class="flex mt-auto self-stretch">
          <mu-button caption="Create New ..." round color="primary" />
          <span class="flex-1" />
          <mu-button caption="Dismiss" round />
        </div>
      </mu-status-box>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="无 icon 无插槽、超长 title/message、小尺寸容器"
      regression
      vertical>
      <div class="demo-row">
        <mu-status-box
          class="mu-bg-strong border border-dashed radius-panel"
          width="360"
          height="200"
          title="EMPTY" />
        <mu-status-box
          class="mu-bg-strong border border-dashed radius-panel"
          width="360"
          height="200"
          icon="alert"
          :title="longTitle"
          :message="longMessage" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-status-box
  icon="bolt"
  title="CAUTION !"
  message="Something Wrong Here !">
  <mu-button caption="Retry" round />
</mu-status-box>`

  const longTitle = '这是一个非常非常长的标题文本，用于验证超长标题在状态块内的截断与换行表现'
  const longMessage = '这是超长的消息内容。'.repeat(12)
</script>

<style>
  .demo-big-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 64px;
    height: 64px;
    border-radius: 50%;

    font-size: 32px;
    color: white;

    background: var(--mu-warning-color);
  }

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
  }
</style>
