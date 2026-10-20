<template>
  <demo-page path="buttons/button">
    <demo-section
      title="基础用法"
      note="点击按钮触发 click 事件"
      :code="basicCode">
      <mu-button>确定</mu-button>
      <mu-button color="primary">
        主要操作
      </mu-button>
    </demo-section>

    <demo-section
      title="色彩"
      note="color 为 normal / primary / secondary / danger，均支持 active 与 disabled 状态">
      <div
        v-for="color in colorList"
        :key="color"
        class="demo-button-row">
        <mu-button :color="color">
          {{ color.toUpperCase() }}
        </mu-button>
        <mu-button
          :color="color"
          active>
          ACTIVE
        </mu-button>
        <mu-button
          :color="color"
          disabled>
          DISABLED
        </mu-button>
      </div>
    </demo-section>

    <demo-section
      title="outline 风格"
      note="button-style=&quot;outline&quot;，同色彩矩阵">
      <div
        v-for="color in colorList"
        :key="color"
        class="demo-button-row">
        <mu-button
          button-style="outline"
          :color="color">
          {{ color.toUpperCase() }}
        </mu-button>
        <mu-button
          button-style="outline"
          :color="color"
          active>
          ACTIVE
        </mu-button>
        <mu-button
          button-style="outline"
          :color="color"
          disabled>
          DISABLED
        </mu-button>
      </div>
    </demo-section>

    <demo-section
      title="text 风格"
      note="button-style=&quot;text&quot;，无边框填充，同色彩矩阵">
      <div
        v-for="color in colorList"
        :key="color"
        class="demo-button-row">
        <mu-button
          button-style="text"
          :color="color">
          {{ color.toUpperCase() }}
        </mu-button>
        <mu-button
          button-style="text"
          :color="color"
          active>
          ACTIVE
        </mu-button>
        <mu-button
          button-style="text"
          :color="color"
          disabled>
          DISABLED
        </mu-button>
      </div>
    </demo-section>

    <demo-section
      title="link 风格"
      note="button-style=&quot;link&quot;，链接形态按钮">
      <div
        v-for="color in colorList"
        :key="color"
        class="demo-button-row demo-button-row--framed">
        <mu-button
          button-style="link"
          :color="color">
          {{ color.toUpperCase() }}
        </mu-button>
        <mu-button
          button-style="link"
          :color="color"
          active>
          ACTIVE
        </mu-button>
        <mu-button
          button-style="link"
          :color="color"
          disabled>
          DISABLED
        </mu-button>
      </div>
    </demo-section>

    <demo-section
      title="尺寸"
      note="size 为 small / large，pill 为胶囊形">
      <mu-button
        size="small"
        caption="SMALL" />
      <mu-button
        size="small"
        color="primary"
        pill
        caption="SMALL" />
      <mu-button caption="NORMAL" />
      <mu-button
        color="primary"
        pill
        caption="NORMAL" />
      <mu-button
        size="large"
        caption="LARGE" />
      <mu-button
        size="large"
        color="primary"
        pill
        caption="LARGE" />
    </demo-section>

    <demo-section
      title="图标与文字"
      note="icon 指定图标名，可加 &quot;:spin&quot; 动画后缀；caption 设置文字">
      <mu-button
        class="mu-icon-button"
        icon="bolt" />
      <mu-button
        icon="loading:spin"
        color="primary"
        caption="Loading" />
      <mu-button
        icon="file"
        color="secondary"
        caption="中文" />
      <mu-button
        icon="check"
        color="danger"
        caption="中文 ENGLISH" />
    </demo-section>

    <demo-section
      title="按钮内徽标"
      note="mu-badge 样式类嵌在按钮内容中使用">
      <mu-button>
        badge<span class="mu-badge">Default</span>
      </mu-button>
      <mu-button>
        badge<span class="mu-badge" primary>Primary</span>
      </mu-button>
      <mu-button>
        badge<span class="mu-badge" secondary>SECONDARY</span>
      </mu-button>
      <mu-button>
        badge<span class="mu-badge" warning>Warning</span>
      </mu-button>
      <mu-button>
        badge<span class="mu-badge" danger>Danger</span>
      </mu-button>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-button>确定</mu-button>
<mu-button color="primary">主要操作</mu-button>`

  const colorList = ['normal', 'primary', 'secondary', 'danger']
</script>

<style>
  .demo-button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .demo-button-row--framed {
    gap: 16px;
    padding: 8px;
    border: 1px dashed var(--mu-border-color-soft);
    border-radius: var(--mu-radius-panel);
  }
</style>
