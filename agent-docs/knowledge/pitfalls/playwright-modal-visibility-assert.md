# Playwright 断言 modal 可见性须用 mask 的 display

## 触发特征
合成/真实 ESC 或按钮关闭模态框后，断言 `getComputedStyle(document.querySelector('.mu-dialog')).display !== 'none'` 恒为 true，误判"关闭失效"。

## 根因
`getComputedStyle` 只取元素自身计算值，不考虑祖先。mu-dialog 结构为 `.mu-modal-mask`（v-show 控制 display）> `.mu-dialog`，后者自身 display 恒为块级，遮罩隐藏后仍返回非 none。

## 做法
- 错误：断言 `.mu-dialog` / `.mu-drawer` 自身的 display。
- 正确：取 `el.closest('.mu-modal-mask')` 的 display（none = 已关闭）；注意 Teleport 后遮罩挂在 body 下，须按内容定位再向上找。

## 来源
- src/components/modal/dialog.vue / modal.js（modalVisible → mask v-show）
- demo 重构批次 6 验证（2026-10-20）
