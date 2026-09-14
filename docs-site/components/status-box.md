# 状态占位 MuStatusBox

状态占位面板，用于空状态、加载失败、无权限等场景的整块占位展示。提供图标、标题、补充说明与自定义操作区（default 插槽）。

## 基础用法

<div class="mu-demo">
  <mu-status-box
    width="360" height="240"
    icon="info"
    title="暂无数据"
    message="请调整筛选条件后重试">
    <mu-button button-style="outline" caption="重置筛选" />
  </mu-status-box>
  <mu-status-box
    width="360" height="240"
    icon="alert"
    title="加载失败"
    message="请检查网络后重试">
    <mu-button color="primary" caption="重新加载" />
  </mu-status-box>
</div>

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

## 自定义图标 `#icon`

插槽形式完全自定义图标区域（如图片、自定义图形）：

```html
<mu-status-box title="NOT FOUND" message="页面不存在">
  <template #icon>
    <div style="width: 64px; height: 64px; background: var(--mu-warning-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px;">
      !
    </div>
  </template>
  <mu-button color="primary" round caption="返回首页" />
</mu-status-box>
```

## 操作区布局

default 插槽内容渲染在说明文字下方，可配合 flex 原子类自由排布：

```html
<mu-status-box icon="info" title="NOT FOUND" message="Something Wrong Here !">
  <div class="flex mt-auto self-stretch">
    <mu-button color="primary" round caption="Create New ..." />
    <span class="flex-1" />
    <mu-button round caption="Dismiss" />
  </div>
</mu-status-box>
```

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 状态图标（已注册图标名） |
| `title` | String | 状态标题 |
| `message` | String | 补充说明 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义内容（如操作按钮） |
| `icon` | 自定义图标（图片形式），优先于 `icon` 属性 |
