<template>
  <demo-page
    path="data/table-ex-benchmark"
    wide>
    <demo-section
      title="基准舞台"
      note="MuTableEx 挂载区；场景/规模切换经 :key 重挂载取全新几何控制器——mode 只升不降，替换列路径无法回到 uniform，短路类场景须新实例测首次 relayout"
      wide>
      <div class="bm-stage">
        <mu-table-ex
          :key="runKey"
          ref="canvasTableRef"
          key-field="id"
          :columns="stageColumns"
          :records="stageRecords"
          striped />
      </div>
      <div class="bm-state">
        <span>场景：{{ scene }}（{{ sceneDef.label }}）</span>
        <span>规模：{{ scaleRows }} 行</span>
        <span>rowGeometryMode：{{ lastRun?.mode ?? '—' }}</span>
        <span>{{ runStatus }}</span>
      </div>
    </demo-section>

    <demo-section
      title="基准控制"
      note="场景 × 规模矩阵（1k / 10k / 100k）；「替换引用」不重挂载，测同实例 props 直替的 relayout 成本；「自动滚动」程序化 scrollToRecord 逐帧采样重绘耗时"
      wide>
      <div class="bm-controls">
        <div class="bm-control">
          <span>场景</span>
          <mu-radio-group
            v-model="scene"
            :disabled="running"
            :options="sceneOptions" />
        </div>

        <div class="bm-control">
          <span>规模</span>
          <mu-radio-group
            v-model="scaleKey"
            :disabled="running"
            :options="scaleOptions" />
        </div>

        <div class="bm-control">
          <mu-button
            caption="重跑当前（重挂载）"
            :disabled="running"
            @click="runCurrent" />
          <mu-button
            caption="替换 records + columns 引用"
            :disabled="running"
            @click="runReferenceSwap" />
          <mu-button
            caption="自动滚动 100 帧"
            :disabled="running"
            @click="runScrollBenchmark" />
          <mu-button
            caption="运行全部场景（4 场景 × 3 规模）"
            :disabled="running"
            @click="runAllScenarios" />
        </div>
      </div>
    </demo-section>

    <demo-section
      title="当前运行指标"
      note="data-metric 锚点供 DOM 断言；耗时单位 ms（performance.now 实测）；「—」= 未运行或组件未就绪"
      wide>
      <div class="bm-metrics">
        <div class="bm-metrics__block">
          <div class="bm-block-title">records 构建 + 首次 relayout（重挂载）</div>
          <div class="bm-kv">
            <span>records 构建</span>
            <span data-metric="buildMs">{{ fmtMs(lastRun?.buildMs) }}</span>
            <span>首次 relayout（估高扫描 + 几何）</span>
            <span data-metric="relayoutMs">{{ fmtMs(lastRun?.relayoutMs) }}</span>
            <span>scanCount</span>
            <span data-metric="scanCount">{{ fmtInt(lastRun?.scanCount) }}</span>
            <span>rebuild</span>
            <span data-metric="rebuild">{{ fmtBool(lastRun?.rebuild) }}</span>
            <span>首绘 paint</span>
            <span data-metric="paintMs">{{ fmtMs(lastRun?.paintMs) }}</span>
            <span>rowGeometryMode</span>
            <span data-metric="mode">{{ lastRun?.mode ?? '—' }}</span>
            <span>端到端（构建 → 挂载 → relayout → paint）</span>
            <span data-metric="totalMs">{{ fmtMs(lastRun?.totalMs) }}</span>
          </div>
        </div>

        <div class="bm-metrics__block">
          <div class="bm-block-title">替换引用（同实例，不重挂载）</div>
          <div class="bm-kv">
            <span>records 重建</span>
            <span data-metric="swapBuildMs">{{ fmtMs(lastRun?.swap?.buildMs) }}</span>
            <span>端到端（替换 → relayout 完成）</span>
            <span data-metric="swapWallMs">{{ fmtMs(lastRun?.swap?.wallMs) }}</span>
            <span>relayout 内部耗时</span>
            <span data-metric="swapRelayoutMs">{{ fmtMs(lastRun?.swap?.relayoutMs) }}</span>
            <span>scanCount</span>
            <span data-metric="swapScanCount">{{ fmtInt(lastRun?.swap?.scanCount) }}</span>
          </div>
        </div>

        <div class="bm-metrics__block">
          <div class="bm-block-title">滚动帧（{{ SCROLL_STEPS }} 步程序化滚动）</div>
          <div class="bm-kv">
            <span>重绘次数</span>
            <span data-metric="scrollPaints">{{ fmtInt(lastRun?.scroll?.paints) }}</span>
            <span>平均 paint 耗时</span>
            <span data-metric="scrollAvgPaintMs">{{ fmtMs(lastRun?.scroll?.avgPaintMs) }}</span>
            <span>最大 paint 耗时</span>
            <span data-metric="scrollMaxPaintMs">{{ fmtMs(lastRun?.scroll?.maxPaintMs) }}</span>
            <span>平均帧间隔（含进窗精算）</span>
            <span data-metric="scrollAvgGapMs">{{ fmtMs(lastRun?.scroll?.avgGapMs) }}</span>
          </div>
        </div>
      </div>
    </demo-section>

    <demo-section
      title="汇总矩阵（场景 × 规模）"
      note="「运行全部场景」逐格重挂载运行并覆盖写入；scanCount 预期：全确定单行列 0（表级短路），其余 = 行数（全量估高，list 走计数通道）"
      wide>
      <mu-table
        class="bm-summary"
        key-field="key"
        :columns="summaryColumns"
        :records="summaryRows" />
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'
  import { MuTableEx } from '../../../../src/components/table/ex/index.js'

  // ---------- 场景定义（7733a6f 首绘优化的对照矩阵） ----------

  const STATUS_MAPPINGS = { active: '启用', pending: '待处理', archived: '已归档' }

  const LONG_TEXT =
    '用于变高列基准的长文本：中英文混排 Latin words 与数字 12345 交替出现，' +
    '字符数足以在当前列宽下折出多行，行高按内容行数增长，进窗精算逐行实测。'

  // 全确定单行列（无 link/list、无 maxLines>1 / multiline 列）：uniform + 无 spans
  // → 表级估高短路成立，首次 relayout scanCount = 0
  function createSingleColumns () {
    return [
      { field: 'checked', type: 'check', width: 48, headerCheckbox: true },
      { caption: '#', type: 'rec_no', width: 56 },
      { caption: '名称', field: 'name', width: 220 },
      { caption: '状态', field: 'status', type: 'enum', width: 90, mappings: STATUS_MAPPINGS },
      { caption: '数量', field: 'count', type: 'number', width: 100 },
      { caption: '日期', field: 'date', type: 'date', width: 110 },
      { caption: '备注', field: 'memo', width: 200 }
    ]
  }

  function createSingleRecords (count) {
    const rows = new Array(count)

    for (let i = 0; i < count; i++) {
      const n = i + 1

      rows[i] = {
        id: n,
        checked: false,
        name: `记录 ${String(n).padStart(6, '0')}`,
        status: ['active', 'pending', 'archived'][i % 3],
        count: (i * 7) % 1000,
        date: `2026-${String((i % 12) + 1).padStart(2, '0')}-01`,
        memo: i % 9 === 0 ? '' : `备注内容 ${n}`
      }
    }

    return rows
  }

  // list 条目列（全行 1–5 条，超过 listOption.max 走 slice 截断）：估高/精算计数
  // 走 render.count 通道（免条目对象构建），首次 relayout 全量扫描 scanCount = 行数
  function createListColumns () {
    return [
      { caption: '#', type: 'rec_no', width: 56 },
      { caption: '名称', field: 'name', width: 200 },
      { caption: '条目', field: 'items', type: 'list', listOption: { max: 4 }, width: 280 },
      { caption: '数量', field: 'count', type: 'number', width: 100 }
    ]
  }

  function createListRecords (count) {
    const rows = new Array(count)

    for (let i = 0; i < count; i++) {
      const n = i + 1
      const entries = new Array((i % 5) + 1)

      for (let j = 0; j < entries.length; j++) {
        entries[j] = j % 2 ? { label: `对象条目 ${n}-${j}` } : `条目 ${n}-${j}`
      }

      rows[i] = { id: n, name: `记录 ${n}`, items: entries, count: (i * 3) % 500 }
    }

    return rows
  }

  // multiline 变高列：variable 模式 + 滚动进窗精算（长短文本混合，行高随内容分化）
  function createMultilineColumns () {
    return [
      { caption: '#', type: 'rec_no', width: 56 },
      { caption: '名称', field: 'name', width: 160 },
      { caption: 'maxLines=3', field: 'memo', maxLines: 3, width: 300 },
      { caption: 'multiline', field: 'note', multiline: true, width: 240 }
    ]
  }

  function createMultilineRecords (count) {
    const rows = new Array(count)

    for (let i = 0; i < count; i++) {
      const n = i + 1

      rows[i] = {
        id: n,
        name: `记录 ${n}`,
        memo: i % 3 === 0 ? LONG_TEXT : `短备注 ${n}`,
        note: i % 4 === 0 ? LONG_TEXT : `短说明 ${n}`
      }
    }

    return rows
  }

  // 混合列集：图形列（check/tag/progress）+ 文本列 + 条目列 + 多行列
  function createMixedColumns () {
    return [
      { field: 'checked', type: 'check', width: 48 },
      { caption: '#', type: 'rec_no', width: 56 },
      { caption: '名称', field: 'name', width: 180 },
      { caption: '标签', field: 'tags', type: 'tag', width: 180 },
      { caption: '进度', field: 'progress', type: 'progress', width: 120 },
      { caption: '条目', field: 'items', type: 'list', listOption: { max: 3 }, width: 220 },
      { caption: '备注', field: 'memo', maxLines: 3, width: 220 }
    ]
  }

  function createMixedRecords (count) {
    const rows = new Array(count)

    for (let i = 0; i < count; i++) {
      const n = i + 1
      const entries = new Array((i % 4) + 1)

      for (let j = 0; j < entries.length; j++) {
        entries[j] = `条目 ${n}-${j}`
      }

      rows[i] = {
        id: n,
        checked: i % 2 === 0,
        name: `记录 ${n}`,
        tags: i % 2 ? [{ caption: '标签A', color: 'green' }, '标签B'] : ['单标签'],
        progress: (i * 7) % 100,
        items: entries,
        memo: i % 5 === 0 ? LONG_TEXT : `备注 ${n}`
      }
    }

    return rows
  }

  const SCENES = {
    single: { label: '全确定单行列', columns: createSingleColumns, records: createSingleRecords },
    list: { label: 'list 条目列', columns: createListColumns, records: createListRecords },
    multiline: { label: 'multiline 变高列', columns: createMultilineColumns, records: createMultilineRecords },
    mixed: { label: '混合列集', columns: createMixedColumns, records: createMixedRecords }
  }

  const SCALE_OPTIONS = [
    { value: '1k', label: '1k 行', rows: 1000 },
    { value: '10k', label: '10k 行', rows: 10000 },
    { value: '100k', label: '100k 行', rows: 100000 }
  ]

  const SCROLL_STEPS = 100
  const SCROLL_BUDGET_MS = 15000

  // ---------- URL 参数（?scene= / ?scale= 白名单，默认 single@100k） ----------

  const sceneParam = new URLSearchParams(location.search).get('scene')
  const scaleParam = new URLSearchParams(location.search).get('scale')

  const scene = ref(sceneParam in SCENES ? sceneParam : 'single')
  const scaleKey = ref(SCALE_OPTIONS.some(s => s.value === scaleParam) ? scaleParam : '100k')

  const sceneDef = computed(() => SCENES[scene.value])
  const scaleRows = computed(() => SCALE_OPTIONS.find(s => s.value === scaleKey.value).rows)

  const sceneOptions = Object.entries(SCENES).map(([value, def]) => ({ value, label: def.label }))
  const scaleOptions = SCALE_OPTIONS.map(({ value, label }) => ({ value, label }))

  // ---------- 舞台状态 ----------

  const canvasTableRef = ref(null)
  const runKey = ref(0)
  const stageRecords = ref([])
  const stageColumns = ref([])
  const running = ref(false)
  const runStatus = ref('（尚未运行）')
  const lastRun = ref(null)
  const summaryRows = ref([])

  // 调试句柄：与组件实例契约同源（getLayoutInfo / scrollToRecord / getCellRect）
  window.__benchTable = { getLayoutInfo: () => null }

  // 初始场景 setup 期预构建（计时计入首跑），首挂载即目标场景，避免一次空表挂载
  const pageStartAt = performance.now()
  let pendingInitial = null

  {
    const def = SCENES[scene.value]
    const startedAt = performance.now()

    stageRecords.value = def.records(scaleRows.value)
    stageColumns.value = def.columns()
    pendingInitial = {
      sceneKey: scene.value,
      rows: scaleRows.value,
      buildMs: performance.now() - startedAt,
      startedAt: pageStartAt
    }
  }

  // ---------- 指标读取 ----------

  // rAF 等帧；隐藏标签页 rAF 暂停时退避定时器兜底（否则等待循环永不迭代）
  function nextFrame () {
    return new Promise(resolve => {
      let settled = false

      const finish = () => {
        if (settled) return
        settled = true
        resolve()
      }

      requestAnimationFrame(finish)
      setTimeout(finish, 32)
    })
  }

  function readLayout () {
    try {
      return canvasTableRef.value?.getLayoutInfo?.() ?? null
    } catch {
      return null
    }
  }

  // 首次 relayout 在 onMounted nextTick 内执行，轮询等 lastRelayout/lastPaint 就位
  async function waitForLayout (isValid, timeout = 4000) {
    const startedAt = performance.now()

    while (performance.now() - startedAt < timeout) {
      await nextFrame()

      const layout = readLayout()

      if (isValid(layout)) return layout
    }

    return null
  }

  function upsertSummary (result) {
    const existing = summaryRows.value.find(row => row.key === result.key)

    if (existing) Object.assign(existing, result)
    else summaryRows.value.push(result)
  }

  // 单次运行：同步构建 records（耗时计入指标）→ 重挂载 → 等首次 relayout → 采样
  async function performRun (sceneKey, rows) {
    const def = SCENES[sceneKey]
    let startedAt
    let buildMs

    if (pendingInitial && pendingInitial.sceneKey === sceneKey && pendingInitial.rows === rows) {
      // 首跑：setup 期已构建并挂载，端到端从页面 setup 起算
      startedAt = pendingInitial.startedAt
      buildMs = pendingInitial.buildMs
      pendingInitial = null
    } else {
      startedAt = performance.now()
      stageRecords.value = def.records(rows)
      buildMs = performance.now() - startedAt

      scene.value = sceneKey
      scaleKey.value = SCALE_OPTIONS.find(s => s.rows === rows)?.value ?? '100k'
      runKey.value++
      stageColumns.value = def.columns()
    }

    const layout = await waitForLayout(l => l?.lastRelayout != null && l?.lastPaint != null)
    const relayout = layout?.lastRelayout ?? null

    lastRun.value = {
      scene: sceneKey,
      rows,
      buildMs,
      relayoutMs: relayout?.elapsed ?? null,
      scanCount: relayout?.scanCount ?? null,
      rebuild: relayout?.rebuild ?? null,
      paintMs: layout?.lastPaint?.elapsed ?? null,
      mode: layout?.rowGeometryMode ?? null,
      totalMs: performance.now() - startedAt,
      swap: null,
      scroll: null
    }

    window.__benchTable = canvasTableRef.value ?? window.__benchTable

    if (layout) {
      upsertSummary({
        key: `${sceneKey}@${rows}`,
        scene: sceneKey,
        rowsText: String(rows),
        buildText: fmtMs(buildMs),
        relayoutText: fmtMs(lastRun.value.relayoutMs),
        scanText: fmtInt(lastRun.value.scanCount),
        rebuildText: fmtBool(lastRun.value.rebuild),
        paintText: fmtMs(lastRun.value.paintMs),
        modeText: lastRun.value.mode ?? '—',
        totalText: fmtMs(lastRun.value.totalMs)
      })
    }

    runStatus.value = layout
      ? `${sceneKey}@${rows} 完成`
      : `${sceneKey}@${rows} 超时（布局未就绪）`

    return layout != null
  }

  async function runCurrent () {
    if (running.value) return

    running.value = true
    runStatus.value = `${scene.value}@${scaleRows.value} 运行中 …`
    await performRun(scene.value, scaleRows.value)
    running.value = false
  }

  async function runAllScenarios () {
    if (running.value) return

    running.value = true

    for (const scale of SCALE_OPTIONS) {
      for (const key of Object.keys(SCENES)) {
        runStatus.value = `运行全部（${key}@${scale.rows}）…`
        await performRun(key, scale.rows)
        await nextFrame()
      }
    }

    runStatus.value = '全部场景完成'
    running.value = false
  }

  // 替换引用（同实例）：records + columns 同 tick 双替换，relayout 源合一 watch
  // 合批为一次 relayout。新鲜度判据用 elapsed 实测浮点逐次不同——getLayoutInfo
  // 每次展开返回新对象，不可用引用判新
  async function runReferenceSwap () {
    if (running.value || !canvasTableRef.value) return

    const before = readLayout()

    if (!before?.lastRelayout) return

    running.value = true
    runStatus.value = '替换 records + columns 引用 …'

    const def = SCENES[scene.value]
    const startedAt = performance.now()
    const buildStartAt = performance.now()

    stageRecords.value = def.records(scaleRows.value)
    const buildMs = performance.now() - buildStartAt

    stageColumns.value = def.columns()

    const layout = await waitForLayout(
      l => l?.lastRelayout != null && l.lastRelayout.elapsed !== before.lastRelayout.elapsed
    )

    if (lastRun.value) {
      lastRun.value.swap = layout
        ? {
            buildMs,
            wallMs: performance.now() - startedAt,
            relayoutMs: layout.lastRelayout.elapsed,
            scanCount: layout.lastRelayout.scanCount
          }
        : null
    }

    runStatus.value = layout ? '替换引用完成' : '替换引用超时'
    running.value = false
  }

  // 滚动测帧：scrollToRecord 触发 scroll → 组件 rAF 合帧重绘 → 本侧 rAF 后注册
  // 同帧后行，采样到重绘后的 lastPaint.elapsed；相邻采样窗口不变视为未重绘跳过。
  // 墙钟预算兜底：隐藏标签页 rAF 暂停 / 定时器节流时提前收束（显示实际步数）
  async function runScrollBenchmark () {
    const instance = canvasTableRef.value

    if (running.value || !instance) return

    running.value = true
    runStatus.value = `自动滚动 ${SCROLL_STEPS} 帧 …`

    const total = stageRecords.value.length
    const base = Math.min(10, Math.max(0, total - 2))
    const stride = Math.max(1, Math.floor((total - base - 1) / SCROLL_STEPS))
    const deadline = performance.now() + SCROLL_BUDGET_MS
    const paintSamples = []
    const gaps = []
    let prevKey = ''
    let prevFrameAt = performance.now()
    let steps = 0

    for (; steps < SCROLL_STEPS; steps++) {
      instance.scrollToRecord(base + 1 + steps * stride)
      await nextFrame()

      if (performance.now() > deadline) {
        steps++
        break
      }

      const now = performance.now()

      gaps.push(now - prevFrameAt)
      prevFrameAt = now

      const paint = readLayout()?.lastPaint

      if (paint) {
        const key = `${paint.rowStart}:${paint.rowEnd}:${paint.elapsed}`

        if (key !== prevKey) {
          prevKey = key
          paintSamples.push(paint.elapsed)
        }
      }
    }

    if (lastRun.value) {
      lastRun.value.scroll = {
        paints: paintSamples.length,
        avgPaintMs: paintSamples.length
          ? paintSamples.reduce((sum, v) => sum + v, 0) / paintSamples.length
          : null,
        maxPaintMs: paintSamples.length ? Math.max(...paintSamples) : null,
        avgGapMs: gaps.length ? gaps.reduce((sum, v) => sum + v, 0) / gaps.length : null
      }
    }

    runStatus.value = `滚动完成（重绘 ${paintSamples.length}/${steps} 步）`
    running.value = false
  }

  // 场景/规模切换即重挂载运行（运行中不响应，控件同步禁用）
  watch([scene, scaleKey], () => {
    if (!running.value) runCurrent()
  })

  // ---------- 汇总矩阵表 ----------

  const summaryColumns = [
    { caption: '场景', field: 'scene', width: 100 },
    { caption: '规模（行）', field: 'rowsText', width: 90, align: 'right' },
    { caption: '构建 ms', field: 'buildText', width: 90, align: 'right' },
    { caption: 'relayout ms', field: 'relayoutText', width: 100, align: 'right' },
    { caption: 'scanCount', field: 'scanText', width: 100, align: 'right' },
    { caption: 'rebuild', field: 'rebuildText', width: 80 },
    { caption: 'paint ms', field: 'paintText', width: 90, align: 'right' },
    { caption: 'mode', field: 'modeText', width: 90 },
    { caption: '端到端 ms', field: 'totalText', width: 100, align: 'right' }
  ]

  // ---------- 格式化 ----------

  function fmtMs (value) {
    return typeof value === 'number' ? value.toFixed(1) : '—'
  }

  function fmtInt (value) {
    return Number.isFinite(value) ? String(value) : '—'
  }

  function fmtBool (value) {
    return value == null ? '—' : String(value)
  }

  onMounted(async () => {
    window.__benchTable = canvasTableRef.value ?? window.__benchTable
    await performRun(scene.value, scaleRows.value)
  })
</script>

<style>
  .bm-stage {
    height: 420px;
    border: 1px solid var(--mu-border-color-normal);
    background: var(--mu-bg-normal);
  }

  .bm-state {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;

    margin-top: 12px;

    font-size: var(--mu-font-size-small);
    color: var(--mu-text-color-muted);
  }

  .bm-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .bm-control {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: var(--mu-font-size-small);
  }

  .bm-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    align-items: start;
  }

  .bm-metrics__block {
    padding: 10px;
    border: 1px solid var(--mu-border-color-soft);
    border-radius: 4px;
  }

  .bm-block-title {
    margin-bottom: 8px;
    font-weight: 500;
  }

  .bm-kv {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    font-size: var(--mu-font-size-small);
  }

  .bm-kv > span:nth-child(odd) {
    color: var(--mu-text-color-muted);
  }

  .bm-kv > span:nth-child(even) {
    font-family: monospace;
  }

  .bm-summary {
    max-height: 420px;
  }
</style>
