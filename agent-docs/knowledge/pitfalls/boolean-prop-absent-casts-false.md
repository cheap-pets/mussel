# Boolean prop 未传被转换为 false

## 结论

Vue 对 `Boolean` 类型 prop：未传且**未声明 default** 时值为 `false`（布尔转换），不是 `undefined`。需要区分"未传"与"显式 `false`"时，必须显式声明 `default: undefined`：

```js
// props
arrow: { type: Boolean, default: undefined }
// defineModel 同理
const expanded = defineModel('expanded', { type: Boolean, default: undefined })
```

## 原因

`resolvePropValue` 对 Boolean 类型 prop 无 default 时直接返回 `false`；显式 `default: undefined` 走 default 分支返回 `undefined`，`x ?? 兜底` 链才有效。

collapse 组件实测：`arrow: Boolean` 未声明 default 时 `props.arrow` 恒 `false`，`arrow ?? true` 兜底失效、箭头不渲染；standalone `expanded` model 恒 `false`，`?? defaultExpanded` 初始展开失效。

## 注意

- defineModel 具名 model 必须显式传名字：`defineModel('expanded', {...})`。漏写名字默认绑 `modelValue`，父组件 `v-model:expanded` 落到未声明 attr 上，无任何报错、联动整体静默失效（collapse-group 实测：accordion 收敛不触发、面板全收拢）。
- 曾有"Boolean 未声明 default 时未传即 undefined（实测确认）"的错误结论被写入方案，实施期浏览器实测推翻——对 prop 未传值语义下结论前，用 `el.__vueParentComponent.props` 读实际值验证。
