# B5 探针基线（改码前采集，起点 HEAD ee16eb4，src 含 B1-B4 已完成改动）

口径：02-design「每批验证组合」B4（T2）——demo 控制台警告/错误原文序列 + npm run build 构建序 + 自检断言输出；同口径连采两次，剔除非语义漂移后 diff 为空。

采集与归一化规则（改码后复采同口径比对）：
- build-1/2.txt：`npm run build` 完整输出，剔除 `built in`（耗时）与 `npm warn` 行。两次 diff 为空。
- console-1/2.txt：demo 页加载后控制台 warning+error 原文序列（playwright console_messages）。归一化：13 位以上数字串→<TS>（自检冷键随机时间戳）、bundle 行号 `main.js:NNN`/`catalog.js:NNN`→`:<L>`。两次 diff 为空。
- selfcheck-1/2.txt：自检面板 241 条断言文本（DOM li 提取）。归一化后两次 diff 除以下 3 处字体度量时序漂移外为空（列明漂移）：
  - L14 LRU 淘汰重算 measure 计数（47/47 vs 42/42，字体缓存预热时序）
  - L137 CJK 文本锚 font 实测值（13.168px vs 13.8787px，fonts loaded 时序）
  - L164 iconfont 字形墨迹实测值（19.9001/21.3391 vs 19.4896/21.7539，同上）
  改码后复采的判定口径：断言主体文本一致 + summary 241/241 + 漂移仅限上述三类模式。
- head.txt：批次起点 HEAD ee16eb4。
- 补记（改码后比对时确认）：文本锚缓存条目的 `y 恒 24/25` 整数同为该条 font 实测漂移的伴生取整（y = 空白中点 ± 墨迹半差取整，随 fonts loaded 时序），归一化规则含 `y 恒 <N>`（仅限「文本锚缓存」条目行）。
