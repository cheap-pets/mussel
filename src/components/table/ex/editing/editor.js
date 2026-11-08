/** table-ex 编辑状态机：编辑器生命周期状态机（open/commit/cancel）
    与 blur 兜底判定。类型/props/开值/提交值规整链在 editor-resolve.js；编辑盒几何
    （editorRectOf / editorGridlineFlagsOf / editButtonRectOf / computeEditorStyle）在
    editor-geometry.js（paint / interaction 层直引该文件，不经本模块中转） */
import { markRaw, reactive, watch } from 'vue'
import { isFunction, isObject, isString } from '@/utils/type'

import {
  EDITOR_COMPONENTS,
  isCellEditable,
  normalizeCommitValue,
  normalizeEditorOpenValue,
  resolveEditorProps,
  resolveEditorType
} from './editor-resolve'

// 模块隔离：不 import layout.js / theme.js / cell-painters.js / spans.js；
// mappings.js 为零依赖共享模块可用；定位所需布局数据由组件壳传入

// 提交矩阵：input 走 Enter；textarea Ctrl/Cmd+Enter 显式提交（Enter 换行）；
// select/date/switch 值变化即提交且保持编辑态；Esc 取消；validate 失败不关闭
// 不失焦；commit 幂等；同值不重复 emit

// blur 延迟兜底判据（三条同时满足才提交）：① editing 仍在；② 焦点不在 __editor
// 容器内；③ 焦点与最近一次 window pointerdown 目标均不在 .mu-dropdown-panel 内
// （编辑开启期间捕获阶段记录 pointerdown 目标，面板内交互不触发兜底提交）

// 组件壳（table-ex.vue）对接契约：createEditorController({ onCommit }) 的 onCommit
// 收 { record, recordIndex, column, value }（原始引用非 reactive 代理），壳内 emit
// 并 nextTick 重绘该行；click 命中可编辑格调 editor.open({...})（聚焦由壳
// focusEditor 承担）；画布 pointerdown（editing 中先提交再续行）与容器滚动调
// editor.commit()；卸载调 editor.destroy()（onUnmounted）

/** 下拉/日期面板根 class（dropdown-panel.vue，Teleport 到 body） */
export const DROPDOWN_PANEL_SELECTOR = '.mu-dropdown-panel'

/** 目标元素是否位于下拉/日期面板内 */
export function isInDropdownPanel (target) {
  return target?.closest?.(DROPDOWN_PANEL_SELECTOR) != null
}

/** blur 兜底提交判定：三判据任一命中 → 不提交（判据见模块头） */
export function resolveBlurFallback ({
  editing,
  activeElement,
  editorEl,
  lastPointerdownTarget
} = {}) {
  if (!editing) return false
  if (editorEl && activeElement && editorEl.contains(activeElement)) return false
  if (isInDropdownPanel(activeElement) || isInDropdownPanel(lastPointerdownTarget)) return false

  return true
}

const UNCHANGED = Symbol('unchanged')

/** 创建编辑控制器（组件壳 setup 内创建并持有）。state.editing 为浮层响应式视图
    状态；column/record 上下文存内部原始引用，emit payload 不经 reactive 代理 */
export function createEditorController ({ onCommit } = {}) {
  const state = reactive({ editing: null })

  // context.rawValue 为编辑器形态判定、开值与提交规整的锚定原值
  let context = null
  let getEditorEl = null
  let blurTimer = 0
  let lastPointerdownTarget = null
  // 本编辑会话最近一次已提交值（UNCHANGED = 尚未提交过）：关闭通道提交经此去重
  let emittedValue = UNCHANGED

  const onWindowPointerdown = event => {
    lastPointerdownTarget = event.target
  }

  // flush:'sync' 保证点选下拉项先于 blur 延迟兜底完成提交
  const stopValueWatch = watch(
    () => {
      const editing = state.editing

      return editing?.commitOnValueChange ? editing.value : UNCHANGED
    },
    (value, oldValue) => {
      if (value === UNCHANGED || oldValue === UNCHANGED || value === oldValue) return

      applyCommit()
    },
    { flush: 'sync' }
  )

  function clearTimers () {
    if (blurTimer) {
      clearTimeout(blurTimer)
      blurTimer = 0
    }
  }

  function teardown () {
    window.removeEventListener('pointerdown', onWindowPointerdown, true)
    lastPointerdownTarget = null

    clearTimers()

    context = null
    getEditorEl = null
  }

  /** 分类型事件合成：enter/esc/blur 由 mussel 输入组件转发；switch 根是普通 div
      无 focus/blur/keydown（事件空对象，esc 挂容器）；textarea Ctrl/Cmd+Enter 提交 */
  function buildEvents (editorType) {
    if (editorType === 'input') {
      return {
        enter: () => commit(),
        esc: () => cancel(),
        blur: () => scheduleBlurFallback()
      }
    }

    if (editorType === 'textarea') {
      return {
        keydown: event => {
          if (event?.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event?.preventDefault?.()
            commit()
          }
        },
        esc: () => cancel(),
        blur: () => scheduleBlurFallback()
      }
    }

    if (editorType === 'select' || editorType === 'date') {
      return {
        esc: () => cancel(),
        blur: () => scheduleBlurFallback()
      }
    }

    return {}
  }

  function scheduleBlurFallback () {
    if (blurTimer) clearTimeout(blurTimer)

    blurTimer = setTimeout(() => {
      blurTimer = 0

      if (
        resolveBlurFallback({
          editing: state.editing,
          activeElement: document.activeElement,
          editorEl: getEditorEl?.() ?? null,
          lastPointerdownTarget
        })
      ) {
        commit()
      }
    }, 0)
  }

  /** 已在编辑时先同步提交上一格（幂等；校验未通过被拦下时保持现有编辑、不开新格） */
  function open ({
    column,
    record,
    recordIndex,
    editable = false,
    style,
    bordered = true,
    getEditorEl: editorElGetter
  }) {
    if (!isCellEditable({ editable, column })) return false

    if (state.editing) commit()
    if (state.editing) return false

    // 当前显示值经 column.value 取值（非格式化文本）；rawValue 锚定形态判定与提交规整
    const rawValue = column._value?.(record) ??
      (column.field != null ? record?.[column.field] : undefined)
    const editorType = resolveEditorType(column, { rawValue, record })

    context = { column, record, recordIndex, rawValue }
    getEditorEl = editorElGetter ?? null
    emittedValue = UNCHANGED

    const editing = {
      editorType,
      component: markRaw(EDITOR_COMPONENTS[editorType]),
      props: resolveEditorProps(column),
      events: buildEvents(editorType),
      commitOnValueChange: editorType !== 'input' && editorType !== 'textarea',
      value: normalizeEditorOpenValue({ column, editorType, value: rawValue }),
      style,
      bordered,
      invalid: false,
      message: '',
      onEsc: () => cancel()
    }

    state.editing = editing

    lastPointerdownTarget = null
    window.addEventListener('pointerdown', onWindowPointerdown, true)

    return true
  }

  /** 应用提交（值规整 → validate → emit 去重），不关闭编辑：值变化通道与关闭通道
      共用；校验失败置 invalid/message 不 emit；去重按「规整值 ≠ 最近已提交值」 */
  function applyCommit () {
    if (!state.editing || !context) return false

    const { column, record, recordIndex, rawValue } = context
    const editorType = state.editing.editorType
    const value = normalizeCommitValue({
      column,
      editorType,
      rawValue,
      value: state.editing.value
    })

    const validate = isObject(column?.editor) ? column.editor.validate : null

    if (isFunction(validate)) {
      const result = validate(value, { record, column })

      if (result !== true) {
        state.editing.invalid = true
        state.editing.message = isString(result) ? result : ''

        return false
      }
    }

    // 值变化通道编辑保持开启：成功提交须解除上一轮校验失败的 invalid/message
    state.editing.invalid = false
    state.editing.message = ''

    if (value !== emittedValue) {
      emittedValue = value

      onCommit?.({ record, recordIndex, column, value })
    }

    return true
  }

  /** 提交并关闭（幂等） */
  function commit () {
    if (!applyCommit()) return false

    state.editing = null
    teardown()

    return true
  }

  /** 取消（幂等）：直接关闭，不发事件 */
  function cancel () {
    if (!state.editing) return false

    state.editing = null
    teardown()

    return true
  }

  /** 编辑开启期间最近 window pointerdown 目标（自检/调试观测用） */
  function getLastPointerdownTarget () {
    return lastPointerdownTarget
  }

  function destroy () {
    state.editing = null
    teardown()
    stopValueWatch()
  }

  return {
    state,
    open,
    commit,
    cancel,
    destroy,
    getLastPointerdownTarget
  }
}
