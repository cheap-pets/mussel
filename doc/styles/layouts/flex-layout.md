# 使用 Flex 布局



### 非兼容提示

在 Mussel 3 中，不再以组件形式（ `mu-flex-box`、`mu-h-box`、`mu-h-box`、`mu-flex-item` ）来提供 Flex 布局能力。

过多的组件嵌套，会或多或少的降低页面渲染性能，并影响浏览器 Vue 开发插件使用的愉悦程度。



### 使用说明

示例：

```html
<div class="mu-box" layout="flex" position="absolute fit" margin="1x">
  <div class="mu-box" border margin="1x" width="350">Cell 1</div>
  <div class="mu-box" border margin="1x" flex="1">Cell 2</div>
</div>
```



Flex 布局，由 `布局容器元素` 与若干 `布局子项元素` 组成。



#### 布局容器相关属性配置

| 元素属性        | （默认）值 | 说明                                                         |
| --------------- | ---------- | ------------------------------------------------------------ |
| class           | mu-box     | 必要属性，设置 .mu-box 元素类。                              |
| layout          | flex       | 必要属性，设置 .mu-box 元素使用 Flex 布局。                  |
| inline          | -          | 添加该属性，元素 display 将设置为 inline-flex，否则为 flex。 |
| direction       | row        | 布局（主轴）排列方向。可选值：row、column。                  |
| reverse         | -          | 添加该属性，表示子元素在主轴方向反向排列。                   |
| flex-center     | -          | 设置布局项元素在容器内垂直与水平方向同时居中（通常用于只有一个子元素且需要居中的情况） |
| justify-content | flex-start | 子元素在主轴对齐方式。可选值：flex-start, flex-end, center, space-between, space-around。 |
| align-items     | stretch    | 子元素在交叉轴对齐方式。可选值：flex-start, flex-end, center, baseline, stretch。 |
| flex-wrap       | -          | 添加该属性，表示子元素溢出后，可在主轴方向换行（列）。       |
|                 |            |                                                              |



#### 布局子项相关属性配置

| 元素属性   | （默认）值 | 说明                                                         |
| ---------- | ---------- | ------------------------------------------------------------ |
| class      | -          | 若父元素是 flex 容器，但非通过 .mu-box[layout=flex] 指定，则可将该子元素指定为 .mu-flex-cell 以获得布局项能力。 |
| flex       | -          | 设置格式为 "n auto"，如："1"、 "2 auto"，其中数字表示缩放时所占空间比率。增加 auto 表示 "flex-basis: auto"，否则为 0。 |
| align-self | stretch    | 当前子元素在交叉轴对齐方式。可选值：flex-start, flex-end, center, baseline, stretch。 |
|            |            |                                                              |



#### 特殊的布局子项

##### 空间间隔

| 元素属性 | （默认）值 | 说明               |
| -------- | ---------- | ------------------ |
| class    | mu-space   |                    |
| *        | -          | 其他同一般布局子项 |
|          |            |                    |

当父元素设置了 flex-wrap 时，则 .mu-space 元素默认尺寸为充满主轴，其表现为后续元素换行显示。

当父元素未设置 flex-wrap 时，则 .mu-space 元素默认设置为 flex: 1 1 0。