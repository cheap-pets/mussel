# Mussel 盒模型基本元素



### 非兼容提示

在老版本中，class 为 `mu-`  开头的元素，均可使用 `margin` 、 `width`  之类的修饰属性。

这种方式或多或少会为浏览器带来一些渲染性能的压力。

在 Mussel 3 中，设置元素定位、尺寸、边距、边框之类的修饰属性，均需用在指定 class 为 `mu-box` 的元素上。



### 使用说明

示例：

```html
<div class="mu-box" layout="flex" position="absolute fit" margin="1x">
  <div class="mu-box" border margin="1x" width="350">Cell 1</div>
  <div class="mu-box" border margin="1x" flex="1">Cell 2</div>
</div>
```



#### 相关属性配置

| 元素属性 | （默认）值 | 说明                                                         |
| -------- | ---------- | ------------------------------------------------------------ |
| class    | mu-box     | 必要属性，设置 .mu-box 元素类。                              |
| layout   | flex       | 可选值：flex，grid，设置 .mu-box 元素的布局模式。详见布局文档。 |
| *        | -          | 详见表格后说明。                                             |
|          |            |                                                              |



##### 定位 Position

设置格式为：position="[relative | absolute | fixed] [top | left | right | bottom]* [fit]"

其中，“fit” 表示在各方向充满父容器。

示例：

```html
<div class="mu-box" position="absolute fit">四个方向充满容器</div>
<div class="mu-box" position="absolute top left">位于左上角</div>
<div class="mu-box" position="absolute fit right">充满右侧</div>
```



##### 边框 Border

相关属性名：

- border 四面边框
- border-x 左右边框
- border-y 上下边框
- border-left 左侧边框
- border-right 右侧边框
- border-top 上方边框
- border-bottom 下方边框



属性值设置格式：

"[宽度（0 | thin | thick）] [样式（solid | dashed | dotted）] [颜色（primary | secondary | danger）] "



示例：

```html
<div class="mu-box" border>四面默认边框</div>
<div class="mu-box" border-x="thick primary">左右主色厚边框</div>
<div class="mu-box" border-x="thick primary" border-top="dashed danger">左右主色厚边框，上方危险色虚线边框</div>
```



##### 宽度 Width

设置格式为：width="n | n%"。

可选值为：

- 像素值：0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000,
- 百分比值：10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%
- 自动宽度：auto





##### 高度 Height

设置格式为：height="n | n% | auto"。

可选值为：

- 像素值：0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000,
- 百分比值：10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%
- 自动宽度：auto



##### 外边距 Margin

相关属性名：

- margin 四面外边距
- margin -x 左右外边距
- margin -y 上下外边距
- margin -left 左侧外边距
- margin -right 右侧外边距
- margin -top 上方外边距
- margin -bottom 下方外边距



可选值为：

- 相对单位值：0, 1x, 2x, 3x, 4x，表示 n 倍单位尺寸；
- 自动大小：auto



示例：

```html
<div class="mu-box" margin="1x">四面单倍边距</div>
<div class="mu-box" margin-x="2x">左右双倍边距</div>
<div class="mu-box" margin-x="2x" margin-y="1x">左右双倍边距，上下单倍边距</div>
```





##### 内边距 Padding

相关属性名：

- padding 四面内边距
- padding-x 左右内边距
- padding-y 上下内边距
- padding-left 左侧内边距
- padding-right 右侧内边距
- padding-top 上方内边距
- padding-bottom 下方内边距



可选值为：

- 相对单位值：0, 1x, 2x, 3x, 4x，表示 n 倍单位尺寸；
- 自动大小：auto



示例：

```html
<div class="mu-box" padding="1x">四面单倍边距</div>
<div class="mu-box" padding-x="2x">左右双倍边距</div>
<div class="mu-box" padding-x="2x" padding-y="1x">左右双倍边距，上下单倍边距</div>
```



