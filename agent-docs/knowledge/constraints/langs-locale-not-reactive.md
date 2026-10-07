# 国际化：locale 无响应式，运行时不可切换

## 结论

`t()` 读的是模块级普通变量，语言只在库安装时确定一次（插件选项 `locale`，缺省按 `navigator.language`）。运行时不存在可 watch 的响应式 locale，重新调用 `setupLocale` 也不会触发任何组件重渲染。

## 原因

`src/langs/index.js`：`resources` / `currentLocale` 为普通 `let` 变量，`setupLocale()` 在库内仅由插件 install 调用一次（`src/index.js:48`）；`t()` 直接查表拼字符串，无 ref/reactive 参与。

## 注意

- 组件内写 `watch(locale, …)` 或"语言切换后重算"无法实现；要支持运行时切换，须先把 langs 改造为响应式（独立任务，非局部改动）。
- 依赖文案宽度的计算（如 pagination 页码按钮数）只需按首测时的语言成立，不必为"切语言"预留重算路径。
