# demo watch 运行中新增页面目录需重启构建

## 结论

新增 demo 页须两步：① 在 `demo/src/catalog.js` 登记（`path` 须以分类前缀开头，目录与 URL 一致）；② 重启 `npm run demo:build`（结束占用 :3000 端口的 node 进程再重新运行）。未登记或未重启，访问 `http://localhost:3000/data/<name>/` 404。

## 原因

`vite.demo.config.js` 从 `catalog.js` 读取登记页生成 `build.rollupOptions.input`，config 加载时一次求值；watch 只跟踪已进 input 的模块图。另有 readdirSync 扫描 demo/src 两级目录做「未登记警告」，不影响构建。

## 注意

- 判断方法：`curl -o /dev/null -w "%{http_code}" http://localhost:3000/<name>/` 返回 404 而老页面 200。
- 重启杀进程前先用 `netstat -ano | grep :3000` 确认 PID 是 demo watch（知识库另有条目：后台脚本记录的是 shell PID，须按端口定位）。
- 修改**已有** demo 页源码不受影响，watch 正常增量构建。

## 来源

vite.demo.config.js、demo/src/catalog.js
