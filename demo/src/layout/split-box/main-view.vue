<template>
  <demo-page path="layout/split-box">
    <demo-section
      title="基础用法"
      note="mu-split-h-box 左中右三栏，#left / #center / #right 插槽；拖动分隔条调整两侧宽度"
      :code="basicCode"
      vertical>
      <mu-split-h-box class="demo-split-frame" :splitter="{ collapsible: true }">
        <template #left>
          <div class="demo-block mu-bg-strong">
            left
          </div>
        </template>
        <template #center>
          <div class="demo-block mu-bg-strong">
            center
          </div>
        </template>
        <template #right>
          <div class="demo-block mu-bg-strong">
            right
          </div>
        </template>
      </mu-split-h-box>
    </demo-section>

    <demo-section
      title="嵌套纵向分割"
      note="center 内嵌 mu-split-v-box 上下分割，拖动水平分隔条调整上下高度">
      <mu-split-h-box class="demo-split-frame" :splitter="{ collapsible: true }">
        <template #left>
          <div class="demo-block mu-bg-strong">
            left
          </div>
        </template>
        <template #center>
          <mu-split-v-box class="demo-split-inner">
            <template #top>
              <div class="demo-block--fill mu-bg-strong">
                top
              </div>
            </template>
            <template #center>
              <div class="demo-block--fill mu-bg-strong">
                bottom
              </div>
            </template>
          </mu-split-v-box>
        </template>
        <template #right>
          <div class="demo-block mu-bg-strong">
            right
          </div>
        </template>
      </mu-split-h-box>
    </demo-section>

    <demo-section
      title="分隔条样式"
      note="splitter.size 控制厚度（zero / slim / normal），shape 控制形态（line / pill），collapseHandle 显示折叠手柄；切换选项后拖动体验不同">
      <div class="demo-row">
        <mu-select v-model="splitterSize" style="width: 130px;" prefix="Size:" :options="['zero', 'slim', 'normal']" />
        <mu-select v-model="splitterShape" style="width: 120px;" prefix="Shape:" :options="['line', 'pill']" />
        <mu-switch v-model="collapseHandle" label="Collapse handle" />
      </div>
      <mu-split-h-box
        class="demo-split-frame demo-mt"
        :splitter="sharedSplitterOptions">
        <template #left>
          <div class="demo-block mu-bg-strong">
            left
          </div>
        </template>
        <template #center>
          <div class="demo-block mu-bg-strong">
            center
          </div>
        </template>
        <template #right>
          <div class="demo-block mu-bg-strong">
            right
          </div>
        </template>
      </mu-split-h-box>
    </demo-section>

    <demo-section
      title="左右分隔条配置"
      note="left-splitter / right-splitter 独立配置：visibility（always / hover）控制显隐时机，resizable 允许拖拽，collapsible 允许折叠；hover 选项切换后把鼠标悬停在对应分隔条上观察">
      <div class="demo-row demo-row--wrap">
        <mu-switch v-model="leftHover" label="L hover" />
        <mu-switch v-model="rightHover" label="R hover" />
        <mu-switch v-model="leftResizableOn" label="L resize" />
        <mu-switch v-model="rightResizableOn" label="R resize" />
        <mu-switch v-model="leftCollapsibleOn" label="L collapse" />
        <mu-switch v-model="rightCollapsibleOn" label="R collapse" />
      </div>
      <mu-split-h-box
        class="demo-split-frame demo-mt"
        :left-splitter="leftSplitterOptions"
        :right-splitter="rightSplitterOptions"
        left-class="mu-bg-strong"
        right-class="mu-bg-strong">
        <template #left>
          <div class="demo-block">
            left
          </div>
        </template>
        <template #center>
          <div class="demo-block mu-bg-strong">
            center
          </div>
        </template>
        <template #right>
          <div class="demo-block">
            right
          </div>
        </template>
      </mu-split-h-box>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="zero 尺寸分隔条仍可拖拽（热区保留）；left-style min-width 限制拖拽下限，拖到最小宽度后不再收缩；折叠手柄点击后栏收起、再点展开">
      <div class="demo-row">
        <mu-switch v-model="zeroSize" label="Zero size" />
      </div>
      <mu-split-h-box
        class="demo-split-frame demo-mt"
        :splitter="{ size: zeroSize ? 'zero' : 'normal', collapsible: true, collapseHandle: true }"
        left-class="mu-bg-strong"
        left-style="min-width: 200px"
        right-class="mu-bg-strong">
        <template #left>
          <div class="demo-block">
            left（min-width 200px）
          </div>
        </template>
        <template #center>
          <div class="demo-block mu-bg-strong">
            center
          </div>
        </template>
        <template #right>
          <div class="demo-block">
            right
          </div>
        </template>
      </mu-split-h-box>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { computed, ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-split-h-box :splitter="{ collapsible: true }">
  <template #left>left</template>
  <template #center>center</template>
  <template #right>right</template>
</mu-split-h-box>`

  const splitterSize = ref('normal')
  const splitterShape = ref('line')
  const collapseHandle = ref(true)
  const zeroSize = ref(false)

  const leftHover = ref(false)
  const rightHover = ref(false)
  const leftResizableOn = ref(true)
  const rightResizableOn = ref(true)
  const leftCollapsibleOn = ref(true)
  const rightCollapsibleOn = ref(true)

  const sharedSplitterOptions = computed(() => ({
    size: splitterSize.value,
    shape: splitterShape.value,
    collapseHandle: collapseHandle.value
  }))

  const leftSplitterOptions = computed(() => ({
    resizable: leftResizableOn.value,
    collapsible: leftCollapsibleOn.value,
    visibility: leftHover.value ? 'hover' : 'always'
  }))

  const rightSplitterOptions = computed(() => ({
    resizable: rightResizableOn.value,
    collapsible: rightCollapsibleOn.value,
    visibility: rightHover.value ? 'hover' : 'always'
  }))
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

  .demo-split-frame {
    height: 280px;
    border: 1px solid var(--mu-border-color);
    border-radius: 4px;
    overflow: hidden;
  }

  .demo-split-inner {
    height: 100%;
  }

  .demo-block {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 220px;
    height: 100%;
    overflow: hidden;
  }

  .demo-block--fill {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
