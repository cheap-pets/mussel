<template>
  <demo-page path="form/form">
    <demo-section
      title="手写布局"
      note="mu-form-field 组织 label 与控件；width 控制栅格宽（1/3、1/2），mu-flex-break 换行，mu-form-row 行内多字段；label-width/label-align 统一标签宽与对齐"
      :code="basicCode"
      vertical>
      <mu-form
        class="demo-form demo-form--border"
        label-width="60px"
        label-align="right">
        <mu-form-field label="Text 1" :width="1 / 3">
          <mu-input value="Value 1" />
        </mu-form-field>
        <mu-form-field label="Text 2" :width="1 / 3" required>
          <mu-input value="Value 2" />
        </mu-form-field>
        <mu-flex-break />
        <mu-form-field label="Text 2A" :width="1 / 3" required>
          <mu-input value="Value 2" />
        </mu-form-field>
        <hr>
        <mu-form-row>
          <mu-form-field
            class="flex-1"
            label="Text 3"
            error="Text 3 不正确">
            <mu-input value="Value 3" />
          </mu-form-field>
          <mu-form-field class="flex-1" label="Text 4" error>
            <mu-input input-style="underline" value="Value 4" />
          </mu-form-field>
          <mu-form-field class="flex-1" label="Text 5" error>
            <mu-input input-style="solid" value="Value 5" />
          </mu-form-field>
        </mu-form-row>
      </mu-form>
    </demo-section>

    <demo-section
      title="原生控件"
      note="原生 input/textarea 加 mu-input 类即可套用输入框样式（用于组件未覆盖的场景）"
      vertical>
      <mu-form class="demo-form">
        <mu-form-field label="原生输入">
          <input type="text" class="mu-input">
        </mu-form-field>
        <mu-form-field label="多行文本" error="描述不能为空">
          <textarea class="mu-input" style="height: 120px;" />
        </mu-form-field>
      </mu-form>
    </demo-section>

    <demo-section
      title="配置式表单"
      note="items 声明字段（字符串为分组标题，'hr' 分隔线，数组为一行多列，input.type 指定控件），rules 声明校验；点击「校验」执行 validate()，「重置校验」执行 resetValidation()"
      vertical>
      <mu-form
        ref="formRef"
        class="demo-form demo-form--border"
        :model="form"
        :items="items"
        :rules="rules"
        label-width="80px"
        label-align="top" />
      <div class="demo-row">
        <mu-button caption="校验" color="primary" @click="onValidate" />
        <mu-button caption="重置校验" @click="onResetValidation" />
        <span class="demo-log">校验结果：{{ validateResult }}</span>
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="校验失败后修改字段值重校验、label-align 三种取值"
      regression
      vertical>
      <div class="demo-row">
        <span>label-align：</span>
        <mu-form class="demo-form demo-form--border" label-align="left" label-width="60px">
          <mu-form-field label="Left">
            <mu-input value="left" />
          </mu-form-field>
        </mu-form>
        <mu-form class="demo-form demo-form--border" label-align="right" label-width="60px">
          <mu-form-field label="Right">
            <mu-input value="right" />
          </mu-form-field>
        </mu-form>
        <mu-form class="demo-form demo-form--border" label-align="top">
          <mu-form-field label="Top">
            <mu-input value="top" />
          </mu-form-field>
        </mu-form>
      </div>
      <div class="demo-row">
        <span>必填项为空时点击「校验」应提示失败，填值后重新校验应通过：</span>
        <mu-form
          ref="miniFormRef"
          class="demo-form"
          :model="miniForm"
          :items="miniItems"
          :rules="miniRules"
          label-width="60px" />
        <mu-button caption="校验" color="primary" @click="onMiniValidate" />
        <span class="demo-log">结果：{{ miniResult }}</span>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-form label-width="60px" label-align="right">
  <mu-form-field label="名称" :width="1 / 3" required>
    <mu-input v-model="value" />
  </mu-form-field>
</mu-form>`

  const formRef = ref()
  const validateResult = ref('未校验')

  const miniFormRef = ref()
  const miniResult = ref('未校验')

  const rules = {
    brand: 'required',
    model: 'required',
    processor: 'required',
    memory: 'required',
    storage: 'required',
    price: 'required',
    stock: 'required'
  }

  const form = ref({
    brand: 'Apple',
    model: 'MacBook Pro 14"',
    processor: 'M3 Pro',
    memory: '18GB',
    storage: '512GB SSD',
    screenSize: '14.2英寸',
    resolution: '3024 x 1964',
    graphics: '集成显卡',
    price: '14999',
    color: '深空灰色',
    themeColor: '#1c7ed6',
    weight: '1.61',
    warranty: 1,
    stock: 50,
    os: 'macOS',
    releaseDate: '2024-11',
    purchaseDate: '2024-12-15',
    promotionRange: { startDate: new Date(2026, 0, 8), endDate: new Date(2026, 0, 20) },
    description: '搭载 M3 Pro 芯片的 MacBook Pro，性能强劲，续航出色，适合专业用户使用。',
    features: ['touchbar', 'wifi6']
  })

  const items = [
    // 基本信息
    '基本信息',
    { prop: 'brand', label: '品牌', width: 1 / 2, required: true },
    { prop: 'model', label: '型号', width: 1 / 2, required: true },
    { prop: 'processor', label: '处理器', width: 1 / 2, required: true },
    { prop: 'memory', label: '内存', width: 1 / 2, required: true },
    { prop: 'storage', label: '存储', width: 1 / 2, required: true },
    { prop: 'graphics', label: '显卡', width: 1 / 2 },
    'hr',
    '屏幕信息',
    [
      { prop: 'screenSize', label: '屏幕尺寸', required: true },
      { prop: 'resolution', label: '分辨率', required: true }
    ],
    '价格与库存',
    [
      { prop: 'price', label: '价格', required: true, suffix: '(元)', input: { type: 'text' } },
      { prop: 'stock', label: '库存', required: true, suffix: '(件)' }
    ],
    [
      { prop: 'weight', label: '重量', suffix: '(kg)' },
      {
        prop: 'warranty',
        label: '保修期',
        input: {
          type: 'select',
          clearButton: false,
          options: [{ value: 1, label: '一年' }, { value: 2, label: '二年' }, { value: 3, label: '三年' }]
        }
      }
    ],
    [
      {
        prop: 'color',
        label: '颜色',
        input: {
          type: 'radio-group',
          options: [
            { value: '深空灰色', label: '深空灰' },
            { value: '银色', label: '银色' },
            { value: '星光色', label: '星光色' }
          ]
        }
      },
      {
        prop: 'os',
        label: '操作系统',
        input: {
          type: 'segmented',
          options: [
            { label: 'macOS', value: 'macOS' },
            { label: 'linux', value: 'linux' },
            { label: 'windows', value: 'windows' }
          ]
        }
      }
    ],
    {
      prop: 'features',
      label: '特性',
      input: {
        type: 'check-group',
        options: [
          { value: 'touchbar', label: 'Touch Bar' },
          { value: 'wifi6', label: 'Wi-Fi 6E' },
          { value: 'thunderbolt', label: 'Thunderbolt 4' },
          { value: 'faceid', label: 'Face ID', disabled: true }
        ]
      }
    },
    'hr',
    [
      { prop: 'themeColor', label: '主题色', input: 'color' }
    ],
    'hr',
    '日期选项',
    [
      { prop: 'releaseDate', label: '上市日期', input: 'month' },
      { prop: 'purchaseDate', label: '购买日期', input: 'date' }
    ],
    [
      {
        prop: 'promotionRange',
        label: '促销区间',
        input: { type: 'date-range', clearable: true }
      }
    ],
    'hr',
    { prop: 'description', label: '商品描述', input: { type: 'memo', style: 'height: 200px' } }
  ]

  const miniForm = ref({ name: '', remark: '备注' })
  const miniItems = [
    { prop: 'name', label: '名称', required: true },
    { prop: 'remark', label: '备注' }
  ]
  const miniRules = { name: 'required' }

  function onValidate () {
    const result = formRef.value.validate()

    validateResult.value = result.ok ? '通过' : '失败'
  }

  function onResetValidation () {
    formRef.value.resetValidation()
    validateResult.value = '未校验'
  }

  function onMiniValidate () {
    const result = miniFormRef.value.validate()

    miniResult.value = result.ok ? '通过' : '失败'
  }
</script>

<style>
  .demo-form {
    width: 720px;
    max-width: 100%;
    padding: var(--mu-base-spacing);
  }

  .demo-form--border {
    border: 1px solid var(--mu-border-color);
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
</style>
