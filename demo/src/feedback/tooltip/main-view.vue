<template>
  <demo-page path="feedback/tooltip">
    <demo-section
      title="基础用法"
      note="mu-tooltip 包裹触发元素，content 为提示文本；悬停显示、移出隐藏"
      :code="basicCode">
      <mu-tooltip content="删除后不可恢复">
        <mu-button color="danger">
          删除
        </mu-button>
      </mu-tooltip>
      <mu-tooltip placement="right" content="右侧提示（主轴空间不足自动翻转）">
        <mu-icon-button icon="info" />
      </mu-tooltip>
    </demo-section>

    <demo-section
      title="弹出方位"
      note="placement 支持 12 个方位（-start / -end 后缀），空间不足自动翻转">
      <div class="demo-placement-grid">
        <mu-tooltip v-for="p in placements" :key="p" :content="`placement: ${p}`" :placement="p">
          <mu-button button-style="outline">
            {{ p }}
          </mu-button>
        </mu-tooltip>
      </div>
    </demo-section>

    <demo-section
      title="触发方式"
      note="trigger 为 hover（默认）/ focus / click；click 触发时外点或 ESC 关闭">
      <mu-tooltip trigger="focus" content="聚焦时显示的提示">
        <mu-input placeholder="focus 触发" style="width: 180px" />
      </mu-tooltip>
      <mu-tooltip trigger="click" content="点击触发的提示（外点 / ESC 关闭）">
        <mu-button>Click Trigger</mu-button>
      </mu-tooltip>
    </demo-section>

    <demo-section
      title="箭头与富文本"
      note="arrow=false 隐藏箭头；#tooltip 插槽支持富文本内容">
      <mu-tooltip :arrow="false" content="无箭头提示">
        <mu-button>无箭头</mu-button>
      </mu-tooltip>
      <mu-tooltip placement="bottom">
        <mu-icon-button icon="question" />
        <template #tooltip>
          支持 <b>富文本</b> 与 <mu-icon icon="info" /> 图标
        </template>
      </mu-tooltip>
    </demo-section>

    <demo-section
      title="v-mu-tooltip 指令"
      note="字符串或对象 value（对象支持 placement 等配置）；点击按钮切换动态 value 验证 diff 更新">
      <mu-button v-mu-tooltip="'字符串指令提示'">
        v-mu-tooltip
      </mu-button>
      <mu-button v-mu-tooltip="{ content: '对象配置 · bottom-end', placement: 'bottom-end' }">
        对象 value
      </mu-button>
      <mu-button v-mu-tooltip="dynamicTip" @click="cycleTip">
        动态 value（点击切换）
      </mu-button>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="长文本自动换行（最大宽 320px）、disabled 控件不触发（已知限制）"
      regression
      vertical>
      <div class="demo-row">
        <mu-tooltip content="长文本换行：提示内容超过最大宽度 320px 时会自动折行，保证在狭小视口内仍然可读。">
          <mu-button>长文本</mu-button>
        </mu-tooltip>
        <mu-button v-mu-tooltip="'disabled 控件不触发（已知限制）'" disabled>
          Disabled
        </mu-button>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-tooltip content="删除后不可恢复">
  <mu-button color="danger">删除</mu-button>
</mu-tooltip>`

  const dynamicTip = ref('动态提示 1')

  const placements = [
    'top-start', 'top', 'top-end',
    'right-start', 'right', 'right-end',
    'bottom-start', 'bottom', 'bottom-end',
    'left-start', 'left', 'left-end'
  ]

  function cycleTip () {
    dynamicTip.value = dynamicTip.value === '动态提示 1'
      ? '动态提示 2（updated 字段 diff 同步，不重播动画）'
      : '动态提示 1'
  }
</script>

<style>
  .demo-placement-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    justify-items: center;
  }

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
</style>
