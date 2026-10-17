# demo watch 重建会清空 demo/dist

## 结论

`npm run demo:build`（vite build --watch）每次重建都会清空 outDir（`demo/dist`）后重写。
手工放入 `demo/dist` 的临时验证资产（测试 html、拷贝的 bundle/vue 脚本）会在下一次
src/ 或 demo/ 改动触发的重建中被静默删除，表现为：页面 serve-handler 404（`.html` 301 跳
clean URL 后 404）、脚本缺失 `Vue is not defined` / UMD factory 报
`Cannot read properties of undefined (reading 'mergeModels')`。

## 注意

- 临时资产随用随放：放好 → 立即验证 → 用完删除，中间不要再改 src 触发重建。
- 资产缺失时先 `ls demo/dist` 确认，不要怀疑 serve-handler 或端口。
- 重建本身无错误输出（watch 日志为空属正常），构建失败才会打错误。
