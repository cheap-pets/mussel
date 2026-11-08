# demo 验证：编辑工具写入不触发 watch 重建 + 浏览器缓存旧 bundle

## 触发特征

- Edit 工具改 `demo/src` 源码后访问 demo 页，页面行为不变（执行的仍是旧 bundle）。
- dist 已重建但 playwright 仍加载旧代码（改动的代码特征在页面中不出现）。

## 根因

- demo watch（vite build --watch）对 agent 编辑工具的写入不触发重建；`touch` 源文件可触发（机制未深究）。
- demo 服务器响应无 `Cache-Control` 头（实测仅 Content-Length / Last-Modified），浏览器按启发式缓存复用旧 bundle。

## 做法

- 错误：Edit 改源码后直接访问 `http://localhost:3000/data/<name>/` 断言新行为。
- 正确：
  1. `touch demo/src/<受影响文件>`，轮询 `demo/dist/<对应产物>` mtime 变化确认重建（产物内容不变时 size 不变，勿以 size 判断）。
  2. playwright 访问 URL 加 cache-bust 查询参数（如 `?v=<时间戳>`），避免命中启发式缓存。
  3. 必要时 grep dist 产物确认新代码特征已进 bundle。

## 来源

- vite demo:build（npm run demo:build）watch 行为；响应头实测 2026-11-08（curl -I localhost:3000）。
