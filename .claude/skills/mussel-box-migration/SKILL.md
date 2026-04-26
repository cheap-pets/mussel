---
name: mussel-box-migration
description: 将老版本 Mussel 的 mu-box / mu-h-box / mu-v-box 布局系统迁移到 Mussel 4 原子类。当用户代码中存在 class="mu-box"、class="mu-h-box"、class="mu-v-box"、<mu-h-box>、<mu-v-box>、<mu-box>、class="mu-flex-item"，或在 <div> 上使用 layout="flex"、padding="1x"、margin="2x"、border、position="fixed"、flex="1"、align-items="center"、gap="1x" 等 HTML 属性时使用此 skill。
---

# mu-box 布局系统迁移

Mussel 4 移除了 `.mu-box` 的所有 CSS 属性选择器样式，简化了布局组件。本 skill 指导将旧写法迁移到新的原子类系统。

## 工作流程

1. **读取参考** → 读取 `references/mapping.md`，了解完整映射规则
2. **扫描文件** → 在目标文件中搜索所有匹配模式
3. **逐个替换** → 按映射表转换，注意组合属性的拆分
4. **验证组件** → `<mu-grid-box>` / `<mu-grid-cell>` 保留但需调整属性传递方式

## 重要约束

- `<mu-h-box>` / `<mu-v-box>` **组件**已简化为纯 `<div class="flex">` / `<div class="flex flex-col">`，应替换为 `<div class="flex ...">` / `<div class="flex flex-col ...">`
- `<mu-grid-box>` / `<mu-grid-cell>` **保留为组件**，但其上非 props 的属性（`width`、`height`、`padding`、`margin`）需改为 `style` 或原子类
- 所有 `<mu-*>` 组件（不仅是 `mu-box`）上若直接使用了 `width=` / `height=` 作为 HTML 属性，且该组件未将 `width`/`height` 声明为 props（已知 `mu-drawer`、`mu-dialog` 已声明），需改为 `style="width: ..."` / `style="height: ..."`
- 所有 `<mu-*>` 组件（不仅是 `mu-box`）上的 `flex=` 属性需改为对应的 flex 原子类：`flex="1"` → `class="flex-1"`，`flex="0"` → `class="flex-none"`，`flex="auto"` / `flex="1 auto"` → `class="flex-auto"`
- `class="mu-box"` 作为纯 CSS 类已无任何样式效果，应删除
- `class="mu-space"` 已重命名为 `class="flex-spacer"`；`class="mu-divider"` 已重命名为 `class="flex-divider"`；尺寸变体改为属性选择器 `[space="Nx"]` / `[line-width="N"]`
- `flex-wrap` 旧行为额外设置 `align-items: flex-start`，迁移时如需保留需加 `items-start`

## 扫描模式

在目标文件中搜索以下模式：

**组件标签**：`<mu-box`、`<mu-h-box`、`<mu-v-box`

**CSS 类**：`class="mu-box"`、`class="mu-h-box"`、`class="mu-v-box"`、`class="mu-space"`、`class="mu-divider"`、`class="mu-flex-item"`、`class="flex-spacer"`、`class="flex-divider"`

**HTML 属性（依赖已移除的属性选择器）**：
- 布局：`layout="flex"`、`layout="grid"`、`content-center`、`flex-wrap`、`inline`、`reverse`
- 间距：`margin="`、`padding="`、`margin-x="`、`margin-y="`、`margin-top="`、`margin-bottom="`、`margin-left="`、`margin-right="`、`padding-x="`、`padding-y="`、`padding-top="`、`padding-bottom="`、`padding-left="`、`padding-right="`
- 尺寸：`width="`、`height="`
- 边框：`border`、`border-right`、`border-left`、`border-top`、`border-bottom`、`border-x`、`border-y`、`border-radius`
- 定位：`position="`
- Flex：`flex="`、`align-items="`、`align-self="`、`justify-content="`
- 间距：`gap="`
- 溢出：`overflow="`

## 参考文件

- `references/mapping.md` — 所有迁移规则的完整对照表，包含代码示例
