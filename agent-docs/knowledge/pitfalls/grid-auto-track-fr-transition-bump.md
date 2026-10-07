# grid-template-rows 过渡中 auto 轨道被 fr 插值隆起

## 结论

`grid-template-rows: auto 0fr ↔ auto 1fr` 过渡中，auto 轨道的 used size 不是恒定值：随过渡进度钟形隆起再回落（实测首轨道 48px → 77.2px → 48px）。auto 轨道上的 grid item 被 stretch 拉高，行内垂直居中的内容随之下沉再回弹，表现为「行位置抖一下」，展开/收起两个方向都出现。

修复二选一：

- 首轨道用确定长度：`grid-template-rows: <length> 0fr ↔ <length> 1fr`，全程恒定（已实测验证）；
- fr 轨道独立成只含单一 fr 轨道的动画容器（`0fr ↔ 1fr`，side-menu 旧结构 `.mu-side-menu__group` 的做法），无 content-based 轨道参与，无此问题。

## 原因

Blink 对含 fr 的 track 列表做数值插值，过渡期间每帧重新跑 track sizing；content-based 轨道（`auto`、`minmax(<length>, auto)`，min 是 content-based 同样中招）按 fr 中间态布局解析出大于实际内容贡献的 used size。容器高度 indefinite（由内容撑开，如菜单列表）时必现。确定长度轨道不参与 content sizing，故恒定。

## 注意

- 验证方法：逐帧读 `getComputedStyle(el).gridTemplateRows`，首轨道值随帧变化即中招；对照显式长度版确认。
- 与 `grid-0fr-track-margin-leak.md` 同域不同坑：那条是 margin 泄漏进 0fr 轨道（收起残留空隙），本条是 auto 轨道自身在过渡中膨胀（行内内容抖动）。
