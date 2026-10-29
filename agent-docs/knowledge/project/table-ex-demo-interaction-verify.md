# table-ex demo 页交互验证（合成点击 + getLayoutInfo + 日志读取）

## 结论

- 单元格点击：向 `.mu-table-ex__sticky` 派发 `PointerEvent('pointerdown'/'pointerup')` + `MouseEvent('click')`，均带 `clientX/clientY`（`pointOf` 按 `clientX − canvas.getBoundingClientRect()` 换算，缺坐标则命中失败）。
- 坐标计算：`canvas.__vueParentComponent.exposed.getLayoutInfo()` 取 `colWidths`（含首列 48px check 列）前缀和 + 列宽/2，`y = headHeight + 18`（首行）。
- 断言时机：编辑器浮层 `__editor` 由 v-if 渲染，dispatch 后须 `await ~80ms+` 再查 DOM，同步查询恒为不存在。
- 事件日志 `.ct-event-log__item` 为 unshift 最新在前：`slice(0, n)` 读最新，`slice(-n)` 读到最旧。
- 条目（button/tag/link）hover/click 命中矩形 = 绘制区域（pill 高 20 / link 行框 18，2026-10-28 起），非整格高；格内 pill 下方不发 cell-item-click、cursor 不变 pointer。
- 探针定位 pill 须逐 pill 像素聚类：相邻 pill 间有 8px gap，取 pill 组联合包围盒中点会落进间隙造成假阴性。

## 来源

- demo/src/data/table-ex/main-view.vue（logEvent unshift、stageColumns 列序）
- src/components/table-ex/table-ex.vue（sticky 监听层、pointOf、getLayoutInfo expose）
- 2026-10-28 编辑态保持改造的 playwright 实测

## 注意

- stage 名称列（colIndex 2）未配 editor 不可编辑；可编辑列：状态 3 / 数量 4 / 金额 5 / 日期 6 / 备注 7 / 启用 8。
- items 场景行高随链接数变高（70/88/36+），pill 贴首行槽位锚（格顶 36/54/90 处）；默认场景无 button 列，须先切「条目/新列型」。
- 下拉面板选项为 `.mu-dropdown-panel .mu-option`（Teleport 到 body），延时收起，选后约数百毫秒才从 DOM 移除，勿据「仍存在」断言未关闭。
