<template>
  <demo-page path="data/table">
    <demo-section
      title="基础用法"
      note="columns 定义列（field 取值、caption 表头、width 列宽），records 提供行数据，key-field 指定行键"
      :code="basicCode"
      wide>
      <mu-table
        :columns="basicColumns"
        :records="records"
        key-field="id" />
    </demo-section>

    <demo-section
      title="列类型"
      :note="columnTypesNote"
      wide>
      <mu-table
        :columns="typeColumns"
        :records="records"
        key-field="id" />
    </demo-section>

    <demo-section
      title="list 列 / text.link"
      note="list 列仅接受数组值：元素按文本行渲染、全条目可点击；column 级 link:true 整列 link 渲染（全 text 或全 link）；text 列 link:true 链色渲染"
      :code="listCode"
      wide>
      <mu-table
        :columns="listColumns"
        :records="listRecords"
        key-field="id"
        placeholder="-"
        @cell-item-click="logItemClick('list 全 text 列')($event)" />
      <span class="demo-log">cell-item-click 日志：{{ listClickLog || '（点击 list 条目后记录）' }}</span>

      <mu-table
        :columns="listLinkColumns"
        :records="listLinkRecords"
        key-field="id"
        style="margin-top: 12px"
        @cell-item-click="logItemClick('list 全 link 列')($event)" />
      <span class="demo-log">list 全 link 列点击日志：{{ listLinkClickLog || '（点击 list 条目后记录）' }}</span>

      <mu-table
        :columns="textLinkColumns"
        :records="textLinkRecords"
        key-field="id"
        style="margin-top: 12px" />

      <mu-table
        :columns="compatColumns"
        :records="compatRecords"
        key-field="id"
        style="margin-top: 12px"
        @cell-item-click="logItemClick('link 兼容列')($event)" />
      <span class="demo-log">link 兼容列点击日志：{{ compatClickLog || '（点击 link 条目后记录）' }}</span>
    </demo-section>

    <demo-section
      title="button 列"
      note="column.buttons 数组或函数定义按钮 { caption, icon, color, disabled }（文本优先）；color 仅 4 色名；column.link: true 整列 link 形态"
      wide>
      <mu-table
        :columns="buttonColumns"
        :records="buttonRecords"
        key-field="id"
        @cell-item-click="logButtonClick('button 列')($event)" />
      <span class="demo-log">cell-item-click 日志：{{ buttonClickLog || '（点击按钮后记录）' }}</span>

      <mu-table
        :columns="buttonLinkColumns"
        :records="buttonRecords"
        key-field="id"
        style="margin-top: 12px"
        @cell-item-click="logButtonClick('链接按钮列')($event)" />
      <span class="demo-log">链接按钮列点击日志：{{ buttonLinkClickLog || '（点击按钮后记录）' }}</span>
    </demo-section>

    <demo-section
      title="显示映射 mappings / options"
      note="text / number / bool 列 mappings 映射显示（未命中落 default 再回退原值），options 数组自动转换为映射，与 mu-table-ex 同语义"
      :code="mappingCode"
      wide>
      <mu-table
        :columns="mappingColumns"
        :records="records"
        key-field="id" />
    </demo-section>

    <demo-section
      title="样式"
      note="gridlines 为 none / all / row / column，striped 斑马纹，hover-mode 为 none / row / column / cross / cell">
      <mu-table
        :columns="basicColumns"
        :records="records"
        key-field="id"
        gridlines="column"
        striped
        hover-mode="cross"
        style="max-height: 400px" />
    </demo-section>

    <demo-section
      title="排序"
      note="列设 sortable 后点击表头触发 header-click，orderBy 格式为 'field' 或 'field desc'，排序逻辑由外部实现"
      wide>
      <mu-table
        :columns="sortColumns"
        :records="sortedRecords"
        :order-by="orderBy"
        key-field="id"
        @header-click="onHeaderClick" />
    </demo-section>

    <demo-section
      title="行选中"
      note="selected-record-key 绑定选中行键，点击行触发 update:selected-record-key">
      <mu-table
        :columns="basicColumns"
        :records="records"
        :selected-record-key="selectedId"
        key-field="id"
        style="max-height: 320px"
        @update:selected-record-key="selectedId = $event" />
      <span class="demo-log">选中行 id：{{ selectedId ?? '无' }}</span>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="空数据显示占位、placeholder 替换空值、disabled 链接不可点、text 列数组值落占位（不再按元素拆行/序列化）"
      regression
      vertical>
      <mu-table
        :columns="basicColumns"
        :records="[]"
        style="max-height: 200px" />
      <mu-table
        :columns="linkColumns"
        :records="sparseRecords"
        key-field="id"
        placeholder="-"
        style="max-height: 240px" />
      <mu-table
        :columns="arrayTextColumns"
        :records="arrayTextRecords"
        key-field="id"
        placeholder="-"
        style="max-height: 160px" />
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const columnTypesNote =
    'type 指定列渲染器：text / rec_no / bool / enum / date / datetime / number / currency / link / list / tag / img / icon / button；' +
    'enum 已废弃（兼容保留，控制台输出迁移警告），bool 缺省按 locale 显示 是/Yes'
  const basicCode = `<mu-table :columns="columns" :records="records" key-field="id" />

const columns = [
  { caption: '名称', field: 'name', width: '160px' },
  { caption: '数量', field: 'count', width: '80px' }
]`

  const mappingCode = `<mu-table :columns="columns" :records="records" key-field="id" />

const columns = [
  // mappings：值 → 显示文本，未命中落 default 再回退原值
  { caption: '性别', field: 'gender', mappings: { male: '男', female: '女', default: '未知' } },
  // bool 列同样支持（键为 'true' / 'false'）
  { caption: '状态', field: 'active', type: 'bool', mappings: { true: '启用', false: '停用' } },
  // options 数组自动转换为映射（与 mu-select 同口径），未命中原值显示
  { caption: '数量', field: 'count', type: 'number', options: [{ value: 30, label: '高' }, { value: 12, label: '低' }] }
]`

  const selectedId = ref(null)
  const orderBy = ref('')

  const records = [
    { id: 1, name: 'Alice', count: 30, active: true, gender: 'female', birthday: '1992-05-14', registeredAt: '2023-03-01 09:30:00', amount: 1234.5, email: 'alice@example.com', tags: ['admin', 'vip'], avatar: 'https://dummyimage.com/48x48/228be6/ffffff&text=A', icon: 'clock', missing: '' },
    { id: 2, name: 'Bob', count: 12, active: false, gender: 'male', birthday: '1988-11-02', registeredAt: '2022-07-15 14:00:00', amount: 987.65, email: 'bob@example.com', tags: ['editor'], avatar: 'https://dummyimage.com/48x48/40c057/ffffff&text=B', icon: 'calendar', missing: '' },
    { id: 3, name: 'Carol', count: 88, active: true, gender: 'female', birthday: '1995-08-23', registeredAt: '2024-01-20 11:20:00', amount: 22000, email: 'carol@example.com', tags: ['admin', 'editor'], avatar: 'https://dummyimage.com/48x48/fab005/ffffff&text=C', icon: 'sun', missing: '' },
    { id: 4, name: 'Dave', count: 5, active: false, gender: 'male', birthday: '2001-02-09', registeredAt: '2024-06-08 16:45:00', amount: 45.2, email: 'dave@example.com', tags: [], avatar: 'https://dummyimage.com/48x48/e64980/ffffff&text=D', missing: '' },
    { id: 5, name: 'Erin', count: 47, active: true, gender: 'female', birthday: '1990-12-30', registeredAt: '2021-11-11 08:05:00', amount: 5300.1, email: 'erin@example.com', tags: ['viewer', 'vip'], avatar: 'https://dummyimage.com/48x48/7950f2/ffffff&text=E', icon: 'moon', missing: '' }
  ]

  const basicColumns = [
    { caption: '#', type: 'rec_no', width: '56px' },
    { caption: '名称', field: 'name', width: '160px', sortable: true },
    { caption: '数量', field: 'count', width: '100px', sortable: true }
  ]

  const typeColumns = [
    { caption: '文本', field: 'name', width: '100px' },
    { caption: '布尔', field: 'active', width: '80px', type: 'bool', mappings: { true: '启用', false: '停用' } },
    { caption: '枚举', field: 'gender', width: '80px', type: 'enum', mappings: { male: { text: '男', style: { color: 'var(--mu-indigo)' } }, female: { text: '女', style: { color: 'var(--mu-pink)' } } } },
    { caption: '日期', field: 'birthday', width: '120px', type: 'date' },
    { caption: '时间', field: 'registeredAt', width: '170px', type: 'datetime' },
    { caption: '数值', field: 'count', width: '90px', type: 'number' },
    { caption: '金额', field: 'amount', width: '120px', type: 'currency' },
    { caption: '链接', field: 'email', width: '180px', type: 'link' },
    { caption: '标签', field: 'tags', width: '160px', type: 'tag', tagOption: { pill: true, flat: true } },
    { caption: '图像', field: 'avatar', width: '64px', type: 'img' },
    // icon 列（20261105-table-ex-icon-column）：value = icons 注册名（内置 svg 名）；
    // title: true 挂原生 tooltip（显示注册名）；第 4 行空值落占位
    { caption: '图标', field: 'icon', width: '80px', type: 'icon', title: true },
    { caption: '图标（color/size）', field: 'icon', width: '130px', type: 'icon', color: 'primary', iconOption: { size: 20 } },
    { caption: '空值', field: 'missing', width: '90px', placeholder: '-' }
  ]

  const mappingColumns = [
    { caption: '名称', field: 'name', width: '130px' },
    { caption: '性别', field: 'gender', width: '90px', mappings: { male: '男', female: '女', default: '未知' } },
    { caption: '状态', field: 'active', width: '100px', type: 'bool', mappings: { true: '启用', false: '停用' } },
    { caption: '数量', field: 'count', width: '110px', type: 'number', options: [{ value: 30, label: '高' }, { value: 12, label: '低' }] }
  ]

  const sortColumns = [
    { caption: '名称', field: 'name', width: '200px', sortable: true },
    { caption: '数量', field: 'count', width: '120px', sortable: true },
    { caption: '邮箱', field: 'email', width: '220px' }
  ]

  const linkColumns = [
    { caption: '名称', field: 'name', width: '160px' },
    {
      caption: '操作',
      width: '160px',
      type: 'link',
      align: 'center',
      links: rec => [
        { caption: 'MODIFY', disabled: rec.id === 2 },
        { caption: 'REMOVE' }
      ]
    }
  ]

  // —— list 列 / text.link（20261104-table-column-type） ——

  const listCode = `<mu-table :columns="columns" :records="records" key-field="id" @cell-item-click="..." />

const columns = [
  // list 列仅接受数组值，元素默认按文本行渲染（整列全 text）
  { caption: '条目', field: 'items', type: 'list', listOption: { max: 6 } },
  // 列级 link: true 整列 link 渲染（条目色 color 控制，缺省 primary）
  { caption: '链接', field: 'links', type: 'list', link: true },
  // text 列 link:true 按链色渲染，颜色由 color 控制（缺省 primary）
  { caption: '链接', field: 'url', link: true, color: 'teal' }
]`

  // 全 text 列（无 column.link）：遗留条目级 link 键夹具验证其不参与渲染
  // （人工-1 [1-1] 负向断言：{ label, link: true } 条目仍渲染 span、可点击、无色类）
  const listRecords = [
    {
      id: 1,
      name: '混合条目',
      items: [
        '纯文本项',
        { label: '遗留 link 键项', link: true },
        { label: '附加键项', id: 42, link: true }
      ]
    },
    {
      id: 2,
      name: 'caption 兼容',
      items: [{ caption: '旧键条目' }, { caption: '旧键链接', link: true }]
    },
    {
      id: 3,
      name: '标量值',
      items: '不是数组（落占位）'
    },
    {
      id: 4,
      name: '超限 dots',
      items: Array.from({ length: 12 }, (_, i) => `条目 ${i + 1}`)
    }
  ]

  const listColumns = [
    { caption: '名称', field: 'name', width: '120px' },
    { caption: 'list 全 text 列（max=6）', field: 'items', type: 'list', listOption: { max: 6 }, width: '200px', title: true }
  ]

  // 全 link 列（column 级 link: true，R1 语义迁移）：整列条目 a + text-{color}
  // （缺省 primary、条目 color 覆盖、disabled 置灰、附加键保留）
  const listLinkRecords = [
    {
      id: 1,
      name: '缺省/变体',
      links: [
        '文本项也整列成链',
        { label: '附加键链接', id: 42 },
        { label: 'teal 变体', color: 'teal' },
        { label: '禁用项', disabled: true },
        { label: '危险项', color: 'danger' }
      ]
    },
    {
      id: 2,
      name: 'caption 兼容',
      links: [{ caption: '旧键链接' }]
    },
    {
      id: 3,
      name: '超限 dots',
      links: Array.from({ length: 12 }, (_, i) => ({ label: `链接 ${i + 1}`, color: i % 3 === 0 ? 'teal' : undefined }))
    }
  ]

  const listLinkColumns = [
    { caption: '名称', field: 'name', width: '120px' },
    { caption: 'list 全 link 列（column.link，max=6）', field: 'links', type: 'list', link: true, listOption: { max: 6 }, width: '220px', title: true }
  ]

  const textLinkRecords = [
    { id: 1, name: '缺省 primary', url: '主色链接文本' },
    { id: 2, name: 'color teal', site: '青色链接文本' },
    {
      id: 3,
      name: 'multiline+lineClamp',
      long: '多行链色文本：link 选项与 multiline、lineClamp 组合时逐行保留链色与下划线交互，超出钳制行数末行收缩省略。'.repeat(3)
    }
  ]

  const textLinkColumns = [
    { caption: '名称', field: 'name', width: '140px' },
    { caption: 'text.link（缺省 primary）', field: 'url', link: true, width: '160px' },
    { caption: 'text.link（color teal）', field: 'site', link: true, color: 'teal', width: '160px' },
    { caption: 'multiline link（danger）', field: 'long', link: true, color: 'danger', multiline: true, lineClamp: 2, width: '240px' }
  ]

  // link 兼容列（A7）：type:'link' 内部转换为 list 渲染（共用同一实现代码）；
  // danger:true → color danger、对象 color 键激活、disabled 置灰不可点
  const compatRecords = [
    {
      id: 1,
      name: '混合形态',
      links: [
        { caption: '普通链接' },
        { caption: '危险链接', danger: true },
        { caption: '青色链接', color: 'teal' },
        { caption: '禁用链接', disabled: true }
      ]
    },
    { id: 2, name: '单值', links: 12345 }
  ]

  const compatColumns = [
    { caption: '名称', field: 'name', width: '120px' },
    { caption: 'link 兼容列', field: 'links', type: 'link', width: '240px' }
  ]

  const listClickLog = ref('')
  const listLinkClickLog = ref('')
  const compatClickLog = ref('')

  function logItemClick (source) {
    return payload => {
      const text =
        `${source} record.id=${payload.record?.id}` +
        ` column.field=${payload.column?.field}` +
        ` column.caption=${payload.column?.caption}` +
        ` item=${JSON.stringify(payload.item)}`

      if (source === 'list 全 text 列') listClickLog.value = text
      else if (source === 'list 全 link 列') listLinkClickLog.value = text
      else compatClickLog.value = text
    }
  }

  // —— button 列（20261105-column-button-type）：两表同源数据，pill / link 形态各渲染一遍 ——
  // color 夹具覆盖 4 色内（primary/secondary/danger）与超出色 'warning'
  // （canvas 17 色名，MuButton color validator 外 → 回退缺省形态）

  const buttonRecords = [
    {
      id: 1,
      name: '多按钮 / color',
      buttons: [
        { caption: '主色', color: 'primary' },
        { caption: '次色', color: 'secondary' },
        { caption: '危险', color: 'danger' },
        { caption: '超出色回退', color: 'warning' }
      ]
    },
    {
      id: 2,
      name: '禁用 / 图标',
      buttons: [
        { caption: '禁用', disabled: true },
        { icon: 'clock' },
        { caption: '文本优先', icon: 'clock' }
      ]
    }
  ]

  const buttonColumns = [
    { caption: '名称', field: 'name', width: '120px' },
    { caption: '按钮', field: 'buttons', type: 'button', width: '320px', buttons: record => record.buttons }
  ]

  const buttonLinkColumns = [
    { caption: '名称', field: 'name', width: '120px' },
    { caption: '链接按钮', field: 'buttons', type: 'button', link: true, width: '320px', buttons: record => record.buttons }
  ]

  const buttonClickLog = ref('')
  const buttonLinkClickLog = ref('')

  function logButtonClick (source) {
    return payload => {
      const text =
        `${source} record.id=${payload.record?.id}` +
        ` column.field=${payload.column?.field}` +
        ` button=${JSON.stringify(payload.button)}`

      if (source === 'button 列') buttonClickLog.value = text
      else buttonLinkClickLog.value = text
    }
  }

  // text 列数组值回归夹具（A9）：不再按元素拆行/序列化，落占位
  const arrayTextRecords = [
    { id: 1, name: ['数组一', '数组二'], count: [1, 2, 3] }
  ]

  const arrayTextColumns = [
    { caption: '名称（text 数组值）', field: 'name', width: '160px' },
    { caption: '数量（无 type 数组值）', field: 'count', width: '160px' }
  ]

  const sparseRecords = [
    { id: 1, name: 'Alice' },
    { id: 2, name: '' },
    { id: 3, name: 'Carol' }
  ]

  const sortedRecords = computed(() => {
    if (!orderBy.value) return records

    const [field, direction] = orderBy.value.split(' ')

    return [...records].sort((a, b) => {
      const va = a[field]
      const vb = b[field]

      const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va === vb ? 0 : va > vb ? 1 : -1)

      return direction === 'desc' ? -cmp : cmp
    })
  })

  function onHeaderClick (column) {
    if (!column.sortable) return

    const [oldField, oldDirection] = (orderBy.value || '').split(' ')

    orderBy.value =
      column.field === oldField && oldDirection !== 'desc'
        ? `${column.field} desc`
        : column.field
  }
</script>

<style>
  .demo-log {
    font-size: var(--mu-font-size-small);
    color: var(--mu-text-color-muted);
  }
</style>
