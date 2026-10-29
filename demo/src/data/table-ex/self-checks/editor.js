/**
 * table-ex 自检断言 — editor 模块（G3）。
 *
 * 覆盖（02-design.md G3 判据 + decisions「[I1 前]①」+ A5.5 规整层 + 评审 6 P6
 * + 20261027 问题 3/4/5 断言同步）：
 * 打开（只读判定、value 取值链、编辑器组装、textarea/数组开值）/ 编辑器类型
 * 解析（text/number 列带 mappings/options 下拉来源缺省 select；text 列按开值
 * 形态与 _resolveMaxLines(record) 行级求值判定 textarea；link 分支已删、直调
 * 回退 input 且实际被只读判定拦截）/ 值类型规整层
 * （usesDerivedOptions / normalizeEditorOpenValue / normalizeCommitValue：
 * number/currency 三形态、数值枚举类型保持、textarea ④⑤ 数组换行分割、
 * 对象数组开值取 caption、null 直通、显式 options 原样）/ 分类型提交矩阵
 * （input Enter、textarea Ctrl/Cmd+Enter 显式提交且 Enter 换行不提交、
 * select/date/switch 值变化即提交、值变化不重复提交 input、textarea 数组
 * 开值/提交由 text 列 + 对象数组承接）/ 取消 / 校验 /
 * 编辑盒矩形定位（20261028：editorRectOf 格线占位内缩 + editorGridlineFlagsOf
 * 标志派生，computeEditorStyle 矩形贴格线内侧与 hover 描边同位——全编辑器
 * 类型同矩形仅 bordered 标记差异、gridlines/blankTail 门控、固定列横向滚动
 * 两态对照、变高行、height 防负值）/ 编辑按钮区矩形
 * editorButtonRectOf（20261027 问题 5：right-align x = 格右 − padding − 24、
 * centerY = 格顶 + ROW_TOP_INSET + padding + lineHeight/2 首行槽位式）/
 * select 编辑器 options 三级来源（editor.props.options > column.options >
 * mappings 派生 [{value,label}] 且排除 default；字符串原值提交仍为 key 字符串、
 * 数值原值类型保持）/ blur 兜底面板判定
 * 条件③（焦点或最近 window pointerdown 目标在 .mu-dropdown-panel 内不提交；
 * mu-icon-button 不可聚焦场景）。
 *
 * 说明：blur 兜底的 setTimeout 0 定时器接线为薄封装，自检以纯判定函数
 * resolveBlurFallback + 控制器 pointerdown 记录（getLastPointerdownTarget）
 * 同步断言判定输入；聚焦由组件壳 focusEditor 承担（留浏览器用例）。
 */
import { toRaw } from 'vue'
import {
  NON_EDITABLE_TYPES,
  EDITOR_COMPONENTS,
  editorRectOf,
  editorButtonRectOf,
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
} from '@/components/table/ex/editor.js'
import { createUniformRowGeometry, createVariableRowGeometry } from '@/components/table/ex/row-geometry.js'
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
      assertEqual(componentOf({ type: 'text', editor: true, mappings: { a: '甲' } }), EDITOR_COMPONENTS.select, 'text+mappings → MuSelect')
      assertEqual(componentOf({ type: 'number', editor: true, options: [{ value: 1, label: '低' }] }), EDITOR_COMPONENTS.select, 'number+options → MuSelect')
      assertEqual(componentOf({ type: 'date', editor: true }), EDITOR_COMPONENTS.date, 'date → MuDateInput')
      assertEqual(componentOf({ type: 'datetime', editor: true }), EDITOR_COMPONENTS.date, 'datetime → MuDateInput')
      assertEqual(componentOf({ type: 'bool', editor: true }), EDITOR_COMPONENTS.switch, 'bool → MuSwitch')
      assertEqual(componentOf({ type: 'enum', editor: true, mappings: { a: '甲' } }), EDITOR_COMPONENTS.select, 'enum+mappings → MuSelect（废弃兼容）')
      assertEqual(componentOf({ field: 'x', editor: true }), EDITOR_COMPONENTS.input, '未知列类型回退 input')

      // 显式指定优先；非法显式类型回退列类型映射
      assertEqual(
        componentOf({ type: 'text', editor: { type: 'date' } }),
        EDITOR_COMPONENTS.date,
        '显式 editor.type 优先'
      )
      assertEqual(
        componentOf({ type: 'text', editor: { type: 'nope' }, mappings: { a: '甲' } }),
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
      // link 分支已删（20261027 问题 4：link 不可编辑）——直调走未知类型回退 input，
      // 实际开格被 isCellEditable 拦截（见只读判定块）
      assertEqual(
        resolveEditorType({ type: 'link', editor: true }, { rawValue: [{ caption: 'a', color: 'red' }] }),
        'input',
        'link 直调回退 input（分支已删）'
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
      assertEqual(componentOf({ type: 'text', editor: true, mappings: { a: '甲' } }), MuSelect, 'select 组件 = MuSelect 导出')
      assertEqual(componentOf({ type: 'date', editor: true }), MuDateInput, 'date 组件 = MuDateInput 导出')
      assertEqual(componentOf({ type: 'bool', editor: true }), MuSwitch, 'switch 组件 = MuSwitch 导出')
      assertEqual(resolveEditorType({ type: 'text', editor: true, mappings: { a: '甲' } }), 'select', 'resolveEditorType')

      return 'input/select/date/switch/textarea 映射与组件身份一致；text 形态判定生效（link 回退 input）'
    }
  },
  {
    name: '只读判定 isCellEditable：表格级/列级/editor 缺失/排除类型；link/button/progress 不可编辑',
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

      // 20261027 问题 4：link 恢复不可编辑（decisions [S1]，推翻 20261025 人工决定），
      // button/progress 为 canvas 专属展示类型一并排除——清单 + 判定两态断言
      for (const type of ['link', 'button', 'progress']) {
        assert(NON_EDITABLE_TYPES.includes(type), `类型 ${type} 应在排除清单`)
        assert(!isCellEditable({ editable: true, column: { type, editor: true } }), `类型 ${type} 应只读`)
      }

      assert(isCellEditable({ editable: true, column: { type: 'text', editor: true } }), '可编辑格判定')
      assert(isCellEditable({ editable: true, column: { type: 'text', editor: { type: 'select' } } }), 'editor 对象形态判定')

      // open 通道同判（isCellEditable 是 open 的唯一闸门）：配 editor 仍拒绝、无编辑态
      const { commits, controller } = createSpyController()

      try {
        for (const type of ['link', 'button', 'progress']) {
          assertEqual(controller.open({ column: { type, editor: true }, record: {}, editable: true }), false, `${type} 列 open 拒绝`)
        }
        assertEqual(controller.state.editing, null, '拒绝后无编辑态')
        assertEqual(commits.length, 0, '拒绝不产生提交')
      } finally {
        controller.destroy()
      }

      return '表格级/列级/editor 缺失/排除类型（rec_no/img/image/tag/check/link/button/progress）生效，open 同判'
    }
  },
  {
    name: '值类型规整层：usesDerivedOptions / open 规整（select 字符串化、textarea caption 拼接）',
    fn: () => {
      const mappingsColumn = { type: 'text', editor: true, mappings: { 1: '低' } }
      const explicitColumn = { editor: { type: 'select', props: { options: [{ value: 1, label: 1 }] } } }

      // 派生 options 锚定（显式 options 原样透传 = 范围边界 #14 例外）
      assert(usesDerivedOptions(mappingsColumn, 'select'), 'mappings 派生 options')
      assert(!usesDerivedOptions(explicitColumn, 'select'), '显式 options 非派生')
      assert(!usesDerivedOptions(mappingsColumn, 'input'), '非 select 恒 false')

      // select + 派生：open 字符串化（消除 MuSelect in 隐式转换依赖）；null 直通
      assertEqual(normalizeEditorOpenValue({ column: mappingsColumn, editorType: 'select', value: 1 }), '1', 'select open 字符串化')
      assertEqual(normalizeEditorOpenValue({ column: mappingsColumn, editorType: 'select', value: null }), null, 'select null 直通')

      // textarea：数组开值逐元素取 caption 换行拼接（对象数组取 caption、字符串/
      // 数字数组直接元素——列类型无关的通用规整，20261027 问题 4 起由 text 列的
      // 对象数组值承接，link 已不可编辑）；非数组 → String；null → ''
      assertEqual(
        normalizeEditorOpenValue({
          column: { type: 'text', editor: true },
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
        normalizeCommitValue({ column: { type: 'text', mappings: { 1: '低', 2: '高' } }, editorType: 'select', rawValue: 1, value: '2' }),
        2,
        '派生 select 数值回写 number'
      )
      assertEqual(
        normalizeCommitValue({ column: { type: 'text', mappings: { 1: '低' } }, editorType: 'select', rawValue: 1, value: null }),
        null,
        '派生 select 清空 null'
      )
      // 字符串原值：key 字符串原样
      assertEqual(
        normalizeCommitValue({ column: { type: 'text', mappings: { a: 'A' } }, editorType: 'select', rawValue: 'a', value: 'b' }),
        'b',
        '字符串 key 原样'
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
    name: 'select options 三级来源：editor.props.options > column.options > mappings 派生（排除 default）',
    fn: () => {
      const explicit = [{ value: 'x', label: 'X' }]
      const columnOptions = [{ value: 1, label: '低' }, { value: 2, label: '中' }]

      // 显式 options 原样优先（两级均原样透传，值携带原类型直通）
      assertEqual(
        resolveSelectOptions({ editor: { props: { options: explicit } }, options: columnOptions, mappings: { a: 'A' } }),
        explicit,
        'editor.props.options 原样优先'
      )
      assertEqual(
        resolveSelectOptions({ editor: true, options: columnOptions, mappings: { a: 'A' } }),
        columnOptions,
        'column.options 原样次之'
      )

      // mappings 派生：对象值取 text、排除 default、value = key 字符串
      assertArray(
        resolveSelectOptions({
          editor: true,
          mappings: {
            active: '启用',
            pending: { text: '待处理', class: 'is-warn' },
            archived: { text: '已归档' },
            default: '未知'
          }
        }),
        [
          { value: 'active', label: '启用' },
          { value: 'pending', label: '待处理' },
          { value: 'archived', label: '已归档' }
        ],
        'mappings 派生转换'
      )
      assert(!resolveSelectOptions({ editor: true, mappings: { default: '未知' } }).length, 'default 不成为可选项')

      // 数字键经 Object.entries 字符串化（派生 value 恒为 key 字符串；
      // 提交值类型规整见 normalizeCommitValue——数值原值回写 number）
      assertArray(resolveSelectOptions({ editor: true, mappings: { 1: '低', 2: '高', default: '未知' } }),
        [{ value: '1', label: '低' }, { value: '2', label: '高' }],
        '数字键字符串化')

      // enum 废弃兼容同走 mappings 派生
      assertArray(
        resolveSelectOptions({ type: 'enum', editor: true, mappings: { a: '甲', default: '未知' } }),
        [{ value: 'a', label: '甲' }],
        'enum 列 mappings 派生（废弃兼容）'
      )

      assertArray(resolveSelectOptions({ editor: true }), [], '全部缺省返回空数组（编辑器照开、下拉为空）')

      return '三级来源 / default 排除 / 对象取 text / 数字键字符串化 / 空数组兜底'
    }
  },
  {
    name: 'resolveEditorType：text/number 列三下拉来源缺省 select，优先于形态判定',
    fn: () => {
      assertEqual(resolveEditorType({ type: 'text', editor: true, mappings: { a: '甲' } }), 'select', 'text + mappings')
      assertEqual(resolveEditorType({ type: 'number', editor: true, mappings: { 1: '低' } }), 'select', 'number + mappings')
      assertEqual(resolveEditorType({ type: 'number', editor: true, options: [{ value: 1, label: '低' }] }), 'select', 'number + options')
      assertEqual(resolveEditorType({ field: 'x', editor: true, options: [{ value: 1 }] }), 'select', '无 type + options（缺省按 text）')
      assertEqual(
        resolveEditorType({ type: 'text', editor: { props: { options: [{ value: 'a' }] } } }),
        'select',
        'text + editor.props.options'
      )

      // 下拉来源优先于形态判定（数组开值 + mappings 仍 select）
      assertEqual(
        resolveEditorType({ type: 'text', editor: true, mappings: { a: '甲' } }, { rawValue: ['a', 'b'] }),
        'select',
        '下拉来源优先于形态判定'
      )

      // 无来源保持原判定：number → input、text 数组开值 → textarea
      assertEqual(resolveEditorType({ type: 'number', editor: true }, { rawValue: 5 }), 'input', 'number 无来源仍 input')
      assertEqual(resolveEditorType({ type: 'text', editor: true }, { rawValue: ['a'] }), 'textarea', 'text 无来源按形态判定')
      // 其余类型列带 mappings/options 不改缺省映射（编辑器 select 来源限定 text/number；
      // bool 显示映射已统一 mappable 但编辑器恒 switch——select 派生 value 为字符串键会破坏 boolean 提交类型）
      assertEqual(
        resolveEditorType({ type: 'currency', editor: true, mappings: { a: '甲' } }),
        'input',
        'currency 带 mappings 仍 input'
      )
      assertEqual(
        resolveEditorType({ type: 'bool', editor: true, mappings: { true: '启用', false: '停用' } }),
        'switch',
        'bool 带 mappings 仍 switch'
      )

      // enum 废弃兼容：恒 select（恢复移除前行为，不依赖下拉来源）
      assertEqual(
        resolveEditorType({ type: 'enum', editor: true, mappings: { a: '甲' } }),
        'select',
        'enum + mappings → select'
      )
      assertEqual(resolveEditorType({ type: 'enum', editor: true }), 'select', 'enum 缺 mappings 亦 select（空下拉）')

      return '三来源 → select / 优先形态判定 / 无来源保持缺省 / select 来源限定 text+number；enum 恒 select、bool 恒 switch'
    }
  },
  {
    name: '仅 options 的 select：column.options 原样下拉、开值不字符串化、数值提交类型保持',
    fn: () => {
      const column = {
        field: 'level',
        type: 'number',
        editor: true,
        options: [{ value: 1, label: '低' }, { value: 2, label: '中' }, { value: 3, label: '高' }]
      }

      assertEqual(resolveEditorType(column), 'select', 'number + options → select')
      assert(!usesDerivedOptions(column, 'select'), 'column.options 非派生（值携带原类型直通）')
      assertEqual(resolveSelectOptions(column), column.options, 'options 原样透传')
      assertEqual(normalizeEditorOpenValue({ column, editorType: 'select', value: 2 }), 2, '开值保持 number（不字符串化）')

      const { commits, controller } = createSpyController()

      try {
        controller.open({ column, record: { level: 2 }, recordIndex: 0, editable: true })

        assertEqual(controller.state.editing.editorType, 'select', '编辑器类型 select')
        assertEqual(controller.state.editing.value, 2, 'open 值保持 number')
        // state 为 reactive 深代理，读回的 options 是 Proxy；toRaw 解代理后比原引用
        assertEqual(toRaw(controller.state.editing.props.options), column.options, '编辑器 options 注入原样')

        controller.state.editing.value = 1

        assertEqual(commits.length, 1, '值变化提交')
        assertEqual(commits[0].value, 1, '提交值保持 number（显式 options 原样通道）')
      } finally {
        controller.destroy()
      }

      return 'select / 非派生 / 原样注入 / number 开值与提交类型保持'
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
        type: 'text',
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
    name: '编辑盒矩形 computeEditorStyle：浮层盒贴格线内侧（20261028 与 hover 描边同位）、全类型同矩形、border 两态、固定列/滚动列/变高行',
    fn: () => {
      // C4 起 rowGeometry 必传：等高基线经 uniform 几何构造（36×3）。
      // 20261028：浮层盒 = editorRectOf(格矩形, 格线占位标志)——本格内被行线
      // （r≥1 顶行）/列线（右缘列）占用的边缘扣除 1px；stickyWidth/contentWidth
      // 缺省 0/0 → blankTail false（末列右缘无线）
      const base = {
        colLefts: [0, 100, 300],
        colWidths: [100, 200, 80],
        headHeight: 36,
        rowGeometry: createUniformRowGeometry({ rowHeight: 36, rowCount: 3 }),
        editorType: 'input',
        border: true,
        gridlines: 'all'
      }

      // 固定列 col 0（非末列）/ row 1（r≥1）：格矩形 [0,64,100,36] 扣顶行线 +
      // 右列线 → [0, 65, 99, 35]（固定列不随 scrollLeft 偏移）
      const fixed = computeEditorStyle({
        ...base, colIndex: 0, rowIndex: 1, scrollTop: 8, scrollLeft: 200, fixedCount: 1
      })

      assertArray([fixed.left, fixed.top, fixed.width, fixed.height], [0, 65, 99, 35], '固定列编辑盒（顶/右各扣 1px 格线）')
      assertEqual(fixed.bordered, true, 'border 缺省 true')

      // 全编辑器类型同矩形（矩形恒等；switch/textarea 仅 bordered 标记差异）
      const switchStyle = computeEditorStyle({
        ...base, colIndex: 0, rowIndex: 1, scrollTop: 8, scrollLeft: 200, fixedCount: 1, editorType: 'switch'
      })
      const textarea = computeEditorStyle({
        ...base, colIndex: 0, rowIndex: 1, scrollTop: 8, scrollLeft: 200, fixedCount: 1, editorType: 'textarea'
      })

      assertArray([switchStyle.left, switchStyle.top, switchStyle.width, switchStyle.height], [0, 65, 99, 35], 'switch 同矩形')
      assertEqual(switchStyle.bordered, false, 'switch bordered false')
      assertArray([textarea.left, textarea.top, textarea.width, textarea.height], [0, 65, 99, 35], 'textarea 同矩形')
      assertEqual(textarea.bordered, true, 'textarea 恒 bordered true')

      // border/borderless 两态矩形相同（仅 bordered 标记差异；左缘一致性由 scss
      // padding 补偿承担，非定位）
      const borderless = computeEditorStyle({
        ...base, colIndex: 0, rowIndex: 1, scrollTop: 8, scrollLeft: 200, fixedCount: 1, border: false
      })

      assertArray([borderless.left, borderless.top, borderless.width, borderless.height], [0, 65, 99, 35], 'borderless 同矩形')
      assertEqual(borderless.bordered, false, 'border:false → bordered false')

      // 滚动列：left = colLefts − scrollLeft；col 2 为末列（blankTail false 无右
      // 缘线）+ row 0（顶线为表头底边框、在本格外）→ 整格无扣除
      const scrolled = computeEditorStyle({
        ...base, colIndex: 2, rowIndex: 0, scrollTop: 0, scrollLeft: 250, fixedCount: 1
      })

      assertArray([scrolled.left, scrolled.top, scrolled.width, scrolled.height], [50, 36, 80, 36], '滚动列末列首行整格（无格线占位）')

      // gridlines 'none'：无格线占位，非末列 r≥1 也整格（scrollTop 缺省 0 →
      // top = headHeight + topAt(1) = 72）
      const noLines = computeEditorStyle({
        ...base, colIndex: 0, rowIndex: 1, fixedCount: 1, gridlines: 'none'
      })

      assertArray([noLines.left, noLines.top, noLines.width, noLines.height], [0, 72, 100, 36], "gridlines 'none' 整格")

      // blankTail：stickyWidth > contentWidth（480 > 380）→ 末列右缘补线，
      // 末列 col 2 + row 0 → 仅右扣 1px（scrollLeft 缺省 0 → left = colLefts[2]）
      const blankTail = computeEditorStyle({
        ...base, colIndex: 2, rowIndex: 0, fixedCount: 1, stickyWidth: 480, contentWidth: 380
      })

      assertArray([blankTail.left, blankTail.top, blankTail.width, blankTail.height], [300, 36, 79, 36], 'blankTail 末列右扣 1px')

      // 变高行（fake rowGeometry 高 100）：top = headHeight + topAt + 1、
      // height = heightAt − 1（r≥1 顶行线扣除）
      const tallRow = computeEditorStyle({
        ...base,
        colIndex: 1,
        rowIndex: 1,
        rowGeometry: createVariableRowGeometry({ initialHeights: [36, 100] }),
        editorType: 'textarea'
      })

      assertArray([tallRow.left, tallRow.top, tallRow.width, tallRow.height], [100, 73, 199, 99], '变高行编辑盒（顶扣 1px）')

      // 退化配置防负值：heightAt(row) = 0 → height 0
      const degenerate = computeEditorStyle({
        ...base,
        colIndex: 1,
        rowIndex: 0,
        rowGeometry: createVariableRowGeometry({ initialHeights: [0, 36] })
      })

      assertEqual(degenerate.height, 0, 'heightAt 0 → height 0（防负值）')

      // 无固定列（fixedCount 0）：left = colLefts − scrollLeft、top 含 scrollTop 位移
      const noFixed = computeEditorStyle({
        ...base, colIndex: 1, rowIndex: 2, scrollTop: 100, scrollLeft: 50, fixedCount: 0
      })

      assertEqual(noFixed.left, 50, '无固定列 left = colLefts − scrollLeft')
      assertEqual(noFixed.top, 9, 'top = headHeight + topAt(2) − scrollTop + 顶扣 = 36 + 72 − 100 + 1')

      return '编辑盒贴格线内侧：固定列 [0,65,99,35]、滚动末列首行整格 [50,36,80,36]、none 整格、blankTail 右扣、变高行顶扣、全类型同矩形、防负值'
    }
  },
  {
    name: 'editorRectOf：格线占位内缩——默认整格，top/right 各扣 1px（hover 描边/编辑浮层同源）',
    fn: () => {
      // 浮层盒与 hover 描边 import 同一函数：盒缘贴格线内侧（本格内格线占位
      // 像素扣除）；缺省 flags = 整格（无占位信息时退化为格矩形）
      const rect = { x: 60, y: 72, width: 140, height: 36 }
      const identity = editorRectOf(rect)

      assertArray([identity.left, identity.top, identity.width, identity.height], [60, 72, 140, 36], '缺省 flags 恒等四值')

      // 边界格：flags 缺省不占位（首行顶线在表头、末列右缘无线由 flags 派生承担）
      const edge = editorRectOf({ x: 0, y: 0, width: 80, height: 36 })

      assertArray([edge.left, edge.top, edge.width, edge.height], [0, 0, 80, 36], '边缘格同恒等')

      // r≥1 行线 + 非末列列线：top+1、width−1、height−1（底缘贴本格末行 =
      // 底行线内侧）；right 缘 = rightGridline 像素列内侧
      const inset = editorRectOf(rect, { topGridline: true, rightGridline: true })

      assertArray([inset.left, inset.top, inset.width, inset.height], [60, 73, 139, 35], '双格线占位内缩')

      // 仅右列线（首行非末列）：width −1、top/height 不变
      const rightOnly = editorRectOf(rect, { rightGridline: true })

      assertArray([rightOnly.left, rightOnly.top, rightOnly.width, rightOnly.height], [60, 72, 139, 36], '仅右列线占位')

      // computeEditorStyle 消费同函数（编辑浮层定位单一事实源），
      // 整格/内缩期望值见上一断言块
      return 'editorRectOf：缺省恒等、双占位 [60,73,139,35]、仅右 [60,72,139,36]'
    }
  },
  {
    name: 'editorButtonRectOf：right-align + 行线中点 centerY（20261027 问题 5 / A5；20261028 解耦 lineHeight）',
    fn: () => {
      // 默认参（padding 8 / rowHeight 36）：区右缘贴格内容区右缘（right-align）
      // x = 格右 − padding − 24；centerY = 格顶 + ROW_TOP_INSET(1) + (rowHeight − 1)/2
      const area = editorButtonRectOf({ x: 0, y: 0, width: 160, height: 36 })

      assertArray([area.x, area.y, area.width, area.height], [128, 6.5, 24, 24], '默认参几何（centerY = 0+1+17.5 = 18.5）')

      // centerY 为行线中点式而非 rect.height/2：超高行（h=88，行高被多行列撑大）
      // 锚不变——与单元格文字首行、树箭头中心同一公式（Q2 统一槽位式）
      const tall = editorButtonRectOf({ x: 0, y: 0, width: 160, height: 88 })

      assertEqual(tall.y, 6.5, '超高行 centerY 恒 18.5（槽位锚，不使用 rect.height）')
      assertEqual(tall.x, 128, '超高行 right-align 不变')

      // 自定义 padding/rowHeight 同式：x = 40+200−12−24 = 204；centerY = 40+1+43/2 = 62.5 → y = 50.5
      const custom = editorButtonRectOf({ x: 40, y: 40, width: 200, height: 60 }, { padding: 12, rowHeight: 44 })

      assertArray([custom.x, custom.y, custom.width, custom.height], [204, 50.5, 24, 24], '自定义 padding/rowHeight 同式')

      // 偏移格同式：x = 100+120−8−24 = 188；centerY = 200+1+17.5 = 218.5 → y = 206.5
      const offset = editorButtonRectOf({ x: 100, y: 200, width: 120, height: 36 })

      assertArray([offset.x, offset.y, offset.width, offset.height], [188, 206.5, 24, 24], '偏移格同式')

      return 'right-align x = 格右−padding−24；centerY = 格顶+1+(rowHeight−1)/2（槽位式，不随 rect.height）'
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
    name: '提交矩阵·select/date/switch：值变化即提交且保持编辑态（同步 watch）、关闭通道同值去重、switch 事件为空',
    fn: () => {
      const { commits, controller } = createSpyController()

      try {
        // select：v-model 回写即提交（emit），编辑态保持开启（20261028：
        // 点选下拉项不退出编辑）；text+mappings 列缺省 select（完整替代原枚举列）
        const selectColumn = { field: 'status', type: 'text', editor: true, mappings: { a: 'A', b: 'B', default: '兜底' } }
        const selectRecord = { status: 'a' }

        controller.open({ column: selectColumn, record: selectRecord, recordIndex: 1, editable: true })
        assertArray(eventKeysOf(controller.state.editing.events), ['blur', 'esc'], 'select 事件矩阵（无 enter）')
        assert(controller.state.editing.commitOnValueChange, 'select 走值变化提交')

        controller.state.editing.value = 'b'

        assertEqual(commits.length, 1, 'select 值变化应立即提交')
        assertEqual(commits[0].value, 'b', '提交值')
        assert(typeof commits[0].value === 'string', '字符串原值枚举提交 = mapping key 字符串（原值类型保持）')
        assert(controller.state.editing != null, '值变化提交后保持编辑态')
        assertEqual(controller.state.editing.value, 'b', '编辑值保持')
        assertEqual(controller.state.editing.invalid, false, '成功提交无校验痕迹')

        // 关闭通道去重：值未再变化时 commit 只关闭不重复 emit
        assertEqual(controller.commit(), true, '关闭通道提交返回')
        assertEqual(commits.length, 1, '已提交同值不重复 emit')
        assertEqual(controller.state.editing, null, '关闭后无编辑态')

        // 二次会话连续换选：每次值变化各 emit 一次（与最近提交值比较）
        controller.open({ column: selectColumn, record: selectRecord, recordIndex: 1, editable: true })
        controller.state.editing.value = 'b'
        controller.state.editing.value = 'a'
        assertEqual(commits.length, 3, '两次值变化各提交一次')
        assertEqual(commits[2].value, 'a', '换回原值仍提交')
        assert(controller.state.editing != null, '编辑态保持')
        assertEqual(controller.cancel(), true, '取消关闭')
        assertEqual(commits.length, 3, '取消不重复 emit')

        // date：同矩阵
        const dateColumn = { field: 'date', type: 'date', editor: true }

        controller.open({ column: dateColumn, record: { date: '2026-01-01' }, recordIndex: 2, editable: true })
        assertEqual(controller.state.editing.component, MuDateInput, 'date 编辑器组件')

        controller.state.editing.value = '2026-02-02'

        assertEqual(commits.length, 4, 'date 值变化应提交')
        assertEqual(commits[3].column, dateColumn, 'date 载荷 column')
        assert(controller.state.editing != null, 'date 值变化后保持编辑态')

        // switch：值变化（click 切换）即提交，事件矩阵为空对象（esc 挂容器）
        const boolColumn = { field: 'active', type: 'bool', editor: true }

        controller.open({ column: boolColumn, record: { active: false }, recordIndex: 3, editable: true })
        assertEqual(controller.state.editing.component, MuSwitch, 'switch 编辑器组件')
        assertEqual(JSON.stringify(controller.state.editing.events), '{}', 'switch 事件为空对象')

        controller.state.editing.value = true

        assertEqual(commits.length, 5, 'switch 值变化应提交')
        assertEqual(commits[4].value, true, '布尔提交值原样')
        assert(controller.state.editing != null, 'switch 值变化后保持编辑态')

        // 数值原值派生 select：open 字符串化进下拉、提交按原值类型回写 number；
        // 会话内连续换选均按 open 原值锚定规整、逐次 emit
        const numericEnumColumn = { field: 'level', type: 'number', editor: true, mappings: { 1: '低', 2: '高', default: '未知' } }

        controller.open({ column: numericEnumColumn, record: { level: 2 }, recordIndex: 4, editable: true })
        assertEqual(controller.state.editing.value, '2', '数值派生 select open 字符串化')
        controller.state.editing.value = '1'
        assertEqual(commits.length, 6, '数值派生 select 值变化提交')
        assertEqual(commits[5].value, 1, '提交值回写 number（类型保持）')
        controller.state.editing.value = '2'
        assertEqual(commits.length, 7, '会话内二次换选仍提交')
        assertEqual(commits[6].value, 2, '二次提交类型保持 number')

        return 'select/date/switch 值变化同步提交且保持编辑态；关闭通道同值去重；连续换选逐次 emit；switch 空事件矩阵；数值枚举类型保持'
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
        // 数组值 text 列（maxLines 缺省判定 textarea）
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

        // 对象数组值 text 列（20261027 问题 4 起 link 不可编辑，caption 拼接覆盖改由
        // text 列 + 对象数组承接——normalizeEditorOpenValue/normalizeTextareaCommitValue
        // 为列类型无关的通用逻辑）：开值取 caption 拼接、提交为字符串数组（属性不保留）
        const objectArrayColumn = { field: 'links', type: 'text', editor: true }

        controller.open({
          column: objectArrayColumn,
          record: { links: [{ caption: 'A', color: 'red' }, { caption: 'B' }] },
          recordIndex: 6,
          editable: true
        })
        assertEqual(controller.state.editing.editorType, 'textarea', '对象数组开值 → textarea')
        assertEqual(controller.state.editing.value, 'A\nB', '对象数组开值取 caption')

        controller.state.editing.value = 'A\nB\nC'
        controller.state.editing.events.keydown({ key: 'Enter', ctrlKey: true, preventDefault: () => {} })

        assertArray(commits[2].value, ['A', 'B', 'C'], '对象数组提交 = 字符串数组（属性不保留）')

        // Esc 取消：直接关闭不发事件（textarea 冒泡至容器的 esc 转发同通道）
        controller.open({ column, record, recordIndex: 5, editable: true })
        assertEqual(controller.state.editing.events.esc(), true, 'esc 取消返回')
        assertEqual(controller.state.editing, null, '取消后关闭')
        assertEqual(commits.length, 3, '取消不发事件')

        return 'join/split、Ctrl/Cmd+Enter、Enter 换行、对象数组 caption、Esc 全链生效'
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

        // select 值变化通道同闸门：失败保持编辑不 emit，修正后值变化提交成功
        // 并解除 invalid（编辑态保持开启）。先 cancel 上一个校验失败会话——
        // 校验未通过时 open 被拒、不开新格
        controller.cancel()
        controller.open({
          column: { field: 'level', editor: { type: 'select', validate: value => (value === 'x' ? '非法选项' : true) } },
          record: { level: 'ok' },
          recordIndex: 2,
          editable: true
        })
        controller.state.editing.value = 'x'
        assertEqual(commits.length, 1, '值变化校验失败不 emit')
        assert(controller.state.editing != null, '校验失败保持编辑态')
        assertEqual(controller.state.editing.invalid, true, 'invalid 置位')
        controller.state.editing.value = 'y'
        assertEqual(commits.length, 2, '修正后值变化提交')
        assertEqual(commits[1].value, 'y', '提交值')
        assertEqual(controller.state.editing.invalid, false, '成功提交解除 invalid')

        return '失败 invalid+message 不关闭不 emit；修正后提交；falsy 文案为空；select 值变化失败不 emit 修正后解除 invalid'
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
        const selectColumn = { field: 'status', type: 'text', editor: true, mappings: { a: 'A' } }

        try {
          controller.open({
            column: selectColumn,
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
