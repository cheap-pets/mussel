# 基础元素组件 API

### MuIcon

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 已注册图标名，或以 `.` 开头的 icon-font class |
| `tag` | String | 渲染的 DOM 标签，默认 `span` |

**图标注册（应用入口处统一注册）：**
```javascript
import { install as installMussel, installIcons } from 'mussel'
import EditIcon from '@/assets/icons/edit.svg'

// 安装时注册
installMussel(app, {
  icons: {
    edit: EditIcon,           // SVG 文件
    bolt: 'icon icon-bolt'    // icon-font class
  }
})

// 或后续补充注册
installIcons({ refresh: RefreshIcon })
```

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
