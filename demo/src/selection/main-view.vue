<template>
  <div>
    <h2>
      SWITCH, CHECK, RADIO & SEGMENTED
      <theme-switch />
    </h2>
    <div class="group">
      <h3>SWITCH</h3>
      <mu-switch v-model="value1" />
      <mu-switch v-model="value1" active-label="ON" inactive-label="OFF" success />
      <mu-switch v-model="value1" label="CAUTION" danger disabled />
    </div>
    <div class="group">
      <h3>CHECK</h3>
      <mu-check :model-value="check1" label="Check 1" @update:model-value="onCheck1Update" />
      <mu-check v-model="check2" label="Check 2" />
      <mu-check v-model="checked" label="Check 3" value="3" disabled />
      <mu-check v-model="checked" label="Check 4" value="4" />
      <mu-check v-model="checked" label="Check 5" value="5" disabled />
    </div>
    <div class="group">
      <h3>CHECK GROUP</h3>
      <mu-check-group v-model="groupChecked" :options="groupOptions" />
    </div>
    <div class="group">
      <h3>CHECK GROUP (slot)</h3>
      <mu-check-group v-model="groupChecked">
        <mu-check value="a" label="Option A" />
        <mu-check value="b" label="Option B" />
        <mu-check value="c" label="Option C" disabled />
      </mu-check-group>
    </div>
    <div class="group">
      <h3>
        RADIO
      </h3>
      <mu-radio v-model="radioValue" value="1" label="Radio 1" />
      <mu-radio v-model="radioValue" value="2" label="Radio 2" />
      <mu-radio v-model="radioValue" value="3" label="Radio 3" disabled />
    </div>
    <div class="group">
      <h3>RADIO GROUP</h3>
      <mu-radio-group v-model="radioGroupValue" :options="radioGroupOptions" />
    </div>
    <div class="group">
      <h3>RADIO GROUP (slot)</h3>
      <mu-radio-group v-model="radioGroupValue">
        <mu-radio value="x" label="Radio X" />
        <mu-radio value="y" label="Radio Y" />
        <mu-radio value="z" label="Radio Z" disabled />
      </mu-radio-group>
    </div>
    <div class="group">
      <h3>SEGMENTED</h3>
      <mu-segmented v-model="segmentedValue" :options="segmentedOptions" style="align-self: flex-start;" />
      <mu-segmented v-model="segmentedValue" :options="segmentedOptions" icon-position="top" disabled />
    </div>
    <div class="group">
      <h3>SEGMENTED (string options)</h3>
      <mu-segmented
        v-model="segmentedSimple"
        :options="['Daily', 'Weekly', 'Monthly']"
        style="width: 100%;" />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const value1 = ref(true)
  const check1 = ref(true)
  const check2 = ref(false)
  const checked = ref(['3'])
  const radioValue = ref('3')
  const groupChecked = ref(['b'])
  const groupOptions = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c', disabled: true }
  ]
  const radioGroupValue = ref('y')
  const radioGroupOptions = [
    { label: 'Radio X', value: 'a' },
    { label: 'Radio Y', value: 'b' },
    { label: 'Radio Z', value: 'c', disabled: true }
  ]
  const segmentedValue = ref('b')
  const segmentedOptions = [
    { label: 'Option A', value: 'a', icon: 'info' },
    { label: 'Option B', value: 'b', icon: 'alert' },
    { label: 'Option C', value: 'c', icon: 'question', disabled: true }
  ]
  const segmentedSimple = ref('Weekly')

  function onCheck1Update (v) {
    value1.value = v
  }
</script>

<style>
  .group {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
</style>
