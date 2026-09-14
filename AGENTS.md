## 项目概况

Mussel — Vue 3 组件库。


## 重要事项

- 本项目不使用 `agent-task-report` mcp 进行上报。
- 当用户说检查或修改 skill 时，指的是项目内 ./skills 下的内容。
- 新增或修改功能时，不要使用 mussel-ui skill。
- style lint 错误，先尝试用 stylelint --fix 修复。
- 项目使用 rollup -watch 打包，并启用了 serve 在 3000 端口监听。
  使用 playwright 验证时，先尝试直接访问，不用每次执行打包。
- 没有明确要求进行仓库提交时，不要提交。



## 常用命令

```bash
npm run build:demo     # 构建 demo (watch 模式)
npm run docs:dev       # 启动 VitePress 组件文档站 (docs-site/，默认 5173 端口)
npm run docs:build     # 构建文档站静态产物
npm run pub            # 构建 + npm publish
```

无测试框架，通过 demo 页面验证组件行为。

组件演示文档位于 `docs-site/`（VitePress）：mussel 组件仅在客户端安装（`.vitepress/theme/index.mjs`），SSR 不兼容的演示需包裹 `<ClientOnly>`（如 `v-mu-*` 指令、作用域插槽演示）。


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


## 文档同步

`skills/mussel-ui/references/` 与 `docs/quick-reference_*.md` 互为同步副本（前者供 agent 使用，后者面向最终用户）。修改任一处必须同步另一处。


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
