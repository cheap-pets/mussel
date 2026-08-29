# 基础元素组件 API

### MuIcon

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 已注册图标名，或以 `.` 开头的 icon-font class；可带动画后缀 `name:animation`（如 `loading` 图标默认 `spin`） |
| `animation` | String | 动画效果；单独设置时优先于 `icon` 值中的 `:animation` 后缀 |
| `tag` | String | 渲染的 DOM 标签，默认 `span`（仅 `'a'` 渲染链接，其余值回退 `span`） |

**图标注册（应用入口处统一注册）：**

```javascript
import { install as installMussel, installIcons } from 'mussel'
import EditIcon from '@/assets/icons/edit.svg'

// 安装时注册
installMussel(app, {
  icons: {
    edit: EditIcon,           // SVG 源码字符串
    bolt: 'icon icon-bolt'    // icon-font class
  }
})

// 或后续补充注册
installIcons({ refresh: RefreshIcon })
```

> 当使用 vite 打包并未使用文本导入插件时，SVG 需以 `?raw` 导入源码字符串（直接 `import` 得到的是 URL，无法使用）。

```html
<mu-icon icon="edit" />
<mu-icon icon=".icon icon-bolt" />
```

---

### MuBadge

徽章，用于状态标签或角标。无 `defineProps`，颜色变体通过 HTML attribute（非 prop）控制，直接写在标签上即可。

| Attribute | 颜色 |
|-----------|------|
| （无） | 默认灰色（`--mu-gray`） |
| `primary` | 主色 |
| `secondary` | 次要色 |
| `success` | 成功色 |
| `warning` | 警告色 |
| `danger` | 危险色 |

> 空内容时渲染为小圆点（`8px`），背景自动使用 `--mu-danger-color`。

```html
<mu-badge primary>主要</mu-badge>
<mu-badge success>已完成</mu-badge>
<mu-badge danger>异常</mu-badge>
<mu-badge />               <!-- 小红点 -->
```

---

### MuSortIcon

排序方向指示图标，常置于表格/列表表头。

| 属性 | 类型 | 说明 |
|------|------|------|
| `direction` | String | 高亮方向：`up`（升序）\| `down`（降序），不设置时上下三角均不填充 |

```html
<mu-sort-icon direction="up" />
<mu-sort-icon direction="down" />
```
