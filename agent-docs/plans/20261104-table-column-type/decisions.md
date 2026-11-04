# decisions

- [实施轮间] 设计修正（取代"[探索确认] list 项结构含 item.link"裁决）：list 列 link: Boolean 移到 column 级——整个 list 全 text 或全 link；item 级 link 键移除 — 用户裁决（03-human-1.md [1-1]）
- [实施轮间] 流程调整：本轮 impl 由 primary 执行（落地设计修正 + 上轮 FAIL 修复），随后轮次恢复 fast verify + fast impl — 用户裁决（03-human-1.md [1-2]）
- [实施轮间] 修复轮上限 R=2（键：整体），按"继续轮次"指令取 standard 预设 — 用户指令推定


- [设计前] 新约束：table-ex（canvas）中除 list 列外，其他列类型一律不再支持数组数据（推翻探索建议"canvas 侧 isTextPresentingColumn 数组分支保留"）— 用户裁决

- [探索确认] list 项结构 = `string | number | { label?, link?, color?, disabled?, ...任意属性 }`：label 为标准键（与 mu-tags 一致），caption 保留兼容并做开发期警告；条目对象其余属性（如 id）原样保留，cell-item-click 时 item 原样传出 — 用户裁决
- [探索确认] list link 项颜色：列级 color 缺省（primary），条目对象 color 覆盖 → `.text-{color}` — 用户裁决
- [探索确认] link→list 兼容映射：danger:true → color 'danger'，disabled 原样保留，link 对象既有 color 键激活 — 用户裁决
- [探索确认] cell-item-click payload 键名 item：`{ record, column, item }`（取代任务原文 link 键）；DOM 版不加 recordIndex，canvas 版维持现状 — 用户裁决
- [探索确认] danger 语义：text 列历史无 danger 路径，"不再接受 danger" = 不新增 danger 支持，红色用 color:'danger' 表达 — 用户默认采纳
- [探索确认] text 列数组值拒绝：compile 内门控，落占位链（与 !value 门控同式）— 用户默认采纳
- [探索确认] canvas 端 text.link：仅链色文本渲染，无 hover 下划线、无条目命中，点击仍走 cell-click — 用户默认采纳
- [流水线] link→list 转换实现层（注册表层 vs 列准备层）归设计阶段裁定 — 探索报告建议注册表层方向
- [流水线] 用户自定义流程无设计检查点停点：设计修订（R）完成后直接进入实施；探索疑问确认为本流水线唯一确认停点 — 用户流程指定
