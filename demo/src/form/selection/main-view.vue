<template>
  <demo-page path="form/selection">
    <demo-section
      title="Switch 开关"
      note="v-model 布尔值；active-label/inactive-label 显示文字；success/danger 变色"
      :code="basicCode">
      <mu-switch v-model="switchOn" />
      <mu-switch
        v-model="switchOn"
        active-label="ON"
        inactive-label="OFF"
        success />
      <mu-switch
        v-model="switchOn"
        label="CAUTION"
        danger
        disabled />
    </demo-section>

    <demo-section
      title="Check 复选框"
      note="单独使用绑定布尔；设置 value 后可用于多选组语义（数组模型）">
      <mu-check
        v-model="checkSingle"
        label="Check 1" />
      <mu-check
        v-model="checkArray"
        label="Check 3"
        value="3"
        disabled />
      <mu-check
        v-model="checkArray"
        label="Check 4"
        value="4" />
      <mu-check
        v-model="checkArray"
        label="Check 5"
        value="5"
        disabled />
      <span class="demo-value">值：{{ JSON.stringify(checkArray) }}</span>
    </demo-section>

    <demo-section
      title="CheckGroup 复选组"
      note="options 数组与默认插槽两种写法，v-model 为选中值数组"
      vertical>
      <mu-check-group
        v-model="groupChecked"
        :options="groupOptions" />
      <mu-check-group v-model="groupChecked">
        <mu-check
          value="a"
          label="Option A" />
        <mu-check
          value="b"
          label="Option B" />
        <mu-check
          value="c"
          label="Option C"
          disabled />
      </mu-check-group>
      <span class="demo-value">值：{{ JSON.stringify(groupChecked) }}</span>
    </demo-section>

    <demo-section
      title="Radio 单选框"
      note="同组共享一个模型，value 标识选项">
      <mu-radio
        v-model="radioValue"
        value="1"
        label="Radio 1" />
      <mu-radio
        v-model="radioValue"
        value="2"
        label="Radio 2" />
      <mu-radio
        v-model="radioValue"
        value="3"
        label="Radio 3"
        disabled />
      <span class="demo-value">值：{{ radioValue }}</span>
    </demo-section>

    <demo-section
      title="RadioGroup 单选组"
      note="options 数组与默认插槽两种写法"
      vertical>
      <mu-radio-group
        v-model="radioGroupValue"
        :options="radioGroupOptions" />
      <mu-radio-group v-model="radioGroupValue">
        <mu-radio
          value="x"
          label="Radio X" />
        <mu-radio
          value="y"
          label="Radio Y" />
        <mu-radio
          value="z"
          label="Radio Z"
          disabled />
      </mu-radio-group>
    </demo-section>

    <demo-section
      title="Segmented 分段控制"
      note="对象 options 可带 icon；icon-position 控制图标位置；支持字符串数组">
      <mu-segmented
        v-model="segmentedValue"
        :options="segmentedOptions"
        style="align-self: flex-start" />
      <mu-segmented
        v-model="segmentedValue"
        :options="segmentedOptions"
        icon-position="top"
        disabled />
      <mu-segmented
        v-model="segmentedSimple"
        :options="['Daily', 'Weekly', 'Monthly']"
        style="width: 100%" />
    </demo-section>

    <demo-section
      title="联动控制"
      note="Switch 控制 Check 组禁用">
      <mu-switch
        v-model="linkEnabled"
        label="启用选项" />
      <mu-check-group
        v-model="linkChecked"
        :disabled="!linkEnabled"
        :options="groupOptions" />
    </demo-section>

    <demo-section
      title="边界与回归"
      note="空数组模型、全禁用组"
      regression
      vertical>
      <div class="demo-row">
        <span>空值 CheckGroup：</span>
        <mu-check-group
          v-model="emptyChecked"
          :options="groupOptions" />
        <span>值：{{ JSON.stringify(emptyChecked) }}</span>
      </div>
      <div class="demo-row">
        <span>全禁用 RadioGroup：</span>
        <mu-radio-group
          v-model="radioGroupValue"
          disabled
          :options="radioGroupOptions" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-switch v-model="enabled" />
<mu-check v-model="checked" label="Check 1" />
<mu-radio v-model="picked" value="1" label="Radio 1" />`

  const switchOn = ref(true)
  const linkEnabled = ref(true)
  const checkSingle = ref(false)
  const checkArray = ref(['3'])
  const groupChecked = ref(['b'])
  const emptyChecked = ref([])
  const linkChecked = ref(['a'])
  const radioValue = ref('3')
  const radioGroupValue = ref('y')
  const segmentedValue = ref('b')
  const segmentedSimple = ref('Weekly')

  const groupOptions = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c', disabled: true }
  ]

  const radioGroupOptions = [
    { label: 'Radio X', value: 'a' },
    { label: 'Radio Y', value: 'b' },
    { label: 'Radio Z', value: 'c', disabled: true }
  ]

  const segmentedOptions = [
    { label: 'Option A', value: 'a', icon: 'info' },
    { label: 'Option B', value: 'b', icon: 'alert' },
    { label: 'Option C', value: 'c', icon: 'question', disabled: true }
  ]
</script>

<style>
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-value {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
