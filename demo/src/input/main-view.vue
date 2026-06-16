<template>
  <div>
    <h2>
      INPUT & INPUT-GROUP
      <theme-switch />
    </h2>
    <div class="group flex flex-wrap gap-1x">
      <h3>Basic</h3>
      <mu-input v-model.trim="value" placeholder="Input Text" @update:model-value="onChange" @esc="console.log('esc')"/>
      <mu-input v-model="value" placeholder="Input Text" clearable />
    </div>
    <div class="group flex flex-wrap gap-1x">
      <h3>AFFIX：Icon, Text, Tool & Link</h3>
      <mu-input v-model="value" prefix=":icon=info" label="myLabel" />
      <mu-input v-model="value" suffix="Suffix" />
      <mu-input v-model="value" prefix=":tool=folderOpen" />
      <mu-input v-model="value" prefix=":tool=bug" suffix=":link=Link" />
    </div>
    <div class="group flex flex-wrap gap-1x">
      <h3>Style & State</h3>
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Normal" />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Underline" input-style="underline" />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Solid" input-style="solid" />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Round" round />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Round & Solid" round input-style="solid" />
      <div style="width: 100%;" />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Invalid" invalid />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Invalid & Underline" input-style="underline" invalid />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Invalid & Solid" input-style="solid" invalid />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Invalid & Round" round invalid />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Invalid & Round & Solid" round input-style="solid" invalid />
      <div style="width: 100%;" />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Readonly" readonly />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Readonly & Underline" input-style="underline" readonly />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Readonly & Solid" input-style="solid" readonly />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Readonly & Round" round readonly />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Readonly & Round & Solid" input-style="solid" round readonly />
      <div style="width: 100%;" />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Disabled" disabled />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Disabled & Underline" input-style="underline" disabled />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Disabled & Solid" input-style="solid" disabled />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Disabled & Round" round disabled />
      <mu-input v-model="value" prefix="Prefix" suffix=":tool=bug" placeholder="Disabled & Round & Solid" input-style="solid" round disabled />
    </div>

    <div class="group flex flex-wrap gap-1x">
      <h3>Input Group</h3>
      <div class="mu-input-group">
        <span>http://</span>
        <mu-input v-model="value" />
        <span>.com</span>
      </div>
      <div class="mu-input-group">
        <a class="mu-link">Link</a>
        <mu-input v-model="value" />
        <mu-tool-button icon="search" />
        <mu-button class="mu-input-addon">
          Button
        </mu-button>
      </div>
      <div class="mu-input-group">
        <mu-select
          v-model="selectValue" :options="options"
          class="mu-input-addon" style="width: 115px;" placeholder="empty" />
        <mu-input v-model="value" input-style="solid" />
        <span><mu-check label="Check" /></span>
      </div>
      <div style="width: 100%;" />
      <div class="mu-input-group">
        <span>http://</span>
        <mu-input v-model="value" invalid placeholder="Invalid" input-style="underline" />
        <span>.com</span>
      </div>
      <div class="mu-input-group">
        <span>http://</span>
        <mu-input v-model="value" readonly placeholder="Readonly" />
        <span>.com</span>
      </div>
      <div class="mu-input-group">
        <span>http://</span>
        <mu-input v-model="value" disabled placeholder="Disabled" />
        <span>.com</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const value = ref('')
  const selectValue = ref()
  const options = ref([
    { value: 'Option A' },
    { value: 'Option B' },
    { value: 'Option C' },
    { value: 'Option D', disabled: true }
  ])

  const onChange = (v) => {
    console.log(v)
  }
</script>

<style>
  .group > h3 {
    width: 100%;
  }

  .mu-input {
    width: 250px;
  }

  .mu-input-group {
    width: 350px;
  }

  .mu-input-addon.mu-input {
    width: 105px;
  }

  .mu-input-addon.mu-select {
    width: auto;
  }
</style>
