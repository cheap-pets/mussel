# Vue production 构建 setupState 为空

## 触发特征
headless/CDP 断言经组件实例内部通道（`el.__vueParentComponent.setupState` / `.props` 直替）取值恒空或不可用，页面功能本身正常。

## 根因
`__vueParentComponent` 等 dev-only 内部通道仅 dev 构建存在；production 构建（`npm run build` 产物、`demo:build` 生产包）不暴露组件内部态。

## 做法
- 错误：在 production 产物上按 dev-only 通道断言组件内部状态。
- 正确：改用页面真实 UI 控件驱动（点击、键盘、控件显隐）+ DOM/像素断言，断言语义不变。

## 来源
本仓库 demo headless Edge 验证实证（agent-docs/plans/20261105-table-ex-cell-select/05-verify-1.md「手段偏离」）。

## 注意
dev 构建（demo watch 的 dev 产物）仍可用实例直替路径，见「Playwright 验证 watch 驱动路径」条目；按被测构建选择通道。
