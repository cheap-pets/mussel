<template>
  <div>
    <div class="flex flex-col fixed p-1x" style="inset: 0;">
      <div class="mu-bar" style="flex-wrap: wrap; gap: 8px;">
        <h2>Flex-layout & Splitter</h2>
        <mu-select
          v-model="splitterSize"
          style="width: 130px;"
          prefix="Size:"
          :options="['zero', 'slim', 'normal']" />
        <mu-select
          v-model="splitterShape"
          style="width: 120px;"
          prefix="Shape:"
          :options="['line', 'pill']" />
        <mu-switch v-model="leftHover" label="L hover" />
        <mu-switch v-model="rightHover" label="R hover" />
        <mu-switch v-model="leftSplitterOn" label="L splitter" />
        <mu-switch v-model="rightSplitterOn" label="R splitter" />
        <mu-switch v-model="leftResizableOn" label="L resize" />
        <mu-switch v-model="rightResizableOn" label="R resize" />
        <mu-switch v-model="leftCollapsibleOn" label="L collapse" />
        <mu-switch v-model="rightCollapsibleOn" label="R collapse" />
        <mu-switch v-model="collapseHandle" label="Collapse handle" />
        <theme-switch style="margin-left: 16px;" />
      </div>
      <mu-split-h-box
        class="flex-1 p-1x border"
        :splitter="sharedSplitterOptions"
        :left-splitter="leftSplitterOn && leftSplitterOptions"
        :right-splitter="rightSplitterOn && rightSplitterOptions"
        left-class="mu-bg-strong"
        left-style="min-width: 300px"
        right-class="mu-bg-strong">
        <template #left>
          <div class="block">
            1
            <div style="width: 500px">
              Content
            </div>
          </div>
        </template>
        <template #center>
          <mu-split-v-box
            class="block"
            :splitter="sharedSplitterOptions"
            :top-splitter="{
              resizable: topResizableOn,
              collapsible: true,
              visibility: topHover ? 'hover' : 'always'
            }"
            :bottom-splitter="{
              resizable: bottomResizableOn,
              visibility: bottomHover ? 'hover' : 'always'
            }"
            top-class="border-b">
            <template #top>
              <div class="block" style="height: 100%;">
                2A
              </div>
            </template>
            <template #center>
              <div class="block">
                2B
              </div>
            </template>
          </mu-split-v-box>
        </template>
        <template #right>
          <mu-v-box class="block" flex-center>
            3
          </mu-v-box>
        </template>
      </mu-split-h-box>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const splitterSize = ref('normal')
  const splitterShape = ref('line')
  const leftHover = ref(false)
  const rightHover = ref(false)
  const topHover = ref(false)
  const bottomHover = ref(false)
  const leftSplitterOn = ref(true)
  const rightSplitterOn = ref(true)
  const leftResizableOn = ref(true)
  const rightResizableOn = ref(true)
  const topResizableOn = ref(true)
  const bottomResizableOn = ref(true)
  const leftCollapsibleOn = ref(true)
  const rightCollapsibleOn = ref(true)
  const collapseHandle = ref(true)

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
  .block {
    overflow: hidden;

    width: 100%;
    height: 100%;

    font-size: 2rem;
    text-align: center;
  }
</style>
