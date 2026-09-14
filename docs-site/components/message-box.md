<script setup>
  import { inject } from 'vue'

  // mussel 仅在客户端安装，SSR 阶段无 $mussel；命令式 API 只在浏览器点击时调用
  const messageBox = inject('$mussel', {})?.messageBox ?? {}
</script>

# 消息对话框 MessageBox

命令式消息对话框，无需在模板中声明组件，通过全局 `$mussel` 上下文调用。适合删除确认、结果提示等轻量交互。

```javascript
import { inject } from 'vue'

// Composition API
const { messageBox } = inject('$mussel')

// Options API
this.$mussel.messageBox
```

## 四种类型

各方法第一参数为消息文本，可传第二参数 `callback(btn)`（与 Promise resolve 值一致）：

<div class="mu-demo">
  <mu-button caption="Alert" @click="messageBox.alert('操作完成')" />
  <mu-button caption="Confirm" @click="messageBox.confirm('确认删除该记录？')" />
  <mu-button caption="Error" @click="messageBox.error('服务器异常，请稍后重试')" />
  <mu-button caption="Warn" @click="messageBox.warn('此操作不可撤销，请确认')" />
</div>

```javascript
const { messageBox } = inject('$mussel')

messageBox.alert('操作完成')
messageBox.confirm('确认删除该记录？').then(btn => {
  if (btn === 'OK') doDelete()
})
messageBox.error('服务器异常，请稍后重试')
messageBox.warn('此操作不可撤销，请确认')
```

## 确认结果

`confirm` 的 resolve 值为触发关闭的按钮 `name`：

- `'OK'` / `'CANCEL'` 等按钮名
- `'$ESC'`（ESC 键）、`'$MASK'`（点击遮罩）、`'$X'`（右上角关闭按钮）

```javascript
messageBox.confirm('确认删除？').then(btn => {
  if (btn === 'OK') {
    doDelete()
  } else {
    // btn === 'CANCEL' / '$ESC' / '$MASK' / '$X'
  }
})
```

## 完整形式 `showMessage(options)`

可指定 `type`（alert/confirm/error/warn）、`icon`、`title`、`message`、`buttons`：

<div class="mu-demo">
  <mu-button caption="Show Message" @click="showMessage" />
</div>

```javascript
messageBox.showMessage({
  type: 'confirm',
  icon: 'question',
  title: '确认操作',
  message: '是否继续？',
  buttons: ['#CANCEL', '#OK']
})
```

> 需要更强的定制能力（复杂表单、自定义布局）时，使用 [MuDialog](/components/dialog) 封装独立对话框组件。

## API

### messageBox

| 方法 | 参数 | 说明 |
|------|------|------|
| `alert(message, callback?)` | 消息文本 | 提示对话框，仅确定按钮 |
| `confirm(message, callback?)` | 消息文本 | 确认对话框，resolve 按钮名 |
| `error(message, callback?)` | 消息文本 | 错误对话框 |
| `warn(message, callback?)` | 消息文本 | 警告对话框 |
| `showMessage(options)` | `{ type?, icon?, title?, message?, buttons? }` | 完整形式 |
