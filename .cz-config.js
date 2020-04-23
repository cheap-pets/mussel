module.exports = {
  types: [
    {
      value: '✨',
      name: ' - 增加新的特性'
    },
    {
      value: '🐛',
      name: ' - 代码缺陷修复'
    },
    {
      value: '🔨',
      name: ' - 项目源码重构'
    },
    {
      value: '🎉',
      name: ' - 初始提交内容'
    },
    {
      value: '💄',
      name: ' - 用户界面变更'
    },
    {
      value: '✏️️️',
      name: ' - 代码格式修改'
    },
    {
      value: '📝',
      name: ' - 用户文档更新'
    },
    {
      value: '🔥',
      name: ' - 移除无用代码'
    },
    {
      value: '⏪',
      name: ' - 项目代码回滚'
    },
    {
      value: '🔀',
      name: ' - 项目分支合并'
    },
    {
      value: '✅',
      name: ' - 测试代码变更'
    },
    {
      value: '🔧',
      name: ' - 工具配置变动'
    },
    {
      value: '📦',
      name: ' - 更新目标文件'
    }
  ],

  messages: {
    type: '请选择提交内容的所属类型:',
    scope: '\n请选择提交内容的所属范围 (可选):',
    customScope: '请指明提交内容的所属范围:',
    subject: '请输入提交内容的标题:\n',
    body: '请输入提交内容的详细描述（可选，使用 “｜” 进行换行:\n',
    breaking: '任何发生了颠覆变化的内容（可选）:\n',
    footer: '任何相关的问题号，例如: #31, #34（可选）:\n',
    confirmCommit: '确认提交上述内容吗？'
  },

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],

  subjectLimit: 64
}
