# B6 探针基线（改码前采集，起点 HEAD ee16eb4，src 含 B1-B5 已完成改动）

口径：同 B4/B5（build 序 + console 警告/错误原文序列 + 自检断言输出，归一化规则同 B4 README）+ **滚动点位**（B6 触及滚动锚定补偿路径）。

滚动点位（两次连采逐值一致）：
- 容器 `.mu-table-ex__scroll`（canvas 可滚动祖先）；scrollTop 0 → 300，400ms 后稳定值 = 300（锚定补偿未回写偏移）、再 200ms settle 仍 300
- scrollHeight = 3600206（大数据集，进窗精算触发）；canvas 956×416；clientHeight 416
- 滚动后 canvas dataURL 长度 = 62458（参考值，字体度量时序可使文本渲染像素微差，不作逐字判定项）
- 滚动后自检面板仍 241/241；滚动后 console（scrollconsole-*.norm）两次一致

改码后复采判定：scrollTop 回写链路值一致 + scrollH 一致 + 自检 241/241 + console 序列一致（同归一化规则）。
