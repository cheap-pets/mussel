# eslint 报错爆量 13 万：demo/dist 被拾取

## 触发特征

`npx eslint "demo/**/*.{js,vue}"`（或 `demo/`）瞬间报 130,000+ error，几乎全部来自 `demo/dist/` 构建产物；源码真实口径仅个位 error。

## 根因

项目无本地 eslint 依赖，实际用的是全局 eslint 8.57.0（standard + vue 全套插件）；`.eslintignore` 若未忽略 `demo/dist`，glob 会拾取产物。

## 做法

- 错误：直接跑 `demo/**` 并按爆量报错开修。
- 正确：`.eslintignore` 含 `demo/dist`（本项目已补）；检查口径用 `src` 与 `demo/src`；报错数异常先看文件分布再动手。

## 来源

.eslintrc / .eslintignore；agent-docs/plans/20261029-table-ex-optimize/01-explore.md 块 1
