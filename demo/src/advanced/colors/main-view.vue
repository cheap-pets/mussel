<template>
  <demo-page path="advanced/colors">
    <demo-section
      title="灰度色板"
      note="基于主色生成 20 级灰度（--mu-gray-0 ~ 19）；色块底边标记语义变量跳选的索引：绿=文本色、黄=边框色、紫=背景色"
      vertical>
      <div class="demo-row demo-row--wrap">
        <template v-for="n in 20" :key="n">
          <div v-if="n === 11" class="demo-break" />
          <div
            class="color-swatch"
            :class="getSwatchClass(n - 1)"
            :style="{ backgroundColor: `var(--mu-gray-${n - 1})` }">
            <span class="color-swatch__label" :class="n < 8 ? 'on-light' : 'on-dark'">
              --mu-gray-{{ n - 1 }}
            </span>
          </div>
        </template>
      </div>
      <div class="color-legend">
        <span class="color-legend__item"><span class="color-legend__bar color-legend__bar--text" /> 文本色变量</span>
        <span class="color-legend__item"><span class="color-legend__bar color-legend__bar--border" /> 边框色变量</span>
        <span class="color-legend__item"><span class="color-legend__bar color-legend__bar--bg" /> 背景色变量</span>
      </div>
    </demo-section>

    <demo-section
      title="语义变量映射"
      note="文本色 / 边框色 / 背景色语义变量从灰度色板中间跳选；NEW / CHANGED 标记 v4 相对 v3 的变更">
      <div class="demo-row demo-row--wrap demo-row--stretch">
        <div
          v-for="group in semanticGroups"
          :key="group.title"
          class="semantic-card">
          <h5>{{ group.title }}</h5>
          <div class="semantic-card__list">
            <div v-for="item in group.items" :key="item.name" class="semantic-item">
              <code>--mu-{{ item.name }}</code>
              <span class="semantic-item__arrow">→</span>
              <span class="semantic-item__mapping">
                gray-{{ item.index }}<template v-if="item.opacity"> @ {{ Math.round(item.opacity * 100) }}%</template>
              </span>
              <span class="semantic-item__desc">{{ item.desc }}</span>
              <span v-if="item.isNew" class="semantic-badge semantic-badge--new">NEW</span>
              <span v-if="item.changed" class="semantic-badge semantic-badge--changed">CHANGED</span>
            </div>
          </div>
        </div>
      </div>
    </demo-section>

    <demo-section
      title="亮暗模式对比"
      note="左侧固定亮色、右侧固定暗色背景；切换右上角主题开关后页面其余区域跟随变化，语义变量自动映射到对应灰度">
      <div class="demo-row demo-row--wrap">
        <div
          v-for="mode in ['light', 'dark']"
          :key="mode"
          class="mode-card"
          :class="`mode-card--${mode}`">
          <h5>{{ mode === 'light' ? '亮色模式' : '暗色模式' }}</h5>
          <div
            v-for="item in demoItems"
            :key="item.label"
            class="mode-card__row">
            <span class="mode-card__label">{{ item.label }}</span>
            <span :style="{ color: `var(--mu-${item.var})` }">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </demo-section>

    <demo-section
      title="基础彩色色板"
      note="12 个基础色相（--mu-red ~ --mu-orange），每个色相另有 -color-0 ~ 9 十级色阶">
      <div class="demo-row demo-row--wrap">
        <div
          v-for="color in baseColors"
          :key="color"
          class="color-block"
          :style="{ backgroundColor: `var(--mu-${color})` }">
          {{ color }}
        </div>
      </div>
    </demo-section>

    <demo-section
      title="语义色阶"
      note="5 个语义色（primary/secondary/success/warning/danger）各 10 级色阶，另有 faint（极淡背景）与 translucent（半透明）变体">
      <div v-for="color in semanticColors" :key="color" class="semantic-color-group">
        <h5>{{ color }}</h5>
        <div class="demo-row demo-row--wrap">
          <div
            v-for="n in 10"
            :key="n"
            class="color-block color-block--sm"
            :style="{
              backgroundColor: `var(--mu-${color}-color-${n - 1})`,
              color: n < 6 ? '#000' : '#fff'
            }">
            {{ n - 1 }}
          </div>
          <div
            class="color-block color-block--sm"
            :style="{ backgroundColor: `var(--mu-${color}-faint)`, color: 'var(--mu-text-color-normal)' }">
            faint
          </div>
          <div
            class="color-block color-block--sm"
            :style="{ backgroundColor: `var(--mu-${color}-translucent)`, color: `var(--mu-${color}-color)` }">
            translucent
          </div>
        </div>
      </div>
    </demo-section>

    <demo-section
      title="colors 导出与暗色模式"
      note="import { colors } from 'mussel' 获取色值集合；暗色模式由 .mu-root.mu-dark 覆盖 --mu-* 变量实现，组件与业务样式引用变量即可自动适配">
      <div class="demo-row demo-row--wrap">
        <mu-button caption="打印 colors 导出" @click="logColors" />
        <mu-button caption="切换暗色模式" @click="toggleDark" />
        <span class="demo-log">colors 导出内容见控制台；暗色 = body.mu-dark（theme-switch 同机制）</span>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { colors } from 'mussel'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const baseColors = ['red', 'pink', 'grape', 'violet', 'indigo', 'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange']
  const semanticColors = ['primary', 'secondary', 'success', 'warning', 'danger']

  const semanticGroups = [
    {
      title: '文本色',
      items: [
        { name: 'text-color-strong', index: 18, desc: '输入框文字' },
        { name: 'text-color-normal', index: 14, desc: '正常正文' },
        { name: 'text-color-subtle', index: 10, desc: '次级正文', isNew: true },
        { name: 'text-color-soft', index: 8, desc: '标签/辅助' },
        { name: 'text-color-muted', index: 6, desc: '次要信息' }
      ]
    },
    {
      title: '边框色',
      items: [
        { name: 'border-color-strong', index: 12, desc: '强调边框', isNew: true },
        { name: 'border-color-normal', index: 8, desc: '默认边框', isNew: true },
        { name: 'border-color-soft', index: 4, desc: '弱化边框' }
      ]
    },
    {
      title: '背景色',
      items: [
        { name: 'bg-strong', index: 19, opacity: 0.08, desc: '叠加背景', changed: true },
        { name: 'bg-disabled', index: 19, opacity: 0.12, desc: '禁用背景', changed: true },
        { name: 'bg-header', index: 1, opacity: 1, desc: '页眉背景', isNew: true },
        { name: 'bg-footer', index: 1, opacity: 1, desc: '页脚背景', isNew: true },
        { name: 'bg-stripe', index: 0, opacity: 1, desc: '斑马纹背景', isNew: true }
      ]
    }
  ]

  const demoItems = [
    { label: 'strong', var: 'text-color-strong', text: '输入框文字示例' },
    { label: 'normal', var: 'text-color-normal', text: '正常正文示例' },
    { label: 'subtle', var: 'text-color-subtle', text: '次级正文示例' },
    { label: 'soft', var: 'text-color-soft', text: '标签文字示例' },
    { label: 'muted', var: 'text-color-muted', text: '次要信息' }
  ]

  const textMappedIndices = new Set([6, 8, 10, 14, 18])
  const borderMappedIndices = new Set([4, 8, 12])
  const bgMappedIndices = new Set([0, 1, 19])

  function getSwatchClass (index) {
    if (textMappedIndices.has(index)) return 'is-text'
    if (borderMappedIndices.has(index)) return 'is-border'
    if (bgMappedIndices.has(index)) return 'is-bg'
    return ''
  }

  function logColors () {
    console.log('mussel colors export:', colors)
  }

  function toggleDark () {
    document.body.classList.toggle('mu-dark')
  }
</script>

<style>
  .demo-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .demo-row--wrap {
    flex-wrap: wrap;
  }

  .demo-row--stretch {
    align-items: stretch;
  }

  .demo-break {
    width: 100%;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .color-swatch {
    position: relative;
    overflow: hidden;
    flex: 1 1 0;
    min-width: 100px;
    height: 80px;
    border: 1px solid var(--mu-border-color-soft);
    border-radius: 6px;
    text-align: center;
  }

  .color-swatch.is-text::after,
  .color-swatch.is-border::after,
  .color-swatch.is-bg::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 3px;
  }

  .color-swatch.is-text::after { background: var(--mu-success-color, #37b24d); }
  .color-swatch.is-border::after { background: var(--mu-warning-color, #f59f00); }
  .color-swatch.is-bg::after { background: var(--mu-secondary-color, #ae3ec9); }

  .color-swatch__label {
    font-family: monospace;
    font-size: 10px;
  }

  .color-swatch__label.on-light { color: #000; }
  .color-swatch__label.on-dark { color: #fff; }

  .color-legend {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    color: var(--mu-text-color-muted);
    font-size: 12px;
  }

  .color-legend__item {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .color-legend__bar {
    width: 16px;
    height: 3px;
    border-radius: 2px;
  }

  .color-legend__bar--text { background: var(--mu-success-color, #37b24d); }
  .color-legend__bar--border { background: var(--mu-warning-color, #f59f00); }
  .color-legend__bar--bg { background: var(--mu-secondary-color, #ae3ec9); }

  .semantic-card {
    flex: 1;
    min-width: 240px;
    padding: 16px;
    border: 1px solid var(--mu-border-color-soft);
    border-radius: 8px;
    background: var(--mu-bg-strong);
  }

  .semantic-card h5 {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--mu-text-color-normal);
  }

  .semantic-card__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .semantic-item {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 12px;
  }

  .semantic-item code {
    padding: 2px 4px;
    border-radius: 3px;
    background: var(--mu-bg-fill);
    font-family: monospace;
    font-size: 11px;
  }

  .semantic-item__arrow {
    color: var(--mu-text-color-muted);
  }

  .semantic-item__mapping {
    font-family: monospace;
    color: var(--mu-text-color-subtle);
  }

  .semantic-item__desc {
    margin-left: auto;
    color: var(--mu-text-color-muted);
  }

  .semantic-badge {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 500;
  }

  .semantic-badge--new {
    color: var(--mu-primary-color);
    background: var(--mu-primary-faint, rgba(28, 126, 214, 0.15));
  }

  .semantic-badge--changed {
    color: var(--mu-warning-color);
    background: var(--mu-warning-faint, rgba(247, 103, 7, 0.15));
  }

  .mode-card {
    flex: 1;
    min-width: 280px;
    padding: 20px;
    border-radius: 12px;
  }

  .mode-card--light {
    border: 1px solid var(--mu-border-color-soft);
    color: #333;
    background: #fff;
  }

  .mode-card--dark {
    color: var(--mu-text-color-normal);
    background: var(--mu-gray-17);
  }

  .mode-card h5 {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 500;
  }

  .mode-card__row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .mode-card__label {
    flex-shrink: 0;
    width: 70px;
    font-family: monospace;
    font-size: 11px;
    opacity: 0.6;
  }

  .color-block {
    display: inline-block;
    width: 80px;
    height: 80px;
    border-radius: 6px;
    color: var(--mu-text-color-inverse, #fff);
    font-size: 12px;
    line-height: 80px;
    text-align: center;
  }

  .color-block--sm {
    width: 64px;
    height: 48px;
    line-height: 48px;
  }

  .semantic-color-group h5 {
    margin: 12px 0 8px;
    color: var(--mu-text-color-subtle);
    font-size: 13px;
    font-weight: 500;
  }
</style>
