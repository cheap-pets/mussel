# demo 页 URL 前缀 /data/

## 结论

demo 验证页实际 URL 为 `http://localhost:3000/data/<name>/`（如 `/data/canvas-table/`），非 AGENTS.md 所写 `/<name>/`；页面源码在 `demo/src/data/<name>/`，构建产物落在 serve 根的 `data/` 子目录。

## 来源

demo/vite.config.js outDir 与 demo/dist 目录结构实测（2026-10-28，`/canvas-table/` 404、`/data/canvas-table/` 200）

## 注意

AGENTS.md「常用命令」节的访问 URL 表述已过时；以本条为准。404 时先确认前缀，再查 watch 是否重建（另见 demo-watch-new-entry-restart 条目）。
