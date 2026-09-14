<script setup>
  import { ref } from 'vue'

  const date = ref(null)
</script>

# 月历 MuCalendar

月历组件，用于**页面内嵌**的日期展示与选择——区别于 `MuDateInput` 的下拉面板形态，适合仪表盘、日程页等直接展示日历的场景。

## 基础用法

<!-- 日历面板依赖客户端当前日期与 locale，SSR 与客户端渲染必然不一致，需 ClientOnly -->
<ClientOnly>
  <div class="mu-demo" style="align-items: flex-start;">
    <mu-calendar v-model="date" style="width: 360px; padding: 8px;" />
    <span class="text-subtle">选中：{{ date ? new Date(date).toLocaleDateString() : '（未选择）' }}</span>
  </div>
</ClientOnly>

```html
<mu-calendar v-model="date" />
```

## 可选范围与起始日

`min` / `max` 限制可选日期范围；`week-starts-on` 控制每周起始日（默认读全局 `calendar.weekStartsOn` 配置）：

```html
<mu-calendar v-model="date" min="2026-01-01" max="2026-12-31" :week-starts-on="1" />
```

## 在表单中使用

通过 `MuFormField` 的自定义渲染嵌入：

```html
<mu-form-field label="日期">
  <mu-calendar v-model="form.date" />
</mu-form-field>
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `model-value` | Date\|String | — | 双向绑定日期值；输出形态由 `value-type` 控制 |
| `value-type` | String | `'date'` | 输出值类型：`'date'`（Date 对象）\| `'string'`（按 `value-format` 输出字符串） |
| `value-format` | String | `yyyy-MM-dd` | 仅 `value-type="string"` 时生效的输出格式 |
| `week-starts-on` | Number | `0` | 每周起始日（0=周日 ~ 6=周六） |
| `min` / `max` | Date\|String | — | 最小 / 最大可选日期 |
