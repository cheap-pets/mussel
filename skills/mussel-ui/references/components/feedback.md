# 反馈组件 API

### MessageBox

命令式消息对话框，通过 `inject('$mussel')` 调用。

```javascript
const { messageBox } = inject('$mussel')

messageBox.alert('操作完成')
messageBox.confirm('确认删除该记录？').then(btn => {
  if (btn === 'ok') doDelete()
})
messageBox.error('服务器异常，请稍后重试')
messageBox.warn('此操作不可撤销，请确认')
```

---

### Notifier

浮动通知，通过 `inject('$mussel')` 调用。

```javascript
const { messageBox } = inject('$mussel')

messageBox.notify({
  title: '保存成功',
  message: '记录已更新',
  type: 'success'   // alert | success | warn | error
})
```

---

### MuStatusBox

状态占位面板，用于空状态、加载失败、无权限等场景。

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 状态图标 |
| `title` | String | 状态标题 |
| `message` | String | 补充说明 |
| `width` / `height` | String\|Number | 尺寸 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义内容（如操作按钮） |
| `icon` | 自定义图标（图片形式） |

```html
<!-- 空状态 -->
<mu-status-box icon="empty" title="暂无数据" message="请调整筛选条件后重试">
  <mu-button button-style="outline" caption="重置筛选" @click="resetFilter" />
</mu-status-box>

<!-- 加载失败 -->
<mu-status-box icon="error" title="加载失败" message="请检查网络后重试">
  <mu-button color="primary" caption="重新加载" @click="reload" />
</mu-status-box>
```
