import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitepress'
import { optimize } from 'svgo'

import { colors } from '../../src/colors.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

// 与 vite.demo.config.js 一致：root.scss 编译时注入 $colors map
const colorMaps =
  '$colors: (\n' +
  Object
    .entries(colors)
    .map(([key, value]) => `  "${key}": ${value},`)
    .join('\n') +
  '\n);'

// 与 vite.demo.config.js 一致：svg 以字符串形式导入（mussel 图标依赖）
function pluginSvg () {
  return {
    name: 'svg-plugin',
    enforce: 'pre',
    load (id) {
      if (id.endsWith('.svg')) {
        const content = readFileSync(id, 'utf-8')

        return `export default ${JSON.stringify(optimize(content).data)}`
      }
    }
  }
}

export default defineConfig({
  base: '/mussel/',
  lang: 'zh-CN',
  title: 'Mussel',
  description: 'Mussel — UI Library for Vue@3',

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/install', activeMatch: '/guide/' },
      { text: '组件', link: '/components/icon', activeMatch: '/components/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/install' },
            { text: '设计原则', link: '/guide/principles' }
          ]
        },
        {
          text: '样式',
          items: [
            { text: '样式总览', link: '/guide/styles' },
            { text: '颜色', link: '/guide/styles-colors' },
            { text: '字体与文本', link: '/guide/styles-typography' },
            { text: '间距与尺寸', link: '/guide/styles-spacing' },
            { text: '布局与层级', link: '/guide/styles-layout' },
            { text: '边框、圆角与阴影', link: '/guide/styles-surface' },
            { text: '常用布局模式', link: '/guide/styles-patterns' }
          ]
        }
      ],
      '/components/': [
        {
          text: '基础',
          items: [
            { text: '图标 MuIcon', link: '/components/icon' },
            { text: '徽章 MuBadge', link: '/components/badge' },
            { text: '排序图标 MuSortIcon', link: '/components/sort-icon' }
          ]
        },
        {
          text: '按钮',
          items: [
            { text: '按钮 MuButton', link: '/components/button' },
            { text: '按钮组 MuButtonGroup', link: '/components/button-group' },
            { text: '图标按钮 MuIconButton', link: '/components/icon-button' }
          ]
        },
        {
          text: '布局',
          items: [
            { text: '弹性容器 MuHBox / MuVBox', link: '/components/box' },
            { text: '网格布局 MuGridBox', link: '/components/grid-box' },
            { text: '分割容器 MuSplitHBox / MuSplitVBox', link: '/components/split-box' },
            { text: '滚动容器 MuScrollBox', link: '/components/scroll-box' },
            { text: '单轴滚动区 MuScrollArea', link: '/components/scroll-area' },
            { text: '工具栏 MuToolbar', link: '/components/toolbar' },
            { text: '条形容器 MuBar', link: '/components/bar' },
            { text: 'Flex 辅助组件', link: '/components/flex-helpers' }
          ]
        },
        {
          text: '表单',
          items: [
            { text: '表单 MuForm', link: '/components/form' },
            { text: '表单字段 MuFormField', link: '/components/form-field' },
            { text: '输入框 MuInput', link: '/components/input' },
            { text: '搜索输入框 MuSearchInput', link: '/components/search-input' },
            { text: '输入组 MuInputGroup', link: '/components/input-group' },
            { text: '下拉选择 MuSelect', link: '/components/select' },
            { text: '组合输入 MuComboBox', link: '/components/combo-box' },
            { text: '多选下拉 MuMultiSelect', link: '/components/multi-select' },
            { text: '复选 MuCheck / MuCheckGroup', link: '/components/check' },
            { text: '单选 MuRadio / MuRadioGroup', link: '/components/radio' },
            { text: '分段控件 MuSegmented', link: '/components/segmented' },
            { text: '开关 MuSwitch', link: '/components/switch' },
            { text: '日期选择 MuDateInput', link: '/components/date-input' },
            { text: '日期区间 MuDateRangeInput', link: '/components/date-range-input' },
            { text: '时间选择 MuTimeInput', link: '/components/time-input' },
            { text: '月历 MuCalendar', link: '/components/calendar' },
            { text: '颜色选择 MuColorInput', link: '/components/color-input' }
          ]
        },
        {
          text: '导航与容器',
          items: [
            { text: '下拉 MuDropdown', link: '/components/dropdown' },
            { text: '下拉按钮 MuDropdownButton', link: '/components/dropdown-button' },
            { text: '下拉面板 MuDropdownPanel', link: '/components/dropdown-panel' },
            { text: '下拉项 MuDropdownItem', link: '/components/dropdown-item' },
            { text: '右键菜单 MuContextMenu', link: '/components/context-menu' },
            { text: '页签 MuTabs', link: '/components/tabs' },
            { text: '页签栏 MuTabBar', link: '/components/tab-bar' },
            { text: '对话框 MuDialog', link: '/components/dialog' },
            { text: '抽屉 MuDrawer', link: '/components/drawer' }
          ]
        },
        {
          text: '反馈与数据',
          items: [
            { text: '文字提示 MuTooltip', link: '/components/tooltip' },
            { text: '消息对话框 MessageBox', link: '/components/message-box' },
            { text: '浮动通知 Notifier', link: '/components/notifier' },
            { text: '状态占位 MuStatusBox', link: '/components/status-box' },
            { text: '表格 MuTable', link: '/components/table' },
            { text: '分页 MuPagination', link: '/components/pagination' },
            { text: '树 MuTree', link: '/components/tree' },
            { text: '标签组 MuTags', link: '/components/tags' },
            { text: '列表项 MuListItem', link: '/components/list-item' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cheap-pets/mussel' }
    ],

    outline: [2, 3],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除查询条件',
            displayDetails: '显示详细列表',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },

    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单'
  },

  vite: {
    define: {
      __version__: JSON.stringify('dev'),
      __env__: '"development"'
    },
    resolve: {
      alias: {
        mussel: resolve(rootDir, 'src/index.js'),
        '@': resolve(rootDir, 'src'),
        '~icons': resolve(rootDir, 'node_modules/@tabler/icons/icons')
      }
    },
    plugins: [pluginSvg()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: (source, filepath) => {
            return filepath.includes('root.scss')
              ? `@use "sass:map";\n${colorMaps}\n${source}`
              : source
          }
        }
      }
    }
  }
})
