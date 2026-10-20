# Demo - 组件演示页面

Mussel 4 组件库的演示页面，使用 Vue 3 + Vite 构建，同时承担开发验证与用法参考两个职责。

## 目录结构

```
demo/
├── src/
│   ├── catalog.js             # 页面清单（单一事实源：首页导航、构建入口、面包屑、上下页）
│   ├── common/                # 共享基础设施
│   │   ├── app.js             # 应用引导（安装 mussel）
│   │   ├── demo-page.vue      # 统一页面骨架（页头/面包屑/主题切换/上下页）
│   │   ├── demo-section.vue   # 统一章节容器（编号/说明/示例区/代码块）
│   │   ├── theme-switch.vue   # 深浅色切换
│   │   ├── style.css          # 全站版式样式
│   │   ├── template.html      # HTML 模板（占位符由构建填充）
│   │   └── favicon.svg
│   ├── home/                  # 首页（Vue 入口，卡片导航由 catalog 渲染）
│   ├── basics/                # 分类目录，共 9 个分类（basics/buttons/form/data/navigation/feedback/overlay/layout/advanced）
│   └── <分类>/<页面>/          # 两级页面目录，各含 main-view.vue + main.js
└── dist/                      # 构建输出（demo/dist/<分类>/<页面>/）
```

40 个页面 + 首页，页面清单见 `src/catalog.js`，首页 `http://localhost:3000` 可导航到全部页面。

## 构建

```bash
# 先构建主库
npm run build

# 构建并监听 demo（watch 模式，同时在 3000 端口托管 demo/dist）
npm run demo:build
```

## 本地预览

`npm run demo:build` 会自动启动静态服务：

- 首页: http://localhost:3000
- 组件示例: http://localhost:3000/form/input/ 等（URL 与 `demo/src` 目录一致，内部链接统一带尾斜杠）

## 添加新页面

1. 在对应分类目录下创建页面目录: `demo/src/<分类>/<页面>/`，含 `main-view.vue` + `main.js`
2. 在 `demo/src/catalog.js` 中登记页面（path/title/desc）
3. 重启 `npm run demo:build`（watch 不跟踪新增目录与 catalog 变更）

页面模板使用统一骨架：

```vue
<template>
  <demo-page path="buttons/button">
    <demo-section title="基础用法" note="一句话说明" :code="basicCode">
      <mu-button>确定</mu-button>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'
</script>
```

```js
import { createVueApp } from '../../common/app.js'
import MainView from './main-view.vue'

createVueApp(MainView)
```

约定：

- 页面内容只放 `demo-section`，组件页不超过 8 个 section；综合案例页使用 `<demo-page fluid>` 全宽布局
- 交互示例必须给出操作提示（note 写清触发方式与预期结果），弹层示例固定触发按钮
- 页面不自行添加 `.mu-root` 与主题切换（由 demo-page 统一提供）
- 未登记到 catalog 的页面目录会在构建时告警

## Vite 配置

配置文件: `vite.demo.config.js`

- 构建入口来自 `catalog.js` 登记页 + `home/`
- 使用 `common/template.html` 生成各页面 HTML（自动注入标题与相对根路径）
- `home/` 生成 `dist/index.html`
- 通过 `mussel` 别名直接引用源码
- catalog 是配置的加载期依赖，修改后需重启 `npm run demo:build`
