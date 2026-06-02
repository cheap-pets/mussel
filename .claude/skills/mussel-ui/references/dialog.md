# dialog.md — 模态与抽屉组件 API

---

## MuDialog

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `visible` | Boolean | — | 双向绑定可见状态 |
| `title` | String | — | 对话框标题 |
| `icon` | String\|Object | — | 标题图标 |
| `width` | String\|Number | — | 窗口宽度 |
| `height` | String\|Number | — | 窗口高度 |
| `buttons` | Array | — | 底部操作按钮，结构见下方 |
| `dismissible` | Boolean\|String | — | 点击遮罩或 ESC 关闭。`true`=两者均可，`'esc'`=仅ESC，`'mask'`=仅遮罩。不设置则不自动关闭 |
| `close-button` | Boolean | `true` | 显示右上角关闭按钮 |
| `maximize-button` | Boolean | — | 显示最大化按钮 |
| `maximize-to-fullscreen` | Boolean | — | 最大化时进入全屏模式 |
| `lazy` | Boolean | `true` | 首次打开时才渲染内容 |
| `keep-position` | Boolean | — | 再次打开时保留上次位置 |
| `dispose-on-hide` | Boolean | — | 隐藏时销毁内容 |
| `z-index` | String | — | 自定义层级 |
| `mask-class` | — | — | 遮罩 class |
| `mask-attrs` | Object | — | 透传给遮罩的额外属性 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:visible` | `value, action, trigger` | 可见状态变更（可通过 action 判断关闭原因） |
| `button-click` | `button` | 底部按钮点击 |
| `show` / `hide` | — | 显示/隐藏时触发 |

| 插槽 | 说明 |
|------|------|
| `header` | 完全自定义头部 |
| `header-prepend` / `header-append` | 头部前/后置内容 |
| `footer` | 完全自定义底部 |
| `footer-prepend` / `footer-append` | 底部前/后置内容 |

**buttons 结构：**
```javascript
buttons: [
  { caption: '确定', primary: true, action: 'ok' },
  { caption: '取消', action: 'cancel' }
]
```

```html
<mu-dialog
  v-model:visible="visible"
  title="编辑用户"
  width="560px"
  :buttons="[{ caption: '保存', primary: true, action: 'save' }, { caption: '取消' }]"
  dismissible
  @button-click="onButton"
  @update:visible="onVisibleChange"
>
  <mu-form label-width="80px">
    <!-- 表单内容 -->
  </mu-form>
</mu-dialog>
```

---

## MuDrawer

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `visible` | Boolean | — | 双向绑定可见状态 |
| `position` | String | `bottom` | `top` \| `right` \| `bottom` \| `left` |
| `width` | String\|Number | — | 宽度（left/right 时有效） |
| `height` | String\|Number | — | 高度（top/bottom 时有效） |
| `dismissible` | Boolean\|String | — | 点击遮罩或 ESC 关闭。`true`=两者均可，`'esc'`=仅ESC，`'mask'`=仅遮罩。不设置则不自动关闭 |
| `mask` | Boolean | `true` | 是否显示遮罩 |
| `border-radius` | Boolean | — | 是否圆角 |
| `teleport` | Boolean | `true` | 渲染到页面根容器 |
| `dispose-on-hide` | Boolean | — | 隐藏时销毁内容 |
| `dismissible` | Boolean\|String | — | 点击遮罩或 ESC 关闭。`true`=两者均可，`'esc'`=仅ESC，`'mask'`=仅遮罩。不设置则不自动关闭 |
| `lazy` | Boolean | `true` | 首次打开时才渲染内容 |
| `mask-class` | — | — | 遮罩 class |
| `mask-attrs` | Object | — | 透传给遮罩的额外属性 |

| 事件 | 说明 |
|------|------|
| `update:visible` | 可见状态变更 |
| `show` / `hide` | 显示/隐藏 |

```html
<mu-drawer v-model:visible="drawerVisible" position="right" width="400px" dismissible>
  <div class="mu-v-box" style="height: 100%">
    <div class="flex-none px-2x py-1x border-b border-soft text-normal">详情</div>
    <mu-scroll-box class="flex-1 p-2x">内容区域</mu-scroll-box>
  </div>
</mu-drawer>
```
