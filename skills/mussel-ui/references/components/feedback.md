# 反馈组件 API

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
