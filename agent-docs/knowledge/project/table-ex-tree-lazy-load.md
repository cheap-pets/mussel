# table-ex 树 isLeaf 懒加载协议

## 结论

- isLeaf 走 `treeProps.isLeaf` 字段名映射，缺省 `undefined` = 特性关闭（对齐 tree 组件 DEFAULT_DATA_PROPS 兼容语义）。
- 仅节点 `isLeaf === false` 且无子级时显示展开三角；toggle 必发 `tree-expand` / `tree-collapse`（载荷 `{ key, record, level }`），每次 toggle 均发、消费方自判是否加载（语义参照 tree 组件 nodeExpand/nodeCollapse）。
- 懒加载回填：向该节点 children 就地 push + `recordsVersion++`；勿整体替换 records 引用（触发 scrollTo(0,0) 闪顶）。

## 来源

src/components/table/ex/tree.js、use-tree-rows.js、table-ex.vue；demo/src/data/table-ex/main-view.vue（tree-lazy 夹具）

## 注意

已有子级的普通展开同样发 `tree-expand`；如需「仅首次懒加载」语义，消费方按 record 是否已有 children 自行过滤，组件侧不做去重。
