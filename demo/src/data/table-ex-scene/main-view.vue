<template>
  <demo-page path="data/table-ex-scene">
    <demo-section
      title="单元格编辑"
      note="editable 开启后单击可编辑格进入编辑（editor:true 缺省 / editor 对象定制）；提交发 update:cell-value，父级就地改后经 recordsVersion 通知"
      wide>
      <mu-table-ex
        :columns="editColumns"
        :records="editRecords"
        :records-version="editVersion"
        key-field="id"
        editable
        @update:cell-value="onEditCommit" />
      <p class="ex-scene__tip">
        最近提交：{{ lastCommit || '（尚无）' }}
      </p>
    </demo-section>

    <demo-section
      title="树模式与 isLeaf 懒加载"
      note="tree + treeNode 列；treeProps.isLeaf 映射后，isLeaf: false 且无子级的节点显示三角，点击发 tree-expand（载荷 { key, record, level }）"
      wide>
      <mu-table-ex
        :columns="treeColumns"
        :records="treeRecords"
        :records-version="treeVersion"
        :tree="true"
        :tree-props="{ key: 'id', parentKey: 'pid', isLeaf: 'isLeaf' }"
        key-field="id"
        @tree-expand="onTreeExpand"
        @tree-collapse="onTreeCollapse" />
      <p class="ex-scene__tip">
        最近树事件：{{ lastTreeEvent || '（点击展开三角触发）' }}；回填 = 就地 push 子级 + recordsVersion++（滚动不复位）
      </p>
    </demo-section>

    <demo-section
      title="合并单元格"
      note="autoRowSpan 按连续同值自动纵向合并（级联分段 + 树父链切断）；spanMethod 手写声明（小计行 colspan: 'rest' 展开到行尾），两者可共存"
      wide>
      <mu-table-ex
        :columns="spanColumns"
        :records="spanRecords"
        :span-method="spanMethod"
        key-field="id" />
    </demo-section>

    <demo-section
      title="异步数据"
      note="records 就地修改不改变引用，组件不感知——改完 recordsVersion++ 通知重算（不必替换数组、不触发滚动复位）；适合轮询 / 增量加载场景"
      wide>
      <mu-button caption="模拟异步增量" @click="onAsyncAppend" />
      <mu-table-ex
        class="ex-scene__async"
        :columns="asyncColumns"
        :records="asyncRecords"
        :records-version="asyncVersion"
        key-field="id" />
      <p class="ex-scene__tip">
        当前 {{ asyncRecords.length }} 行（每次追加 3 行就地 push）
      </p>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'
  import { MuTableEx } from '../../../../src/components/table/ex/index.js'

  // ---------- 单元格编辑 ----------
  const editRecords = ref(
    Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `物料 ${i + 1}`,
      status: ['active', 'pending', 'archived'][i % 3],
      count: (i + 1) * 10,
      memo: i % 2 ? '' : `备注 ${i + 1}`
    }))
  )
  const editVersion = ref(0)
  const lastCommit = ref('')

  const STATUS_MAPPINGS = { active: '启用', pending: '待处理', archived: '已归档', default: '未知' }

  const editColumns = [
    { caption: '名称', field: 'name', width: 140, editable: true, editor: true },
    {
      caption: '状态',
      field: 'status',
      type: 'text',
      width: 110,
      mappings: STATUS_MAPPINGS,
      editable: true,
      editor: true
    },
    { caption: '数量', field: 'count', type: 'number', width: 110, editable: true, editor: { type: 'input', props: { type: 'number' } } },
    { caption: '备注', field: 'memo', width: 220, editable: true, editor: true }
  ]

  function onEditCommit ({ record, column, value }) {
    record[column.field] = value
    editVersion.value++
    lastCommit.value = `#${record.id} ${column.field} → ${JSON.stringify(value)}`
  }

  // ---------- 树 + isLeaf 懒加载 ----------
  // 根 101/102 为 isLeaf: false 无子级（懒节点）：未映射 isLeaf 字段时不显示三角；
  // 映射后显示三角，点击 tree-expand → 异步回填子级（就地 push + recordsVersion++）
  const treeRecords = [
    { id: 101, pid: null, name: '本地下级根（子级已就位）', count: 10, isLeaf: false },
    { id: 1011, pid: 101, name: '子节点 1-1', count: 11 },
    { id: 1012, pid: 101, name: '子节点 1-2', count: 12 },
    { id: 102, pid: null, name: '懒加载根（isLeaf: false 无子级）', count: 20, isLeaf: false },
    { id: 103, pid: null, name: '普通叶根', count: 30 }
  ]
  const treeVersion = ref(0)
  const lastTreeEvent = ref('')
  let lazySeq = 0

  const treeColumns = [
    { caption: '名称（树形列）', field: 'name', treeNode: true, width: 260 },
    { caption: '数量', field: 'count', type: 'number', width: 100 }
  ]

  function onTreeExpand ({ key, record, level }) {
    lastTreeEvent.value = `tree-expand { key: ${key}, level: ${level} }`

    // 懒加载消费范式：isLeaf:false 且未回填过才异步加载；回填就地 push + recordsVersion++
    if (record?.isLeaf !== false) return
    if (treeRecords.some(r => r.pid === key)) return

    setTimeout(() => {
      for (let i = 1; i <= 3; i++) {
        treeRecords.push({
          id: 2001 + lazySeq++,
          pid: key,
          name: `异步子节点 ${i}`,
          count: i * 100
        })
      }

      treeVersion.value++
      lastTreeEvent.value = `tree-expand { key: ${key} } 已回填 3 个子级（recordsVersion++）`
    }, 400)
  }

  function onTreeCollapse ({ key, level }) {
    lastTreeEvent.value = `tree-collapse { key: ${key}, level: ${level} }`
  }

  // ---------- 合并单元格 ----------
  const spanRecords = []
  let spanId = 0

  for (const cat of ['原材料', '成品']) {
    for (const sub of ['A 类', 'B 类']) {
      for (let i = 0; i < 3; i++) {
        spanRecords.push({
          id: ++spanId,
          cat,
          sub,
          name: `${cat}-${sub}-${i + 1}`,
          count: i + 1
        })
      }

      spanRecords.push({
        id: ++spanId,
        cat: null,
        sub: null,
        name: `${cat}/${sub} 小计`,
        count: 6,
        summary: `${cat}/${sub} 小计`,
        isTotal: true
      })
    }
  }

  const spanColumns = [
    { caption: '分类', field: 'cat', width: 100, autoRowSpan: true },
    { caption: '子类', field: 'sub', width: 100, autoRowSpan: true },
    { caption: '名称', field: 'name', width: 160 },
    { caption: '数量', field: 'count', type: 'number', width: 90 },
    { caption: '小计', key: 'summary', field: 'summary', width: 140 },
    { caption: '操作', field: 'name', width: 130, type: 'link' }
  ]

  /** 小计行跨列声明：summary 'rest' 展开到行尾；其余行交给 autoRowSpan */
  function spanMethod ({ record }) {
    return record?.isTotal ? { summary: { colspan: 'rest' } } : null
  }

  // ---------- 异步数据 ----------
  const asyncRecords = ref(
    Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `初始行 ${i + 1}`, count: i }))
  )
  const asyncVersion = ref(0)

  const asyncColumns = [
    { caption: '#', type: 'rec_no', width: 56 },
    { caption: '名称', field: 'name', width: 200 },
    { caption: '数量', field: 'count', type: 'number', width: 100 }
  ]

  function onAsyncAppend () {
    const base = asyncRecords.value.length

    for (let i = 1; i <= 3; i++) {
      asyncRecords.value.push({ id: base + i, name: `增量行 ${base + i}`, count: base + i })
    }

    asyncVersion.value++
  }
</script>

<style>
  .ex-scene__tip {
    margin: 8px 0 0;
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .ex-scene__async {
    margin-top: 12px;
  }
</style>
