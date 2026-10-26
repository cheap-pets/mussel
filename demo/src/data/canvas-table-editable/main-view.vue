<template>
  <demo-page path="data/canvas-table-editable" fluid>
    <demo-section
      title="可编辑表格示例"
      note="MuCanvasTable 编辑用法：单击单元格进入编辑（A5.2 单击进编辑，无 dblclick 依赖），Enter 或点击其他区域提交（textarea 用 Ctrl/Cmd+Enter），Esc 取消；可编辑格 hover 有主色描边与 text 光标"
      wide>
      <mu-canvas-table
        ref="editableTableRef"
        class="editable-demo__table"
        key-field="id"
        :columns="columns"
        :records="sortedRecords"
        :selected-record-key="selectedKey"
        :order-by="orderBy"
        :records-version="recordsVersion"
        editable
        resizable
        striped
        placeholder="待填写"
        @update:cell-value="onCellValueChange"
        @update:selected-record-key="onSelectedKeyChange"
        @update:order-by="onOrderByChange" />
    </demo-section>

    <demo-section
      title="最近提交"
      note="update:cell-value 事件由父级就地修改 record（受控数据流）；形态列显示提交值类型（数组提交显示元素与 Array 标记）">
      <ol class="editable-demo__changes">
        <li v-for="item in recentChanges" :key="item.seq" class="editable-demo__change">
          <span class="editable-demo__change__field">{{ item.field }}</span>
          <span class="editable-demo__change__kind">{{ item.kind }}</span>
          <span class="editable-demo__change__text">{{ item.text }}</span>
        </li>
        <li v-if="!recentChanges.length" class="editable-demo__change">（编辑提交后此处显示变更）</li>
      </ol>
    </demo-section>

    <demo-section title="用法说明" vertical>
      <ul class="editable-demo__notes">
        <li>表格级 <code>editable</code> 开启编辑；列不声明 <code>editable</code> 即只读（如"金额"列，由 <code>value</code> 函数计算）。</li>
        <li><b>单击进编辑</b>：同一次点击先发出选中/ <code>cell-click</code> 事件再打开编辑器；列宽拖拽后的 click 被吞、排序表头点击不开编辑。</li>
        <li>编辑器按列类型自动选择：<code>enum</code> 映射为下拉（MuSelect）、<code>date</code> 为日期（MuDateInput）、<code>bool</code> 为开关（MuSwitch，无边框形态）、其余为输入框（MuInput）；<code>editor: { type, props, validate }</code> 显式指定优先。单击翻转仅属 <code>type: 'check'</code> 列。</li>
        <li><b>多行编辑（textarea）</b>："多行备注"（<code>maxLines</code>）、"标签数组"（数组值）与"链接数组"列缺省用 textarea 编辑：Enter 换行不提交、<b>Ctrl/Cmd+Enter 提交</b>；数组值开值 = 元素换行拼接，提交 = 换行分割成数组（链接对象数组开值取 caption）。</li>
        <li><b>编辑器边框对照</b>："边框开/关"两列分别为 <code>editor.border: true/false</code>——两态输入文本左缘与单元格文本左缘一致（A5.4）。</li>
        <li>名称列演示 <code>validate</code>：清空后提交会被拦截，输入框标红且编辑器不关闭。</li>
        <li>点击可排序列头由父级按 <code>update:order-by</code>（<code>'field:asc' | 'field:desc' | ''</code>）执行排序；列宽拖拽结束触发 <code>column-resize</code>。</li>
        <li>父级异步修改记录后递增 <code>records-version</code> 通知画布重绘。</li>
      </ul>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  // 调试句柄（e2e 用）：组件实例（defineExpose 全量方法）
  window.__canvasTableEditable = { getCellRect: () => null }

  const editableTableRef = ref(null)

  // ---------- 示例数据：门店商品库存 ----------
  const CATEGORY_MAPPINGS = {
    fruit: '水果',
    vegetable: '蔬菜',
    seafood: '水产',
    default: '其他'
  }
  const CATEGORY_KEYS = ['fruit', 'vegetable', 'seafood']

  const LEVEL_MAPPINGS = {
    1: '低',
    2: '高',
    default: '未知'
  }

  function createRecords () {
    const names = [
      '红富士苹果', '香蕉', '脐橙', '西红柿', '黄瓜', '土豆', '菠菜', '生菜',
      '基围虾', '鲈鱼', '花蛤', '鱿鱼', '猕猴桃', '芒果', '彩椒', '山药',
      '带鱼', '螃蟹', '草莓', '葡萄', '冬瓜', '苦瓜', '生蚝', '柠檬'
    ]

    return names.map((name, i) => ({
      id: i + 1,
      name,
      category: CATEGORY_KEYS[i % CATEGORY_KEYS.length],
      // 数值枚举列夹具：编辑往返后提交值类型保持 number（A5.5 ②）
      level: (i % 2) + 1,
      price: Math.round((3 + (i * 2.7) % 40) * 100) / 100,
      stock: (i * 17) % 200,
      date: `2026-${String((i % 10) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
      active: i % 3 !== 0,
      note: i % 4 === 0 ? '' : `每 ${i % 5 + 2} 日补货`,
      // textarea 验证区：maxLines 多行 / 数组值 / link 对象数组
      memo: i % 3 === 0
        ? `多行备注第一行（记录 ${i + 1}）\n第二行：补货周期与供应商信息\n第三行：温控与运输要求说明`
        : `单行备注 ${i + 1}`,
      tagList: i % 2 === 0 ? ['直采', '冷链', '当日达'] : ['常规'],
      links: i % 3 === 0
        ? [{ caption: '供应商主页', color: 'primary' }, { caption: '质检报告', color: 'teal' }, { caption: '溯源页', danger: true }]
        : [{ caption: '商品详情' }],
      // editor.border 开/关两列对照（A5.4 边距一致）
      borderOn: `边框开 ${i + 1}`,
      borderOff: `边框关 ${i + 1}`
    }))
  }

  const records = ref(createRecords())
  const recordsVersion = ref(0)
  const selectedKey = ref(null)
  const orderBy = ref('')

  // ---------- 列定义：可编辑列 + 只读列 ----------
  const columns = [
    { caption: '#', type: 'rec_no', width: 52 },
    {
      caption: '名称',
      field: 'name',
      width: 150,
      sortable: true,
      editable: true,
      editor: {
        validate: value => (String(value).trim() === '' ? '名称不能为空' : true)
      }
    },
    {
      caption: '类别',
      field: 'category',
      type: 'enum',
      width: 96,
      sortable: true,
      mappings: CATEGORY_MAPPINGS,
      editable: true,
      editor: true
    },
    {
      // 数值枚举列（前轮夹具）：open 字符串化、提交按原值类型回写 number
      caption: '等级',
      field: 'level',
      type: 'enum',
      width: 80,
      mappings: LEVEL_MAPPINGS,
      editable: true,
      editor: true
    },
    {
      // price clearable（前轮夹具）：MuInput 清空按钮产出 null 路径
      caption: '单价',
      field: 'price',
      type: 'currency',
      width: 110,
      editable: true,
      editor: { props: { clearable: true } }
    },
    {
      caption: '库存',
      field: 'stock',
      type: 'number',
      width: 90,
      sortable: true,
      editable: true,
      editor: { type: 'input', props: { type: 'number' } }
    },
    {
      // 只读列：金额 = 单价 × 库存，value 函数计算，未声明 editable
      caption: '金额',
      width: 110,
      type: 'currency',
      value: record => Math.round(record.price * record.stock * 100) / 100
    },
    { caption: '上架日期', field: 'date', type: 'date', width: 120, editable: true, editor: true },
    { caption: '启用', field: 'active', type: 'bool', width: 70, editable: true, editor: true },
    { caption: '备注', field: 'note', width: 140, editable: true, editor: true },
    {
      // maxLines 列：开值/行高按多行判定，缺省 textarea 编辑器
      caption: '多行备注',
      field: 'memo',
      maxLines: 3,
      width: 220,
      editable: true,
      editor: true
    },
    {
      // 数组值列：无条件多行渲染，编辑开值 = 换行拼接、提交 = 换行分割数组
      caption: '标签数组',
      field: 'tagList',
      width: 130,
      editable: true,
      editor: true
    },
    {
      // link 数组列（对象数组）：开值取 caption 拼接、提交字符串数组（属性不保留，A8 #21）
      caption: '链接数组',
      field: 'links',
      type: 'link',
      width: 180,
      editable: true,
      editor: true
    },
    { caption: '边框开', field: 'borderOn', width: 130, editable: true, editor: { border: true } },
    { caption: '边框关', field: 'borderOff', width: 130, editable: true, editor: { border: false } }
  ]

  // 展示型排序：组件 emit update:order-by，父级执行实际排序
  const sortedRecords = computed(() => {
    if (!orderBy.value) return records.value

    const [field, direction] = orderBy.value.split(':')

    return [...records.value].sort((a, b) => {
      const va = a[field]
      const vb = b[field]
      const cmp =
        typeof va === 'string' ? va.localeCompare(vb) : va === vb ? 0 : va > vb ? 1 : -1

      return direction === 'desc' ? -cmp : cmp
    })
  })

  // ---------- 受控数据流：提交事件由父级就地修改 record ----------
  const recentChanges = ref([])
  let changeSeq = 0

  function describeValue (value) {
    if (Array.isArray(value)) return `Array(${value.length})[${value.join(' | ')}]`

    return String(value)
  }

  function onCellValueChange ({ record, column, value }) {
    record[column.field] = value
    recentChanges.value.unshift({
      seq: ++changeSeq,
      field: column.caption || column.field,
      // 「最近提交」形态：typeof / Array 标记 + 数组元素展开（前轮夹具保留）
      kind: `typeof ${Array.isArray(value) ? 'array' : typeof value}`,
      text: `${record.name}：${describeValue(value)}`
    })
    recentChanges.value.length = Math.min(recentChanges.value.length, 6)
  }

  function onSelectedKeyChange (key) {
    selectedKey.value = key
  }

  function onOrderByChange (value) {
    orderBy.value = value
  }

  onMounted(() => {
    window.__canvasTableEditable = editableTableRef.value ?? window.__canvasTableEditable
  })
</script>

<style>
  .editable-demo__table {
    height: 480px;
    max-width: 1280px;
  }

  .editable-demo__changes {
    max-height: 180px;
    margin: 0;
    padding: 0;
    overflow: auto;
    list-style: none;
  }

  .editable-demo__change {
    display: flex;
    gap: 10px;
    padding: 3px 0;
    font-size: var(--mu-font-size-small);
  }

  .editable-demo__change__field {
    flex: none;
    min-width: 64px;
    font-weight: 500;
  }

  .editable-demo__change__kind {
    flex: none;
    min-width: 72px;
    color: var(--mu-primary-color);
    font-family: monospace;
  }

  .editable-demo__change__text {
    color: var(--mu-text-color-muted);
    word-break: break-all;
  }

  .editable-demo__notes {
    margin: 0;
    padding-left: 18px;
    color: var(--mu-text-color-regular);
    font-size: var(--mu-font-size-small);
    line-height: 1.8;
  }

  .editable-demo__notes code {
    padding: 0 4px;
    border-radius: 3px;
    background: var(--mu-bg-stripe);
    font-family: monospace;
  }
</style>
