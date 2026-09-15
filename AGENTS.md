## 项目概况

Mussel — Vue 3 组件库。


## 项目结构

```
├── src/                  # 组件库源码
│   ├── components/       # 组件（button/、form/、table/ 等，各自含 .vue + .scss + index.js）
│   ├── styles/           # 全局样式（变量 root.scss、原子类等 .scss）
│   ├── icons/            # 图标
│   ├── langs/            # 国际化
│   ├── utils/  events/   # 工具函数 / 事件
│   └── index.js          # 库入口，统一注册
├── demo/                 # 组件验证页面（rollup watch + serve :3000）
├── docs-site/            # VitePress 组件文档站（含 guide/ 与各组件 .md）
├── docs/                 # 面向用户的速查手册（quick-reference_*.md）
├── skills/               # 项目内 skill（mussel-ui、ui-spec、upgrade-v1-to-v4）
├── agent-docs/           # agent 用的规划/知识文档
├── dist/                 # 构建产物
└── vite.config.js / vite.demo.config.js / package.json
```

组件与公共样式文档共三处，修改组件 API/用法或公共样式（原子类、变量等）时须一同更新：

- `skills/mussel-ui/references/` — agent 用参考（`components/` 分文件，`styles.md` 样式）
- `docs/quick-reference_*.md` — 用户速查手册（components / styles 两册），与上者互为同步副本
- `docs-site/` — 文档站：组件页 `components/*.md`、样式页 `guide/styles*.md`


## 重要事项

- 本项目不使用 `agent-task-report` mcp 进行上报。
- 当用户说检查或修改 skill 时，指的是项目内 ./skills 下的内容。
- 新增或修改功能时，不要使用 mussel-ui skill。
- style lint 错误，先尝试用 stylelint --fix 修复。
- 开发时，项目使用 rollup 的 watch 模式打包，并启用了 3000 端口监听的站点服务。
  使用 playwright 验证时，先尝试直接访问，不用每次执行打包。
- 没有明确要求进行仓库提交时，不要提交。



## 常用命令

```bash
npm run build           # 构建库（dev + prod 两次 vite build，产出 dist/）
npm run demo:build     # 构建 demo (watch 模式)
npm run docs:dev       # 启动 VitePress 组件文档站 (docs-site/，默认 5173 端口)
npm run docs:build     # 构建文档站静态产物
npm run pub            # 构建 + npm publish
```

无测试框架，通过 demo 页面验证组件行为。demo 页面按 `demo/src/<name>/` 组织（`main-view.vue` + `main.js`），访问 `http://localhost:3000/<name>/`。


## 代码约定

- 纯 JavaScript（无 TypeScript）
- Vue 组件采用 Composition API `<script setup>` 写法。
- 组件名：`Mu` 前缀 kebab-case 注册（`MuButton` → `<mu-button>`），内部名 `MusselXxx`
- 组件目录：`src/components/<name>/`，含 `xxx.vue` + `xxx.scss`（就近 import）+ `index.js`，经 `src/components/index.js` 统一注册
- CSS：BEM、`mu-` 前缀（`mu-button--primary`、`mu-form-field__label`）
- 颜色/间距/z-index 一律 `--mu-*` 变量，禁硬编码
- 暗色模式：`.mu-root.mu-dark` 覆盖变量
- `root.scss` 编译时经 `vite.config.js` 注入 `$colors` map
- Path alias：`@` → `src/`；`~icons` → `node_modules/@tabler/icons/icons`
- 构建：UMD 输出，Vue 为外部依赖
- 文档站中 mussel 组件仅在客户端安装（`.vitepress/theme/index.mjs`），SSR 不兼容的演示需包裹 `<ClientOnly>`（如 `v-mu-*` 指令、作用域插槽演示）



## Commit 规范

格式 `<emoji>: <描述>`，subject ≤ 80 字符，跳过 scope 和 body：

| Emoji | 类型 |
|-------|------|
| ✨ | feat |
| 🐛 | fix |
| 🔨 | refactor |
| 💄 | style |
| 📝 | docs |
| 🔧 | chore |
| 🔥 | clean |
