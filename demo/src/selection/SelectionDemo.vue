<template>
  <div>
    <h2>
      SWITCH, CHECK & RADIO
      <mu-switch
        v-model="darkMode"
        active-icon="sun"
        inactive-icon="moon"
        :active-value="false"
        :inactive-value="true"
        @update:model-value="onUIModeChange" />
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
    <div v-mu-scrollbar class="group" style="height: 200px; overflow: auto;">
      <h3 style="height: 1000px;">
        RADIO
      </h3>
      <mu-radio v-model="radioValue" value="1" label="Radio 1" />
      <mu-radio v-model="radioValue" value="2" label="Radio 2" />
      <mu-radio v-model="radioValue" value="3" label="Radio 3" disabled />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  const darkMode = ref(false)
  const value1 = ref(true)
  const check1 = ref(true)
  const check2 = ref(false)
  const checked = ref(['3'])
  const radioValue = ref('3')

  function onUIModeChange () {
    document.querySelector('.mu-root').classList.toggle('mu-dark')
  }

  function onCheck1Update (v) {
    value1.value = v
  }
</script>
