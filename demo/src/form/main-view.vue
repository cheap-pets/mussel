<template>
  <div>
    <h2>
      FORM
      <theme-switch />
    </h2>
    <div class="p-2x">
      <mu-form class="border border-primary" label-width="60px" label-align="left">
        <mu-form-field label="Text 1" :width="1/3">
          <mu-input value="Value 1" />
        </mu-form-field>
        <mu-form-field label="Text 2" :width="1/3" required>
          <mu-input value="Value 2" />
        </mu-form-field>
        <mu-flex-break />
        <mu-form-field label="Text 2A" :width="1/3" required>
          <mu-input value="Value 2" />
        </mu-form-field>
        <hr>
        <mu-form-row>
          <mu-form-field class="flex-1" label="Text 3" invalid>
            <mu-input value="Value 3" />
          </mu-form-field>
          <mu-form-field class="flex-1" label="Text 4" invalid>
            <mu-input input-style="underline" value="Value 4" />
          </mu-form-field>
          <mu-form-field class="flex-1" label="Text 5" invalid>
            <mu-input input-style="solid" value="Value 5" />
          </mu-form-field>
        </mu-form-row>
        <mu-form-field label="Text 6">
          <input type="text" class="mu-input">
        </mu-form-field>
        <mu-form-field label="Text 7" invalid>
          <textarea class="mu-input" style="height: 200px;" />
        </mu-form-field>
      </mu-form>
      <mu-form
        ref="formRef"
        class="mt-2x border"
        :model="form"
        :items="items"
        :rules="rules"
        label-width="80px"
        label-align="top" />
      <div class="mt-2x flex gap-1x">
        <mu-button caption="校验" primary @click="console.log(formRef.validate())" />
        <mu-button caption="重置校验" @click="formRef.resetValidation()" />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  import ThemeSwitch from '../common/theme-switch.vue'

  const formRef = ref()

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
    'hr',
    { prop: 'description', label: '商品描述', input: { type: 'memo', style: 'height: 200px' } }
  ]
</script>
