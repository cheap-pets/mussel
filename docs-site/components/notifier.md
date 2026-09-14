<script setup>
  import { inject } from 'vue'

  // mussel 仅在客户端安装，SSR 阶段无 $mussel；命令式 API 只在浏览器点击时调用
  const messageBox = inject('$mussel', {})?.messageBox ?? {}
</script>

# 浮动通知 Notifier

浮动通知（Toast），通过全局 `$mussel` 上下文的 `messageBox.notify` 调用，显示在页面角落，`duration` 后自动关闭。适合保存成功、操作结果等轻量反馈。

```javascript
import { inject } from 'vue'

const { messageBox } = inject('$mussel')
```

## 四种类型

`type` 支持 `alert` / `success` / `warn` / `error`：

<div class="mu-demo">
  <mu-button caption="Info" @click="messageBox.notify({ title: '提示', message: '这是一个普通提示。', type: 'alert' })" />
  <mu-button caption="Success" @click="messageBox.notify({ title: '提示', message: '数据保存成功。', type: 'success' })" />
  <mu-button caption="Warning" @click="messageBox.notify({ type: 'warn', title: '警告', message: '这是一个做了危险操作的提示！' })" />
  <mu-button caption="Error" @click="messageBox.notify({ type: 'error', message: '这是一个出错的提示！' })" />
</div>

```javascript
messageBox.notify({
  title: '保存成功',
  message: '记录已更新',
  type: 'success',   // alert | success | warn | error
  duration: 3000     // 自动关闭延时（毫秒），默认 3000
})
```

## 纯字符串形式

只传消息文案：

<div class="mu-demo">
  <mu-button caption="纯文本通知" @click="messageBox.notify('记录已更新')" />
</div>

```javascript
messageBox.notify('记录已更新')
```

## API

### messageBox.notify

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| （字符串形式） | String | — | 仅消息文案 |
| `title` | String | — | 通知标题 |
| `message` | String | — | 通知内容 |
| `type` | String | `'alert'` | `alert` \| `success` \| `warn` \| `error` |
| `duration` | Number | `3000` | 自动关闭延时（毫秒） |
