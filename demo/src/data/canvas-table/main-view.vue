<template>
  <demo-page path="data/canvas-table" fluid>
    <demo-section
      title="组件舞台"
      note="MuCanvasTable 挂载区（G0 为占位骨架，S1 接入真实组件）；拖拽右下角手柄调整容器尺寸（宽度与高度两个方向）"
      wide>
      <div
        class="ct-stage"
        :class="{ 'mu-dark': darkOnRoot }"
        :style="stageStyle">
        <mu-canvas-table
          ref="canvasTableRef"
          :class="{ 'mu-dark': darkOnRoot }"
          :style="rowHeightOverride ? { '--row-height': '48px' } : null"
          key-field="id"
          :columns="stageColumns"
          :records="stageRecords"
          :selected-record-key="selectedKey"
          :header-checked="headerChecked"
          :order-by="orderBy"
          :records-offset="recordsOffset"
          :fixed-left-columns="stageFixedColumns"
          :records-version="recordsVersion"
          :editable="editable"
          :resizable="resizable"
          :placeholder="placeholderText"
          :empty-text="emptyText"
          :tree="stageTree"
          :tree-props="treePropsBind"
          :tree-expanded-keys="treeExpandedKeys"
          :default-expand-level="defaultExpandLevel"
          striped
          @header-click="onHeaderClick"
          @cell-click="onCellClick"
          @cell-item-click="onCellItemClick"
          @update:header-checked="onHeaderChecked"
          @update:cell-value="onCellValueChange"
          @update:selected-record="onSelectedRecord"
          @update:selected-record-key="onSelectedKeyChange"
          @update:order-by="onOrderByChange"
          @update:tree-expanded-keys="onTreeExpandedKeys"
          @column-resize="onColumnResize">
          <template v-if="emptyVariant === 'slot'" #empty>
            <div class="ct-empty-slot">自定义空态（#empty 插槽）</div>
          </template>
        </mu-canvas-table>
        <div
          class="ct-resize-handle"
          title="拖拽调整容器尺寸"
          @pointerdown="onStageResizeStart" />
      </div>
    </demo-section>

    <demo-section
      title="夹具控制"
      note="测试计划全部夹具与调试入口：数据规模、空态三变体、可编辑/调宽开关、受控绑定、引用替换、异步变更、主题覆盖与实例方法"
      wide>
      <div class="ct-controls">
        <div class="ct-control">
          <span>夹具场景</span>
          <mu-radio-group
            v-model="scene"
            :options="[
              { value: 'default', label: '默认' },
              { value: 'tree', label: '树' },
              { value: 'multiline', label: '多行文本' },
              { value: 'items', label: '条目/新列型' },
              { value: 'widths', label: '全类型默认宽' },
              { value: 'fixed', label: '固定列组合' },
              { value: 'narrow', label: '窄列' }
            ]" />
        </div>

        <div class="ct-control">
          <span>数据规模</span>
          <mu-radio-group
            v-model="dataScale"
            :options="[
              { value: 'full', label: '100000 行' },
              { value: 'few', label: '3 行' },
              { value: 'empty', label: '空（records=[]）' }
            ]" />
        </div>

        <div class="ct-control">
          <span>空态定制</span>
          <mu-radio-group
            v-model="emptyVariant"
            :options="[
              { value: 'none', label: '无' },
              { value: 'slot', label: '#empty 插槽' },
              { value: 'text', label: 'emptyText' }
            ]" />
        </div>

        <div class="ct-control">
          <span>editable</span>
          <mu-switch v-model="editable" />
        </div>

        <div class="ct-control">
          <span>resizable</span>
          <mu-switch v-model="resizable" />
        </div>

        <div class="ct-control">
          <span>placeholder 占位文本</span>
          <mu-switch v-model="placeholderOn" />
        </div>

        <div class="ct-control">
          <span>--row-height 覆盖（48px，refreshTheme 后生效）</span>
          <mu-switch v-model="rowHeightOverride" />
        </div>

        <div class="ct-control">
          <span>根字号覆盖（18px，refreshTheme 后生效）</span>
          <mu-switch v-model="fontSizeOverride" />
        </div>

        <div class="ct-control">
          <span>mu-dark 挂组件根</span>
          <mu-switch v-model="darkOnRoot" />
        </div>

        <div class="ct-control">
          <span>fixedLeftColumns</span>
          <mu-input
            v-model="fixedLeftInput"
            class="ct-input--number"
            placeholder="0" />
        </div>

        <div class="ct-control">
          <span>recordsOffset</span>
          <mu-input
            v-model="recordsOffsetInput"
            class="ct-input--number"
            placeholder="0" />
        </div>

        <div class="ct-control">
          <span>树开关（仅树场景）</span>
          <mu-switch v-model="treeOn" />
        </div>

        <div class="ct-control">
          <mu-button caption="切换 treeProps 字段名" @click="onToggleTreeProps" />
        </div>

        <div class="ct-control">
          <span>defaultExpandLevel</span>
          <mu-input
            v-model="defaultExpandLevelInput"
            class="ct-input--number"
            placeholder="0" />
        </div>

        <div class="ct-control">
          <mu-button caption="expandAll()" @click="onExpandAll" />
          <mu-button caption="collapseAll()" @click="onCollapseAll" />
        </div>

        <div class="ct-control">
          <span>scrollToRecord</span>
          <mu-input
            v-model="scrollToInput"
            class="ct-input--number"
            placeholder="记录 id 或行号" />
          <mu-button caption="跳转" @click="onScrollToRecord" />
        </div>

        <div class="ct-control">
          <mu-button caption="替换 columns（引用变化）" @click="onReplaceColumns" />
        </div>

        <div class="ct-control">
          <mu-button caption="异步改 records[0].memo + recordsVersion++" @click="onAsyncMutate" />
        </div>

        <div class="ct-control">
          <mu-button caption="refreshTheme()" @click="onRefreshTheme" />
        </div>
      </div>

      <div class="ct-state">
        <span>orderBy：{{ orderBy || '（空）' }}</span>
        <span>headerChecked.checked：{{ headerChecked.checked }}</span>
        <span>recordsVersion：{{ recordsVersion }}</span>
        <span>场景：{{ scene }}{{ scene === 'tree' ? (stageTree ? '（树开）' : '（树关）') : '' }}</span>
        <span>treeProps：{{ scene === 'tree' ? JSON.stringify(treePropsBind) : '—' }}</span>
        <span>展开节点数：{{ treeExpandedKeys?.length ?? '（未受控）' }}</span>
        <span>平铺行数：{{ debugFlatRowsLength ?? '—' }}</span>
        <span>舞台尺寸：{{ stageWidth }} × {{ stageHeight }}</span>
      </div>
    </demo-section>

    <demo-section
      title="DOM 版 mu-table 参照"
      note="同列定义、同数据源（当前数据规模的前 20 行），供像素/视觉并排比对（A4/A7）；下表为 link 对象数组 + color 列 DOM 回归段（link.js/link.scss 改动，评审 6 P1）"
      wide>
      <mu-table
        class="ct-reference-table"
        :columns="columns"
        :records="referenceRecords"
        :header-checked="headerChecked"
        key-field="id"
        style="max-height: 320px"
        @update:header-checked="onHeaderChecked"
        @update:cell-value="onCellValueChange" />
      <mu-table
        class="ct-reference-table"
        :columns="linkReferenceColumns"
        :records="linkReferenceRecords"
        key-field="id"
        style="max-height: 220px; margin-top: 12px" />
    </demo-section>

    <demo-section
      title="调试面板"
      note="自检结果（self-checks 各模块断言 + 数据生成器断言）/ 重绘计数与 lastPaint 统计 / 主题快照；实例接入（S1）前统计显示为占位"
      wide>
      <div class="ct-debug">
        <div class="ct-debug__block ct-self-checks">
          <div class="ct-debug__header">
            <span>自检结果（{{ selfCheckSummary.passed }}/{{ selfCheckSummary.total }} 通过）</span>
            <mu-button caption="重跑自检" @click="runSelfChecks" />
          </div>
          <ul class="ct-check-list">
            <li
              v-for="result in selfCheckResults"
              :key="result.module + '/' + result.name"
              class="ct-check-item"
              :class="result.passed ? 'ct-check-item--pass' : 'ct-check-item--fail'">
              <span class="ct-check-item__mark">{{ result.passed ? '✓' : '✗' }}</span>
              <span class="ct-check-item__module">[{{ result.module }}]</span>
              <span class="ct-check-item__name">{{ result.name }}</span>
              <span class="ct-check-item__detail">{{ result.passed ? result.detail : result.error }}</span>
            </li>
            <li v-if="!selfCheckResults.length" class="ct-check-item">（尚无自检结果）</li>
          </ul>
        </div>

        <div class="ct-debug__block ct-paint-stats">
          <div class="ct-debug__header">
            <span>重绘统计（每 200ms 轮询实例）</span>
          </div>
          <div class="ct-kv">
            <span>实例状态</span>
            <span>{{ debugStats.available ? '已接入' : '未接入（S1）' }}</span>
            <span>重绘计数</span>
            <span>{{ debugStats.available ? debugStats.repaintCount : '—' }}</span>
            <span>lastPaint</span>
            <span class="ct-kv__code">{{ lastPaintText }}</span>
            <span>lastRelayout</span>
            <span class="ct-kv__code">{{ lastRelayoutText }}</span>
          </div>
        </div>

        <div class="ct-debug__block ct-theme-snapshot">
          <div class="ct-debug__header">
            <span>主题快照</span>
            <mu-button caption="打印主题快照" @click="onPrintThemeSnapshot" />
          </div>
          <pre class="ct-snapshot">{{ themeSnapshotText }}</pre>
        </div>
      </div>
    </demo-section>

    <demo-section
      title="事件日志"
      note="记录组件全部 emit（header-click / cell-click / update:* / column-resize），最新在上，上限 200 条"
      wide
      vertical>
      <div class="ct-debug__header">
        <span>共 {{ eventLogs.length }} 条</span>
        <mu-button caption="清空日志" @click="eventLogs.length = 0" />
      </div>
      <ol class="ct-event-log">
        <li v-for="log in eventLogs" :key="log.seq" class="ct-event-log__item">
          <span class="ct-event-log__seq">#{{ log.seq }}</span>
          <span class="ct-event-log__name">{{ log.name }}</span>
          <span class="ct-event-log__detail">{{ log.detail }}</span>
        </li>
        <li v-if="!eventLogs.length" class="ct-event-log__item">（组件接入后此处记录事件）</li>
      </ol>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'
  import { runChecks } from './self-checks/index.js'

  // S1：真实组件本地接入（相对路径，不依赖 S2 全局注册；见 02-design.md S1 行）
  import { MuCanvasTable } from '../../../../src/components/canvas-table/index.js'
  // 调试句柄用：与组件同参重算平铺行数（树场景状态展示/e2e 断言入口）
  import { buildChildrenIndex, buildFlatRows } from '../../../../src/components/canvas-table/tree.js'

  // ---------- 调试句柄（契约见 02-design.md 改动清单 demo 行） ----------
  // 组件挂载前为占位对象（getCellRect 返回 null 防误用抛错）；onMounted 起替换为
  // 组件实例（defineExpose：scrollToRecord / refreshTheme / getLayoutInfo /
  // getThemeSnapshot / getCellRect）。
  window.__canvasTable = {
    getCellRect: () => null
  }

  const canvasTableRef = ref(null)

  // ---------- 数据生成器（10 万行，确定性取值，供自检断言） ----------
  const RECORD_COUNT = 100000

  const STATUS_MAPPINGS = {
    active: '启用',
    pending: '待处理',
    archived: '已归档',
    default: '未知'
  }
  const STATUS_KEYS = ['active', 'pending', 'archived']

  function createRecords (count = RECORD_COUNT) {
    const records = new Array(count)

    for (let i = 0; i < count; i++) {
      const n = i + 1
      records[i] = {
        id: n,
        name: `记录 ${String(n).padStart(6, '0')}`,
        status: STATUS_KEYS[i % STATUS_KEYS.length],
        count: (i * 7) % 1000,
        amount: Math.round(((i * 13.37) % 10000) * 100) / 100,
        date: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        memo: i % 9 === 0 ? '' : `备注内容 ${n}`,
        active: i % 2 === 0,
        checked: false,
        level: (i % 3) + 1,
        empty: null
      }
    }

    return records
  }

  const records = ref(createRecords())

  // ---------- 列定义（A4 全部用例列 + decisions「[I1 前]②」夹具列） ----------
  function createDefaultColumns () {
    return [
      {
        field: 'checked',
        type: 'check',
        width: 48,
        headerCheckbox: true,
        // check disabled 夹具（id%10===0 禁用翻转，CheckColumn.disabled → attrs.disabled）
        disabled: record => record.id % 10 === 0
      },
      { caption: '#', type: 'rec_no', width: '56px' },
      { caption: '名称', field: 'name', sortable: true, minWidth: 80 },
      {
        caption: '状态',
        field: 'status',
        type: 'enum',
        width: 100,
        sortable: true,
        mappings: STATUS_MAPPINGS,
        editable: true,
        editor: true
      },
      {
        caption: '数量',
        field: 'count',
        type: 'number',
        width: 100,
        sortable: true,
        editable: true,
        editor: { type: 'input', props: { type: 'number' } }
      },
      { caption: '金额', field: 'amount', type: 'currency', width: 120, editable: true, editor: true },
      { caption: '日期', field: 'date', type: 'date', width: 120, editable: true, editor: true },
      {
        caption: '备注',
        field: 'memo',
        width: 180,
        minWidth: 120,
        maxWidth: 260,
        editable: true,
        editor: {
          validate: value =>
            (String(value).includes('错误') ? '备注不能包含"错误"字样' : true)
        }
      },
      { caption: '启用', field: 'active', type: 'bool', width: 80, editable: true, editor: true },
      { caption: '锁定宽', field: 'level', width: 90, resizable: false },
      { caption: '覆盖文本', field: 'name', width: 150, text: record => `文本:${record.name}` },
      { caption: 'value 字符串', field: 'extra', width: 110, value: '固定值' },
      { caption: '空值占位', field: 'empty', width: 120 }
    ]
  }

  function createAlternateColumns () {
    return [
      { field: 'checked', type: 'check', width: 48, headerCheckbox: true },
      { caption: '#', type: 'rec_no', width: '56px' },
      { caption: '名称（替换后）', field: 'name', width: 220, sortable: true },
      { caption: '数量（替换后）', field: 'count', type: 'number', width: 140 },
      { caption: '备注（替换后）', field: 'memo', width: 240 }
    ]
  }

  const columns = ref(createDefaultColumns())
  const columnsReplaced = ref(false)

  function onReplaceColumns () {
    columns.value = columnsReplaced.value ? createDefaultColumns() : createAlternateColumns()
    columnsReplaced.value = !columnsReplaced.value
  }

  // ---------- 夹具场景数据（G3：树 / 多行 / 条目新列型 / 全类型默认宽 / 固定列组合） ----------

  const LONG_TEXT =
    '这是一段用于验证自动换行与 maxLines 钳制的长文本：中英文混排 Latin words 与数字 12345 交替出现，' +
    '字符数足以在当前列宽下折出多行，超出 maxLines 时末行收缩显示省略号，行高按内容行数增长。'

  // 树场景：1 万节点平铺（2000 根 × 4 叶）+ 前 4 根的深层子树（defaultExpandLevel 边界用）；
  // 同时写 pid / parentId 两套字段名（treeProps 切换控件用）
  function createTreeRecords () {
    const rows = []

    for (let i = 1; i <= 2000; i++) {
      rows.push({
        id: i,
        pid: null,
        parentId: null,
        name: `根节点 ${i}`,
        count: (i * 7) % 900,
        date: `2026-${String((i % 12) + 1).padStart(2, '0')}-01`,
        memo: i % 40 === 0 ? LONG_TEXT : `根节点备注 ${i}`
      })
    }

    for (let i = 0; i < 8000; i++) {
      const rootId = Math.floor(i / 4) + 1
      const id = 10001 + i

      rows.push({
        id,
        pid: rootId,
        parentId: rootId,
        name: `叶子节点 ${id}`,
        count: (i * 11) % 900,
        date: `2026-06-${String((i % 27) + 1).padStart(2, '0')}`,
        memo: `叶子备注 ${i}`
      })
    }

    // 深层子树：根 1 → 90001 → 90002/90003（defaultExpandLevel 2 断言用）
    rows.push({ id: 90001, pid: 1, parentId: 1, name: '深层节点 90001', count: 1, date: '2026-03-03', memo: '深层备注' })
    rows.push({ id: 90002, pid: 90001, parentId: 90001, name: '深层节点 90002', count: 2, date: '2026-03-03', memo: '深层备注' })
    rows.push({ id: 90003, pid: 90001, parentId: 90001, name: '深层节点 90003', count: 3, date: '2026-03-03', memo: '深层备注' })

    return rows
  }

  const treeRecords = createTreeRecords()

  const treeColumns = [
    { caption: '名称（树形列）', field: 'name', treeNode: true, width: 240, sortable: true },
    // 树形列长文本组合：树缩进扣减内容宽后折行（行高 e2e，实施约束 6）
    { caption: '长文本', field: 'memo', maxLines: 3, width: 220, editable: true, editor: true },
    { caption: '数量', field: 'count', type: 'number', width: 100 },
    { caption: '日期', field: 'date', type: 'date', width: 110 }
  ]

  // 多行文本场景：maxLines 变体 / 数组值（数字与字符串）/ maxItems / DOM 风格
  // multiline+lineClamp 兼容（含函数形态，评审 6 P6）
  const multilineRecords = [
    {
      id: 1,
      name: 'deep 记录',
      deep: true,
      long3: LONG_TEXT,
      long10: LONG_TEXT,
      strings: ['甲', '乙', '丙', '丁', '戊'],
      nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      legacy: '函数 lineClamp 按 record 求值：deep 记录显示三行，超出部分末行收缩省略。'.repeat(4)
    },
    {
      id: 2,
      name: 'shallow 记录',
      deep: false,
      long3: LONG_TEXT,
      long10: '短文本单行',
      strings: ['只有一行'],
      nums: [3.14, 42],
      legacy: 'shallow 记录按求值仅一行（单行省略）。'
    },
    {
      id: 3,
      name: '超限数组',
      deep: false,
      long3: '短文本',
      long10: LONG_TEXT,
      strings: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
      nums: [1, 2],
      legacy: '常量 multiline（lineClamp 缺省 10 行上限）。'.repeat(10)
    }
  ]

  const multilineColumns = [
    { caption: '名称', field: 'name', width: 130 },
    { caption: 'maxLines=3', field: 'long3', maxLines: 3, width: 220, editable: true, editor: true },
    { caption: 'maxLines=10', field: 'long10', maxLines: 10, width: 220 },
    { caption: '字符串数组 maxItems=3', field: 'strings', maxItems: 3, width: 140 },
    { caption: '数字数组', field: 'nums', width: 110 },
    {
      caption: 'multiline+lineClamp(函数)',
      field: 'legacy',
      multiline: true,
      lineClamp: record => (record.deep ? 3 : 1),
      width: 220
    }
  ]

  // 条目/新列型场景：link 三态（字符串数组/对象数组/单值数字）+ 超限 dots、
  // 彩色 tag、progress（记录级色）、button（彩色/disabled）
  const itemRecords = [
    {
      id: 1,
      name: '字符串数组',
      count: 120,
      links: ['Mussel 文档', 'GitHub 仓库', '更新日志'],
      tags: [{ caption: '新品', color: 'green' }, '热门', { caption: '置顶', color: 'blue' }],
      progress: 30,
      progressColor: 'success',
      buttons: [{ caption: '编辑' }, { caption: '删除', color: 'red' }]
    },
    {
      id: 2,
      name: '对象数组',
      count: 456,
      links: [
        { caption: '主色链接', color: 'primary' },
        { caption: '危险链接', danger: true },
        { caption: '禁用链接', disabled: true },
        { caption: '青色链接', color: 'teal' }
      ],
      tags: [{ caption: 'V4', color: 'violet' }, { caption: 'LTS', color: 'orange' }],
      progress: 75,
      progressColor: 'warning',
      buttons: [{ caption: '详情', color: 'indigo' }, { caption: '禁用', disabled: true }]
    },
    {
      id: 3,
      name: '单值数字',
      count: 789,
      links: 12345,
      tags: '单标签',
      progress: 100,
      progressColor: 'primary',
      buttons: [{ caption: '唯一' }]
    },
    {
      id: 4,
      name: '超限 dots',
      count: 24,
      links: Array.from({ length: 12 }, (_, i) => `链接 ${i + 1}`),
      tags: Array.from({ length: 12 }, (_, i) => `标签 ${i + 1}`),
      progress: 50,
      progressColor: 'danger',
      buttons: [{ caption: 'A' }, { caption: 'B' }, { caption: 'C', color: 'grape' }]
    }
  ]

  const itemColumns = [
    { caption: '名称', field: 'name', width: 120 },
    {
      caption: '链接（三态）',
      field: 'links',
      type: 'link',
      width: 170,
      editable: true,
      editor: true
    },
    { caption: '标签（彩色）', field: 'tags', type: 'tag', width: 210 },
    {
      caption: '进度',
      field: 'progress',
      type: 'progress',
      width: 130,
      progressOption: record => ({ color: record.progressColor, showText: true })
    },
    { caption: '按钮', field: 'buttons', type: 'button', width: 180, buttons: record => record.buttons }
  ]

  // 全类型默认宽场景：全部列不配 width（A3.2 类型感知双值基线，含 bool 与无 type 列）
  const widthRecords = [
    {
      id: 1,
      name: '无 type 文本列',
      count: 123,
      amount: 45.6,
      status: 'active',
      date: '2026-10-25',
      datetime: '2026-10-25 08:30:00',
      active: true,
      links: '默认宽链接',
      tags: ['默认', '宽度'],
      progress: 66,
      buttons: [{ caption: '操作' }],
      img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    },
    {
      id: 2,
      name: '第二行记录',
      count: 456,
      amount: 78.9,
      status: 'pending',
      date: '2026-11-01',
      datetime: '2026-11-01 23:59:59',
      active: false,
      links: ['链接一', '链接二'],
      tags: '单标签',
      progress: 20,
      progressColor: 'teal',
      buttons: [{ caption: '查看', color: 'cyan' }]
    }
  ]

  const widthColumns = [
    { field: 'checked', type: 'check', headerCheckbox: true },
    { caption: '#', type: 'rec_no' },
    { caption: '文本（无 type）', field: 'name' },
    { caption: '数量', field: 'count', type: 'number' },
    { caption: '金额', field: 'amount', type: 'currency' },
    { caption: '状态', field: 'status', type: 'enum', mappings: STATUS_MAPPINGS },
    { caption: '日期', field: 'date', type: 'date' },
    { caption: '日期时间', field: 'datetime', type: 'datetime' },
    { caption: '启用', field: 'active', type: 'bool' },
    { caption: '链接', field: 'links', type: 'link' },
    { caption: '标签', field: 'tags', type: 'tag' },
    { caption: '进度', field: 'progress', type: 'progress' },
    { caption: '按钮', field: 'buttons', type: 'button' },
    { caption: '图片', field: 'img', type: 'img' },
    { caption: '自定义类型', field: 'name', type: { render: () => ({ text: '自定义渲染' }) } }
  ]

  // 固定列组合场景：fixedLeftColumns=2，link 在固定区、button 在滚动区（双 pass 命中 e2e）。
  // records 复用 itemRecords（含 count 字段——数量列数据源，verify-1 失败项 2 补 NaN 修复）
  const fixedColumns = [
    { caption: 'ID', field: 'id', width: 70 },
    { caption: '固定链接', field: 'links', type: 'link', width: 160 },
    { caption: '名称', field: 'name', width: 320 },
    { caption: '标签', field: 'tags', type: 'tag', width: 200 },
    { caption: '数量', field: 'count', type: 'number', width: 100 },
    {
      caption: '按钮（滚动区）',
      field: 'buttons',
      type: 'button',
      width: 190,
      buttons: record => record.buttons
    }
  ]

  // 窄列场景（R1/测试计划 #16①）：全部列显式定宽、ΣcolWidths = 576 ≈ 60% 舞台宽
  // （960，可拖 grip 调整）——行背景充满视口右缘断言的 e2e 载体（striped 恒开，
  // 组件根属性）；列不配 editor，点击只选中不开编辑（选中行底色断言用）。
  // records 复用默认数据源（name/count 字段）
  const narrowColumns = [
    { caption: '#', type: 'rec_no', width: 56 },
    { caption: '名称', field: 'name', width: 280 },
    { caption: '数量', field: 'count', type: 'number', width: 240 }
  ]

  // DOM 版 link 对象数组 + color 回归段（link.js/link.scss 改动的 DOM 侧 e2e，评审 6 P1）
  const linkReferenceColumns = [
    { caption: '名称', field: 'name', width: 130 },
    { caption: '链接（对象数组 + color）', field: 'links', type: 'link' }
  ]

  const linkReferenceRecords = [
    {
      id: 1,
      name: '主色/红色',
      links: [{ caption: '主色链接', color: 'primary' }, { caption: '红色链接', color: 'red' }]
    },
    {
      id: 2,
      name: 'danger/disabled',
      links: [{ caption: '危险链接', danger: true }, { caption: '禁用链接', disabled: true }]
    },
    {
      id: 3,
      name: 'teal/lime',
      links: [{ caption: '青色链接', color: 'teal' }, { caption: '青柠链接', color: 'lime' }]
    }
  ]

  // ---------- 受控状态（headerChecked / orderBy / 选中） ----------
  const headerChecked = ref({ checked: false })
  const orderBy = ref('')
  const selectedKey = ref(null)

  // 展示型排序：父级按 orderBy（'field:asc' | 'field:desc' | ''）执行实际排序
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

  // ---------- 夹具状态 ----------
  const dataScale = ref('full') // full | few | empty
  const scene = ref('default') // default | tree | multiline | items | widths | fixed
  const emptyVariant = ref('none') // none | slot | text
  const editable = ref(true)
  const resizable = ref(true)
  const placeholderOn = ref(false)
  const rowHeightOverride = ref(false)
  const fontSizeOverride = ref(false)
  const darkOnRoot = ref(false)
  const fixedLeftInput = ref('0')
  const recordsOffsetInput = ref('0')
  const scrollToInput = ref('')
  const recordsVersion = ref(0)

  // 树场景受控状态（A2.4）：treeExpandedKeys 初始 null = 非受控（组件按
  // defaultExpandLevel 首开解析）；箭头点击后进入受控
  const treeOn = ref(true)
  const treePropsAlternate = ref(false)
  const defaultExpandLevelInput = ref('1')
  const treeExpandedKeys = ref(null)

  const fixedLeftColumns = computed(() => Math.max(0, Number(fixedLeftInput.value) || 0))
  const recordsOffset = computed(() => Math.max(0, Number(recordsOffsetInput.value) || 0))
  const placeholderText = computed(() => (placeholderOn.value ? '待填写' : ''))
  const emptyText = computed(() => (emptyVariant.value === 'text' ? '暂无数据（emptyText）' : ''))

  const displayRecords = computed(() => {
    if (dataScale.value === 'empty') return []
    if (dataScale.value === 'few') return sortedRecords.value.slice(0, 3)
    return sortedRecords.value
  })

  // —— 场景接线（列/记录/树 props 按夹具场景切换） ——

  const stageTree = computed(() => scene.value === 'tree' && treeOn.value)

  const treePropsBind = computed(() =>
    treePropsAlternate.value
      ? { key: 'id', parentKey: 'parentId' }
      : { key: 'id', parentKey: 'pid' }
  )

  const defaultExpandLevel = computed(() => {
    const n = Number(defaultExpandLevelInput.value)

    return Number.isFinite(n) ? n : 0
  })

  const stageColumns = computed(() => {
    switch (scene.value) {
      case 'tree': return treeColumns
      case 'multiline': return multilineColumns
      case 'items': return itemColumns
      case 'widths': return widthColumns
      case 'fixed': return fixedColumns
      case 'narrow': return narrowColumns
      default: return columns.value
    }
  })

  const stageRecords = computed(() => {
    switch (scene.value) {
      case 'tree': return treeRecords
      case 'multiline': return multilineRecords
      case 'items':
      case 'fixed': return itemRecords
      case 'widths': return widthRecords
      default: return displayRecords.value
    }
  })

  // 固定列组合场景强制固定区 ≥ 2（link 在固定区、button 在滚动区）
  const stageFixedColumns = computed(() =>
    scene.value === 'fixed' ? Math.max(2, fixedLeftColumns.value) : fixedLeftColumns.value
  )

  // 平铺行数（调试/e2e）：与组件同参重算（展开集优先取组件实例受控回读）
  const debugFlatRowsLength = computed(() => {
    if (!stageTree.value) return null

    const keys = treeExpandedKeys.value ?? window.__canvasTable?.getTreeExpandedKeys?.() ?? []
    const props = treePropsBind.value
    const childrenIndex = buildChildrenIndex(treeRecords, {
      keyOf: record => record?.[props.key],
      parentKeyOf: record => record?.[props.parentKey]
    })

    return buildFlatRows(treeRecords, {
      keyOf: record => record?.[props.key],
      parentKeyOf: record => record?.[props.parentKey],
      expandedKeys: new Set(keys),
      childrenIndex
    }).rows.length
  })

  function onToggleTreeProps () {
    treePropsAlternate.value = !treePropsAlternate.value
    logEvent('treeProps 切换', treePropsBind.value)
  }

  function onTreeExpandedKeys (keys) {
    treeExpandedKeys.value = keys
    logEvent('update:tree-expanded-keys', { count: keys.length, keys: keys.slice(0, 8) })
  }

  function onExpandAll () {
    window.__canvasTable?.expandAll?.()
    logEvent('expandAll（调试按钮）')
  }

  function onCollapseAll () {
    window.__canvasTable?.collapseAll?.()
    logEvent('collapseAll（调试按钮）')
  }

  function onCellItemClick (payload) {
    logEvent('cell-item-click', payload)
  }

  // DOM 版参照：同列定义、同数据源前 20 行（10 万行 DOM 全量渲染不可行，取视口对齐子集）
  const referenceRecords = computed(() => displayRecords.value.slice(0, 20))

  // ---------- 舞台尺寸与主题覆盖 ----------
  const stageWidth = ref(960)
  const stageHeight = ref(420)

  const stageStyle = computed(() => {
    const style = { width: `${stageWidth.value}px`, height: `${stageHeight.value}px` }

    // --row-height 覆盖须落在组件根（.mu-canvas-table 自身声明 --row-height: 36px，
    // 父容器内联会被组件根的类声明覆盖，与 DOM 版 .mu-table 同语义），经 :style 绑在标签上
    if (fontSizeOverride.value) style['font-size'] = '18px'

    return style
  })

  function onStageResizeStart (e) {
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = stageWidth.value
    const startHeight = stageHeight.value

    const onMove = ev => {
      stageWidth.value = Math.max(320, startWidth + ev.clientX - startX)
      stageHeight.value = Math.max(200, startHeight + ev.clientY - startY)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ---------- 事件日志 ----------
  const MAX_LOG_COUNT = 200
  const eventLogs = ref([])
  let logSeq = 0

  function summarizePayload (payload) {
    if (payload == null) return ''

    return JSON.stringify(payload, (key, value) => {
      if (key === 'record' && value && typeof value === 'object') return `#${value.id}`
      if (key === 'column' && value && typeof value === 'object') {
        return value.field ?? value.type ?? '(列)'
      }
      return value
    })
  }

  function logEvent (name, payload) {
    eventLogs.value.unshift({ seq: ++logSeq, name, detail: summarizePayload(payload) })

    if (eventLogs.value.length > MAX_LOG_COUNT) eventLogs.value.length = MAX_LOG_COUNT
  }

  // ---------- 组件事件处理器（S1 起接线；update:cell-value 就地改 record，见 A3 数据契约） ----------
  function onHeaderClick (column) {
    logEvent('header-click', { column })
  }

  function onCellClick (payload) {
    logEvent('cell-click', payload)
  }

  function onHeaderChecked (column, checked) {
    headerChecked.value.checked = checked

    // 批量就地改记录后经 recordsVersion 通道通知重绘（A3 数据契约②）
    records.value.forEach(record => {
      record.checked = checked
    })
    recordsVersion.value++

    logEvent('update:header-checked', { column, value: checked })
  }

  function onCellValueChange ({ record, recordIndex, column, value }) {
    record[column.field] = value

    if (column.type === 'check' && !value) headerChecked.value.checked = false

    logEvent('update:cell-value', { record, recordIndex, field: column.field, value })
  }

  function onSelectedRecord (record) {
    logEvent('update:selected-record', { record })
  }

  function onSelectedKeyChange (key) {
    selectedKey.value = key
    logEvent('update:selected-record-key', key)
  }

  function onOrderByChange (value) {
    orderBy.value = value
    logEvent('update:order-by', value)
  }

  function onColumnResize ({ column, width }) {
    logEvent('column-resize', { column, width })
  }

  // ---------- recordsVersion 异步变更夹具 ----------
  function onAsyncMutate () {
    setTimeout(() => {
      const target = records.value[0]
      target.memo = `异步修改 ${Date.now() % 1000}`
      recordsVersion.value++

      logEvent('recordsVersion++（异步就地改 records[0].memo）', {
        record: target,
        recordsVersion: recordsVersion.value
      })
    }, 300)
  }

  // ---------- 实例方法调试入口 ----------
  function onScrollToRecord () {
    const raw = scrollToInput.value.trim()
    if (raw === '') return

    const key = /^\d+$/.test(raw) ? Number(raw) : raw
    const instance = window.__canvasTable

    if (typeof instance?.scrollToRecord === 'function') instance.scrollToRecord(key)

    logEvent('scrollToRecord（调试按钮）', key)
  }

  function onRefreshTheme () {
    const instance = window.__canvasTable

    if (typeof instance?.refreshTheme === 'function') instance.refreshTheme()

    pollDebugPanel()
    logEvent('refreshTheme（调试按钮）')
  }

  function onPrintThemeSnapshot () {
    pollDebugPanel()
    logEvent('打印主题快照（调试按钮）')
  }

  // ---------- 调试面板：重绘统计 / 主题快照（轮询实例，未接入时显示占位） ----------
  const debugStats = ref({ available: false, repaintCount: 0, lastPaint: null, lastRelayout: null })
  const themeSnapshotText = ref('（组件实例未就绪：S1 接入后显示主题快照）')

  let lastPaintKey = ''
  let statsTimer = 0

  const lastPaintText = computed(() =>
    debugStats.value.lastPaint ? JSON.stringify(debugStats.value.lastPaint) : '—')

  const lastRelayoutText = computed(() =>
    debugStats.value.lastRelayout ? JSON.stringify(debugStats.value.lastRelayout) : '—')

  function readInstance () {
    const instance = window.__canvasTable

    let layout = null
    let snapshot = null

    try {
      layout = typeof instance?.getLayoutInfo === 'function' ? instance.getLayoutInfo() : null
      snapshot =
        typeof instance?.getThemeSnapshot === 'function' ? instance.getThemeSnapshot() : null
    } catch {
      layout = null
      snapshot = null
    }

    return { layout, snapshot }
  }

  function pollDebugPanel () {
    const { layout, snapshot } = readInstance()

    const lastPaint = layout?.lastPaint ?? null

    if (lastPaint) {
      const key = JSON.stringify(lastPaint)

      if (key !== lastPaintKey) {
        lastPaintKey = key
        debugStats.value.repaintCount++
      }
    }

    debugStats.value.available = layout != null
    debugStats.value.lastPaint = lastPaint
    debugStats.value.lastRelayout = layout?.lastRelayout ?? null

    const text = snapshot ? JSON.stringify(snapshot, null, 2) : ''
    if (text && text !== themeSnapshotText.value) themeSnapshotText.value = text
  }

  // ---------- 自检（模块断言 + 数据生成器断言） ----------
  const selfCheckResults = ref([])

  const selfCheckSummary = computed(() => {
    const total = selfCheckResults.value.length
    const passed = selfCheckResults.value.filter(result => result.passed).length

    return { total, passed, failed: total - passed }
  })

  const dataChecks = [
    {
      name: '数据生成器：生成 100000 行',
      fn: () => {
        const rows = records.value

        if (!Array.isArray(rows) || rows.length !== RECORD_COUNT) {
          throw new Error(`实际行数 ${rows?.length} ≠ ${RECORD_COUNT}`)
        }

        return `${RECORD_COUNT} 行`
      }
    },
    {
      name: '数据生成器：keyField(id) 唯一且从 1 连续递增',
      fn: () => {
        const rows = records.value
        const first = rows[0]
        const last = rows[rows.length - 1]

        if (first.id !== 1 || last.id !== RECORD_COUNT) {
          throw new Error(`首行 id=${first.id}，末行 id=${last.id}`)
        }

        return `首行 #${first.id}，末行 #${last.id}`
      }
    },
    {
      name: '数据生成器：字段齐全且取值域正确（抽样首/中/末行）',
      fn: () => {
        const rows = records.value
        const fields = [
          'id', 'name', 'status', 'count', 'amount',
          'date', 'memo', 'active', 'checked', 'level', 'empty'
        ]
        const sampleIndexes = [0, Math.floor(rows.length / 2), rows.length - 1]

        for (const i of sampleIndexes) {
          const record = rows[i]

          for (const field of fields) {
            if (!(field in record)) throw new Error(`行 ${i} 缺字段 ${field}`)
          }

          if (!(record.status in STATUS_MAPPINGS)) {
            throw new Error(`行 ${i} status=${record.status} 不在 mappings 取值域`)
          }

          if (record.empty !== null) throw new Error(`行 ${i} empty 应为 null（空值占位列）`)
        }

        return `抽样 ${sampleIndexes.length} 行（#1 / #${sampleIndexes[1] + 1} / #${rows.length}）`
      }
    },
    {
      name: 'DOM 版参照数据：同数据源前 20 行',
      fn: () => {
        const rows = referenceRecords.value

        if (rows.length !== Math.min(20, displayRecords.value.length)) {
          throw new Error(`参照行数 ${rows.length} 与预期不符`)
        }

        return `${rows.length} 行`
      }
    }
  ]

  function runSelfChecks () {
    selfCheckResults.value = runChecks(dataChecks)
  }

  onMounted(() => {
    // S1：组件实例就位，整体替换 G0 占位对象（04-impl-G0.md 偏离 3 契约）
    window.__canvasTable = canvasTableRef.value ?? window.__canvasTable

    runSelfChecks()
    pollDebugPanel()
    statsTimer = setInterval(pollDebugPanel, 200)
  })

  onUnmounted(() => {
    clearInterval(statsTimer)
  })
</script>

<style>
  .ct-stage {
    position: relative;
    border: 1px solid var(--mu-border-color-normal);
    background: var(--mu-bg-normal);
  }

  .ct-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .ct-resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
  }

  /* 右下三角 grip（R1/人工 3 意见 3）：视觉挂 ::after 伪元素——clip-path 若直接
     挂元素本体会同步裁剪指针命中区（16×16 方形缩为三角形），伪元素方案视觉与
     命中区解耦；色仍取 --mu-* 变量，透明度 0.5 不变 */
  .ct-resize-handle::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--mu-primary-color);
    opacity: 0.5;
    clip-path: polygon(100% 0, 100% 100%, 0 100%);
  }

  .ct-empty-slot {
    padding: 24px;
    color: var(--mu-text-color-subtle);
  }

  .ct-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 20px;
    align-items: center;
  }

  .ct-control {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: var(--mu-font-size-small);
  }

  .ct-input--number {
    width: 130px;
  }

  .ct-state {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin-top: 12px;
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .ct-debug {
    display: grid;
    grid-template-columns: minmax(320px, 1.2fr) minmax(260px, 1fr) minmax(260px, 1fr);
    gap: 16px;
    align-items: start;
  }

  .ct-debug__block {
    padding: 10px;
    border: 1px solid var(--mu-border-color-soft);
    border-radius: 4px;
  }

  .ct-debug__header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .ct-check-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--mu-font-size-small);
  }

  .ct-check-item {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: baseline;
  }

  .ct-check-item--pass .ct-check-item__mark {
    color: var(--mu-success-color);
  }

  .ct-check-item--fail .ct-check-item__mark {
    color: var(--mu-danger-color);
  }

  .ct-check-item__module {
    color: var(--mu-text-color-muted);
  }

  .ct-check-item__detail {
    color: var(--mu-text-color-muted);
  }

  .ct-check-item--fail .ct-check-item__detail {
    color: var(--mu-danger-color);
  }

  .ct-kv {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    font-size: var(--mu-font-size-small);
  }

  .ct-kv > span:nth-child(odd) {
    color: var(--mu-text-color-muted);
  }

  .ct-kv__code {
    font-family: monospace;
    word-break: break-all;
  }

  .ct-snapshot {
    max-height: 220px;
    margin: 0;
    overflow: auto;
    font-family: monospace;
    font-size: var(--mu-font-size-small);
    white-space: pre-wrap;
  }

  .ct-event-log {
    max-height: 260px;
    margin: 0;
    padding: 0;
    overflow: auto;
    list-style: none;
    font-family: monospace;
    font-size: var(--mu-font-size-small);
  }

  .ct-event-log__item {
    display: flex;
    gap: 10px;
    padding: 2px 0;
  }

  .ct-event-log__seq {
    flex: none;
    color: var(--mu-text-color-muted);
  }

  .ct-event-log__name {
    flex: none;
    font-weight: 500;
  }

  .ct-event-log__detail {
    color: var(--mu-text-color-muted);
    word-break: break-all;
  }
</style>
