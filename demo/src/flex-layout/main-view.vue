<template>
  <div>
    <div class="flex flex-col fixed p-1x" style="inset: 0;">
      <div class="mu-bar">
        <h2>Flex-layout & Splitter</h2>
        <mu-select
          v-model="splitterSize"
          style="width: 130px;"
          prefix="Size:"
          :options="['none', 'slim', 'normal']" />
        <mu-select
          v-model="splitterShape"
          style="width: 120px;"
          prefix="Shape:"
          :options="['line', 'pill']" />
        <mu-switch v-model="collapseHandle" label="Collapse handle" />
        <theme-switch style="margin-left: 16px;" />
      </div>
      <mu-split-h-box
        class="flex-1 p-1x border"
        resizable
        collapsible
        :splitter-collapse-handle="collapseHandle"
        left-class="mu-bg-strong"
        left-style="min-width: 300px"
        right-class="mu-bg-strong"
        :splitter-size="splitterSize"
        :splitter-shape="splitterShape">
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
            resizable
            collapsible="top"
            class="block"
            top-class="border-b"
            :splitter-collapse-handle="collapseHandle"
            :splitter-size="splitterSize"
            :splitter-shape="splitterShape">
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
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const splitterSize = ref('none')
  const splitterShape = ref('line')
  const collapseHandle = ref(true)

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
