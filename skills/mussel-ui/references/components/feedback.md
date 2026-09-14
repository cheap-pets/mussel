# 反馈组件 API

### MuTooltip / v-mu-tooltip 指令

文字提示气泡，两种形态：

- **指令 `v-mu-tooltip`**：纯文本提示，任意元素/组件可挂。value 为字符串或 `{ content, placement, trigger, arrow, disabled }`。
- **组件 `<mu-tooltip>`**：本体不输出 DOM，包裹不影响布局；`#tooltip` 插槽支持富内容（优先于 `content` prop）。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `content` | String | — | 提示文本；有 `#tooltip` 插槽时忽略（仅组件形态） |
| `placement` | String | `'top'` | 12 方向：`top` / `bottom` / `left` / `right`，可加 `-start` / `-end` 后缀（裸主方向居中） |
| `trigger` | String | `'hover'` | `'hover'` / `'focus'` / `'click'` |
| `arrow` | Boolean | `true` | 是否显示箭头 |
| `disabled` | Boolean | `false` | 禁用（不触发显示，显示中则隐藏） |

| 事件 / expose | 说明 |
|------|------|
| `show` / `hide` | 面板显示 / 隐藏时触发（仅组件形态） |
| `show()` / `hide()` / `updatePosition()` | 组件 expose 的手动控制方法 |

```html
<!-- 指令：字符串 / 对象 / 动态 -->
<mu-button v-mu-tooltip="'删除后不可恢复'" color="danger">删除</mu-button>
<mu-icon-button v-mu-tooltip="{ content: '刷新数据', placement: 'right' }" icon="refresh" />
<mu-button v-mu-tooltip="tipText">保存</mu-button>

<!-- 组件：文本 / 富内容插槽 -->
<mu-tooltip content="删除后不可恢复">
  <mu-button color="danger">删除</mu-button>
</mu-tooltip>
<mu-tooltip placement="bottom">
  <mu-icon-button icon="question" />
  <template #tooltip>支持 <b>富文本</b> 与 <mu-icon icon="info" /></template>
</mu-tooltip>
```

注意：

- 原生 `disabled` 属性的控件不派发鼠标事件，tooltip 无法触发；需挂在外层非 disabled 元素上。
- 组件形态要求唯一元素（或单根组件）子节点；纯文本 / 多节点子节点不支持。
- 建议移除元素自带的原生 `title` 属性，避免浏览器原生与 mu 双提示。

---

### MessageBox

命令式消息对话框，通过 `inject('$mussel')` 调用。各方法可传第二参数 `callback(btn)`（与 Promise resolve 值一致）；`showMessage(options)` 为完整形式，可指定 `type`（alert/confirm/error/warn）、`icon`、`title`、`message`、`buttons`。

```javascript
const { messageBox } = inject('$mussel')

messageBox.alert('操作完成')
messageBox.confirm('确认删除该记录？').then(btn => {
  if (btn === 'OK') doDelete()
})
messageBox.error('服务器异常，请稍后重试')
messageBox.warn('此操作不可撤销，请确认')
```

`confirm` 的 resolve 值为触发关闭的按钮 `name`：`'OK'` / `'CANCEL'` 等按钮名，以及 `'$ESC'`（ESC 键）、`'$MASK'`（点击遮罩）、`'$X'`（右上角关闭按钮）。

---

### Notifier

浮动通知，通过 `inject('$mussel')` 调用。支持纯字符串形式（仅消息文案）。

```javascript
const { messageBox } = inject('$mussel')

messageBox.notify({
  title: '保存成功',
  message: '记录已更新',
  type: 'success',   // alert | success | warn | error
  duration: 3000     // 自动关闭延时（毫秒），默认 3000
})

// 纯字符串形式
messageBox.notify('记录已更新')
```

---

### MuStatusBox

状态占位面板，用于空状态、加载失败、无权限等场景。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 状态图标 |
| `title` | String | 状态标题 |
| `message` | String | 补充说明 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义内容（如操作按钮） |
| `icon` | 自定义图标（图片形式） |

```html
<!-- 空状态 -->
<mu-status-box icon="info" title="暂无数据" message="请调整筛选条件后重试">
  <mu-button button-style="outline" caption="重置筛选" @click="resetFilter" />
</mu-status-box>

<!-- 加载失败 -->
<mu-status-box icon="alert" title="加载失败" message="请检查网络后重试">
  <mu-button color="primary" caption="重新加载" @click="reload" />
</mu-status-box>
```
