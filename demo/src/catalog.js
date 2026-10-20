/**
 * Demo 全站页面清单（单一事实源）。
 *
 * 被 vite.demo.config.js（构建期：生成 input、页面标题、路径校验）
 * 与 demo 页面（运行期：首页导航、面包屑、上一页/下一页）共同引用。
 *
 * 注意：本文件是构建配置的加载期依赖，增删页面后需重启 npm run demo:build。
 */
export const catalog = [
  {
    category: 'basics',
    title: '基础元素',
    desc: '图标、徽标等基础元素',
    pages: [
      {
        path: 'basics/icon',
        title: 'Icon 图标',
        desc: 'mu-icon / mu-sort-icon / installIcons'
      },
      {
        path: 'basics/badge',
        title: 'Badge/Tags 徽标与标签',
        desc: 'MuBadge / MuTags'
      }
    ]
  },
  {
    category: 'buttons',
    title: '按钮',
    desc: '按钮、按钮组与图标按钮',
    pages: [
      {
        path: 'buttons/button',
        title: 'Button 按钮',
        desc: '类型、风格、色彩、状态与尺寸'
      },
      {
        path: 'buttons/group',
        title: 'ButtonGroup 按钮组',
        desc: 'MuButtonGroup / MuIconButton'
      }
    ]
  },
  {
    category: 'form',
    title: '表单',
    desc: '输入、选择与表单容器',
    pages: [
      {
        path: 'form/input',
        title: 'Input 输入框',
        desc: 'MuInput / MuInputGroup / MuSearchInput'
      },
      {
        path: 'form/selection',
        title: '选择控件',
        desc: 'Check / Radio / Switch / Segmented'
      },
      {
        path: 'form/select',
        title: 'Select 选择器',
        desc: 'MuSelect / MuMultiSelect / MuOption'
      },
      {
        path: 'form/combo-box',
        title: 'ComboBox 组合框',
        desc: '可编辑与远程搜索'
      },
      {
        path: 'form/color-input',
        title: 'ColorInput 颜色输入',
        desc: '色板与 HEX 输入'
      },
      {
        path: 'form/date-input',
        title: 'DateInput 日期输入',
        desc: 'date / week / month / quarter / year'
      },
      {
        path: 'form/date-range-input',
        title: 'DateRangeInput 日期范围',
        desc: '范围面板、字符串值与清空'
      },
      {
        path: 'form/time-input',
        title: 'TimeInput 时间输入',
        desc: '时 / 分 / 秒与步进'
      },
      {
        path: 'form/form',
        title: 'Form 表单',
        desc: 'MuForm / MuFormRow / MuFormField'
      }
    ]
  },
  {
    category: 'data',
    title: '数据展示',
    desc: '表格、树、列表与日历',
    pages: [
      {
        path: 'data/calendar',
        title: 'Calendar 日历',
        desc: 'mu-calendar 独立日历面板'
      },
      {
        path: 'data/table',
        title: 'Table 表格（基础）',
        desc: '列定义、样式与事件'
      },
      {
        path: 'data/table-advanced',
        title: 'Table 表格（进阶）',
        desc: '复选、固定列、自定义渲染与分页联动'
      },
      {
        path: 'data/tree',
        title: 'Tree 树（基础）',
        desc: '数据结构、图标与自定义节点'
      },
      {
        path: 'data/tree-advanced',
        title: 'Tree 树（进阶）',
        desc: '按钮、复选、菜单与懒加载'
      },
      {
        path: 'data/list',
        title: 'List 列表',
        desc: 'MuListItem / MuListDivider'
      },
      {
        path: 'data/collapse',
        title: 'Collapse 折叠面板',
        desc: 'MuCollapse / MuCollapseGroup'
      }
    ]
  },
  {
    category: 'navigation',
    title: '导航',
    desc: '标签页、菜单与分页',
    pages: [
      {
        path: 'navigation/tabs',
        title: 'Tabs 标签页',
        desc: 'MuTabs / MuTabPanel'
      },
      {
        path: 'navigation/menu',
        title: 'Menu 菜单',
        desc: '多级菜单与溢出折叠'
      },
      {
        path: 'navigation/side-menu',
        title: 'SideMenu 侧边菜单',
        desc: '折叠、收藏与 rail 模式'
      },
      {
        path: 'navigation/pagination',
        title: 'Pagination 分页',
        desc: '页码、每页条数与快速跳转'
      }
    ]
  },
  {
    category: 'feedback',
    title: '反馈',
    desc: '消息、状态块与提示',
    pages: [
      {
        path: 'feedback/message',
        title: 'Message 消息',
        desc: '$mussel.messageBox：对话框与通知'
      },
      {
        path: 'feedback/status-box',
        title: 'StatusBox 状态块',
        desc: '图标、插槽与尺寸'
      },
      {
        path: 'feedback/tooltip',
        title: 'Tooltip 提示',
        desc: 'MuTooltip / v-mu-tooltip'
      }
    ]
  },
  {
    category: 'overlay',
    title: '弹层',
    desc: '下拉菜单、右键菜单、对话框与抽屉',
    pages: [
      {
        path: 'overlay/dropdown',
        title: 'Dropdown 下拉',
        desc: 'MuDropdown / MuDropdownButton 与各类菜单项'
      },
      {
        path: 'overlay/context-menu',
        title: 'ContextMenu 右键菜单',
        desc: 'MuContextMenu 右键触发'
      },
      {
        path: 'overlay/dialog',
        title: 'Dialog 对话框',
        desc: 'MuDialog 按钮、插槽与调整尺寸'
      },
      {
        path: 'overlay/drawer',
        title: 'Drawer 抽屉',
        desc: 'MuDrawer 方向、容器与调整尺寸'
      }
    ]
  },
  {
    category: 'layout',
    title: '布局',
    desc: '布局盒、网格与滚动',
    pages: [
      {
        path: 'layout/box',
        title: 'Box 布局盒',
        desc: 'MuHBox / MuVBox 与 flex 辅助组件'
      },
      {
        path: 'layout/split-box',
        title: 'SplitBox 分割',
        desc: 'MuSplitHBox / MuSplitVBox 分隔条'
      },
      {
        path: 'layout/grid-box',
        title: 'GridBox 网格',
        desc: 'MuGridBox / MuGridCell'
      },
      {
        path: 'layout/bar',
        title: 'Bar 工具栏',
        desc: 'MuBar / MuToolbar / MuScrollArea'
      },
      {
        path: 'layout/scrollbar',
        title: 'Scrollbar 滚动',
        desc: 'MuScrollBox / v-mu-scrollbar'
      }
    ]
  },
  {
    category: 'advanced',
    title: '进阶',
    desc: '专题与综合案例',
    pages: [
      {
        path: 'advanced/gesture',
        title: 'Gesture 手势',
        desc: 'EventInterceptor：tap / press / pan'
      },
      {
        path: 'advanced/colors',
        title: '颜色系统',
        desc: '--mu-* 变量与 colors 导出'
      },
      {
        path: 'advanced/case-form',
        title: '案例：综合表单',
        desc: '表单 / 表格 / 弹窗联动场景'
      },
      {
        path: 'advanced/case-grid-designer',
        title: '案例：网格设计器',
        desc: 'grid-box 综合应用'
      }
    ]
  }
]

/**
 * 按目录顺序展平所有页面，附带分类引用与全局序号。
 */
export function flattenCatalog () {
  const result = []

  for (const category of catalog) {
    for (const page of category.pages) {
      result.push({ page, category, index: result.length })
    }
  }

  return result
}

/**
 * 按 catalog 路径查找页面，未登记时返回 null。
 */
export function findCatalogPage (path) {
  return flattenCatalog().find(item => item.page.path === path) || null
}
