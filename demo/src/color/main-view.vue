<template>
  <div>
    <H2>
      COLORS
      <theme-switch />
    </H2>

    <!-- 中性色系统 -->
    <div class="group flex flex-col gap-2x">
      <h3>中性色系统 (20 级)</h3>
      <p class="section-desc">
        基于主色生成 20 级灰度色板，语义变量从色板中间跳选
      </p>

      <!-- 灰度色板 -->
      <div class="mb-16">
        <h4>灰度色板 gray (20 级)</h4>
        <div class="flex flex-wrap gap-1x">
          <template v-for="n in 20" :key="n">
            <div v-if="n === 11" style="width: 100%" />
            <div
              class="swatch"
              :class="getSwatchClass(n - 1)"
              :style="{ backgroundColor: `var(--mu-gray-${n - 1})` }">
              <span class="swatch-label abs pos-bottom" :class="n < 8 ? 'on-light' : 'on-dark'">
                --mu-gray-{{ n - 1 }}
              </span>
            </div>
          </template>
        </div>
        <div class="legend flex mt-12" style="gap: 16px">
          <span class="legend-item flex items-center" style="gap: 6px">
            <span class="legend-bar text" /> 文本色变量
          </span>
          <span class="legend-item flex items-center" style="gap: 6px">
            <span class="legend-bar border" /> 边框色变量
          </span>
          <span class="legend-item flex items-center" style="gap: 6px">
            <span class="legend-bar bg" /> 背景色变量
          </span>
        </div>
      </div>

      <!-- 语义变量映射 -->
      <div class="mb-16">
        <h4>语义变量映射</h4>
        <div class="flex flex-row" style="flex-wrap: wrap; gap: 16px;">
          <!-- 文本色 -->
          <div class="semantic-card">
            <h5>文本色</h5>
            <div class="flex flex-col" style="gap: 8px">
              <div v-for="item in textSemantics" :key="item.name" class="semantic-item flex items-center" style="flex-wrap: wrap; gap: 6px">
                <code>--mu-{{ item.name }}</code>
                <span class="semantic-arrow">→</span>
                <span class="semantic-mapping">gray-{{ item.index }}</span>
                <span class="semantic-desc">{{ item.desc }}</span>
                <span v-if="item.isNew" class="badge new">NEW</span>
              </div>
            </div>
          </div>

          <!-- 边框色 -->
          <div class="semantic-card">
            <h5>边框色</h5>
            <div class="flex flex-col" style="gap: 8px">
              <div v-for="item in borderSemantics" :key="item.name" class="semantic-item flex items-center" style="flex-wrap: wrap; gap: 6px">
                <code>--mu-{{ item.name }}</code>
                <span class="semantic-arrow">→</span>
                <span class="semantic-mapping">gray-{{ item.index }}</span>
                <span class="semantic-desc">{{ item.desc }}</span>
                <span v-if="item.isNew" class="badge new">NEW</span>
              </div>
            </div>
          </div>

          <!-- 背景色 -->
          <div class="semantic-card">
            <h5>背景色</h5>
            <div class="flex flex-col" style="gap: 8px">
              <div v-for="item in bgSemantics" :key="item.name" class="semantic-item flex items-center" style="flex-wrap: wrap; gap: 6px">
                <code>--mu-{{ item.name }}</code>
                <span class="semantic-arrow">→</span>
                <span class="semantic-mapping">
                  gray-{{ item.index }} @ {{ Math.round(item.opacity * 100) }}%
                </span>
                <span class="semantic-desc">{{ item.desc }}</span>
                <span v-if="item.isNew" class="badge new">NEW</span>
                <span v-if="item.changed" class="badge changed">CHANGED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 实际效果 -->
      <div>
        <h4>实际效果对比</h4>
        <div class="flex flex-row" style=" flex-wrap: wrap;gap: 24px;">
          <div class="demo-card light">
            <h5>亮色模式</h5>
            <div class="demo-content">
              <div v-for="item in demoTextItems" :key="item.label" class="demo-row flex items-center" style="gap: 8px; margin-bottom: 8px">
                <span class="demo-label">{{ item.label }}</span>
                <span :style="{ color: `var(--mu-${item.var})` }">{{ item.text }}</span>
              </div>
              <div class="divider" style="height: 12px" />
              <div v-for="item in demoBorderItems" :key="item.label" class="demo-row flex items-center" style="gap: 8px; margin-bottom: 8px">
                <span class="demo-label">{{ item.label }}</span>
                <div class="border-demo flex items-center" :style="{ borderColor: `var(--mu-${item.var})` }">
                  {{ item.text }}
                </div>
              </div>
              <div class="divider" style="height: 12px" />
              <div v-for="item in demoBgItems" :key="item.label" class="demo-row flex items-center" style="gap: 8px; margin-bottom: 8px">
                <span class="demo-label">{{ item.label }}</span>
                <div class="bg-demo flex items-center" :style="{ backgroundColor: `var(--mu-${item.var})` }">
                  {{ item.text }}
                </div>
              </div>
            </div>
          </div>

          <div class="demo-card dark">
            <h5>暗色模式</h5>
            <div class="demo-content">
              <div v-for="item in demoTextItems" :key="item.label" class="demo-row flex items-center" style="gap: 8px; margin-bottom: 8px">
                <span class="demo-label">{{ item.label }}</span>
                <span :style="{ color: `var(--mu-${item.var})` }">{{ item.text }}</span>
              </div>
              <div class="divider" style="height: 12px" />
              <div v-for="item in demoBorderItems" :key="item.label" class="demo-row flex items-center" style="gap: 8px; margin-bottom: 8px">
                <span class="demo-label">{{ item.label }}</span>
                <div class="border-demo flex items-center" :style="{ borderColor: `var(--mu-${item.var})` }">
                  {{ item.text }}
                </div>
              </div>
              <div class="divider" style="height: 12px" />
              <div v-for="item in demoBgItems" :key="item.label" class="demo-row flex items-center" style="gap: 8px; margin-bottom: 8px">
                <span class="demo-label">{{ item.label }}</span>
                <div class="bg-demo flex items-center" :style="{ backgroundColor: `var(--mu-${item.var})` }">
                  {{ item.text }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 基础色板 -->
    <div class="group">
      <h3>基础彩色色板</h3>
      <div class="flex flex-wrap" style="gap: 4px">
        <div
          v-for="color in baseColors"
          :key="color"
          :style="{ backgroundColor: `var(--mu-${color})`, color: '#fff' }"
          class="color-block">
          {{ color }}
        </div>
      </div>
    </div>

    <!-- 语义色 -->
    <div v-for="color in semanticColors" :key="color" class="group">
      <h3>{{ color.toUpperCase() }}</h3>
      <div class="flex flex-wrap" style="gap: 4px">
        <div
          v-for="n in 10"
          :key="n"
          :style="{
            backgroundColor: `var(--mu-${color}-color-${n - 1})`,
            color: n < 6 ? '#000' : '#fff'
          }"
          class="color-block">
          {{ color }}-{{ n - 1 }}
        </div>
        <div
          class="color-block"
          :style="{
            backgroundColor: `var(--mu-${color}-faint)`,
            color: 'var(--mu-text-color-normal)'
          }">
          faint
        </div>
        <div
          class="color-block"
          :style="{
            backgroundColor: `var(--mu-${color}-translucent)`,
            color: `var(--mu-${color}-color)`
          }">
          translucent
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import ThemeSwitch from '../common/theme-switch.vue'

  const baseColors = ['red', 'pink', 'grape', 'violet', 'indigo', 'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange']
  const semanticColors = ['primary', 'secondary', 'success', 'warning', 'danger']

  // 文本色语义映射（亮色模式）
  const textSemantics = [
    { name: 'text-color-strong', index: 18, desc: '输入框文字' },
    { name: 'text-color-normal', index: 14, desc: '正常正文' },
    { name: 'text-color-subtle', index: 10, desc: '次级正文', isNew: true },
    { name: 'text-color-soft', index: 8, desc: '标签/辅助' },
    { name: 'text-color-muted', index: 6, desc: '次要信息' }
  ]

  // 边框色语义映射（亮色模式）
  const borderSemantics = [
    { name: 'border-color-strong', index: 12, desc: '强调边框', isNew: true },
    { name: 'border-color-normal', index: 8, desc: '默认边框', isNew: true },
    { name: 'border-color-soft', index: 4, desc: '弱化边框' }
  ]

  // 背景色语义映射
  const bgSemantics = [
    { name: 'bg-strong', index: 19, opacity: 0.08, desc: '叠加背景', changed: true },
    { name: 'bg-disabled', index: 19, opacity: 0.12, desc: '禁用背景', changed: true },
    { name: 'bg-header', index: 1, opacity: 1, desc: '页眉背景', isNew: true },
    { name: 'bg-footer', index: 1, opacity: 1, desc: '页脚背景', isNew: true },
    { name: 'bg-stripe', index: 0, opacity: 1, desc: '斑马纹背景', isNew: true }
  ]

  // 被语义变量映射的索引
  const textMappedIndices = new Set([6, 8, 10, 14, 18])
  const borderMappedIndices = new Set([4, 8, 12])
  const bgMappedIndices = new Set([0, 1, 19])

  // 演示数据
  const demoTextItems = [
    { label: 'strong', var: 'text-color-strong', text: '输入框文字示例' },
    { label: 'normal', var: 'text-color-normal', text: '正常正文示例' },
    { label: 'subtle', var: 'text-color-subtle', text: '次级正文示例' },
    { label: 'soft', var: 'text-color-soft', text: '标签文字示例' },
    { label: 'muted', var: 'text-color-muted', text: '次要信息' }
  ]

  const demoBorderItems = [
    { label: 'soft', var: 'border-color-soft', text: '弱化边框' },
    { label: 'normal', var: 'border-color-normal', text: '默认边框' },
    { label: 'strong', var: 'border-color-strong', text: '强调边框' }
  ]

  const demoBgItems = [
    { label: 'bg-strong', var: 'bg-strong', text: '叠加背景' },
    { label: 'disabled', var: 'bg-disabled', text: '禁用背景' }
  ]

  // 获取色块的标记类
  function getSwatchClass (index) {
    if (textMappedIndices.has(index)) return 'is-text'
    if (borderMappedIndices.has(index)) return 'is-border'
    if (bgMappedIndices.has(index)) return 'is-bg'
    return ''
  }
</script>

<style>
  .section-desc {
    margin: 0 0 16px;
    color: var(--mu-text-color-muted);
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  .mt-12 {
    margin-top: 12px;
  }

  h4 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--mu-text-color-subtle);
  }

  /* 色块 */
  .swatch {
    position: relative;

    overflow: hidden;
    flex: 1 1 0;

    min-width: 100px;
    height: 100px;
    border: 1px solid var(--mu-border-color-soft);
    border-radius: 6px;

    text-align: center;
  }

  .swatch.is-text::after,
  .swatch.is-border::after,
  .swatch.is-bg::after {
    content: '';

    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;

    height: 2px;
  }

  .swatch.is-text::after { background: #37b24d; }
  .swatch.is-border::after { background: #f59f00; }
  .swatch.is-bg::after { background: #ae3ec9; }

  .swatch-label {
    font-family: monospace;
    font-size: 10px;
  }

  .swatch-label.on-light { color: #000; }
  .swatch-label.on-dark { color: #fff; }

  /* 图例 */
  .legend {
    font-size: 12px;
    color: var(--mu-text-color-muted);
  }

  .legend-bar {
    width: 16px;
    height: 3px;
    border-radius: 2px;
  }

  .legend-bar.text { background: #37b24d; }
  .legend-bar.border { background: #f59f00; }
  .legend-bar.bg { background: #ae3ec9; }

  /* 语义变量卡片 */
  .semantic-card {
    flex: 1;

    min-width: 200px;
    padding: 16px;
    border: 1px solid var(--mu-border-color-soft);
    border-radius: 8px;

    background: var(--mu-bg-strong);
  }

  .semantic-card > h5 {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--mu-text-color-normal);
  }

  .semantic-item {
    font-size: 12px;
  }

  .semantic-item code {
    padding: 2px 4px;
    border-radius: 3px;

    font-family: monospace;
    font-size: 11px;

    background: var(--mu-bg-strong);
  }

  .semantic-arrow {
    color: var(--mu-text-color-muted);
  }

  .semantic-mapping {
    font-family: monospace;
    color: var(--mu-text-color-subtle);
  }

  .semantic-desc {
    margin-left: auto;
    color: var(--mu-text-color-muted);
  }

  .badge {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 500;
  }

  .badge.new {
    color: var(--mu-primary-color);
    background: rgba(28, 126, 214, 0.15);
  }

  .badge.changed {
    color: var(--mu-warning-color);
    background: rgba(247, 103, 7, 0.15);
  }

  /* 实际效果卡片 */
  .demo-card {
    flex: 1;
    min-width: 280px;
    padding: 20px;
    border-radius: 12px;
  }

  .demo-card.light {
    border: 1px solid var(--mu-border-color-soft);
    color: #333;
    background: #fff;
  }

  .demo-card.dark {
    color: var(--mu-text-color-normal);
    background: var(--mu-gray-17);
  }

  .demo-card > h5 {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 500;
  }

  .demo-content {
    font-size: 13px;
  }

  .demo-label {
    flex-shrink: 0;

    width: 70px;

    font-family: monospace;
    font-size: 11px;

    opacity: 0.6;
  }

  .border-demo {
    justify-content: center;

    width: 80px;
    height: 28px;
    border-style: solid;
    border-width: 1px;
    border-radius: 4px;

    font-size: 11px;
  }

  .bg-demo {
    justify-content: center;

    width: 70px;
    height: 28px;
    border-radius: 4px;

    font-size: 11px;
  }

  /* 基础色块 */
  .color-block {
    display: inline-block;

    width: 80px;
    height: 80px;
    border-radius: 6px;

    font-size: 12px;
    line-height: 80px;
    text-align: center;
  }
</style>
