<script setup>
  import { ref } from 'vue'

  const tipText = ref('动态提示 1')

  function cycleTip () {
    tipText.value = tipText.value === '动态提示 1'
      ? '动态提示 2（updated 字段 diff 同步，不重播动画）'
      : '动态提示 1'
  }
</script>

# 文字提示 MuTooltip / v-mu-tooltip 指令

文字提示气泡，与 dropdown 等弹层互斥（同屏一个）。提供两种形态，共享同一单例浮层：

- **组件 `<mu-tooltip>`**：renderless（本体零 DOM 输出），克隆唯一子节点并链式合并锚点事件；`#tooltip` 插槽支持富内容（优先于 `content` prop）
- **指令 `v-mu-tooltip`**：纯文本提示（`textContent` 渲染），零 DOM 侵入，任意元素/组件可挂。value 为字符串或 `{ content, placement, trigger, arrow, disabled }` 对象，动态 value 经字段 diff 热更新（不重播动画）

## 组件形态

要求唯一元素（或单根组件）子节点；纯文本 / 多节点子节点不支持（dev 警告）。

<div class="mu-demo">
  <mu-tooltip content="删除后不可恢复">
    <mu-button color="danger">删除</mu-button>
  </mu-tooltip>
  <mu-tooltip placement="right" content="右侧提示（主轴空间不足自动翻转）">
    <mu-icon-button icon="info" />
  </mu-tooltip>
  <mu-tooltip :arrow="false" content="无箭头提示">
    <mu-button>无箭头</mu-button>
  </mu-tooltip>
  <mu-tooltip trigger="focus" content="聚焦时显示的提示">
    <mu-input placeholder="focus 触发" />
  </mu-tooltip>
  <mu-tooltip trigger="click" content="点击触发的提示（外点 / ESC 关闭）">
    <mu-button>Click Trigger</mu-button>
  </mu-tooltip>
</div>

```html
<mu-tooltip content="删除后不可恢复">
  <mu-button color="danger">删除</mu-button>
</mu-tooltip>

<!-- 12 方位 -->
<mu-tooltip placement="right" content="右侧提示">
  <mu-icon-button icon="info" />
</mu-tooltip>

<!-- 触发方式：hover（默认）/ focus / click -->
<mu-tooltip trigger="click" content="点击触发">
  <mu-button>Click</mu-button>
</mu-tooltip>
```

## 富内容插槽 `#tooltip`

优先于 `content` prop；鼠标移入面板不消失（富内容可停留）：

<div class="mu-demo">
  <mu-tooltip placement="bottom">
    <mu-icon-button icon="question" />
    <template #tooltip>
      支持 <b>富文本</b> 内容
    </template>
  </mu-tooltip>
  <mu-tooltip content="长文本换行：提示内容超过最大宽度 320px 时会自动折行，保证在狭小视口内仍然可读。">
    <mu-button>长文本</mu-button>
  </mu-tooltip>
</div>

```html
<mu-tooltip placement="bottom">
  <mu-icon-button icon="question" />
  <template #tooltip>支持 <b>富文本</b> 内容</template>
</mu-tooltip>
```

## 指令形态 `v-mu-tooltip`

纯文本提示，任意元素/组件可挂，零 DOM 侵入：

<client-only>
  <div class="mu-demo">
    <mu-button v-mu-tooltip="'字符串指令提示'">v-mu-tooltip</mu-button>
    <mu-button v-mu-tooltip="{ content: '对象配置 · bottom-end', placement: 'bottom-end' }">对象 value</mu-button>
    <mu-button v-mu-tooltip="'动态 value：点击切换'" @click="cycleTip">动态 value</mu-button>  </div>
</client-only>

```html
<!-- 字符串 / 对象 / 动态 -->
<mu-button v-mu-tooltip="'删除后不可恢复'" color="danger">删除</mu-button>
<mu-icon-button v-mu-tooltip="{ content: '刷新数据', placement: 'right' }" icon="refresh" />
<mu-button v-mu-tooltip="tipText">保存</mu-button>
```

```javascript
const tipText = ref('初始提示')
// 动态 value 经字段 diff 热更新，不重播动画
tipText.value = '更新后的提示'
```

## 12 方位 `placement`

主方向 `top` / `bottom` / `left` / `right`，后缀 `-start` / `-end`（裸主方向居中）。主轴空间不足自动翻转（对齐后缀保留），交叉轴视口夹紧，箭头始终指向锚点中心。

<div class="mu-demo" style="flex-wrap: wrap;">
  <mu-tooltip v-for="p in ['top-start', 'top', 'top-end', 'right-start', 'right', 'right-end', 'bottom-start', 'bottom', 'bottom-end', 'left-start', 'left', 'left-end']" :key="p" :content="`placement: ${p}`" :placement="p">
    <mu-button button-style="outline">{{ p }}</mu-button>
  </mu-tooltip>
</div>

```html
<mu-tooltip placement="top-start" content="top-start">
  <mu-button>top-start</mu-button>
</mu-tooltip>
```

## 注意事项

- hover 触发有 100ms 显示延迟与 300ms 隐藏延迟（硬编码）；鼠标移入面板不消失
- 滚动时跟随锚点重定位，锚点出视口自动隐藏；长文本最大宽度 320px 自动换行
- 原生 `disabled` 属性的控件不派发鼠标事件，tooltip 无法触发；需挂在外层非 disabled 元素上
- 建议移除元素自带的原生 `title` 属性，避免浏览器原生与 mu 双提示

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `content` | String | — | 提示文本；有 `#tooltip` 插槽时忽略（仅组件形态） |
| `placement` | String | `'top'` | 12 方向：`top` / `bottom` / `left` / `right`，后缀 `-start` / `-end` |
| `trigger` | String | `'hover'` | `'hover'` / `'focus'` / `'click'`；click 触发时外点与 ESC 关闭 |
| `arrow` | Boolean | `true` | 是否显示箭头 |
| `disabled` | Boolean | `false` | 禁用（不触发显示，显示中则隐藏） |

指令 value：字符串或 `{ content, placement, trigger, arrow, disabled }`。

| 事件 / expose | 说明 |
|------|------|
| `show` / `hide` | 面板显示 / 隐藏时触发（仅组件形态） |
| `show()` / `hide()` / `updatePosition()` | 组件 expose 的手动控制方法 |
