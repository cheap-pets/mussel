/**
 * canvas-table 自检断言 — editor 模块（G3）。
 *
 * 覆盖（02-design.md G3 判据 + decisions「[I1 前]①」+ A5.5 规整层 + 评审 6 P6）：
 * 打开（只读判定、value 取值链、编辑器组装、textarea/数组开值）/ 编辑器类型
 * 解析（text/link 按开值形态与 _resolveMaxLines(record) 行级求值判定 textarea）/
 * 值类型规整层（usesDerivedOptions / normalizeEditorOpenValue /
 * normalizeCommitValue：number/currency 三形态、数值枚举类型保持、textarea ④⑤
 * 数组换行分割、对象数组开值取 caption、null 直通、显式 options 原样）/
 * 分类型提交矩阵（input Enter、textarea Ctrl/Cmd+Enter 显式提交且 Enter 换行不提交、
 * select/date/switch 值变化即提交、值变化不重复提交 input）/ 取消 / 校验 /
 * 统一等距内缩矩形定位（A5.4 R1：EDITOR_GAP=4、input/switch/textarea 三类型
 * 同矩形、border/borderless 矩形相同仅 bordered 标记差异、固定列横向滚动
 * 两态对照、变高行 heightAt − 8、theme 不再消费、height 防负值）/ enum options
 * 由 mappings Object 转换为
 * [{value,label}] Array 且排除 default（字符串原值提交仍为 key 字符串、
 * 数值原值类型保持）/ blur 兜底面板判定条件③（焦点或最近 window pointerdown
 * 目标在 .mu-dropdown-panel 内不提交；mu-icon-button 不可聚焦场景）。
 *
 * 说明：blur 兜底的 setTimeout 0 定时器接线为薄封装，自检以纯判定函数
 * resolveBlurFallback + 控制器 pointerdown 记录（getLastPointerdownTarget）
 * 同步断言判定输入；聚焦由组件壳 focusEditor 承担（留浏览器用例）。
 */
import {
  NON_EDITABLE_TYPES,
  EDITOR_COMPONENTS,
  EDITOR_GAP,
  isCellEditable,
  resolveEditorType,
  usesDerivedOptions,
  normalizeEditorOpenValue,
  normalizeCommitValue,
  resolveSelectOptions,
  resolveEditorProps,
  computeEditorStyle,
  isInDropdownPanel,
  resolveBlurFallback,
  createEditorController
} from '@/components/canvas-table/editor.js'
import { createUniformRowGeometry, createVariableRowGeometry } from '@/components/canvas-table/row-geometry.js'
import { MuInput, MuSelect, MuDateInput, MuSwitch } from '@/components/form/index.js'

function assert (cond, message) {
  if (!cond) throw new Error(message)
}

function assertEqual (actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} 期望 ${expected}，实际 ${actual}`)
  }

  return String(actual)
}

function assertArray (actual, expected, label) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)

  if (a !== e) throw new Error(`${label} 期望 ${e}，实际 ${a}`)

  return a
}

/** 创建记录 onCommit 载荷的控制器（自检统一 try/finally destroy） */
function createSpyController () {
  const commits = []

  return {
    commits,
    controller: createEditorController({ onCommit: payload => commits.push(payload) })
  }
}

function eventKeysOf (events) {
  return Object.keys(events).sort()
}

/** 挂载真实 DOM 夹具（blur 兜底判据③），返回卸载函数 */
function mountBlurFixture () {
  const fixture = document.createElement('div')

  fixture.innerHTML = [
    '<div class="ct-fake-editor"><input /></div>',
    '<div class="mu-dropdown-panel"><a class="mu-icon-button"></a></div>',
    '<div class="ct-fake-outside"></div>'
  ].join('')
  document.body.appendChild(fixture)

  return {
    editorEl: fixture.querySelector('.ct-fake-editor'),
    inputEl: fixture.querySelector('input'),
    panelEl: fixture.querySelector('.mu-dropdown-panel'),
    iconButtonEl: fixture.querySelector('.mu-icon-button'),
    outsideEl: fixture.querySelector('.ct-fake-outside'),
    unmount () {
      const active = document.activeElement

      if (active instanceof Element && fixture.contains(active)) active.blur()

      fixture.remove()
    }
  }
}

export const checks = [
  {
    name: '编辑器解析：列类型缺省映射与显式 editor.type 优先（组件身份）、textarea 判定',
    fn: () => {
      // resolveEditorComponent 已随 C3 死代码清理删除；映射断言 = 类型解析 ×
      // EDITOR_COMPONENTS 表（生产消费组合，open 内同款查表）
      const componentOf = column => EDITOR_COMPONENTS[resolveEditorType(column)]

      assertEqual(componentOf({ type: 'text', editor: true }), EDITOR_COMPONENTS.input, 'text → MuInput')
      assertEqual(componentOf({ type: 'number', editor: true }), EDITOR_COMPONENTS.input, 'number → MuInput')
      assertEqual(componentOf({ type: 'currency', editor: true }), EDITOR_COMPONENTS.input, 'currency → MuInput')
      assertEqual(componentOf({ type: 'enum', editor: true }), EDITOR_COMPONENTS.select, 'enum → MuSelect')
      assertEqual(componentOf({ type: 'date', editor: true }), EDITOR_COMPONENTS.date, 'date → MuDateInput')
      assertEqual(componentOf({ type: 'datetime', editor: true }), EDITOR_COMPONENTS.date, 'datetime → MuDateInput')
      assertEqual(componentOf({ type: 'bool', editor: true }), EDITOR_COMPONENTS.switch, 'bool → MuSwitch')
      assertEqual(componentOf({ field: 'x', editor: true }), EDITOR_COMPONENTS.input, '未知列类型回退 input')

      // 显式指定优先；非法显式类型回退列类型映射
      assertEqual(
        componentOf({ type: 'text', editor: { type: 'date' } }),
        EDITOR_COMPONENTS.date,
        '显式 editor.type 优先'
      )
      assertEqual(
        componentOf({ type: 'enum', editor: { type: 'nope' } }),
        EDITOR_COMPONENTS.select,
        '非法显式类型回退映射'
      )

      // textarea 编辑器：原生元素 tag 字符串（INPUT_TYPES.memo 约定，人工 2 意见 2）
      assertEqual(EDITOR_COMPONENTS.textarea, 'textarea', 'textarea 编辑器 = 原生元素 tag')
      assertEqual(componentOf({ type: 'text', editor: { type: 'textarea' } }), 'textarea', '显式 textarea 优先')

      // text 列缺省判定（A5.5）：开值数组 → textarea；_resolveMaxLines(record) 行级
      // 求值 > 1 → textarea（函数形态按 record，评审 6 P6）；单值单行 → input
      assertEqual(
        resolveEditorType({ type: 'text', editor: true }, { rawValue: ['a', 'b'] }),
        'textarea',
        'text 数组开值 → textarea'
      )
      assertEqual(
        resolveEditorType(
          { type: 'text', editor: true, _resolveMaxLines: record => (record.deep ? 3 : 1) },
          { rawValue: '长文本', record: { deep: true } }
        ),
        'textarea',
        '函数 lineClamp 行级求值 deep → textarea'
      )
      assertEqual(
        resolveEditorType(
          { type: 'text', editor: true, _resolveMaxLines: record => (record.deep ? 3 : 1) },
          { rawValue: '短文本', record: { deep: false } }
        ),
        'input',
        '函数 lineClamp 行级求值 shallow → input'
      )
      assertEqual(
        resolveEditorType({ type: 'text', editor: true, _maxLines: 3 }, { rawValue: '文本' }),
        'textarea',
        '_maxLines 常量 > 1 → textarea'
      )
      assertEqual(resolveEditorType({ type: 'text', editor: true }, { rawValue: '文本' }), 'input', 'text 单值单行 → input')
      assertEqual(
        resolveEditorType({ type: 'link', editor: true }, { rawValue: [{ caption: 'a', color: 'red' }] }),
        'textarea',
        'link 对象数组 → textarea'
      )
      // 无 type 列（TextColumn 回退）数组开值 → textarea（A3.5 列分类对齐）
      assertEqual(
        resolveEditorType({ field: 'tags', editor: true }, { rawValue: ['a', 'b'] }),
        'textarea',
        '无 type 列数组开值 → textarea'
      )
      // 显式 editor.type 压过形态判定
      assertEqual(
        resolveEditorType({ type: 'text', editor: { type: 'input' } }, { rawValue: ['a'] }),
        'input',
        '显式 editor.type 优先于形态判定'
      )

      // 组件身份与 form/index.js 导出一致（模板 <component :is> 不依赖全局注册）
      assertEqual(componentOf({ type: 'text', editor: true }), MuInput, 'input 组件 = MuInput 导出')
      assertEqual(componentOf({ type: 'enum', editor: true }), MuSelect, 'select 组件 = MuSelect 导出')
      assertEqual(componentOf({ type: 'date', editor: true }), MuDateInput, 'date 组件 = MuDateInput 导出')
      assertEqual(componentOf({ type: 'bool', editor: true }), MuSwitch, 'switch 组件 = MuSwitch 导出')
      assertEqual(resolveEditorType({ type: 'enum', editor: true }), 'select', 'resolveEditorType')

      return 'input/select/date/switch/textarea 映射与组件身份一致；text/link 形态判定生效'
    }
  },
  {
    name: '只读判定 isCellEditable：表格级/列级/editor 缺失/排除类型；link 本期可编辑',
    fn: () => {
      assert(!isCellEditable({ editable: false, column: { type: 'text', editor: true } }), '表格级 editable=false 应只读')
      assert(!isCellEditable({ editable: true, column: { type: 'text', editor: true, editable: false } }), '列级 editable=false 应只读')
      assert(!isCellEditable({ editable: true, column: { type: 'text' } }), '未配 editor 应只读')
      assert(!isCellEditable({ editable: true, column: null }), 'column 缺失应只读')

      for (const type of NON_EDITABLE_TYPES) {
        assert(!isCellEditable({ editable: true, column: { type, editor: true } }), `类型 ${type} 应只读`)
      }

      // image 为 img 的注册表别名，同样排除
      assert(NON_EDITABLE_TYPES.includes('image'), 'image 别名未排除')
      // link 本期移出排除清单（人工 2 意见 2，A5）
      assert(!NON_EDITABLE_TYPES.includes('link'), 'link 不应再在排除清单')

      assert(isCellEditable({ editable: true, column: { type: 'text', editor: true } }), '可编辑格判定')
      assert(isCellEditable({ editable: true, column: { type: 'enum', editor: { type: 'select' } } }), 'editor 对象形态判定')
      assert(isCellEditable({ editable: true, column: { type: 'link', editor: true } }), 'link 列可编辑')

      return '表格级/列级/editor 缺失/排除类型（rec_no/img/image/tag/check）生效；link 可编辑'
    }
  },
  {
    name: '值类型规整层：usesDerivedOptions / open 规整（select 字符串化、textarea caption 拼接）',
    fn: () => {
      const mappingsColumn = { type: 'enum', editor: true, mappings: { 1: '低' } }
      const explicitColumn = { editor: { type: 'select', props: { options: [{ value: 1, label: 1 }] } } }

      // 派生 options 锚定（显式 options 原样透传 = 范围边界 #14 例外）
      assert(usesDerivedOptions(mappingsColumn, 'select'), 'mappings 派生 options')
      assert(!usesDerivedOptions(explicitColumn, 'select'), '显式 options 非派生')
      assert(!usesDerivedOptions(mappingsColumn, 'input'), '非 select 恒 false')

      // select + 派生：open 字符串化（消除 MuSelect in 隐式转换依赖）；null 直通
      assertEqual(normalizeEditorOpenValue({ column: mappingsColumn, editorType: 'select', value: 1 }), '1', 'select open 字符串化')
      assertEqual(normalizeEditorOpenValue({ column: mappingsColumn, editorType: 'select', value: null }), null, 'select null 直通')

      // textarea：数组开值逐元素取 caption 换行拼接（link 对象数组取 caption、
      // 字符串/数字数组直接元素）；非数组 → String；null → ''
      assertEqual(
        normalizeEditorOpenValue({
          column: { type: 'link', editor: true },
          editorType: 'textarea',
          value: [{ caption: 'A', color: 'red' }, { caption: 'B' }, 'C', 4]
        }),
        'A\nB\nC\n4',
        'textarea 数组开值 caption 拼接'
      )
      assertEqual(
        normalizeEditorOpenValue({ column: { type: 'text', editor: true }, editorType: 'textarea', value: '多行\n文本' }),
        '多行\n文本',
        'textarea 字符串原样'
      )
      assertEqual(
        normalizeEditorOpenValue({ column: { type: 'text', editor: true }, editorType: 'textarea', value: 42 }),
        '42',
        'textarea 数字 String 化'
      )
      assertEqual(
        normalizeEditorOpenValue({ column: { type: 'text', editor: true }, editorType: 'textarea', value: null }),
        '',
        'textarea null → 空串'
      )

      // 其余原样（input 保留 number 原型、date 原样）
      assertEqual(normalizeEditorOpenValue({ column: { type: 'text', editor: true }, editorType: 'input', value: 7 }), 7, 'input 开值原样')

      return '派生锚定 / select 字符串化 / textarea caption 拼接与 String 化 / 其余原样'
    }
  },
  {
    name: '值类型规整层：commit 规整（number/currency 三形态、数值枚举类型保持、textarea ④⑤）',
    fn: () => {
      // ① input + number/currency：null/'' → null（先于 Number() 防 0）；number 原样；
      //    数值串 → number；非数值串保留原字符串（交 validate 拦截）
      assertEqual(normalizeCommitValue({ column: { type: 'number' }, editorType: 'input', rawValue: 5, value: null }), null, 'null → null')
      assertEqual(normalizeCommitValue({ column: { type: 'currency' }, editorType: 'input', rawValue: 5, value: '' }), null, "'' → null")
      assertEqual(normalizeCommitValue({ column: { type: 'number' }, editorType: 'input', rawValue: 5, value: 12.5 }), 12.5, 'number 原样')
      assertEqual(normalizeCommitValue({ column: { type: 'number' }, editorType: 'input', rawValue: 5, value: '12' }), 12, '数值串 → number')
      assertEqual(
        normalizeCommitValue({ column: { type: 'number' }, editorType: 'input', rawValue: 5, value: 'abc' }),
        'abc',
        '非数值串保留（validate 拦截）'
      )

      // ② select + 派生 + 数值原值：类型保持回写 number；null → null；非数值保留
      assertEqual(
        normalizeCommitValue({ column: { type: 'enum' }, editorType: 'select', rawValue: 1, value: '2' }),
        2,
        '数值枚举回写 number'
      )
      assertEqual(
        normalizeCommitValue({ column: { type: 'enum' }, editorType: 'select', rawValue: 1, value: null }),
        null,
        '数值枚举清空 null'
      )
      // 字符串原值枚举：key 字符串原样（原 decisions⑦ 行为对字符串原值不变）
      assertEqual(
        normalizeCommitValue({ column: { type: 'enum' }, editorType: 'select', rawValue: 'a', value: 'b' }),
        'b',
        '字符串枚举 key 原样'
      )

      // ④ textarea + 数组原值：换行分割成数组（元素字符串、空行保留）
      assertArray(
        normalizeCommitValue({ column: { type: 'text' }, editorType: 'textarea', rawValue: ['a', 'b'], value: 'x\n\ny' }),
        ['x', '', 'y'],
        'textarea 数组提交 split'
      )
      // ⑤ textarea + 数字原值：类型保持；清空 null
      assertEqual(
        normalizeCommitValue({ column: { type: 'text' }, editorType: 'textarea', rawValue: 42, value: '43' }),
        43,
        'textarea 数字原值回写 number'
      )
      assertEqual(
        normalizeCommitValue({ column: { type: 'text' }, editorType: 'textarea', rawValue: 42, value: '' }),
        null,
        'textarea 数字原值清空 null'
      )
      assertEqual(
        normalizeCommitValue({ column: { type: 'text' }, editorType: 'textarea', rawValue: '文本', value: 'a\nb' }),
        'a\nb',
        'textarea 字符串原值原样（含换行）'
      )

      // ③ 其余原样（date/switch、显式 options 的 select）
      assertEqual(
        normalizeCommitValue({ column: { type: 'date' }, editorType: 'date', rawValue: '2026-01-01', value: '2026-02-02' }),
        '2026-02-02',
        'date 原样'
      )
      assertEqual(
        normalizeCommitValue({ column: { editor: { type: 'switch' } }, editorType: 'switch', rawValue: false, value: true }),
        true,
        'switch 原样'
      )

      return '三形态收敛 / 数值枚举类型保持 / textarea 数组 split 与数字回转 / 其余原样'
    }
  },
  {
    name: 'enum options：mappings Object → [{value,label}] Array、排除 default（decisions⑦ key 字符串）',
    fn: () => {
      const options = resolveSelectOptions({
        type: 'enum',
        editor: true,
        mappings: {
          active: '启用',
          pending: { text: '待处理', class: 'is-warn' },
          archived: { text: '已归档' },
          default: '未知'
        }
      })

      assert(Array.isArray(options), 'options 应为 Array')
      assertArray(
        options,
        [
          { value: 'active', label: '启用' },
          { value: 'pending', label: '待处理' },
          { value: 'archived', label: '已归档' }
        ],
        'mappings 转换'
      )
      assert(!options.some(option => option.value === 'default'), 'default 兜底映射不应成为可选项')
      assert(options.every(option => typeof option.value === 'string'), 'value 应为 mapping key（字符串）')
      // 数字键经 Object.entries 字符串化（options.value 恒为 mapping key 字符串；
      // 提交值类型规整见 normalizeCommitValue——数值原值回写 number，A5.5 ②）
      assertArray(resolveSelectOptions({ editor: true, mappings: { 1: '低', 2: '高', default: '未知' } }),
        [{ value: '1', label: '低' }, { value: '2', label: '高' }],
        '数字键字符串化')

      // 显式 options 原样透传；无 mappings → 空数组（编辑器照开、下拉为空）
      const explicit = [{ value: 'x', label: 'X' }]
      assertEqual(resolveSelectOptions({ editor: { props: { options: explicit } } }), explicit, '显式 options 原样透传')
      assertArray(resolveSelectOptions({ editor: true }), [], '无 mappings 返回空数组')

      return 'default 排除、对象取 text、value=key 字符串、显式 options 透传、空 mappings → []'
    }
  },
  {
    name: 'resolveEditorProps：number/currency 注入 type=number、props 透传、select options 注入',
    fn: () => {
      const numberProps = resolveEditorProps({ type: 'number', editor: true })

      assertArray(eventKeysOf(numberProps), ['type'], 'number 缺省仅注入 type 键')

      assertEqual(numberProps.type, 'number', 'number 注入 type=number')
      assertEqual(resolveEditorProps({ type: 'currency', editor: true }).type, 'number', 'currency 注入 type=number')

      // 显式 editor.type 不注入（用户 props 优先）；显式 props 原样透传
      const textProps = resolveEditorProps({ type: 'text', editor: { props: { placeholder: 'P', clearable: true } } })

      assertArray(
        eventKeysOf(textProps),
        ['clearable', 'placeholder'],
        'text 编辑器不注入缺省键'
      )
      assertEqual(textProps.placeholder, 'P', 'props 透传')

      // select：options 缺省注入 resolveSelectOptions 产物；显式 options 不被覆盖
      const selectProps = resolveEditorProps({
        type: 'enum',
        editor: true,
        mappings: { a: 'A', default: '兜底' }
      })

      assertArray(selectProps.options, [{ value: 'a', label: 'A' }], 'select 注入 options')

      const explicitOptions = [{ value: 1, label: 1 }]
      const explicitSelectProps = resolveEditorProps({ editor: { type: 'select', props: { options: explicitOptions } } })

      assertEqual(explicitSelectProps.options, explicitOptions, '显式 options 不被覆盖')

      // demo 数量列场景：显式 editor.type=input + props.type=number 组合原样保留
      const explicitInputProps = resolveEditorProps({ type: 'number', editor: { type: 'input', props: { type: 'number' } } })

      assertEqual(explicitInputProps.type, 'number', '显式 props.type 保留')

      return 'number/currency 注入、显式 props/options 优先、select options 注入全部生效'
    }
  },
  {
    name: '统一等距内缩矩形 computeEditorStyle：三类型同矩形、两态同矩形、固定列对照、theme 不再消费（A5.4 R1）',
    fn: () => {
      // C4 起 rowGeometry 必传：等高基线经 uniform 几何构造（36×3）
      const base = {
        colLefts: [0, 100, 300],
        colWidths: [100, 200, 80],
        headHeight: 36,
        theme: { cellPadding: 8, cellLineHeight: 18 },
        rowGeometry: createUniformRowGeometry({ rowHeight: 36, rowCount: 3 }),
        editorType: 'input',
        border: true
      }

      // EDITOR_GAP 导出值 = 4（painter hover 描边单一事实源，A5.3）
      assertEqual(EDITOR_GAP, 4, 'EDITOR_GAP 导出值')

      // 统一矩形：left/top = 格原点 + 4、width/height = 格宽高 − 8；
      // 固定列 left 不随 scrollLeft 偏移
      const fixed = computeEditorStyle({ ...base, colIndex: 0, rowIndex: 1, scrollTop: 8, scrollLeft: 200, fixedCount: 1 })

      assertArray([fixed.left, fixed.top, fixed.width, fixed.height], [4, 68, 92, 28], '固定列统一矩形')
      assertEqual(fixed.bordered, true, 'border 缺省 true')

      // 三编辑器类型同矩形（A5.4 R1 删 per-type 高度分支；switch/textarea 仅 bordered 标记差异）
      const switchStyle = computeEditorStyle({ ...base, colIndex: 0, rowIndex: 1, scrollTop: 8, scrollLeft: 200, fixedCount: 1, editorType: 'switch' })
      const textarea = computeEditorStyle({ ...base, colIndex: 0, rowIndex: 1, scrollTop: 8, scrollLeft: 200, fixedCount: 1, editorType: 'textarea' })

      assertArray([switchStyle.left, switchStyle.top, switchStyle.width, switchStyle.height], [4, 68, 92, 28], 'switch 同矩形')
      assertEqual(switchStyle.bordered, false, 'switch bordered false')
      assertArray([textarea.left, textarea.top, textarea.width, textarea.height], [4, 68, 92, 28], 'textarea 同矩形')
      assertEqual(textarea.bordered, true, 'textarea 恒 bordered true')

      // border/borderless 两态矩形相同（左缘一致性由 scss padding 补偿承担，非定位）
      const borderless = computeEditorStyle({ ...base, colIndex: 0, rowIndex: 1, scrollTop: 8, scrollLeft: 200, fixedCount: 1, border: false })

      assertArray([borderless.left, borderless.top, borderless.width, borderless.height], [4, 68, 92, 28], 'borderless 同矩形')
      assertEqual(borderless.bordered, false, 'border:false → bordered false')

      // 滚动列：left = colLefts − scrollLeft + 4（横向滚动对照，评审回应 4 问题 11 保留）
      const scrolled = computeEditorStyle({ ...base, colIndex: 2, rowIndex: 0, scrollTop: 0, scrollLeft: 250, fixedCount: 1 })

      assertArray([scrolled.left, scrolled.top, scrolled.width, scrolled.height], [54, 40, 72, 28], '滚动列统一矩形')

      // 变高行（fake rowGeometry 高 100）：height = heightAt − 8、top = headHeight + topAt + 4
      const tallRow = computeEditorStyle({
        ...base,
        colIndex: 1,
        rowIndex: 1,
        rowGeometry: createVariableRowGeometry({ initialHeights: [36, 100] }),
        editorType: 'textarea'
      })

      assertArray([tallRow.top, tallRow.height], [76, 92], '变高行 heightAt − 8 占满内容区')

      // 退化配置防负值：heightAt(row) = 0 → height max(−8, 0) = 0
      const degenerate = computeEditorStyle({
        ...base,
        colIndex: 1,
        rowIndex: 0,
        rowGeometry: createVariableRowGeometry({ initialHeights: [0, 36] })
      })

      assertEqual(degenerate.height, 0, 'heightAt 0 → height 0（防负值）')

      // theme 不再消费（R1）：theme: undefined 与传入 theme 矩形逐边相等
      const fallback = computeEditorStyle({ ...base, theme: undefined, colIndex: 1, rowIndex: 0 })

      assertArray([fallback.left, fallback.top, fallback.width, fallback.height], [104, 40, 192, 28], 'theme: undefined 同矩形')

      // 无固定列（fixedCount 0）：left = colLefts − scrollLeft + 4、top 含 scrollTop 位移
      const noFixed = computeEditorStyle({ ...base, colIndex: 1, rowIndex: 2, scrollTop: 100, scrollLeft: 50, fixedCount: 0 })

      assertEqual(noFixed.left, 54, '无固定列 left = colLefts − scrollLeft + 4')
      assertEqual(noFixed.top, 36 + 2 * 36 - 100 + 4, 'top = headHeight + topAt − scrollTop + EDITOR_GAP')

      return 'A5.4 R1 统一矩形：EDITOR_GAP=4、三类型/两态同矩形、固定列对照、变高行、theme 不再消费、防负值'
    }
  },
  {
    name: '打开：可编辑格开启（value 取值链、编辑器组装）、只读格拒绝',
    fn: () => {
      const { commits, controller } = createSpyController()

      try {
        const style = { left: 10, top: 20, width: 100, height: 36 }
        const opened = controller.open({
          column: { field: 'name', type: 'text', editor: true, _value: () => '覆盖值' },
          record: { name: 'A' },
          recordIndex: 2,
          editable: true,
          style
        })

        assertEqual(opened, true, 'open 返回')

        const editing = controller.state.editing

        assert(editing != null, 'editing 应存在')
        assertEqual(editing.value, '覆盖值', 'value 经 column.value 取值')
        assertEqual(editing.component, MuInput, 'input 编辑器组件')
        assertEqual(editing.editorType, 'input', 'editorType')
        assertEqual(JSON.stringify(editing.props), '{}', 'props')
        assertArray(eventKeysOf(editing.events), ['blur', 'enter', 'esc'], 'input 事件矩阵')
        assertEqual(JSON.stringify(editing.style), JSON.stringify(style), 'style 挂载')
        assert(!editing.invalid && editing.message === '', '初始校验态')
        assert(typeof editing.onEsc === 'function', '容器级 onEsc')
        assert(!editing.commitOnValueChange, 'input 不走值变化提交')
        assertEqual(editing.bordered, true, 'bordered 缺省 true')

        // 无 _value 时回退 record[field]
        controller.cancel()
        controller.open({
          column: { field: 'count', editor: true },
          record: { count: 3 },
          recordIndex: 0,
          editable: true
        })
        assertEqual(controller.state.editing.value, 3, 'value 回退 record[field]')

        // 只读拒绝：表格级/列级/无 editor/排除类型
        controller.cancel()
        assertEqual(controller.open({ column: { editor: true }, record: {}, editable: false }), false, '表格级只读拒绝')
        assertEqual(controller.open({ column: { editor: true, editable: false }, record: {}, editable: true }), false, '列级只读拒绝')
        assertEqual(controller.open({ column: { type: 'text' }, record: {}, editable: true }), false, '无 editor 拒绝')
        assertEqual(controller.open({ column: { type: 'check', editor: true }, record: {}, editable: true }), false, 'check 列拒绝')
        assertEqual(controller.state.editing, null, '拒绝后无编辑态')

        assertEqual(commits.length, 0, '打开/取消不应提交')

        return 'value 经 _value → record[field] 回退；input 组装；只读四类拒绝'
      } finally {
        controller.destroy()
      }
    }
  },
  {
    name: '提交矩阵·input：Enter 提交载荷（原始引用）、值变化不提交、Esc 取消、幂等',
    fn: () => {
      const { commits, controller } = createSpyController()

      try {
        const column = { field: 'name', type: 'text', editor: true }
        const record = { name: '旧值' }

        controller.open({ column, record, recordIndex: 7, editable: true })
        controller.state.editing.value = '新值'

        // input 不因值变化提交
        assertEqual(commits.length, 0, 'input 值变化不应提交')

        // Enter 提交：载荷字段与原始引用一致（不经 reactive 代理）
        assertEqual(controller.state.editing.events.enter(), true, 'enter 提交返回')
        assertEqual(commits.length, 1, '提交次数')
        assertEqual(commits[0].value, '新值', '提交值')
        assertEqual(commits[0].recordIndex, 7, 'recordIndex')
        assertEqual(commits[0].record, record, 'record 原始引用')
        assertEqual(commits[0].column, column, 'column 原始引用')
        assertEqual(controller.state.editing, null, '提交后关闭')

        // commit 幂等：已清空则 no-op，不重复 emit
        assertEqual(controller.commit(), false, '重复 commit 返回 false')
        assertEqual(commits.length, 1, '幂等不重复 emit')

        // Esc 取消：直接关闭不发事件；cancel 幂等
        controller.open({ column, record: { name: 'x' }, recordIndex: 0, editable: true })
        assertEqual(controller.state.editing.events.esc(), true, 'esc 取消返回')
        assertEqual(controller.state.editing, null, '取消后关闭')
        assertEqual(commits.length, 1, '取消不发事件')
        assertEqual(controller.cancel(), false, '重复 cancel 返回 false')

        return 'Enter 载荷/原始引用、值变化不提交、Esc 不发事件、双幂等'
      } finally {
        controller.destroy()
      }
    }
  },
  {
    name: '提交矩阵·select/date/switch：值变化即提交（同步 watch）、switch 事件为空',
    fn: () => {
      const { commits, controller } = createSpyController()

      try {
        // select：v-model 回写即提交，值为 mapping key 字符串（decisions⑦）
        const enumColumn = { field: 'status', type: 'enum', editor: true, mappings: { a: 'A', b: 'B', default: '兜底' } }
        const enumRecord = { status: 'a' }

        controller.open({ column: enumColumn, record: enumRecord, recordIndex: 1, editable: true })
        assertArray(eventKeysOf(controller.state.editing.events), ['blur', 'esc'], 'select 事件矩阵（无 enter）')
        assert(controller.state.editing.commitOnValueChange, 'select 走值变化提交')

        controller.state.editing.value = 'b'

        assertEqual(commits.length, 1, 'select 值变化应立即提交')
        assertEqual(commits[0].value, 'b', '提交值')
        assert(typeof commits[0].value === 'string', '字符串原值枚举提交 = mapping key 字符串（原值类型保持）')
        assertEqual(controller.state.editing, null, '提交后关闭')

        // date：同矩阵
        const dateColumn = { field: 'date', type: 'date', editor: true }

        controller.open({ column: dateColumn, record: { date: '2026-01-01' }, recordIndex: 2, editable: true })
        assertEqual(controller.state.editing.component, MuDateInput, 'date 编辑器组件')

        controller.state.editing.value = '2026-02-02'

        assertEqual(commits.length, 2, 'date 值变化应提交')
        assertEqual(commits[1].column, dateColumn, 'date 载荷 column')

        // switch：值变化（click 切换）即提交，事件矩阵为空对象（esc 挂容器）
        const boolColumn = { field: 'active', type: 'bool', editor: true }

        controller.open({ column: boolColumn, record: { active: false }, recordIndex: 3, editable: true })
        assertEqual(controller.state.editing.component, MuSwitch, 'switch 编辑器组件')
        assertEqual(JSON.stringify(controller.state.editing.events), '{}', 'switch 事件为空对象')

        controller.state.editing.value = true

        assertEqual(commits.length, 3, 'switch 值变化应提交')
        assertEqual(commits[2].value, true, '布尔提交值原样')

        // 数值原值枚举：open 字符串化进下拉、提交按原值类型回写 number（A5.5 ②）
        const numericEnumColumn = { field: 'level', type: 'enum', editor: true, mappings: { 1: '低', 2: '高', default: '未知' } }

        controller.open({ column: numericEnumColumn, record: { level: 2 }, recordIndex: 4, editable: true })
        assertEqual(controller.state.editing.value, '2', '数值枚举 open 字符串化')
        controller.state.editing.value = '1'
        assertEqual(commits.length, 4, '数值枚举值变化提交')
        assertEqual(commits[3].value, 1, '提交值回写 number（类型保持）')

        return 'select/date/switch 值变化同步提交恰一次；switch 空事件矩阵；数值枚举类型保持'
      } finally {
        controller.destroy()
      }
    }
  },
  {
    name: '提交矩阵·textarea：数组开值 join、Ctrl/Cmd+Enter 提交、Enter 换行不提交、提交 split、Esc 取消',
    fn: () => {
      const { commits, controller } = createSpyController()

      try {
        // 数组值 text 列（maxLines 缺省判定 textarea）+ link 对象数组开值取 caption
        const column = { field: 'tags', type: 'text', editor: true }
        const record = { tags: ['alpha', 'beta'] }

        controller.open({ column, record, recordIndex: 5, editable: true })

        const editing = controller.state.editing

        assertEqual(editing.editorType, 'textarea', '数组开值解析为 textarea')
        assertEqual(editing.component, 'textarea', '编辑器组件 = 原生 textarea 元素')
        assertEqual(editing.value, 'alpha\nbeta', '开值 = 元素换行拼接')
        assert(!editing.commitOnValueChange, 'textarea 不走值变化提交')
        assertEqual(editing.bordered, true, 'textarea 恒有边框形态')

        // 值变化不提交；Enter 裸按（无修饰键）不提交（换行语义）
        editing.value = 'alpha\nbeta\ngamma'
        assertEqual(commits.length, 0, '键入不提交')

        editing.events.keydown({ key: 'Enter', ctrlKey: false, metaKey: false })

        assertEqual(commits.length, 0, 'Enter 换行不提交')

        // Ctrl+Enter 显式提交：值为换行分割数组（元素字符串）
        editing.events.keydown({ key: 'Enter', ctrlKey: true, preventDefault: () => {} })

        assertEqual(commits.length, 1, 'Ctrl+Enter 提交')
        assertArray(commits[0].value, ['alpha', 'beta', 'gamma'], '提交值 = 换行分割数组')
        assertEqual(controller.state.editing, null, '提交后关闭')

        // Cmd+Enter 同通道；提交值经规整层（数组原值 → split）
        controller.open({ column, record, recordIndex: 5, editable: true })

        const second = controller.state.editing

        second.value = 'a\n\nb'
        second.events.keydown({ key: 'Enter', metaKey: true, preventDefault: () => {} })

        assertEqual(commits.length, 2, 'Cmd+Enter 提交')
        assertArray(commits[1].value, ['a', '', 'b'], '空行保留为元素')

        // link 对象数组：开值取 caption 拼接、提交为字符串数组（属性不保留，A8 #21）
        const linkColumn = { field: 'links', type: 'link', editor: true }

        controller.open({
          column: linkColumn,
          record: { links: [{ caption: 'A', color: 'red' }, { caption: 'B' }] },
          recordIndex: 6,
          editable: true
        })
        assertEqual(controller.state.editing.editorType, 'textarea', 'link 对象数组 → textarea')
        assertEqual(controller.state.editing.value, 'A\nB', 'link 开值取 caption')

        controller.state.editing.value = 'A\nB\nC'
        controller.state.editing.events.keydown({ key: 'Enter', ctrlKey: true, preventDefault: () => {} })

        assertArray(commits[2].value, ['A', 'B', 'C'], 'link 提交 = 字符串数组')

        // Esc 取消：直接关闭不发事件（textarea 冒泡至容器的 esc 转发同通道）
        controller.open({ column, record, recordIndex: 5, editable: true })
        assertEqual(controller.state.editing.events.esc(), true, 'esc 取消返回')
        assertEqual(controller.state.editing, null, '取消后关闭')
        assertEqual(commits.length, 3, '取消不发事件')

        return 'join/split、Ctrl/Cmd+Enter、Enter 换行、link caption、Esc 全链生效'
      } finally {
        controller.destroy()
      }
    }
  },
  {
    name: '校验 validate：失败置 invalid 不关闭不 emit、修正后提交',
    fn: () => {
      const { commits, controller } = createSpyController()

      try {
        const column = {
          field: 'memo',
          editor: {
            validate: value => (String(value).includes('错误') ? '备注不能包含「错误」字样' : true)
          }
        }

        // 失败：不关闭、不失焦（仍 editing）、invalid + message
        controller.open({ column, record: { memo: '内容含错误' }, recordIndex: 0, editable: true })
        assertEqual(controller.commit(), false, '校验失败不提交')
        assert(controller.state.editing != null, '校验失败不关闭')
        assertEqual(controller.state.editing.invalid, true, 'invalid 置位')
        assertEqual(controller.state.editing.message, '备注不能包含「错误」字样', '错误文案')
        assertEqual(commits.length, 0, '失败不 emit')

        // 修正后提交
        controller.state.editing.value = '修正后内容'
        assertEqual(controller.commit(), true, '修正后提交')
        assertEqual(commits.length, 1, '提交一次')
        assertEqual(commits[0].value, '修正后内容', '提交值')

        // validate 返回非字符串 falsy：message 为空串
        controller.open({
          column: { field: 'memo', editor: { validate: () => false } },
          record: { memo: 'x' },
          recordIndex: 1,
          editable: true
        })
        assertEqual(controller.commit(), false, 'falsy 校验失败')
        assertEqual(controller.state.editing.message, '', '非字符串失败无文案')

        return '失败 invalid+message 不关闭不 emit；修正后提交；falsy 文案为空'
      } finally {
        controller.destroy()
      }
    }
  },
  {
    name: 'blur 兜底判据③：面板内焦点/pointerdown 不提交（mu-icon-button 不可聚焦场景）',
    fn: () => {
      const fixture = mountBlurFixture()

      try {
        const { editorEl, inputEl, panelEl, iconButtonEl, outsideEl } = fixture

        // 面板元素识别（.mu-dropdown-panel，含 Teleport 到 body 的真实形态）
        assert(isInDropdownPanel(panelEl), '面板根识别')
        assert(isInDropdownPanel(iconButtonEl), '面板内子元素识别')
        assert(!isInDropdownPanel(outsideEl), '面板外元素')

        // mu-icon-button 为无 href 的 <a> 不可聚焦：blur 后焦点不会落在面板内
        iconButtonEl.focus()
        assert(document.activeElement !== iconButtonEl, 'mu-icon-button 不应可聚焦')
        assert(!panelEl.contains(document.activeElement), 'blur 后焦点不在面板内（落 body）')

        const { commits, controller } = createSpyController()
        const enumColumn = { field: 'status', type: 'enum', editor: true, mappings: { a: 'A' } }

        try {
          controller.open({
            column: enumColumn,
            record: { status: 'a' },
            recordIndex: 0,
            editable: true,
            getEditorEl: () => editorEl
          })

          const editing = controller.state.editing

          // ① editing 已清空 → 不提交（点选下拉项的值变化提交先于延迟兜底）
          assertEqual(resolveBlurFallback({ editing: null }), false, 'editing 已清空跳过')

          // ② 焦点在 __editor 内 → 不提交
          inputEl.focus()
          assertEqual(
            resolveBlurFallback({
              editing,
              activeElement: document.activeElement,
              editorEl,
              lastPointerdownTarget: null
            }),
            false,
            '焦点在编辑器内不提交'
          )

          // ③ 焦点在面板内 → 不提交
          assertEqual(
            resolveBlurFallback({
              editing,
              activeElement: iconButtonEl,
              editorEl,
              lastPointerdownTarget: null
            }),
            false,
            '焦点在面板内不提交'
          )

          // ③（decisions「[I1 前]①」）：最近 window pointerdown 目标在面板内 → 不提交
          //   （activeElement 落 body 的不可聚焦按钮场景）
          assertEqual(
            resolveBlurFallback({
              editing,
              activeElement: document.body,
              editorEl,
              lastPointerdownTarget: iconButtonEl
            }),
            false,
            'pointerdown 目标在面板内不提交'
          )

          // 全不满足 → 提交
          assertEqual(
            resolveBlurFallback({
              editing,
              activeElement: document.body,
              editorEl,
              lastPointerdownTarget: outsideEl
            }),
            true,
            '面板外失焦应提交'
          )

          // 控制器集成：编辑开启期间 window 记录 pointerdown 目标（capture），
          // 兜底定时器将以此四项输入走同一判定 → 面板内交互不提交
          // （先移出焦点：activeElement 落 body，隔离出判据③ 单独生效）
          inputEl.blur()
          iconButtonEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
          assertEqual(controller.getLastPointerdownTarget(), iconButtonEl, 'window pointerdown 目标未被记录')
          assertEqual(
            resolveBlurFallback({
              editing: controller.state.editing,
              activeElement: document.activeElement,
              editorEl,
              lastPointerdownTarget: controller.getLastPointerdownTarget()
            }),
            false,
            '控制器输入下兜底不提交'
          )
          assertEqual(commits.length, 0, '面板内交互未触发提交')

          // commit 幂等（双通道）：同值回写不触发 watch 提交 → 手动提交后，
          // 延迟兜底发现 editing 已空跳过
          controller.state.editing.value = 'a'
          assertEqual(commits.length, 0, '同值回写不触发提交')
          assertEqual(
            resolveBlurFallback({ editing: controller.state.editing }),
            true,
            'editing 仍在时可提交'
          )
          controller.commit()
          assertEqual(commits.length, 1, '提交恰一次')
          assertEqual(resolveBlurFallback({ editing: null }), false, '延迟任务发现已空跳过')
          assertEqual(controller.commit(), false, '重复提交被幂等拦截')
          assertEqual(commits.length, 1, '不重复 emit')

          return '③ 判据四分支 + 控制器 pointerdown 记录 + 双通道幂等全部成立'
        } finally {
          controller.destroy()
        }
      } finally {
        fixture.unmount()
      }
    }
  }
]
