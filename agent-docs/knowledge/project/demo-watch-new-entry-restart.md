# 新增 demo 页须登记 catalog 并重启构建

## 结论

- 新增 demo 页须两步：① 在 `demo/src/catalog.js` 登记（页面目录与 `path` 一致）；② 重启 `npm run demo:build`（结束占用 :3000 端口的 node 进程再重新运行）。未登记或未重启，访问 404。
- 页面访问地址统一见 AGENTS.md 引用的 `demo/README.md`「本地预览」节，知识库不重复维护。

## 原因

`vite.demo.config.js` 从 `catalog.js` 读取登记页生成 `build.rollupOptions.input`，config 加载时一次求值；watch 只跟踪已进 input 的模块图。另有 readdirSync 扫描 demo/src 两级目录做「未登记警告」，不影响构建。

## 注意

- 404 时先查登记/重启，再查产物是否落在 `demo/dist` 对应分类子目录。
- 重启杀进程前先用 `netstat -ano | grep :3000` 确认 PID 是 demo watch（知识库另有条目：后台脚本记录的是 shell PID，须按端口定位）。
- 修改**已有** demo 页源码不受影响，watch 正常增量构建。

## 来源

vite.demo.config.js、demo/src/catalog.js；demo/dist 目录结构实测（2026-10-28、2026-11-10）
