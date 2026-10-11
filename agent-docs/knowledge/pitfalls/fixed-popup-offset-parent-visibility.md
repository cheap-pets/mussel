# fixed 弹层可见性断言不可用 offsetParent

## 结论

断言本项目弹层（popup-menu / dropdown-panel 等固定定位 + `v-show` 面板）是否可见时，不可用 `el.offsetParent !== null`：fixed 元素的 `offsetParent` 恒为 `null`，可见弹层会被误判为隐藏。

正确做法：

- playwright 侧：`page.$$('.mu-popup-menu:visible')`（`:visible` 伪类按 display/visibility 判断）。
- 页内 JS 侧：`el.getClientRects().length > 0`，或直接读 v-show 绑定的 `style.display`。

## 原因

- HTML 规范规定 `offsetParent` 对 `position: fixed` 元素返回 `null`。
- 本项目弹层经 `usePopupRunner` 挂 `v-show="popupStyle"`，Teleport 至根容器并 fixed 定位，命中上述规则。

## 注意

`visibility: hidden` 不影响 `offsetParent`，但会使 `:visible` / 命中测试失效——入场编舞起点 `{ visibility: 'hidden' }` 期间弹层"在 DOM 却不可见"，断言时机须在编舞完成后（show 后等一拍）。
