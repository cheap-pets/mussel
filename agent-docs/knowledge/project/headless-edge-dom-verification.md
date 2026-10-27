# headless Edge 做 DOM/控制台断言（无 playwright 时）

## 结论

会话无 playwright MCP 且项目/工作区无 playwright 安装时，用 Edge headless 替代：

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --no-first-run \
  --dump-dom --enable-logging=stderr --virtual-time-budget=8000 \
  "http://localhost:3000/__test.html" > dom.html 2> console.log
```

- stdout：JS 执行后的完整 DOM（`--virtual-time-budget` 等待脚本跑完），可 grep class/结构断言。
- stderr：`INFO:CONSOLE` 行包含 console.warn/log 原文与来源，可断言废弃警告文案。
- 页面本体放 `demo/dist/`（serve 根），脚本用 `dist/mussel.js`（dev 构建，`__env__=development`
  使 warn() 生效）+ `node_modules/vue/dist/vue.global.js`，UMD 全局名 `mussel`/`Vue`。

## 注意

- 测试页模板里用多个 `Vue.createApp(...).use(mussel).mount(...)` 隔离 install 级选项；
  库内模块级可变全局对象（历史例：已删除的 defaultSplitterOptions）会跨 app 串值，
  多 app 页断言前先确认目标状态不依赖模块级单例，否则用未设全局的独立页面。
- dump-dom 有时输出两份 DOM，grep 计数按去重理解。
- 临时资产受 demo watch 重建清空影响（见 project/demo-watch-wipes-dist）。
