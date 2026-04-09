<template>
  <div>
    <h2>
      TABLE
      <theme-switch />
    </h2>

    <div class="group">
      <h3>Simple</h3>
      <mu-table
        :columns="columns"
        :records="records"
        :records-offset="offset"
        :selected-record-key="selectedId"
        :header-checked-1="headerChecked"
        :order-by="orderByOption"
        :fixed-left-columns="3"
        key-field="userId"
        table-width="fit-content"
        table-min-width="100%"
        hover-mode="cross"
        gridlines="column"
        striped
        placeholder="-"
        @header-click="onHeaderClick"
        @cell-click="onCellClick"
        @cell-item-click="onCellItemClick"
        @update:header-checked="onHeaderCheckedChange"
        @update:cell-value="onCellValueChange"
        @update:selected-record-key="selectedId = $event" />
      <mu-pagination
        class="mu-table__footer"
        small
        quick-jumper
        :offset="offset"
        :limit="limit"
        :data-count="1000"
        :page-size1="pageSize"
        :page-size-options1="[20, 50, 100, 100]"
        @update:offset="offset = $event"
        @update:limit="limit = $event" />
    </div>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { faker } from '@faker-js/faker'
  import ThemeSwitch from '../common/theme-switch.vue'

  const offset = ref(0)
  const limit = ref(50)
  const pageSize = ref(50)
  const selectedId = ref(null)
  const orderByOption = ref('username')
  const headerChecked = ref({ checked: false })

  // --- 模拟数据 ---
  function createRandomUser () {
    return {
      checked: false,
      userId: faker.string.uuid(),
      username: faker.internet.username(),
      gender: faker.person.sex(),
      isVip: faker.datatype.boolean(),
      email: faker.internet.email(),
      avatar: faker.image.avatar(),
      Assets: faker.finance.amount({ min: 1000, max: 999999, dec: 2 }),
      birthdate: faker.date.birthdate(),
      registeredAt: faker.date.past(),
      tags: faker.lorem.words().split(' '),
      memo: faker.lorem.paragraphs().split('\n')
    }
  }

  const records = ref(faker.helpers.multiple(createRandomUser, { count: 100 }))

  const columns = ref([
    {
      caption: '#',
      type: 'rec_no'
    },
    {
      field: 'checked',
      type: 'check',
      disabled: false,
      headerCheckbox: true
    },
    {
      id: 'userName',
      caption: 'User Name 用户名称',
      width: '200px',
      field: 'username',
      sortable: true,
      type: 'tag'
    },
    {
      caption: 'VIP',
      width: '80px',
      type: 'bool',
      field: 'isVip',
      mappings: { true: 'YES', false: 'NO' },
      sortable: true
    },
    {
      caption: 'Gender',
      width: '70px',
      type: 'enum',
      field: 'gender',
      mappings: {
        male: { text: '公', style: { color: 'var(--mu-indigo)' } },
        female: { text: '母', style: { color: 'var(--mu-pink)' } }
      }
    },
    {
      caption: 'Avatar',
      class: 'avatar',
      field: 'avatar',
      width: '60px',
      type: 'img'
    },
    {
      caption: 'Assets',
      field: 'Assets',
      width: '150px',
      type: 'currency'
    },
    {
      caption: 'Email',
      width: '200px',
      field: 'email',
      type: 'link',
      placeholder: '-',
      title: true
    },
    {
      caption: 'Birthdate',
      width: '120px',
      field: 'birthdate',
      type: 'date',
      sortable: true
    },
    {
      caption: 'Registered At',
      width: '150px',
      field: 'registeredAt',
      type: 'datetime'
    },
    {
      caption: 'Tags',
      type: 'tag',
      field: 'tags',
      width: '200px',
      tagOption: { pill: true, flat: true }
    },
    {
      caption: 'Memo',
      width: 'auto',
      minWidth: '50px',
      field: 'memo',
      type: 'link',
      placeholder: '-',
      title: true,
      linkOption: { class: 'block text-ellipsis', max: 2 }
    },
    {
      caption: 'Operate',
      width: '160px',
      type: 'link',
      align: 'center',
      links: (rec) => [
        { caption: 'MODIFY', disabled: rec.username.includes('x') },
        { caption: 'REMOVE', danger: true, disabled: rec.username.includes('y') }
      ]
    },
    {
      caption: 'Language',
      width: '160px',
      type: 'tag',
      align: 'center',
      tags: [
        { caption: '中文', color: 'primary' },
        { caption: 'English', color: 'violet' }
      ],
      tagOption: { pill: true, flat: true }
    }
  ])

  // --- 事件处理 ---
  const onHeaderClick = (column) => {
    if (!column.sortable) return

    const [oldField, oldDirection] = (orderByOption.value || '').split(' ')

    orderByOption.value =
      column.field === oldField && oldDirection !== 'desc'
        ? `${column.field} desc`
        : column.field
  }

  const onHeaderCheckedChange = (column, checked) => {
    headerChecked.value.checked = checked
    records.value.forEach((el) => { el.checked = checked })
  }

  const onCellClick = ({ record, column }) => {
    console.log('cell-click', column.type, column.field && record[column.field])
  }

  const onCellValueChange = ({ record, column, value }) => {
    if (column.type !== 'check') return

    record[column.field] = value
    if (!value) headerChecked.value[column.field] = false
  }

  const onCellItemClick = ({ record, column, link, tag }) => {
    const item = link || tag
    if (item) console.log('cell-item-click', item.caption)
  }

  // --- 排序 ---
  watch(orderByOption, () => {
    const [field, direction] = (orderByOption.value || '').split(' ')

    if (field) {
      records.value = records.value.sort((a, b) => {
        const va = a[field]
        const vb = b[field]

        return direction === 'desc'
          ? (vb.localeCompare ? vb.localeCompare(va) : (va === vb ? 0 : va > vb ? -1 : 1))
          : (va.localeCompare ? va.localeCompare(vb) : (va === vb ? 0 : va > vb ? 1 : -1))
      })
    }
  }, { immediate: true })
</script>

<style>
  .mu-table {
    min-height: 500px;
    max-height: 800px;
  }

  .avatar {
    width: auto;
    min-width: 100px;
  }

  .avatar > img {
    max-height: 100px;
  }
</style>
