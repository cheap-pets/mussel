# Examples2 - 组件演示页面 (Vite 版本)

这是 Mussel 4 组件库的新版演示页面,使用 Vite 构建。

## 目录结构

```
examples2/
├── src/                       # 源代码目录
│   ├── common.css            # 共享样式
│   ├── utils.js              # 工具函数
│   ├── README.md             # 文档
│   ├── index.html            # 导航页面
│   ├── button/               # 按钮组件演示
│   │   ├── ButtonDemo.vue    # Vue 组件
│   │   ├── main.js           # 入口文件
│   │   └── index.html        # HTML 模板
│   ├── input/                # 输入框组件演示
│   │   ├── InputDemo.vue
│   │   ├── main.js
│   │   └── index.html
│   ├── modal/                # 模态框组件演示
│   ├── tabs/                 # 标签页组件演示
│   ├── form/                 # 表单组件演示
│   ├── flex-layout/          # Flex 布局演示
│   ├── grid-layout/          # Grid 布局演示
│   └── ...                   # 其他组件演示
└── dist/                      # 构建输出目录
    ├── button/               # 构建后的示例
    │   ├── index.html
    │   └── main.js
    ├── common.css
    └── assets/
```

## 资源文件说明

构建后的 `examples2/dist/` 目录中的 HTML 文件引用相对路径:

- `../../dist/mussel.css` - 指向项目根目录的 `dist/mussel.css`
- `../../node_modules/@tabler/icons-webfont/...` - 指向项目的 node_modules
- `../common.css` - 指向 `examples2/dist/common.css`

**重要**: 由于使用了相对路径引用项目资源,`examples2/dist/` 目录需要在项目根目录下通过 HTTP 服务器访问。

## 与 examples/ 的区别

### 旧版 (examples/)
- 单个 HTML 文件包含所有代码
- 直接在浏览器中打开即可运行
- 使用编译后的 mussel.js 和 mussel.css

### 新版 (examples2/)
- 代码拆分为 `.vue`、`.js` 和 `.html` 文件
- 需要使用 Vite 构建后运行
- 更好的代码组织和可维护性
- 支持现代前端开发工作流

## 开发

### 构建所有示例

```bash
npm run build:examples
```

构建产物将输出到 `examples2/dist/` 目录。

### 本地开发

#### 方法 1: 使用 HTTP 服务器 (推荐)

构建完成后,使用任意 HTTP 服务器查看示例:

```bash
# 使用 serve
npx serve examples2/dist

# 使用 http-server
npx http-server examples2/dist

# 使用 Python
cd examples2/dist && python -m http.server 8000
```

然后在浏览器中访问:
- 导航页面: http://localhost:8000
- Button 示例: http://localhost:8000/button/
- Input 示例: http://localhost:8000/input/

#### 方法 2: 直接打开 HTML 文件

由于使用了 ES modules 和相对路径,需要通过 HTTP 服务器访问。
**不能直接双击打开 HTML 文件**,否则会因 CORS 策略无法加载模块。

## 添加新组件示例

1. 创建新目录: `examples2/my-component/`
2. 创建三个文件:
   - `MyComponentDemo.vue` - Vue 组件
   - `main.js` - 入口文件
   - `index.html` - HTML 模板

### 示例模板

**MyComponentDemo.vue:**
```vue
<template>
  <div>
    <h2>
      MY COMPONENT
      <mu-switch
        v-model="darkMode"
        active-label="Dark"
        inactive-label="Light"
        @update:model-value="onUIModeChange">
      </mu-switch>
    </h2>
    <!-- 组件演示内容 -->
  </div>
</template>

<script setup>
import { ref } from 'vue'

const darkMode = ref(false)

const onUIModeChange = () => {
  document.querySelector('.mu-root').classList.toggle('mu-dark')
}
</script>
```

**main.js:**
```javascript
import { createApp } from 'vue'
import MyComponentDemo from './MyComponentDemo.vue'
import { install } from '../../../dist/mussel.js'

const app = createApp(MyComponentDemo)
install(app)
app.mount('#app')
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>My Component Example</title>
  <link rel="stylesheet" type="text/css" href="../../../dist/mussel.css" />
  <link rel="stylesheet" type="text/css" href="../common.css" />
  <link rel="stylesheet" type="text/css" href="../../../node_modules/@tabler/icons-webfont/dist/tabler-icons-outline.css" />
</head>
<body>
  <div id="app" class="mu-root"></div>
  <script type="module" src="./main.js"></script>
</body>
</html>
```

## Vite 配置

Vite 配置文件位于 `vite.examples.config.js`:

- 自动扫描 `examples2/src/` 下的所有目录
- 为每个包含 `main.js` 的目录生成独立的构建入口
- 输出到 `examples2/dist/` 目录

## 注意事项

1. **源码位置**: 所有源码都在 `examples2/src/` 目录下
2. **构建依赖**: 构建示例前需要先构建主库 (`npm run build`)
3. **资源路径**:
   - 源码中: `../../../dist/` 和 `../../../node_modules/`
   - 构建后: `../../dist/` 和 `../../node_modules/`
4. **图标**: 使用 Tabler Icons,通过 `@tabler/icons-webfont` 引入
5. **样式**: 共享样式在 `common.css` 中,每个示例自动继承
