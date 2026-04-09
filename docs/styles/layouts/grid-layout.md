# 使用 Grid 布局



### 使用说明

示例：

```html
<div
    class="mu-box"
    layout="grid"
    position="fixed fit"
    columns="6"
    rows="6"
    justify-content="center"
    align-content="center"
    padding="1x">
    <div class="mu-box" border col-start="1" col-end="3" row-start="1" row-span="3" margin="1x">1</div>
    <div class="mu-box" border row-start="4" row-span="2" margin="1x" margin="1x">2</div>
    <div class="mu-box" border margin="1x">3</div>
    <div class="mu-box" border margin="1x">4</div>
    <div class="mu-box" border margin="1x">5</div>
    <div class="mu-box" border margin="1x">6</div>
    <div class="mu-box" border margin="1x">7</div>
    <div class="mu-box" border margin="1x">8</div>
    <div class="mu-box" border margin="1x">9</div>
    <div class="mu-box" border margin="1x">10</div>
    <div class="mu-box" border margin="1x">11</div>
    <div class="mu-box" border margin="1x" row-span="2">12</div>
  </div>
```



Grid 布局，由 `布局容器元素` 与若干 `布局子项元素` 组成。

推荐的使用场景是，将容器均匀划分为 n 列 m 行，然后通过设置单元格的位置与跨越的格数，来完成布局。

下列元素属性，基本对应到 CSS Grid 布局中相关样式，请提前了解 Grid 布局基本知识。



#### 布局容器相关属性配置

| 元素属性        | （默认）值 | 说明                                                         |
| --------------- | ---------- | ------------------------------------------------------------ |
| class           | mu-box     | 必要属性，设置 .mu-box 元素类。                              |
| layout          | grid       | 必要属性，设置 .mu-box 元素使用 Grid 布局。                  |
| inline          | -          | 添加该属性，元素 display 将设置为 inline-grid，否则为 grid。 |
| direction       | row        | 布局（主轴）排列方向。可选值：row、column。                  |
| columns         | -          | 必要属性，表示将容器划分为多少列；                           |
| rows            | -          | 必要属性，表示将容器划分为多少行；                           |
| dense           | -          | 添加该属性，表示子元素紧密排列，会尽量占满前面的格子。       |
| column-size     | -          | 单元格标准宽度，可选值：50, 100, 150, 200, 250, 300, 350, 400, 450, 500。不填则自动均分容器。 |
| row-size        | -          | 单元格标准高度，可选值：50, 100, 150, 200, 250, 300, 350, 400, 450, 500。不填则自动均分容器。 |
| justify-content | start      | 子元素在容器中的水平位置，可选值：start, end, center, stretch, space-around, space-between, space-evenly |
| align-content   | start      | 子元素在容器中的垂直位置，可选值：start, end, center, stretch, space-around, space-between, space-evenly |
| place-content   | start      | 子元素在容器中的水平和垂直位置，可选值：start, end, center, stretch, space-around, space-between, space-evenly |
|                 |            |                                                              |



#### 布局子项相关属性配置

| 元素属性     | （默认）值 | 说明                                                         |
| ------------ | ---------- | ------------------------------------------------------------ |
| class        | -          | 若父元素是 grid 容器，但非通过 .mu-box[layout=flex] 指定，则可将该子元素指定为 .mu-grid-cell 以获得布局项能力。 |
| justify-self | start      | 该子元素在容器中的水平位置，可选值：start, end, center, stretch, space-around, space-between, space-evenly |
| align-self   | start      | 该子元素在容器中的垂直位置，可选值：start, end, center, stretch, space-around, space-between, space-evenly |
| place-self   | start      | 该子元素在容器中的水平和垂直位置，可选值：start, end, center, stretch, space-around, space-between, space-evenly |
| col-start    | -          | 元素在容器中的开始列坐标，默认为按规则排列的位置。           |
| col-span     | 1          | 元素在容器中横向跨的列数。不可与 col-end 同时使用。          |
| col-end      | -          | 元素在容器中的结束列坐标。不可与 col-span 同时使用。注：这里与不是结束的单元格线的坐标，而是单元格坐标。 |
| row-start    | -          | 元素在容器中的开始行坐标，默认为按规则排列的位置。           |
| row-span     | -          | 元素在容器中纵向跨的行数。不可与 row-end 同时使用。          |
| row-end      | -          | 元素在容器中的结束行坐标。不可与 rol-span 同时使用。注：这里与不是结束的单元格线的坐标，而是单元格坐标。 |

