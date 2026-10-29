<template>
  <demo-page path="data/collapse">
    <demo-section
      title="基础用法"
      note="title 定义标题，默认插槽放内容（支持多根元素）；default-expanded 初始展开"
      :code="basicCode"
      vertical>
      <mu-collapse class="demo-collapse" title="基础面板">
        <p>第一段内容，用于撑起内容区高度。</p>
        <p>第二段内容，默认插槽多根元素。</p>
        <ul><li>第三根元素（ul）</li></ul>
      </mu-collapse>
      <mu-collapse class="demo-collapse" default-expanded title="默认展开面板">
        初始即展开。
      </mu-collapse>
    </demo-section>

    <demo-section
      title="状态控制"
      note="v-model:expanded 受控展开；disabled 禁用点击；arrow=false 不渲染箭头"
      vertical>
      <div class="demo-row">
        <mu-button @click="standaloneOpen = !standaloneOpen">
          {{ standaloneOpen ? '收起' : '展开' }}
        </mu-button>
        <span class="demo-log">model = {{ standaloneOpen }}</span>
      </div>
      <mu-collapse v-model:expanded="standaloneOpen" class="demo-collapse" title="受控面板">
        展开状态由外部按钮控制。
      </mu-collapse>
      <mu-collapse disabled class="demo-collapse" title="禁用面板">
        点击无效，渲染收拢态。
      </mu-collapse>
      <mu-collapse :arrow="false" class="demo-collapse" title="无箭头面板">
        不渲染箭头。
      </mu-collapse>
    </demo-section>

    <demo-section
      title="CollapseGroup 面板组"
      note="default-expand 为 all（默认多开）/ first（仅第一个）；accordion 手风琴互斥；面板用 id 标识"
      vertical>
      <mu-collapse-group class="demo-collapse" default-expand="all">
        <mu-collapse id="a" title="面板 A">
          A 内容。
        </mu-collapse>
        <mu-collapse id="b" title="面板 B">
          B 内容。
        </mu-collapse>
        <mu-collapse id="c" title="面板 C">
          C 内容。
        </mu-collapse>
      </mu-collapse-group>
      <mu-collapse-group class="demo-collapse" accordion default-expand="first">
        <mu-collapse id="x" title="面板 X">
          X 内容。
        </mu-collapse>
        <mu-collapse id="y" title="面板 Y">
          Y 内容。
        </mu-collapse>
        <mu-collapse id="z" title="面板 Z">
          Z 内容。
        </mu-collapse>
      </mu-collapse-group>
    </demo-section>

    <demo-section
      title="程序化控制"
      note="v-model:expanded 绑定 id 数组；group disabled 时整组不可操作，解除后恢复原展开态"
      vertical>
      <div class="demo-row">
        <mu-button caption="只开 R" @click="progList = ['r']" />
        <mu-button caption="开 R+T" @click="progList = ['r', 't']" />
        <mu-button caption="全收" @click="progList = []" />
        <mu-button caption="切换整组禁用" @click="groupDisabled = !groupDisabled" />
        <span class="demo-log">model = {{ JSON.stringify(progList) }}；disabled = {{ groupDisabled }}</span>
      </div>
      <mu-collapse-group v-model:expanded="progList" class="demo-collapse">
        <mu-collapse id="r" title="面板 R">
          R 内容。
        </mu-collapse>
        <mu-collapse id="s" title="面板 S">
          S 内容。
        </mu-collapse>
        <mu-collapse id="t" title="面板 T">
          T 内容。
        </mu-collapse>
      </mu-collapse-group>
      <mu-collapse-group :disabled="groupDisabled" class="demo-collapse" default-expand="first">
        <mu-collapse id="u" title="面板 U">
          U 内容。
        </mu-collapse>
        <mu-collapse id="v" title="面板 V">
          V 内容。
        </mu-collapse>
      </mu-collapse-group>
    </demo-section>

    <demo-section
      title="自定义头部"
      note="#header 接管头部（展示型交给容器点击，expand-trigger 为 custom 时自行调 toggle）；header-prepend / header-append 插前后缀"
      vertical>
      <mu-collapse class="demo-collapse" title="被替换的 title">
        <template #header="{ expanded, disabled }">
          <mu-icon :icon="expanded ? 'chevronDown' : 'chevronRight'" />
          <span class="demo-log">{{ expanded ? 'on' : 'off' }}</span>
          <span>自定义 Header（展示型，点击交给容器）</span>
          <span v-if="disabled">（禁用）</span>
        </template>
        写法一内容。
      </mu-collapse>
      <mu-collapse expand-trigger="custom" class="demo-collapse">
        <template #header="{ expanded, toggle }">
          <span>自定义按钮控制</span>
          <mu-button class="demo-toggle-btn" @click.stop="toggle">
            {{ expanded ? '收起' : '展开' }}
          </mu-button>
        </template>
        写法二内容（头部区域点击不折叠，仅按钮生效）。
      </mu-collapse>
      <mu-collapse class="demo-collapse" title="带前后缀的面板">
        <template #header-prepend="{ expanded }">
          <span class="demo-log">{{ expanded ? 'p-on' : 'p-off' }}</span>
        </template>
        <template #header-append>
          <span class="demo-log">append</span>
        </template>
        内容。
      </mu-collapse>
      <mu-collapse :title="longTitle" class="demo-collapse demo-collapse--narrow">
        超长标题省略号截断。
      </mu-collapse>
      <mu-collapse class="demo-collapse">
        <template #header>
          <div>
            <div>第一行标题</div>
            <div class="demo-log">
              第二行副标题，header 高度随内容增长
            </div>
          </div>
        </template>
        多行 header 内容。
      </mu-collapse>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="accordion 初始多 id 收敛、accordion + defaultExpand=all 降级、组内未传 id 面板独立开合、disabled 面板插槽作用域"
      regression
      vertical>
      <div class="demo-row">
        <span class="demo-log">
          accordion 受控初始 ['b','c'] 应收敛为单开；emit 载荷 = {{ JSON.stringify(accEvents.slice(-1)) }}
        </span>
      </div>
      <mu-collapse-group v-model:expanded="accCtrlList" accordion class="demo-collapse" @update:expanded="onAccUpdate">
        <mu-collapse id="b" title="面板 B">
          B 内容。
        </mu-collapse>
        <mu-collapse id="c" title="面板 C">
          C 内容。
        </mu-collapse>
      </mu-collapse-group>
      <mu-collapse-group accordion class="demo-collapse" default-expand="all">
        <mu-collapse id="m" title="面板 M">
          all 降级为 first（dev 警告）。
        </mu-collapse>
        <mu-collapse id="n" title="面板 N">
          N 内容。
        </mu-collapse>
      </mu-collapse-group>
      <mu-collapse-group class="demo-collapse">
        <mu-collapse title="无 id 面板 一">
          一（兜底 id 独立开合）。
        </mu-collapse>
        <mu-collapse title="无 id 面板 二">
          二。
        </mu-collapse>
      </mu-collapse-group>
      <mu-collapse disabled class="demo-collapse">
        <template #header="{ expanded, disabled: d }">
          <span class="demo-log">expanded={{ expanded }} disabled={{ d }}（作用域与渲染态同源）</span>
        </template>
        不可见内容。
      </mu-collapse>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-collapse title="基础面板" default-expanded>
  面板内容
</mu-collapse>

<mu-collapse-group accordion default-expand="first">
  <mu-collapse id="a" title="面板 A">内容</mu-collapse>
  <mu-collapse id="b" title="面板 B">内容</mu-collapse>
</mu-collapse-group>`

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
  .demo-collapse {
    padding: 16px;
    border: 1px solid var(--mu-border-color-normal);
  }

  .demo-collapse--narrow {
    max-width: 360px;
  }

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .demo-toggle-btn {
    flex: none;
    height: 28px;
    margin-left: auto;
    padding: 0 8px;
  }
</style>
