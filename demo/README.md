# Demo - 组件演示页面

Mussel 4 组件库的演示页面，使用 Vue 3 + Vite 构建。

## 目录结构

```
demo/
├── src/                       # 源代码目录
│   ├── index.html             # 导航首页
│   ├── common/                # 共享资源
│   │   ├── app.js             # 应用引导
│   │   ├── style.css          # 共享样式
│   │   └── template.html      # HTML 模板
│   ├── button/                # 按钮组件演示
│   │   ├── ButtonDemo.vue     # Vue 组件
│   │   └── main.js            # 入口文件
│   ├── input/                 # 输入框组件演示
│   ├── form/                  # 表单组件演示
│   ├── modal/                 # 模态框组件演示
│   ├── tabs/                  # 标签页组件演示
│   ├── dropdown/              # 下拉菜单组件演示
│   ├── combo-box/             # 组合输入框组件演示
│   ├── selection/             # 选择组件演示
│   ├── calendar/              # 日历组件演示
│   ├── tree/                  # 树形组件演示
│   ├── table/                 # 表格组件演示
│   ├── color/                 # 颜色组件演示
│   ├── message/               # 消息提示组件演示
│   ├── flex-layout/           # Flex 布局演示
│   ├── grid-layout/           # Grid 布局演示
│   ├── scrollbar/             # 滚动条样式演示
│   └── gesture/               # 手势交互演示
└── dist/                      # 构建输出目录
    ├── index.html             # 导航首页
    ├── button/
    │   ├── index.html
    │   ├── main.js
    │   └── style.css
    ├── assets/                # 共享资源
    └── ...
```

## 构建

```bash
# 先构建主库
npm run build

# 再构建 demo
npm run build:demo
```

构建产物输出到 `demo/dist/` 目录。

## 本地预览

构建完成后需要通过 HTTP 服务器访问：

```bash
npx serve demo/dist
```

- 导航首页: http://localhost:3000
- 各组件示例: http://localhost:3000/button/、http://localhost:3000/table/ 等

## 添加新组件示例

1. 创建目录: `demo/src/my-component/`
2. 创建 `MyComponentDemo.vue` — Vue 组件，使用 `<script setup>` + Composition API
3. 创建 `main.js` — 入口文件:

```js
import { createVueApp } from '../common/app.js'
import MyComponentDemo from './MyComponentDemo.vue'

createVueApp(MyComponentDemo)
```

4. 在 `demo/src/index.html` 导航首页中添加卡片入口
5. 重新执行 `npm run build:demo`

## Vite 配置

配置文件: `vite.demo.config.js`

- 自动扫描 `demo/src/` 下包含 `main.js` 的目录作为构建入口
- 使用 `common/template.html` 作为各页面 HTML 模板
- 复制 `demo/src/index.html` 作为导航首页
- 通过 `mussel` 别名直接引用源码
