<template>
  <div class="collapse-page">
    <h2>
      COLLAPSE &amp; COLLAPSE-GROUP
      <theme-switch />
    </h2>

    <div class="group case-basic">
      <h3>1 · standalone 基础（默认插槽 3 根元素，单 item 收敛回归）</h3>
      <mu-collapse title="基础面板">
        <p>第一段内容，用于撑起内容区高度。</p>
        <p>第二段内容，默认插槽多根元素。</p>
        <ul><li>第三根元素（ul）</li></ul>
      </mu-collapse>
    </div>

    <div class="group case-controlled">
      <h3>2 · standalone 受控（v-model:expanded）</h3>
      <div class="flex gap-1x items-center">
        <mu-button @click="standaloneOpen = !standaloneOpen">
          {{ standaloneOpen ? '收起' : '展开' }}
        </mu-button>
        <span class="state-probe">model = {{ standaloneOpen }}</span>
      </div>
      <mu-collapse v-model:expanded="standaloneOpen" title="受控面板">
        展开状态由外部按钮控制。
      </mu-collapse>
    </div>

    <div class="group case-default">
      <h3>3 · standalone defaultExpanded</h3>
      <mu-collapse default-expanded title="默认展开面板">初始即展开。</mu-collapse>
    </div>

    <div class="group case-disabled">
      <h3>4 · standalone disabled</h3>
      <mu-collapse disabled title="禁用面板">点击无效，渲染收拢态。</mu-collapse>
    </div>

    <div class="group case-noarrow">
      <h3>5 · standalone arrow=false</h3>
      <mu-collapse :arrow="false" title="无箭头面板">不渲染箭头。</mu-collapse>
    </div>

    <div class="group case-group-multi">
      <h3>6 · group 默认多开（defaultExpand=all，分割线模型）</h3>
      <mu-collapse-group default-expand="all">
        <mu-collapse id="a" title="面板 A">A 内容。</mu-collapse>
        <mu-collapse id="b" title="面板 B">B 内容。</mu-collapse>
        <mu-collapse id="c" title="面板 C">C 内容。</mu-collapse>
      </mu-collapse-group>
    </div>

    <div class="group case-group-accordion">
      <h3>7 · group accordion 互斥</h3>
      <mu-collapse-group accordion default-expand="first">
        <mu-collapse id="x" title="面板 X">X 内容。</mu-collapse>
        <mu-collapse id="y" title="面板 Y">Y 内容。</mu-collapse>
        <mu-collapse id="z" title="面板 Z">Z 内容。</mu-collapse>
      </mu-collapse-group>
    </div>

    <div class="group case-accordion-ctrl">
      <h3>8 · accordion 初始多 id 收敛（受控，初始 ['b','c']）</h3>
      <div class="flex gap-1x">
        <span class="state-probe">
          model = {{ JSON.stringify(accCtrlList) }}；
          emit 载荷 = {{ JSON.stringify(accEvents) }}
        </span>
      </div>
      <mu-collapse-group v-model:expanded="accCtrlList" accordion @update:expanded="onAccUpdate">
        <mu-collapse id="b" title="面板 B">B 内容。</mu-collapse>
        <mu-collapse id="c" title="面板 C">C 内容。</mu-collapse>
      </mu-collapse-group>
    </div>

    <div class="group case-accordion-all">
      <h3>9 · accordion + defaultExpand=all（dev 警告，降级为 first）</h3>
      <mu-collapse-group accordion default-expand="all">
        <mu-collapse id="m" title="面板 M">M 内容。</mu-collapse>
        <mu-collapse id="n" title="面板 N">N 内容。</mu-collapse>
      </mu-collapse-group>
    </div>

    <div class="group case-group-first">
      <h3>10 · group defaultExpand=first</h3>
      <mu-collapse-group default-expand="first">
        <mu-collapse id="p" title="面板 P">P 内容。</mu-collapse>
        <mu-collapse id="q" title="面板 Q">Q 内容。</mu-collapse>
      </mu-collapse-group>
    </div>

    <div class="group case-prog">
      <h3>11 · group 程序化控制（v-model:expanded）</h3>
      <div class="flex gap-1x">
        <mu-button @click="progList = ['r']">只开 R</mu-button>
        <mu-button @click="progList = ['r', 't']">开 R+T</mu-button>
        <mu-button @click="progList = []">全收</mu-button>
      </div>
      <mu-collapse-group v-model:expanded="progList">
        <mu-collapse id="r" title="面板 R">R 内容。</mu-collapse>
        <mu-collapse id="s" title="面板 S">S 内容。</mu-collapse>
        <mu-collapse id="t" title="面板 T">T 内容。</mu-collapse>
      </mu-collapse-group>
    </div>

    <div class="group case-group-disabled">
      <h3>12 · group disabled（解除后恢复原展开态）</h3>
      <div class="flex gap-1x">
        <mu-button @click="groupDisabled = !groupDisabled">
          group disabled = {{ groupDisabled }}
        </mu-button>
      </div>
      <mu-collapse-group :disabled="groupDisabled" default-expand="first">
        <mu-collapse id="u" title="面板 U">U 内容。</mu-collapse>
        <mu-collapse id="v" title="面板 V">V 内容。</mu-collapse>
      </mu-collapse-group>
    </div>

    <div class="group case-slots-display">
      <h3>13 · #header 写法一：展示型（不绑 click，点击交给容器）</h3>
      <mu-collapse title="被替换的 title">
        <template #header="{ expanded, disabled }">
          <mu-icon :icon="expanded ? 'chevronDown' : 'chevronRight'" />
          <span class="probe">{{ expanded ? 'on' : 'off' }}</span>
          <span>自定义 Header</span>
          <span v-if="disabled">（禁用）</span>
        </template>
        写法一内容。
      </mu-collapse>
    </div>

    <div class="group case-slots-button">
      <h3>14 · #header 写法二：按钮自行控制（@click.stop + toggle）</h3>
      <mu-collapse expand-trigger="custom">
        <template #header="{ expanded, toggle }">
          <span>自定义按钮控制</span>
          <mu-button class="header-toggle-btn" @click.stop="toggle">
            {{ expanded ? '收起' : '展开' }}
          </mu-button>
        </template>
        写法二内容。
      </mu-collapse>
    </div>

    <div class="group case-slots-pa">
      <h3>15 · header-prepend / header-append</h3>
      <mu-collapse title="带前后缀的面板">
        <template #header-prepend="{ expanded }">
          <span class="prepend-probe">{{ expanded ? 'p-on' : 'p-off' }}</span>
        </template>
        <template #header-append>
          <span class="append-mark">append</span>
        </template>
        内容。
      </mu-collapse>
    </div>

    <div class="group case-long-title">
      <h3>16 · 超长 title 截断</h3>
      <mu-collapse class="long-title-panel" :title="longTitle">内容。</mu-collapse>
    </div>

    <div class="group case-header-multiline">
      <h3>17 · #header 多行内容（高度自适应）</h3>
      <mu-collapse>
        <template #header>
          <div>
            <div>第一行标题</div>
            <div class="header-subline">第二行副标题，header 高度随内容增长</div>
          </div>
        </template>
        内容。
      </mu-collapse>
    </div>

    <div class="group case-no-id">
      <h3>18 · group 内未传 id 的两面板（兜底 id 独立开合）</h3>
      <mu-collapse-group>
        <mu-collapse title="无 id 面板 一">一。</mu-collapse>
        <mu-collapse title="无 id 面板 二">二。</mu-collapse>
      </mu-collapse-group>
    </div>

    <div class="group case-header-disabled">
      <h3>19 · disabled 面板自定义 #header（作用域 expanded 与渲染态同源）</h3>
      <mu-collapse disabled>
        <template #header="{ expanded, disabled }">
          <span class="probe-d">expanded={{ expanded }}</span>
          <span>disabled={{ disabled }}</span>
        </template>
        不可见内容。
      </mu-collapse>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  import ThemeSwitch from '../common/theme-switch.vue'

  const standaloneOpen = ref(false)
  const accCtrlList = ref(['b', 'c'])
  const accEvents = ref([])
  const progList = ref([])
  const groupDisabled = ref(true)

  const longTitle = '这是一段非常长的标题文本，用于验证超长标题在头部区域内的省略号截断表现，避免文本撑破或换行破坏布局。'

  function onAccUpdate (payload) {
    accEvents.value = [...accEvents.value, payload]
  }
</script>

<style>
  .collapse-page .state-probe {
    font-size: 12px;
    color: var(--mu-text-color-muted);
  }

  /* 外部容器：边框 + 32px 内边距，演示开放式分割线模型与外部容器文档流的左右对齐 */
  .group > .mu-collapse,
  .group > .mu-collapse-group {
    padding: 16px;
    border: 1px solid var(--mu-border-color-normal);
  }

  /* 面板与控制行在 .group 的 flex-wrap 布局中占满整行 */
  .collapse-page .group > .mu-collapse,
  .collapse-page .group > .mu-collapse-group,
  .collapse-page .group > .flex {
    flex: 1 1 100%;
  }

  .collapse-page .long-title-panel {
    max-width: 360px;
  }
</style>
