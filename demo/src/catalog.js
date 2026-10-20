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
