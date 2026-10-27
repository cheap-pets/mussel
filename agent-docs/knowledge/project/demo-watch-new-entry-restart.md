# demo watch 运行中新增页面目录需重启构建

## 结论

`npm run demo:build`（watch 模式）启动后才创建的 `demo/src/<name>/` 目录不会进入构建，访问 `http://localhost:3000/<name>/` 404。新增 demo 页目录后必须重启 demo:build（结束占用 :3000 端口的 node 进程再重新运行）。

## 原因

`vite.demo.config.js` 在 config 加载时用 `readdirSync(demo/src)` 一次性枚举示例目录生成 `build.rollupOptions.input`。watch 只跟踪已进 input 的模块图，config 本身不因新目录出现而重算。

## 注意

- 判断方法：`curl -o /dev/null -w "%{http_code}" http://localhost:3000/<name>/` 返回 404 而老页面 200。
- 重启杀进程前先用 `netstat -ano | grep :3000` 确认 PID 是 demo watch（serve 插件内嵌在 :3000 监听）。
- 修改**已有** demo 页源码不受影响，watch 正常增量构建。
